---
applyTo: "**/*.tsx, **/*.ts"
---

# TypeScript Best Practices


## Quick Reference of Rules

### Collections & Objects

| Rule                                                                                      | Guidance                                                                                                                                       |
| ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| [collections-structured-clone](./rules/collections-structured-clone.md)                     | Use `structuredClone()` for deep cloning instead of `JSON.parse(JSON.stringify())`                                                             |
| [collections-set-unique-values](./rules/collections-set-unique-values.md)                   | Use `Set` when values must be unique or membership checks are central                                                                          |
| [collections-map-dynamic-keys](./rules/collections-map-dynamic-keys.md)                     | Use `Map` for dynamic key-value collections                                                                                                    |
| [collections-map-get-or-insert](./rules/collections-map-get-or-insert.md)                   | Use `Map.prototype.getOrInsert()` and `getOrInsertComputed()` instead of open-coded lookup-or-initialize branches and eager expensive defaults |
| [collections-set-methods](./rules/collections-set-methods.md)                               | Use native `Set` composition and relationship methods instead of manual loops                                                                  |
| [collections-object-fromentries](./rules/collections-object-fromentries.md)                 | Prefer `Object.fromEntries()` or object spread for merging/transforming entries instead of `Object.assign()`                                   |
| [collections-object-groupby](./rules/collections-object-groupby.md)                         | Use `Object.groupBy()` for grouping arrays by key when available, with appropriate type handling                                               |
| [collections-object-hasown](./rules/collections-object-hasown.md)                           | Use `Object.hasOwn()` for safe property existence checks                                                                                       |
| [collections-avoid-object-spread-reduce](./rules/collections-avoid-object-spread-reduce.md) | Avoid copying accumulators with object spread inside `reduce()`                                                                                |
| [collections-index-maps](./rules/collections-index-maps.md)                                 | Build Map for repeated lookups                                                                                                                 |
| [collections-set-map-lookups](./rules/collections-set-map-lookups.md)                       | Use Set/Map for O(1) lookups                                                                                                                   |

### Arrays & Iteration

| Rule                                                                | Guidance                                                                                       |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| [arrays-array-at](./rules/arrays-array-at.md)                         | Use `Array.prototype.at()` for safe indexed access (e.g. `arr.at(-1)` for last element)        |
| [arrays-array-includes](./rules/arrays-array-includes.md)             | Use `.includes()` for membership checks instead of `.indexOf() !== -1`                         |
| [arrays-array-flatmap](./rules/arrays-array-flatmap.md)               | Use `.flatMap()` for map+flatten operations instead of `.map().flat()` or map+filter pipelines |
| [arrays-flatmap-filter](./rules/arrays-flatmap-filter.md)             | Use `flatMap` to map and filter in one pass instead of `.map().filter(Boolean)` chains         |
| [arrays-array-some-existence](./rules/arrays-array-some-existence.md) | Use `.some()` for existence checks instead of `.filter().length > 0`                           |
| [arrays-every-universal](./rules/arrays-every-universal.md)           | Use `.every()` for universal condition checks instead of `.filter().length === 0`              |
| [arrays-for-of-iteration](./rules/arrays-for-of-iteration.md)         | Prefer `for...of` for array/iterable iteration over C-style loops                              |
| [arrays-iterator-helpers](./rules/arrays-iterator-helpers.md)         | Use `Iterator.from()`, iterator helpers, and `Iterator.concat()` for lazy iterator pipelines   |
| [arrays-combine-iterations](./rules/arrays-combine-iterations.md)     | Combine multiple filter/map into one loop                                                      |
| [arrays-length-check-first](./rules/arrays-length-check-first.md)     | Check array length before expensive comparison                                                 |
| [arrays-min-max-loop](./rules/arrays-min-max-loop.md)                 | Use loop for min/max instead of sort                                                           |
| [arrays-tosorted-immutable](./rules/arrays-tosorted-immutable.md)     | Use toSorted() for immutability                                                                |

### Caching & Reuse

| Rule                                                          | Guidance                                                      |
| ------------------------------------------------------------- | ------------------------------------------------------------- |
| [caching-property-access](./rules/caching-property-access.md)   | Cache object properties in loops                              |
| [caching-function-results](./rules/caching-function-results.md) | Cache function results in module-level Map                    |
| [caching-storage](./rules/caching-storage.md)                   | Cache `localStorage`/`sessionStorage`/`document.cookie` reads |

### Control Flow

| Rule                                                        | Guidance                    |
| ----------------------------------------------------------- | --------------------------- |
| [control-flow-early-exit](./rules/control-flow-early-exit.md) | Return early from functions |

### Type Safety & Nullish Values

| Rule                                                                                | Guidance                                                                                                  |
| ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| [types-as-const](./rules/types-as-const.md)                                           | Use `as const` to preserve literal types and readonly values                                              |
| [types-satisfies](./rules/types-satisfies.md)                                         | Use `satisfies` to validate object shapes without changing inference                                      |
| [types-optional-chaining](./rules/types-optional-chaining.md)                         | Use Optional Chaining (`?.`) to safely access nested properties without verbose guards                    |
| [types-nullish-coalescing](./rules/types-nullish-coalescing.md)                       | Use Nullish Coalescing (`??`) when you need a default only for `null` or `undefined`                      |
| [types-nullish-coalescing-assignment](./rules/types-nullish-coalescing-assignment.md) | Use Nullish Coalescing Assignment (`??=`) to set defaults without overwriting existing non-nullish values |

### Strings & Regular Expressions

| Rule                                                            | Guidance                                                                                   |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| [strings-string-replaceall](./rules/strings-string-replaceall.md) | Use `String.prototype.replaceAll()` for global replacements instead of regex replace hacks |
| [strings-substring-slice](./rules/strings-substring-slice.md)     | Prefer `.substring()`/`.slice()` for predictable string slicing                            |
| [strings-regexp-escape](./rules/strings-regexp-escape.md)         | Use `RegExp.escape()` for user-controlled regex input                                      |
| [strings-hoist-regexp](./rules/strings-hoist-regexp.md)           | Hoist RegExp creation out of render (module scope or `useMemo`)                            |

### Async, Modules & Resources

| Rule                                                                              | Guidance                                                                                              |
| --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| [async-parallel](./rules/async-parallel.md)                                         | Use `Promise.all()` to run independent async operations concurrently instead of awaiting sequentially |
| [async-defer-await](./rules/async-defer-await.md)                                   | Move `await` into branches where actually used to avoid blocking unused code paths                    |
| [async-cheap-condition-before-await](./rules/async-cheap-condition-before-await.md) | Check cheap synchronous conditions before awaiting flags or remote values                             |
| [async-dependencies](./rules/async-dependencies.md)                                 | Use `better-all` (or eagerly created promises) for partial-dependency parallelism                     |
| [async-array-fromasync](./rules/async-array-fromasync.md)                           | Use `Array.fromAsync()` to collect async iterables into arrays                                        |
| [async-promise-try](./rules/async-promise-try.md)                                   | Use `Promise.try()` when a function may return synchronously, asynchronously, or throw                |
| [async-explicit-resource-management](./rules/async-explicit-resource-management.md) | Use `using` and `await using` for resource cleanup when disposers are available                       |
| [async-import-defer](./rules/async-import-defer.md)                                 | Use `import defer` for heavy rarely-used modules when supported                                       |
| [async-json-import-attributes](./rules/async-json-import-attributes.md)             | Use import attributes for JSON modules                                                                |

### Runtime APIs

| Rule                                                                | Guidance                                                                                             |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| [runtime-error-iserror](./rules/runtime-error-iserror.md)             | Use `Error.isError()` instead of `instanceof Error` across realms                                    |
| [runtime-temporal](./rules/runtime-temporal.md)                       | Use `Temporal` for new date and time logic instead of legacy `Date`-heavy patterns or date libraries |
| [runtime-math-sumprecise](./rules/runtime-math-sumprecise.md)         | Use `Math.sumPrecise()` for accurate summation instead of `array.reduce((a, b) => a + b, 0)`         |
| [runtime-uint8array-encoding](./rules/runtime-uint8array-encoding.md) | Use `Uint8Array` base64 and hex helpers for byte encoding                                            |

## How to Use

Read individual rule files for detailed explanations and code examples:

```
./rules/strings-string-replaceall.md
./rules/types-as-const.md
```

Each rule file contains:

Brief explanation of why it matters
Incorrect code example with explanation
Correct code example with explanation
Additional context and references
