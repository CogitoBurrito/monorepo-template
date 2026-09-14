/**
 * Vitest stub for the `cloudflare:workers` virtual module (aliased in
 * `vitest.config.ts`): tests never touch the real worker environment —
 * the app tests install in-memory spies over the repo instead.
 */
const environment = {};

export { environment as env };
