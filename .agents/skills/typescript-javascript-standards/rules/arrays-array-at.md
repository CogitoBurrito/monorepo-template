---
name: arrays-array-at
---

# Use Array.prototype.at() for indexed access

`arr.at(index)` is clearer for negative indices (e.g. `arr.at(-1)` for last element) and avoids off-by-one indexing expressions.

Incorrect
```ts
const arr = [1, 2, 3]
const last = arr[arr.length - 1]
```

Correct
```ts
const arr = [1, 2, 3]
const last = arr.at(-1) ?? null
```
