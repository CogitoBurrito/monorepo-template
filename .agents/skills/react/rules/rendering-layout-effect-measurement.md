---
title: Use useLayoutEffect for Measurement Before Paint
tags: rendering, useLayoutEffect, measurement, flicker, layout
---

## Use useLayoutEffect for Measurement Before Paint

When you need to measure the DOM and immediately update layout-sensitive state or styles, use `useLayoutEffect` so the browser does not paint an intermediate wrong position.

**Incorrect (measurement after paint can flicker):**

```tsx
useEffect(() => {
  const rect = anchorRef.current?.getBoundingClientRect()
  setPopoverTop(rect ? rect.bottom : 0)
}, [])
```

**Correct (measure and update before paint):**

```tsx
useLayoutEffect(function positionPopover() {
  const rect = anchorRef.current?.getBoundingClientRect()
  setPopoverTop(rect ? rect.bottom : 0)
}, [])
```

Use plain `useEffect` when the work is not layout-sensitive. Reserve `useLayoutEffect` for the narrower case where pre-paint measurement or mutation prevents visible flicker.

Reference: [useLayoutEffect](https://react.dev/reference/react/useLayoutEffect)
