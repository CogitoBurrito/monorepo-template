import { Hono } from "hono";
import { describe, expect, it } from "vitest";

import {
  validateArtifactHash,
  validateArtifactQuery,
  validateCacheEvents,
  validateClientHeaders,
  validateTeamQuery,
  validateUploadHeaders,
} from "../src/features/artifacts/schema";

const validUuid = "3fa85f64-5717-4562-b3fc-2c963f66afa6";

const app = new Hono()
  .get("/artifacts/:hash", validateArtifactHash, (c) =>
    c.json({ hash: c.req.valid("param").hash }),
  )
  .get("/team", validateTeamQuery, (c) => c.json(c.req.valid("query")))
  .post("/artifacts", validateArtifactQuery, (c) =>
    c.json({ hashes: c.req.valid("json").hashes }),
  )
  .post("/artifacts/events", validateCacheEvents, (c) => c.json({ ok: true }))
  .put("/artifacts/:hash", validateArtifactHash, validateUploadHeaders, (c) =>
    c.json({ length: c.req.valid("header")["content-length"] }),
  )
  .put("/client", validateClientHeaders, (c) =>
    c.json({
      interactive: c.req.valid("header")["x-artifact-client-interactive"],
    }),
  );

describe("validateArtifactHash", () => {
  it("passes valid hashes through to the handler", async () => {
    const response = await app.request("/artifacts/abc123");

    expect(response.status).toBe(200);
    expect(await response.json()).toStrictEqual({ hash: "abc123" });
  });

  it("rejects non-hex hashes with a 400 error", async () => {
    const response = await app.request("/artifacts/not-a-hash!");

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      code: "BAD_REQUEST",
      message: expect.stringContaining("hash"),
    });
  });
});

describe("validateTeamQuery", () => {
  it("passes team scoping parameters through to the handler", async () => {
    const response = await app.request("/team?teamId=team_1&slug=acme");

    expect(response.status).toBe(200);
    expect(await response.json()).toStrictEqual({
      slug: "acme",
      teamId: "team_1",
    });
  });

  it("accepts requests without team parameters", async () => {
    const response = await app.request("/team");

    expect(response.status).toBe(200);
    expect(await response.json()).toStrictEqual({});
  });
});

describe("validateArtifactQuery", () => {
  it("passes the queried hashes through to the handler", async () => {
    const response = await app.request("/artifacts", {
      body: JSON.stringify({ hashes: ["abc", "def"] }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toStrictEqual({ hashes: ["abc", "def"] });
  });

  it("rejects an empty hash list with a 400 error", async () => {
    const response = await app.request("/artifacts", {
      body: JSON.stringify({ hashes: [] }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects malformed JSON bodies with a 400 error", async () => {
    const response = await app.request("/artifacts", {
      body: "{not json",
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    expect(response.status).toBe(400);
    expect(await response.text()).toContain("Malformed JSON");
  });
});

describe("validateCacheEvents", () => {
  it("accepts a batch of valid cache events", async () => {
    const response = await app.request("/artifacts/events", {
      body: JSON.stringify([
        {
          duration: 120,
          event: "HIT",
          hash: "abc123",
          sessionId: validUuid,
          source: "REMOTE",
        },
      ]),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toStrictEqual({ ok: true });
  });

  it("rejects invalid cache events with a 400 error", async () => {
    const response = await app.request("/artifacts/events", {
      body: JSON.stringify([
        {
          event: "HIT",
          hash: "abc123",
          sessionId: "nope",
          source: "REMOTE",
        },
      ]),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      code: "BAD_REQUEST",
      message: expect.stringContaining("sessionId"),
    });
  });
});

describe("validateUploadHeaders", () => {
  it("rejects uploads without a content-length", async () => {
    const response = await app.request("/artifacts/abc123", {
      method: "PUT",
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      code: "BAD_REQUEST",
      message: expect.stringContaining("content-length"),
    });
  });
});

describe("validateClientHeaders", () => {
  it("coerces the interactive header through the header pipeline", async () => {
    const response = await app.request("/client", {
      headers: { "x-artifact-client-interactive": "1" },
      method: "PUT",
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toStrictEqual({ interactive: 1 });
  });

  it("rejects interactive values other than 0 and 1", async () => {
    const response = await app.request("/client", {
      headers: { "x-artifact-client-interactive": "2" },
      method: "PUT",
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ code: "BAD_REQUEST" });
  });
});
