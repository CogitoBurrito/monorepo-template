---
title: Always use braces and a multi-line body for `if` statements
---

# Always use braces and a multi-line body for `if` statements

Never place the body of an `if` on the same line as its condition, and never omit the braces. Write the condition on one line, then the body indented on its own line inside `{ }`. An inline body is easy to miss at the end of a long condition, and it is unsafe to extend: adding a second statement on the next line silently escapes the branch. Braces keep every branch shaped the same way, so the body is always obvious.

**Incorrect (brace-less inline body):**

```ts
if (options.reloadDocument) store.options.reloadDocument = true;
if (options.ignoreBlocker) store.options.ignoreBlocker = true;
if (Object.is(nextValue, previousValue)) return;
```

**Correct (braces, body on its own line):**

```ts
if (options.reloadDocument) {
  store.options.reloadDocument = true;
}

if (options.ignoreBlocker) {
  store.options.ignoreBlocker = true;
}

if (Object.is(nextValue, previousValue)) {
  return;
}
```

**Correct (several checks, body still on its own line):**

```ts
if (
  options.replace !== undefined &&
  store.options.replace !== false &&
  options.resetScroll
) {
  store.options.replace = options.replace;
}
```
