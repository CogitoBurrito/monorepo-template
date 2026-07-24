---
title: Use String.prototype.replaceAll() for global replacements
---

# Use String.prototype.replaceAll() for global replacements

`replaceAll` is explicit, avoids accidental regex pitfalls, and is clearer when replacing literal substrings.

Incorrect
```ts
const str = 'foo foo baz'
const fixed = str.replace(/foo/g, 'bar')
```

Correct (string target)
```ts
const str = 'foo foo baz'
const fixed = str.replaceAll('foo', 'bar')
```

Note: For dynamic regexes or pattern-based replacements, continue to use `replace` with a `RegExp` and the `g` flag.
