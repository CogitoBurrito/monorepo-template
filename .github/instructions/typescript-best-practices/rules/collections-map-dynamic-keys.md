---
title: Use `Map` for dynamic key-value collections
---

# Use `Map` for dynamic key-value collections

Use `Map` when keys are dynamic, keys are not limited to strings, or lookup and membership are central to the collection. `Map` avoids prototype-key collisions that can occur with plain objects used as maps.

**Incorrect (uses a plain object as a dynamic map):**
```ts
const key = 'k'
const values: Record<string, number> = {}
values[key] = 1

const value = values[key]
```

**Correct (uses `Map`):**
```ts
const key = 'k'
const values = new Map<string, number>()
values.set(key, 1)

const value = values.get(key)
```

For a fixed set of string keys or data that must serialize directly as JSON, a plain object or `Record` can be the simpler choice.
