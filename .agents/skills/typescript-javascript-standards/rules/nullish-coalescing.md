---
name: nullish-coalescing
---

# Use Nullish Coalescing (`??`) when defaulting only `null`/`undefined`

`??` differentiates between `null`/`undefined` and other falsy values (like ``) so you don't accidentally overwrite meaningful falsy values.

Incorrect
```ts
const input: string | null = ''
const value = input || 'default' // '' becomes 'default' incorrectly
```

Correct
```ts
const input: string | null = ''
const value = input ?? 'default' // '' is preserved; only null/undefined replaced
```
