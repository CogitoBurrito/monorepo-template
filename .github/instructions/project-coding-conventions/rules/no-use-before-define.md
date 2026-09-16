---
title: No use before define
---

# No use before define

Every binding must be declared before it is used. Do not rely on function declaration hoisting to call a function that appears later in the file. Code should read top-to-bottom: helpers first, callers after. This keeps the execution order obvious, avoids temporal dead zone errors for `const`/`let`, and makes refactoring safer.

**Incorrect (helper used before it is defined):**

```ts
export const artifactService = {
  query: async (team: string, hashes: readonly string[]) => {
    const summaries = await artifactRepo.findSummaries(team, hashes);
    return Object.fromEntries(
      Object.entries(summaries).map(([hash, summary]) => [
        hash,
        summary === undefined ? undefined : toQueryInfo(summary),
      ]),
    );
  },
};

function toQueryInfo(summary: ArtifactSummary) {
  return {
    ...(summary.tag !== undefined && { tag: summary.tag }),
    size: summary.size,
    taskDurationMs: summary.duration,
  };
}
```

**Correct (helper defined before its first use):**

```ts
function toQueryInfo(summary: ArtifactSummary) {
  return {
    ...(summary.tag !== undefined && { tag: summary.tag }),
    size: summary.size,
    taskDurationMs: summary.duration,
  };
}

export const artifactService = {
  query: async (team: string, hashes: readonly string[]) => {
    const summaries = await artifactRepo.findSummaries(team, hashes);
    return Object.fromEntries(
      Object.entries(summaries).map(([hash, summary]) => [
        hash,
        summary === undefined ? undefined : toQueryInfo(summary),
      ]),
    );
  },
};
```
