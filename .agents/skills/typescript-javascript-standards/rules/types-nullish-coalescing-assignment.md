---
name: types-nullish-coalescing-assignment
---

# Use Nullish Coalescing Assignment (`??=`) to set defaults safely

`??=` assigns a default only when the left-hand side is `null` or `undefined`, avoiding overwriting valid falsy values.

Incorrect
```ts
const cfg: { timeout?: number } = {}
if (cfg.timeout === undefined || cfg.timeout === null) {
  cfg.timeout = 5000
}
```

Correct
```ts
const cfg: { timeout?: number } = {}
cfg.timeout ??= 5000 // sets only if cfg.timeout is null or undefined
```
