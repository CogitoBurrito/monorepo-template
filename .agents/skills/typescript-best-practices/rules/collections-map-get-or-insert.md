---
title: Use Map.getOrInsert() for lookup-or-initialize patterns
---

# Use Map.getOrInsert() for lookup-or-initialize patterns

`Map.prototype.getOrInsert()` expresses the common lookup-or-initialize pattern directly and avoids repeated `has()` and `get()` calls. Use `getOrInsertComputed()` when the default value is expensive and should only be computed on a cache miss.

**Incorrect (open-codes `has()`/`get()`/`set()` logic):**
```ts
if (map.has(key)) {
  return map.get(key)
}

map.set(key, defaultValue)
return defaultValue
```

**Correct (uses `getOrInsert()` directly):**
```ts
return map.getOrInsert(key, defaultValue)
```

**Incorrect (uses `??` for map initialization):**
```ts
map.set(key, map.get(key) ?? defaultValue)
```

**Correct (preserves stored `null` and `undefined` values):**
```ts
map.getOrInsert(key, defaultValue)
```

**Correct (initializes and reuses a mutable default):**
```ts
map.getOrInsert(key, []).push(value)
```

**Incorrect (eagerly computes an expensive default):**
```ts
const user = cache.getOrInsert(userId, expensiveLookup(userId))
```

**Correct (computes the default lazily):**
```ts
const user = cache.getOrInsertComputed(userId, () => expensiveLookup(userId))
```

Notes: These APIs are available on `Map` and `WeakMap`.
