---
title: Use Stable Keys for Dynamic Lists
tags: rendering, keys, lists, identity, reconciliation
---

## Use Stable Keys for Dynamic Lists

Use stable IDs from your data for list keys. Array indexes break component identity when items are inserted, removed, or reordered, causing state to stick to the wrong item.

**Incorrect (index keys break identity on reorder):**

```tsx
{items.map((item, index) => (
  <TodoRow key={index} item={item} />
))}
```

**Correct (stable key from the data):**

```tsx
{items.map((item) => (
  <TodoRow key={item.id} item={item} />
))}
```

An index key is only acceptable for a truly static list whose order and membership never change.

Reference: [Rendering Lists](https://react.dev/learn/rendering-lists#keeping-list-items-in-order-with-key)
