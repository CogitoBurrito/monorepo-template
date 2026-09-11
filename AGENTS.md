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
- HeroUI is used as the component library.

### Backend

- Node.js is used as the runtime environment for the backend.
- Hono handles the backend logic and API routes.

### Testing

- Vitest for TypeScript
- Playwright for e2e tests

### Tooling

- PNPM manages workspace dependencies and packages.
- Turborepo orchestrates tasks across apps and packages.
- ESLint is used for linting and code style enforcement.
- Prettier is used for code formatting.

### Shell

Check the current shell is fish or bash before writing any shell scripts

## Project Structure

- `apps/*` — runnable applications. Each app owns its UI, entry points, and app-local config (`eslint.config.js`, `tsconfig.json`).
- `packages/*` — shared packages consumed by apps:
  - `packages/eslint-config` — shared ESLint flat configs (`base.js` for TypeScript, `react.js` for React/hooks)
  - `packages/sync-skill` — manual Node ESM CLI that synchronizes eligible TanStack Router package skills into `.agents/skills`
  - `packages/typescript-config` — shared tsconfig presets (`base.json`)
- Root — orchestration only: `turbo.json` task pipeline, `lefthook.yml` git hooks + AI agent hook (`ai.copilot` → `lefthook run validate`), `scripts/preflight.sh` preflight entry, pnpm catalog, `AGENTS.md`

## Development Guidelines

You are not allowed to edit any eslint or prettier config files to bypass the lint errors. If you encounter a lint error, you must fix the underlying issue rather than suppressing it.
