/**
 * Nitro server entry — re-exports the Hono app composed in `src/index`.
 *
 * Configuration via environment variables:
 * - `TURBO_TOKEN` — required bearer token. When unset, authentication
 *   is disabled (development mode only); read by the auth middleware.
 * - `TURBOREPO_REMOTE_CACHE` — Cloudflare R2 bucket binding the artifacts
 *   are persisted in (read directly by the repository itself).
 */
export { default } from "./src/index";
