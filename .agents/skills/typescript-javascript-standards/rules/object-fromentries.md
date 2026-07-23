---
name: object-fromentries
---

# Prefer Object.fromEntries() or spread over Object.assign()

Object spread (`{...a, ...b}`) and `Object.fromEntries()` are more idiomatic, easier to type, and play nicer with immutability compared to `Object.assign()`.

Incorrect
```ts
const a = { x: 1 }
const b = { y: 2 }
const merged = Object.assign({}, a, b)
```

Correct (spread)
```ts
const a = { x: 1 }
const b = { y: 2 }
const merged = { ...a, ...b }
```

Correct (from entries)
```ts
const entries = [['k', 1], ['x', 2]] satisfies [string, number][]
const obj = Object.fromEntries(entries);
```
