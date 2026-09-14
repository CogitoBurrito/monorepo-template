import { describe, expect, it } from "vitest";

import type {
  ArtifactRecord,
  ArtifactRepo,
} from "../src/features/artifacts/repo.js";

import { createApp } from "../src/index.js";

const hash = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const missingHash =
  "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
const body = new TextEncoder().encode("artifact-body");

const stored: ArtifactRecord = {
  body,
  duration: 250,
  sha: "sha-123",
  size: body.byteLength,
  tag: "v1",
};

/**
 * In-memory repo spy that also records which repo methods were called, so
 * the HEAD short-circuit can be verified to avoid loading the body.
 */
function createRepo(
  overrides: Partial<ArtifactRepo> = {},
): ArtifactRepo & { finds: string[]; summaries: string[] } {
  const repo = {
    find: async (team: string, h: string) => {
      repo.finds.push(`${team}/${h}`);

      return h === hash ? stored : undefined;
    },
    finds: [] as string[],
    findSummaries: async (_team: string, hashes: readonly string[]) => {
      return Object.fromEntries(
        hashes.map((h) => [h, h === hash ? stored : undefined]),
      );
    },
    findSummary: async (team: string, h: string) => {
      repo.summaries.push(`${team}/${h}`);

      return h === hash ? stored : undefined;
    },
    save: async () => {
      return;
    },
    summaries: [] as string[],
  };

  return Object.assign(repo, overrides);
}

describe("HEAD /artifacts/:hash", () => {
  it("short-circuits via the head shortcut, returning headers only", async () => {
    const repo = createRepo();
    const app = createApp({ repo });

    const response = await app.request(`/artifacts/${hash}`, {
      method: "HEAD",
    });

    expect(response.status).toBe(200);
    expect(await response.arrayBuffer()).toHaveProperty("byteLength", 0);
    expect(response.headers.get("content-length")).toBe(
      String(body.byteLength),
    );
    expect(response.headers.get("x-artifact-sha")).toBe("sha-123");
    expect(response.headers.get("x-artifact-tag")).toBe("v1");
    expect(response.headers.get("x-artifact-duration")).toBe("250");
    expect(repo.summaries).toStrictEqual([`/${hash}`]);
    expect(repo.finds).toStrictEqual([]);
  });

  it("returns 404 with the spec error body for missing artifacts", async () => {
    const app = createApp({ repo: createRepo() });

    const response = await app.request(`/artifacts/${missingHash}`, {
      method: "HEAD",
    });

    // Hono strips the body of HEAD responses, so only the status is
    // observable here.
    expect(response.status).toBe(404);
  });

  it("scopes the head lookup by team query parameters", async () => {
    const repo = createRepo();
    const app = createApp({ repo });

    const response = await app.request(`/artifacts/${hash}?teamId=team_1`, {
      method: "HEAD",
    });

    expect(response.status).toBe(200);
    expect(repo.summaries).toStrictEqual([`team_1/${hash}`]);
  });

  it("runs the route validators before the shortcut", async () => {
    const repo = createRepo();
    const app = createApp({ repo });

    const response = await app.request("/artifacts/not-a-hash", {
      method: "HEAD",
    });

    // Hono strips the body of HEAD responses, so only the status is
    // observable here.
    expect(response.status).toBe(400);
    expect(repo.summaries).toStrictEqual([]);
  });
});

describe("GET /artifacts/:hash", () => {
  it("returns the artifact body with metadata headers", async () => {
    const repo = createRepo();
    const app = createApp({ repo });

    const response = await app.request(`/artifacts/${hash}`);

    expect(response.status).toBe(200);
    expect(new Uint8Array(await response.arrayBuffer())).toStrictEqual(body);
    expect(response.headers.get("content-length")).toBe(
      String(body.byteLength),
    );
    expect(response.headers.get("x-artifact-sha")).toBe("sha-123");
    expect(repo.finds).toStrictEqual([`/${hash}`]);
    expect(repo.summaries).toStrictEqual([]);
  });

  it("returns 404 for missing artifacts", async () => {
    const app = createApp({ repo: createRepo() });

    const response = await app.request(`/artifacts/${missingHash}`);

    expect(response.status).toBe(404);
    expect(await response.json()).toStrictEqual({
      code: "ARTIFACT_NOT_FOUND",
      message: `Artifact not found: ${missingHash}`,
    });
  });
});

describe("POST /artifacts", () => {
  it("maps found artifacts to info and missing hashes to null", async () => {
    const app = createApp({ repo: createRepo() });

    const response = await app.request("/artifacts", {
      body: JSON.stringify({ hashes: [hash, "missing"] }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toStrictEqual({
      [hash]: { size: body.byteLength, tag: "v1", taskDurationMs: 250 },
      missing: JSON.parse("null") as null,
    });
  });
});

describe("PUT /artifacts/:hash", () => {
  it("stores the artifact and echoes the download URL", async () => {
    const saves: (readonly [string, string, number, string])[] = [];
    const repo = createRepo({
      save: async (team, h, insert) => {
        saves.push([
          team,
          h,
          insert.body.byteLength,
          insert.metadata.tag ?? "",
        ]);
      },
    });
    const app = createApp({ repo });

    const response = await app.request(`/artifacts/${hash}`, {
      body: "artifact-body",
      headers: {
        "content-length": "13",
        "Content-Type": "application/octet-stream",
        "x-artifact-tag": "v2",
      },
      method: "PUT",
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toStrictEqual({
      urls: [`http://localhost/artifacts/${hash}`],
    });
    expect(saves).toStrictEqual([["", hash, 13, "v2"]]);
  });
});

describe("authentication", () => {
  it("accepts requests with the correct bearer token", async () => {
    const app = createApp({
      repo: createRepo(),
      token: "secret",
    });

    const response = await app.request(`/artifacts/${hash}`, {
      headers: { authorization: "Bearer secret" },
      method: "HEAD",
    });

    expect(response.status).toBe(200);
  });

  it("rejects requests without a bearer token", async () => {
    const app = createApp({
      repo: createRepo(),
      token: "secret",
    });

    const response = await app.request(`/artifacts/${hash}`);

    expect(response.status).toBe(401);
    expect(await response.json()).toStrictEqual({
      code: "UNAUTHORIZED",
      message: "A valid bearer token is required.",
    });
  });

  it("rejects requests with a wrong bearer token", async () => {
    const app = createApp({
      repo: createRepo(),
      token: "secret",
    });

    const response = await app.request(`/artifacts/${hash}`, {
      headers: { authorization: "Bearer wrong" },
    });

    expect(response.status).toBe(401);
    expect(await response.json()).toStrictEqual({
      code: "UNAUTHORIZED",
      message: "A valid bearer token is required.",
    });
  });

  it("rejects malformed Authorization headers with 400", async () => {
    const app = createApp({
      repo: createRepo(),
      token: "secret",
    });

    const response = await app.request(`/artifacts/${hash}`, {
      headers: { authorization: "Bearer bad token!" },
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toStrictEqual({
      code: "BAD_REQUEST",
      message: "The Authorization header must carry a Bearer token.",
    });
  });
});
