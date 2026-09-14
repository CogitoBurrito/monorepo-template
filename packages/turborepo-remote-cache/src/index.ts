import type { Context, Next } from "hono";

import { Hono } from "hono";
import { bearerAuth } from "hono/bearer-auth";
import { HTTPException } from "hono/http-exception";

import { errorBody } from "./errors";
import { artifacts } from "./features/artifacts";

/**
 * Bearer-token authentication middleware.
 *
 * When a `TURBO_TOKEN` is configured, requests must carry `Authorization:
 * Bearer <token>`; anything else is short-circuited with the spec
 * `Unauthorized` error shape (malformed `Authorization` headers answer with
 * the spec `BadRequest` shape). When no token is configured — development
 * mode — every request passes through. The token is read at request time so
 * tests can vary it through the environment.
 */
const authMiddleware = async (c: Context, next: Next) => {
  const token = process.env.TURBO_TOKEN;
  if (!token) {
    await next();
    return;
  }
  const unauthorized = errorBody(
    "UNAUTHORIZED",
    "A valid bearer token is required.",
  );
  return bearerAuth({
    invalidAuthenticationHeader: {
      message: errorBody(
        "BAD_REQUEST",
        "The Authorization header must carry a Bearer token.",
      ),
    },
    invalidToken: { message: unauthorized },
    noAuthenticationHeader: { message: unauthorized },
    token,
  })(c, next);
};

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
  .use("*", authMiddleware)
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
  .route("/artifacts", artifacts);
