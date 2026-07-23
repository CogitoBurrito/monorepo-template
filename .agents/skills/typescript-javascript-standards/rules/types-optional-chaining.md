---
name: types-optional-chaining
---

# Use Optional Chaining (`?.`) to safely access nested properties

Optional chaining reduces boilerplate null/undefined guards when accessing deep properties, making code shorter and safer.

Incorrect
```ts
type User = { profile?: { name?: string } }
const user: User | null = getUser()
let name: string
if (user && user.profile && user.profile.name) {
  name = user.profile.name
} else {
  name = 'anonymous'
}
```

Correct
```ts
type User = { profile?: { name?: string } }
const user: User | null = getUser()
const name = user?.profile?.name ?? 'anonymous'
```
