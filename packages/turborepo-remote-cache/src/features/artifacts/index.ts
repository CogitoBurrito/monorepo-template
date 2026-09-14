import type { Context } from "hono";

import { Hono } from "hono";

import type { TeamQuery, UploadHeaders } from "./schema";
import type { ArtifactSummary } from "./types";

import { errorBody } from "../../errors";
import {
  validateArtifactHash,
  validateArtifactQuery,
  validateCacheEvents,
  validateClientHeaders,
  validateTeamQuery,
  validateUploadHeaders,
} from "./schema";
import { artifactService } from "./service";

const artifactNotFoundCode = "ARTIFACT_NOT_FOUND";

/**
 * Builds the `ArtifactNotFound` error response required by the spec.
 */
function artifactNotFound(c: Context, hash: string) {
  return c.json(
    errorBody(artifactNotFoundCode, `Artifact not found: ${hash}`),
    404,
  );
}

/**
 * Picks the artifact metadata out of the validated upload headers.
 */
function extractMetadata(headers: UploadHeaders) {
  return {
    ...(headers["x-artifact-dirty-hash"] !== undefined && {
      dirtyHash: headers["x-artifact-dirty-hash"],
    }),
    ...(headers["x-artifact-duration"] !== undefined && {
      duration: headers["x-artifact-duration"],
    }),
    ...(headers["x-artifact-sha"] !== undefined && {
      sha: headers["x-artifact-sha"],
    }),
    ...(headers["x-artifact-tag"] !== undefined && {
      tag: headers["x-artifact-tag"],
    }),
  };
}

/**
 * Response headers echoing stored artifact metadata, as required by the
 * spec for `HEAD` and `GET /artifacts/{hash}`.
 */
function metadataHeaders(summary: ArtifactSummary) {
  return {
    ...(summary.dirtyHash !== undefined && {
      "x-artifact-dirty-hash": summary.dirtyHash,
    }),
    ...(summary.duration !== undefined && {
      "x-artifact-duration": String(summary.duration),
    }),
    ...(summary.sha !== undefined && { "x-artifact-sha": summary.sha }),
    ...(summary.tag !== undefined && { "x-artifact-tag": summary.tag }),
  };
}

/**
 * Resolves the team scope used as the storage namespace: `teamId` wins
 * over `slug`; unscoped requests use an empty string.
 */
function resolveTeam(query: TeamQuery) {
  return query.teamId ?? query.slug ?? "";
}

/**
 * JSON `null` for `POST /artifacts` — the spec's `ArtifactQueryResponse`
 * maps missing artifacts to `null`, and the project convention replaces the
 * forbidden `null` literal with `JSON.parse("null")`.
 */
const jsonNull = JSON.parse("null") as null;

/**
 * The artifacts sub-app — route definitions, validation
 * integration, and service calls. Paths are relative; the `/artifacts`
 * prefix is managed at mount time in `src/index.ts`.
 */

const app = new Hono();
export const artifacts = app
  .get("/status", validateTeamQuery, (c) => {
    return c.json({ status: "enabled" });
  })
  .get(
    "/:hash",
    validateArtifactHash,
    validateTeamQuery,
    validateClientHeaders,
    async (c) => {
      const { hash } = c.req.valid("param");
      const team = resolveTeam(c.req.valid("query"));

      // Hono dispatches `HEAD` requests through the `GET` route (the raw
      // request still carries the original method), so the existence
      // check is short-circuited here with the cheap summary lookup — no
      // artifact body is ever fetched.
      if (c.req.method === "HEAD") {
        const summary = await artifactService.summary(team, hash);
        if (summary === undefined) {
          return artifactNotFound(c, hash);
        }
        return c.body("", 200, {
          "content-length": String(summary.size),
          ...metadataHeaders(summary),
        });
      }

      const artifact = await artifactService.download(team, hash);
      if (artifact === undefined) {
        return artifactNotFound(c, hash);
      }
      return c.body(artifact.body, 200, {
        "content-length": String(artifact.size),
        ...metadataHeaders(artifact),
      });
    },
  )
  .post("/", validateArtifactQuery, validateTeamQuery, async (c) => {
    const team = resolveTeam(c.req.valid("query"));
    const { hashes } = c.req.valid("json");
    const result = await artifactService.query(team, hashes);
    return c.json(
      Object.fromEntries(
        Object.entries(result).map(([hash, info]) => [hash, info ?? jsonNull]),
      ),
    );
  })
  .put(
    "/:hash",
    validateArtifactHash,
    validateTeamQuery,
    validateUploadHeaders,
    async (c) => {
      const { hash } = c.req.valid("param");
      const team = resolveTeam(c.req.valid("query"));
      const metadata = extractMetadata(c.req.valid("header"));
      const body = new Uint8Array(await c.req.arrayBuffer());
      await artifactService.upload(team, hash, { body, metadata });
      return c.json({ urls: [new URL(c.req.path, c.req.url).href] }, 200);
    },
  )
  .post(
    "/events",
    validateCacheEvents,
    validateTeamQuery,
    validateClientHeaders,
    (c) => {
      // Cache events are accepted per the spec but not persisted; the
      // analytics endpoint is optional and currently a no-op.
      return c.body("", 200);
    },
  );
