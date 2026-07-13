# AI Agent Onboarding

This repository moves quickly and contains active application code, production integrations, historical task files, and generated artifacts. Read this before changing code.

## Start here

1. Read `../AGENTS.md`.
2. Read `../CONTEXT.md` for current project state.
3. Read `REPO_STRUCTURE.md` before broad searches or cleanup.
4. Check `git status -sb` before editing.
5. Keep the change scoped and avoid absorbing unrelated worktree changes.

A local `GOALS.md` may provide additional business priorities, but agents must not assume a specific machine path or stop solely because that external file is unavailable.

## Main sources of friction

### Startup documents may disagree

Older files can describe obsolete deployment targets, integrations, product phases, or schema details. Treat `CONTEXT.md` as current operational state and `ARCHITECTURE.md` as durable technical reference, then verify material claims against code and configuration.

### Current work and historical work are mixed

Use `TODO.md` for active work. Treat most content under `tasks/`, `audits/`, `_audit/`, and old implementation plans as working history unless a current document explicitly points to it. Do not execute an old prompt merely because it exists.

### The worktree may contain unrelated agent output

Assume pre-existing changes belong to another task. Do not use broad staging or cleanup commands unless the full worktree is intentionally in scope.

### Database and tenant rules are dense

Supabase migrations are extensive, TypeScript strict mode is enabled, and organization-level tenant isolation is central. Before changing data access, identify the organization scope, RLS implications, service-role behavior, and generated types involved.

### Integrations are production surfaces

LoanOS connects to services including Vercel, Supabase, n8n, email providers, LOS workflows, and AI providers. Before changing an integration, identify its callers, authentication, required environment variables, failure behavior, and scheduled dependencies.

## High-signal files

| Need | Read |
| --- | --- |
| Agent rules | `../AGENTS.md` |
| Current project state | `../CONTEXT.md` |
| Open work and Adam decisions | `../TODO.md` |
| Architecture | `../ARCHITECTURE.md` |
| Product truth | `../LOANOS_SYSTEM_KNOWLEDGE_BASE.md` |
| Repository map | `REPO_STRUCTURE.md` |
| Design system | `THEME.md` |
| Database types | `../src/lib/database.types.ts` |
| Security policies | `security/` |

## Safe-change checklist

- Confirm the requested scope and current project state.
- Use a non-`main` branch for substantive changes.
- Read the files being changed and their direct callers or consumers.
- Prefer existing patterns over new abstractions.
- Keep documentation-only work separate from application behavior changes.
- Run the smallest relevant verification and `npm run build` before pushing code.
- Verify deployment status after pushing.
- Update or clearly label stale documentation discovered during the task.
