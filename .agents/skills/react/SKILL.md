---
applyTo: '**/*.jsx,**/*.tsx,**/use*.ts,**/use*.tsx'
---
# Project coding standards for React
React coding standards. Rules that must be followed for writing efficient, maintainable, performant, and scalable React components and hooks.

## Quick Reference of Rules

### 1. Bundle Size Optimization

- [bundle-barrel-imports](rules/bundle-barrel-imports.md) - Import directly, avoid barrel files
- [bundle-conditional](rules/bundle-conditional.md) - Load modules only when feature is activated
- [bundle-preload](rules/bundle-preload.md) - Preload on hover/focus for perceived speed

### 2. Re-render Optimization

- [rerender-defer-reads](rules/rerender-defer-reads.md) - Don't subscribe to state only used in callbacks
- [rerender-dependencies](rules/rerender-dependencies.md) - Use primitive dependencies in effects
- [rerender-derived-state](rules/rerender-derived-state.md) - Subscribe to derived booleans, not raw values
- [rerender-derived-state-no-effect](rules/rerender-derived-state-no-effect.md) - Derive state during render, not effects
- [rerender-functional-setstate](rules/rerender-functional-setstate.md) - Use functional setState for stable callbacks
- [rerender-lazy-state-init](rules/rerender-lazy-state-init.md) - Pass function to useState for expensive values
- [rerender-move-effect-to-event](rules/rerender-move-effect-to-event.md) - Put interaction logic in event handlers
- [rerender-name-effects](rules/rerender-name-effects.md) - Use named function expressions in useEffect
- [rerender-transitions](rules/rerender-transitions.md) - Use startTransition for non-urgent updates
- [rerender-use-ref-transient-values](rules/rerender-use-ref-transient-values.md) - Use refs for transient frequent values

### 3. Rendering Performance

- [rendering-animate-svg-wrapper](rules/rendering-animate-svg-wrapper.md) - Animate div wrapper, not SVG element
- [rendering-content-visibility](rules/rendering-content-visibility.md) - Use content-visibility for long lists
- [rendering-hoist-jsx](rules/rendering-hoist-jsx.md) - Extract static JSX outside components
- [rendering-svg-precision](rules/rendering-svg-precision.md) - Reduce SVG coordinate precision
- [rendering-conditional-render](rules/rendering-conditional-render.md) - Use ternary, not && for conditionals
- [rendering-usetransition-loading](rules/rendering-usetransition-loading.md) - Prefer useTransition for loading state

### 4. JavaScript Performance

- [rendering-batch-dom-css](rules/rendering-batch-dom-css.md) - Group CSS changes via classes or cssText

### 5. Advanced Patterns

- [advanced-event-handler-refs](rules/advanced-event-handler-refs.md) - Store event handlers in refs
- [advanced-init-once](rules/advanced-init-once.md) - Initialize app once per app load
- [advanced-use-latest](rules/advanced-use-latest.md) - useLatest for stable callback refs

## How to Use

If detailed explanations and code examples are needed, read individual rule file.

Each rule file contains:
- Brief explanation of why it matters
- Incorrect code example with explanation
- Correct code example with explanation
- Additional context and references
