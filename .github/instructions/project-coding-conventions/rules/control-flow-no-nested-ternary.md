---
title: Avoid nested ternary expressions
---

# Avoid nested ternary expressions

Don't nest ternary operators inside other ternaries. A nested ternary reads as a jumbled, hard-to-parse expression — the reader must mentally group which `?` pairs with which `:` and track multiple conditions in one line. Extract the logic into early returns, a lookup map, or a helper function instead.

**Incorrect (nested ternaries):**

```ts
const label =
  user.isMember ?
    items.length > 10 ?
      "Gold"
    : "Silver"
  : "Bronze";
```

**Correct (early returns):**

```ts
function membershipLabel(user: User, items: Item[]) {
  if (!user.isMember) {
    return "Bronze";
  }

  return items.length > 10 ? "Gold" : "Silver";
}
```

**Correct (lookup map):**

```ts
const LABELS = {
  gold: "Gold",
  silver: "Silver",
  bronze: "Bronze",
} satisfies Record<Tier, string>;

const label = LABELS[tier];
```

Notes:

- A single ternary is fine — this rule targets _nesting_ ternaries inside ternaries.
- For multi-branch logic, prefer early returns, a `switch` statement, or a lookup map.
- If the expression still feels dense after flattening, extract it into a named helper function.
