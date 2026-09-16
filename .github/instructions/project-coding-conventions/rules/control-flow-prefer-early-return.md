---
title: Prefer early returns
---

# Prefer early returns

Handle exceptional or invalid conditions at the top of a function with guard clauses that return immediately, then write the main logic as a linear "happy path" with no wrapping. This keeps the common case at the lowest indentation level, avoids tracking state across branches, and makes the function's preconditions obvious at a glance.

**Incorrect (happy path wrapped in a condition):**

```ts
function processOrder(order: Order | null) {
  if (order) {
    if (order.items.length > 0) {
      charge(order);
      ship(order);
      return "processed";
    }
    return "empty";
  }
  return "invalid";
}
```

**Correct (guard clauses, linear happy path):**

```ts
function processOrder(order: Order | null) {
  if (!order) {
    return "invalid";
  }

  if (order.items.length === 0) {
    return "empty";
  }

  charge(order);
  ship(order);

  return "processed";
}
```

**Correct (early return for a computed value):**

```ts
function shippingCost(order: Order) {
  if (order.total >= 100) {
    return 0;
  }

  return 5;
}
```

Notes:

- Guard clauses should assert the negative/exceptional case first (`if (!user) return;`), leaving the main logic unindented.
- Prefer returning a value directly over assigning to a mutable variable and returning it at the end.
- For simple two-way value selection, a ternary is acceptable — see [control-flow-no-else](./control-flow-no-else.md).
- Combine related conditions with `&&` / `||` instead of stacking multiple guards — see [control-flow-no-nested-if](./control-flow-no-nested-if.md).
- This rule applies to functions; in loops, use `continue` / `break` for the same flattening effect.
