import { sValidator } from "@hono/standard-validator";
import * as v from "valibot";

import { validationErrorHook } from "../../validation";

/**
 * Header value coerced from its string form into a number.
 */
const numericHeader = v.pipe(v.string(), v.transform(Number));

/**
 * Non-negative number constraint.
 */
const nonNegativeNumber = v.pipe(v.number(), v.minValue(0));

/**
 * Non-negative integer constraint.
 */
const nonNegativeInteger = v.pipe(nonNegativeNumber, v.integer());

/**
 * `x-artifact-client-interactive` header: `"0"` or `"1"`, coerced to a
 * number.
 */
const interactiveHeader = v.pipe(numericHeader, v.picklist([0, 1]));

/**
 * Header value limited to 50 characters (CI environment names).
 */
const ciHeader = v.pipe(v.string(), v.maxLength(50));

/**
 * Base64-encoded artifact tag, limited to 600 characters.
 */
const tagHeader = v.pipe(v.string(), v.maxLength(600));

/**
 * Non-empty array of strings.
 */
const nonEmptyStrings = v.pipe(v.array(v.string()), v.minLength(1));

/**
 * UUID string (Turborepo session identifier).
 */
const uuidString = v.pipe(v.string(), v.uuid());

/**
 * Content-addressable artifact hash.
 *
 * Hex string that uniquely identifies a cached artifact based on task
 * inputs.
 */
export const artifactHashSchema = v.pipe(
  v.string(),
  v.regex(/^[a-f0-9]+$/iu, "The artifact hash must be a hexadecimal string."),
);

/**
 * Path parameters of the artifact routes — carries the artifact hash.
 */
export const artifactHashParameterSchema = v.object({
  hash: artifactHashSchema,
});

/**
 * Team scoping query parameters shared by all artifact endpoints.
 *
 * `teamId` and `slug` are alternative ways to identify the team the request
 * is performed on behalf of.
 */
export const teamQuerySchema = v.object({
  slug: v.optional(v.string()),
  teamId: v.optional(v.string()),
});

/**
 * Client context headers accepted on artifact operations.
 *
 * `x-artifact-client-ci` names the CI environment (max 50 chars) and
 * `x-artifact-client-interactive` is coerced from the string form Hono
 * delivers (`"0"` / `"1"`) into a number.
 */
export const clientHeadersSchema = v.object({
  "x-artifact-client-ci": v.optional(ciHeader),
  "x-artifact-client-interactive": v.optional(interactiveHeader),
});

/**
 * Headers required and accepted on artifact upload (`PUT /artifacts/{hash}`).
 *
 * `content-length` is required and coerced into a non-negative integer;
 * the remaining headers are optional metadata stored with the artifact and
 * echoed back on download.
 */
export const uploadHeadersSchema = v.object({
  "content-length": v.pipe(numericHeader, nonNegativeInteger),
  "x-artifact-client-ci": v.optional(ciHeader),
  "x-artifact-client-interactive": v.optional(interactiveHeader),
  "x-artifact-dirty-hash": v.optional(v.string()),
  "x-artifact-duration": v.optional(v.pipe(numericHeader, nonNegativeNumber)),
  "x-artifact-sha": v.optional(v.string()),
  "x-artifact-tag": v.optional(tagHeader),
});

/**
 * Request body of `POST /artifacts` — the hashes to query metadata for.
 */
export const artifactQueryRequestSchema = v.object({ hashes: nonEmptyStrings });

/**
 * A single cache usage analytics event (`POST /artifacts/events`).
 */
export const cacheEventSchema = v.object({
  duration: v.optional(nonNegativeInteger),
  event: v.picklist(["HIT", "MISS"]),
  hash: v.string(),
  sessionId: uuidString,
  source: v.picklist(["LOCAL", "REMOTE"]),
});

/**
 * Request body of `POST /artifacts/events` — an array of cache events.
 */
export const cacheEventsSchema = v.array(cacheEventSchema);

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

/**
 * Output type of {@link teamQuerySchema}.
 */
export type TeamQuery = v.InferOutput<typeof teamQuerySchema>;

/**
 * Validated upload headers of `PUT /artifacts/{hash}`.
 */
export type UploadHeaders = v.InferOutput<typeof uploadHeadersSchema>;
