---
title: Use Keyed Resets When Component Identity Changes
tags: rerender, key, reset, identity, state
---

## Use Keyed Resets When Component Identity Changes

If a component's local state is entirely tied to a single identity such as `userId`, `tabId`, or `stepId`, reset it by keying the component instead of manually syncing state in effects.

**Incorrect (effect keeps patching local state after prop changes):**

```tsx
function UserProfile({ userId }: { userId: string }) {
  const [comment, setComment] = useState('')

  useEffect(() => {
    setComment('')
  }, [userId])
}
```

**Correct (identity change remounts fresh local state):**

```tsx
<UserProfile key={userId} userId={userId} />
```

Use this when the whole local state should reset with the identity. If only part of the state changes, prefer explicit state updates instead of remounting the entire subtree.

Reference: [Preserving and Resetting State](https://react.dev/learn/preserving-and-resetting-state)
