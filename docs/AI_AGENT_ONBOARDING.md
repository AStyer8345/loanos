# AI Agent Onboarding

This repo moves quickly. Read this before changing code so you do not spend the first hour untangling old context.

## Start Here

1. Read `/Users/adamstyer/Documents/GOALS.md`.
2. Read `CONTEXT.md`.
3. Check `git status -sb` before editing. This repo often has active work from other agents.
4. If you will push, run `npm run build` first and watch the Vercel deployment after the push.
5. Keep changes scoped. If the worktree is mixed, stage only the files that belong to your task.

## Top 5 Reasons This Repo Is Hard For A New AI Agent

### 1. Several docs disagree about the current product state

The root `README.md`, `ARCHITECTURE.md`, `CONTEXT.md`, and the old `docs/README.md` have historically described different phases, deployment targets, auth details, and workflow owners. Treat `CONTEXT.md` as the live status file, then use `ARCHITECTURE.md` for technical reference. When in doubt, verify in code before trusting older docs.

### 2. Session state is intentionally spread across multiple files

Current goals live outside the repo in `GOALS.md`. Repo status lives in `CONTEXT.md`. Open work is split across `TODO.md`, `tasks/ADAM-TODO.md`, and agent-specific `tasks/**` files. Historical detail lives in `CHANGELOG.md` and `DECISIONS.md`. This is useful for continuity, but it means a new agent must read the right layer instead of searching randomly through hundreds of task files.

### 3. The worktree may include unrelated agent output

The repo is shared by interactive and scheduled agents. Before touching anything, inspect `git status -sb` and assume pre-existing changes belong to someone else. Do not run broad cleanup or `git add -A` unless the user explicitly asks for the entire worktree to be included.

### 4. Database and tenant rules are dense

Supabase migrations are numerous, with some duplicate numeric prefixes from rapid iteration. The generated type file is `src/lib/database.types.ts`, and strict TypeScript is on. Tenant isolation is central: most app data must stay organization-scoped, service-role writes need extra care, and Supabase `Json` conversions often require an `unknown` cast before domain typing.

### 5. Integrations are real production surfaces

LoanOS is connected to Vercel, Supabase, n8n, Resend, Arive/LOS workflows, and marketing automation. Many routes exist for agent or webhook callers rather than browser users. Before changing integration code, identify the caller, auth method, required env vars, and whether a scheduled workflow depends on the route.

## High-Signal Files

| Need | Read |
| --- | --- |
| Current project status | `CONTEXT.md` |
| Active priorities | `/Users/adamstyer/Documents/GOALS.md` |
| Open work and Adam decisions | `TODO.md`, `tasks/ADAM-TODO.md` |
| Architecture reference | `ARCHITECTURE.md` |
| Product truth | `LOANOS_SYSTEM_KNOWLEDGE_BASE.md` |
| Design system | `docs/THEME.md` |
| Tenant/security context | `tasks/security-hardening-critical-gaps.md`, `docs/security/` |
| Database schema types | `src/lib/database.types.ts` |
| Repo map | `docs/REPO_STRUCTURE.md` |

## Safe Change Checklist

- Confirm the work serves the current goals.
- Create or use a non-`main` branch.
- Read the files you will edit plus their nearest helpers.
- Prefer existing patterns over new abstractions.
- For docs-only work, avoid touching app files, migrations, generated types, or dependency manifests.
- Run the smallest useful verification, and run `npm run build` before any push.
- After pushing, check Vercel until the deployment is `READY`.
