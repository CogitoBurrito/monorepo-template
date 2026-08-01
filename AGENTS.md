# AGENTS.md

> **Maintenance:** This file must be kept in sync with the project. If the references here no longer match the actual project structure or code (tech stack, directories, commands, skills, etc.), update this file to reflect reality.

## Behavioral Guidelines

### 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

## Tech Stack

- Framework: React 19, JSX via `react-jsx`
- Language: TypeScript 6, strict(see `packages/typescript-config/base.json`)
- Component library: none — hand-rolled function components
- State management: local React state only (`useState` / `useReducer`); no global state library
- Data fetching: none configured
- Auth: none
- Database: none
- Testing: none configured
- Package manager: pnpm 11.18.0 with workspace + `catalog:` protocol (see `pnpm-workspace.yaml`); Node >= 26

## Architecture

Turborepo + pnpm monorepo:

- `apps/*` — runnable applications. Each app owns its UI, entry points, and app-local config (`eslint.config.js`, `tsconfig.json`). Example: `apps/tanst`.
- `packages/*` — shared packages consumed by apps:
  - `packages/eslint-config` — shared ESLint flat configs (`base.js` for TypeScript, `react.js` for React/hooks)
  - `packages/typescript-config` — shared tsconfig presets (`base.json`)
- `tools/*` — reserved for workspace-wide tooling (declared in `pnpm-workspace.yaml`; currently unused)
- Root — orchestration only: `turbo.json` task pipeline, `lefthook.yml` git hooks, pnpm catalog, `AGENTS.md`
- `.agents/skills/*` — project skills (`react-standards`, `typescript-javascript-standards`, `turborepo`, `coding-style`)

Rules:

- Packages are `private: true` and consumed via `workspace:*` / `catalog:` dependencies.
- Apps never reach into another app's internals; shared code lives in `packages/*`.
- Shared ESLint/TS config must be added by extending `packages/eslint-config` / `packages/typescript-config`.
- Tasks are defined once in `turbo.json` and run across the workspace with `turbo run <task>`.

Where new things go:

- New app → `apps/<name>/`
- New shared library/package → `packages/<name>/`
- New agent skill → `.agents/skills/<name>/SKILL.md`

## Coding Standards

Follow the project skills for coding standards:

- React coding standard: `react-standards`
- TypeScript/JavaScript standard: `typescript-javascript-standards`
- Project coding style: `coding-style`

## Testing and Quality

Before a task is complete:

- Typecheck: `pnpm check-types`
- Lint: `pnpm lint`
- Format: `pnpm format`
- Tests: none configured

Git hooks (via `lefthook.yml`): Prettier on pre-commit; `check-types` + `lint` on pre-push.

## Commands

- Install: `pnpm install`
- Dev: `pnpm turbo run dev`
- Build: `pnpm turbo run build`
- Lint: `pnpm lint`
- Typecheck: `pnpm check-types`
- Test: none configured
- Format: `pnpm format`
