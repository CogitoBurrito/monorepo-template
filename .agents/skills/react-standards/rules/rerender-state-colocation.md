---
title: Colocate State Near Its Consumers
---

## Colocate State Near Its Consumers

Move state as close as possible to the components that actually use it. Before adding memoization, check whether the real fix is to move the state down so unrelated siblings stop re-rendering.

**Incorrect (high-level state forces unrelated subtree renders):**

```tsx
function SearchPage() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <>
      <Header />
      <SearchBox value={searchTerm} onChange={setSearchTerm} />
      <SearchResults term={searchTerm} />
      <Sidebar />
    </>
  );
}
```

**Correct (state lives at the nearest shared owner):**

```tsx
function SearchFeature() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <>
      <SearchBox value={searchTerm} onChange={setSearchTerm} />
      <SearchResults term={searchTerm} />
    </>
  );
}

function SearchPage() {
  return (
    <>
      <Header />
      <SearchFeature />
      <Sidebar />
    </>
  );
}
```

State colocation often removes the need for `React.memo` or other render workarounds.
