# Vite+ Monorepo Starter

A starter for creating a Vite+ monorepo.

## Development

- Check everything is ready:

```bash
vp run ready
```

- Run the tests:

```bash
vp run -r test
```

- Build the monorepo:

```bash
vp run -r build
```

- Run the development server:

```bash
vp run dev
```

## Sync Router Skills

The manual `sync-skill` CLI synchronizes eligible package-level skills from the
`main` branch of `TanStack/router` into `.agents/skills`:

```bash
pnpm sync-skills
```

Use check mode to report additions or version mismatches without writing files:

```bash
pnpm sync-skills -- --check
```

The command resolves one upstream commit before reading its recursive Git tree
and downloads all selected files from that immutable revision. It scans only
`packages/{package}/skills/{skill}/SKILL.md` roots, keeps nested files with their
parent skill, and excludes paths or frontmatter marked for Solid or Vue. Local
skills are compared by exact `metadata.library_version` equality. A different,
missing, or malformed local version replaces the complete skill directory;
equal versions leave local content untouched. Check mode exits non-zero when an
addition or update is planned.
