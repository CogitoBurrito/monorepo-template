/**
 * Builds a spec-shaped error body.
 */
export function errorBody(code: string, message: string) {
  return { code, message };
}
