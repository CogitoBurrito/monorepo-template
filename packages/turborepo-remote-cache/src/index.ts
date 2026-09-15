import { env } from "cloudflare:workers";
import { Hono } from "hono";
import { bearerAuth } from "hono/bearer-auth";
import { HTTPException } from "hono/http-exception";

import { errorBody } from "./errors";
import { artifacts } from "./features/artifacts";

/**
 * The Turborepo Remote Cache Hono app.
 *
 * Contains only the mounts: every endpoint lives in the `artifacts` sub-app
 * and authentication is applied root-level — there are no public endpoints
 * whenever a token is configured. When `TURBO_TOKEN` is unset (development
 * mode) authentication is disabled and every request is accepted.
 */

const app = new Hono();

export default app
  .use(
    "*",
    bearerAuth({
      verifyToken: async (token) => {
        return token === (await env.TURBO_CACHE_TOKEN.get());
      },
    }),
  )
  .notFound((c) => {
    return c.json(
      errorBody("NOT_FOUND", "The requested resource was not found."),
      404,
    );
  })
  .onError((error, c) => {
    if (error instanceof HTTPException) {
      return error.getResponse();
    }
    return c.json(
      errorBody("INTERNAL_SERVER_ERROR", "An unexpected error occurred."),
      500,
    );
  })
  .route("/v8/artifacts", artifacts);
