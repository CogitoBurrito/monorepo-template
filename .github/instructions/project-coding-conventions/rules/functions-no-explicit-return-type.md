---
title: Omit explicit return types when they can be inferred
---

# Omit explicit return types when they can be inferred

Do not add explicit return type annotations to functions when TypeScript can infer the return type from the implementation. Inferred return types keep the implementation and its type contract together, reduce repetition, and allow the compiler to catch changes that would otherwise leave a stale annotation behind.

**Incorrect (redundant return type annotation):**

```ts
const getDisplayName = (user: User): string => user.name;

function getTotal(price: number, taxRate: number): number {
  return price + price * taxRate;
}
```

**Correct (return types inferred):**

```ts
const getDisplayName = (user: User) => user.name;

function getTotal(price: number, taxRate: number) {
  return price + price * taxRate;
}
```

Explicit return types are appropriate when TypeScript cannot infer the intended type, when a callback needs a documented boundary, or when a public API must intentionally declare a stable contract. Use them when they communicate a meaningful constraint rather than restating an obvious implementation result.

Use inferred return types by default for functions, methods, and callbacks.
