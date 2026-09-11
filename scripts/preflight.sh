#!/bin/sh
# Preflight entry point for git hooks (lefthook) and CI.
#
# Dependencies can be missing right after a pull that changed the lockfile,
# so this script auto-installs them (pnpm install --frozen-lockfile) if turbo
# is missing, before running the turbo tasks.
#
# PATH discovery for version-manager-managed node/pnpm lives in `lefthookrc`,
# which lefthook sources before running any hook command. When invoked via
# `pnpm run` or directly, node/pnpm are expected to already be on PATH.

set -eu

# Always run from the repo root and make local binaries visible, so the
# script behaves the same whether invoked via `pnpm run`, lefthook, or
# directly from any working directory.
cd "$(dirname "$0")/.."
PATH="$PWD/node_modules/.bin:$PATH"
export PATH

if ! command -v node >/dev/null 2>&1; then
  echo "preflight: node was not found on PATH — install Node.js and try again." >&2
  exit 127
fi

if ! command -v pnpm >/dev/null 2>&1; then
  echo "preflight: pnpm was not found on PATH — install pnpm and try again." >&2
  exit 127
fi

if ! command -v turbo >/dev/null 2>&1; then
  echo "preflight: turbo not found — running 'pnpm install --frozen-lockfile'..." >&2
  pnpm install --frozen-lockfile
fi

exec turbo run lint format check-types
