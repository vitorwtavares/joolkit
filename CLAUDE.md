# CLAUDE.md

Rules for working in this repo. Follow these exactly.

## Branching

- Every new task starts on a new branch checked out from `main`.
- Branch names follow the pattern `<type>/<short-description>` using conventional commits types (e.g. `feat/auth-flow`, `chore/cleanup-deps`, `fix/cover-letter-tokens`).
- Never commit feature work directly to `main`.

## Committing

- When asked to commit, break changes into logical units — one commit per meaningful piece (e.g. deps separately from implementation, config separately from UI).
- All commit messages follow the Conventional Commits standard: `type(scope): description`.
  - Common types: `feat`, `fix`, `chore`, `docs`, `refactor`, `style`, `test`.
  - Scope is optional but use it when it adds clarity (e.g. `feat(client)`, `fix(server)`).
- Keep messages concise — one lowercase sentence, no period at the end.

## Project references

All project information lives in `project-refs/` at the repo root — implementation plan, specs, screenshots, and styled HTML wireframes. Consult this folder before starting any feature work.

## Pushing

- Never push to `origin` unless explicitly told to.
- When asked to push, push the current branch only — never `main` unless specifically instructed.
