---
name: async-promise-try
---

# Use Promise.try() for mixed sync and async code paths

`Promise.try()` normalizes synchronous return values, thrown exceptions, and promise-returning functions into one promise-based flow.

**Incorrect (splits sync and async failures):**
```ts
try {
  const result = thirdParty.doThing()
  Promise.resolve(result).then(processResult).catch(handleFailure)
} catch (error) {
  handleFailure(error)
}
```

**Correct (normalizes to promise flow):**
```ts
Promise.try(() => thirdParty.doThing())
  .then(processResult)
  .catch(handleFailure)
```

Notes: Use this when the callable may be sync, async, or throw. If `Promise.try()` is unavailable in the target runtime, keep the normalization explicit or use a compatible polyfill.
