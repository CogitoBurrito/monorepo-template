---
title: Use `satisfies` to validate shapes without changing inference
---

# Use `satisfies` to validate shapes without changing inference

`satisfies` verifies that a value conforms to a target shape without replacing its more precise inferred type. Unlike a type assertion, it keeps contract checking enabled.

**Incorrect (type assertion skips contract checking):**
```ts
type RouteConfig = {
  path: string
  requiresAuth: boolean
}

const applicationRoute = {
  path: '/application',
  requiresAuth: true,
} as RouteConfig
```

**Correct (checks the contract without changing inference):**
```ts
type RouteConfig = {
  path: string
  requiresAuth: boolean
}

const applicationRoute = {
  path: '/application',
  requiresAuth: true,
} satisfies RouteConfig

// applicationRoute.path is still inferred as string from the object itself,
// while TypeScript also verifies the RouteConfig contract.
```

Use [`as const`](types-as-const.md) when you also need literal values and readonly arrays or objects.
