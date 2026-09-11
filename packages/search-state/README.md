# @jonsun/search-state

A typed, optimistic search-parameter hook for TanStack React Router. It uses the
existing router and route schemas; no additional provider is required.

## Usage

Add `@jonsun/search-state` as a `workspace:*` dependency of the consuming
workspace package. Keep the application's normal TanStack Router `Register`
declaration so route IDs and search keys can be inferred.

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { useSearchStateExperimentalMicrotask } from "@jonsun/search-state";
import { z } from "zod";

export const Route = createFileRoute("/foo")({
  validateSearch: z.object({ bar: z.number().default(0) }),
  component: MyComponent,
});

function MyComponent() {
  const [bar, setBar] = useSearchStateExperimentalMicrotask({
    from: "/foo",
    key: "bar",
  });

  return (
    <button onClick={() => setBar((previous) => previous + 1)}>{bar}</button>
  );
}
```

`bar` and the updater's `previous` parameter are inferred as `number`. Defaults
belong in `validateSearch`, not in the hook.

```ts
setBar(2);
setBar((previous) => previous + 1);
setBar(3, { replace: false });
```

`from` is a currently matched route ID, including for pathless or dynamic routes.
Inherited search keys are available.

Pass `select` to derive the returned state and subscribe only to that result. The
setter continues to update the complete value for `key`:

```tsx
const [isPositive, setBar] = useSearchStateExperimentalMicrotask({
  from: "/foo",
  key: "bar",
  select: (bar) => bar > 0,
});
```

The setter accepts `hashScrollIntoView`, `ignoreBlocker`, `reloadDocument`,
`replace`, `resetScroll`, and `viewTransition`. It also supports Router's loose
search mode for keys shared across routes:

```tsx
const [bar] = useSearchStateExperimentalMicrotask({
  strict: false,
  key: "bar",
});
```

## Contract

- The return value is a readonly `[state, setState]` tuple. The setter is stable
  while the router and `key` are unchanged.
- The setter returns `void` and accepts either a value or a functional updater.
- Synchronous setter calls share one `router.navigate()` call, and functional
  updates read prior values from that pending batch.
- The hook reads Router state directly, so it does not expose an optimistic value
  before the microtask runs. An external navigation in the same tick cancels the
  pending write.
- Writes default to `replace: true`. Pass `replace: false` to push a history
  entry.
- The hook keeps its own `Object.is` check so equal values skip navigation.

Router can build synchronous navigations from its pending location, but it does
not combine their commits: every changed `navigate()` can write history, and an
unchanged location still triggers a load. The hook therefore keeps its own
microtask batch.

## Maintenance

- `src/use-search-state-experimental-microtask.ts`: the hook and its per-router
  microtask coordinator.
- `src/index.ts`: the public entry point.

Run from the repository root:

```sh
pnpm --filter @jonsun/search-state test
pnpm --filter @jonsun/search-state typecheck
```

The typecheck also compiles the positive and negative type tests. Zod is a test
dependency, not a runtime requirement; validation is delegated to Router.

## References

- [Router PR #4552](https://github.com/TanStack/router/pull/4552/changes)
- [Search Params as Actual State, issue #4973](https://github.com/TanStack/router/issues/4973)
- [Beware The URL Type-Safety Iceberg](https://nuqs.dev/blog/beware-the-url-type-safety-iceberg)
- [nuqs queue implementations](https://github.com/47ng/nuqs/tree/next/packages/nuqs/src/lib/queues)
