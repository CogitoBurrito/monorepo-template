---
name: array-fromasync
---

# Use Array.fromAsync() to collect async iterables

`Array.fromAsync()` is the direct way to gather all items from an async iterable into an array. It is clearer than a manual `for await...of` push loop.

**Incorrect (manual collection loop):**
```ts
const items: Item[] = []

for await (const item of fetchPages()) {
  items.push(item)
}
```

**Correct (collects async iterable directly):**
```ts
const items = await Array.fromAsync(fetchPages())
```

Notes: Keep a manual loop only when you need side effects, early exits, or incremental processing. If the runtime does not support `Array.fromAsync()`, use a polyfill or a small helper.
