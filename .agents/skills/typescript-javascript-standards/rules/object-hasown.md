---
name: object-hasown
---

# Use Object.hasOwn() for property existence checks

`Object.hasOwn(obj, prop)` is safer than `obj.hasOwnProperty(prop)` (which can be shadowed) and more explicit than the `in` operator when you only want own properties.

Incorrect
```ts
const obj: Record<string, unknown> = { key: 1 }
if ((obj as any).hasOwnProperty('key')) {
	// found
}
```

Correct
```ts
const obj: Record<string, unknown> = { key: 1 }
if (Object.hasOwn(obj, 'key')) {
	// found
}
```
