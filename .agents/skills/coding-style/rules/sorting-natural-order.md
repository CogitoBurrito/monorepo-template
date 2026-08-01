---
title: Use natural sort order for perfectionist sort rules
---

# Use natural sort order for perfectionist sort rules

Configure every `eslint-plugin-perfectionist` sort rule with `type: 'natural'` and `order: 'asc'`. Natural sort order treats embedded numbers as whole numeric values, so `item2` sorts before `item10`. Lexicographical (alphabetical) order compares character by character, placing `item10` before `item2` because `"1" < "2"` — which is counter-intuitive for humans. Natural order matches how people expect numbered lists, file names, versions, and identifiers to be sorted. A natural-sorted example for each of the 23 sort rules follows below.

**Incorrect (alphabetical — numbers sort by first digit):**

```ts
// alphabetical: 'file10' < 'file2' because '1' < '2'
const files = ["file10", "file2", "file1"];

// imports are out of human order
import { foo10 } from "./foo10";
import { foo2 } from "./foo2";
```

**Correct (natural — numbers sort by magnitude):**

```ts
const files = ["file1", "file2", "file10"];

import { foo2 } from "./foo2";
import { foo10 } from "./foo10";
```

## Examples by rule

Each example below shows the order the rule enforces with `type: 'natural'` and `order: 'asc'`. Every rule page is linked for reference.

### [sort-array-includes](https://perfectionist.dev/rules/sort-array-includes)

Sorts arrays immediately followed by `.includes()`.

```ts
const getProductCategories = (product) => {
  if (
    [
      "Drone",
      "Headphones",
      "Keyboard",
      "Laptop",
      "Monitor",
      "Mouse",
      "Router",
      "Smartphone",
      "Smartwatch",
      "Tablet",
    ].includes(product.name)
  ) {
    return "Electronics";
  }

  return "Unknown";
};
```

### [sort-arrays](https://perfectionist.dev/rules/sort-arrays)

Sorts array elements in arrays matching configured conditions (e.g. `as const` enumerations).

```ts
const ELECTRONICS = [
  "Drone",
  "Headphones",
  "Keyboard",
  "Laptop",
  "Monitor",
  "Mouse",
  "Router",
  "Smartphone",
  "Smartwatch",
  "Tablet",
] as const;
```

### [sort-classes](https://perfectionist.dev/rules/sort-classes)

Sorts class members.

```ts
class User {
  email: string;
  isActive: boolean;
  roles: string[];
  username: string;

  constructor(username: string, email: string, isActive: boolean) {
    this.username = username;
    this.email = email;
    this.isActive = isActive;
    this.roles = [];
  }

  activate() {
    this.isActive = true;
  }

  addRole(role: string) {
    this.roles.push(role);
  }

  deactivate() {
    this.isActive = false;
  }

  setEmail(newEmail: string) {
    this.email = newEmail;
  }
}
```

### [sort-decorators](https://perfectionist.dev/rules/sort-decorators)

Sorts decorators on classes, methods, properties, accessors, and parameters.

```ts
@ApiDescription("Create a new user")
@Authenticated()
@Controller()
@Post("/users")
class CreateUserController {
  @AutoInjected()
  @NotNull()
  userService: UserService;

  createUser(
    @Body()
    @IsNotEmpty()
    @ValidateNested()
    createUserDto: CreateUserDto,
  ): UserDto {
    // ...
  }
}
```

### [sort-enums](https://perfectionist.dev/rules/sort-enums)

Sorts TypeScript enum members.

```ts
enum Priority {
  Critical = "Critical",
  High = "High",
  Low = "Low",
  Medium = "Medium",
  None = "None",
}
```

### [sort-export-attributes](https://perfectionist.dev/rules/sort-export-attributes)

Sorts attributes inside `export ... with { ... }`.

```js
export { data } from "lib" with {
  integrity: "sha256-...",
  mode: "no-cors",
  type: "json",
};
```

### [sort-exports](https://perfectionist.dev/rules/sort-exports)

Sorts `export ... from` declarations.

```js
export { createUser } from "./actions/createUser";
export { deleteUser } from "./actions/deleteUser";
export { fetchUser } from "./actions/fetchUser";
export { updateUser } from "./actions/updateUser";
export { Header } from "./components/Header";
export { MainContent } from "./components/MainContent";
export { Sidebar } from "./components/Sidebar";
export { calculateAge } from "./utils/calculateAge";
```

### [sort-heritage-clauses](https://perfectionist.dev/rules/sort-heritage-clauses)

Sorts `extends` / `implements` clauses.

```ts
interface Interface extends Logged, Pausable, StartupService {
  // ...
}

class Class implements Logged, Pausable, StartupService {
  // ...
}
```

### [sort-import-attributes](https://perfectionist.dev/rules/sort-import-attributes)

Sorts attributes inside `import ... with { ... }`.

```js
import data from "lib" with {
  integrity: "sha256-...",
  mode: "no-cors",
  type: "json",
};
```

### [sort-imports](https://perfectionist.dev/rules/sort-imports)

Sorts import statements by path.

```ts
import express from "express";
import fs from "node:fs/promises";
import path from "node:path";
import passport from "passport";
import User from "~/models/User";
import authRoutes from "~/routes/auth";
import dbConfig from "./db";
```

### [sort-interfaces](https://perfectionist.dev/rules/sort-interfaces)

Sorts interface properties.

> Note: this project prefers `type` aliases over `interface` (see [types-prefer-type](types-prefer-type.md)), so in practice `sort-object-types` covers the same ground.

```ts
interface Address {
  apartmentNumber?: string;
  city: string;
  country: string;
  postalCode: string;
  street: string;
}
```

### [sort-intersection-types](https://perfectionist.dev/rules/sort-intersection-types)

Sorts members of intersection (`&`) types.

```ts
type Employee = Address &
  ContactInfo &
  PersonalInfo & {
    employeeId: string;
    isActive: boolean;
  };
```

### [sort-jsx-props](https://perfectionist.dev/rules/sort-jsx-props)

Sorts JSX element props.

```tsx
const AuthForm = ({ handleSubmit, setUsername, t }) => (
  <form action="/auth-user" method="post" onSubmit={handleSubmit}>
    <Input
      color="secondary"
      end={<UserProfileIcon />}
      full
      label={t.username}
      name="user"
      onChange={(event) => setUsername(event.target.value)}
      placeholder={t["enter-username"]}
      size="l"
    />
    <Button color="primary" size="l" type="submit" variant="contained">
      Submit
    </Button>
  </form>
);
```

### [sort-maps](https://perfectionist.dev/rules/sort-maps)

Sorts entries of `Map` objects by key.

```ts
const products = new Map([
  ["keyboard", { name: "Keyboard", price: 50 }],
  ["laptop", { name: "Laptop", price: 1000 }],
  ["monitor", { name: "Monitor", price: 200 }],
  ["mouse", { name: "Mouse", price: 25 }],
]);
```

### [sort-modules](https://perfectionist.dev/rules/sort-modules)

Sorts module-level members (enums, interfaces, types, classes, functions).

```ts
enum CacheType {
  ALWAYS = "ALWAYS",
  NEVER = "NEVER",
}

type FindUserInput = {
  cache: CacheType;
  id: string;
};

function assertInputIsCorrect(input: FindUserInput): void {
  // ...
}

function findUser(input: FindUserInput): FindUserOutput {
  assertInputIsCorrect(input);
  return _findUserByIds([input.id])[0];
}
```

### [sort-named-exports](https://perfectionist.dev/rules/sort-named-exports)

Sorts named exports.

```js
export {
  calculateAge,
  debounce,
  formatDate,
  generateUUID,
  parseQueryString,
  throttle,
} from "./utils";
```

### [sort-named-imports](https://perfectionist.dev/rules/sort-named-imports)

Sorts named imports.

```ts
import {
  createContext,
  useId,
  useLayoutEffect,
  useReducer,
  useRef,
  useState,
} from "react";
```

### [sort-object-types](https://perfectionist.dev/rules/sort-object-types)

Sorts members of `type` object literals.

```ts
type Department = {
  departmentName: string;
  employees: number;
  established: Date;
  head: string;
  location: string;
};
```

### [sort-objects](https://perfectionist.dev/rules/sort-objects)

Sorts object keys.

```ts
const event = {
  description: "Annual conference discussing the latest in technology.",
  location: {
    address: "123 Tech Street",
    state: "CA",
  },
  organizer: {
    email: "charlie.brown@protonmail.com",
    name: "Charlie Brown",
    phone: "555-1234",
  },
  title: "Tech Conference 2023",
};
```

### [sort-sets](https://perfectionist.dev/rules/sort-sets)

Sorts `Set` values.

```ts
const electronics = new Set([
  "Drone",
  "Headphones",
  "Keyboard",
  "Laptop",
  "Monitor",
  "Mouse",
  "Router",
  "Smartphone",
  "Smartwatch",
  "Tablet",
]);
```

### [sort-switch-case](https://perfectionist.dev/rules/sort-switch-case)

Sorts `switch` case statements.

```ts
switch (action.type) {
  case "ADD_USER":
    return {
      ...state,
      users: [...state.users, action.payload],
    };
  case "DELETE_USER":
    return {
      ...state,
      users: state.users.filter((user) => user.id !== action.payload.id),
    };
  case "FETCH_USER_ERROR":
    return {
      ...state,
      loading: false,
      error: action.payload,
    };
  case "FETCH_USER_REQUEST":
    return {
      ...state,
      loading: true,
      error: null,
    };
  case "FETCH_USER_SUCCESS":
    return {
      ...state,
      loading: false,
      currentUser: action.payload,
    };
  default:
    return state;
}
```

### [sort-union-types](https://perfectionist.dev/rules/sort-union-types)

Sorts members of union (`|`) types.

```ts
type UserRole = "admin" | "editor" | "guest" | "user";
type ResponseStatus = "error" | "pending" | "success" | "timeout";
```

### [sort-variable-declarations](https://perfectionist.dev/rules/sort-variable-declarations)

Sorts variables within a declaration scope.

```ts
const API_KEY = "e7c3b6d4-7b7d-4b3b-8b3b-7b3b7b3b7b3b";
const apiUrl = "https://api.perfectionist.dev";
const data = fetchData();
const isAuthenticated = checkAuth();
const user = getCurrentUser();
```

**This repo:** `packages/eslint-config/base.js` already extends `perfectionist.configs['recommended-natural']`, which enables natural sorting in ascending order for all perfectionist rules. Keep that in place and do not override it back to `'alphabetical'`.

**References:**

- [Perfectionist rules](https://perfectionist.dev/rules)
- [recommended-natural config](https://perfectionist.dev/configs/recommended-natural)
- [Natural sort order (Wikipedia)](https://en.wikipedia.org/wiki/Natural_sort_order)
