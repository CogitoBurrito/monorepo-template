import { adminSecretsStore } from "cloudflare:test";
import { env, exports } from "cloudflare:workers";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

/**
 * Integration tests against the Turborepo Remote Cache OpenAPI spec
 * (`spec.json`). The worker is exercised through `exports.default.fetch()`,
 * which runs the `main` worker (from `wrangler.jsonc`) in the same isolate
 * as the tests on a miniflare-simulated environment.
 *
 * Endpoints are mounted at `/v8/artifacts`; the spec paths (`/artifacts/…`)
 * map onto them with the `/v8` prefix Turborepo's client uses.
 */

const BASE_URL = "https://cache.test/v8/artifacts";
const TOKEN = "test-turbo-cache-token";
const HASH = "abc123";
const MISSING_HASH = "ffffffffffffffffffffffffffffffff";
const BODY = new Uint8Array([104, 101, 108, 108, 111]);

type ApiInit = Omit<RequestInit, "headers"> & { headers?: HeadersInit };

/**
 * Sends a request to the worker, optionally with a bearer token — omit the
 * `token` argument to exercise the unauthenticated paths.
 */
function request(path: string, init: ApiInit, token?: string) {
  const headers = new Headers(init.headers);
  if (token !== undefined) {
    headers.set("authorization", `Bearer ${token}`);
  }
  return exports.default.fetch(
    new Request(`${BASE_URL}${path}`, { ...init, headers }),
  );
}

/**
 * Sends an authenticated request with the configured test token.
 */
function api(path: string, init: ApiInit = {}) {
  return request(path, init, TOKEN);
}

/**
 * Sends a request without any authorization header.
 */
function apiUnauthenticated(path: string, init: ApiInit = {}) {
  return request(path, init);
}

/**
 * Uploads an artifact, optionally scoped to a team (`?teamId=…&slug=…`)
 * and carrying metadata headers echoed back on download.
 */
async function upload(
  hash: string,
  metadata: Record<string, string> = {},
  query = "",
) {
  return api(`/${hash}${query}`, {
    body: BODY,
    headers: metadata,
    method: "PUT",
  });
}

beforeAll(async () => {
  // Seed the simulated Secrets Store so `TURBO_CACHE_TOKEN.get()` succeeds.
  const admin = adminSecretsStore(env.TURBO_CACHE_TOKEN);
  await admin.create(TOKEN);
});

beforeEach(async () => {
  // Wipe every artifact from the simulated R2 bucket so tests stay isolated.
  const bucket = env.TURBOREPO_REMOTE_CACHE;
  const { objects } = await bucket.list();
  await Promise.all(objects.map((object) => bucket.delete(object.key)));
});

describe("authentication", () => {
  it("rejects requests without an authorization header", async () => {
    const response = await apiUnauthenticated("/status");
    expect(response.status).toBe(401);
  });

  it("rejects requests with an invalid token", async () => {
    const response = await request("/status", {}, "wrong-token");
    expect(response.status).toBe(401);
  });

  it("accepts requests with the configured token", async () => {
    const response = await api("/status");
    expect(response.status).toBe(200);
  });
});

describe("GET /artifacts/status", () => {
  it("reports remote caching as enabled", async () => {
    const response = await api("/status");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "enabled" });
  });
});

describe("PUT /artifacts/{hash}", () => {
  it("stores an artifact and returns its storage url", async () => {
    const response = await upload(HASH, { "x-artifact-tag": "tag" });

    expect(response.status).toBe(200);
    const body = await response.json<{ urls: string[] }>();
    expect(body.urls).toEqual([`${BASE_URL}/${HASH}`]);
  });

  it("rejects a non-hexadecimal hash", async () => {
    const response = await upload("not-hex");
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      code: "BAD_REQUEST",
      message: expect.any(String),
    });
  });

  it("rejects a negative x-artifact-duration", async () => {
    const response = await upload(HASH, { "x-artifact-duration": "-1" });
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      code: "BAD_REQUEST",
      message: expect.any(String),
    });
  });

  it("rejects an x-artifact-tag longer than 600 characters", async () => {
    const response = await upload(HASH, { "x-artifact-tag": "x".repeat(601) });
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      code: "BAD_REQUEST",
      message: expect.any(String),
    });
  });

  it("rejects an invalid x-artifact-client-interactive header", async () => {
    const response = await upload(HASH, {
      "x-artifact-client-interactive": "2",
    });
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      code: "BAD_REQUEST",
      message: expect.any(String),
    });
  });
});

describe("GET /artifacts/{hash}", () => {
  it("downloads the stored artifact body with metadata headers", async () => {
    await upload(HASH, {
      "x-artifact-dirty-hash": "dirty",
      "x-artifact-duration": "1234",
      "x-artifact-sha": "deadbeef",
      "x-artifact-tag": "tag",
    });

    const response = await api(`/${HASH}`);
    expect(response.status).toBe(200);
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(BODY);
    expect(response.headers.get("content-length")).toBe(
      String(BODY.byteLength),
    );
    expect(response.headers.get("x-artifact-duration")).toBe("1234");
    expect(response.headers.get("x-artifact-sha")).toBe("deadbeef");
    expect(response.headers.get("x-artifact-tag")).toBe("tag");
    expect(response.headers.get("x-artifact-dirty-hash")).toBe("dirty");
  });

  it("responds 404 with the spec error body for an unknown artifact", async () => {
    const response = await api(`/${MISSING_HASH}`);
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      code: "ARTIFACT_NOT_FOUND",
      message: expect.any(String),
    });
  });
});

describe("HEAD /artifacts/{hash}", () => {
  it("reports existence with content-length and metadata headers", async () => {
    await upload(HASH, {
      "x-artifact-duration": "1234",
      "x-artifact-tag": "tag",
    });

    const response = await api(`/${HASH}`, { method: "HEAD" });
    expect(response.status).toBe(200);
    expect(response.headers.get("content-length")).toBe(
      String(BODY.byteLength),
    );
    expect(response.headers.get("x-artifact-duration")).toBe("1234");
    expect(response.headers.get("x-artifact-tag")).toBe("tag");
    expect(await response.text()).toBe("");
  });

  it("matches the GET response while returning no body", async () => {
    await upload(HASH, {
      "x-artifact-dirty-hash": "dirty",
      "x-artifact-duration": "1234",
      "x-artifact-sha": "deadbeef",
      "x-artifact-tag": "tag",
    });

    const [referenceResponse, headResponse] = await Promise.all([
      api(`/${HASH}`),
      api(`/${HASH}`, { method: "HEAD" }),
    ]);

    expect(headResponse.status).toBe(referenceResponse.status);
    const echoedHeaders = [
      "content-length",
      "x-artifact-dirty-hash",
      "x-artifact-duration",
      "x-artifact-sha",
      "x-artifact-tag",
    ] as const;
    for (const header of echoedHeaders) {
      expect(headResponse.headers.get(header)).toBe(
        referenceResponse.headers.get(header),
      );
    }
    expect(new Uint8Array(await headResponse.arrayBuffer())).toEqual(
      new Uint8Array(0),
    );
  });

  it("responds 404 for an unknown artifact", async () => {
    const response = await api(`/${MISSING_HASH}`, { method: "HEAD" });
    expect(response.status).toBe(404);
    expect(await response.text()).toBe("");
  });
});

/**
 * JSON `null` literal — the spec's `ArtifactQueryResponse` maps missing
 * artifacts to `null` (matching the `jsonNull` convention in the source).
 */
const jsonNull = JSON.parse("null") as null;

/**
 * Builds a cache usage analytics event body.
 */
function event(overrides: Record<string, unknown> = {}) {
  return {
    event: "HIT",
    hash: HASH,
    sessionId: crypto.randomUUID(),
    source: "REMOTE",
    ...overrides,
  };
}

/**
 * Queries artifact metadata for several hashes at once.
 */
function query(hashes: string[]) {
  return api("", {
    body: JSON.stringify({ hashes }),
    headers: { "content-type": "application/json" },
    method: "POST",
  });
}

/**
 * Posts a batch of cache usage analytics events.
 */
function sendEvents(body: unknown) {
  return api("/events", {
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
    method: "POST",
  });
}

describe("POST /artifacts (query)", () => {
  it("returns metadata for known hashes and null for unknown ones", async () => {
    await upload(HASH, { "x-artifact-duration": "7", "x-artifact-tag": "tag" });

    const response = await query([HASH, MISSING_HASH]);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      [HASH]: { size: BODY.byteLength, tag: "tag", taskDurationMs: 7 },
      [MISSING_HASH]: jsonNull,
    });
  });

  it("rejects an empty hashes array", async () => {
    const response = await query([]);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      code: "BAD_REQUEST",
      message: expect.any(String),
    });
  });

  it("rejects a body without hashes", async () => {
    const response = await api("", {
      body: JSON.stringify({}),
      headers: { "content-type": "application/json" },
      method: "POST",
    });
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      code: "BAD_REQUEST",
      message: expect.any(String),
    });
  });
});

describe("team scoping", () => {
  it("stores artifacts under the teamId namespace", async () => {
    await upload(HASH, {}, "?teamId=team-a");

    const scoped = await api(`/${HASH}?teamId=team-a`);
    expect(scoped.status).toBe(200);

    const otherTeam = await api(`/${HASH}?teamId=team-b`);
    expect(otherTeam.status).toBe(404);

    const unscoped = await api(`/${HASH}`);
    expect(unscoped.status).toBe(404);
  });

  it("prefers teamId over slug when both are provided", async () => {
    await upload(HASH, {}, "?teamId=team-a&slug=team-b");

    const viaTeamId = await api(`/${HASH}?teamId=team-a`);
    expect(viaTeamId.status).toBe(200);

    const viaSlug = await api(`/${HASH}?slug=team-b`);
    expect(viaSlug.status).toBe(404);
  });

  it("falls back to slug when teamId is absent", async () => {
    await upload(HASH, {}, "?slug=team-a");

    const viaSlug = await api(`/${HASH}?slug=team-a`);
    expect(viaSlug.status).toBe(200);

    const viaTeamIdAlias = await api(`/${HASH}?teamId=team-a`);
    expect(viaTeamIdAlias.status).toBe(200);
  });
});

describe("POST /artifacts/events", () => {
  it("accepts a batch of cache events", async () => {
    const response = await sendEvents([
      event(),
      event({ event: "MISS", source: "LOCAL" }),
    ]);
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("");
  });

  it("rejects an unknown source", async () => {
    const response = await sendEvents([event({ source: "REMOTE_X" })]);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      code: "BAD_REQUEST",
      message: expect.any(String),
    });
  });

  it("rejects an unknown event type", async () => {
    const response = await sendEvents([event({ event: "MISS_HITLESS" })]);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      code: "BAD_REQUEST",
      message: expect.any(String),
    });
  });

  it("rejects a malformed sessionId", async () => {
    const response = await sendEvents([event({ sessionId: "not-a-uuid" })]);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      code: "BAD_REQUEST",
      message: expect.any(String),
    });
  });
});

describe("unknown routes", () => {
  it("responds 404 with the spec error body", async () => {
    // Paths outside the `/v8/artifacts` mount fall through to the worker's
    // `notFound` handler; a hash-shaped but non-hex path is a 400 instead.
    const response = await exports.default.fetch(
      new Request("https://cache.test/v9/does-not-exist", {
        headers: { authorization: `Bearer ${TOKEN}` },
      }),
    );
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      code: "NOT_FOUND",
      message: "The requested resource was not found.",
    });
  });

  it("responds 400 for a non-hex artifact hash path", async () => {
    const response = await api("/does-not-exist");
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      code: "BAD_REQUEST",
      message: expect.any(String),
    });
  });
});
