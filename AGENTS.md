# AGENTS.md

Rules for working in this repo. Follow these exactly.

## Branching

- `dev` is the active development branch. `main` is reserved for Vercel deploys only.
- Every new task starts on a new branch checked out from `dev`. Always pull from `origin dev` first to get the latest changes before creating the branch.
- **Hotfixes that must go to `main` directly must be branched from `main`, not from `dev`.** Branching a hotfix from `dev` will carry all unmerged dev commits into the PR and accidentally deploy dev to production. Use `git cherry-pick` to apply the same commits to both targets when needed.
- Branch names follow the pattern `<type>/<short-description>` using conventional commits types (e.g. `feat/auth-flow`, `chore/cleanup-deps`, `fix/cover-letter-tokens`).
- Never commit feature work directly to `dev` or `main`.

## Committing

- Never commit without being explicitly asked to — always wait for the user to review changes first.
- When asked to commit, break changes into logical units — one commit per meaningful piece (e.g. deps separately from implementation, config separately from UI).
- All commit messages follow the Conventional Commits standard: `type(scope): description`.
  - Common types: `feat`, `fix`, `chore`, `docs`, `refactor`, `style`, `test`.
  - Scope is optional but use it when it adds clarity (e.g. `feat(client)`, `fix(server)`).
- Keep messages concise — one lowercase sentence, no period at the end.
- Before committing, always run prettier on all changed files: `pnpm prettier --write <files>` from the repo root.

## Code style

- Always prefer `async/await` over `.then()` chains unless `.then()` is genuinely necessary.
- Always use shadcn components before writing custom markup. The process is:
  1. Check `client/src/components/ui/` for already-installed components.
  2. If none fits, use the shadcn MCP tool (`mcp__shadcn__search_items_in_registries` or `mcp__shadcn__list_items_in_registries`) to check whether a suitable component exists in the registry.
  3. If it exists, add it to the project with the shadcn CLI (`pnpm dlx shadcn@latest add <component>` from the `client/` directory) and use it.
  4. Only write custom markup if no shadcn component covers the use case.

## Client folder structure

- `client/src/api/` — Supabase client, base API client, and TanStack Query hooks (`api/hooks/`)
- `client/src/lib/` — shadcn-related helpers (e.g. `utils.ts` exports the `cn` utility used by all UI components)
- `client/src/utils/` — pure utility functions, one function per file, named after the function it exports (e.g. `getInitials.ts` exports `getInitials`)

## Pushing

- Never push to `origin` unless explicitly told to.
- When asked to push, push the current branch only — never `main` unless specifically instructed.
