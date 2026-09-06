# @start-mono/search-state

A typed, optimistic search-parameter hook for TanStack React Router. It uses the
existing router and route schemas; no additional provider is required.

## Usage

Add `@start-mono/search-state` as a `workspace:*` dependency of the consuming
workspace package. Keep the application's normal TanStack Router `Register`
declaration so route IDs and search keys can be inferred.

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { useSearchState } from '@start-mono/search-state'
import { z } from 'zod'

export const Route = createFileRoute('/foo')({
  validateSearch: z.object({ bar: z.number().default(0) }),
  component: MyComponent,
})

function MyComponent() {
  const [bar, setBar] = useSearchState({ from: '/foo', key: 'bar' })

  return (
    <button onClick={() => setBar((previous) => previous + 1)}>
      {bar}
    </button>
  )
}
```

`bar` and the updater's `previous` parameter are inferred as `number`. Defaults
belong in `validateSearch`, not in the hook. With `z.number()` instead, the incoming
URL must already contain a valid `bar` value.

```ts
setBar(2)
setBar((previous) => previous + 1)
setBar(3, { replace: false })
```

`from` is a currently matched route ID, including for pathless or dynamic routes.
Inherited search keys are available. An optional schema value can be set to
`undefined` to remove it from the URL.

## Contract

- The return value is a readonly `[state, setState]` tuple. The setter is stable
  while the router, `from`, and `key` are unchanged.
- `replace` is the only setter option and defaults to `true`. A changed setter
  requesting `replace: false` makes the whole batch push a history entry.
- Hooks sharing a router see the same optimistic updates immediately. Ordinary
  Router search hooks continue to observe Router's own validated state.
- Functional updaters run once, in call order, using the newest optimistic value
  or the matched route's validated value, including schema defaults.
- Same-tick updates to the same or different keys are combined in one navigation.
  Queued updates to a key use the last supplied value.
- The first write is scheduled in a microtask. Further writes are throttled to
  50ms, or 120ms on Safari 17+ and 320ms on older/unknown Safari versions. State
  updates are not throttled. These limits apply only to writes through this hook.
- Unchanged values use `Object.is` to avoid unnecessary navigation. An unresolved
  navigation that has not started can be retried with the same value.
- Writes preserve other search parameters, the current pathname, hash, and user
  history state. They do not reset scroll or scroll to the hash.
- A newer batch can supersede an unresolved older navigation, retaining its
  pending keys. An older completion cannot clear newer optimistic values.
- An external Router navigation, including back/forward, clears pending work.
  Do not mix direct `navigate` calls and setters expecting them to form one batch.
- Unmounting the last consumer cancels pending work and releases subscriptions.
  Saved setters from unmounted consumers are no-ops. Server renders do not retain
  subscriptions or schedule writes.

## Completion And Errors

Setters return `Promise<void>`. Calls sharing a pending batch share its promise.
It resolves when Router finishes that navigation, or when the batch is superseded
or canceled. Resolution is not a guarantee that every intermediate value was
persisted. Read the hook or Router to observe the current state.

Before navigating, the queue builds the proposed location, round-trips it through
Router's configured serializer/parser, and asks Router to validate its matches.
Validation or navigation rejection clears the affected optimistic state and
rejects the batch promise. Later calls can start a fresh batch. An updater that
throws does so synchronously, before its value is queued.

Handle asynchronous errors when they matter to the application:

```ts
await setBar(2).catch(console.error)
```

Native navigation blockers are not bypassed. In the current Router version a
declined blocker can leave `navigate()` unresolved without emitting a cancellation
event. In that case the optimistic value remains pending until a newer setter,
external navigation, or unmount supersedes it. After removing the blocker, calling
the setter again retries the write. The package does not patch Router or history
methods to observe blocker decisions.

## Experimental PR #4552 Baseline

`useSearchStateExperimental` is an isolated implementation based on [Router PR
#4552](https://github.com/TanStack/router/pull/4552/changes). It is useful for
side-by-side behavior comparisons, not as a replacement for `useSearchState`.

```tsx
import { useSearchStateExperimental } from '@start-mono/search-state'

const [bar, setBar] = useSearchStateExperimental({ from: '/foo', key: 'bar' })
```

It keeps this package's typed `{ from, key }` input and its `{ replace?: boolean }`
option so the hook can be compared by changing the import. Its setter returns
`void`, exposes a per-router optimistic snapshot immediately, accumulates
changes in a per-router `WeakMap`, and writes the browser URL after input has
been idle for at least 150ms. Older or unknown Safari versions use their longer
320ms history-safe interval. A direct Router navigation while that write is
pending cancels the search update.

Unlike the primary hook, it has no shared promise, history-write cooldown,
validation preflight, in-flight supersession model, or unmount cleanup. Its
optimistic snapshot is cleared when Router finishes or rejects the navigation,
or when an external navigation wins. The experiment intentionally does not
expose the PR's additional navigation options or `strict: false` API, keeping
its comparison surface aligned with this package. Pacer's `Debouncer` owns its
trailing URL-write timer.

## Scope

This implements the narrow setter API from Router PR #4552 with an additional
optimistic state layer and throttled writes. It is not an implementation of every
feature proposed in issue #4973.

- `ignoreBlocker`, `reloadDocument`, and `viewTransition` are not accepted.
- Route masks are currently rejected before committing; hidden values are not
  silently exposed in the visible URL.
- There are no per-key codecs, storage persistence, debounce options, pruning,
  `strict: false`, custom selectors, or additions to the `Route` object.
- Values must round-trip through the configured Router parser/stringifier and
  schema. A validator's output type alone does not supply a reverse codec for
  transformations, dates, classes, or other non-JSON values. Use consistent
  definitions for a shared search key across active routes.

## Maintenance

- `src/use-search-state.ts`: typed Router reads, optimistic subscription, and
  setter lifetime.
- `src/use-search-state-experimental.ts`: lightweight optimistic PR #4552
  comparison hook with microtask-batched URL writes.
- `src/queue-machine.ts`: immutable batch transformations, optimistic reads,
  and pending/in-flight state transitions.
- `src/queue.ts`: Router lifecycle, cooldown scheduling, validation,
  navigation, and cancellation effects.
- `src/history-scheduler.ts`: browser-specific history intervals and the
  Pacer-managed cooldown timer.
- `src/types.ts`: the small public type contract.

`QueueStateMachine` stores state per router and owns the legal transitions:
queue an update, start a pending batch, mark a navigation as started, finish a
batch, or clear all batches. `SearchStateQueue` owns the Router-facing effects
around those transitions. `getSearchStateQueue(router)` caches one coordinator
per router. Async work checks batch IDs, not object identity.

`set` updates optimistic values and schedules a microtask for each new batch.
`flush` checks the cooldown, merges any superseded batch, and settles completion.
`navigate` owns location building, validation, and the Router call. `retain` and
`cancel` manage subscriptions and cleanup.

`HistoryScheduler` exposes `deferIfNeeded`, `recordWrite`, and `cancel`. It uses
`Debouncer` from `@tanstack/react-pacer` only as a cancellable timer. Setters merge
into the pending batch without restarting that timer, so writes remain throttled
even during continuous input. Each flush rechecks the cooldown in case an earlier
navigation started late. Pacer does not supply Safari history-write intervals;
the scheduler keeps the existing 50ms, 120ms, and 320ms policy in one place. Pacer
does not await navigation promises, so newer batches can supersede blocked or slow
navigations.

Rate limiters reject excess calls instead of scheduling them. An async queue would
need additional handling for navigations that never settle, and
`AsyncBatcher.addItem()` does not return the eventual result of a timer-triggered
batch. The coordinator therefore owns optimistic state and shared batch promises.

The queue reserves `history.state.__startMonoSearchState` for a batch identifier.
This distinguishes its navigation from external navigation even when middleware
changes the final URL. Application history-state fields are preserved. No private
Router fields or monkey-patched methods are used.

Run from the repository root:

```sh
pnpm --filter @start-mono/search-state test
pnpm --filter @start-mono/search-state typecheck
```

The typecheck also compiles the positive and negative type tests. Zod is a test
dependency, not a runtime requirement; validation is delegated to Router.

## References

- [Pacer debouncing](https://tanstack.com/pacer/latest/docs/framework/react/guides/debouncing)
- [Pacer async batching](https://tanstack.com/pacer/latest/docs/framework/react/guides/async-batching)
- [Router PR #4552](https://github.com/TanStack/router/pull/4552/changes)
- [Search Params as Actual State, issue #4973](https://github.com/TanStack/router/issues/4973)
- [Beware The URL Type-Safety Iceberg](https://nuqs.dev/blog/beware-the-url-type-safety-iceberg)
- [nuqs queue implementations](https://github.com/47ng/nuqs/tree/next/packages/nuqs/src/lib/queues)
