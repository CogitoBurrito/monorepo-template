---
name: explicit-resource-management
---

# Use using and await using for cleanup

Explicit resource management moves disposal to the declaration site and avoids repetitive `try`/`finally` cleanup blocks when a resource implements `Symbol.dispose` or `Symbol.asyncDispose`.

**Incorrect (separates cleanup from declaration):**
```ts
async function transferMoney(from: string, to: string, amount: number) {
  const transaction = await db.beginTransaction()

  try {
    await transaction.debit(from, amount)
    await transaction.credit(to, amount)
    await transaction.commit()
  } finally {
    await transaction.release()
  }
}
```

**Correct (disposes at scope exit):**
```ts
async function transferMoney(from: string, to: string, amount: number) {
  await using transaction = await db.beginTransaction()
  await transaction.debit(from, amount)
  await transaction.credit(to, amount)
  await transaction.commit()
}
```

Notes: Resources are disposed in reverse declaration order within the same scope. If the runtime does not support `using`, keep the `try`/`finally` form or use a transpilation/polyfill strategy that preserves disposal semantics.
