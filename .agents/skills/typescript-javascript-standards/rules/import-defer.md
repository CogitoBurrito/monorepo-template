---
name: import-defer
---

# Use import defer for heavy rarely-used modules

`import defer` can avoid evaluating a heavy module until code actually reads from its namespace, improving startup cost for rarely-used paths.

**Incorrect (evaluates heavy module eagerly):**
```ts
import * as heavyModule from './heavy.js'

export function rarelyCalled() {
  return heavyModule.doExpensiveThing()
}
```

**Correct (defers module evaluation):**
```ts
import defer * as heavyModule from './heavy.js'

export function rarelyCalled() {
  return heavyModule.doExpensiveThing()
}
```

Notes: `import defer` only works with namespace imports and is not compatible with modules that use top-level `await`. If unsupported by the target runtime or bundler, keep a normal dynamic import or other lazy-loading strategy.
