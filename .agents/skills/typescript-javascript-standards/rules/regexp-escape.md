---
name: regexp-escape
---

# Use RegExp.escape() for user-controlled regex input

`RegExp.escape()` is the standard way to safely embed arbitrary text inside a regular expression. Custom escape helpers are easy to get subtly wrong.

**Incorrect (custom escaping is fragile):**
```ts
function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const pattern = new RegExp(escapeRegex(userInput))
```

**Correct (uses standard regex escaping):**
```ts
const pattern = new RegExp(RegExp.escape(userInput))
```

Notes: Use this whenever part of the pattern comes from outside the codebase. If the runtime lacks `RegExp.escape()`, use a polyfill rather than duplicating a custom helper in application code.
