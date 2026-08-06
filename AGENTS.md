# AGENTS.md

> **Maintenance:** This file must be kept in sync with the project. If the references here no longer match the actual project structure or code (tech stack, directories, commands, skills, etc.), update this file to reflect reality.

## Tech stack in use

### Language

TypeScript is used across the project for all apps and packages, except for the `eslint-config` package and its `eslint.config.js` file which are written in JavaScript.


### Frontend
- Tanstack Start handles the frontend logic and routing.
- Tanstack Query is used for data fetching and caching.
- React is used for building the user interface.
- TailwindCSS is used for styling the UI components.

### Backend
- Node.js is used as the runtime environment for the backend.
- Tanstack Start handles the backend logic and API routes.

### Testing
- Vitest for TypeScript
- Playwright for e2e tests

### Tooling
- PNPM manages workspace dependencies and packages.
- Turborepo orchestrates tasks across apps and packages.
- ESLint is used for linting and code style enforcement.
- Prettier is used for code formatting.

## Project Structure

- `apps/*` — runnable applications. Each app owns its UI, entry points, and app-local config (`eslint.config.js`, `tsconfig.json`). 
- `packages/*` — shared packages consumed by apps:
  - `packages/eslint-config` — shared ESLint flat configs (`base.js` for TypeScript, `react.js` for React/hooks)
  - `packages/typescript-config` — shared tsconfig presets (`base.json`)
- Root — orchestration only: `turbo.json` task pipeline, `lefthook.yml` git hooks, pnpm catalog, `AGENTS.md`
- `.agents/skills/*` — project skills (`react-standards`, `typescript-javascript-standards`, `turborepo`, `coding-style`)

## Development Guidelines

- For TypeScript best practices follow skill: `typescript-best-practices`
- For React best practices follow skill: `react-best-practices`
- For coding style follow skill: `project-coding-style`

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

### 5. Surface conflicts, don't average them
If two existing patterns in the codebase contradict, don't blend them.
Pick one (the more recent / more tested), explain why, and flag the other for cleanup.
"Average" code that satisfies both rules is the worst code.

### 6. Read before you write
Before adding code in a file, read the file's exports, the immediate caller, and any obvious shared utilities.
If you don't understand why existing code is structured the way it is, ask before adding to it.
"Looks orthogonal to me" is the most dangerous phrase in this codebase.

### 7. Tests verify intent, not just behavior
Every test must encode WHY the behavior matters, not just WHAT it does.
A test like `expect(getUserName()).toBe('John')` is worthless if the function takes a hardcoded ID.
If you can't write a test that would fail when business logic changes, the function is wrong.

### 8. Checkpoint after every significant step
After completing each step in a multi-step task: summarize what was done, what's verified, what's left.
Don't continue from a state you can't describe back to me.
If you lose track, stop and restate.

### 9. Match the codebase's conventions, even if you disagree
If the codebase uses snake_case and you'd prefer camelCase: snake_case.
If the codebase uses class-based components and you'd prefer hooks: class-based.
Disagreement is a separate conversation. Inside the codebase, conformance > taste.
If you genuinely think the convention is harmful, surface it. Don't fork it silently.

### 10. Fail loud
If you can't be sure something worked, say so explicitly.
"Migration completed" is wrong if 30 records were skipped silently.
"Tests pass" is wrong if you skipped any.
"Feature works" is wrong if you didn't verify the edge case I asked about.
Default to surfacing uncertainty, not hiding it.
