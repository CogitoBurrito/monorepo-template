---
title: Use `type` instead of `interface`
---

# Use `type` instead of `interface`

Declare all TypeScript type definitions with `type` aliases instead of `interface`. `type` is the single, uniform syntax for every kind of type — object shapes, unions, intersections, tuples, primitives, and mapped types — while `interface` only describes object shapes and enables declaration merging. Using one syntax keeps declarations consistent, avoids accidental merging, and makes code easier to scan.

**Incorrect (mixes `interface` and `type`):**

```ts
interface User {
  id: number;
  name: string;
}

interface ApiError {
  code: number;
  message: string;
}

// unions can't be expressed with `interface`, so `type` is needed anyway
type ApiResponse = User | ApiError;
```

**Correct (all `type` aliases):**

```ts
type User = {
  id: number;
  name: string;
};

type ApiError = {
  code: number;
  message: string;
};

type ApiResponse = User | ApiError;
```

`interface` allows declaration merging, where multiple declarations of the same name silently combine. This is almost never what you want in application code — with `type`, a duplicate name is a compile error instead.

**Enforce automatically** with `@typescript-eslint/consistent-type-definitions`:

```js
'@typescript-eslint/consistent-type-definitions': ['error', 'type']
```

The only case where `interface` is acceptable is a public library API that intentionally relies on declaration merging for consumers to extend. In this project, prefer `type` everywhere.
