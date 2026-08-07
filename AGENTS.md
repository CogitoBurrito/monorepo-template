# AGENTS.md

> **Maintenance:** This file must be kept in sync with the project. If the references here no longer match the actual project structure or code (tech stack, directories, commands, skills, etc.), update this file to reflect reality.

<!-- intent-skills:start -->

## Skill Loading

Before editing files for a substantial task:

- Run `pnpm dlx @tanstack/intent@latest list` from the workspace root to see available local skills.
- If a listed skill matches the task, run `pnpm dlx @tanstack/intent@latest load <package>#<skill>` before changing files.
- Use the loaded `SKILL.md` guidance while making the change.
- Monorepos: when working across packages, run the skill check from the workspace root and prefer the local skill for the package being changed.
- Multiple matches: prefer the most specific local skill for the package or concern you are changing; load additional skills only when the task spans multiple packages or concerns.

<!-- intent-skills:end -->

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

Please obey the following instructions:

- project-coding-conventions
- typescript-best-practices
- react-best-practices
