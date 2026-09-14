import { Hono } from "hono";
import { bearerAuth } from "hono/bearer-auth";
import { HTTPException } from "hono/http-exception";

import type { ArtifactRepo } from "./features/artifacts/repo.js";

import { errorBody } from "./errors.js";
import { createArtifactsApp } from "./features/artifacts/index.js";
import { createArtifactService } from "./features/artifacts/service.js";

/**
 * Options accepted by `createApp`.
 */
export type AppOptions = {
  readonly repo: ArtifactRepo;
  readonly token?: string;
};

export type AppType = ReturnType<typeof createApp>;

/**
 * Creates the Turborepo Remote Cache Hono app.
 *
 * Contains only the mounts: every endpoint lives in the `artifacts` sub-app
 * and authentication is applied root-level — there are no public endpoints
 * whenever a token is configured. When `token` is unset (development mode)
 * authentication is disabled and every request is accepted.
 */
export function createApp({ repo, token }: AppOptions) {
  const service = createArtifactService(repo);
  const app = new Hono();

  app.notFound((c) => {
    return c.json(
      errorBody("NOT_FOUND", "The requested resource was not found."),
      404,
    );
  });

  app.onError((error, c) => {
    if (error instanceof HTTPException) {
      return error.getResponse();
    }

    return c.json(
      errorBody("INTERNAL_SERVER_ERROR", "An unexpected error occurred."),
      500,
    );
  });

  const routes = (
    token === undefined ? app : (
      app.use("*", createAuthMiddleware(token))
    )).route("/artifacts", createArtifactsApp(service));

  return routes;
}

/**
 * Bearer-token authentication middleware.
 *
 * Requests must carry `Authorization: Bearer <token>`; anything else is
 * short-circuited with the spec `Unauthorized` error shape (malformed
 * `Authorization` headers answer with the spec `BadRequest` shape).
 */
function createAuthMiddleware(token: string) {
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
  });
}
