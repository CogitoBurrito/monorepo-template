import { env } from "cloudflare:workers";

import type { ArtifactMetadata, ArtifactSaveInput } from "./types";

/**
 * Storage key of an artifact: the team scope followed by the
 * content-addressable hash. Unscoped requests (no `teamId`/`slug`) use the
 * bare hash as the key.
 */
function artifactKey(team: string, hash: string) {
  return team === "" ? hash : `${team}/${hash}`;
}

/**
 * The `TURBOREPO_REMOTE_CACHE` R2 bucket binding from the worker environment.
 *
 * Resolved lazily: the `env` proxy only yields its bindings inside the worker
 * request context.
 */
function bucket() {
  return env.TURBOREPO_REMOTE_CACHE;
}

/**
 * Reads the artifact metadata out of an R2 object's custom metadata.
 *
 * Only well-typed entries are picked up; anything missing or malformed
 * falls back to being absent from the result.
 */
function readMetadata(source: Record<string, string>) {
  const duration = source["x-artifact-duration"];
  const dirtyHash = source["x-artifact-dirty-hash"];
  const sha = source["x-artifact-sha"];
  const tag = source["x-artifact-tag"];
  return {
    ...(dirtyHash !== undefined && { dirtyHash }),
    ...(duration !== undefined && { duration: Number(duration) }),
    ...(sha !== undefined && { sha }),
    ...(tag !== undefined && { tag }),
  };
}

/**
 * Loads an artifact summary through the cheap `head` shortcut: metadata
 * and size, without downloading the body.
 */
async function readSummary(team: string, hash: string) {
  const object = await bucket().head(artifactKey(team, hash));
  if (object === null) {
    return;
  }
  return { ...readMetadata(object.customMetadata ?? {}), size: object.size };
}

/**
 * Writes the artifact metadata into the string-only custom metadata of an
 * R2 object.
 */
function writeMetadata(metadata: ArtifactMetadata) {
  return {
    ...(metadata.dirtyHash !== undefined && {
      "x-artifact-dirty-hash": metadata.dirtyHash,
    }),
    ...(metadata.duration !== undefined && {
      "x-artifact-duration": String(metadata.duration),
    }),
    ...(metadata.sha !== undefined && { "x-artifact-sha": metadata.sha }),
    ...(metadata.tag !== undefined && { "x-artifact-tag": metadata.tag }),
  };
}

/**
 * The shared artifact repository, backed by the worker's
 * `TURBOREPO_REMOTE_CACHE` R2 binding.
 *
 * The artifact body and its metadata live on a single R2 object keyed
 * `{team}/{hash}` (unscoped artifacts use the bare hash): the body is the
 * object value and the upload-time headers are stored as the object's
 * custom metadata. `Content-Length` needs no storage at all — it is
 * reported from `object.size` on read. The binding is resolved lazily, so
 * the repo can be created outside of a request context.
 */
export const artifactRepo = {
  find: async (team: string, hash: string) => {
    const object = await bucket().get(artifactKey(team, hash));
    if (object === null) {
      return;
    }
    return {
      ...readMetadata(object.customMetadata ?? {}),
      body: new Uint8Array(await object.arrayBuffer()),
      size: object.size,
    };
  },
  findSummaries: async (team: string, hashes: readonly string[]) => {
    const summaries = await Promise.all(
      hashes.map((hash) => readSummary(team, hash)),
    );
    return Object.fromEntries(
      hashes.map((hash, index) => [hash, summaries[index]] as const),
    );
  },
  findSummary: (team: string, hash: string) => {
    return readSummary(team, hash);
  },
  save: async (team: string, hash: string, input: ArtifactSaveInput) => {
    await bucket().put(artifactKey(team, hash), input.body, {
      customMetadata: writeMetadata(input.metadata),
    });
  },
};
