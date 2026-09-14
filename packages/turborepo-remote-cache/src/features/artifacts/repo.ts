import { createStorage } from "unstorage";
import cloudflareR2BindingDriver from "unstorage/drivers/cloudflare-r2-binding";

/**
 * New artifact row to persist — the DB row shape, not what the client sends.
 */
export type ArtifactInsert = {
  readonly body: Uint8Array<ArrayBuffer>;
  readonly metadata: ArtifactMetadata;
};

/**
 * Metadata stored alongside an artifact, derived from the upload headers.
 *
 * Every field is optional; the values are echoed back as response headers
 * when the artifact is downloaded or queried.
 */
export type ArtifactMetadata = {
  readonly dirtyHash?: string;
  readonly duration?: number;
  readonly sha?: string;
  readonly tag?: string;
};

/**
 * Map of queried hashes to their summary, or `undefined` when not found.
 */
export type ArtifactQueryResult = Record<string, ArtifactSummary | undefined>;

/**
 * Full artifact record including the gzip tarball body.
 */
export type ArtifactRecord = ArtifactSummary & {
  readonly body: Uint8Array<ArrayBuffer>;
};

/**
 * Storage boundary for cache artifacts — the only place storage queries
 * live. Argument types match the stored row shape (`{team}/{hash}` keys);
 * never let this layer call the service.
 */
export type ArtifactRepo = {
  readonly find: (
    team: string,
    hash: string,
  ) => Promise<ArtifactRecord | undefined>;
  readonly findSummaries: (
    team: string,
    hashes: readonly string[],
  ) => Promise<ArtifactQueryResult>;
  readonly findSummary: (
    team: string,
    hash: string,
  ) => Promise<ArtifactSummary | undefined>;
  readonly save: (
    team: string,
    hash: string,
    insert: ArtifactInsert,
  ) => Promise<void>;
};

/**
 * Artifact summary without the body — returned by `findSummary` and
 * `findSummaries`.
 */
export type ArtifactSummary = ArtifactMetadata & {
  readonly size: number;
};

/**
 * Creates an R2-backed artifact repo through unstorage.
 *
 * The artifact body is stored raw (byte-exact gzip tarball) under
 * `{team}/{hash}` and its metadata is stored as the sibling
 * `{team}/{hash}.meta.json` key.
 */
export function createArtifactRepo(binding: R2Bucket): ArtifactRepo {
  const storage = createStorage({
    driver: cloudflareR2BindingDriver({ binding }),
  });

  const readBody = async (team: string, hash: string) => {
    const raw =
      (await storage.getItemRaw<Uint8Array<ArrayBuffer>>(
        bodyKey(team, hash),
      )) ?? undefined;

    return raw as Uint8Array<ArrayBuffer> | undefined;
  };

  const readMetadata = async (team: string, hash: string) => {
    const raw = (await storage.getItem(metaKey(team, hash))) ?? undefined;

    return parseMetadata(raw) as ArtifactMetadata;
  };

  const find = async (team: string, hash: string) => {
    const body = await readBody(team, hash);

    if (body === undefined) {
      return;
    }

    return { ...(await readMetadata(team, hash)), body, size: body.byteLength };
  };

  const findSummary = async (team: string, hash: string) => {
    const body = await readBody(team, hash);

    if (body === undefined) {
      return;
    }

    return {
      ...(await readMetadata(team, hash)),
      size: body.byteLength,
    };
  };

  return {
    find,
    findSummaries: async (team, hashes) => {
      const summaries = await Promise.all(
        hashes.map((hash) => findSummary(team, hash)),
      );

      return Object.fromEntries(
        hashes.map((hash, index) => [hash, summaries[index]]),
      ) as ArtifactQueryResult;
    },
    findSummary,
    save: async (team, hash, insert) => {
      await storage.setItemRaw(bodyKey(team, hash), insert.body);
      await storage.setItem(metaKey(team, hash), insert.metadata);
    },
  };
}

/**
 * Storage key of an artifact body: `{team}/{hash}`.
 */
function bodyKey(team: string, hash: string) {
  return `${team}/${hash}`;
}

/**
 * Storage key of an artifact's metadata: `{team}/{hash}.meta.json`.
 */
function metaKey(team: string, hash: string) {
  return `${team}/${hash}.meta.json`;
}

/**
 * Narrow an unknown stored value down to the artifact metadata shape.
 *
 * Values written by this repo are `ArtifactMetadata` objects; anything
 * else (or a missing entry) falls back to empty metadata.
 */
function parseMetadata(value: unknown) {
  if (typeof value !== "object" || value === null) {
    return {};
  }

  const record = value as Partial<ArtifactMetadata>;

  return {
    ...(typeof record.dirtyHash === "string" && {
      dirtyHash: record.dirtyHash,
    }),
    ...(typeof record.duration === "number" && { duration: record.duration }),
    ...(typeof record.sha === "string" && { sha: record.sha }),
    ...(typeof record.tag === "string" && { tag: record.tag }),
  };
}
