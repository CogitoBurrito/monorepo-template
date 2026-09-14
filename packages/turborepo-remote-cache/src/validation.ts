import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { Context } from "hono";

import { errorBody } from "./errors.js";

type ValidationFailure = {
  readonly error: readonly StandardSchemaV1.Issue[];
  readonly success: false;
};

type ValidationResult = ValidationFailure | ValidationSuccess;

type ValidationSuccess = {
  readonly success: true;
};

/**
 * Hook passed to every `sValidator` middleware.
 *
 * On validation failure it short-circuits the request with the
 * `BadRequest` error shape defined by the Turborepo Remote Cache spec
 * (`{ code, message }`), listing every issue reported by the schema.
 */
export function validationErrorHook(result: ValidationResult, c: Context) {
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
    .map((segment) => (typeof segment === "object" ? segment.key : segment))
    .join(".");

  if (path === "") {
    return issue.message;
  }

  return `${path}: ${issue.message}`;
}
