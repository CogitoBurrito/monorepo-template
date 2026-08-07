---
title: Use JSDoc comment style
---

# Use JSDoc comment style

Document code with JSDoc-style comments (`/** ... */`) for exported functions, types, and non-obvious logic. JSDoc provides structured tags (`@param`, `@returns`, `@throws`) that editors and tools (IntelliSense, TypeDoc, `eslint-plugin-jsdoc`) can parse, keeping documentation consistent and machine-readable.

**Incorrect (unstructured `//` and `/* */` comments):**

```ts
// Returns the user's full name, or 'Unknown' if not set.
// If includeTitle is true, prefixes with the title.
function getDisplayName(user: User, includeTitle = false): string {
  // ...existing code...
}

/*
  Calculates the total price including tax.
*/
function getTotal(price: number, taxRate: number): number {
  // ...existing code...
}
```

**Correct (JSDoc style):**

```ts
/**
 * Returns the user's display name.
 *
 * @param user - The user to format.
 * @param includeTitle - Whether to prefix the name with the title.
 * @returns The formatted display name, or `'Unknown'` if not set.
 */
function getDisplayName(user: User, includeTitle = false): string {
  // ...existing code...
}

/**
 * Calculates the total price including tax.
 *
 * @param price - The base price.
 * @param taxRate - The tax rate (e.g. `0.1` for 10%).
 * @returns The total price rounded to two decimals.
 */
function getTotal(price: number, taxRate: number): number {
  // ...existing code...
}
```

JSDoc comments:

- Start with `/**` and end with `*/`
- Document parameters with `@param name - description`
- Document return values with `@returns description`
- Document thrown errors with `@throws description`
- Surface the docs on hover and in autocomplete

Use JSDoc for exported or non-obvious code. Skip it for trivial, self-explanatory private helpers where it would only add noise.

```

```
