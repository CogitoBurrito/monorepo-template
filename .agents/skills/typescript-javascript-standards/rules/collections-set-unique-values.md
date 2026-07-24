---
title: Use `Set` for unique values and membership checks
---

# Use `Set` for unique values and membership checks

Use `Set` when duplicate values are not allowed or membership checks are central. `Set.add()` ignores duplicate values, and `Set.has()` expresses membership directly.

**Incorrect (an array allows duplicates):**
```ts
const value = 'v'
const values: string[] = []
values.push(value)
values.push(value)
```

**Correct (enforces uniqueness):**
```ts
const value = 'v'
const values = new Set<string>()
values.add(value)
values.add(value)

const isSeen = values.has(value)
const uniqueValues = [...values]
```

Use an array when duplicates are valid, index access matters, or the collection needs to serialize directly as JSON. `Set` preserves insertion order, but it does not provide index access.

For one-time deduplication, `const uniqueValues = [...new Set(values)]` is often enough.
