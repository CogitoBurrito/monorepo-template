---
name: typescript-javascript-standards
description: TypeScript/JavaScript coding standards for maintainable, type-safe, and efficient code. Use when TypeScript/JavaScript implementation, refactoring, code review, modern built-in APIs, type inference, collections, strings, async code, modules, resource management, and runtime APIs are involved.
---
# Project coding standards for TypeScript/JavaScript

TypeScript/JavaScript coding standards. Rules that must be followed for writing efficient, maintainable, and scalable TypeScript/JavaScript code.

## Quick Reference of Rules

### Collections & Objects

| Rule | Guidance |
| --- | --- |
| [structured-clone](rules/structured-clone.md) | Use `structuredClone()` for deep cloning instead of `JSON.parse(JSON.stringify())` |
| [set-unique-values](rules/set-unique-values.md) | Use `Set` when values must be unique or membership checks are central |
| [map-dynamic-keys](rules/map-dynamic-keys.md) | Use `Map` for dynamic key-value collections |
| [map-get-or-insert](rules/map-get-or-insert.md) | Use `Map.prototype.getOrInsert()` and `getOrInsertComputed()` instead of open-coded lookup-or-initialize branches and eager expensive defaults |
| [set-methods](rules/set-methods.md) | Use native `Set` composition and relationship methods instead of manual loops |
| [object-fromentries](rules/object-fromentries.md) | Prefer `Object.fromEntries()` or object spread for merging/transforming entries instead of `Object.assign()` |
| [object-groupby](rules/object-groupby.md) | Use `Object.groupBy()` for grouping arrays by key when available, with appropriate type handling |
| [object-hasown](rules/object-hasown.md) | Use `Object.hasOwn()` for safe property existence checks |
| [avoid-object-spread-reduce](rules/avoid-object-spread-reduce.md) | Avoid copying accumulators with object spread inside `reduce()` |

### Arrays & Iteration

| Rule | Guidance |
| --- | --- |
| [array-at](rules/array-at.md) | Use `Array.prototype.at()` for safe indexed access (e.g. `arr.at(-1)` for last element) |
| [array-includes](rules/array-includes.md) | Use `.includes()` for membership checks instead of `.indexOf() !== -1` |
| [array-flatmap](rules/array-flatmap.md) | Use `.flatMap()` for map+flatten operations instead of `.map().filter()` pipelines |
| [array-some-existence](rules/array-some-existence.md) | Use `.some()` for existence checks instead of `.filter().length > 0` |
| [every-universal](rules/every-universal.md) | Use `.every()` for universal condition checks instead of `.filter().length === 0` |
| [for-of-iteration](rules/for-of-iteration.md) | Prefer `for...of` for array/iterable iteration over C-style loops or `forEach` |
| [iterator-helpers](rules/iterator-helpers.md) | Use `Iterator.from()`, iterator helpers, and `Iterator.concat()` for lazy iterator pipelines |

### Type Safety & Nullish Values

| Rule | Guidance |
| --- | --- |
| [as-const](rules/as-const.md) | Use `as const` to preserve literal types and readonly values |
| [satisfies](rules/satisfies.md) | Use `satisfies` to validate object shapes without changing inference |
| [optional-chaining](rules/optional-chaining.md) | Use Optional Chaining (`?.`) to safely access nested properties without verbose guards |
| [nullish-coalescing](rules/nullish-coalescing.md) | Use Nullish Coalescing (`??`) when you need a default only for `null` or `undefined` |
| [nullish-coalescing-assignment](rules/nullish-coalescing-assignment.md) | Use Nullish Coalescing Assignment (`??=`) to set defaults without overwriting existing non-nullish values |

### Strings & Regular Expressions

| Rule | Guidance |
| --- | --- |
| [string-replaceall](rules/string-replaceall.md) | Use `String.prototype.replaceAll()` for global replacements instead of regex replace hacks |
| [substring-slice](rules/substring-slice.md) | Prefer `.substring()`/`.slice()` for predictable string slicing |
| [regexp-escape](rules/regexp-escape.md) | Use `RegExp.escape()` for user-controlled regex input |

### Async, Modules & Resources

| Rule | Guidance |
| --- | --- |
| [array-fromasync](rules/array-fromasync.md) | Use `Array.fromAsync()` to collect async iterables into arrays |
| [promise-try](rules/promise-try.md) | Use `Promise.try()` when a function may return synchronously, asynchronously, or throw |
| [explicit-resource-management](rules/explicit-resource-management.md) | Use `using` and `await using` for resource cleanup when disposers are available |
| [import-defer](rules/import-defer.md) | Use `import defer` for heavy rarely-used modules when supported |
| [json-import-attributes](rules/json-import-attributes.md) | Use import attributes for JSON modules |

### Runtime APIs

| Rule | Guidance |
| --- | --- |
| [error-iserror](rules/error-iserror.md) | Use `Error.isError()` instead of `instanceof Error` across realms |
| [temporal](rules/temporal.md) | Use `Temporal` for new date and time logic instead of legacy `Date`-heavy patterns or date libraries |
| [math-sumprecise](rules/math-sumprecise.md) | Use `Math.sumPrecise()` for accurate floating-point summation |
| [uint8array-encoding](rules/uint8array-encoding.md) | Use `Uint8Array` base64 and hex helpers for byte encoding |


## How to Use

If detailed explanations and code examples are needed, read individual rule file.

Each rule file contains:
- Brief explanation of why it matters
- Incorrect code example with explanation
- Correct code example with explanation
- Additional context and references
