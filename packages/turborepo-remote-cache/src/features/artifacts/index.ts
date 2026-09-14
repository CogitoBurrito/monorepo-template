import type { Context, MiddlewareHandler } from "hono";
import type { Env } from "hono/types";

import { sValidator } from "@hono/standard-validator";
import { Hono } from "hono";

import type { ArtifactSummary } from "./repo.js";
import type { ClientHeaders, TeamQuery, UploadHeaders } from "./schema.js";
import type { ArtifactService } from "./service.js";

import { errorBody } from "../../errors.js";
import { validationErrorHook } from "../../validation.js";
import {
  artifactHashParameterSchema,
  artifactQueryRequestSchema,
  cacheEventsSchema,
  clientHeadersSchema,
  teamQuerySchema,
  uploadHeadersSchema,
} from "./schema.js";

const artifactNotFoundCode = "ARTIFACT_NOT_FOUND";

/**
 * JSON `null` for `POST /artifacts` — the spec's `ArtifactQueryResponse`
 * maps missing artifacts to `null`, and the project convention replaces
 * the forbidden `null` literal with `undefined` everywhere else.
 */
const jsonNull: null = JSON.parse("null");

/**
 * Validates the `hash` path parameter of the artifact routes.
 */
export const validateArtifactHash = sValidator(
  "param",
  artifactHashParameterSchema,
  validationErrorHook,
);

/**
 * Validates the optional `teamId` / `slug` query parameters.
 */
export const validateTeamQuery = sValidator(
  "query",
  teamQuerySchema,
  validationErrorHook,
);

/**
 * Validates the optional client context headers
 * (`x-artifact-client-ci`, `x-artifact-client-interactive`).
 */
export const validateClientHeaders = sValidator(
  "header",
  clientHeadersSchema,
  validationErrorHook,
);

/**
 * Validates the upload headers of `PUT /artifacts/{hash}`, including the
 * required `content-length` and the optional artifact metadata headers.
 */
export const validateUploadHeaders = sValidator(
  "header",
  uploadHeadersSchema,
  validationErrorHook,
);

/**
 * Validates the JSON body of `POST /artifacts` (artifact hash query).
 */
export const validateArtifactQuery = sValidator(
  "json",
  artifactQueryRequestSchema,
  validationErrorHook,
);

/**
 * Validates the JSON body of `POST /artifacts/events` (cache events).
 */
export const validateCacheEvents = sValidator(
  "json",
  cacheEventsSchema,
  validationErrorHook,
);

export type ArtifactsAppType = ReturnType<typeof createArtifactsApp>;

/**
 * Context type of the `GET /:hash` route after its validators have run.
 */
type ArtifactHashContext = Context<
  Env,
  "/:hash",
  {
    in: {
      header: ClientHeaders & Record<string, string>;
      param: { hash: string };
      query: TeamQuery;
    };
    out: {
      header: ClientHeaders;
      param: { hash: string };
      query: TeamQuery;
    };
  }
>;

/**
 * Creates the artifacts sub-app — route definitions, validation
 * integration, and service calls. Paths are relative; the `/artifacts`
 * prefix is managed at mount time in `src/index.ts`.
 */
export function createArtifactsApp(service: ArtifactService) {
  const artifacts = new Hono()
    .get("/status", validateTeamQuery, (c) => {
      return c.json({ status: "enabled" });
    })
    .get(
      "/:hash",
      validateArtifactHash,
      validateTeamQuery,
      validateClientHeaders,
      headShortcut(service),
      async (c) => {
        const { hash } = c.req.valid("param");
        const team = resolveTeam(c.req.valid("query"));
        const artifact = await service.download(team, hash);

        if (artifact === undefined) {
          return c.json(
            errorBody(artifactNotFoundCode, `Artifact not found: ${hash}`),
            404,
          );
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
      const result = await service.query(team, hashes);

      return c.json(
        Object.fromEntries(
          Object.entries(result).map(([hash, info]) => [
            hash,
            info ?? jsonNull,
          ]),
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

        await service.upload(team, hash, { body, metadata });

        return c.json({ urls: [new URL(c.req.path, c.req.url).href] }, 200);
      },
    )
    .post(
      "/events",
      validateCacheEvents,
      validateTeamQuery,
      validateClientHeaders,
      (c) => {
        return c.body("", 200);
      },
    );

  return artifacts;
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
 * Short-circuits `HEAD` requests in the `GET /:hash` route.
 *
 * Hono dispatches `HEAD` requests through the `GET` route, so a dedicated
 * `HEAD` handler is never invoked. This middleware instead detects `HEAD`
 * (the raw request still carries the original method) and answers with the
 * cheap `service.summary()` lookup — no artifact body is ever fetched —
 * before the `GET` handler can run. See the "HEAD Request Best Practices"
 * section of the Hono best practices guide.
 */
function headShortcut(service: ArtifactService): MiddlewareHandler {
  return async (c, next) => {
    if (c.req.method !== "HEAD") {
      await next();

      return;
    }

    const context = c as ArtifactHashContext;
    const { hash } = context.req.valid("param");
    const team = resolveTeam(context.req.valid("query"));
    const summary = await service.summary(team, hash);

    if (summary === undefined) {
      return c.json(
        errorBody(artifactNotFoundCode, `Artifact not found: ${hash}`),
        404,
      );
    }

    return c.body("", 200, {
      "content-length": String(summary.size),
      ...metadataHeaders(summary),
    });
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
