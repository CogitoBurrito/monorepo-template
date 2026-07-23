---
name: math-sumprecise
---

# Use Math.sumPrecise() for floating-point sums

`Math.sumPrecise()` avoids accumulated floating-point drift and handles cases that naive repeated `+` or `reduce()` can get wrong.

**Incorrect (accumulates floating-point drift):**
```ts
const cents = Array(10_000).fill(0.1)
const total = cents.reduce((sum, value) => sum + value, 0)
```

**Correct (uses precise summation):**
```ts
const cents = Array(10_000).fill(0.1)
const total = Math.sumPrecise(cents)
```

Notes: This matters for financial values, long arrays, and cancellation-heavy sums. If `Math.sumPrecise()` is not supported, use a numerically stable summation helper instead of a plain reduction.
