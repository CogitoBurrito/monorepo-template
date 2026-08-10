---
title: Prefer the `function` keyword for top-level functions
---

# Prefer the `function` keyword for top-level functions

Prefer `function` declarations for top-level and exported functions instead of assigning arrow functions to constants. Function declarations make module-level APIs easy to identify and keep the distinction between public functions and local callbacks clear.

**Incorrect (top-level arrow function):**

```ts
const getDisplayName = (user: User) => user.name;

export const calculateTotal = (price: number, taxRate: number) =>
  price + price * taxRate;
```

**Correct (function keyword):**

```ts
function getDisplayName(user: User) {
  return user.name;
}

export function calculateTotal(price: number, taxRate: number) {
  return price + price * taxRate;
}
```

This rule applies to functions declared at module scope. Functions defined inside another function or component should remain arrow function expressions, as required by `functions-nested-arrow`.

Use the `function` keyword by default for top-level and exported functions; use arrow functions for nested functions, callbacks, and other local function expressions.
