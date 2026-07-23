---
name: iterator-helpers
---

# Use iterator helpers for lazy pipelines

`Iterator.from()`, iterator helper methods like `.map()`, `.filter()`, `.take()`, `.drop()`, and `Iterator.concat()` let you transform iterables lazily. That avoids materializing large collections early and works for infinite iterators.

**Incorrect (materializes before transforming):**
```ts
const ids = Array.from(document.querySelectorAll('.card'))
  .filter((element) => !element.classList.contains('hidden'))
  .map((element) => element.dataset.id)
```

**Correct (keeps the pipeline lazy):**
```ts
const ids = Iterator.from(document.querySelectorAll('.card'))
  .filter((element) => !element.classList.contains('hidden'))
  .map((element) => element.dataset.id)
  .toArray()
```

**Correct (concatenates iterators lazily):**
```ts
const allItems = Iterator.concat(first(), second(), third())
```

Notes: Prefer iterator helpers when the source is already iterable, especially for large, streaming, or potentially unbounded data. If the target runtime does not support iterator helpers yet, use a compatible polyfill or keep the lazy generator-based fallback.
