# Repo Structure

Use this as a map before searching the whole repo. It describes ownership and intent, not every file.

## Root

| Path | Purpose |
| --- | --- |
| `README.md` | Quick setup and links to the current docs. |
| `AGENTS.md` / `CLAUDE.md` | Session rules for AI agents. Read the active instruction source before work. |
| `CONTEXT.md` | Live project status and session handoff context. |
| `CHANGELOG.md` | Historical changes. Large file; search it when you need chronology. |
| `DECISIONS.md` | Architecture decisions and why they were made. |
| `TODO.md` | Open work and Adam-blocked items. |
| `LOANOS_SYSTEM_KNOWLEDGE_BASE.md` | Product truth and marketing-safe claims. |
| `package.json` | App scripts and dependencies. |
| `vercel.json` | Vercel cron/config surface. |

## App Code

| Path | Purpose |
| --- | --- |
| `src/app/` | Next.js App Router pages, layouts, and route handlers. |
| `src/app/api/` | Server-only API routes for browser calls, agents, webhooks, cron, and integrations. |
| `src/app/dashboard/` | Authenticated product surfaces. |
| `src/app/share/[token]/` | Public scenario share pages. |
| `src/components/` | Shared UI components. |
| `src/components/ui/` | Local shadcn/Radix-style primitives. |
| `src/lib/` | Domain logic, Supabase clients, auth helpers, integrations, and shared utilities. |
| `src/workflows/` | Workflow DevKit implementations. |
| `src/middleware.ts` | Supabase session refresh and route protection. |

## Data And Integrations

| Path | Purpose |
| --- | --- |
| `supabase/migrations/` | Database migrations. Apply carefully; several numbers have suffixes from rapid fixes. |
| `supabase/*.sql` | One-off setup, seed, or cleanup scripts. |
| `n8n/` | n8n workflow exports, prompts, and snippets. |
| `n8n-workflows/` | Additional workflow JSON backups. |
| `automations/` | Automation templates and workflow support docs. |
| `scripts/` | Operational import, verification, and maintenance scripts. |
| `notebooklm-service/` | Local NotebookLM helper service. |

## Documentation And Planning

| Path | Purpose |
| --- | --- |
| `docs/` | Current developer, agent, security, setup, and product docs. |
| `docs/security/` | WISP, data retention, and secret rotation docs. |
| `docs/superpowers/specs/` | Historical design specs for major features. |
| `docs/superpowers/plans/` | Historical implementation plans. |
| `tasks/` | Agent workspaces, run logs, audits, blockers, and research. |
| `audits/` / `_audit/` | Security and product audit archives. |

## Tests

| Path | Purpose |
| --- | --- |
| `tests/` | Cross-module and workflow tests. |
| `tests/mismo/` | MISMO parser coverage. |
| `tests/security/` | Security-oriented checks. |
| `src/lib/*.test.ts` | Unit tests colocated with library code. |
| `vitest.config.ts` | Vitest config. |

## Generated Or Local-Only Files

Do not commit build output, local secrets, or machine-specific caches. Examples include `.next/`, `.next.nosync/`, `node_modules/`, `.vercel/`, `.claude/`, `.superpowers/`, `.env.local`, `tsconfig.tsbuildinfo`, and `.DS_Store`.

If one appears in `git status`, decide whether it is already tracked. If it is tracked and generated, remove it from the index in a docs/structure cleanup PR rather than editing app behavior.
