---
name: as-const
---

# Use `as const` to preserve literal types

`as const` keeps literal values narrow and marks arrays and objects as readonly. Use it when a value should define a literal union instead of widening to types like `string`.

**Incorrect (array elements widen to string):**
```ts
const quoteSteps = ['details', 'benefits', 'review']

type QuoteStep = typeof quoteSteps[number]
// string
```

**Correct (preserves a literal union):**
```ts
const quoteSteps = ['details', 'benefits', 'review'] as const

type QuoteStep = typeof quoteSteps[number]
// 'details' | 'benefits' | 'review'
```

When you also need to validate an object's shape without losing its inferred type, use [`satisfies`](satisfies.md).
