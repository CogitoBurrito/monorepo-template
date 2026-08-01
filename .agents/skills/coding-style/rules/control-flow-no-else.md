---
title: Avoid `else` statements
---

# Avoid `else` statements

Don't write `else` or `else if` branches. An `else` forces the reader to track two arms of a branch and adds needless nesting. Returning early keeps control flow linear: once a condition is handled, the rest of the function runs on the "happy path". For simple value assignments, use a ternary instead of `if`/`else`.

**Incorrect (else after return):**

```ts
function statusLabel(status: Status) {
  if (status === "active") {
    return "Active";
  } else {
    return "Inactive";
  }
}
```

**Correct (early return):**

```ts
function statusLabel(status: Status) {
  if (status === "active") {
    return "Active";
  }

  return "Inactive";
}
```

**Correct (ternary for a simple assignment):**

```ts
const label = status === "active" ? "Active" : "Inactive";
```

**Correct (lookup map instead of else-if chains):**

```ts
const LABELS = {
  active: "Active",
  inactive: "Inactive",
  pending: "Pending",
} satisfies Record<Status, string>;

const label = LABELS[status];
```

Notes:

- Guard-clause first: handle the exceptional case and return, then continue with the main logic.
- If both branches assign different values and the logic is simple, prefer a ternary.
- For multi-branch dispatch, prefer a `switch` statement or a lookup map over `else if` chains.
- `switch` statements are allowed — this rule targets the `else` keyword, not `switch` cases.
