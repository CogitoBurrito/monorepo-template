#!/bin/sh
# Preflight entry point for git hooks (lefthook) and CI.
#
# Hook processes (e.g. VS Code's Git extension) can run with a stripped PATH
# that misses version-manager-managed tools, and dependencies can be missing
# right after a pull that changed the lockfile. This script therefore:
#   1. discovers node/pnpm from well-known version-manager locations,
#   2. auto-installs dependencies (pnpm install --frozen-lockfile) if turbo
#      is missing,
# before running the turbo tasks.

set -eu

# Always run from the repo root and make local binaries visible, so the
# script behaves the same whether invoked via `pnpm run`, lefthook, or
# directly from any working directory.
cd "$(dirname "$0")/.."
PATH="$PWD/node_modules/.bin:$PATH"
export PATH

# Best-effort discovery: prepend the newest node install found under common
# version managers (nvm standard + XDG layouts, fnm, asdf, mise, volta) and
# the pnpm home dir. Non-matching globs are skipped by the existence check.
node_bin="$(
  for root in \
    "${NVM_DIR:-$HOME/.nvm}" \
    "$HOME/.local/share/nvm" \
    "$HOME/.local/share/fnm" \
    "$HOME/.fnm" \
    "$HOME/.asdf" \
    "$HOME/.local/share/mise" \
    "$HOME/.volta"; do
    for dir in \
      "$root"/versions/node/*/bin \
      "$root"/node-versions/*/installation/bin \
      "$root"/installs/nodejs/*/bin \
      "$root"/*/bin; do
      if [ -x "$dir/node" ]; then
        printf '%s\n' "$dir"
      fi
    done
  done | sort -V | tail -n 1
)"
if [ -n "$node_bin" ]; then
  PATH="$node_bin:$PATH"
  export PATH
fi

pnpm_home="${PNPM_HOME:-$HOME/.local/share/pnpm}"
if [ -d "$pnpm_home/bin" ]; then
  PATH="$pnpm_home/bin:$PATH"
  export PATH
fi

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
