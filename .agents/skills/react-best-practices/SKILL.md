---
name: react-best-practices
description: React best practices. Rules that must be followed when writing or reviewing React code for this project.
---

# Project coding standards for React

## Quick Reference of Rules

### Bundle Size Optimization

| Rule                                                        | Guidance                                                                                    |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| [bundle-barrel-imports](./rules/bundle-barrel-imports.md)     | Import directly, avoid barrel files                                                         |
| [bundle-conditional](./rules/bundle-conditional.md)           | Load modules only when feature is activated                                                 |
| [bundle-preload](./rules/bundle-preload.md)                   | Preload heavy bundles based on user intent (hover/focus or feature flags)                   |
| [bundle-analyzable-paths](./rules/bundle-analyzable-paths.md) | Prefer statically analyzable import and file-system paths to avoid broad bundles and traces |

### Re-render Optimization

| Rule                                                                                                    | Guidance                                                  |
| ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| [rerender-defer-reads](./rules/rerender-defer-reads.md)                                                   | Don't subscribe to state only used in callbacks           |
| [rerender-dependencies](./rules/rerender-dependencies.md)                                                 | Use primitive dependencies in effects                     |
| [rerender-derived-state](./rules/rerender-derived-state.md)                                               | Subscribe to derived booleans, not raw values             |
| [rerender-derived-state-no-effect](./rules/rerender-derived-state-no-effect.md)                           | Derive state during render, not effects                   |
| [rerender-functional-setstate](./rules/rerender-functional-setstate.md)                                   | Use functional setState for stable callbacks              |
| [rerender-lazy-state-init](./rules/rerender-lazy-state-init.md)                                           | Pass function to useState for expensive values            |
| [rerender-memo](./rules/rerender-memo.md)                                                                 | Extract expensive work into memoized components           |
| [rerender-memo-with-default-value](./rules/rerender-memo-with-default-value.md)                           | Hoist default non-primitive props for memoized components |
| [rerender-move-effect-to-event](./rules/rerender-move-effect-to-event.md)                                 | Put interaction logic in event handlers                   |
| [rerender-name-effects](./rules/rerender-name-effects.md)                                                 | Use named function expressions in useEffect               |
| [rerender-no-inline-components](./rules/rerender-no-inline-components.md)                                 | Don't define components inside components                 |
| [rerender-simple-expression-in-memo](./rules/rerender-simple-expression-in-memo.md)                       | Avoid `useMemo` for simple primitive expressions          |
| [rerender-split-combined-hooks](./rules/rerender-split-combined-hooks.md)                                 | Split hooks with independent dependencies                 |
| [rerender-transitions](./rules/rerender-transitions.md)                                                   | Use startTransition for non-urgent updates                |
| [rerender-use-deferred-value](./rules/rerender-use-deferred-value.md)                                     | Defer expensive renders to keep input responsive          |
| [rerender-use-ref-transient-values](./rules/rerender-use-ref-transient-values.md)                         | Use refs for transient frequent values                    |
| [rerender-avoid-unnecessary-usememo](./rules/rerender-avoid-unnecessary-usememo.md)                       | Avoid `useMemo` for cheap calculations                    |
| [rerender-effects-synchronize-external-systems](./rules/rerender-effects-synchronize-external-systems.md) | Treat `useEffect` as synchronization, not lifecycle       |
| [rerender-keyed-resets](./rules/rerender-keyed-resets.md)                                                 | Use keyed resets when component identity changes          |
| [rerender-no-unnecessary-effects](./rules/rerender-no-unnecessary-effects.md)                             | Verify `useEffect` is needed before writing it            |
| [rerender-related-state-reducer](./rules/rerender-related-state-reducer.md)                               | Use `useReducer` for related state                        |
| [rerender-state-colocation](./rules/rerender-state-colocation.md)                                         | Colocate state near its consumers                         |
| [rerender-transition-over-debounce](./rules/rerender-transition-over-debounce.md)                         | Use `useTransition` before debounce for expensive updates |

### Rendering Performance

| Rule                                                                                  | Guidance                                                   |
| ------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| [rendering-activity](./rules/rendering-activity.md)                                     | Use the Activity component for show/hide to preserve state |
| [rendering-animate-svg-wrapper](./rules/rendering-animate-svg-wrapper.md)               | Animate div wrapper, not SVG element                       |
| [rendering-content-visibility](./rules/rendering-content-visibility.md)                 | Use content-visibility for long lists                      |
| [rendering-hoist-jsx](./rules/rendering-hoist-jsx.md)                                   | Extract static JSX outside components                      |
| [rendering-svg-precision](./rules/rendering-svg-precision.md)                           | Reduce SVG coordinate precision                            |
| [rendering-conditional-render](./rules/rendering-conditional-render.md)                 | Use ternary, not && for conditionals                       |
| [rendering-hydration-no-flicker](./rules/rendering-hydration-no-flicker.md)             | Use an inline script for client-only data to avoid flicker |
| [rendering-hydration-suppress-warning](./rules/rendering-hydration-suppress-warning.md) | Suppress expected hydration mismatches                     |
| [rendering-usetransition-loading](./rules/rendering-usetransition-loading.md)           | Prefer useTransition for loading state                     |
| [rendering-layout-effect-measurement](./rules/rendering-layout-effect-measurement.md)   | Use `useLayoutEffect` for measurement before paint         |
| [rendering-stable-list-keys](./rules/rendering-stable-list-keys.md)                     | Use stable keys for dynamic lists                          |

### JavaScript Performance

| Rule                                                        | Guidance                                                                     |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------- |
| [rendering-batch-dom-css](./rules/rendering-batch-dom-css.md) | Avoid layout thrashing by batching style writes separately from layout reads |

### Advanced Patterns

| Rule                                                                                            | Guidance                                               |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| [advanced-effect-event-deps](./rules/advanced-effect-event-deps.md)                               | Don't put `useEffectEvent` results in effect deps      |
| [advanced-event-handler-refs](./rules/advanced-event-handler-refs.md)                             | Store event handlers in refs                           |
| [advanced-init-once](./rules/advanced-init-once.md)                                               | Initialize app once per app load                       |
| [advanced-use-latest](./rules/advanced-use-latest.md)                                             | Use `useEffectEvent` for stable callback refs          |
| [advanced-compound-components](./rules/advanced-compound-components.md)                           | Use compound components for flexible shared-state APIs |
| [advanced-single-responsibility-components](./rules/advanced-single-responsibility-components.md) | Split data and presentation by reason to change        |

### Async & Data Fetching

| Rule                                                            | Guidance                                            |
| --------------------------------------------------------------- | --------------------------------------------------- |
| [async-suspense-boundaries](./rules/async-suspense-boundaries.md) | Use Suspense boundaries to show UI while data loads |

### Client-Side APIs & Events

| Rule                                                                      | Guidance                                            |
| ------------------------------------------------------------------------- | --------------------------------------------------- |
| [client-event-listeners](./rules/client-event-listeners.md)                 | Deduplicate global event listeners across instances |
| [client-localstorage-schema](./rules/client-localstorage-schema.md)         | Version and minimize localStorage data              |
| [client-passive-event-listeners](./rules/client-passive-event-listeners.md) | Use passive event listeners for scroll performance  |

## How to Use

If detailed explanations and code examples are needed, read individual rule files:

```
./rules/rerender-memo.md
./rules/rerender-dependencies.md
```

Each rule file contains:

- Brief explanation of why it matters
- Incorrect code example with explanation
- Correct code example with explanation
- Additional context and references
