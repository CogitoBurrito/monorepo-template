---
title: Before Writing useEffect, Verify It's Needed
tags: rerender, useEffect, effects, event-handlers, derived-state, external-systems
---

## Before Writing useEffect

Every time you are about to write a `useEffect`, stop and answer this question:

**Is this syncing with an external system?**

External systems include WebSockets, browser APIs like `IntersectionObserver` and `navigator.onLine`, third-party libraries such as map SDKs or chart widgets, DOM measurements, and `setInterval` timers.

Not external systems: props, state, values derived from props or state, and user events like clicks, form submissions, or changes.

If the answer is no, do not write the effect. Use the decision tree below to pick the right alternative.

## Decision Tree

Before writing the effect, check each case in order.

### 1. Am I transforming or deriving data?

Compute it inline. No state, no effect.

**Incorrect (stores derived data in state):**

```tsx
const [filtered, setFiltered] = useState([])

useEffect(() => {
  setFiltered(data.filter((item) => item.active))
}, [data])
```

**Correct (derives during render):**

```tsx
const filtered = data.filter((item) => item.active)

// If genuinely expensive and not using React Compiler:
const filtered = useMemo(() => data.filter((item) => item.active), [data])
```

### 2. Am I responding to a user event?

Put the logic in the event handler. Effects respond to renders, not to user actions.

**Incorrect (models an event as render state):**

```tsx
useEffect(() => {
  if (submitted) {
    performSearch(query)
    setSubmitted(false)
  }
}, [submitted, query])
```

**Correct (runs logic in the handler):**

```tsx
function handleSubmit(event: FormEvent) {
  event.preventDefault()
  performSearch(query)
}
```

### 3. Am I resetting state when a prop changes?

Use the `key` prop to let React unmount and remount the component with fresh state.

**Incorrect (patches state after prop changes):**

```tsx
useEffect(() => {
  setComment('')
}, [userId])
```

**Correct (resets by component identity):**

```tsx
<UserProfile key={userId} userId={userId} />
```

### 4. Am I fetching data?

Use TanStack Query or a similar library. If you must use `useEffect`, always add cleanup to ignore stale responses.

**Preferred:**

```tsx
const { data, isLoading, error } = useQuery({
  queryKey: ['user', userId],
  queryFn: () => fetchUser(userId),
})
```

**If an effect is unavoidable:**

```tsx
useEffect(function fetchUserData() {
  let ignore = false

  fetchUser(userId).then((data) => {
    if (!ignore) {
      setUser(data)
    }
  })

  return function ignoreStaleUserData() {
    ignore = true
  }
}, [userId])
```

### 5. Am I notifying a parent component?

Call the parent's callback directly in the event handler alongside `setState`. React batches both updates into one render.

**Incorrect (notifies parent after render):**

```tsx
useEffect(() => {
  onChange(isOn)
}, [isOn, onChange])
```

**Correct (batches updates in the handler):**

```tsx
function handleClick() {
  const next = !isOn
  setIsOn(next)
  onChange(next)
}
```

### 6. Am I chaining multiple effects?

Move the cascade into a single event handler. Derive what you can during render.

**Incorrect (chains effects through state):**

```tsx
useEffect(() => {
  setCity('')
}, [country])

useEffect(() => {
  setDistrict('')
}, [city])

useEffect(() => {
  setShippingCost(calculateShipping(country, city, district))
}, [country, city, district])
```

**Correct (handles the transition once):**

```tsx
function handleCountryChange(newCountry: string) {
  setCountry(newCountry)
  setCity('')
  setDistrict('')
}

const shippingCost = country && city && district
  ? calculateShipping(country, city, district)
  : 0
```

### 7. Am I subscribing to an external store?

Use `useSyncExternalStore` instead of manually wiring subscriptions with `useEffect`.

**Incorrect (manually wires external store state):**

```tsx
useEffect(() => {
  const handleStatusChange = () => setIsOnline(navigator.onLine)
  window.addEventListener('online', handleStatusChange)
  window.addEventListener('offline', handleStatusChange)

  return () => {
    window.removeEventListener('online', handleStatusChange)
    window.removeEventListener('offline', handleStatusChange)
  }
}, [])
```

**Correct (uses React's external store API):**

```tsx
function subscribe(callback: () => void) {
  window.addEventListener('online', callback)
  window.addEventListener('offline', callback)

  return () => {
    window.removeEventListener('online', callback)
    window.removeEventListener('offline', callback)
  }
}

const isOnline = useSyncExternalStore(subscribe, () => navigator.onLine, () => true)
```

## When useEffect is correct

If none of the cases above apply and the answer to "Is this an external system?" is genuinely yes, then `useEffect` is the right tool. Common examples include:

- WebSocket connections that open on mount and close on unmount
- Third-party widget initialization such as maps or rich text editors
- DOM measurements, usually with `useLayoutEffect` before paint
- Browser API subscriptions with cleanup like `IntersectionObserver` or `ResizeObserver`

When writing a valid effect:

- Name the function for readability: `useEffect(function connectToChat() { ... })`
- Always return a cleanup function when subscribing or connecting
- List all dependencies the effect reads from
- Use `useLayoutEffect` when measuring the DOM to avoid flicker

## Rules

- Never write `useEffect(() => setSomething(derivedValue), [dep])`; compute it inline instead.
- Never use `useEffect` to respond to click, submit, or change events.
- Never use `useEffect` to reset state on prop change without considering the `key` prop first.
- Never chain effects where one effect sets state that triggers another effect.
- Always add cleanup functions when subscribing to external systems.
- Always name effect functions for readability.

References:
- [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)
- [Synchronizing with Effects](https://react.dev/learn/synchronizing-with-effects)
- [useSyncExternalStore](https://react.dev/reference/react/useSyncExternalStore)
