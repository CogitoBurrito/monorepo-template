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

- Vitest for Unitest
- Playwright for e2e tests

### Tooling

- PNPM manages workspace dependencies and packages.
- Turborepo orchestrates tasks across apps and packages.
- ESLint is used for linting and code style enforcement.
- Prettier is used for code formatting.

### Shell

Check the current shell is fish or bash before executing any shell scripts

## Project Structure

- `apps/*` — runnable applications. Each app owns its UI, entry points, and app-local config (`eslint.config.js`, `tsconfig.json`):
  - `apps/grazy` — TanStack Start app (`@jonsun/grazy`) consuming the shared site, router, and search-state packages
- `packages/*` — shared packages consumed by apps (all under the `@jonsun` scope):
  - `packages/eslint-config` — shared ESLint flat configs (`base.js` for TypeScript, `react.js` for React/hooks, `tanstack.js` for TanStack rules)
  - `packages/typescript-config` — shared tsconfig presets (`base.json`)
  - `packages/grazy-query` — shared TanStack Query hooks and loaders (`@jonsun/grazy-query`)
  - `packages/grazy-router` — shared TanStack Router setup, route tree, and routes (`@jonsun/grazy-router`)
  - `packages/grazy-site` — shared site UI components and pages (`@jonsun/grazy-site`)
  - `packages/search-state` — React hook for search/URL state, with Vitest tests (`@jonsun/search-state`)
  - `packages/turborepo-remote-cache` — self-hosted Turborepo Remote Cache server built with Hono, deployed to Cloudflare Workers via Wrangler
