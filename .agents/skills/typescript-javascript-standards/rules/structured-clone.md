---
name: structured-clone
---

# Use structuredClone() for deep cloning

`structuredClone()` performs deep cloning of serializable values, is typically faster and clearer than `JSON.parse(JSON.stringify(...))`, and preserves types like Dates, Maps, Sets, and typed arrays. Avoid `JSON`-based cloning unless you intentionally need the serialization behavior or must handle circular refs with a custom solution.

Incorrect
```ts
type Data = { a: number; d?: Date }
const obj: Data = { a: 1, d: new Date() }
const copy = JSON.parse(JSON.stringify(obj))
```

Correct
```ts
type Data = { a: number; d?: Date }
const obj: Data = { a: 1, d: new Date() }
const copy = structuredClone(obj)
```

Notes: `structuredClone` will throw for non-clonable values (like functions, DOM nodes). For circular references or custom behavior use a dedicated library.
