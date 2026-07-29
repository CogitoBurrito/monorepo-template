---
title: Avoid useMemo for Cheap Calculations
tags: rerender, useMemo, memoization, compiler, simplicity
---

## Avoid useMemo for Cheap Calculations

`useMemo` has a cost: React still runs the hook and compares dependencies on every render. Do not wrap trivial string building, boolean checks, or small arithmetic in `useMemo`.

**Incorrect (memoizing a cheap calculation):**

```tsx
const fullName = useMemo(() => `${firstName} ${lastName}`, [firstName, lastName])
```

**Correct (compute it directly):**

```tsx
const fullName = `${firstName} ${lastName}`
```

Use `useMemo` for genuinely expensive work such as large list transforms, heavy parsing, or object identity that must stay stable for another optimization. Otherwise, keep render logic straightforward and let the React Compiler handle simple cases when available.
