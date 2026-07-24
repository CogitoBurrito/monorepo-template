---
title: Prefer `.substring()`/`.slice()` for predictable string slicing
---

# Prefer `.substring()`/`.slice()` for predictable string slicing

`.substring()` and `.slice()` are standard, well-understood APIs for extracting substrings. Avoid deprecated `.substr()`.

Incorrect
```ts
const str = 'hello world'
const part = str.substr(1, 3) // substr is deprecated in some environments
```

Correct
```ts
const str = 'hello world'
const part = str.substring(1, 4)
// or
const part2 = str.slice(1, 4)
```
