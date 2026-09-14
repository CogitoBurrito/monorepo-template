import * as v from "valibot";
import { describe, expect, it } from "vitest";

import {
  artifactHashSchema,
  artifactQueryRequestSchema,
  cacheEventSchema,
  cacheEventsSchema,
  clientHeadersSchema,
  teamQuerySchema,
  uploadHeadersSchema,
} from "../src/features/artifacts/schema";

const validUuid = "3fa85f64-5717-4562-b3fc-2c963f66afa6";

describe("artifactHashSchema", () => {
  it("accepts lowercase hex hashes", () => {
    expect(v.parse(artifactHashSchema, "abc123")).toBe("abc123");
  });

  it("accepts uppercase hex hashes", () => {
    expect(v.parse(artifactHashSchema, "ABC123")).toBe("ABC123");
  });

  it("rejects non-hex characters", () => {
    expect(() => v.parse(artifactHashSchema, "not-a-hash!")).toThrow();
  });

  it("rejects empty strings", () => {
    expect(() => v.parse(artifactHashSchema, "")).toThrow();
  });
});

describe("teamQuerySchema", () => {
  it("accepts an empty query", () => {
    expect(v.parse(teamQuerySchema, {})).toStrictEqual({});
  });

  it("accepts teamId and slug", () => {
    const query = v.parse(teamQuerySchema, {
      slug: "acme",
      teamId: "team_1",
    });

    expect(query).toStrictEqual({ slug: "acme", teamId: "team_1" });
  });

  it("rejects non-string values", () => {
    expect(() => v.parse(teamQuerySchema, { teamId: 42 })).toThrow();
  });
});

describe("clientHeadersSchema", () => {
  it("accepts missing headers", () => {
    expect(v.parse(clientHeadersSchema, {})).toStrictEqual({});
  });

  it("coerces the interactive header into a number", () => {
    const headers = v.parse(clientHeadersSchema, {
      "x-artifact-client-interactive": "1",
    });

    expect(headers["x-artifact-client-interactive"]).toBe(1);
  });

  it("rejects interactive values other than 0 and 1", () => {
    expect(() =>
      v.parse(clientHeadersSchema, { "x-artifact-client-interactive": "2" }),
    ).toThrow();
  });

  it("rejects CI names longer than 50 characters", () => {
    expect(() =>
      v.parse(clientHeadersSchema, { "x-artifact-client-ci": "c".repeat(51) }),
    ).toThrow();
  });
});

describe("uploadHeadersSchema", () => {
  it("coerces content-length into a non-negative integer", () => {
    const headers = v.parse(uploadHeadersSchema, { "content-length": "42" });

    expect(headers["content-length"]).toBe(42);
  });

  it("rejects a missing content-length", () => {
    expect(() => v.parse(uploadHeadersSchema, {})).toThrow();
  });

  it("rejects a negative content-length", () => {
    expect(() =>
      v.parse(uploadHeadersSchema, { "content-length": "-1" }),
    ).toThrow();
  });

  it("rejects a non-integer content-length", () => {
    expect(() =>
      v.parse(uploadHeadersSchema, { "content-length": "1.5" }),
    ).toThrow();
  });

  it("accepts optional artifact metadata headers", () => {
    const headers = v.parse(uploadHeadersSchema, {
      "content-length": "10",
      "x-artifact-dirty-hash": "dirty",
      "x-artifact-duration": "250",
      "x-artifact-sha": "deadbeef",
      "x-artifact-tag": "tag",
    });

    expect(headers).toStrictEqual({
      "content-length": 10,
      "x-artifact-dirty-hash": "dirty",
      "x-artifact-duration": 250,
      "x-artifact-sha": "deadbeef",
      "x-artifact-tag": "tag",
    });
  });

  it("rejects artifact tags longer than 600 characters", () => {
    expect(() =>
      v.parse(uploadHeadersSchema, {
        "content-length": "10",
        "x-artifact-tag": "t".repeat(601),
      }),
    ).toThrow();
  });
});

describe("artifactQueryRequestSchema", () => {
  it("accepts a non-empty list of hashes", () => {
    expect(
      v.parse(artifactQueryRequestSchema, { hashes: ["abc", "def"] }),
    ).toStrictEqual({ hashes: ["abc", "def"] });
  });

  it("rejects an empty list of hashes", () => {
    expect(() => v.parse(artifactQueryRequestSchema, { hashes: [] })).toThrow();
  });

  it("rejects a missing hashes field", () => {
    expect(() => v.parse(artifactQueryRequestSchema, {})).toThrow();
  });
});

describe("cacheEventSchema", () => {
  it("accepts a valid HIT event", () => {
    const event = v.parse(cacheEventSchema, {
      duration: 120,
      event: "HIT",
      hash: "abc123",
      sessionId: validUuid,
      source: "REMOTE",
    });

    expect(event).toStrictEqual({
      duration: 120,
      event: "HIT",
      hash: "abc123",
      sessionId: validUuid,
      source: "REMOTE",
    });
  });

  it("accepts an event without an optional duration", () => {
    const event = v.parse(cacheEventSchema, {
      event: "MISS",
      hash: "abc123",
      sessionId: validUuid,
      source: "LOCAL",
    });

    expect(event.duration).toBeUndefined();
  });

  it("rejects unknown event types", () => {
    expect(() =>
      v.parse(cacheEventSchema, {
        event: "EVT",
        hash: "abc123",
        sessionId: validUuid,
        source: "REMOTE",
      }),
    ).toThrow();
  });

  it("rejects unknown sources", () => {
    expect(() =>
      v.parse(cacheEventSchema, {
        event: "HIT",
        hash: "abc123",
        sessionId: validUuid,
        source: "CACHE",
      }),
    ).toThrow();
  });

  it("rejects malformed session ids", () => {
    expect(() =>
      v.parse(cacheEventSchema, {
        event: "HIT",
        hash: "abc123",
        sessionId: "nope",
        source: "REMOTE",
      }),
    ).toThrow();
  });

  it("rejects negative durations", () => {
    expect(() =>
      v.parse(cacheEventSchema, {
        duration: -1,
        event: "HIT",
        hash: "abc123",
        sessionId: validUuid,
        source: "REMOTE",
      }),
    ).toThrow();
  });
});

describe("cacheEventsSchema", () => {
  it("accepts an array of events", () => {
    const events = v.parse(cacheEventsSchema, [
      {
        event: "HIT",
        hash: "abc123",
        sessionId: validUuid,
        source: "REMOTE",
      },
      {
        event: "MISS",
        hash: "def456",
        sessionId: validUuid,
        source: "LOCAL",
      },
    ]);

    expect(events).toHaveLength(2);
  });

  it("rejects non-array bodies", () => {
    expect(() => v.parse(cacheEventsSchema, { event: "HIT" })).toThrow();
  });
});
