---
name: collections-avoid-object-spread-reduce
---

# Avoid object spread in `reduce()` accumulators

Object spread creates and copies a new accumulator on every iteration. For many entries, that can turn a linear reduction into quadratic work.

**Incorrect (copies the accumulator on every iteration):**
```ts
type Entry = { key: string; value: number }
const entries: Entry[] = [
  { key: 'a', value: 1 },
  { key: 'b', value: 2 },
]

const values = entries.reduce(
  (acc, entry) => ({ ...acc, [entry.key]: entry.value }),
  {} as Record<string, number>,
)
```

**Correct (mutates one object accumulator):**
```ts
type Entry = { key: string; value: number }
const entries: Entry[] = [
  { key: 'a', value: 1 },
  { key: 'b', value: 2 },
]

const values = entries.reduce((acc, entry) => {
  acc[entry.key] = entry.value
  return acc
}, {} as Record<string, number>)
```

When the collection needs dynamic key-value semantics, use [`Map`](collections-map-dynamic-keys.md) instead of reducing into an object.
