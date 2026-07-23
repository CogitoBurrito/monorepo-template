---
name: array-includes
---

# Use .includes() for membership checks

`.includes()` is more readable than checking `.indexOf(...) !== -1` and expresses intent clearly.

Incorrect
```ts
const arr = ['apple', 'banana']
const item = 'banana'
if (arr.indexOf(item) !== -1) {
	// found
}
```

Correct
```ts
const arr = ['apple', 'banana']
const item = 'banana'
if (arr.includes(item)) {
	// found
}
```
