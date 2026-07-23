---
name: collections-object-groupby
---

# Use Object.groupBy() for grouping arrays by key

`Object.groupBy()` (when available) provides a concise, expressive API for grouping values by a key function. If not available in your runtime, prefer a small helper or `Array.prototype.reduce`.

Incorrect
```ts
type Item = { type: string; [key: string]: unknown };

const grouped = (arr as Item[]).reduce((acc: Record<string, Item[]>, item: Item) => {
  const k = item.type;
  acc[k] = acc[k] || [];
  acc[k].push(item);
  return acc;
}, {} as Record<string, Item[]>);
```

Correct
```ts
type Item = { type: string };

// arr: Item[]
const grouped = Object.groupBy(arr as Item[], (x: Item) => x.type) as Record<string, Item[]>;
```

Notes: Type systems may need explicit typing for the result shape. For older runtimes, use `lodash.groupBy` or a typed `reduce` helper.
