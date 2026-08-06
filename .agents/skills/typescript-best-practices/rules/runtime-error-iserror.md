---
title: Use Error.isError() instead of instanceof Error
---

# Use Error.isError() instead of instanceof Error

`Error.isError()` works across realms. `instanceof Error` can fail for errors created in other workers, iframes, or VM contexts.

**Incorrect (fails across realms):**
```ts
if (caughtValue instanceof Error) {
  logger.error(caughtValue.message)
}
```

**Correct (checks errors across realms):**
```ts
if (Error.isError(caughtValue)) {
  logger.error(caughtValue.message)
}
```

Notes: Prefer this especially in shared libraries or code that crosses runtime boundaries. If the runtime does not expose `Error.isError()`, use a vetted compatibility helper instead of raw `instanceof` checks in reusable code.
