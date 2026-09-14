import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { Context, Env, ValidationTargets } from "hono";

import { errorBody } from "./errors";

/**
 * Result shape delivered to every `sValidator` hook.
 */
type ValidatorResult<T> =
  | {
      readonly data: T;
      readonly error: readonly StandardSchemaV1.Issue[];
      readonly success: false;
    }
  | { readonly data: T; readonly success: true };

/**
 * Hook passed to every `sValidator` middleware.
 *
 * On validation failure it short-circuits the request with the
 * `BadRequest` error shape defined by the Turborepo Remote Cache spec
 * (`{ code, message }`), listing every issue reported by the schema.
 */
export function validationErrorHook<T, E extends Env, P extends string>(
  result: ValidatorResult<T> & { target: keyof ValidationTargets },
  c: Context<E, P>,
) {
  if (result.success) {
    return;
  }
  const message =
    result.error.map((issue) => formatIssue(issue)).join("; ") ||
    "Invalid request.";
  return c.json(errorBody("BAD_REQUEST", message), 400);
}

/**
 * Formats a single validation issue as `path: message`, joining every path
 * segment (including array indices) with dots.
 */
function formatIssue(issue: StandardSchemaV1.Issue) {
  const path = (issue.path ?? [])
    .map((segment) =>
      String(typeof segment === "object" ? segment.key : segment),
    )
    .join(".");
  if (path === "") {
    return issue.message;
  }
  return `${path}: ${issue.message}`;
}
