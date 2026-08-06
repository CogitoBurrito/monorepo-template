---
title: Use useTransition for Expensive UI Updates Before Debounce
---

## Use useTransition for Expensive UI Updates Before Debounce

If typing feels slow because a render or client-side filter is expensive, prefer `useTransition` before reaching for debounce. Transitions mark the expensive update as non-urgent so React can keep the input responsive.

**Incorrect (delays UI with debounce even though the real problem is render cost):**

```tsx
const handleChange = debounce((value: string) => {
  setFilteredItems(filterItems(allItems, value));
}, 250);
```

**Correct (urgent input, non-urgent derived update):**

```tsx
const [query, setQuery] = useState("");
const [filteredItems, setFilteredItems] = useState(allItems);
const [isPending, startTransition] = useTransition();

function handleChange(value: string) {
  setQuery(value);

  startTransition(() => {
    setFilteredItems(filterItems(allItems, value));
  });
}
```

Use debounce when you need to reduce request rate or suppress repeated side effects. Use transitions when the problem is expensive rendering or derived client-side work.

Reference: [useTransition](https://react.dev/reference/react/useTransition)
