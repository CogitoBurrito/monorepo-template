---
name: array-flatmap
---

# Use .flatMap() for map + flatten operations

`.flatMap()` combines mapping and flattening into a single pass and is clearer than chaining `.map().flat()` or using map+filter pipelines.

Incorrect
```ts
const arr = [1, 2, 3]
const fn = (n: number) => [n, n * 2]
const res = arr.map(fn).flat()
// or
const resFiltered = arr.map(fn).filter(Boolean)
```

Correct
```ts
const arr = [1, 2, 3]
const res = arr.flatMap((n: number) => [n, n * 2])
```
