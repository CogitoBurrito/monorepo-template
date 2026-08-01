---
title: Avoid nested `if` statements
---

# Avoid nested `if` statements

Don't nest `if` statements inside other `if` blocks. Every level of nesting multiplies the number of paths through the code, increases cognitive load, and makes functions harder to read, test, and maintain. Flatten nested conditions with guard clauses (early returns), combine independent conditions with `&&` / `||`, or extract the inner logic into a helper function.

**Incorrect (nested ifs):**

```ts
function discountFor(user: User | null, items: Item[]) {
  if (user) {
    if (user.isMember) {
      if (items.length > 10) {
        return 0.2;
      }
      return 0.1;
    }
  }
  return 0;
}
```

**Correct (guard clauses / early returns):**

```ts
function discountFor(user: User | null, items: Item[]) {
  if (!user) {
    return 0;
  }

  if (items.length > 10) {
    return user.isMember ? 0.2 : 0.15;
  }

  return user.isMember ? 0.1 : 0;
}
```

**Also correct (combine conditions that always run together):**

```ts
function canCheckout(user: User | null, cart: Cart) {
  return user !== null && user.isMember && cart.items.length > 0;
}
```

Notes:

- This rule targets nesting, not `if` statements themselves — top-level guard clauses at the start of a function are encouraged.
- If the nesting comes from a loop inside a loop, extract the inner loop into a named helper function.
- Prefer asserting the positive case after early-exiting the negative one.
