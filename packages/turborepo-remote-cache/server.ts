import { env } from "cloudflare:workers";

import { createArtifactRepo } from "./src/features/artifacts/repo.js";
import { createApp } from "./src/index.js";

/**
 * Nitro server entry — composition root.
 *
 * Wires the R2-backed artifact repository and the bearer token into the
 * Hono app. Configuration via environment variables:
 * - `TURBO_TOKEN` — required bearer token. When unset, authentication
 *   is disabled (development mode only).
 * - `TURBOREPO_REMOTE_CACHE` — Cloudflare R2 bucket binding the artifacts
 *   are persisted in.
 */
const token = process.env.TURBO_TOKEN;

export default createApp({
  repo: createArtifactRepo(env.TURBOREPO_REMOTE_CACHE),
  token: token ?? undefined,
});
