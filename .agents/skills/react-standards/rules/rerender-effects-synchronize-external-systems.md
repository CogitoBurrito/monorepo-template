---
title: Treat useEffect as Synchronization, Not Lifecycle
---

## Treat useEffect as Synchronization, Not Lifecycle

`useEffect` is for synchronizing React state with something outside React. It is not a generic replacement for `componentDidMount`, and it should not be the default place to put application logic.

Use an effect when you are connecting to an external system such as:

- a WebSocket or subscription
- a browser API like `IntersectionObserver`
- DOM measurement or imperative widget setup
- a timer that must be started and cleaned up

Do not reach for an effect when you are:

- deriving data from props or state
- responding to a click, submit, or change event
- resetting state that should be keyed instead
- fetching data that belongs in TanStack Query or a similar data layer

**Incorrect (logic parked in an effect because the component mounted):**

```tsx
useEffect(() => {
  if (submitted) {
    performSearch(query);
  }
}, [submitted, query]);
```

**Correct (logic lives where the event happens):**

```tsx
function handleSubmit(event: FormEvent) {
  event.preventDefault();
  performSearch(query);
}
```

For a fuller decision tree, see the companion rule on avoiding unnecessary effects.

Reference: [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)
