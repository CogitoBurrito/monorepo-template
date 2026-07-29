---
title: Name Your useEffect Functions
tags: rerender, useEffect, readability, debugging, naming
---

## Name Your useEffect Functions

Use named function expressions instead of anonymous arrows in `useEffect`. Named effects communicate intent at a glance, produce meaningful stack traces, and expose effects that do too much or shouldn't exist.

**Incorrect (anonymous arrow — intent hidden):**

```tsx
useEffect(() => {
  const ws = new WebSocket(`wss://inventory.api/ws/${warehouseId}`)
  ws.onopen = () => setConnected(true)
  ws.onclose = () => setConnected(false)
  return () => ws.close()
}, [warehouseId])

useEffect(() => {
  if (!connected) return
  fetch(`/api/warehouses/${warehouseId}/stock?location=${locationId}`)
    .then(res => res.json())
    .then(setStock)
}, [warehouseId, locationId, connected])
```

**Correct (named function expression — intent is immediate):**

```tsx
useEffect(function connectToInventoryWebSocket() {
  const ws = new WebSocket(`wss://inventory.api/ws/${warehouseId}`)
  ws.onopen = () => setConnected(true)
  ws.onclose = () => setConnected(false)
  return () => ws.close()
}, [warehouseId])

useEffect(function fetchInitialStock() {
  if (!connected) return
  fetch(`/api/warehouses/${warehouseId}/stock?location=${locationId}`)
    .then(res => res.json())
    .then(setStock)
}, [warehouseId, locationId, connected])
```

### Naming cleanup functions

When teardown does non-trivial work, name the cleanup function too.

**Incorrect (anonymous cleanup — teardown intent unclear):**

```tsx
useEffect(function pollServerForUpdates() {
  const intervalId = setInterval(() => {
    fetch(`/api/status/${serverId}`)
      .then(res => res.json())
      .then(setServerStatus)
  }, 5000)

  return () => {
    clearInterval(intervalId)
  }
}, [serverId])
```

**Correct (named cleanup — setup and teardown are symmetrical):**

```tsx
useEffect(function pollServerForUpdates() {
  const intervalId = setInterval(() => {
    fetch(`/api/status/${serverId}`)
      .then(res => res.json())
      .then(setServerStatus)
  }, 5000)

  return function stopPollingServer() {
    clearInterval(intervalId)
  }
}, [serverId])
```

### Why it matters

- **Readability:** Scanning function names reveals the entire data flow without reading implementation.
- **Debugging:** Named functions produce stack traces like `at connectToInventoryWebSocket @ Component.tsx:14` instead of `at (anonymous)`.
- **Design signal:** If you can't name an effect without "and" or "also", it should be split. If the best name sounds like state shuffling (`syncDerivedValue`), it probably shouldn't be an effect at all.

