---
title: Use Activity Component for Show/Hide
---

## Use Activity Component for Show/Hide

Use React's `<Activity>` to preserve state/DOM for expensive components that frequently toggle visibility.

**Usage:**

```tsx
import { Activity } from "react";

function Dropdown({ isOpen }: Props) {
  return (
    <Activity mode={isOpen ? "visible" : "hidden"}>
      <ExpensiveMenu />
    </Activity>
  );
}
```

Avoids expensive re-renders and state loss.

Reference: [React Activity component](https://react.dev/reference/react/Activity)
