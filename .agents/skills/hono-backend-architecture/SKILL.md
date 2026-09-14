---
name: hono-backend-architecture
description: Feature-based 3-layer architecture for standalone Hono API backends. Use when structuring a new Hono backend project, organizing routes into feature sub-apps, deciding where to put repository/service/schema layers, wiring Valibot validation with sValidator from @hono/standard-validator, exporting AppType for RPC clients, or placing auth middleware. Complements the hono skill (which covers the API itself); this skill covers project structure and layering.
---

# Hono Backend Architecture

Structure standalone Hono API backends (backend-only repositories, not paired with a frontend) using a feature-based 3-layer architecture. Assumes Drizzle ORM for DB access and Valibot for request/response schemas.

Source: personal best practices verified against the official Hono Best Practices and RPC guide.

## Directory Structure

Group by domain under `src/features/`, not horizontally across layers (`routes/`, `services/`, `repositories/`). Opening `features/users/` shows everything relevant to users.

```
src/
├── features/
│   ├── users/
│   │   ├── index.ts        // Route definitions (sub app)
│   │   ├── service.ts      // Business logic / domain rules
│   │   ├── repository.ts   // DB access (only place SQL/ORM queries live)
│   │   └── schema.ts       // Valibot schemas + inferred types
│   ├── posts/
│   └── comments/
├── db/
│   └── schema.ts           // Centralized Drizzle table definitions
└── index.ts                // Only mounts sub-apps
```

## ORM and Schema

- **Drizzle** for DB access: type inference, `drizzle-kit` migrations, works on Cloudflare Workers / Bun / Deno (matches Hono's runtime flexibility).
- All tables centralized in `db/schema.ts`:

```ts
// db/schema.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const posts = sqliteTable('posts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  content: text('content').notNull(),
  published: integer('published', { mode: 'boolean' }).notNull().default(false),
})
```

- One `schema.ts` per feature exporting both the Valibot schema and the inferred type. Use `import * as v from 'valibot'` and pipelines (`v.pipe`) — never Zod-style chained methods:

```ts
// features/posts/schema.ts
import * as v from 'valibot'

export const postCreateSchema = v.object({
  title: v.pipe(v.string(), v.minLength(1)),
  content: v.string(),
})

export type PostCreateInput = v.InferOutput<typeof postCreateSchema>
```

The schema is used for request validation in routes via `sValidator` from `@hono/standard-validator` (validates any Standard Schema, including Valibot); the inferred type is the service input type. Single source of truth — no redundant type definitions.

## 3-Layer Architecture

Dependency direction is strictly one-way: `index.ts → service.ts → repository.ts`. `schema.ts` is cross-cutting, imported by every layer. Never let `repository.ts` call `service.ts`; no circular references.

### repository.ts — DB access only

Thin wrapper around the ORM. SQL/ORM queries are written only here and never leak to upper layers. Argument types match the *DB row shape*, not what the client sends — the repository is the boundary reflecting the table.

```ts
// features/posts/repository.ts
import { db } from '@/db'
import { posts } from '@/db/schema'

export const postRepository = {
  findAll: () => db.select().from(posts),
  insert: (input: { title: string; content: string; published: boolean }) =>
    db.insert(posts).values(input).returning().get(),
}
```

### service.ts — domain rules

Combines repositories and implements domain rules. Only the service decides things like "only published posts are visible" or "new posts start unpublished" — the rule is enforced in both the type and the implementation (e.g. `PostCreateInput` has no `published` field; the service supplies `published: false`).

```ts
// features/posts/service.ts
import { postRepository } from './repository'
import type { PostCreateInput } from './schema'

export const postService = {
  list: async () => {
    const all = await postRepository.findAll()
    return all.filter((p) => p.published)
  },
  create: (input: PostCreateInput) =>
    postRepository.insert({ ...input, published: false }),
}
```

Prefer keeping filtering rules in the service; push a query down into the repository (e.g. a `findPublished` method) only when query optimization requires it.

### index.ts — HTTP entry point

Route definitions, validation integration, service calls. `sValidator` from `@hono/standard-validator` accepts the Valibot schema directly (Standard Schema), and `c.req.valid('json')` yields the `PostCreateInput` type, which flows seamlessly to the service and repository.

```ts
// features/posts/index.ts
import { sValidator } from '@hono/standard-validator'
import { Hono } from 'hono'
import { postService } from './service'
import { postCreateSchema } from './schema'

const posts = new Hono()
  .get('/', async (c) => c.json(await postService.list()))
  .post('/', sValidator('json', postCreateSchema), async (c) => {
    const input = c.req.valid('json')
    return c.json(await postService.create(input), 201)
  })

export default posts
```

Three layers are sufficient for personal-project scale; consider hexagonal/clean architecture only if the project grows well beyond that.

## Splitting Routes with Sub Apps

### One sub-app per feature

Each `features/<domain>/index.ts` creates and default-exports one sub-app. `src/index.ts` contains only the mounts. URL prefixes (`/users`, `/posts`) are centrally managed at mount time; sub-apps use relative paths (`/`, `/:id`).

```ts
// src/index.ts
import { Hono } from 'hono'
import users from './features/users'
import posts from './features/posts'

const app = new Hono()
const routes = app
  .route('/users', users)
  .route('/posts', posts)

export default app
export type AppType = typeof routes
```

### Naming

Name the local variable with a plural domain name (`users`, `posts`) and default-export it. (The official docs use `app`; functionally identical, purely preference.)

### Method chaining is mandatory for type inference

Hono accumulates route types in the **return value** of the chain. Always chain on `new Hono()`:

```ts
// ✅ Good — types accumulate
const users = new Hono()
  .get('/', listUsers)
  .get('/:id', getUser)
  .post('/', createUser)

export default users
```

```ts
// ❌ Bad — return values discarded, `users` stays a generic Hono with zero routes
const users = new Hono()
users.get('/', listUsers)
users.get('/:id', getUser)
users.post('/', createUser)
export default users
```

The same applies to mounting in `src/index.ts`: capture the `.route(...).route(...)` chain in `routes` and export `export type AppType = typeof routes`. Writing `app.route(...)` as separate statements loses the accumulated mount info — `AppType` sees zero routes and the RPC client gets no inference.

### Split RPC clients per sub-app

A single `AppType` for all routes makes tsserver expand every route's types at once and slows the IDE (official docs list this under "Known issues" → IDE performance). Export a type per sub-app and create clients per sub-app on the consuming side:

```ts
// features/users/index.ts
const users = new Hono()
  .get('/', listUsers)
  // ...
export default users
export type UsersAppType = typeof users
```

```ts
// client side (separate repo/service)
import type { UsersAppType } from '.../features/users'
import type { PostsAppType } from '.../features/posts'
import { hc } from 'hono/client'

const usersClient = hc<UsersAppType>('/users')
const postsClient = hc<PostsAppType>('/posts')
```

## Auth Middleware Placement

Two patterns; the decision criterion is simply "are there any public endpoints?"

**Per sub-app (default)** — when public and authenticated endpoints coexist. Put `.use('*', requireAuth)` at the start of the sub-app chain; each file stays self-contained:

```ts
// features/users/index.ts
const users = new Hono()
  .use('*', requireAuth)
  .get('/', listUsers)
  .post('/', createUser)

export default users
```

**Root-level (all endpoints authenticated)** — e.g. admin-panel backends with no public endpoints. Apply once in `src/index.ts` and drop the per-sub-app `.use` calls:

```ts
// src/index.ts
const app = new Hono()
const routes = app
  .use('*', requireAuth)
  .route('/users', users)
  .route('/posts', posts)
```

## Summary Checklist

- [ ] `src/features/<domain>/` per feature, not horizontal layers
- [ ] Each feature: `index.ts` / `service.ts` / `repository.ts` / `schema.ts`
- [ ] One-way dependency: `index → service → repository`; `schema` cross-cutting
- [ ] Drizzle tables centralized in `db/schema.ts`; Valibot schema + `v.InferOutput` type per feature
- [ ] Validate requests with `sValidator` from `@hono/standard-validator` (Standard Schema — works with Valibot)
- [ ] Sub-app per feature; mounts only in `src/index.ts`; prefixes managed at mount time
- [ ] Method chaining on `new Hono()` and on `.route(...)` — never separate `.get()`/`.route()` statements
- [ ] Export `AppType` from the chained `routes`; export per-sub-app types for RPC clients
- [ ] Auth middleware: per sub-app if any public endpoints exist, otherwise root-level
