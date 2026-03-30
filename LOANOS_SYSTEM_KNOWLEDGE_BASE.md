# LoanOS System Knowledge Base
> Master reference for all AI agents, research sessions, and build sessions.
> Updated: 2026-03-25
> Source of truth: CONTEXT.md (session history) + this file (architectural constants)

---

## What LoanOS Is

LoanOS is a mortgage intelligence platform built by Adam Styer (Senior LO, Austin TX, NMLS #513013).
- **Phase 1–2**: Personal production tool replacing Jungo CRM, Mortgage Coach, scattered Claude workflows
- **Phase 3–4**: Licensed SaaS for other mortgage loan officers (multi-tenant)
- **Not** a consumer product. Built for LOs who originate 10–30 loans/month.

---

## Repositories & Deployment

| Repo | Host | URL | Stack |
|------|------|-----|-------|
| `AStyer8345/loanos` (main) | Vercel | loanos.vercel.app | Next.js 14, Supabase, Tailwind |
| `styer-mortgage-site` | Netlify | styermortgage.com | Plain HTML/CSS/JS + Netlify Functions |

- Vercel team: `astyer8345s-projects` — Team ID: `team_aJNpxKvLlNTUiDdWTdhX0Vgf`
- Vercel project ID: `prj_AmhlkvLIUzzlqpOtCrUy9PCyPiSx`
- Supabase project ID: `uuqedsvjlkeszrbwzizl`
- Local repo: `/Users/adamstyer/Documents/loanos-clone`

---

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | Next.js 14 (App Router) | TypeScript strict mode |
| Hosting | Vercel | Auto-deploy on push to main |
| Database | Supabase (Postgres) | Types in `src/lib/database.types.ts` |
| Auth | Supabase email/password | SSR-aware via `@supabase/ssr` |
| File Storage | Supabase Storage | `documents` bucket (private), `social-assets` (public) |
| Automation | n8n | Instance: styer.app.n8n.cloud |
| AI | Claude API (Anthropic) | claude-sonnet-4-5, no date suffix |
| Email | Outlook via n8n + Zapier | Zapier hook for draft creation |
| Marketing Email | Mailchimp | List IDs in Netlify env vars |
| LOS | Arive | Webhook + CSV import |
| Billing | Stripe | Phase 4 — not yet built |

**UI Design Language**: Dark monochromatic, gold accent `#C9A84C`, IBM Plex Mono + Sans, Lucide icons, Tailwind slate palette. Linear/Attio-inspired light mode for some sections.

---

## Database Schema — Core Tables

All 15 data tables are org-scoped with `organization_id` (or `org_id`) + RLS policies.

### Tenant Model
- Every tenant = one **organization** (`organizations` table)
- Every user = one **profile** (`profiles` table, linked to `organizations` via `org_id`)
- RLS function: `get_user_org_id()` — all policies filter by this
- One org per LO by default. Team plan allows multiple users per org.

### Key Tables

| Table | Purpose | Org Column |
|-------|---------|-----------|
| `organizations` | Tenant record — name, NMLS, logo, brand_color, plan, slug | — (is the org) |
| `profiles` | User record — links auth user to org | `org_id` |
| `org_settings` | Per-tenant integration config (webhooks, Arive, n8n, etc.) | `org_id` |
| `loans` | 816 historical + live Arive-synced loans | `organization_id` |
| `contacts` | 2,441 borrowers + realtors + others | `organization_id` |
| `activity_log` | Immutable audit log — all loan/contact events | `organization_id` |
| `documents` | PDF uploads, linked to loans | `organization_id` |
| `email_drafts` | Outlook draft queue | `organization_id` |
| `scenarios` | Scenario builder outputs | `organization_id` |
| `todo_items` | Task queue | `organization_id` |
| `chat_sessions` | AI chat history | `organization_id` |
| `contact_activity` | Contact-level touchpoint log | `organization_id` |
| `marketing_activity_log` | MCC send/call history | `organization_id` |
| `mcc_state` | Marketing Command Center state | `org_id` |
| `user_settings` | Per-user preferences | user-scoped |
| `system_prompts` | AI prompt templates | `org_id` |
| `loan_milestone_events` | Arive milestone triggers | via loans join |
| `milestone_communications` | Agent-generated email drafts | via loans join |

### Migration History (applied through 2026-03-25)
- Migrations 001–053 applied to production Supabase
- Migration 053: NOT NULL constraint on 8 tables (loans, contacts, documents, email_drafts, scenarios, todo_items, contact_activity, chat_sessions)
- `activity_log.organization_id` still nullable — trigger in place, NOT NULL pending WF1/WF2 cloud push

---

## Multi-Tenancy Status (as of 2026-03-25)

**Complete:**
- All 15 tables org-scoped with RLS (migrations 029–053)
- 0 null org rows in all tables
- Onboarding flow: collects Tier 1 data, creates org, links profile, seeds org_settings, redirects to dashboard
- Isolation verification script: `scripts/verify-tenant-isolation.ts`
- daily-briefing milestone queries org-scoped (fixed 2026-03-25)

**Pending (blockers):**
- Adam must push WF1 (`1tagvoU0UXtdDiMY`) to n8n cloud — produces null activity_log rows until pushed
- Adam must push WF2 (`9JyzzwKac8v3uQ7d`) to n8n cloud — same
- `activity_log.organization_id` NOT NULL — safe to add after WF1/WF2 confirmed pushed
- Performance page uses localStorage with real borrower names — must move to Supabase before licensing
- Plan selection UI in onboarding deferred (defaults to 'starter')

---

## n8n Workflows

| Workflow | ID | Status | Purpose |
|----------|----|--------|---------|
| Arive New Loan → Supabase | `1tagvoU0UXtdDiMY` | ✅ Tested, needs cloud push | WF1: new loan upsert + contact + activity_log |
| Arive Status Update → Supabase | `9JyzzwKac8v3uQ7d` | ✅ Tested, needs cloud push | WF2: loan status + activity_log |
| Milestone Communication Agent | `1hjOmS7inZcxEJQr` | ✅ Tested | Arive milestone → Claude → Outlook draft |
| Referral Intro Email | `YbgDnTpPdefcazKy` | ✅ Tested | n8n → Claude → Zapier → Outlook draft |
| Pre-Approval Email | `utMvZpkdRwIRZ51u` | ✅ Tested | n8n → Claude → Zapier → Outlook draft |
| Final CD Email | `SkzrWeR0bHZs8kWX` | Untested | CD closing disclosure email |
| New Application Received | `cWESnXXy9UOLB13q` | Untested | New app intake |
| Contract Received | `UfNcdpoVKQZqy0fj` | Phase 2 | Contract PDF → Claude extraction → Outlook |
| Refi Intake Email | `yCTydQ7RfZK4DyUg` | Untested | Refi intake |
| Inbound Email → Supabase | `qgb99Eh2ziy0INMk` | Inactive | Needs Outlook credential |
| Weekly Social Post | `eJG4wckrj6SmSpm1` | Fixed, inactive | Needs Gemini key + Google Sheets |
| Review Request Email | `AK1fBcaX1cPcdlGx` | Fixed, inactive | Needs SMTP + review URLs |

### n8n Code Patterns (ALWAYS use these)
- Webhook body in downstream nodes: `$('Webhook').first().json` (NOT `.json.body`)
- Claude model: `claude-sonnet-4-5` — NO date suffix ever
- Claude response: `$json.content[0].text`
- Supabase headers: both `apikey` AND `Authorization: Bearer <service_role_key>` required
- HTTP body for JSON POST/PATCH: use `contentType: "raw"` + `rawContentType: "application/json"` + `JSON.stringify(...)` in body

---

## API Routes (Key Endpoints)

| Route | Auth | Purpose |
|-------|------|---------|
| `/api/arive-webhook` | `ARIVE_WEBHOOK_SECRET` header | Receives Arive loan events |
| `/api/contacts/web-lead` | Bearer `LOANOS_AGENT_SECRET` | Inbound leads from styermortgage.com |
| `/api/agents/milestone` | Bearer `MILESTONE_WEBHOOK_SECRET` | Milestone communication agent trigger |
| `/api/chat` | Supabase auth | AI chat (Claude) |
| `/api/todos` | Supabase auth | Todo CRUD |
| `/api/org/create` | Supabase auth | Onboarding — create org + profile link |
| `/api/outlook-sync` | `OUTLOOK_SYNC_SECRET` | Inbound email sync (decommissioned) |

**Decommissioned:** Outlook Email Sync (`JMmstRl2C5ylmuIY`) — Azure App Registration never completed. Do not reference as active.

---

## Phase Roadmap

### Phase 1 — Foundation ✅ COMPLETE
Supabase schema, auth, PDF upload, dashboard, contacts, loans (816 imported)

### Phase 2 — Automation (~95% complete)
Live: contract automation, marketing command center, contacts module, loans module, Arive webhook, daily briefing, AI chat (v4.6 with attachments + voice)

Needs go-live steps:
- Milestone Communication Agent (run migration 010, add 2 Vercel env vars)
- AI Chat (add `ANTHROPIC_API_KEY` to Vercel)
- Outlook integration (Azure app reg + 7 env vars + migration 008) — low priority, possibly skip

### Phase 3 — Multi-Tenant SaaS (in progress)
Multi-tenancy foundation complete. Remaining: performance page localStorage fix, plan selection UI, activity_log NOT NULL after WF1/WF2 push

### Phase 4 — Licensing
Stripe billing, white-label (slug-based custom domains), admin dashboard for tenant management. Not started.

---

## Architectural Decisions (Locked)

- **One org per LO** by default. Team plan = multiple users per org.
- **Loan import = n8n WF1/WF2 only** — authoritative writers from Arive. Never import loans via direct SQL in production.
- **n8n stays per-tenant** — each org gets their own webhook endpoints.
- **No Microsoft Azure / Outlook Email Sync** — decommissioned. Not part of the product.
- **No shared data between orgs** — ever. No marketplace features in Phase 3.
- **Service role key** in API routes is acceptable server-side BUT must always scope queries by `organization_id` explicitly.
- **Org slug** (`organizations.slug`) reserved for future white-label URLs (e.g., `styer-mortgage`).
- **Stripe** is Phase 4 — `organizations.plan` stored as a string for now (`'starter'`, `'pro'`, `'team'`).
- **Build must pass before every push** — `npm run build` enforced by pre-push git hook.

---

## What NOT to Build (Anti-patterns)

- Do not add Azure/Outlook Email Sync features
- Do not add Stripe integration before Phase 4
- Do not touch the public-facing website (separate repo: styer-mortgage-site on Netlify)
- Do not use `@vercel/postgres` or `@vercel/kv` (sunset) — use Neon/Upstash via Marketplace
- Do not use `createClient` from `@supabase/supabase-js` directly in frontend — use `@/lib/supabase/client`
- Do not bypass RLS with service role key without explicit `organization_id` filter

---

## Key File Locations

| File | Purpose |
|------|---------|
| `CONTEXT.md` | Session history + current status (read before every session) |
| `CLAUDE.md` | Claude Code instructions + deploy workflow |
| `src/lib/database.types.ts` | Supabase generated types |
| `src/lib/supabase/client.ts` | SSR-aware browser client |
| `src/lib/supabase/server.ts` | Server-side client |
| `src/lib/formatters.ts` | Shared date/currency formatters |
| `supabase/migrations/` | All migrations (001–053+) |
| `scripts/verify-tenant-isolation.ts` | Isolation test script |
| `docs/multitenancy-checklist.md` | Running multi-tenancy status |
| `tasks/enterprise/` | Enterprise agent system files |
| `tasks/run-logs/` | Daily session logs |
| `tasks/todo.md` | Current task backlog |
