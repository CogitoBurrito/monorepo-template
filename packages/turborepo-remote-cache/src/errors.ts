/**
 * Spec error response body shape: a machine-readable `code` plus a
 * human-readable `message`.
 */
export type ErrorResponse = {
  readonly code: string;
  readonly message: string;
};

/**
 * Builds a spec-shaped error body.
 */
export function errorBody(code: string, message: string) {
  return { code, message } satisfies ErrorResponse;
}
