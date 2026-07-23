---
name: every-universal
---

# Use .every() for universal checks

`.every()` clearly expresses that all elements must satisfy a predicate and stops early on failure.

Incorrect
```ts
const arr = [1, 2, 3]
const predicate = (x: number) => x > 0
if (arr.filter(x => !predicate(x)).length === 0) {
  // all satisfy predicate
}
```

Correct
```ts
const arr = [1, 2, 3]
const predicate = (x: number) => x > 0
if (arr.every(x => predicate(x))) {
  // all satisfy predicate
}
```
