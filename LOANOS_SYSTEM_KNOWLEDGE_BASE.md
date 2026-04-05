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

## Security Posture (as of 2026-04-05)

Pre-launch hardening sweep driven by `audits/SECURITY-AUDIT-2026-04-05.md`. All work tracked in `tasks/security-hardening-critical-gaps.md`.

### Tenant isolation primitives
- **`system_admins`** table — deny-all RLS (`FOR SELECT USING (false)`). Read only via service role. Source of truth for cross-tenant admin access.
- **`requireAdmin()`** helper (`src/lib/admin/auth.ts`) — primary code-level gate on every `/api/admin/*` route.
- **Middleware admin gate** (`src/middleware.ts`) — inline service-role `system_admins` lookup on every `/api/admin/*` request. Resilience floor so a future route missing `requireAdmin()` still can't leak.
- **Plan gate middleware** — professional-tier routes 402 / 403 at the edge, enforced from `PROFESSIONAL_API_PREFIXES` + `PROFESSIONAL_UI_PREFIXES` in `src/middleware.ts`.
- **No ambient tenant resolution** — every agent-secret route requires explicit `org_slug` (query param, header, or body field). "First org in the DB" fallbacks have been purged.
- **No hardcoded Adam identity** — NMLS, Publer IDs, Calendly, email, company, n8n URLs, app URLs all load from `organizations` + `user_settings` + env vars. Routes fail closed if config missing.

### Webhook security (Arive / LOS)
- **Per-org webhook routes** — `/api/webhooks/los/arive/[org_slug]` with 3-layer verification:
  1. Layer 1: slug resolves to an org (else 404)
  2. Layer 2: `X-Webhook-Secret` timing-safe match against hashed secret in `los_integrations` (SHA-256 + salt)
  3. Layer 3: payload identity (email / external_user_id) matches org allowlist
- **Shadow vs enforce** — per-org `org_settings.los_verification_mode`. Layer-3 mismatches log in shadow, reject in enforce.
- **Idempotency** — `webhook_deliveries` table with `UNIQUE (organization_id, source, idempotency_key)`. Helper: `src/lib/webhooks/idempotency.ts`. Prefers `X-Idempotency-Key` header, falls back to SHA-256 of `[arive_loan_id, arive_updated_at]`. Duplicate retries return `{deduped: true}` without re-running party upserts / activity log inserts.
- **Legacy single-tenant `/api/arive-webhook`** — deprecated, 30-day grace period, logs `[DEPRECATED]` on every hit.
- **Upstream path** — Arive → per-LO Zapier account → LoanOS. Arive doesn't offer direct third-party API access.

### Rate limiting
- **`/api/contacts/web-lead`** — 30 req/min per client IP (in-memory sliding window via `checkRateLimit`)
- **`/api/share/[token]`** — two-key defense: 60/min per IP + 30/min per token
- **In-memory only** — per-instance counters, not cluster-aware. Acceptable for current traffic (<1 req/s); move to Upstash/Redis if we scale horizontally.

### Atomic writes
- **`increment_scenario_view_count(uuid)` RPC** (migration 077) — `SECURITY DEFINER` + pinned `search_path = public`. Replaces lossy read-then-write in `/api/share/[token]`.

### Response headers (`next.config.mjs`)
- **CSP** — `default-src 'self'`; `connect-src` scoped to Supabase (https+wss) + Vercel analytics; `frame-src` Calendly; `frame-ancestors 'self'`; `object-src 'none'`; `upgrade-insecure-requests`. **Still carries `'unsafe-inline'` + `'unsafe-eval'` in script-src** because Next.js 14 ships inline scripts without nonces — future nonce rollout would drop both.
- **HSTS** — `max-age=63072000; includeSubDomains; preload` (~2 years)
- **X-Frame-Options: SAMEORIGIN**, **X-Content-Type-Options: nosniff**, **Referrer-Policy: strict-origin-when-cross-origin**, **Permissions-Policy** camera/mic/geo off
- **CORS** — no custom `Access-Control-Allow-Origin` anywhere. Next.js SOP handles browser calls; server-to-server callers are CORS-exempt.

### Security-related tables
| Table | Purpose | RLS |
|-------|---------|-----|
| `system_admins` | Cross-tenant admin membership | Deny-all (service role only) |
| `los_integrations` | Per-org webhook secrets + identity allowlist | Scoped to org members |
| `webhook_deliveries` | Idempotency + delivery audit trail | Deny-all (service role only) |
| `org_settings` | Per-tenant feature flags (`los_verification_mode`, onboarding_completed, etc.) | Scoped to org members |

### Secret inventory
| Secret | Location | Rotation doc |
|--------|----------|--------------|
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel env (all envs) | `docs/security/secret-rotation-runbook.md` |
| `LOANOS_AGENT_SECRET` | Vercel env | `docs/security/secret-rotation-runbook.md` |
| `ANTHROPIC_API_KEY` | Vercel env | `docs/security/secret-rotation-runbook.md` |
| Per-org Arive webhook secrets | `los_integrations.webhook_secret_hash` (SHA-256) | `docs/security/secret-rotation-runbook.md` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel env (public by design) | `docs/security/secret-rotation-runbook.md` |

### Outstanding (as of 2026-04-05)
- 🔴 **PII masking in `activity_log`** — biggest remaining GLBA exposure (tracker #3)
- 🟡 SSN/DOB/income field-level encryption at rest (tracker #5)
- 🟡 Admin action audit log (separate immutable 7yr-retention log) (tracker #9)
- 🟡 System admin vs org admin role separation (tracker #10)
- 🟢 IP allowlisting, SOC 2 Type 1, file upload size caps (tracker #11–13)

### Key security files
| File | Purpose |
|------|---------|
| `tasks/security-hardening-critical-gaps.md` | Running tracker of all pre-launch gaps |
| `audits/SECURITY-AUDIT-2026-04-05.md` | Full audit report (A-findings + S-findings + F-findings) |
| `src/lib/admin/auth.ts` | `requireAdmin()` helper |
| `src/lib/los/{hashSecret,resolveOrgFromSlug,verifyLosPayload}.ts` | LOS webhook verification |
| `src/lib/webhooks/idempotency.ts` | Delivery dedupe helpers |
| `src/lib/rateLimit.ts` | In-memory sliding window |
| `src/middleware.ts` | Edge-level admin + plan gates |
| `next.config.mjs` | CSP, HSTS, security headers |
| `supabase/migrations/076_security_hardening.sql` | RLS/policy fixes |
| `supabase/migrations/077_scenarios_increment_view_count.sql` | Atomic RPC |
| `supabase/migrations/078_webhook_deliveries.sql` | Idempotency table |
| `docs/security/WISP.md` | Written Information Security Program |
| `docs/security/data-retention-policy.md` | Retention schedule |
| `docs/security/secret-rotation-runbook.md` | Secret rotation procedures |

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
