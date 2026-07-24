---
title: Use native Set methods for composition and comparisons
---

# Use native Set methods for composition and comparisons

`Set` now supports native operations like `intersection`, `union`, `difference`, `symmetricDifference`, `isSubsetOf`, `isSupersetOf`, and `isDisjointFrom`. They are clearer and less error-prone than custom loops.

**Incorrect (open-codes set operations):**
```ts
const shared = new Set<string>()

for (const value of frontEnd) {
  if (backEnd.has(value)) {
    shared.add(value)
  }
}
```

**Correct (uses native set methods):**
```ts
const shared = frontEnd.intersection(backEnd)
const allValues = frontEnd.union(backEnd)
const onlyFrontEnd = frontEnd.difference(backEnd)
const noOverlap = frontEnd.isDisjointFrom(backEnd)
```

Notes: These methods accept set-like objects, not just real `Set` instances. If the runtime does not support them, prefer a targeted polyfill rather than reintroducing ad hoc utility code.
