---
applyTo: "**/*.ts, **/*.tsx"
---

# Project Coding Conventions

## Quick Reference of Rules

### Types

| Rule                                              | Guidance                                           |
| ------------------------------------------------- | -------------------------------------------------- |
| [types-prefer-type](./rules/types-prefer-type.md) | Declare types with `type` aliases, not `interface` |

### Control Flow

| Rule                                                              | Guidance                                                          |
| ----------------------------------------------------------------- | ----------------------------------------------------------------- |
| [control-flow-no-nested-if](./rules/control-flow-no-nested-if.md)     | Avoid nested `if` statements; use guard clauses and early returns |
| [control-flow-no-nested-ternary](./rules/control-flow-no-nested-ternary.md) | Avoid nested ternary expressions; use early returns or a lookup map |
| [control-flow-no-else](./rules/control-flow-no-else.md)               | Avoid `else` statements; return early instead                     |

### Functions

| Rule                                                        | Guidance                                               |
| ----------------------------------------------------------- | ------------------------------------------------------ |
| [functions-nested-arrow](./rules/functions-nested-arrow.md) | Declare nested functions as arrow function expressions |

### Sorting

| Rule                                                      | Guidance                                                                    |
| --------------------------------------------------------- | --------------------------------------------------------------------------- |
| [sorting-natural-order](./rules/sorting-natural-order.md) | Use natural sort order (`type: 'natural'`) for all perfectionist sort rules |

### Comments

| Rule                                                    | Guidance                                                              |
| ------------------------------------------------------- | --------------------------------------------------------------------- |
| [comments-jsdoc-style](./rules/comments-jsdoc-style.md) | Use JSDoc comment style for documenting exported and non-obvious code |

## How to Use

If detailed explanations and code examples are needed, read individual rule files:

```
./rules/types-prefer-type.md
./rules/sorting-natural-order.md
```

Each rule file contains:

- Brief explanation of why it matters
- Incorrect code example with explanation
- Correct code example with explanation
- Additional context and references
