---
name: for-of-iteration
---

# Prefer for...of for iteration

`for...of` reads clearly and works with all iterables. It avoids index math and is often faster and less error-prone than C-style loops.

Incorrect
```ts
const arr = ['a', 'b', 'c']
function doWork(item: string): void { /* ... */ }

for (let i = 0; i < arr.length; i++) {
  const item = arr[i]
  doWork(item)
}
```

Correct
```ts
const arr = ['a', 'b', 'c']
function doWork(item: string): void { /* ... */ }

for (const item of arr) {
  doWork(item)
}
```

For objects, prefer `for (const [k,v] of Object.entries(obj))` or `for (const k of Object.keys(obj))` depending on need.
