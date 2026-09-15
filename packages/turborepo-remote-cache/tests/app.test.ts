import { afterEach, describe, expect, it, vi } from "vitest";

import type { ArtifactRecord } from "../src/features/artifacts/types";

import { artifactRepo } from "../src/features/artifacts/repo";
import { setTurborepoToken } from "./cloudflare-workers";
import app from "../src/index";

const hash = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const missingHash =
  "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
const body = new TextEncoder().encode("artifact-body");

// Clears the stubbed `TURBO_CACHE_TOKEN` secret after every test so the
// artifact tests below keep running in tokenless (auth disabled) mode.
afterEach(() => {
  setTurborepoToken(undefined);
});

const stored: ArtifactRecord = {
  body,
  duration: 250,
  sha: "sha-123",
  size: body.byteLength,
  tag: "v1",
};

/**
 * In-memory repo spy installed onto the shared {@link artifactRepo}; also
 * records which repo methods were called, so the HEAD short-circuit can be
 * verified to avoid loading the body. Spies are restored between tests by
 * the `restoreMocks` vitest option.
 */
function createRepo(
  overrides: Partial<typeof artifactRepo> = {},
): typeof artifactRepo & { finds: string[]; summaries: string[] } {
  const repo: typeof artifactRepo & { finds: string[]; summaries: string[] } = {
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

  vi.spyOn(artifactRepo, "find").mockImplementation(
    overrides.find ?? repo.find,
  );
  vi.spyOn(artifactRepo, "findSummaries").mockImplementation(
    overrides.findSummaries ?? repo.findSummaries,
  );
  vi.spyOn(artifactRepo, "findSummary").mockImplementation(
    overrides.findSummary ?? repo.findSummary,
  );
  vi.spyOn(artifactRepo, "save").mockImplementation(
    overrides.save ?? repo.save,
  );

  return repo;
}

describe("HEAD /v8/artifacts/:hash", () => {
  it("short-circuits via the head shortcut, returning headers only", async () => {
    const repo = createRepo();

    const response = await app.request(`/v8/artifacts/${hash}`, {
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
    createRepo();

    const response = await app.request(`/v8/artifacts/${missingHash}`, {
      method: "HEAD",
    });

    // Hono strips the body of HEAD responses, so only the status is
    // observable here.
    expect(response.status).toBe(404);
  });

  it("scopes the head lookup by team query parameters", async () => {
    const repo = createRepo();

    const response = await app.request(`/v8/artifacts/${hash}?teamId=team_1`, {
      method: "HEAD",
    });

    expect(response.status).toBe(200);
    expect(repo.summaries).toStrictEqual([`team_1/${hash}`]);
  });

  it("runs the route validators before the shortcut", async () => {
    const repo = createRepo();

    const response = await app.request("/v8/artifacts/not-a-hash", {
      method: "HEAD",
    });

    // Hono strips the body of HEAD responses, so only the status is
    // observable here.
    expect(response.status).toBe(400);
    expect(repo.summaries).toStrictEqual([]);
  });
});

describe("GET /v8/artifacts/:hash", () => {
  it("returns the artifact body with metadata headers", async () => {
    const repo = createRepo();

    const response = await app.request(`/v8/artifacts/${hash}`);

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
    createRepo();

    const response = await app.request(`/v8/artifacts/${missingHash}`);

    expect(response.status).toBe(404);
    expect(await response.json()).toStrictEqual({
      code: "ARTIFACT_NOT_FOUND",
      message: `Artifact not found: ${missingHash}`,
    });
  });
});

describe("POST /v8/artifacts", () => {
  it("maps found artifacts to info and missing hashes to null", async () => {
    createRepo();

    const response = await app.request("/v8/artifacts", {
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

describe("PUT /v8/artifacts/:hash", () => {
  it("stores the artifact and echoes the download URL", async () => {
    const saves: (readonly [string, string, number, string])[] = [];
    createRepo({
      save: async (team, h, insert) => {
        saves.push([
          team,
          h,
          insert.body.byteLength,
          insert.metadata.tag ?? "",
        ]);
      },
    });

    const response = await app.request(`/v8/artifacts/${hash}`, {
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
      urls: [`http://localhost/v8/artifacts/${hash}`],
    });
    expect(saves).toStrictEqual([["", hash, 13, "v2"]]);
  });
});

describe("authentication", () => {
  it("accepts requests with the correct bearer token", async () => {
    setTurborepoToken("secret");
    createRepo();

    const response = await app.request(`/v8/artifacts/${hash}`, {
      headers: { authorization: "Bearer secret" },
      method: "HEAD",
    });

    expect(response.status).toBe(200);
  });

  it("rejects requests without a bearer token", async () => {
    setTurborepoToken("secret");
    createRepo();

    const response = await app.request(`/v8/artifacts/${hash}`);

    expect(response.status).toBe(401);
    expect(await response.json()).toStrictEqual({
      code: "UNAUTHORIZED",
      message: "A valid bearer token is required.",
    });
  });

  it("rejects requests with a wrong bearer token", async () => {
    setTurborepoToken("secret");
    createRepo();

    const response = await app.request(`/v8/artifacts/${hash}`, {
      headers: { authorization: "Bearer wrong" },
    });

    expect(response.status).toBe(401);
    expect(await response.json()).toStrictEqual({
      code: "UNAUTHORIZED",
      message: "A valid bearer token is required.",
    });
  });

  it("rejects malformed Authorization headers with 400", async () => {
    setTurborepoToken("secret");
    createRepo();

    const response = await app.request(`/v8/artifacts/${hash}`, {
      headers: { authorization: "Bearer bad token!" },
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toStrictEqual({
      code: "BAD_REQUEST",
      message: "The Authorization header must carry a Bearer token.",
    });
  });
});
