---
name: arrays-array-some-existence
---

# Use .some() for existence checks

`.some()` stops on the first match and expresses intent — check if any element satisfies a predicate.

Incorrect

```ts
if (arr.filter(x => predicate(x)).length > 0) {
  // found
}
```

Correct
```ts
if (arr.some(x => predicate(x))) {
  // found
}
```
