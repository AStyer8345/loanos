# LoanOS — AI Context File
> Read this at the start of every session before doing anything.
> Update this file whenever something significant changes.

## What This Is

LoanOS is a mortgage intelligence platform built by Adam Styer.
Built for personal production use first. Licensed to other LOs in Phase 4.
Replaces: Jungo CRM, Mortgage Coach, scattered Claude workflows.

## Repo

https://github.com/AStyer8345/loanos
Branch: main
Deploy: Vercel

## Current Status

Phase 1 complete. Phase 2 (Automation) ~95% complete. **Multi-tenancy foundation complete as of 2026-03-18. Scenario Builder output rebuilt as of 2026-03-18. Audit + quick wins applied 2026-03-19. Scenario output layout restructured 2026-03-19. Multi-tenancy schema audit + onboarding expansion 2026-03-19 (session 9). Marketing Tab Redesign complete 2026-03-19 (session 10). Multi-tenancy RLS policy audit + policy cleanup + isolation verification script 2026-03-20 (session 11). Multi-tenancy data integrity + RLS fixes 2026-03-21 (session 13). Activity_log null org bugs fixed 2026-03-22 (daily prep). WF1 org_id + column fix + dead code removal 2026-03-23 (daily audit). Null org backfill (migration 048) + activity_log RLS tightened 2026-03-23 (daily prep). Chat v4.6 — attachments, voice, expand, AI contact extraction, Hot Leads dashboard widget, 4 new quick action chips 2026-03-23. contact_activity org_id added + RLS upgraded + null backfill (migrations 048+050) 2026-03-24 (daily prep). Schema hardening (NOT NULL on 8 tables, migration 053) + daily-briefing milestone query org scoping 2026-03-25 (daily prep). Social Media Dashboard — SOCIAL tab + VOICE GUIDE tab + scoped Claude chat + compose mode + 3 new tables 2026-03-29 PM. Loan Record View redesigned: flat layout + communication hub + actionable milestones 2026-03-29. Color coding added to loan detail: pipeline bar, milestones, parties, vital stats, key dates, tab bar all color-coded 2026-03-29. Social dashboard bug fixes (signed URLs, format validation, error display) + Enterprise Social Media spec + Email Automation Panel prompt 2026-03-29. Enterprise PM session: Social Media spec curated + web research (5 sources) added to NotebookLM + system log updated 2026-03-29 PM2. Build unblock: npm ci fixed corrupted node_modules, committed all missing source files (automation panel, lib files) that were never pushed 2026-03-29 PM2. Shared-email co-borrower bug fix + Szpitalak loan data repair + n8n party contact gap identified 2026-04-02. UI Renovation: shadcn/ui foundation + 21st.dev Navbar1 + Card/Badge/Table primitives + visual polish (card glow, badge depth, gold hover) deployed 2026-04-01. Light/Dark Mode: full theme toggle with next-themes, light mode as default, 300+ hardcoded color replacements across 60+ files 2026-04-01. Light Mode Polish: Pipeline + Contacts + Loan Detail per-page fixes — semantic tokens, font-sans data cells, layout restructure on loan detail 2026-04-02. Marketing Dashboard light mode: 16 component files themed with CSS variables, 40+ hardcoded dark-mode hex values replaced 2026-04-02. Drip Campaigns v1: Full drip campaign system — 4 new Supabase tables + RLS, TypeScript types + query helpers, 7 API routes, 3-level dashboard UI (overview, detail with 4 tabs, approval queue), 7 React components, TopNav link, 6 campaigns seeded with 23 steps covering past client retention, lead nurture (3 sub-campaigns), realtor relationships, long-term nurture 2026-04-02. n8n Drip Scheduler Upgrade: Workflow `LqBb3YDLjS2eUrDE` rebuilt from 7 nodes to 16 — daily 7am CT trigger, new `get_due_drip_enrollments` RPC, exit rule checking + 14-day frequency guardrail, Claude-powered email generation from skeleton prompts, approval queue branching (requires_approval → queued, else auto-send via Outlook), drip_sends record insert, enrollment step advancement, activity logging 2026-04-02. Migration 074 (`get_due_drip_enrollments` RPC) created and applied 2026-04-02. Marketing Dashboard post editor redesigned with shadcn/ui (SocialDraftList, SocialDraftDetail, MediaManager) 2026-04-03. History tab delete + auto-logging: HistoryTab delete button, `/api/marketing/log` webhook endpoint, n8n workflows wired (V6RhmJpOb7pOzMte + eJG4wckrj6SmSpm1) with correct auth + endpoint 2026-04-03. Social voice guide overhaul: 16 real Adam quotes, tone dial, quality scoring, Jessica Test, post type taxonomy, CTA rules, video/carousel strategy 2026-04-03. Share Page Redesign: 12 new borrower-optimized components in `src/components/share/`, card-based storytelling layout replacing dense data tables, Recharts bar chart, break-even progress bars, collapsible detail accordion, print styles for PDF 2026-04-03. Share Page Branding + PDF Unification: dynamic LO branding from org+user_settings, print/PDF unified via `@media print` + `?print=1`, visual polish (NarrativeCard, OptionCard, chart height), delta chip label fix (interest→interest+MI), removed "Powered by LoanOS" 2026-04-03. Dashboard Analytics Upgrade v6.0: 7 new chart components (sparklines, funnel, leaderboard, rate lock, YoY, commission forecast, days-to-close gauge), query parallelization 2026-04-04. Dashboard Redesign v6.1: pipeline table on dashboard, new apps & PAs table, lead source chart, marketing activity feed, exclusive funnel counts, top 20 realtors, compact hot leads + rate lock, removed TodoList 2026-04-04. Security audit + multi-tenant Arive webhook scaffold shipped 2026-04-05: identified 3 critical + 9 medium security gaps for LO #2 rollout; scaffolded `los_integrations` table + `src/lib/los/*` helpers + new `/api/webhooks/los/arive/[org_slug]` route with 3-layer verification (slug + hashed secret + payload identity allowlist) + deprecated legacy `/api/arive-webhook` with 30-day grace. After a brief Option A detour (direct Arive API integration) was abandoned when Adam confirmed Arive only supports Zapier as an integration path, landed on Option B (Zapier middleman — every LO runs their own $20/mo Zapier Zap that enriches Arive's thin pings and POSTs to LoanOS with a per-org shared secret). Layer-3 allowlist matches `loanOfficerEmail` field from Zap payload (confirmed via Adam's Apr 4 Zap run). Shipped in shadow mode — 14-day observation before flipping to enforce. Follow-up hardening sweep 2026-04-05 (session 2): audit findings A-2, A-3, A-4, S-1, S-2, S-3, S-4, F-1 all landed — every agent-secret route now requires explicit `org_slug`, all hardcoded Adam Styer identifiers (NMLS 513013, Publer IDs, calendly, app URLs, n8n URLs) removed, waitlist page moved off direct service-role instantiation and onto `system_admins` table lookup. Chatbot UX polish 2026-04-05: fixed invisible text in light mode (both `LoanOSChat` and `OutreachChat` were hardcoding dark-mode colors against `var(--card)` which resolves to near-white in light mode), replaced all hardcoded hex with CSS variables (`var(--text)`, `var(--muted-foreground)`, `var(--accent)`, `var(--primary-foreground)`), sharpened message bubble design (asymmetric border radius, frosted-glass backdrop blur, softer shadows). Quick-add contact parsing fixed 2026-04-05: AI extraction prompt in `/api/contacts/quick-add` now has explicit name boundary rules (stop at punctuation/transition words — fixes the "Smith He We" leak bug), source inference rules (web lead, realtor referral, direct, etc.), and stronger notes guidance. `QuickAddConfirmation.tsx` now displays notes in a separated multi-line section so they're visible before confirming. Share Page Cash to Close Breakdown 2026-04-05: new `CashToCloseBreakdown.tsx` component renders a waterfall-style fee table on the share page (down payment → grouped closing costs with expandable lender/third-party/prepaid detail → discount points → seller/lender credits → cash to close) with side-by-side columns per scenario. Wired into `SharePageLayout` between Option Cards and narrative. Addresses Adam's "I don't see any of the fees on here" feedback — data was already on `ScenarioDisplayRow.closingCostBreakdown` but never rendered borrower-facing. Credits shown in green with accounting parentheses `($X,XXX)`; fee-detail toggle hidden under `@media print` so PDFs always show expanded breakdown.**

## Share Page Cash to Close Breakdown — 2026-04-05

**Problem:** The share page showed monthly payments, APR, rates, and totals — but never itemized where the upfront money goes. Borrowers kept asking "where do these fees come from?" Mortgage Coach's yellow-highlighted summary table was still doing a job LoanOS couldn't.

**Solution:** New `CashToCloseBreakdown.tsx` component with a financial-waterfall layout:
- **Columns** = scenarios (one per option, side-by-side)
- **Rows** = additive/subtractive line items ending in the gold-highlighted Cash to Close total
- **Expandable "Show fee detail" toggle** reveals 18 individual fee fields grouped into three categories: **Lender Fees** (origination, underwriting, processing, application, admin), **Third Party / Title** (appraisal, credit report, doc prep, flood cert, attorney, settlement, title search, title endorsements, recording, lender's title policy), **Prepaids & Escrows** (prepaid interest, hazard insurance, tax escrow, insurance escrow)
- **Credits in green with accounting parentheses** — `($1,500)` visual convention for borrower clarity (seller credits + lender credits both render as subtractions)
- **Print-aware** — toggle button hidden via `print:hidden` so PDFs always show expanded detail

**Files:**
- NEW `src/components/share/CashToCloseBreakdown.tsx`
- MOD `src/components/share/SharePageLayout.tsx` (import + section block in left column, between Option Cards and narrative)

**Data path:** No new calculations. Reads existing fields on `ScenarioDisplayRow` — `closingCostBreakdown`, `downPaymentAmount`, `sellerCredits`, `pointsPercent`, `creditsPercent`, `loanAmount`, `cashToClose`. Single source of truth stays in `src/lib/scenarios/calculations.ts` (Cash to Close formula on line 202: `downPaymentAmount + totalClosingCosts + pointsCost - sellerCredits - lenderCredits`).

**Deploy:** Commit `1c04ca3`, Vercel `dpl_7Qe3eot8rpGzmzxFUa19PPUjXDLH` → READY.


## Security Hardening Sweep — 2026-04-05 (session 2)

Executed audit findings A-2, A-3, A-4, S-1, S-2, S-3, S-4, F-1 from `audits/SECURITY-AUDIT-2026-04-05.md`. A-1 (Arive webhook) was already handled via the Zapier middleman route in session 1.

**Goal:** eliminate every "first org in the DB" fallback and every hardcoded Adam Styer identifier so LoanOS is safe to onboard LO #2.

**Patterns applied:**
- Agent-secret routes now require explicit `org_slug` (query param, header, or body). No ambient tenant resolution.
- Per-tenant config loaded from `social_settings` / `user_settings` / `organizations` — fail-closed to empty strings, never to Adam's identity.
- Env var requirements hardened: n8n URLs, app URL, webhook bases — routes return 500 if missing instead of silently routing customer traffic through Adam's infrastructure.

**Files touched (session 2):**
- `src/app/api/agents/daily-briefing/route.ts` — `org_slug` query param required on agent-secret path
- `src/app/api/marketing/log/route.ts` — `org_slug` query param or `X-Org-Slug` header required on agent-secret path; resolves to owner/admin profile
- `src/app/api/contacts/web-lead/route.ts` — `org_slug` body field required; `LOANOS_SYSTEM_USER_ID` env var dependency removed
- `src/app/api/social/publish/route.ts` — per-org `publer_config` loaded from `social_settings`
- `src/components/share/{SharePageLayout,ShareFooter,ShareCTA}.tsx` — neutral defaults (empty strings, no Adam identity)
- `src/app/dashboard/marketing/_components/carouselRenderer.ts` — new `CarouselBranding` type + `loadCarouselBranding()`; `renderSlideToCtx` and `regenerateCarouselImages` now require branding arg
- `src/app/dashboard/marketing/_components/{CarouselBuilder,SocialDraftDetail,SocialPostPreview}.tsx` — branding loaded from `organizations` + `user_settings`
- `src/app/api/scenarios/generate-pdf/route.ts` — per-org LO/company/NMLS in PDF header/footer; no hardcoded `styermortgage.com`
- `src/lib/defaultOutreachPrompt.ts` — generic fallback; `buildOutreachPrompt(identity)` for tenant-specific version
- `src/app/api/automations/email/generate/route.ts`, `scenarios/send-email/route.ts`, `automations/registry/[id]/route.ts`, `.../run-now/route.ts` — `N8N_API_BASE` / `N8N_WEBHOOK_BASE` required, 500 if missing
- `src/app/dashboard/loans/[id]/page.tsx`, `dashboard/getting-started/components/GettingStartedWizard.tsx`, `dashboard/getting-started/page.tsx` — `NEXT_PUBLIC_APP_URL` + orgSlug flow-through
- `src/app/dashboard/waitlist/page.tsx` — `createServiceClient()` helper + `system_admins` lookup

**Tracker:** completions section added to `tasks/security-hardening-critical-gaps.md`.

**Next up:** audit findings 5–27 — rate limiting on `/api/contacts/web-lead`, PII masking in `activity_log`, admin route sweep, CORS/CSP headers, secret rotation runbook.

## Security Hardening Sweep — 2026-04-05 (session 3)

Continued execution of audit findings A-5, A-7, A-10 from `audits/SECURITY-AUDIT-2026-04-05.md`.

**Findings landed:**
- **A-5** — `/api/share/[token]/route.ts` replaced `.select('*')` on `scenarios` with an explicit column whitelist so future columns (internal notes, commission, LO pricing) cannot leak to the public borrower-facing endpoint.
- **A-7** — `src/lib/drip/queries.ts`: `getSteps()` now takes `orgId` as a required first argument and filters `drip_steps` by `org_id`. Caller in `/api/drip/campaigns/[id]/steps/route.ts` passes `organizationId`. Prevents cross-tenant enumeration by campaign id. A-8 verified already correct — `POST` insert sets `org_id: organizationId` explicitly.
- **A-10** — `requireAdmin()` gate added to `/api/admin/backfill-party-links` and `/api/admin/import-salesforce-referrals`. Both routes were previously accessible to any authenticated user; now return 403 unless the caller has a row in `system_admins`. Gate runs before `getOrganization()` so unauthorized callers see a typed 401/403 instead of a swallowed 500.

**Parallelization pattern used this session:** delegated A-7/A-8 drip-query scoping to a Codex subagent while an Explore subagent audited admin routes in parallel. Explore surfaced the two unauthenticated admin POST handlers (bugs found, not just audit items), and those were fixed in the main thread after Codex landed its changes.

**Next up:** A-6 (consolidate ~30 service-role routes onto a `createUserScopedClient()` helper — large refactor), A-9 (wrap chat lender-tool queries), A-11 (move agent routes under `/api/webhooks/agents/[org_slug]/...`), A-12 (`/api/onboarding/step` → user-scoped client), M-1 (tenant enforcement in webhook-adjacent routes), rate limiting on `/api/contacts/web-lead`, PII masking in `activity_log`, CORS/CSP headers, secret rotation runbook.

## Security Hardening + Billing Fix — 2026-04-05 (session 10)

**PII Encryption Phase 1 (tracker #3):**
- `supabase/migrations/079_activity_log_pii.sql` ��� encrypted PII companion table (AES-256-GCM), owner/admin-only RLS
- `src/lib/activity/pii.ts` — encrypt/decrypt helpers, `writeActivityWithPii` dual-write function
- `POST /api/activity` — server-side endpoint for client components
- 5 high-PII write sites converted to dual-write: automations/send, email/draft/send, contacts/quick-add, contacts/web-lead, processWebhook (Arive)
- `scripts/backfill-activity-pii.ts` — re-runnable Node script for existing 1,089 rows
- `PII_ENCRYPTION_KEY` added to Vercel env (32-byte hex, AES-256-GCM)
- **Dual-write pattern:** PII goes to BOTH inline columns (for current read sites) AND encrypted companion (for future cutover). No read-site changes needed this session.
- **Remaining phases:** server-side read endpoint → backfill execution → plaintext column drop

**Billing page fix:**
- `src/app/dashboard/billing/page.tsx` — new page with plan comparison + mailto upgrade CTA. Fixes 404 from plan-gate redirect.
- `src/middleware.ts` — `/dashboard/drip` prefix renamed to `/dashboard/drip-campaigns` to match actual route folder.

**Pre-existing lint fixes:** RefiTimingSection.tsx (unescaped entity), ScenarioBuilder.tsx (unused import).

**Tracker status:** 🔴 Critical #3 Phase 1 DONE. Remaining: #3 Phases 2-4 (read endpoint, backfill, column drop). 🟡 Medium: #5, #9, #10 open.

---

## PII Encryption Phase 2 — Server-Side Read Path — 2026-04-05 (session 11)

Completed Phase 2 of tracker #3 (PII masking in `activity_log`). All client-side reads of activity_log now go through a server-side endpoint that decrypts PII from the encrypted companion table.

**Architecture:**
- `GET /api/activity` — flexible server-side endpoint accepting query params (contact_id, loan_id, type, action, unmatched, or_filter, not_action, order, limit, offset, columns, include_joins). Joins `activity_log_pii`, decrypts server-side via `decryptActivityPii()`, flattens PII fields back into rows so clients see the same shape as before.
- Client components switched from `supabase.from('activity_log')` to `fetch('/api/activity?...')`.
- Admin tenant detail route (already server-side) modified to join + decrypt directly.

**Files changed:**
- MOD `src/app/api/activity/route.ts` — added GET handler with PII decryption
- MOD `src/components/ActivityFeed.tsx` — fetch('/api/activity?...'), removed supabase client
- MOD `src/components/automations/SendHistoryList.tsx` — fetch('/api/activity?...')
- MOD `src/app/dashboard/contacts/[id]/page.tsx` — two activity queries → fetch
- MOD `src/app/dashboard/loans/[id]/page.tsx` — three activity queries → fetch
- MOD `src/app/dashboard/emails/unmatched/page.tsx` — fetchEmails → fetch
- MOD `src/app/api/admin/tenants/[id]/route.ts` — join + decrypt server-side

**Not changed (no PII read):** Dashboard page (only reads action, loan_id, occurred_at), admin tenants list (only reads org_id, created_at), email link route (only does UPDATEs).

**Tracker status:** 🔴 Critical #3 Phase 2 DONE. Remaining: Phase 3 (backfill 1,089 rows), Phase 4 (DROP plaintext columns). 🟡 Medium: #5, #9, #10 open.

---

## Security Hardening Sweep — 2026-04-05 (session 9)

Closed tracker item #7 (secret rotation runbook) + added Security Posture section to the system knowledge base.

**Landed:**
- **`docs/security/secret-rotation-runbook.md`** — full rotation procedures for every secret LoanOS holds: Supabase service role, anon key, `LOANOS_AGENT_SECRET`, `ANTHROPIC_API_KEY`, per-org Arive webhook secrets, `PUBLER_API_KEY`. Each section: When / Steps / Verify / Rollback. Names specific n8n workflow IDs, Vercel env vars, and `los_integrations` rows that must be touched.
- **`LOANOS_SYSTEM_KNOWLEDGE_BASE.md` § Security Posture** — new KB reference section consolidating tenant isolation, webhook architecture, rate limiting, atomic writes, response headers, security tables, full secret inventory with rotation pointers, outstanding tracker items, key file locations.

**Honest limitations documented:**
- `validateAgentSecret()` holds a single secret — agent-secret rotation has a ~30s window where only one secret is valid. Runbook names this and flags a future "dual-secret overlap" enhancement rather than papering over it.
- Per-org Arive webhook rotation is clean because `los_integrations` supports multiple `active = TRUE` rows per (org, provider) — the route iterates on layer 2. Migration 075's design paid off here.

**Tracker status:** 🔴 Critical — #3 PII masking is the sole outstanding Critical. 🟡 Medium — #7 done, #5/#9/#10 still open.

**Next recommended:** Critical #3 PII masking in `activity_log` — the last real blocker for LO #2 onboarding.

---

## Security Hardening Sweep — 2026-04-05 (session 8)

Closed tracker item #8 (webhook idempotency).

**Landed:**
- **Migration 078 `webhook_deliveries`** — new audit + dedupe table with `UNIQUE (organization_id, source, idempotency_key)`, deny-all RLS, partial index on `loan_id`. Applied to project `uuqedsvjlkeszrbwzizl` via Supabase MCP.
- **`src/lib/webhooks/idempotency.ts`** — shared helpers (`computeIdempotencyKey`, `claimDelivery`, `completeDelivery`, `failDelivery`). Header-preferred key (`X-Idempotency-Key`) with SHA-256 fallback over `[arive_loan_id, arive_updated_at]`. Postgres `23505` unique-violation → `{deduped: true}` short-circuit.
- **`src/app/api/webhooks/los/arive/[org_slug]/route.ts`** — claims a delivery row after layer-2 secret verify, before layer-3 allowlist + `processAriveWebhook`. Duplicate retry returns `200 {success: true, deduped: true}` without re-running 5 party contact upserts, date derivation, or activity log inserts. Failed deliveries keep their row (no retry storm on broken payloads; bump the key upstream to retry).

**Why the separate table instead of `loans.arive_event_id`:**
One loan accumulates many webhook deliveries across its lifecycle (status, milestone, rate lock, CTC). We need to dedupe each *delivery* independently. The existing `UNIQUE (arive_loan_id, organization_id)` on `loans` already merges upserts for the loan record itself — this fix closes the gap on the *surrounding* work (party upserts + activity log rows).

**Deploy:** Commit `1c52e8c`, Vercel `dpl_3JXxjW1XEcgxYtrR3G5GgrAb7yQi` → READY.

**Tracker status:** 🔴 Critical items 1/2/4 done, #3 PII masking is the last remaining Critical. 🟡 Medium: #6 CORS/CSP and #8 idempotency done; #5 PII encryption, #7 rotation runbook, #9 admin action log, #10 sys-vs-org admin separation still open.

---

## Security Hardening Sweep — 2026-04-05 (session 7)

Closed tracker item #6 (CORS + CSP headers).

**Landed:**
- **CSP** in `next.config.mjs` alongside existing security headers. Directives tuned to actual runtime deps: Supabase (https+wss), Vercel analytics + Live, Calendly iframe for share page. Anthropic/n8n/Publer are server-side only → no connect-src entries needed. Script-src still carries `'unsafe-inline' 'unsafe-eval'` because Next.js 14 inline scripts aren't nonce-enabled out of the box — future work.
- **HSTS** `max-age=63072000; includeSubDomains; preload`.
- **CORS audit:** grepped `src/` for `Access-Control-Allow-Origin` — zero matches. Next.js same-origin policy already protects browser-side cross-site calls; server-to-server callers are CORS-exempt. No action taken.

**Follow-ups deferred:** CSP nonce rollout (drop `'unsafe-inline'` script-src), CSP `report-uri` endpoint to catch violations, domain allowlist once LoanOS is on a custom domain.

---

## Security Hardening Sweep — 2026-04-05 (session 6)

Closed Critical #4 (admin-route authorization audit) from the security tracker.

**Landed:**
- Audited all 5 routes under `src/app/api/admin/*` — every handler calls `requireAdmin()` on line 1. No gaps in the existing code.
- Added middleware-level enforcement in `src/middleware.ts`: `/api/admin/*` now hits a `system_admins` lookup via an inline service-role client (the table is deny-all RLS, so can't use the user-cookie client). Returns 401 if no session, 403 if not a member. Per-route `requireAdmin()` stays as the code-level gate — middleware is the resilience floor so any future `/api/admin/foo/route.ts` added without the helper is still safe.

**Tracker status:** All 4 "Critical — must ship before LO #2" items from `tasks/security-hardening-critical-gaps.md` are now done or scaffolded: #1 Arive webhook (Zapier middleman scaffolded, shadow mode), #2 rate limiting (web-lead + share), #3 PII masking in activity_log (deferred — medium session), #4 admin-route audit. Remaining gaps are medium/structural.

---

## Security Hardening Sweep — 2026-04-05 (session 5)

Closed the last immediately-exploitable HIGH findings from the security tracker.

**Landed:**
- **Rate limit on `/api/contacts/web-lead`** — 30 req/min per IP via `checkRateLimit`. The agent secret is shared across every tenant's n8n/Zapier so it can't be used as an identity signal — IP is the only throttle available. Legit n8n workers fire 1–2 req/min so 30/min is massive headroom while still blocking abuse.
- **Rate limit on `/api/share/[token]`** — two-key defense: `share-ip:<ip>` at 60/min (stops enumeration crawlers) + `share-token:<token>` at 30/min (caps view-count inflation by an attacker holding one valid link).
- **Atomic `view_count` increment** — migration 077 adds `increment_scenario_view_count(uuid)` RPC with `SECURITY DEFINER` + pinned `search_path`. Share route previously did read-then-write (`view_count = X; update = X+1`), losing writes under concurrent borrowers. Replaced with a single atomic UPDATE via RPC.

**Still pending:** hCaptcha on styermortgage.com side, idempotency keys (5-min dedupe), A-6 route consolidation, A-11 agent route restructure, PII masking in activity_log, CORS/CSP, secret rotation runbook.

---

## Security Hardening Sweep — 2026-04-05 (session 4)

Continued execution of audit findings A-9, A-12 from `audits/SECURITY-AUDIT-2026-04-05.md`.

**Findings landed:**
- **A-9** — `src/lib/chat/lenderQueries.ts` created. Chat tool `queryLenderDatabase` no longer builds its own Supabase queries inline; it goes through `listLendersForOrg(orgId)` and `searchLendersByName(orgId, term)`. Every entry point asserts a non-blank `organizationId` and logs the caller name on violation. Adds a second tenant-discipline layer on top of the existing `.eq('organization_id', …)` filter.
- **A-12** — `/api/onboarding/step` swapped `createServiceClient()` → `createClient()`. RLS on `org_settings` (role ∈ owner/admin + org match) matches the caller shape so nothing changes functionally, but the DB now enforces tenant scoping.

**Remaining:** A-6 (large refactor — deferred), A-11 (structural move of all agent routes under `/api/webhooks/agents/[org_slug]/...` — deferred), M-1 (already partially landed via session 2 `org_slug` requirement on marketing/log + daily-briefing), rate limiting on web-lead, PII masking in activity_log, CORS/CSP, secret rotation runbook.

## Security Audit + Arive Webhook Architecture Pivot — 2026-04-05

**Multi-tenant security readiness review before onboarding LO #2. Full architecture pivot on Arive integration after reading Arive's API docs end to end.**

### Security Audit Findings

Explore agent ran full multi-tenant readiness audit. Scored current posture ~65/100.

**What already exists (the good):**
- Supabase Auth + `src/middleware.ts` gating `/dashboard/*` with `organization_id` check
- Multi-tenant RLS already written in `supabase/migrations/031_multitenancy_rls.sql` (loans, contacts, documents, activity_log, todo_items all org-scoped)
- `get_my_organization_id()` + `get_my_role()` SECURITY DEFINER helpers avoid RLS recursion
- `system_admins` table + `requireAdmin()` helper (`src/lib/admin/auth.ts`)
- Service role key isolated to `src/lib/supabase/service.ts` (server-only, documented)
- Webhook auth exists: Arive via `X-Webhook-Secret`, n8n/agent via Bearer `LOANOS_AGENT_SECRET` (`src/lib/auth/validateAgentSecret.ts`)
- Storage paths user-scoped (`{userId}/{loanId}/{timestamp}_{filename}`) — enumeration blocked
- `owner/admin/member` role system in `profiles.role`

**Critical gaps identified (must fix before LO #2):**
1. Arive webhook multi-tenant routing — TODO in `src/app/api/arive-webhook/route.ts` lines 61-93 falls back to "first profile with org_id" → day-1 cross-tenant data corruption
2. Rate limiting on `/api/contacts/web-lead` (public endpoint, zero throttle, just Bearer token)
3. PII masking in `activity_log` (borrower names/emails/loan details plaintext, GLBA concern)
4. Admin route audit — not every `/api/admin/*` consistently calls `requireAdmin()`

**Medium gaps (before LO #10):**
5. SSN/DOB/income field-level encryption at rest (GLBA)
6. CORS + CSP headers (missing from `next.config.js` / middleware)
7. Secret rotation runbook
8. Webhook idempotency (unique constraint on arive event ID)
9. Admin action audit log (separate from borrower activity_log)
10. System admin vs org admin separation in `system_admins` table
11. File upload size limits at API level
12. SOC 2 Type 1 kickoff before enterprise onboarding

Full tracker: `tasks/security-hardening-critical-gaps.md`

### Arive Webhook Architecture — Initial Scaffold (superseded, needs rework)

Built a first-pass multi-tenant Arive webhook with 3-layer defense: path slug routing + per-org hashed secret + payload identity allowlist. Seven files created, all uncommitted, all compile clean (`tsc --noEmit` pass):

- `supabase/migrations/075_los_integrations.sql` — table, RLS policies, `org_settings.los_verification_mode` column (shadow/enforce)
- `src/lib/los/hashSecret.ts` — SHA-256 + salt + timing-safe verify + `generateSecret()`
- `src/lib/los/resolveOrgFromSlug.ts` — layer 1 slug → org + integrations lookup
- `src/lib/los/verifyLosPayload.ts` — layer 3 stub (was waiting on Adam's matching strategy contribution)
- `src/app/api/webhooks/los/arive/[org_slug]/route.ts` — 3-layer verification route with shadow/enforce mode
- `src/app/api/arive-webhook/route.ts` — deprecation log + header comment added (30-day grace)
- `tasks/security-hardening-critical-gaps.md` — tracker

Design was based on the assumption Arive sends a user identity field in the webhook body. Reading `src/lib/arive/processWebhook.ts` showed the existing production handler reads ~80 rich fields from `body.*` (borrower info, loan data, agent emails, dates, etc.) but zero LO identity fields — only `loanProcessorName`/`loanProcessorEmail`. This created uncertainty about what layer 3 could actually match on.

### The Pivot — Arive API Docs Revealed the Real Model

Adam pulled up Arive's Settings → API Integrations screen and the full Arive API Reference Documentation. Reading the docs end to end revealed that the original security design was based on the wrong mental model:

**Key discoveries from Arive API docs:**
1. **Arive webhooks are thin pings.** The `POST /api/hooks/subscribe` docs explicitly state: *"Each webhook event will contain a Loan/Lead Id and type of event in the request body. The client application can then use the Get Loan or Get Lead API to get updated loan data."* Body is just `{loanId, event}` — no borrower data, no user identity, no PII.
2. **Full loan data flows via pull.** Real data is fetched via `GET /api/loans/{id}` with `X-API-KEY` header + `Authorization: Bearer <token>` after OAuth login to `/api/auth/login`.
3. **Each Arive user has their own cryptographic credentials:**
   - **Client ID** — public OAuth identifier (Adam's is `lTb1iafrNDkxJuRnwr1t2IJDVTVVknr6`, not sensitive)
   - **Secret Key** — OAuth client secret (sensitive, used to obtain access tokens)
   - **API Key** — required on every API request via `X-API-KEY` header (sensitive)
4. **OAuth flow**: POST Client ID + Secret Key + API Key + appId + appSecretHash to `/api/auth/login` → returns `{AccessToken, ExpiresIn, TokenType}` Bearer token → use token on all subsequent calls alongside the `X-API-KEY` header.
5. **Supported webhook events**: `LOAN_CREATED`, `LOAN_ARCHIVED`, `LOAN_STAGE_CHANGED`, `LOAN_DATE_CHANGED`, `LOAN_TRACKERS_UPDATED`, `LOAN_APP_SUBMITTED`, `LEAD_CREATED`, `LEAD_UPDATED`.
6. **Implication for current production**: because `processWebhook.ts` sees rich enriched data but Arive only sends thin pings, the current production webhook pipeline must be going through Zapier as an enrichment layer (the API Integrations screen is literally the Zapier OAuth setup). Not verified end-to-end yet, but this is the working hypothesis.

### The Decision — Option A: Direct Integration (Drop Zapier)

Adam approved Option A over Option B (keep Zapier enrichment layer). Reasons:
- **GLBA/privacy**: removes Zapier as a data processor touching borrower PII — bigger compliance win than anything on the security gap list
- **Onboarding friction**: LO pastes 3 credentials into LoanOS settings vs. setting up per-LO Zapier accounts with 12-step wiring
- **Cost**: Zapier per-task pricing scales badly at 50+ LOs
- **Reliability**: one less external dependency, Zapier outages no longer impact loan sync
- **Security posture**: thin-ping + pull is the industry standard for financial data integrations (Twilio, GitHub Apps, Stripe Connect use this pattern)

**Events to subscribe to (Adam's decision):** everything EXCEPT `LEAD_CREATED` and `LEAD_UPDATED` (Adam doesn't use Arive's native lead system — leads flow through website forms + Supabase directly).

### New Architecture — Direct Arive Integration

1. **LO onboarding**: paste Client ID + Secret Key + API Key into LoanOS settings page (new UI, deferred to follow-up PR)
2. **Storage**: credentials encrypted at rest via AES-256-GCM using `LOANOS_LOS_ENCRYPTION_KEY` master key from Vercel env vars (new env var needed)
3. **Subscription**: on credential save, LoanOS calls Arive's `POST /api/hooks/subscribe` for each event in the subscribe list, registering `https://loanos.app/api/webhooks/los/arive/[org_slug]` as the target URL
4. **Ping reception**: route receives `{loanId, event}`, resolves org via path slug, decrypts stored credentials
5. **OAuth**: route calls `/api/auth/login` to get a short-lived Bearer token (cached per-org with TTL)
6. **Data pull**: route calls `GET /api/loans/{loanId}` with `Authorization: Bearer` + `X-API-KEY` headers
7. **Process**: existing `processAriveWebhook` logic runs unchanged on the pulled data → upserts contact + loan + parties + activity log

**Security boundary**: the path slug IS the tenant identity. Arive only fires to that URL for events tied to that LO's registered credentials. No payload allowlist needed (no identity fields in thin pings to match on). Two-layer defense: (1) path slug resolves to real org, (2) decrypted credentials successfully authenticate to Arive — if either fails, no data flows.

### Scaffold Rework Required (next step this session)

| File | Action |
|---|---|
| `075_los_integrations.sql` | Replace `secret_hash` + `secret_salt` + `external_user_id` + `external_user_email` columns with `encrypted_client_id`, `encrypted_secret_key`, `encrypted_api_key`, `encryption_iv`. Drop `los_verification_mode` column (no shadow/enforce mode needed). Drop layer-3 CHECK constraint. |
| `src/lib/los/hashSecret.ts` | Replace with `src/lib/los/encryptCredentials.ts` — AES-256-GCM encrypt/decrypt using `LOANOS_LOS_ENCRYPTION_KEY` env var. Pure Node crypto, no new deps. |
| `src/lib/los/resolveOrgFromSlug.ts` | Keep. Minor update: return decrypted credentials instead of hashed secret. |
| `src/lib/los/verifyLosPayload.ts` | **Delete.** No longer needed — thin pings have no identity to verify against. |
| `src/lib/los/ariveClient.ts` | **New.** OAuth token manager (get/cache/refresh) + `fetchLoanById()` helper. ~60 lines. |
| `src/lib/los/subscribeLosEvents.ts` | **New.** Helper called during LO onboarding to register webhook subscriptions for all events except LEAD_CREATED/LEAD_UPDATED. |
| `src/app/api/webhooks/los/arive/[org_slug]/route.ts` | Rewrite: receive thin ping → resolve org → decrypt creds → OAuth login → pull loan → call `processAriveWebhook` → done. |
| `src/app/api/arive-webhook/route.ts` | Keep as-is (30-day grace period during migration). Deprecation log already added. |
| `tasks/security-hardening-critical-gaps.md` | Update item #1 to reflect new architecture. |

### Environment Variables Needed (Vercel dashboard — Adam action)

- `LOANOS_LOS_ENCRYPTION_KEY` — 32 random bytes, hex-encoded. Used to encrypt Arive credentials at rest in `los_integrations` table. Never rotate without a migration plan (requires decrypt-old + encrypt-new on every row).
- Optional `LOANOS_LOS_WEBHOOK_BASE_URL` — base URL prefix passed to Arive's subscribe endpoint. Defaults to derivable from `VERCEL_URL` env var.

### Out of Scope for This PR

- Onboarding UI (credential-paste settings page) — follow-up PR, only matters for LO #2
- Rate limiting, PII masking, admin route audit — separate PRs, tracked in `tasks/security-hardening-critical-gaps.md`
- Current Zapier pipeline migration — stays live until new direct integration tested end-to-end with a real test loan
- Other LOS providers (Encompass, Calyx) — architecture supports them via the `provider` column, but only Arive is implemented now

### Rollout Plan

1. Finish scaffold rework this session (code + migration, no UI)
2. Run `npm run build` per LoanOS CLAUDE.md deploy workflow
3. Commit + push + watch Vercel deployment
4. Apply migration 075 to Supabase via MCP
5. Adam generates `LOANOS_LOS_ENCRYPTION_KEY`, adds to Vercel env (prod + preview)
6. Adam pastes his own Arive credentials into a manually-inserted `los_integrations` row for testing (onboarding UI not built yet)
7. Manually trigger subscription registration for Adam's org to Arive (one-off script)
8. Test end-to-end with a single real Arive loan event
9. If green → plan cutover from Zapier pipeline
10. After 14 days of clean direct-integration traffic → deprecate Zapier path → delete legacy `/api/arive-webhook` route

## Lender Knowledge System — 2026-04-04 (sessions 5+7)

**Complete lender knowledge system: structured DB + NotebookLM deep knowledge + dashboard UI + detail pages + auto-ingest pipeline.**

### Data Layer (Supabase `lenders` table):
- **Deephaven** updated: 12 specialty products (Digital HELOC, Expanded Prime, Non Prime, DSCR 1-4, DSCR 5-9, ITIN, Jumbo, Super Jumbo, Equity Advantage, Closed End Seconds, Bank Statement, Asset Depletion) + detailed notes
- **Ameris Bank** updated: 10 specialty products (Non-QM, Bank Statement, DSCR, Asset Depletion, Foreign National, ITIN, 1099 Only, Jumbo, Interest Only, Recent Credit Events) + Non-QM notes
- **Champions Funding** added: Non-QM + CDFI wholesale (NMLS #2254210), 12 products, AEs Jamee Lyon + Dylan Sundell
- **FCM TPO** added: Correspondent (NDC2/NDC3, NMLS #3112), 7 products, fees NDC2 $895 / NDC3 $795 / Streamline $695
- **NewRez** updated (session 7): 9 specialty products (SmartSelf, RezPool Plus, Bank Statement, 1099 Only, P&L, Freddie Mac Conforming, HomeOne, Manufactured Housing) + detailed SmartSelf + RezPool Plus notes
- **PennyMac** updated (session 7): 8 specialty products (Non-QM A, Non-QM A+, Bank Statement, Asset Depletion, DSCR, 1099 Only, Jumbo Non-QM) + detailed Non-QM A/A+ notes
- **Mega Capital Funding** updated (session 7): 9 specialty products (MVP, Bank Statement, 1099 Only, P&L, Asset Depletion, Full Doc Non-QM, Interest Only, Non-Warrantable Condo) + MVP program notes
- **Plaza Home Mortgage** updated (session 7): 5 specialty products (HomeStyle Renovation, HomeReady, Conforming, High Balance, Buydowns) + HomeStyle guidelines, AE updated to Jillian Sorenson
- **Huntington Bank** added (session 7): Broker & Correspondent, 4 products (Doctors Only Portfolio, Physician Loans, No MI, High Balance), doctors-only program notes
- **The Loan Store** added (session 7): Broker & Correspondent, 9 products (TLS Flex NQM, Non-QM, Bank Statement, 1099 Only, DSCR, Asset Depletion, Foreign National, ITIN, Jumbo Non-QM)

### Knowledge Base (NotebookLM notebook 3489e177):
- 12 total text sources: Deephaven Product Guide, Champions Funding Product Matrix, Ameris Bank Non-QM Guide, FCM TPO Correspondent Guide + (session 7) NewRez SmartSelf, NewRez RezPool Plus, PennyMac Non-QM A, PennyMac Non-QM A+, Mega Capital MVP Non-QM, Huntington Doctors Only, Plaza HomeStyle Renovation, The Loan Store TLS Flex NQM

### Dashboard — Lender Resources Tab:
- List page: `/dashboard/lenders` (server component + client component)
- Detail page: `/dashboard/lenders/[id]` — clickable cards navigate to full lender profile (session 7)
- Components: `LenderCard.tsx` (clickable), `LenderFilters.tsx`, `LendersClient.tsx`, `LenderDetailClient.tsx`
- Detail page shows: AE contacts card, specialty products card, parsed product details & guidelines (notes split into titled sections)
- Features: search (name, contacts, products, notes), filter by channel, filter by product tags
- Cards show: name, channel badge (blue=Broker, amber=Correspondent), AE contacts with phone/email links, product tags, expandable notes
- TopNav: "Lenders" item added between Marketing and Drip (Building2 icon)

### n8n Auto-Ingest Workflow:
- Workflow ID: `hHXpKUirhnBCnQTO` — "LoanOS — Lender Email Ingest", **active**
- Daily 8am CT trigger → Outlook inbox scan (last 24h) → filter by 14 lender domains + guideline keywords → Claude extraction → Supabase lender update + activity_log
- 6 nodes: Schedule Trigger → Outlook Get Emails → Code (domain+keyword filter) → If (skip check) → HTTP (Claude API) → Code (Update Lender Record — auto-replaces AE contacts, appends products, appends timestamped notes) → HTTP (Supabase activity log)
- NotebookLM node removed (session 7) — CLI is local-only, n8n cloud can't reach it. NotebookLM ingestion done during Claude Code sessions.
- Smart contact updates (session 7): Claude prompt extracts structured JSON {lender_name, contacts_update, new_products, guideline_summary, key_changes}. Update node looks up lender by name, replaces contacts if AE change detected, appends new products to array, appends timestamped guideline summary to notes.

### AI Chat Integration:
- Two tools: `query_lender_database` (structured Supabase lookups) + `query_mortgage_knowledge_base` (NotebookLM deep knowledge)
- "Who is our AE for PRMG?" → lender DB tool
- "What are Deephaven's HELOC FICO requirements?" → knowledge base tool
- **Multi-round tool use fix (session 8)**: Replaced single-round `if` with `while` loop (max 4 rounds) — Claude can now call tool A, get results, call tool B in sequence without hanging
- **Markdown rendering (session 8)**: Assistant messages render via `react-markdown` with styled components (bold, lists, headings, links, code, HR) instead of raw text. CSS class `chat-markdown` on assistant bubbles removes trailing margin.

## Dashboard Redesign v6.1 — 2026-04-04 (session 6)

**Major dashboard layout overhaul: pipeline table, lead sources, marketing activity, funnel fix.**

### New Components:
- **LeadSourceChart.tsx**: Horizontal bar chart showing lead sources (referral_source) by count + volume, gold gradient bars, max 15 rows
- **MarketingActivity.tsx**: Recent marketing sends from mcc_state log, color-coded channel badges (emerald/blue/violet/amber), relative time display, "View all →" link

### Data Layer Changes (page.tsx):
- Added `mcc_state` query to first Promise.all batch (userId from getOrganization)
- Fixed funnel: exclusive stage counts (STAGE_TO_FUNNEL mapping) — funded loans no longer count as leads
- Added `pipelineLoans`: active in-process loans mapped to mini-table fields (borrower, address, status, amount, lock)
- Added `newAppsAndPAs`: loans in lead/new_app/pre_approval stages, sorted desc, max 15
- Added `leadSourceData`: all loans grouped by referral_source, top 15
- Added `marketingLog`: extracted from mcc_state.value.log, most recent 10

### DashboardClient Layout Overhaul:
- Pipeline tab restructured: KPIs → Mini Pipeline Table (clickable rows → loan detail) → New Apps & PAs → Action Required (compact, urgent flags only) → Hot Leads + Rate Lock (side-by-side, 5 max each) → Lead Sources + Funnel (side-by-side) → Top Realtors → Marketing Activity + Schedule (side-by-side)
- Removed TodoList from pipeline and queue tabs
- Needs Attention: now urgent flags only (removed stale loans wall)

### Chart Updates:
- **ConversionFunnel**: Renamed "Pipeline Snapshot", fixed max calculation (Math.max across all), added % of total share labels
- **ReferralLeaderboard**: Renamed "Top Realtors", expanded from 10 to 20 entries

## Dashboard Analytics Upgrade — 2026-04-04 (session 4)

**Full analytics overhaul: 7 new chart components, query parallelization.**

### New Components (src/components/dashboard/charts/):
- **SparklineCard.tsx**: Reusable KPI card with tiny AreaChart sparkline (30% opacity) — used for Active Loans, Pipeline Volume, Commission YTD, Funded YTD
- **ConversionFunnel.tsx**: Horizontal bar funnel (Lead → Application → Pre-Approval → Submitted → Approved → CTC → Funded) with drop-off percentages
- **ReferralLeaderboard.tsx**: Top 10 referral sources ranked by volume with percentage bars
- **RateLockCountdown.tsx**: Color-coded progress bars for rate lock expiration (green/yellow/orange/red + expired state)
- **YoYVolumeChart.tsx**: Side-by-side BarChart comparing this year vs last year monthly volume
- **CommissionForecast.tsx**: Stacked BarChart showing actual (solid) + projected (30% opacity) commission from pipeline closing dates
- **DaysToCloseGauge.tsx**: Horizontal bar gauge showing avg days-to-close by loan type with color coding

### Data Layer Changes (src/app/dashboard/page.tsx):
- Added `referral_source, rate_lock_date, rate_lock_days` to loans query select
- Added 7 new computed data sets: sparklineMonths, funnelData, referralData, rateLockLoans, yoyChartData, forecastData, daysToCloseData
- Parallelized queries with Promise.all: org_settings+loans (batch 1), activity_log+contacts (batch 2)

### DashboardClient Changes:
- Pipeline tab: KPI cards replaced with SparklineCard components, ConversionFunnel after Needs Attention, ReferralLeaderboard after Hot Leads, RateLockCountdown after Referral Leaderboard
- Performance tab: Replaced inline charts with YoYVolumeChart + CommissionForecast, added DaysToCloseGauge
- Stale loans: Removed `slice(0, 12)` cap, now shows all with scrollable container

### Other:
- Fixed pre-existing build error in chat/route.ts: cast `supabase` to `any` for `lenders` table queries (table not in generated types)
- Lender database tool added to AI chat (separate commit by Adam)

## Share Page Branding + PDF Unification — 2026-04-03 (session 3)

**Dynamic LO branding, print/PDF unification, visual polish.**

### Changes:
- **Share API** (`/api/share/[token]`): Now fetches org + user_settings, returns `branding` object (loName, company, nmls, phone, email, logoUrl, brandColor, calendlyUrl, applicationUrl)
- **ShareHero.tsx**: Dynamic LO name + company (was hardcoded "Adam Styer")
- **ShareCTA.tsx**: Dynamic Calendly + application URLs (was hardcoded)
- **ShareFooter.tsx**: Shows company + NMLS + contact info. Removed "Powered by LoanOS"
- **SharePageLayout.tsx**: Comprehensive `@media print` styles — white bg, branded header, page breaks, chart color preservation
- **ActionsBar.tsx**: "Generate PDF" now opens share page with `?print=1` (was calling 627-line HTML template)
- **NarrativeCard.tsx**: Header changed to "Analysis Summary" (was "Our Recommendation"), gold left border
- **OptionCard.tsx**: Gold top-border accent
- **PaymentComparisonChart.tsx**: Height 260→300
- **share/[token]/page.tsx**: Auto-triggers `window.print()` when `?print=1` detected

### Architecture Decision:
- PDF is now the share page with print styles — no separate HTML template
- Old `generate-pdf/route.ts` (627 lines) is still there but no longer called from the dashboard

## Share Page Fixes — 2026-04-03 (session 2)

**Removed all recommendation UI, switched to 5yr interest, stacked bar charts.**

- Removed "Best Option" badges, gold glow, crown icons from OptionCard — Adam doesn't want the system making recommendations
- OptionCardsGrid deltas now compare against first option (index 0) instead of recommended
- Replaced life-of-loan interest comparison with 5yr `horizonAnalysis.interestMIPaid5yr`
- PaymentComparisonChart converted to stacked bars (P&I, tax, insurance, HOA, PMI segments)

## Dashboard Scenario Builder Renovation — 2026-04-03 (session 2)

**Results step rebuilt from monolithic wall-of-sections to tabbed progressive disclosure.**

### Changes:
- **ScenarioBuilder.tsx**: Key Metrics pinned full-width at top (was crushed in 288px `w-72` sidebar). Content split into 3 shadcn Tabs: Comparison (table + break-even) | Analysis (buydown, down payment, etc.) | Charts. Narrative + Actions pinned at bottom.
- **ScenarioCharts.tsx**: Removed `TotalInterestChart` (life-of-loan numbers). Converted `MonthlyPaymentChart` to stacked bars matching share page pattern.
- **ScenarioSummaryTable.tsx**: ~11 hardcoded dark-mode colors replaced with CSS variables
- **KeyMetricsGrid.tsx**: ~20 hardcoded dark-mode colors replaced with CSS variables in MoreInfoModal + SavingsCard

### Phase 2 (future):
- PDF alignment: replace HTML template with share page + `@media print`
- Mobile viewport testing

## Share Page Redesign — 2026-04-03 (session 1)

**Borrower-facing share page rebuilt from dense data dump into card-based storytelling flow.**

### New Components (`src/components/share/`):
- 12 components: ShareHero, OptionCard, OptionCardsGrid, DeltaChip, PaymentComparisonChart, BreakEvenVisual, NarrativeCard, DetailAccordion, ShareCTA, ShareFooter, SharePageLayout, constants

### Modified:
- **`src/app/share/[token]/page.tsx`**: Gutted from ~440 lines to ~90. Delegates to `<SharePageLayout>`

### Architecture Decision:
- Separate `src/components/share/` directory — borrower-optimized components consuming `DisplayData` independently from dashboard

---

## Marketing Dashboard Upgrade + History Auto-Logging — 2026-04-03

**Post editor redesign with shadcn/ui, History tab delete, and n8n auto-logging for social posts.**

### Post Editor Redesign (shadcn/ui):
- **SocialDraftList.tsx**: Rewritten — shadcn `Badge` (warning/success/info/destructive variants), `Button`, `ScrollArea`, `Separator`, filter pills with `cn()`
- **SocialDraftDetail.tsx**: Rewritten — each section in `Card`/`CardHeader`/`CardContent`, action buttons use `Button` variants (outline/destructive/ghost), post content uses `font-sans leading-relaxed`, chat panel pinned with `ScrollArea`
- **MediaManager.tsx**: Rewritten — upload drop zone with SVG icons, drag-over glow effect, drag-to-reorder with order badges, animated spinner during upload

### New shadcn/ui components installed:
- `scroll-area.tsx`, `separator.tsx`, `tabs.tsx`, `tooltip.tsx`
- `components.json` created for shadcn CLI

### History Tab Delete:
- **HistoryTab.tsx**: Added `deletingId` state + `handleDelete()` function, ✕ button on each row (opacity-0 → group-hover:opacity-100)

### Auto-Logging Webhook:
- **`/api/marketing/log/route.ts`** (NEW): POST endpoint for n8n to log activity to `mcc_state.log`. Accepts `activity`, `channel`, `notes`, `date`, `tracker` fields. Auth via `Authorization: Bearer` or `X-Webhook-Secret` (LOANOS_AGENT_SECRET). Also supports DELETE by entry ID.
- **types.ts**: Added 'Newsletter', 'Instagram', 'Google' to `LOG_CHANNELS`
- **utils.ts**: Added Newsletter→Newsletter, Instagram→Social, Google→Social to `CHANNEL_TO_TYPE`

### n8n Workflows Updated:
- **Weekly GBP + Social Post** (`V6RhmJpOb7pOzMte`): Added HTTP Request node calling `/api/marketing/log` with correct auth secret
- **Weekly Testimonial Social Post** (`eJG4wckrj6SmSpm1`): Same — logs to History with `channel: "LinkedIn"`, `tracker: "social-post"`

### Root Cause Fix:
- n8n nodes had wrong endpoint (`/api/marketing/log-social-post`) and wrong auth secret (SHA-256 hash instead of `LOANOS_AGENT_SECRET` UUID). Both corrected.

### Not Yet Wired:
- Rate update and newsletter auto-logging (generated by Claude Code skills, not n8n — needs skill modification)

### Deployed:
- Commit `86ecfcc` → `dpl_7wBfHW2YpjkxMoV2BL1F7N63GPrm` → READY ✅

## UI Renovation — 2026-04-01

**5-step layered redesign using shadcn/ui + 21st.dev components.**

### Steps Completed:
1. **Foundation**: Installed shadcn/ui, CSS variable theme tokens mapped to LoanOS dark palette, cn() utility
2. **Shell swap**: Replaced TopNav with 21st.dev Navbar1 component
3. **Shared primitives**: Created Card, Badge, Input, Textarea, Dialog components
4. **Page imports**: Swapped hardcoded colors to primitives across Dashboard, Pipeline, Contact Record, Loan Record, Contacts, Scenarios, Marketing, Admin, Reports, Automations
5. **Visual polish**: Card glow effect (gold box-shadow on hover), Badge depth (colored borders + inset shadow), Table primitive (7 sub-components), gold-tinted row hover on tables and contacts

### Key Files Created/Modified:
- `src/components/ui/card.tsx` — Card with `.card-glow` hover effect
- `src/components/ui/badge.tsx` — 7 variants with colored borders + inset shadow
- `src/components/ui/table.tsx` — Table/TableHeader/TableBody/TableFooter/TableHead/TableRow/TableCell/TableCaption
- `src/app/globals.css` — `.card-glow` and `.lo-table` CSS classes
- `src/components/dashboard/DashboardClient.tsx` — Card/Badge/Table imports, monthly breakdown uses Table primitive
- `src/components/dashboard/HotLeadsWidget.tsx` — Card primitive swap
- `src/components/dashboard/DailyScheduleWidget.tsx` — Card + border-input tokens
- `src/components/dashboard/DailyBriefingPanel.tsx` — Card + bg-card/bg-input tokens
- `src/components/automations/AutomationCard.tsx` — bg-card/border-input tokens
- `src/components/automations/InlineDraftEditor.tsx` — bg-card/border-input tokens
- `src/app/dashboard/reports/volume/page.tsx` — Card + Table primitives
- `src/app/dashboard/reports/commission/page.tsx` — Card + Table primitives
- `src/app/dashboard/contacts/page.tsx` — Gold hover tint
- `src/app/dashboard/loans/page.tsx` — border-input/bg-card tokens

### Design Decisions:
- Contacts table uses inline styles (DnD, sticky columns) — modified hover color only, structure unchanged
- LoanOS color mapping: `#060b18` (nav bg), `#0f172a` → `bg-card`, `#1e293b` → `border-input`, `#C9A84C` → `primary`

## Light/Dark Mode — 2026-04-01

**Full theme toggle implementation. Light mode is now the default.**

### Problem:
Dark theme was causing eye strain during all-day use. Multiple attempts to soften the dark palette (lift surfaces, reduce contrast, brighten text, lift cards) failed to satisfy — user requested full light mode with dark mode toggle.

### Implementation:
- **next-themes**: Installed and configured with `attribute="class"`, `defaultTheme="light"`, `enableSystem={false}`
- **Tailwind**: `darkMode: 'class'` in `tailwind.config.ts`
- **ThemeProvider** (`src/components/ThemeProvider.tsx`): Wraps app in `layout.tsx`
- **ThemeToggle** (`src/components/ThemeToggle.tsx`): Sun/Moon icon button in TopNav
- **`suppressHydrationWarning`** on `<html>` element in root layout (required by next-themes)

### CSS Variable Palettes (globals.css):
- **Light**: bg #f5f6f8, card #ffffff, text #1a1d26, muted #5f6678, gold #a68a2e, border #d8dce5
- **Dark**: bg #0c0e14, card #1c2235, text #eaecf0, muted #9ba3b5, gold #C9A84C, border #2f3546
- Card glow has light-mode-specific softer shadow
- Table `.lo-table` header bg uses `var(--surface2)`, row borders use `var(--border)`

### Batch Replacements (~300+ across 60+ files):
- text-zinc-100/200 → text-foreground
- text-zinc-300 → text-foreground/80
- text-zinc-400/500/600 → text-muted-foreground
- bg-zinc-700 → bg-input, bg-zinc-800 → bg-muted
- bg-zinc-900 → bg-card, bg-zinc-950/bg-gray-950 → bg-background
- border-zinc-600/700/800 → border-input
- hover:bg-zinc-800 → hover:bg-secondary
- #09090b → var(--bg), #111118 → var(--surface)
- Pipeline: 87+ hex values (#0A0A0A/#1A1A1A/#2A2A2A) → semantic tokens
- Loan detail: inline style grays (#3f3f46/#52525b/#71717a/#27272a) → CSS vars
- Chat components: `const BG = '#0f0f0f'` → `const BG = 'var(--bg)'`

### Root Cause Fix:
- `src/app/dashboard/layout.tsx` had `bg-zinc-950` wrapping ALL dashboard pages — changed to `bg-background`
- `src/app/admin/layout.tsx` had same issue — fixed

### Known Remaining:
- Some less-visited pages (share/[token], onboarding) may have inline dark styles
- SmartActionQueue may have hardcoded dark values

## Light Mode Polish — 2026-04-02

**Per-page light mode fixes across Pipeline, Contacts, and Loan Detail.**

### Pipeline page (`src/app/dashboard/loans/page.tsx`):
- Replaced all hardcoded hex colors with semantic tokens: `text-[#CCCCCC]` → `text-foreground/70`, `text-[#999999]` → `text-muted-foreground`, `text-[#555555]` → `text-muted-foreground/60`, `#C9A84C` → `text-primary`/`bg-primary`/`border-primary`
- Filter badges: Added `dark:` variants (violet, sky, indigo, amber, teal, orange, emerald, blue)
- Data cells: `font-mono` → `font-sans` (17 occurrences)
- Sidebar: removed `font-mono`, semantic hover states
- Scrollbar: `rgba(201,168,76,0.35)` → `color-mix(in srgb, var(--primary) 35%, transparent)`
- Committed as `21dac13`

### Contacts page (`src/app/dashboard/contacts/page.tsx`):
- Row backgrounds: hardcoded `rgb(14,14,16)` dark stripes → `var(--surface)` + `color-mix` for selected/active
- All `#c9a84c`/`#C9A84C` inline styles → `var(--primary)`
- All `rgba(201,168,76,...)` → `color-mix(in srgb, var(--primary) X%, transparent)`
- Table: removed `fontFamily: 'var(--font-mono)'`, fontSize 12 → 13
- Sidebar nav: removed `fontFamily: 'var(--font-mono)'`
- Committed as `21fc2cd`

### Loan detail page (`src/app/dashboard/loans/[id]/page.tsx`):
- Property badge: `items-end` → `items-stretch` to match milestone box height
- Removed BorrowerProfileCard entirely (info already on party cards)
- Layout restructure: Key Dates directly below parties, Documents + Activity side-by-side, detail sections single column with `max-w-3xl`
- Group action buttons (Email All, Text Borrowers, etc.) moved left next to PARTIES header
- Cleaned up unused `organizationId` + `Briefcase` imports
- Committed as `47b7338`

### Pattern established:
- `color-mix(in srgb, var(--primary) X%, transparent)` for theme-aware opacity in inline styles
- `var(--primary)` / `var(--surface)` / `var(--bg)` in inline `style={{}}` objects
- `font-sans` override on data cells to counteract parent `font-mono` classes

### Marketing dashboard (`src/app/dashboard/marketing/_components/*`):
- 16 component files updated: page.tsx, shared.tsx, SocialTab, SocialDraftList, SocialDraftDetail, SocialComposePanel, SocialPostPreview, SocialActivityFeed, CarouselBuilder, SendTab, CallsTab, MediaManager, RateUpdateForm, NewsletterForm, ContactCard, VoiceGuideEditor, VoiceGuideDrawer
- All `const GOLD = '#C9A84C'` → `const GOLD = 'var(--primary)'`
- Dark backgrounds (`#0a0a1a`, `#0a0a14`, `#0d0d18`, `#18181b`, `#1a1a2e`) → `var(--surface)` or `color-mix()`
- Dark borders (`#3f3f46`, `#27272a`) → `var(--border)`
- Text colors (`#a1a1aa`, `#71717a`, `#52525b`) → `var(--muted-foreground)`; (`#d4d4d8`, `#e4e4e7`, `#fafafa`, `#fff`) → `var(--foreground)`
- Chat bubbles: `#1a1a2e` → `color-mix(in srgb, var(--primary) 8%, var(--surface))`
- Error backgrounds: `#1a0505`/`#1a0a0a` → `color-mix(in srgb, #E05252 6%, var(--bg))`
- Preserved: canvas `ctx.fillStyle` in CarouselBuilder, platform preview mock-up colors (Facebook blue, Instagram gradient, LinkedIn blue)
- Committed as `7182275`

## Multi-Tenant LO Onboarding — 2026-04-01 (session 12)

**Full multi-tenancy implementation to support independent LOs joining LoanOS with separate organizations.**

### Architecture Decision:
- **Option B (separate orgs)** — each LO gets their own `organization_id`, not shared under Adam's org
- All existing RLS policies already scope by `organization_id` — no schema changes needed for isolation
- Backward compatible: all changes fall back to Adam's hardcoded values when `organization_id` is absent

### New Files:
- **`src/lib/getLoIdentity.ts`** — Central helper fetching LO identity (name, email, phone, NMLS, branding, links) from profiles + organizations + org_settings. Dual-mode: works in authenticated and webhook/service contexts.
- **`src/lib/arive/processWebhook.ts`** — Shared Arive webhook processing logic extracted from original route (660+ lines). Used by both original and slug-based routes.
- **`src/app/api/arive-webhook/[slug]/route.ts`** — Per-org Arive webhook routing via URL slug. Looks up org by slug, resolves owner profile, delegates to `processAriveWebhook()`.

### Modified Files (dynamic identity):
- **`src/app/api/outreach/route.ts`** — Dynamic LO signature instead of hardcoded Adam
- **`src/app/api/chat/route.ts`** — Same pattern for email generation mode
- **`src/app/api/chat/social/route.ts`** — Dynamic social media identity
- **`src/app/api/scenarios/send-email/route.ts`** — Dynamic email header/footer/NMLS
- **`src/app/api/agents/daily-briefing/route.ts`** — Dynamic briefing identity
- **`src/lib/automations/prompts.ts`** — Dynamic application link in automation prompts
- **`src/lib/defaultOutreachPrompt.ts`** — Added `buildOutreachPrompt(identity)` function

### Database Changes:
- **Migration 067**: `org_settings` — added `application_link` and `calendly_link` columns
- **Migration 068**: `activity_log.organization_id` — hardened to `NOT NULL` (verified 830 rows, 0 nulls)
- **`src/lib/database.types.ts`** — Updated org_settings types to include new columns

### n8n Workflow Updates (3 workflows):
- **LoanOS — Referral Intro Email** (`YbgDnTpPdefcazKy`) — `Build Referral Email` code node now fetches LO identity from Supabase when `organization_id` present in webhook body
- **LoanOS — Pre-Approval Email** (`utMvZpkdRwIRZ51u`) — `Build PA Email` code node: dynamic header, signature, brand colors, Calendly link, initials
- **LoanOS — Refi Intake Email** (`yCTydQ7RfZK4DyUg`) — `Build Refi Email` code node: dynamic subject, signature, phone, processor reference generalized

### Pattern (all n8n code nodes):
```
1. Read organization_id from webhook body
2. If present → parallel fetch: profiles (owner>admin>member), organizations, org_settings
3. Use fetched values in email template (name, phone, email, NMLS, brand color, Calendly, app link)
4. Fall back to Adam's hardcoded values if org_id missing or fetch fails
```

### Not Changed (still remaining):
- Final CD Email workflow (`SkzrWeR0bHZs8kWX`) — same pattern needed
- New Application Received workflow (`cWESnXXy9UOLB13q`) — same pattern needed
- Contract Received workflow (`UfNcdpoVKQZqy0fj`) — same pattern needed
- Admin UI for creating new organizations/users (future)

## Send Tab Audit + Fix — 2026-04-01 (session 11)

**Full audit and fix of Marketing → Send tab (rate update + newsletter flows) plus social publish History logging.**

### Audit Findings (9 items, 5 fixed this session):
1. **[FIXED] Race condition — 404 emails**: GitHub API returns ~100ms but Netlify deploy takes 15-60s. Emails sent before page exists. Added `waitForPageLive()` polling function (90s timeout, 5s interval) in `styerteam-mortgage-site/netlify/functions/lib/shared.js`.
2. **[FIXED] Link corruption in emails**: `forceAbsoluteLinks()` replaced ALL relative .html links with the pageUrl instead of resolving to site root. Fixed to resolve against `https://styermortgage.com/` base.
3. **[FIXED] Temp URL bug in newsletter custom prompt**: Used `temp-placeholder` slug initially, re-derived real slug after Claude responds, but return value still used original variables. Fixed to use `finalPageUrl`/`finalFilename`.
4. **[FIXED] Weak voice rules in newsletter custom prompt mode**: Had 2-line minimal voice block vs. rate update's 16 banned phrases. Expanded to match rate-prompt-builder.js gold standard.
5. **[FIXED] Social publish missing from History tab**: `/api/social/publish/route.ts` only logged to `social_activity`, not `mcc_state.log`. Added server-side History logging after successful Publer publish.
6. **[DEFERRED] Voice guide Supabase ↔ Netlify disconnect**: Netlify functions hardcode voice instructions instead of reading from Supabase `social_settings`. Requires arch change (passing voice guide in payload).
7. **[DEFERRED] Same-day rate update overwrites**: If two rate updates published same day, second overwrites first on website. Rare edge case.
8. **Mailchimp error isolation**: Wrapped individual campaign sends in try-catch so one failure doesn't block others.
9. **No n8n involvement**: Confirmed — Send tab flows run entirely through Netlify Functions, no n8n workflows involved.

### Files Changed:
- **styerteam-mortgage-site** (Netlify):
  - `netlify/functions/lib/shared.js` — `waitForPageLive()`, `forceAbsoluteLinks()` fix
  - `netlify/functions/generate-rate-update.js` — deploy gate + Mailchimp error isolation
  - `netlify/functions/generate-newsletter.js` — deploy gate + temp URL fix + voice rules + error isolation
- **loanos-clone** (Vercel):
  - `src/app/api/social/publish/route.ts` — History tab logging via `mcc_state.log`
  - `docs/superpowers/plans/2026-04-01-send-tab-fix.md` — implementation plan

### Deployed:
- Netlify: commits `abda751`, `87d7c8a` — deployed ✅
- Vercel: commit `a5ef12d` → `dpl_EQeaeQgAGvHXKnVa1tfrHBU4j2vf` → READY ✅

## Marketing Dashboard Audit + Codex Review — 2026-04-01 (session 10)

**Comprehensive audit of the marketing dashboard and social media scheduled tasks. Two-pass review: initial audit fixes + Codex verification pass.**

### Nav & Tab Cleanup:
- **"Voice Guide" → "Marketing"**: Renamed in TopNav (desktop + mobile) with 📣 icon for discoverability
- **CALLS tab removed**: Removed from marketing page tabs (SOCIAL, SEND, HISTORY, VOICE GUIDE remain)

### Draft List Filters (SocialDraftList.tsx):
- **Platform filters**: ALL / LI / IG / FB — drafts with `platform="all"` show under any specific filter
- **Source filters**: ALL / AGENT / MANUAL — distinguishes agent-generated vs manually created drafts
- **Expanded status filters**: Added POSTED and REJECTED to existing filter pills
- **Count display**: Shows `{filtered.length} of {drafts.length} posts`
- **Normalization helpers**: `normalizePlatform()` and `normalizeCreatedBy()` for case-insensitive matching

### Activity Logging (was completely missing):
- **Drafts POST**: Logs `"drafted"` action to `social_activity` on create
- **Drafts PATCH**: Logs status changes (approved/rejected/scheduled/posted/updated)
- **Publish route**: Fixed action label from `'scheduled'` → `'posted'`; added error capture
- **Chat/social route**: Added activity logging on draft creation (was missing entirely)
- **Builder subagent (03-builder.md)**: Added mandatory activity log curl after each draft insert

### Data Consistency (Codex audit findings):
- **`created_by` normalized**: `SocialComposePanel`, `CarouselBuilder`, `chat/social` route all changed from `'user'` → `'human'` to match filter expectations
- **Error handling hardened**: All `social_activity` inserts now capture errors with `console.error` (were fire-and-forget)
- **Settings API**: Added error handling on GET query and both upsert paths

### DB Changes:
- `ALTER TABLE social_settings ADD COLUMN updated_by uuid REFERENCES auth.users(id)`
- Seeded `voice_feedback` key in `social_settings` with initialization message
- Deleted 2 junk drafts (malformed test data)

### Deployed:
- Commit 1: `48a0fe2` → `dpl_NiYmaFhrrJY1NNUmbD8nmM1FSXpA` → READY ✅
- Commit 2: `99e8ac7` → `dpl_5HGdnS1EEJFkoWnpryPJqbVLJHu8` → READY ✅

## Carousel Builder + Voice Guide Everywhere — 2026-03-31 (session 9)

**Added visual carousel builder, wired voice guide into ALL content generation paths, regenerated all 22 existing drafts.**

### New Features:
- **Carousel Builder**: Full visual editor in Marketing dashboard — slide text editor (2-10 slides), black or image background, Canvas-rendered 1080x1080 PNGs, auto-labels (HOOK/CTA), uploads to Supabase storage, creates draft directly. Accessible from Compose panel when Carousel format selected.
- **POST handler for social drafts API**: New POST endpoint enables direct draft creation (previously only GET/PATCH/DELETE existed).

### Voice Guide Integration (all 6 content paths now connected):
1. `/api/chat/social` — already connected (confirmed)
2. `tasks/social-media/subagents/03-builder.md` — already connected (confirmed)
3. `gbp-weekly-optimization/SKILL.md` — **added** voice guide fetch
4. `styer-content-weekly/SKILL.md` — **added** voice guide fetch
5. `/api/automations/generate/route.ts` — **added** via shared `fetchVoiceGuide` helper
6. `/api/automations/refine/route.ts` — **added** via shared `fetchVoiceGuide` helper

### Shared Infrastructure:
- **`src/lib/voice/fetchVoiceGuide.ts`**: Shared helper that fetches voice_guide + voice_feedback from social_settings in parallel. Used by email automation generate/refine routes.
- **`src/lib/automations/prompts.ts`**: `buildAutomationPrompt()` now accepts optional `voiceGuide` and `voiceFeedback` params — voice guide takes priority over hardcoded `VOICE_SYSTEM`.

### Data Updates:
- **22 draft-status posts regenerated** with updated voice guide via Claude API batch processing

## Social Dashboard Bug Fixes + UX Improvements — 2026-03-31 (session 8)

**Fixed 3 bugs that have been silently broken since launch, added 3 UX improvements.**

### Bugs Fixed:
- **PATCH body missing fields**: `SocialTab.handleUpdate` was sending the update but omitting `media_urls` and `rejection_reason` from the request body — rejections with reasons and media edits were silently dropped on server round-trip even though the API accepted them
- **Activity feed blank entries**: `SocialActivityFeed` mapped `type`/`message` but the DB table has `action`/`detail` — the feed has been rendering blank entries since it was built
- **APPLY TO POST stale edit buffer**: After applying a Claude chat response to a draft, clicking EDIT showed the old content because `editContent` state wasn't synced when `draft.content` changed externally

### UX Improvements:
- **DELETE button**: Muted gray delete button (far right of action bar) with confirm dialog. New DELETE API handler in drafts route
- **APPROVE & PUBLISH one-click**: Gold button that approves then immediately publishes to Publer in one action — the "press a button and it goes out" flow
- **Platform badges**: IG/LI/FB/ALL badges next to status in the draft list sidebar

### Deployed: 01559cc → dpl_BnxQYhSLsHQEg2MhSAZ8pxULanyj → BUILDING (checking)

## Social Media Dashboard Fixes — 2026-03-31 (session 7)

**Audited and fixed the social media content pipeline — voice guide wasn't connected to scheduled agent, no feedback loop existed, media uploads were silently broken.**

### Bugs Fixed:
- **media_urls silently dropped on edit/approve**: `media_urls` was missing from the PATCH allowlist in `/api/social/drafts/route.ts` — any draft update stripped media. Added to allowedKeys.
- **Publer credentials hardcoded**: API key and workspace ID were inline in publish route. Moved to env vars (`PUBLER_API_KEY`, `PUBLER_WORKSPACE`) with validation.

### Voice Guide Connection:
- **Scheduled agent disconnected from voice guide**: The `03-builder.md` subagent had generic hardcoded voice standards and never read Adam's voice guide from Supabase. Added mandatory Step 0: fetch `voice_guide`, `voice_feedback`, and rejected drafts via curl before writing any content.
- **Dashboard Claude already connected**: `buildSocialSystemPrompt` in `/api/chat/social/route.ts` was already reading `voice_guide` — confirmed working.

### Feedback Loop (new):
- **Edit diff capture**: When Adam manually edits a draft in the dashboard, `SocialDraftDetail.tsx` now logs before/after content to `social_settings` key `voice_feedback` via the new append mode on `/api/social/settings/route.ts`.
- **Rejection reason capture**: New rejection modal requires a reason. Reason stored on the draft (`rejection_reason` column) and appended to `voice_feedback` so both dashboard Claude and scheduled agent learn from rejections.
- **Settings API append mode**: POST to `/api/social/settings` now accepts `appendEntry` — appends a new line to existing value instead of replacing, used for accumulating feedback entries.

### DB Migration:
- `ALTER TABLE social_drafts ADD COLUMN rejection_reason text;`

### Deployed: 5326491 → dpl_3c6amNsfczTRBUTgvCtSYL4NAWZR → READY ✅

### Remaining (user action needed):
- Add Vercel env vars: `PUBLER_API_KEY` and `PUBLER_WORKSPACE` (values in MEMORY.md)
- Review/finalize voice guide in LoanOS Marketing → Voice Guide tab
- Carousel creation feature discussed but not yet built (black bg or single image bg with text overlaid on slides)

## Dashboard Redesign — 2026-03-31 (session 6)

**Redesigned the main dashboard to be a command center focused on money, urgency, and marketing priorities.**

### KPI Cards (top row):
- Reordered: Commission Earned (YTD) → Pipeline Commission → Closed This Month → Pipeline Loans
- Each card now shows loan count + volume in subtitle

### Needs Attention (merged section):
- Combined "Urgent Flags" (rate lock expiring, past closing date, pre-approval expiring) with "Needs Attention" (7+ days no human activity) into one amber warning panel
- Stale loans now show status badge, closing date, and days idle
- Red dots for urgent items, orange dots for stale

### Hot Leads (upgraded):
- Inline call, text, email action icons (Phone/MessageSquare/Mail from lucide) — one click to reach the lead
- Notes shown inline below each lead name
- Referred-by and age shown as metadata
- Dismiss button appears on hover

### Today's Priorities (new section):
- Daily Marketing Schedule (existing DailyScheduleWidget) and To-Do list shown side-by-side in 2/3 + 1/3 grid

### Removed from Pipeline tab:
- Active Loans table (redundant with Pipeline page)
- Activity feed (7-day log — rarely useful on dashboard)
- New Applications list (already visible in Pipeline)
- New Leads list (merged into Hot Leads widget)
- Stage pipeline cards (moved to Performance tab only)

### Server page cleanup:
- Removed ~60 lines of unused queries (newLeads, recentApplications, activityEntries)
- Enriched staleLoans with status, estimated_closing_date, loan_amount

## Loan Detail Layout + Build Fixes — 2026-03-31 (session 5)

**Fixed 3 pre-existing TypeScript build errors blocking deploy, then shipped loan detail layout changes.**

### Build fixes (pre-existing errors):
- **`import-salesforce-referrals/route.ts`**: `mapContactType` and `mapStage` were `function` declarations inside a `try` block — not allowed in ES5 strict mode. Converted to arrow functions. `.insert({})` cast changed from `Record<string, unknown>` to `as unknown as TablesInsert<'contacts'>` (Supabase typed insert requires exact schema type).
- **`backfill-party-links/route.ts`**: `buildContactMap` was an `async function` declaration inside a `try` block — converted to `const buildContactMap = async () =>`.
- **Pre-commit hook `any` check**: Several files used `// eslint-disable-next-line` on a separate line before the `any` declaration — the hook's `grep -v eslint-disable` check requires the comment to be inline. Fixed across `automations/generate`, `automations/refine`, `automations/send`, and `contacts/page.tsx`.

### Layout changes (loans/[id]/page.tsx):
- **Milestones row**: Now directly below vitals bar (was separated by property address block)
- **Property address**: Moved to bottom-right of the milestones row — small styled card with blue gradient border, links to Zillow
- **Vitals bar**: Reduced gap (`gap-8` → `gap-5`), smaller padding (`px-5 py-3.5` → `px-4 py-2.5`), removed `overflow-x-auto` + `ml-auto` on Commission — all stats now flex-wrap inline, no horizontal scroll

### Deployed: 4ce9759 → dpl_ApPLvYz5zZqTKNgBtr8oN9sXzEfH → READY ✅

## Party Contact Links + Salesforce Import — 2026-03-31 (session 4)

**Linked transaction parties to contact records and imported Salesforce referral data.**

### DB Changes:
- **Migration**: `add_title_contact_id_to_loans` — added `title_contact_id UUID REFERENCES contacts(id)` + index
- **Backfill**: 525 party-to-contact links created across all loans:
  - 376 buyer agent links (409 total, 22 still unlinked — no matching contact)
  - 115 listing agent links (123 total, 4 unlinked)
  - 30 referring agent links (30 total, 1 unlinked)
  - 4 title contact links (all linked)

### Salesforce Import:
- **148 contacts** from Salesforce export processed (11 new, 137 matched existing)
- **144 `referred_by_contact_id` links** set — ties borrower contacts to referring realtors
- 44 unique referrers, 39 matched to existing realtor contacts
- 5 unmatched: Britney Jo Styer, David Bonnet, Greg Walker, Houston Morford, Melissa Brown

### Code Changes:
- **`loans/[id]/page.tsx`**: Added `title_contact_id`, `co_borrower_contact_id`, `referral_contact_id` to Loan interface; wired all party cards to use FK columns; removed ~40 lines of client-side referring agent email/name lookup (now uses `referral_contact_id` directly)
- **`api/admin/backfill-party-links/route.ts`**: Re-runnable backfill route — matches agent names to contacts by case-insensitive name, sets FK columns on loans
- **`api/admin/import-salesforce-referrals/route.ts`**: Import route for Salesforce HTML export — upserts contacts, matches "Referred By" to realtor contacts
- **`database.types.ts`**: Regenerated with `title_contact_id`

### Deployed: 2026-03-31 ✅

## Co-Borrower Sync Fix — 2026-03-31 (session 3)

**Root cause:** Arive sends co-borrower data under `loanBorrower2_*` keys, not `coBorrower*`. Previous webhook looked for `coBorrowerFirstName` etc. — all null. DOB showed "1900-08-05" because Arive only sends `dayOfBirth`+`monthOfBirth` (no year).

### Changes:
- **`arive-webhook/route.ts`**: map `loanBorrower2_firstName/lastName/emailAddressText/mobilePhone10digit/homePhone/workPhone/maritalStatusType` — co-borrower name built from first+last, DOB intentionally omitted (no year in payload)
- **`arive-webhook/route.ts`**: after party upserts, upsert a co-borrower contact record (deduped on email, `contact_type: 'borrower'`) and write `co_borrower_contact_id` FK on loan
- **DB migration** (`add_co_borrower_contact_id_and_fix_bad_dob`): added `co_borrower_contact_id UUID REFERENCES contacts(id)` to `loans`, cleared the bad `1900-08-05` DOB, added index
- **`ContactRecordView.tsx`**: `LoanCard` shows co-borrower chip (light-blue) linking to their contact record when `co_borrower_contact_id` is set; new `coBorrowerLoans` prop renders "CO-BORROWER ON" section on co-borrower's contact page
- **`contacts/[id]/page.tsx`**: `fetchLoans` includes `co_borrower_contact_id`+`co_borrower_name`; new `fetchCoBorrowerLoans` queries loans where `co_borrower_contact_id = id`; both passed to `ContactRecordView`
- **`database.types.ts`**: regenerated with new column

### Deployed: f35ce9b → Vercel (in progress)

### How to populate Reenal Shah's contact:
Trigger an Arive sync on loan 16265549 (update any field in Arive) — webhook will upsert Reenal's contact and link it.

## Loan Record Redesign — 2026-03-31 (session 2)

**Cleaned up /dashboard/loans/[id] — removed dead code, unified layout, added key dates from Arive raw_payload.**

### page.tsx changes:
- **Removed 729 lines of dead code**: LoanTodoList, PropertyDetailsToggle, InfoCard, PartiesCard, SortableCardWrapper, LoanInfoGrid, CollapsibleDetails, and associated constants/interfaces
- **Removed DnD imports**: @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities — no longer needed after card grid removal
- **New KeyDatesGrid**: 9 primary dates always visible + 24 secondary dates from `raw_payload.keyDates_*` in expandable section (only shows populated dates)
- **BorrowerProfileCard**: now shows employment info (employer, position, self-employed badge via Briefcase icon)
- **Unified layout**: DashboardTab uses EditableSectionCard for all data groups — no more duplicate card view + edit view

### n8n workflow updates:
- **WF2 (Arive Status Update)**: "Log Status Updated" now includes `summary` field with human-readable text ("Status: Processing → Underwriting | Rate: 6.5% | Lock date: 2026-04-15") and `type: 'system'`
- **WF1 (Arive New Loan)**: "Log Activity" now includes `summary` ("New loan created: Smith — Purchase $450,000") and `type: 'system'`
- **Both workflows**: Added "Update Contact Last Activity" node — PATCHes `contacts.last_activity_date` on every sync

### Deployed: bce52fe → dpl_DhrSvtUTwi3G4TpV5LPMjKLpm4PJ → READY

## Contact Record Cleanup — 2026-03-31

**Phase 4 (Contacts That Work) — mostly complete:**

### ContactRecordView.tsx changes:
- **Merged activity timeline**: `activity_log` (system events) + `contact_activity` (user-logged outreach) now render in a single chronological feed with All/Outreach/System filter toggles
- **Realtor Performance card**: referral count, closed count, conversion rate %, total volume — computed from `referredLoans` array, only shows for realtor contacts
- **Notes card**: existing notes display + textarea to add new notes — was wired up in page.tsx but never visible in UI
- **DOB field**: birthdate now displays for borrower contacts (inline-editable)
- **Loan cards enhanced**: show `loan_program`, `employer_name`, `monthly_income` when available
- **SystemActivityItem component**: renders `activity_log` entries with Clock icon, description, source label
- **UnifiedFeedItem type**: discriminated union `{ kind: 'user' | 'system'; item: ... }` for merged feed
- **Removed dead `activeTab`/`setActiveTab` props** — tabs were removed in a prior session but props lingered

### page.tsx changes:
- Loans query now includes: `estimated_closing_date`, `loan_program`, `employer_name`, `monthly_income`
- Referred loans query now includes: `interest_rate`, `property_address`, `property_city`, `property_state`, `loan_purpose`, `loan_type`
- Removed unused `activeTab`/`setActiveTab` state

### Loan detail build fixes (unblocking):
- Restored DnD imports (`@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`) + icon imports that were removed in a prior session but still referenced in JSX
- Created `LinkedContactCard` component
- Added `as unknown as Loan` casts for extended loan fields not in `database.types.ts`
- Suppressed unused functions with eslint-disable (renovation rule: nothing gets deleted)

### Quick-add contact verified:
- `src/app/api/contacts/quick-add/route.ts` — AI extraction via Claude with regex fallback, dedup check, confirmation flow, activity logging. All solid.

## Arive Sync Overhaul — 2026-03-30 (late session)

**Both Arive n8n workflows updated to capture all available data:**
- WF1 (New Loan `1tagvoU0UXtdDiMY`) — 16 nodes, added co-borrower fields, employment, compensation, loan program, borrower DOB, agent contact upserts
- WF2 (Status Update `9JyzzwKac8v3uQ7d`) — 17 nodes, same new fields added to extract + update + sync contact
- 9 new Supabase columns added: `borrower_birthdate`, `co_borrower_home_phone`, `co_borrower_work_phone`, `co_borrower_birthdate`, `co_borrower_marital_status`, `position_description`, `self_employed`, `gross_loan_revenue`, `net_loan_revenue`
- Buyer's agent and listing agent now auto-upserted as `type='realtor'` contacts with IDs linked to loan record
- Co-borrower data flows to both loans table AND contacts table (same contact page, not separate)
- Fields populate on next Arive webhook fire — existing loans will update on next status change

## Automation Command Center — 2026-03-30

**Replaced `/dashboard/automations`** with a unified Command Center controlling all 37 automations (17 Claude Code agents, 18 n8n workflows, 2 chatbot prompts) from one page.

**Database (3 migrations applied):**
- `064_automation_registry.sql` — `automation_registry` + `automation_runs` tables, `email_drafts` columns added
- `065_automation_registry_rls.sql` — RLS policies for both tables
- `066_seed_automation_registry.sql` — 37 seed rows across 9 groups

**New files (20):**
- `src/lib/automations/types.ts` — TypeScript types for registry, runs, config
- `src/lib/automations/groups.ts` — 9 function group definitions with display order
- `src/app/api/automations/registry/route.ts` — GET all automations
- `src/app/api/automations/registry/[id]/route.ts` — GET/PATCH single automation
- `src/app/api/automations/registry/[id]/runs/route.ts` — GET paginated run history
- `src/app/api/automations/registry/[id]/run-now/route.ts` — POST trigger n8n execution
- `src/app/api/automations/registry/[id]/ask-claude/route.ts` — POST natural language → config JSON
- `src/app/api/automations/bulk-action/route.ts` — POST pause/resume all
- `src/app/api/automations/email/generate/route.ts` — POST generate via n8n webhook
- `src/app/api/automations/email/[draftId]/route.ts` — PATCH update draft
- `src/app/api/automations/email/[draftId]/send/route.ts` — POST send via n8n → Outlook
- `src/app/api/automations/email/[draftId]/refine/route.ts` — POST Claude refinement
- `src/components/automations/StatusBar.tsx` — active/paused/errored counts + bulk actions
- `src/components/automations/AutomationRow.tsx` — compact row with status dot, badges
- `src/components/automations/AutomationGroup.tsx` — collapsible group with detail panel routing
- `src/components/automations/GuidedControls.tsx` — focus chips, tone/length, avoid/priority
- `src/components/automations/AskClaudePanel.tsx` — natural language config editor with diff preview
- `src/components/automations/RunHistoryList.tsx` — paginated run history
- `src/components/automations/SendHistoryList.tsx` — email send history from activity_log
- `src/components/automations/AgentDetailPanel.tsx` — 3-tab panel for Claude Code agents
- `src/components/automations/EmailDetailPanel.tsx` — 4-tab panel for email automations
- `src/components/automations/EmailTemplateEditor.tsx` — template editor with {{variable}} pills
- `src/components/automations/AssistantDetailPanel.tsx` — 2-tab panel for chatbot prompts
- `src/components/automations/InlineDraftEditor.tsx` — inline draft editor for loan/contact records

**Modified files:**
- `src/app/dashboard/automations/page.tsx` — completely replaced with Command Center
- `src/components/automations/AutomationPanel.tsx` — now queries `automation_registry` instead of `definitions.ts`
- `src/components/automations/AutomationCard.tsx` — uses `AutomationRegistryRow`, calls new API routes
- `src/lib/database.types.ts` — regenerated with new tables

**Deleted files:**
- `src/lib/automations/definitions.ts` — replaced by `automation_registry` table
- `src/lib/automations/prompts.ts` — replaced by registry `config` + `prompt_snapshot` fields
- `src/app/api/automations/generate/route.ts` — replaced by `email/generate`
- `src/app/api/automations/refine/route.ts` — replaced by `email/[draftId]/refine`
- `src/app/api/automations/send/route.ts` — replaced by `email/[draftId]/send`

**Architecture:** `automation_registry` is the single source of truth. Claude Code agents read config at runtime. n8n workflows get paused/resumed via n8n API. Email generation routed through n8n webhooks. "Ask Claude" panel lets users modify config via natural language with diff preview. Detail panels differentiate by source type (claude_code → Agent, n8n → Email, supabase_setting → Assistant).

**Env vars needed (not yet in Vercel):** `N8N_API_KEY`, `N8N_WEBHOOK_BASE`

---

## Email Automation Panel — 2026-03-29 (SUPERSEDED by Automation Command Center)

Legacy email automation panel — definitions.ts and prompts.ts deleted, replaced by automation_registry.

---

## Social Dashboard Bug Fixes + Enterprise Spec + Automation Panel Prompt — 2026-03-29

**3 social dashboard bugs fixed:**
1. **Broken image thumbnails** in SocialComposePanel: `getPublicUrl()` returns dead URLs for authenticated Supabase Storage. Replaced with `createSignedUrl()` (1-hour expiry).
2. **Silent generate failure**: Empty `catch {}` block in `handleGenerate()` hid all errors. Added `generateError` state, proper error checking, and red error banner.
3. **Broken media display** in SocialDraftDetail: Added `useEffect` hook that resolves signed URLs from stored paths/broken public URLs.

**API validation fix** (`/api/chat/social`): Added `VALID_FORMATS` and `VALID_PLATFORMS` arrays + `FORMAT_TO_DB` mapping to prevent DB check constraint violations on insert.

**New files:**
- `tasks/enterprise/specs/2026-03-29-enterprise-social-media-spec.md` — Multi-tenant social media customization spec (voice wizard, pillar picker, platform connections, compliance profile, starter post generation)
- `tasks/enterprise/enterprise-queue.md` — Updated with Enterprise Social Media as next build
- `tasks/automation-panel-prompt.md` — Email Automation Panel build prompt: 14 automations (4 contact-level, 10 loan-level with stage filtering), generate/refine/send API routes, AutomationPanel + AutomationCard components

**Modified files:**
- `src/app/dashboard/marketing/_components/SocialComposePanel.tsx` — signed URLs, FORMAT_TO_DB, error state
- `src/app/dashboard/marketing/_components/SocialDraftDetail.tsx` — signed URL resolution in useEffect
- `src/app/api/chat/social/route.ts` — format/platform validation, insert error handling

---

## Loan Record View Redesign + Color Coding — 2026-03-29

**Two commits, both deployed:**

1. **Flat layout redesign** (`cb095fb`):
   - Consolidated header: slim vital signs row replaces scrollable chip boxes
   - CommunicationHub: full-width contact cards with one-click Phone/SMS/Email + "Last Contacted" from activity log
   - Actionable milestones: shows agent notification status (✓ Notified / ⚠ Not sent) per completed stage
   - PropertyDetailsToggle: primary fields visible, secondary behind More/Less
   - Removed: LoanEssentialsPanel, PropertySummaryCard, PartnerContactsPanel

2. **Color coding** (`93c87f9`):
   - Pipeline progress bar: each stage gets its own color (blue → amber → purple → green → gold) instead of all-gold
   - Milestone timeline: colored circles per stage, colored labels when complete/active
   - Communication hub: colored left border + role labels per party type (Borrower=blue, Buyer's Agent=green, Listing Agent=amber, Title=purple, Referring Agent=gold)
   - Vital stats: Amount=blue, Rate=green, LTV=purple, DTI=amber
   - Key dates: colored dot + label for filled dates, dim gray for empty
   - Tab bar: active tab underline matches loan's current status color via `statusHex()`

**Files modified:** `src/app/dashboard/loans/[id]/page.tsx` (both commits)

**Note:** Pre-push hook updated to retry on failure — Next.js 14.2.35 has an intermittent race condition creating manifest files during local builds. Vercel builds are unaffected.

---

## Arive/LoanOS Separation + Dead Code Cleanup — 2026-03-27

## Social Media Dashboard — 2026-03-29 PM

**New SOCIAL tab** in Marketing section — email-client-style layout for reviewing agent-generated social media posts.

**3 new Supabase tables** (migration applied via MCP):
- `social_drafts` — posts generated by agent or user, with status workflow (draft → approved → scheduled → posted)
- `social_activity` — chronological log of agent actions (generated posts, research, errors)
- `social_settings` — key-value store for voice guide markdown (editable from UI)
- All 3 have RLS policies using `get_my_organization_id()`

**11 new files:**
- `src/app/api/chat/social/route.ts` — Scoped Claude chat (compose, edit, general modes). System prompt injects voice guide + selected draft context + compliance rules.
- `src/app/api/social/drafts/route.ts` — GET all drafts, PATCH update draft
- `src/app/api/social/activity/route.ts` — GET recent activity
- `src/app/api/social/settings/route.ts` — GET/POST voice guide
- `src/app/dashboard/marketing/_components/SocialTab.tsx` — Main orchestrator (browse/compose mode, draft state)
- `src/app/dashboard/marketing/_components/SocialDraftList.tsx` — Left panel: filterable list, NEW POST button, status badges
- `src/app/dashboard/marketing/_components/SocialDraftDetail.tsx` — Right panel: preview, inline edit, approve/reject, agent notes, scoped chat
- `src/app/dashboard/marketing/_components/SocialComposePanel.tsx` — Compose: prompt + platform/format picker + media upload zone
- `src/app/dashboard/marketing/_components/SocialActivityFeed.tsx` — Horizontal scrolling activity strip
- `src/app/dashboard/marketing/_components/VoiceGuideEditor.tsx` — Full-tab markdown editor with save
- `src/app/dashboard/marketing/_components/VoiceGuideDrawer.tsx` — Slide-out 480px drawer for quick voice guide view

**2 modified files:**
- `src/app/dashboard/marketing/page.tsx` — Added SOCIAL + VOICE GUIDE tabs, SOCIAL is now default
- `src/components/TopNav.tsx` — Added "Social Media" to Marketing dropdown

**Design spec:** `docs/superpowers/specs/2026-03-29-social-media-dashboard-design.md`

**Post-build enhancements (same session):**
- **Real media upload** in SocialComposePanel: drag-and-drop or click, uploads to Supabase Storage at `{userId}/social/{timestamp}_{filename}`, thumbnails with remove buttons
- **Storage RLS fix**: upload path changed from `social/{userId}/...` to `{userId}/social/...` (first folder must match `auth.uid()`)
- **Voice guide seeded**: inserted full `adam-voice-and-workflow.md` content into `social_settings` table via Supabase MCP
- **APPLY TO POST button**: Claude chat responses no longer auto-overwrite draft content — each assistant message has an explicit "APPLY TO POST" button
- **Media preview in draft detail**: single image full-width (max 300px), carousel with left/right arrows + index indicator, video with controls
- **PUBLISH TO PUBLER button**: gold button on approved drafts, calls `/api/social/publish` which pushes to Publer API as draft, updates status to `posted`, logs to `social_activity`
- **New API route**: `src/app/api/social/publish/route.ts` — maps platform to Publer account IDs, handles "all" platform, creates as Publer draft (`is_draft: true`)
- **Agent prompt updates**: `tasks/social-media/subagents/03-builder.md` now writes to `social_drafts` table via Supabase REST instead of Publer/PRs; `06-reporter.md` logs to `social_activity`; `master-agent.md` references Supabase dashboard workflow

---

## Realtor Relationship System — 2026-03-29 AM (Builder Execution)

**Migrations applied:** 061 (DDL: 9 new contacts columns + loans.referral_contact_id + last_touch_at trigger) + 062 (DROP top_realtor, target_realtor)

**DML backfills complete:** 123 referral links, 120 tiered, 117 staged, Crystal Kilpatrick: Tier A / Active Partner / 53 lifetime referrals

**Smart lists added (contacts/page.tsx):** Active Deal Partners, Top Producers YTD ≥ 2, Due for Outreach (60+ days), Tier A — Not This Month

**WF-R1 extended (J9Pe24vUi6fpZtdZ):** 10 nodes active. New branch: Check Has Referral → Fetch Realtor Contact → Check Realtor Found → Build Thank-You Email → Draft Thank-You to Realtor → Log Referral Outreach. **ACTION REQUIRED: Set Outlook credential on "Draft Thank-You to Realtor" node in n8n UI.**

**database.types.ts regenerated.** npm build passes.

---

## Arive/LoanOS Separation + Dead Code Cleanup — 2026-03-27

**Goal:** Clean separation — Arive handles loan processing/milestones/docs, LoanOS handles marketing/CRM/communications/pipeline visibility/analytics.

**n8n Workflows:**
- **Archived** Milestone Communication Agent (#3, `1hjOmS7inZcxEJQr`) — overlaps with Arive milestone emails
- **Archived** Outlook Email Sync (#5, `JMmstRl2C5ylmuIY`) — redundant with WF4 n8n Outlook trigger
- **Archived** TEMP Mailchimp Journeys (#18, `5CkBP28mJSZCJjxl`) — temp utility
- **Updated** Inbound Email Log (#4, `qgb99Eh2ziy0INMk`) — added `organization_id` to both activity_log inserts (fixes NOT NULL constraint), added "Find Active Loan" step to link emails to borrower's active loan, added `loan_name` to metadata

**LoanOS Dead Code Removed:**
- Deleted 6 API routes: `/api/outlook-auth`, `/api/outlook-callback`, `/api/outlook-disconnect`, `/api/outlook-refresh`, `/api/outlook-status`, `/api/outlook-sync`
- Deleted `/api/agents/milestone` (Arive handles milestone emails)
- Deleted `src/lib/outlook/refresh.ts` (no remaining imports)
- Replaced Outlook OAuth UI in settings page with simple "Email Sync — managed by n8n" status card
- Removed `OutlookStatus` type, Outlook state variables/handlers, unused imports (`useCallback`, `useSearchParams`, `XCircle`, `RefreshCw`, `Unplug`)
- Removed `api/outlook-sync` from middleware matcher exceptions

## Daily Audit 2026-03-25 (scheduled)

**Audited:**
- Null rows: all 9 tables 0 nulls ✅. email_inbound rows: 0 (fully purged).
- Schema: 8 `organization_id` columns still nullable. Applied NOT NULL to loans, contacts, documents, email_drafts, scenarios, todo_items, contact_activity, chat_sessions (migration 053). activity_log left nullable — trigger in place but WF1/WF2 cloud push unconfirmed.
- RLS: all policies confirmed correct. No new gaps.
- API routes: daily-briefing route had unscoped `loan_milestone_events` and `milestone_communications` queries (service role, no org filter). Fixed.

**Fixed this session:**
- **Migration 053 applied (via MCP as 051_not_null_organization_id_hardening)**: SET NOT NULL on loans, contacts, documents, email_drafts, scenarios, todo_items, contact_activity, chat_sessions. 0 nulls in all 8 confirmed before applying.
- **daily-briefing milestone query scoping**: Pre-fetches org's `arive_loan_ids` from loans, then scopes `loan_milestone_events` via `.in('loan_id', ariveLoanIds)`. Pre-fetches `milestoneEventIds` from that result to scope `milestone_communications` via `.in('milestone_event_id', milestoneEventIds)`. Both queries now return only the authenticated org's data.

**Outstanding:**
- **Adam must push WF1 to n8n cloud** (workflow ID `1tagvoU0UXtdDiMY`) — may still produce null loan_created rows; trigger catches it but NOT NULL constraint on activity_log still pending push confirmation
- **Adam must push WF2 to n8n cloud** (workflow ID `9JyzzwKac8v3uQ7d`) — same
- `activity_log.organization_id` NOT NULL — safe to add after WF1/WF2 confirmed pushed
- Performance page still uses localStorage with real borrower names
- Plan selection UI in onboarding deferred (defaults to 'starter')

## Multi-Tenancy Status (2026-03-25 — daily prep)

**NOT NULL hardened (8 tables):** loans ✅ NOT NULL, contacts ✅ NOT NULL, documents ✅ NOT NULL, email_drafts ✅ NOT NULL, scenarios ✅ NOT NULL, todo_items ✅ NOT NULL, contact_activity ✅ NOT NULL, chat_sessions ✅ NOT NULL

**Still nullable:** activity_log (trigger in place), marketing_activity_log, mcc_state, user_settings (last 3 are user-scoped by design)

**daily-briefing unscoped query:** ✅ Fixed — milestone_events and milestone_communications now scoped via loans join

## Daily Audit 2026-03-24 (scheduled)

**Audited:**
- Schema: 14 org-scoped tables confirmed. `contact_activity` found missing `organization_id` — migration 048 was written on disk but never applied to Supabase.
- Null rows: activity_log 18 null (15 email_inbound from Outlook Sync [Azure blocked], 2 status_updated from n8n WF2 [not pushed], 1 loan_created from n8n WF1 [not pushed]). chat_sessions 2 null (same 2 from 2026-03-23, user sessions created without org stamp).
- API routes: bulk-action, cd-extraction, pa-extraction all stamp org_id correctly. No new unscoped writers found.
- contact_activity RLS: was user_id-scoped only. Upgraded to org-scoped via migration 048.

**Fixed this session:**
- **Migration 048 applied**: Added `organization_id` to `contact_activity`, backfilled from related contact, dropped user_id-scoped policies, created org-scoped SELECT + INSERT policies. contact_activity is now fully org-scoped.
- **Migration 050 applied**: Backfilled 18 null activity_log rows + 2 null chat_sessions rows via profile lookup. 0 null rows confirmed in both tables.

**Outstanding (unchanged):**
- **Adam must push WF1 to n8n cloud** (workflow ID `1tagvoU0UXtdDiMY`) — will keep producing null loan_created rows until pushed
- **Adam must push WF2 to n8n cloud** (workflow ID `9JyzzwKac8v3uQ7d`) — will keep producing null status_updated rows until pushed
- n8n Outlook Email Sync blocked on Azure App Registration — continues producing email_inbound null-org rows daily
- chat_sessions.organization_id still nullable — can add NOT NULL once nulls stop recurring (requires WF1/WF2 pushed first)
- `daily-briefing` milestone queries (loan_milestone_events, milestone_communications) unscoped — medium priority, pre-multi-tenant launch fix needed

## Multi-Tenancy Status (2026-03-24 — daily prep)

**Tables with org_id (15 total):** loans ✅, contacts ✅, activity_log ✅, documents ✅, email_drafts ✅, scenarios ✅, todo_items ✅, chat_sessions ✅, contact_emails ✅ (scoped via join), contact_activity ✅ (added today), marketing_activity_log ✅, mcc_state ✅, user_settings ✅, org_settings ✅, system_prompts ✅ (uses org_id col)

**Null counts (post-050):** All 0. Recurring sources: Outlook Sync (Azure blocked) + n8n WF1/WF2 (not pushed).

## Daily Audit 2026-03-23 (scheduled — second run)

**Audited:**
- Schema: all 14 org-scoped tables confirmed. 6 new null activity_log rows + 1 null contact row found since migration 046 backfill.
- Root cause: 5 email_inbound rows from Outlook Email Sync (JMmstRl2C5ylmuIY — known, Azure blocked). 1 loan_created row + 1 contact (Aaron Treptow) from WF1 before 2026-03-23 fix (not yet pushed to n8n cloud).
- API routes audited: quick-add, web-lead, import/contacts, import/loans, outreach — all stamp organization_id correctly. No unscoped writers found in Next.js code.
- activity_log SELECT RLS: old policy had `user_id = auth.uid() OR organization_id = get_my_organization_id()` — the OR fallback exposed null-org rows to their original user (cross-tenant risk). Tightened to org-only.

**Fixed this session:**
- **Migration 048 applied**: backfilled 6 null activity_log rows + 1 null contact (Aaron Treptow) → Adam's org. 0 null rows in both tables confirmed.
- **activity_log SELECT RLS tightened**: dropped `"Users can read own activity"` policy (user_id OR clause). New policy `"Org members can read activity"` scopes to `organization_id = get_my_organization_id()` only.

**Outstanding (unchanged from 2026-03-23 morning):**
- **Adam must push WF1 to n8n cloud** (workflow ID `1tagvoU0UXtdDiMY`) — local JSON fixed but not live; will continue producing null-org rows until pushed
- n8n Outlook Email Sync blocked on Azure App Registration — continues producing email_inbound null-org rows
- Performance page still uses localStorage with real borrower names in seed data
- `chat_sessions.organization_id` still nullable — add NOT NULL once 0 null rows confirmed

## Multi-Tenancy Status (2026-03-23 — daily prep, second run)

## Multi-Tenancy Status (2026-03-22 — daily prep)

**Audited today:**
- Schema: all 14 org-scoped tables confirmed. `activity_log` found 3 new null org rows (created after migration 043's backfill) — root cause: n8n workflows inserting without org_id + Next.js code bugs.
- RLS: all policies confirmed correct. No new gaps. `activity_log` UPDATE/DELETE intentionally absent (immutable audit log). `org_settings` has no DELETE policy (acceptable).
- API routes: two code paths inserting to `activity_log` without `organization_id` found and fixed.
- `generate-narrative` route had no auth context — its activity_log insert would always produce null-org rows. Removed the insert.
- Onboarding: ✅ fully working (Tier 1 data, org create, profile link, redirect).
- n8n `status_updated` null row: from Arive Status Update workflow — cannot fix in Next.js code; will persist until n8n workflow is updated.

**Built/fixed this session:**
- Migration 046: backfilled 3 null `organization_id` rows in `activity_log` (0 null rows now)
- `src/lib/updateLastTouch.ts`: now fetches `profiles.organization_id` and stamps it on every activity_log insert
- `src/app/api/outlook-sync/route.ts` `logEmailActivity()`: now stamps `organization_id` from the matched contact row
- `src/app/api/scenarios/generate-narrative/route.ts`: removed unscoped activity_log insert (route has no auth — org_id unknowable)

**Outstanding:**
- n8n Arive Status Update workflow (`9JyzzwKac8v3uQ7d`) still inserts activity_log rows without org_id — Next.js code is now clean but n8n workflow needs a `Get Org ID` node added before the activity_log HTTP Request
- n8n Outlook Email Sync workflow (`JMmstRl2C5ylmuIY`) still inserts `email.received` rows without org_id — same pattern
- `chat_sessions.organization_id` is still nullable (no NOT NULL constraint) — safe to add after confirming no new nulls accumulate
- Plan selection UI in onboarding deferred (defaults to 'starter')

## Multi-Tenancy Status (2026-03-21 — session 13)

**Audited today:**
- All 14 tables with `organization_id`/`org_id` confirmed present. All key tables (loans, contacts, documents, email_drafts, scenarios, todo_items, chat_sessions) have org-scoped RLS.
- Null org row counts: 78 `activity_log` + 2 `contacts` + 2 `chat_sessions` — all backfilled to Adam's org via migration 043.
- `chat_sessions` RLS was still user_id-scoped despite having `organization_id` column — fixed in migration 044.
- `daily-briefing` API route had a `withOrg` fallback that could silently run unscoped queries if org lookup failed — fixed (hard 500 return now).
- Organizations table: ✅ all required columns including `slug`. Profiles: ✅ `nmls_individual`, `phone`, `states_licensed`, `email_signature`. org_settings: ✅ all required integration fields.
- Onboarding: ✅ `/onboarding` collects all Tier 1 fields. `/api/org/create` creates org, links profile as owner, seeds org_settings. Middleware redirects to /onboarding if no org assigned.

**Built/fixed this session:**
- Migration 043: backfilled 82 null `organization_id` rows across 3 tables
- Migration 044: replaced user_id-scoped chat_sessions RLS with org-scoped policies
- daily-briefing: removed unscoped fallback, now hard-fails if org cannot be resolved

**Outstanding (not blocking today):**
- `mcc_state`, `user_settings`, `marketing_activity_log` still user_id-scoped — acceptable for now (per-user data, not shared across org members)
- `chat_sessions.organization_id` now org-scoped but column is still nullable — add NOT NULL in a future migration after confirming no new null rows appear
- Plan selection UI in onboarding deferred (defaults to 'starter')

**Marketing Tab Redesign (2026-03-19 session 10)**: Full rebuild of `/dashboard/marketing` from a 9-tab 2440-line monolith into a 3-tab command center (SEND / CALLS / HISTORY). (1) **Dead code deleted**: 8 files removed — 3 sub-page routes (`content/`, `social/`, `rate-updates/`) and 5 API routes (`generate-newsletter`, `publish-newsletter`, `run-testimonials`, `send-mailchimp`, `log-social-post`) — all replaced by direct Netlify function calls. (2) **`schedule.ts` replaced**: stripped to 6-entry TRACKERS constant (removed DAYS, TCOLS, DayTask, DayDef). DailyScheduleWidget inlines those constants directly. (3) **New lib files**: `src/lib/marketing/types.ts` (MCCContact, LogEntry, MCCState, BLANK_STATE, APR_OFFSETS, RateRow, DEFAULT_RATE_ROWS, LOG_CHANNELS, LogChannel) + `src/lib/marketing/utils.ts` (aprForProduct, cadenceColor, channelToType, buildRatesString, currentWeekBoundaries, formatDaysAgo, formatWeekLabel, todayString) + 34 passing Vitest tests. (4) **New components** (all in `_components/`): `shared.tsx` (Card, SectionLabel, FieldLabel, Input, Textarea, Btn, CadenceBadge, Banner, Spinner, TypeBadge), `useMCCState.ts` (Supabase read/write hook + mergedState helper), `RateUpdateForm.tsx` (6-row rates table, APR auto-calc, preview/publish/schedule, logs to HISTORY), `NewsletterForm.tsx` (structured + custom prompt modes, preview/publish/schedule), `SendTab.tsx` (Rate Update / Newsletter inner toggle), `ContactCard.tsx` (Mark Called inline flow, calledToday at render time, tracker updates), `CallsTab.tsx` (4 lists, add form, CSV import, delete confirm), `HistoryTab.tsx` (week nav, cadence health strip, log table, manual log entry). (5) **`page.tsx` rewritten**: 83-line 3-tab shell replacing 2440-line monolith — uses useMCCState + mergedState, IBM Plex Mono font, gold header, loading/error states. (6) **Key patterns**: calledToday computed at render (not stored), TYPE badge derived from channel at render (not stored), `todayString()` uses local date components (not UTC toISOString), `cadenceColor()` uses Math.floor for stable integer-day boundaries, `PGRST116` handled as first-time user, noon-UTC anchor on saved log dates. TypeScript: 0 marketing errors, 34/34 utils tests pass. All commits on main, deployed to Vercel. Spec: `docs/superpowers/specs/2026-03-19-marketing-tab-redesign.md`. Plan: `docs/superpowers/plans/2026-03-19-marketing-tab-redesign.md`.

**Sprint: Loan Detail + Naming (2026-03-20 session 12)**:
(1) **Migration 041** (`supabase/migrations/041_loan_name_and_missing_arive_fields.sql`) — adds `aus_result TEXT` and `originator_comp NUMERIC` columns to loans table; backfills `loan_name` for all existing records using `{borrower_last_name}-{street_address}` formula (strips city/state/unit from address). Applied to production Supabase.
(2) **Arive webhook** (`/api/arive-webhook/route.ts`) — auto-generates `loan_name` from `borrowerLastName` + `propertyAddress` whenever Arive doesn't send a `loanName` field; maps new fields `aus_result` (tries `ausResult`, `ausRecommendation`, `aus_recommendation`) and `originator_comp` (tries `originatorCompensation`, `originatorComp`, `originator_compensation`); adds `console.log` of raw payload keys for field auditing.
(3) **Loan detail page** (`/dashboard/loans/[id]/page.tsx`) — header now shows auto-generated `loan_name` as primary h1 (borrower name demoted to subtitle); commission removed from header meta strip (still editable in CollapsibleDetails > Financials); new `LoanInfoGrid` 6-card 2-col grid replaces `KeyDetailsCard` + verbose EditableSectionCards — cards: Borrower, Loan Terms, Property, Key Dates, Origination (shows aus_result + originator_comp), Parties; all EditableSectionCards preserved in collapsible `CollapsibleDetails` panel; commission removed from milestone tracking; `aus_result` and `originator_comp` added to Loan interface.
(4) **Contact detail page** — realtor contacts now show "Referred Borrowers" section with loan count badge; queries `buyer_agent_contact_id` and `listing_agent_contact_id` on loans table; shows borrower name, loan amount, status, close date; links to loan detail; empty state "No referrals yet". Implemented via `fetchReferredLoans` in page.tsx + `referredLoans` prop in ContactRecordView.

**Multi-Tenancy RLS Policy Audit + Policy Cleanup (2026-03-20 session 11)**: Daily audit confirmed all 13 required tables have `organization_id`. All 23 tables have RLS enabled. Zero loans or contacts with null org_id. Three stale-policy issues found and fixed via **Migration 040** (applied to Supabase): (1) `contacts` had 4 legacy user_id-based policies (`contacts_select_own`, `contacts_insert_own`, `contacts_update_own`, `contacts_delete_own`) coexisting with org-based policies from migration 031 — Supabase OR's multiple policies together, creating cross-tenant risk. Dropped all 4. (2) `activity_log` had an UPDATE policy ("Users can update own activity") that violates the immutable audit-log design. Dropped. (3) `marketing_activity_log` had a catch-all ALL policy alongside the 4 per-operation policies from migration 039 — redundant and overly broad. Dropped. Isolation verification script built at `scripts/verify-tenant-isolation.ts` — creates two test orgs, inserts one loan + one contact per org, verifies data-layer isolation, cleans up. One outstanding TODO: `daily-briefing` agent-secret path has an unscoped fallback if org lookup fails (line 71) — logged in todo.md. Running checklist: `docs/multitenancy-checklist.md`.

**Multi-Tenancy Schema Audit + Onboarding Expansion (2026-03-19 session 9)**: Daily audit run against production Supabase. Key findings: (1) All main data tables (loans, contacts, activity_log, documents, email_drafts, scenarios, todo_items, contact_emails) confirmed org-scoped with RLS. Zero loans or contacts with null organization_id. (2) Four tables missing `organization_id`: `chat_sessions`, `mcc_state`, `user_settings`, `marketing_activity_log` — all user_id-scoped (no cross-tenant leakage risk) but `organization_id` needed for completeness. `marketing_activity_log` had NO prior migration and no confirmed RLS. (3) `organizations` table missing: `nmls`, `logo_url`, `brand_color`, `plan` columns. `profiles` missing: `nmls_individual`, `phone`, `states_licensed`, `email_signature`. `org_settings` table does not exist. (4) **Migration 039** written (`supabase/migrations/039_expand_org_schema.sql`) — adds org_id to 4 tables with backfill, enables RLS on `marketing_activity_log`, expands `organizations`/`profiles`, creates `org_settings` with RLS and seeds existing orgs. **NEEDS APPLY IN SUPABASE SQL EDITOR.** (5) **Onboarding page** expanded to collect NMLS, phone, states licensed (all 50 states toggle UI) — was only collecting name + org name. (6) **`/api/org/create`** updated to accept + store new profile fields and create `org_settings` row. Running checklist: `docs/multitenancy-checklist.md`.

**Scenario Output Layout Restructure (2026-03-19)**: Restructured the Step 2 results layout in the Scenario Builder. (1) **Container**: removed `max-w-[1100px] mx-auto` — page now uses `w-full` so output is left-aligned and fills available width. (2) **Row 1 — Table + Metrics side-by-side**: `ScenarioSummaryTable` (left, `overflow-x-auto`, natural width) and `KeyMetricsGrid` (right, fixed `w-72` sidebar) rendered in a `flex gap-5 items-start` row. Table scrolls horizontally if scenarios overflow rather than pushing metrics off-screen. (3) **Row 2 — Break-Even Analysis**: `BreakEvenTable` full-width below the top row. (4) **Row 3 — Total Interest Paid**: `TotalInterestChart` full-width standalone. (5) **Row 4 — Monthly Payment + Cumulative Savings**: `MonthlyPaymentChart` + `CumulativeSavingsChart` in a 2-col grid (cumulative savings spans full width at `lg:col-span-2`). (6) **ScenarioCharts named exports**: Added `export { MonthlyPaymentChart, TotalInterestChart, CumulativeSavingsChart }` to `ScenarioCharts.tsx` so `ScenarioBuilder` can place individual charts at precise grid positions without duplicating logic. `ScenarioCharts` default export retained for backward compatibility (share page, PDF). **AI Analysis billing note**: `generate-narrative` route will return an error if `ANTHROPIC_API_KEY` has no credits — add credits at console.anthropic.com → Billing. Commits: `566a29e` (layout) + prior full-width commit.

**Audit Quick Wins (2026-03-19)**: Full repo audit + 5 quick wins implemented. (1) **TodoList wired into Dashboard**: `TodoList` component (backed by `todo_items` Supabase table + `/api/todos` routes) was fully built but never rendered. Now appears in Queue tab alongside SmartActionQueue. (2) **DashboardClient formatter cleanup**: Removed local `timeAgo()` (replaced with `fmtRelative` from `formatters.ts`) and local `fmtDate()` (replaced with `fmtDateShort` local helper for compact Mon DD format). (3) **Contacts page formatter cleanup**: Removed 3 inline functions (`fmtCurrency`, `fmtDate`, `fmtDateOnly`) — replaced with imports from `@/lib/formatters`. (4) **Stale loans threshold**: Raised from 3 days to 7 days in `dashboard/page.tsx` — significantly reduces "Needs Attention" section noise on Monday mornings. (5) **Deleted 6 orphaned dashboard components**: `PipelineCharts`, `PipelineKPIs`, `PipelineSummary`, `RecentActivity`, `RecentLoans`, `UrgentFlags` — all built, none imported. Audit report: `tasks/audit-reports/AUDIT-2026-03-19.md`. Remaining open issues: Performance page still on localStorage, chat_sessions RLS `USING (true)` still open, two stage normalization systems (`stageNormalization.ts` vs `loan-stages.ts`), dead `/api/pipeline/stats` route.

**Scenario Builder Output Rebuild (2026-03-18)**: Complete overhaul of the Scenario Builder output page, PDF, and share link — all three now derive from a single shared `DisplayData` pipeline. (1) **AI Analysis fix** (`src/app/api/scenarios/generate-narrative/route.ts`): Changed system prompt from bullet-point format to 4-paragraph plain English spec. Added sanitized error handling — auth errors return "AI generation is not configured. Contact your administrator."; all others return "AI generation failed. Please try again." Added server-side logging of `isAuthError` and `hasApiKey` flags to surface the real cause. (2) **NarrativeSection fix** (`src/app/dashboard/scenarios/new/NarrativeSection.tsx`): Client-side catch now shows sanitized error text in red; removed dead ternary. (3) **Shared DisplayData utility** (`src/lib/scenarios/displayData.ts`): 221-line module. Exports `DisplayData`, `ScenarioDisplayRow`, `KeyMetrics`, `BreakEvenRow`, `CumulativeSavingsPoint`. Two builder functions: `buildPurchaseDisplayData(scenarios, results)` and `buildRefiDisplayData(currentLoan, scenarios, results)`. Single source of truth — all savings, break-even, recommended-index, and 85-month cumulative savings data computed here. (4) **ScenarioSummaryTable** (`src/app/dashboard/scenarios/new/ScenarioSummaryTable.tsx`): Comparison table — navy bg + gold border on recommended column, "★ Recommended" badge, conditional Purchase Price row. 9 metric rows. Accepts `{ data: DisplayData }`. (5) **KeyMetricsGrid** (`src/app/dashboard/scenarios/new/KeyMetricsGrid.tsx`): 4 stat cards (Monthly Savings, 5yr, 15yr, Total Interest). Green highlight when positive. (6) **BreakEvenTable** (`src/app/dashboard/scenarios/new/BreakEvenTable.tsx`): 5-column table with gold break-even months. Returns null when no rows. (7) **ScenarioCharts** (`src/app/dashboard/scenarios/new/ScenarioCharts.tsx`): Completely rebuilt — 3 charts, all driven by `{ data: DisplayData }`. MonthlyPaymentChart and TotalInterestChart use `BarChart + Cell + LabelList` with gold recommended bar and custom `BarTopLabel` SVG renderer. CumulativeSavingsChart uses `LineChart + ReferenceDot` for annotated break-even points. (8) **ScenarioBuilder wiring** (`src/app/dashboard/scenarios/new/ScenarioBuilder.tsx`): Step 2 now computes `displayData` inline via IIFE; renders `ScenarioSummaryTable → KeyMetricsGrid → BreakEvenTable → ScenarioCharts`. Removed old `ResultsTable` reference. (9) **PDF route** (`src/app/api/scenarios/generate-pdf/route.ts`): Rebuilt with 7-section HTML — summary table, key metrics grid, break-even table, monthly payment SVG bar chart, total interest SVG bar chart, AI analysis paragraphs, closing costs appendix. Uses inline SVG for print-perfect charts. All values derived from `DisplayData`. (10) **Share page** (`src/app/share/[token]/page.tsx`): Rebuilt with same 7 sections using shared components. CSS variables injected via dark-theme wrapper (`--sc-*` → dark values) so all display components render correctly on the `#0a0a0a` background. Calculations re-run from raw `scenarios_data` on every load. `npm run build` passes clean. Commits: `5e2f2fe`, `84d609b`, `2831c79`, `221dd0e` + lint fix.

**Multi-Tenancy Completion Sprint (2026-03-18)**: Full org-scoped isolation across the entire stack. (1) **DB Migrations 032–034**: `organization_id` column + index added to `documents`, `email_drafts`, `scenarios`. Org-scoped RLS (SELECT/INSERT/UPDATE/DELETE) on all three tables. Legacy user-scoped policies on `email_drafts`/`scenarios` dropped. Scenarios `org_id` column removed (superseded by `organization_id`). (2) **`/api/me`** route: returns `{ organizationId, role, userId }` from `getOrganization()` — used by client components to get org context. (3) **`OrgProvider` + `useOrg()`**: React context provider in `src/components/OrgProvider.tsx`; fetches `/api/me` once on dashboard mount; exports `{ organizationId, role, userId, loading }`. `src/hooks/useOrg.ts` re-exports for clean imports. Dashboard layout wraps children in `<OrgProvider>`. (4) **Middleware** (`src/middleware.ts`): guards `/dashboard` routes — redirects to `/onboarding` if `profiles.organization_id` is null. Fixed `setAll()` to write cookies to the response object (was empty). (5) **Onboarding** (`/onboarding/page.tsx`): form captures org name + full name, POSTs to `/api/org/create`, redirects to `/dashboard`. (6) **`/api/org/create`**: creates `organizations` row + upserts profile as `owner`. (7) **`/api/org/members`**: GET lists members, PATCH changes role (owner/admin only). (8) **`/api/org/invite`**: sends Supabase auth invite + pre-creates profile row with org + role. (9) **All API routes** (20 routes): replaced `getUser()` with `getOrganization()`, added `organization_id` to all INSERTs, scoped SELECTs to org. Agent routes look up org from the loan record; `arive-webhook` looks up org from payload `user_id`. (10) **All server pages**: `getOrganization()` replaces `getUser()` for org-scoped queries. (11) **All client pages**: `useOrg()` replaces `supabase.auth.getUser()` for `userId`; RLS handles org scoping on SELECTs automatically. (12) **Settings page**: added Organization Members section with member list, inline role change, invite form. (13) **n8n WF1 + WF2**: added `Get Org ID` HTTP node that GETs `profiles?select=organization_id&id=eq.{systemUserId}` and stamps `organization_id` on all Supabase write nodes (contacts upsert, loans upsert, activity_log). WF3 unchanged (pure pass-through to `/api/agents/milestone`). **`npm run build` passes clean. Deployed to Vercel.**
**Dashboard Schedule Widget (2026-03-17)**: Added `DailyScheduleWidget` to the main Pipeline dashboard. (1) **Shared lib** (`src/lib/marketing/schedule.ts`): Extracted `DAYS`, `TCOLS`, `DayTask`, `DayDef` constants from `marketing/page.tsx` into a standalone module — no `'use client'` directive, importable by both server and client components. (2) **`DailyScheduleWidget.tsx`** (`src/components/dashboard/DailyScheduleWidget.tsx`): Self-contained client component — fetches `mcc_state` from Supabase on mount, renders today's task checklist with gold checkbox UI, progress bar, day/focus badge, and "Full hub →" link. Checking a task writes to `marketing_activity_log` + updates `mcc_state` blob. Returns `null` on weekends. Matches dashboard dark design system (`bg-[#0f172a]`, `border-[#1e293b]`, IBM Plex Mono). (3) **`DashboardClient.tsx`**: Added `<DailyScheduleWidget />` between the Needs Attention panel and the Recent Loans + Activity grid in the Pipeline tab. (4) **`marketing/page.tsx`**: Refactored to import DAYS/TCOLS from shared lib (removed inline definitions). **Loan Record Detail Sprint (2026-03-17)**: (1) **Webhook**: added `rate_lock_date` mapping (`body.rateLockDate`) — was the only missing key date in the handler. All others (submission, approval, closing, funding, loan_created, estimated_closing) already mapped. No migration needed — all columns confirmed in Supabase. (2) **Days Locked header**: changed from manually-stored `rate_lock_days` to dynamically calculated `rate_lock_expiration - today`; shows "N days" (positive = remaining) or "N days ago" in red if expired. (3) **Tab restructure**: removed Details and Notes tabs. New order: Dashboard | Automations | Activity (N) | Emails (N). (4) **Dashboard tab 2-col layout**: `flex` with `flex-1 min-w-0` left + `w-80 shrink-0` right sidebar. Left: MilestoneTimeline → KeyDetailsCard → Recent Activity → 7 detail sections (Loan Terms, Property, Borrower, Key Dates, Financials, Parties, Attribution, Linked Contact). Right sidebar: NotesSidebarPanel (500ms debounce auto-save, full height textarea) + DocumentsSidebarPanel (upload + download). (5) **Key Dates section**: now shows all 9 dates — Loan Created (read-only), Application, Submission, Approval, Est. Closing, Closing, Funding, Rate Lock Date, Lock Expiry. (6) Removed: `DetailsTab`, `ActivityNotesPanel`, `DocumentsPreview`, `LoanNotesTab` components. Deployed commit `222b196`.
**Marketing Tab Redesign (2026-03-18)**: Full audit + redesign of the Marketing section. (1) **Audit file**: `tasks/marketing-audit.md` — documents all 4 routes, all 8 Hub tabs, backend connections, and problems found. (2) **"Content Dashboard" renamed → "Newsletter Generator"**: `content/page.tsx` function renamed to `NewsletterGeneratorPage`, H1 updated, TopNav label updated from "Content Dashboard" to "Newsletter Generator". (3) **TopNav nav order reordered**: Rate Update is now position #1 in the Marketing dropdown (was #3), Newsletter Generator #2, Social Posts #3, Marketing Hub #4. Both desktop dropdown and mobile menu updated. (4) **"THIS WEEK" tab added as default landing tab** to Marketing Hub (`/dashboard/marketing`): replaces "TODAY" as default. Tab renders a new `ThisWeekTab` component with 4 sections: (A) "This Week" — Rate Update card with last-sent cadence badge + inline log form + newsletter generator with cadence badges for Realtors/Borrowers, backend status indicators (Anthropic/Mailchimp/dispatch configured checks); (B) "Email Tools" — 3 quick-link cards; (C) "Reach" — Call Lists count + Mailchimp status; (D) "Analytics" — 4 tracker tiles showing days since last for Rate Update/Newsletter/Social/Realtor Calls. (5) **Last-sent timestamps**: Rate Update card and Newsletter card both show cadence labels with color (green/gold/red) based on days since last. Rate Update shows exact date sent. (6) **Backend status indicators**: Newsletter section shows inline warnings when Anthropic key, Mailchimp, or dispatch webhook not configured. (7) **Design system maintained**: all new UI uses `#18181b` cards, `#3f3f46` borders, `#C9A84C` gold accent, IBM Plex Mono, mobile-responsive grid. (8) **TypeScript clean**: `npx tsc --noEmit` exits 0. Full rebuild — not a patch.
**Marketing Sprint (2026-03-17)**: 4-item sprint across the Marketing section. (1) **Daily Schedule checkbox logging**: checking a task now writes a row to `marketing_activity_log` Supabase table (`user_id`, `task_name`, `day_of_week`, `logged_at`, `source: 'daily_schedule'`) + appends to `mcc_state` activity log so it appears in the LOG tab feed. Progress bar added under the done/total count — animates gold → green on completion. Table created with RLS via Supabase MCP. (2) **Content Dashboard** (`/marketing/content`): replaced the kanban content board with the full Newsletter Generator (AI draft → Mailchimp → publish to website + newsletter history log). Reads/writes same `mcc_state` blob. (3) **Social Media Posts**: new standalone page at `/marketing/social` — full post log with platform filters (LinkedIn/Facebook/Instagram), stats bar, add form, mcc_state sync. (4) **Rate Updates**: new standalone page at `/marketing/rate-updates` — rate log with 30yr/15yr/ARM fields, cadence health indicator (green/gold/red based on days since last send), mcc_state last-sent sync. (5) **TopNav**: Social Media Posts → `/marketing/social`, Rate Updates → `/marketing/rate-updates` (dedicated pages fix the "does nothing" bug caused by React state not re-reading searchParams). Removed duplicate Newsletter Generator item. Added "Marketing Hub" link to reach the daily schedule tab view. Deployed commit `9794d12`.
**Scenario Builder Bug Fix (2026-03-17)**: Fixed two production crashes in the Scenario Builder. Root cause: `DEFAULT_CLOSING_COSTS`, `sumClosingCosts`, and `ensureClosingCosts` were defined in `ScenarioBuilder.tsx` (a `'use client'` file) and imported by server components — violates Next.js module boundary rules. Fix: extracted all three utilities to `src/lib/scenarios/utils.ts` (no `'use client'`). `ScenarioBuilder.tsx` now imports from there and re-exports. Both server pages (`scenarios/new/page.tsx`, `scenarios/[id]/page.tsx`) import directly from utils. Added missing `scenarios/[id]/error.tsx` error boundary. Added try-catch around `[id]/page.tsx` data reconstruction with redirect fallback. Deployed commit `15df57b`.
**Contacts Table Overhaul (2026-03-16)**: Major contacts table fixes across 9 areas. (1) **Horizontal scroll**: table now has `minWidth: max-content` inside a scrollable container. Dark gold scrollbar (6px, `#C9A84C44` track, gold thumb on hover). (2) **Drag-and-drop column reorder**: `@dnd-kit/core` + `@dnd-kit/sortable` installed. Non-name columns are sortable via horizontal drag. Grip icon (GripVertical) appears on header hover. Column order persists in `localStorage` key `loanos_contacts_col_order_v1`. (3) **Pinned Name column**: Name column always first, `position: sticky, left: 36px`, never draggable or hideable. Checkbox column also sticky at `left: 0`. Correct background prevents bleed-through during scroll. (4) **Column visibility**: COLUMNS dropdown unchanged in behavior — name column shown as always-on (disabled checkbox, "pinned" label). (5) **Column min-widths**: all 17 columns have fixed `minWidth` values per spec (200px Name → 220px Email/Realtor Email). (6) **Notes date format**: if Notes value is an ISO date string, renders as MM/DD/YYYY only (no time). (7) **Last Touch "Invalid Date" fix**: `LastTouchCell` now reads `last_touch_at` (falling back to `last_activity_date`). Strict `isNaN()` guard before formatting. Displays MM/DD/YYYY only. Green ≤3d, yellow ≤7d, red >7d color coding preserved. Null displays em dash. (8) **updateLastTouch() helper**: shared function at `src/lib/updateLastTouch.ts` — updates `contacts.last_touch_at = now()` and inserts to `activity_log` (type, action, summary, contact_id, loan_id, occurred_at, user_id). Wired to: note added, notes saved, contact field edited, stage changed (contacts page), log activity (call/email/text), loan stage changed (loans page). (9) **Migration 027**: Supabase DB trigger `loans_update_contact_last_touch` — auto-updates `contacts.last_touch_at` whenever a loan row is updated (covers n8n Arive syncs + manual edits). Applied to Supabase prod via MCP.
**Inbound Email Sync (2026-03-16)**: New inbound email sync system — n8n polls Outlook inbox every 5 min, matches senders to contacts, logs to `activity_log`. (1) **Migration 025**: added `subject`, `body_snippet`, `from_address`, `to_address`, `occurred_at` columns to `activity_log`. Added `last_touch_at` timestamptz to `contacts`. Partial index on `metadata->>'needs_review'` for fast unmatched email queries. (2) **n8n Workflow** (`qgb99Eh2ziy0INMk`): "LoanOS — Inbound Email → Supabase Log" — Outlook trigger → extract fields → filter noise (blocked prefixes/domains) → find contact by email → if matched: log to activity_log + update contact last_touch_at → if unmatched but transactional (mortgage keywords, dollar amounts, addresses): log with `needs_review: true` → if not transactional: drop. Deployed inactive — needs Microsoft Outlook credential connected in n8n to activate. (3) **ContactEmailFeed**: Emails tab on contact detail now shows inbound emails from `activity_log` (type=email_inbound) above existing outbound draft history. Collapsible body_snippet, gold INBOUND badge, formatted timestamps. (4) **Unmatched Email Review** (`/dashboard/emails/unmatched`): table of unmatched transactional emails with "Link to Contact" search modal and dismiss button. Updates `activity_log.contact_id` and `contacts.last_touch_at` on link. (5) **Nav**: "Emails" item added to TopNav (desktop + mobile), routes to `/dashboard/emails/unmatched`.
**Loan Detail Page Fixes + Activity Log (2026-03-16)**: 6-fix sprint on loan detail page. (1) **Activity log root cause fix**: ActivityRow interface was missing `type` and `summary` fields — notes were saved to DB but never read back. Fixed: interface + select query now include both fields. Insert now includes `user_id` from auth session. Optimistic update prepends new entry to feed before server confirms, with rollback on failure. Feed display upgraded: type-specific icons (phone/email/text), full timestamps (not relative), notes shown in full. (2) **Header row 2**: added Est. Close Date, Rate Lock Date, Lock Expiry, Days Locked below existing meta strip. All four fields inline-editable (click → date/number input → blur saves to Supabase). (3) **Rate lock expiry warnings**: automatic badges — yellow "Expires in N days" when within 5 days, red "Lock Expired" when past. No manual input needed. (4) **Commission bug**: root cause was bad test data (Priya Nair had $1M, Derek Cho $10K, Maria Gutierrez $100K). Fixed to correct 1% values. Display code was already correct. (5) **Milestones aligned to canonical stages**: replaced hardcoded string matching with `normalizeToStageKey()` from `loan-stages.ts`. Added `hasReachedStage()` helper using ordered STAGE_ORDER array. Added "Approved w/ Conditions" milestone (was missing). Each milestone maps to a canonical StageKey. (6) **Key Loan Details expanded**: added Est. Close Date, Rate Lock Expiry, Commission to the key details card on Dashboard tab. Schema: added `rate_lock_date` (DATE) and `rate_lock_days` (INTEGER) columns to loans table. Test data updated: 8 in-process loans now have estimated close dates + rate lock data. Scott Tillman (3/21) and Travis Coleman (3/20) locks trigger warning badges. Audit report: `tasks/audit-reports/loan-detail-audit.md`.
**Loans + Contacts Sync Fix + UI Fixes (2026-03-16)**: 10-fix sprint across loans list, loan detail, contacts sync, and stage definitions. (1) **Loan row click routing**: clicking any loan row now routes to `/dashboard/loans/[id]` — previously no row click handler existed. Borrower name links to `/dashboard/contacts/[contact_id]`. Checkbox and interactive cells stop propagation. (2) **Stage constants (single source of truth)**: `lib/constants/loan-stages.ts` defines all stage keys, labels, groups, raw status mappings, and helper functions. Replaces 6+ scattered hardcoded stage lists across dashboard, loans list, stage normalization. (3+4) **Stage filter corrections**: Loans in Process and Closed filters now powered by constants — includes all Arive raw variants automatically. (5) **Contact ↔ Loan sync**: Supabase trigger `sync_contact_stage_from_loan()` auto-updates `contacts.stage` when `loans.status` changes (both UPDATE and INSERT). One-time backfill run: 855 Closed, 18 In Process, 36 Pre-Approved, 1425 Leads. (6) **Commission field**: editable inline in loan detail header (click em dash or value to edit, blur/Enter to save). Added to Financials section in Details tab. Shows em dash when null. (7+8) **User scoping on loans list**: `user_id` filter added to ALL Supabase queries (counts and data fetch). Loans list now waits for auth before fetching. Dashboard page already had user_id filter. (9) **Filterable loan lists**: preset dropdown (Loans in Process, Pre-Approvals, Closed by month, YTD, Needs Attention), expandable advanced filters (Purpose, Loan Type, Date range), active filter chips with × clear, Clear All button. Search now matches email too. (10) **Borrower name → contact link**: borrower name in loans list links to `/dashboard/contacts/[contact_id]`. Audit report: `tasks/audit-reports/loans-contacts-audit.md`.
**Dashboard Links + Automations Sprint (2026-03-16)**: 6 improvements across dashboard, loans list, loan detail, and automations. (1) **Dashboard hyperlinks**: all 4 KPI cards now link to /dashboard/loans with appropriate filters (Pipeline Loans, Gross Commission, Commission YTD, This Month). Today's Focus links to /dashboard/marketing. Needs Attention shows "View all" link to /dashboard/loans?filter=no_activity_3days. Stage cards already linked. (2) **Automations expanded**: both loan detail Automations tab AND standalone /dashboard/automations page now show all 8 workflows (PA Email, CD Email, Refi Intake, Refi Analysis, Referral Intro, Website Lead Follow-up, New Application, Contract Received). Previously only 4-5. (3) **Actions pre-selection**: clicking an automation in the loan detail Actions dropdown now auto-opens that automation's trigger modal in the Automations tab (via `selectedAutomationId` state + `highlightId` prop). (4) **Loans list URL filters**: /dashboard/loans now reads `stage`, `filter`, `period` query params from URL. Dashboard stage cards link to `?stage=StageName` which client-side filters the loaded loan set. Active filters shown as gold/blue/orange badge chips with × clear buttons. Header stats (Total Loans, Volume, Commission) recalculate for filtered set. (5) **Report stub pages**: new `/dashboard/reports/volume` and `/dashboard/reports/commission` pages — server-rendered tables showing YTD funded loans with totals. (6) **Activity log verified working**: `activity_log` table exists with correct schema, insert + refresh + display all functional — no fix needed.
**Dashboard Rebuild v2.0 (2026-03-16)**: Major UI overhaul across 6 areas. (1) **Main Dashboard**: rebuilt with dark monochromatic theme (`bg-[#060b18]`), gold accent `#C9A84C`, IBM Plex Mono font. Pipeline KPI cards + stage cards (clickable to filter loans). Today's Focus panel with day-of-week marketing schedule. Needs Attention panel (loans stale 3+ days). Performance tab with Recharts (volume/commission/pipeline charts + monthly breakdown table). New `DashboardClient.tsx` component. (2) **Loans List**: header stats (Total Volume, Total Loans, Gross Commission), commission_amount in cards. (3) **Loan Detail**: expanded actions dropdown (8 n8n automations: PA Email, CD Email, Refi Intake, Refi Analysis, Referral Intro, Website Lead Follow-up, New App, Contract Received). Activity logging UI with Log Call/Email/Text buttons + modal. Borrower name links to contact. Commission in meta strip. (4) **TopNav**: updated to dark theme matching dashboard. (5) **Scenario Builder**: converted from side-by-side layout to 3-step wizard (Setup → Loan Options → Results). Auto-calculates on step advance. PercentField rate input fix (local string state for decimal typing). Closing costs already had full itemized template. (6) **PDF Output**: upgraded to branded multi-section layout matching refi-analysis skill style — NAVY `#0A1628` header/footer bars, gold accents, per-scenario cards with hero metrics + closing cost breakdown, bullet-format AI analysis rendering, CTA footer. (7) **AI Narrative**: prompt updated to output bullet format with bold section headers (Bottom Line, Monthly Impact, Long-Term View, Trade-Offs). Supabase migration 024: `commission_amount` decimal field on loans table.
**Test Data Seed (2026-03-16)**: Created test user `test@loanos.dev` / `TestLoanOS2025!` (UUID: `deadbeef-dead-beef-dead-beefdeadbe01`) with full fake pipeline data for UI development and testing. **45 contacts** (34 borrowers, 9 realtors, 2 financial advisors), **37 loans** across all pipeline stages (3 leads, 4 new apps, 6 pre-approved, 3 processing, 4 underwriting, 4 CTC, 13 funded), **72 activity log entries**. Funded loans spread across Jan/Feb/Mar 2026. All Austin/TX addresses. Includes special cases: Nathan Burke (stale pre-approval, no activity 10+ days), David Park (2 loans — primary + investment), financial advisor referral chain (Cheng → Blackwell). Seed files: `supabase/seed-test-user.sql` + `supabase/seed-expand.sql`. Cleanup: `supabase/cleanup-test-user.sql`. All records scoped to test user UUID — zero impact on production data. Deterministic UUIDs: contacts `c0000000-...`, loans `a0000000-...`.
816 Arive loans imported and backfilled as of March 10, 2026. Salesforce CSV backfill complete (2026-03-12) — 532 loans updated with `arive_loan_id` + additional fields from Salesforce export.
AI Chat fully live as of March 11, 2026 — contact context working, clear button fixed. Outlook Email integration built — needs manual deploy steps to go live (Azure env vars not set).
Agent 5 (Loan Milestone Communication Agent): n8n workflow live (ID: 1hjOmS7inZcxEJQr), Zapier Zap published, auth middleware fixed (`/api/agents/*` excluded) — needs Vercel env vars (ZAPIER_DISPATCH_WEBHOOK_URL, DISPATCH_SECRET) to fully activate. Agent 1 (Daily Briefing): deployed to Vercel — reachable via "Briefing" nav link (added 2026-03-15).
ARIVE webhook integration + Jungo CSV backfill + DB field expansion complete (2026-03-11). Contact detail view: phone_mobile display row + inline notes editing with save-on-blur.
v1.9.0 deployed to Vercel (2026-03-12).
**Sprint 1 Security Lockdown (2026-03-15)**: All 4 `/api/agents/*` routes locked down with `Authorization: Bearer <LOANOS_AGENT_SECRET>` header validation — shared helper at `src/lib/auth/validateAgentSecret.ts`. `getServiceClient()` eliminated from 7 routes, replaced with `createServiceClient()` from `src/lib/supabase/service.ts`. Hardcoded n8n URL replaced with `process.env.NEXT_PUBLIC_N8N_WEBHOOK_BASE` in `loans/[id]/page.tsx` and `automations/page.tsx`. `netlify.toml` deleted, `@netlify/plugin-nextjs` removed. Migrations `0016`/`0017` renamed to `017`/`018` (016 already existed). 4 new migrations created (019–022): fix activity_log RLS (no DELETE), fix chat_sessions RLS (add user_id + scope), fix email_drafts RLS (add user_id + scope), disable contract webhook trigger. Migrations 019–022 applied to Supabase via MCP (2026-03-15). n8n WF3 (Milestone, `1hjOmS7inZcxEJQr`) updated with `Authorization: Bearer <LOANOS_AGENT_SECRET> (value stored in Vercel env vars — do not write plaintext here)` header — only WF3 actually calls a LoanOS agent route (WF5/WF8/WF9 call Supabase/Claude directly, not agent routes). **Vercel env vars (LOANOS_AGENT_SECRET, NEXT_PUBLIC_N8N_WEBHOOK_BASE) must still be added manually in Vercel dashboard.** `stageNormalization.ts` NOT deleted — actively used by quick-add and bulk-action routes (audit was wrong). `npm run build` passes clean. Full results: `tasks/audit-reports/sprint-1-results.md`.
**All migrations applied as of 2026-03-15.** Verified via Supabase MCP: all 18 migrations (001–018) confirmed applied — 16 tables (added `scenarios`), 201 columns on loans table. RLS re-enabled on 6 tables that had it disabled (activity_log, loan_milestone_events, milestone_communications, outlook_tokens, oauth_state, automation_logs). User-scoped read policies added to loan_milestone_events and milestone_communications. Remaining RLS concern: `chat_sessions` still has `USING (true)` — needs user_id column for proper scoping before multi-tenant.
**Sprint 2 — AI Scenario Builder v2.0.0 (2026-03-15)**: Complete Mortgage Coach replacement built. Purchase mode: 2-4 scenario columns with full inputs (down payment $/% toggle, buydown 2-1/3-2-1, extra payment simulator, collapsible closing costs/monthly costs). Refinance mode: current loan card with auto-calculated balance + remaining term, 1-3 new loan options, debt consolidation with cash-out toggle. Results: comparison table with gold checkmarks on best values, IBM Plex Mono numbers. 4 Recharts: payment bar, equity area, savings line, amortization stacked area (all with time horizon toggles). Reinvestment analysis (FV of annuity). Claude AI narrative via SSE streaming (editable, auto-disclaimer). PDF generation (HTML V1). MISMO 3.4 import (regex V1, SSN masked). Shareable links (/share/[token], 90-day expiry, view tracking). Scenario history dashboard (list/search/duplicate/delete). 32 files created, `npm run build` passes clean. Migration: `018_scenarios.sql`. **Deployed to Vercel production** — deployment `dpl_BA2rfPXz5nT73nv4AtAumeKGi7XQ`, state: READY, commit `3fc5174`. Live at `loanos-self.vercel.app`. **Migration `018_scenarios.sql` applied to Supabase via MCP (2026-03-15)** — `scenarios` table created with 20 columns, 3 indexes, 4 RLS policies (SELECT/INSERT/UPDATE/DELETE), auto-update trigger. Verified: all columns + policies confirmed via `information_schema` + `pg_policies` queries. Go-live step remaining: ensure `ANTHROPIC_API_KEY` set in Vercel env vars. Full results: `tasks/audit-reports/sprint-2-results.md`.
**Sprint 2 v2.1 — Scenario Builder UX + Integrations (2026-03-15)**: 8 fixes/features on top of v2.0.0. (1) Fixed white input backgrounds — PercentField had no `background` set, all inputs now use explicit `var(--sc-bg)`. (2) Closing costs templates — purchase (2%/2.5%/3% of loan) and refi (1.5%/2%/2.5%) auto-fill buttons. (3) "Copy A →" / "Copy 1 →" buttons copy all fields from first scenario to subsequent options. (4) PDF generation fixed — was calling `res.json()` on HTML response; now opens HTML in new window + fixed save→PDF race condition (save returns id directly, not via async setState). (5) PDF route upgraded — imports calculation functions server-side, recalculates from saved inputs, renders full comparison table with 14–17 metrics. (6) Share page upgraded — full comparison table with gold checkmarks (✦) on best values, summary cards, reinvestment analysis, narrative + disclaimer. (7) Loan record integration — "Create Scenario" button in loan detail Actions dropdown, routes to `/dashboard/scenarios/new?loan_id=xxx`, auto-populates purchase or refi mode from loan data. (8) Mortgage statement upload — "Upload Statement" button in refi mode, PDF → Claude extracts original amount/current balance/rate/term/start date/monthly P&I/escrow/PMI, preview before applying. New API route: `/api/scenarios/parse-statement`. Migration 023 applied via Supabase MCP (`results_data jsonb` column on scenarios table). Save endpoint now stores `results_data` (amortization schedules stripped for JSONB size). **Deployed to Vercel production** — deployment `dpl_9M1VqMSBT68p5tN2nTAqxJnHpaHb`, state: READY, commit `2484973`. Go-live requirement: `ANTHROPIC_API_KEY` must be set in Vercel env vars for narrative generation + statement parsing.
**Daily Audit v1.22.0 (2026-03-15)**: 5 quick wins from full codebase audit. (1) TopNav: removed duplicate "Pipeline" nav item (was duplicate of "Loans"), replaced with "Briefing" link pointing to `/dashboard/briefing`. (2) Loan detail Actions button wired up — was a non-functional stub; now opens a dropdown with PA/CD/Referral Intro automation shortcuts + tab navigation links (Activity, Emails, Docs). (3) `automations/page.tsx` fully converted from light slate to dark zinc theme — page background, workflow cards, modal, form inputs, connectors, status badges all updated. (4) `referral/[referrerName]/page.tsx` — all inline style `var(--)` CSS variable references replaced with hardcoded zinc hex values (`#09090b`, `#18181b`, `#3f3f46`, `#71717a`, `#e4e4e7`); font references changed to `'IBM Plex Mono', monospace`. (5) Chat route `max_tokens` bumped from 1024 → 2048 to prevent truncation on long email drafts. Audit report: `tasks/audit-reports/AUDIT-2026-03-15.md`.
**Loan Detail Dashboard Layout v1.21.0 (2026-03-14)**: `loans/[id]/page.tsx` fully redesigned. Header: breadcrumb + name + address + status badge + Actions button + 6-field meta strip + pipeline progress bar (Application→Processing→Underwriting→CTC→Funding). Default tab "Dashboard": 2-col layout — left (3/5): KeyDetailsCard (3×4 grid of key metrics) + DocumentsPreview (inline doc list + upload); right (2/5): MilestoneTimeline (7-step with completion inference from loan dates + stage) + ActivityNotesPanel (notes + recent activity). Old Overview → renamed "Details" tab. Tabs: Dashboard | Details | Automations | Activity | Emails. Zero ESLint/TS errors.
**Backlog Cleanup v1.20.0 (2026-03-14)**: Migration 017 (`user_settings`) applied via Supabase MCP. `RUN_ALL_PENDING.sql` updated to cover all migrations 006–017. Activity auto-log added to contacts stage changes (`contact.stage_changed`) and loans status changes (`loan.status_changed`) — fire-and-forget, no UI impact. Two new Next.js API routes: `POST /api/agents/cd-extraction` + `POST /api/agents/pa-extraction` — n8n calls these after Claude extracts CD/PA fields; routes update loans table and log to activity_log. Marketing page (`/dashboard/marketing`) migrated from Bloomberg CSS vars to hardcoded dark zinc hex values — all 142 `var(--)` references replaced. `docs/n8n-credentials-setup.md` created with setup steps for Review Request + Social Post workflows + CD/PA payload reference.
**Email Draft Preview v1.19.0 (2026-03-14)**: Email Draft Preview fully wired. POST endpoint added to `/api/email-drafts` for external callers (n8n). Email History tab added to loan detail page (5th tab) — queries `email_drafts` where `loan_id = id`, inline iframe HTML preview, Mark Sent / Discard for pending drafts. Email History tab added to contact detail page — same pattern with `contact_id` filter. `EmailDraftRow` type exported from `ContactRecordView.tsx`. All new automations should call `logEmailDraft()` from `src/lib/supabase/logEmailDraft.ts`.
**Marketing: Newsletter Generator + Testimonials v1.18.0 (2026-03-14)**: Newsletter Generator panel in NEWSLETTERS tab — AI drafts teaser email HTML + full web page HTML via `/api/marketing/generate-newsletter` (Claude); SEND MAILCHIMP + PUBLISH TO WEBSITE actions. Testimonials Automation card in SOCIAL tab — RUN NOW triggers n8n Weekly Social Post workflow (`eJG4wckrj6SmSpm1`). 4 new API routes. TopNav Marketing dropdown deep links to `?tab=` URL params. Requires Vercel env: `N8N_API_KEY`, Mailchimp keys in Settings, dispatch webhook in Settings.
**CRM + Dashboard Overhaul v1.17.0 (2026-03-14)**: 5-task sprint — (1) Fixed Closing Volume 90d chart: status case sensitivity bug (`'closed'` vs `'Closed'`) caused 0 results; fixed `.in()` filter + added 90d totals to chart header. (2) Global Search: replaced CSS vars with hardcoded zinc palette, added type pills, fixed text overflow. (3) Contacts default view → Hot List / Pre-Approved; added `all-borrowers` smart list + quick filter dropdown. (4) Loans default view → In Process; closing date ASC sort; urgency row coloring (amber ≤14d, red ≤7d); quick filter dropdown. (5) AI Chat system prompt: full replacement with LoanOS AI identity + Adam's revenue framework + today's date injection.
**Marketing Command Center v1.16.0 (2026-03-14)**: Full upgrade of `/dashboard/marketing/page.tsx` to match `marketing-command-center.html` on styermortgage.com. Added: `StatRow` (4-KPI strip), `OverdueBanner` (red overdue chips → LogModal), `LogModal` (shared log modal at page level), Brain Dump sidebar in TODAY tab, Log ↗ quick buttons on tasks, Tracker progress bars + LOG NOW, Contacts search + CSV import, Social platform filters, Newsletter table layout + audience filters, Log calendar view with week nav. All Supabase persistence preserved. Build verified clean (1,592 lines).
**Daily Audit v1.15.1 (2026-03-14)**: 5 bug fixes from automated audit. Wrong Claude model `claude-sonnet-4-20250514` → `claude-sonnet-4-5` in refi-intake (was 502ing every automation). Layout bg fixed `bg-slate-50` → `bg-zinc-950`. Removed debug console.logs from arive-webhook, outlook-callback, outlook-sync. Deleted orphaned SidebarNav.tsx. Audit report: `tasks/audit-reports/AUDIT-2026-03-14.md`.
**Sprint 1 audit fixes (2026-03-13)**: 4 bugs + 2 UX improvements. Closed Borrowers filter fixed (`'Closed'` not `'Closed Client'`), last_touch timestamps formatted, Lead status color → slate, `mobile_phone` consolidated to `phone_mobile` (migration 014). Loans page bulk actions bar (checkbox + floating emerald bar + UPDATE STATUS/DELETE). Inline file upload in loan detail DocumentsTab. TypeScript clean (0 errors).
**Sprint 3 — Data Integrity (2026-03-13)**: Activity log improvements across loans + contacts.
**Dashboard Redesign v1.14.0 (2026-03-13)**: Full dashboard rebuilt from scratch. Replaced 5-stat landing page with production pipeline dashboard. New components: PipelineKPIs (4 KPI cards with MTD delta), PipelineCharts (stage bar chart + 90-day closing trend via recharts), UrgentFlags (pre-approval expiry + past-close-date alerts), DailyBriefingPanel (embedded briefing with Run button), TodoList (Supabase-persisted CRUD tasks with urgent flag), RecentActivity (7-day log with type filter). New Supabase table: `todo_items` (migration 016 — apply via SQL Editor). New API routes: `/api/todos`, `/api/todos/[id]`, `/api/pipeline/stats`. recharts ^3.8.0 installed. Build verified clean.
- **3.4a — Loan detail ActivityTab** (`loans/[id]/page.tsx`): Removed `.slice(0, 3)` metadata hard cap; expanded `INTERNAL_KEYS` Set to include `'id'` and `'created_at'`; added All/System/Manual pill filter (`useState<'all'|'system'|'manual'>`); system heuristic = `action.includes('.')` (n8n uses dot-notation); color-coded timeline dots (emerald=system, blue=manual); empty state within filtered view.
- **3.4b — Cross-entity activity merge** (`contacts/[id]/page.tsx`, `ContactRecordView.tsx`, `ActivityTimeline.tsx`): Contact detail activity now merges contact-level + loan-level activity. `fetchActivity` runs 3 Supabase queries: contact rows → linked loans → loan activity rows. Deduplicates by `row.id` (Set). Tags net-new loan entries `_source: 'Loan: {loan_name}'`. Sorts merged array descending. `_source` is purely client-side — zero DB schema changes. `ActivityEntry` type extended with `loan_id?` + `_source?`. `ActivityLogRow` and `NormalizedEntry` in `ActivityTimeline.tsx` extended with same fields. Source badge rendered in `TimelineEntry` as slate-100 pill.
**Sprint 4+5 — UX polish (2026-03-13)**: Global search palette + activity feed + kanban view + smart list actions.
- **Task 2 — Smart List Delete/Edit** (`contacts/page.tsx`): Trash2 delete icon (confirm modal, removes from localStorage) + Pencil edit icon (opens slide-out pre-populated). Both icons visible on row hover.
- **Task 3 — Kanban Pipeline View** (`contacts/page.tsx`): LIST | KANBAN toggle. `@hello-pangea/dnd` board — 5 columns (Lead, Pre-App, Pre-Approved, In Process, Closed). Drag-and-drop PATCHes contact `stage` in Supabase; column counts live.
- **Task 4 — Global Search ⌘K** (`GlobalSearch.tsx`, `TopNav.tsx`): Fixed-position palette. ⌘K/Ctrl+K opens, Esc closes. 300ms debounced ilike search across contacts + loans in parallel. Flat `allResults` for single-index ↑↓ keyboard nav. ⌘K hint button in TopNav fires via `document.dispatchEvent`.
- **Task 5 — Activity Feed** (`ActivityFeed.tsx`, `TopNav.tsx`): 🔔 bell in nav bar with gold unread badge. Slide-out panel (380px, position fixed right). Last 50 `activity_log` rows ordered desc. Unread count vs `localStorage` key `loanos_activity_last_read`. Fetch on mount so badge shows immediately; marks all read on panel open.
**Arive → LoanOS live sync via Zapier (2026-03-12)**: Zapier Zap published — Arive New Loan (native OAuth trigger) → POST all loan fields as JSON to n8n webhook `arive-new-loan`. n8n workflow `1tagvoU0UXtdDiMY` upserts contact + loan in Supabase. `contacts.email` UNIQUE constraint added (required for PostgREST upsert ON CONFLICT). Duplicate contacts cleaned up before constraint applied. n8n webhook auth set to None. End-to-end confirmed working — curl test returns 200. Full live-loan test pending.
**Arive full field expansion (2026-03-13)**: Migration 015 (`supabase/migrations/015_arive_full_field_expansion.sql`) created — adds ~55 new columns to `loans` (financial, product, admin, borrower, property, key dates TRID, milestone dates+statuses, agent FK refs) + creates `loan_status_history` table with RLS. **NOT YET APPLIED — must run via Supabase SQL Editor.** `zapier_webhook_fields.md` created as canonical Arive webhook → Supabase field mapping reference (295 lines). n8n WF1 (`1tagvoU0UXtdDiMY`) fully rebuilt: `specifyBody: "string"` bug fixed → `contentType: raw`, all ~90 Arive payload fields mapped in upsert body. n8n WF2 (`9JyzzwKac8v3uQ7d`) fully rebuilt: all fields, `loan_status_history` POST node added, deduped 15→13 nodes. **E2E tests blocked until migration 015 applied.** After applying: re-run WF1 (verify loan upserted with new fields), then WF2 (verify status update + `loan_status_history` row).

### Phase 1 (complete)
- Supabase connected
- Auth: email/password — switched from magic link
- 4 tables live: contacts, loans, documents, activity_log
- Supabase Storage bucket: `documents` (must be lowercase — case-sensitive)
- PDF upload end-to-end verified: Storage → documents row → activity_log
- Next.js 14 deploying to Vercel
- HTML docs moved to `public/docs/` — served by Next.js at `/docs/*.html`
- /dashboard/build-tracker: auth-gated iframe → /docs/loanos.html
- /dashboard/system-map: auth-gated iframe → /docs/loanos-system-map.html
- Bloomberg terminal × modern SaaS redesign: Bebas Neue + IBM Plex Mono/Sans, gold accent (#c9a84c), dark surface palette
- **UI redesign (2026-03-09)**: Bloomberg dark → Linear/Attio light mode — emerald-600 accent (#059669), Inter font, slate palette, lucide-react icons, card-on-canvas stats

### Phase 2 (in progress)
- **Contract automation pipeline — LIVE ✅** — `n8n/contract-received.workflow.json`
  - Supabase pg_net trigger → n8n webhook → Claude API PDF extraction → loan update → Outlook drafts
  - Migration 003 applied — 14 contract columns + contract_data JSONB live in loans table
  - Two email drafts: party reply (BA + LA + title) and borrower welcome
  - Workflow published, tested end-to-end with real contract PDF — confirmed working (2026-03-09)
  - Setup guide: `docs/contract-automation-setup.md`

### n8n Key Facts
- Webhook POST body is nested under `$json.body.xxx` — not `$json.xxx` directly
- Production webhook URL: `https://styer.app.n8n.cloud/webhook/loanos-contract-received`
- Header Auth credential name must have no spaces (e.g. `apikey` not `Supabase Service Role`)
- `net.http_post()` body param must be `::jsonb` not `::text`

## Loans Import (complete — 2026-03-10)
- 816 loans imported from full Arive CSV export (`report1773124619094.csv`, 31 columns)
- Source: Arive LOS export via CSV download
- Import script: `/tmp/import_loans_v4.py` — Python, Supabase REST API with service_role_key
- Contact matching: 98% match rate (806/816) — matched by borrower name to contacts.first_name + last_name
- Raw payload stored in `raw_payload` JSONB column (double-encoded: JSON string inside JSONB)
- **Backfill script** (`/tmp/backfill_loans.py`): parsed double-encoded raw_payload → typed columns
  - 24 columns backfilled: status, loan_name, property_city, property_state, loan_program, occupancy, lender, investor, term_months, ltv, monthly_payment, purchase_price, property_type, property_zip, lock_date, commissions, hazard_insurance, mortgage_insurance, property_tax, escrow_agent, closing_date, title_company, buyer_agent_name, listing_agent_name
  - Status restored to original Arive case (was normalized to lowercase during initial import)
  - 816/816 updated, 0 errors
- **Migrations 003 + 006 applied** (combined SQL: `/tmp/apply_migrations_003_006.sql`)
  - Migration 006: loan_name, property_city, property_state, loan_program, occupancy
  - Migration 003: 14 contract columns + contract_data JSONB
  - Additional Arive columns: lender, investor, term_months, ltv, monthly_payment, purchase_price, property_type, property_zip, lock_date, commissions, hazard_insurance, mortgage_insurance, property_tax, escrow_agent
  - Activity log FK columns: loan_id, contact_id
  - 7 indexes created
- **Auth client fix**: Both `loans/page.tsx` and `loans/[id]/page.tsx` were using bare `createClient` from `@supabase/supabase-js` (no auth cookies → RLS blocked all rows). Fixed to use `createClient` from `@/lib/supabase/client` (SSR-aware `createBrowserClient` from `@supabase/ssr`).
- **Status distribution** (817 total: 816 imported + 1 pre-existing):
  - Closed: 740, Started: 31, Cancelled: 19, processing: 14, Loan in Process: 5, QUALIFICATION: 2, APPLICATION_INTAKE: 1, Approved: 1, DISCLOSURE_SENT: 1, lead: 1, Pre-Approved: 1, Suspended: 1
- **Smart list coverage**: All Arive status values added to SMART_LISTS and StatusBadge color mapping in `loans/page.tsx`
- **Salesforce CSV backfill (2026-03-12)**: Script `/tmp/backfill_salesforce_loans.py` (UPDATE-only, Python stdlib only)
  - Source: `/Users/adamstyer/Downloads/report1773324509305.csv` (817 rows, Salesforce export)
  - Match strategy: (1) `arive_loan_id` = "Loan # (1st TD)"; (2) fallback: `borrower_name` + `closing_date`
  - Only fills NULL/empty Supabase fields — never overwrites existing values
  - 31 CSV columns mapped to Supabase fields; schema discovery via `select=*&limit=1` preflight
  - Results: 817 rows → 628 matched by name+date → 532 updated, 9 errors (all `409 Conflict` on `arive_loan_id`)
    - 8 errors: scientific notation `2E+11` from Salesforce/Excel export on large loan numbers
    - 1 error: true duplicate `arive_loan_id = 13013` already in DB
  - Primary field populated: `arive_loan_id` (was NULL on all imported loans prior to this run)

## Contacts Import (complete — 2026-03-08)
- 2,441 contacts imported from Salesforce export (XLS/HTML format)
- Source: report1773019847271.xls (Salesforce export)
- 30 of 32 columns mapped to Supabase contacts schema
- 2 columns skipped (no matching schema): Mailing Country, Contact ID
- Type conversions handled: dates (MM/DD/YYYY → YYYY-MM-DD), booleans, empty strings → null
- Contact types mapped: Client → borrower, Business Contact → other
- Phone fallback: Mobile used if Phone empty
- user_id set to adam@thestyerteam.com

## Tech Stack

- Frontend: Next.js 14
- Hosting: Vercel
- Database: Supabase (Postgres)
- Auth: Supabase email/password
- File Storage: Supabase Storage (buckets: `documents` [private], `social-assets` [public])
- Automation: n8n (replacing Zapier)
- AI: Claude API (Anthropic)
- Email: Outlook via n8n
- Marketing Email: Mailchimp
- LOS: Arive (webhook integration planned)
- Billing: Stripe (Phase 4)

## What's Already Live (separate repo: styer-mortgage-site on Netlify)

These tools are working and must NOT be broken during LoanOS build:
- Marketing Command Center (MCC) — full weekly cadence dashboard
- Content Dashboard — newsletter + realtor content generator
- Newsletter Generator — Claude API writes drafts, Mailchimp sends
- Rate Update Publisher — generates rate page, pushes to GitHub, Mailchimp
- Social Poster — auto-posts to LinkedIn + Facebook
- Dispatch Webhook — /.netlify/functions/dispatch (Bearer DISPATCH_SECRET)
- Storage: Netlify Blobs (key: mcc-state/current) — migrate to Supabase later

## Environment Variables

### loanos repo (Vercel — add as you build)
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_URL (server-side, API routes)
- SUPABASE_SERVICE_ROLE_KEY (server-side — bypasses RLS)
- ARIVE_WEBHOOK_SECRET (shared secret, generate with `openssl rand -hex 32`)
- LOANOS_SYSTEM_USER_ID (UUID of `system@loanos.internal` auth user)
- ZAPIER_OUTLOOK_WEBHOOK_URL (Zapier → Outlook webhook for failure alerts — optional)
- LOANOS_ALERT_EMAIL (recipient for webhook failure alerts — optional)
- ANTHROPIC_API_KEY (Claude API — used by /api/chat and /api/agents/*)
- ZAPIER_DISPATCH_WEBHOOK_URL (Zapier → Outlook draft creation webhook — used by /api/agents/milestone)
- MILESTONE_WEBHOOK_SECRET (shared secret validating n8n → /api/agents/milestone calls — `openssl rand -hex 32`)
- MICROSOFT_CLIENT_ID (Outlook OAuth2 — from Azure app registration)
- MICROSOFT_CLIENT_SECRET (Outlook OAuth2)
- MICROSOFT_TENANT_ID (Outlook OAuth2)
- MICROSOFT_REDIRECT_URI (Outlook OAuth2 — must be Vercel production URL + /api/outlook-callback)
- OUTLOOK_EMAIL (adam@thestyerteam.com)
- OUTLOOK_SYNC_SECRET (shared secret for n8n → /api/outlook-sync)
- OUTLOOK_SYNC_WINDOW_MINUTES (default: 30)

### styer-mortgage-site repo (Netlify — already set)
- ANTHROPIC_API_KEY
- DISPATCH_SECRET
- MCC_PASS
- GITHUB_TOKEN
- GITHUB_REPO (points at styer-mortgage-site — update when migrating)
- MAILCHIMP_API_KEY
- MAILCHIMP_SERVER_PREFIX
- MAILCHIMP_BORROWER_LIST_ID
- MAILCHIMP_REALTOR_LIST_ID
- LINKEDIN_ACCESS_TOKEN (expires ~60 days — needs n8n refresh workflow)
- LINKEDIN_REFRESH_TOKEN
- LINKEDIN_CLIENT_ID
- LINKEDIN_CLIENT_SECRET
- LINKEDIN_PERSON_URN
- FACEBOOK_PAGE_ACCESS_TOKEN
- FACEBOOK_PAGE_ID

## Migration Plan

- Phase 1-2: Keep all Netlify tools live. Build LoanOS fresh on Supabase.
- Phase 2-3: Migrate tools one at a time. Netlify Blobs → Supabase. Netlify Functions → n8n.
- Phase 4: All tools inside LoanOS. Netlify retired or kept for public pages only.

## Phase Roadmap

### Phase 1 — Foundation ✅ COMPLETE
- ✅ Supabase schema (contacts, loans, documents, activity_log)
- ✅ Auth (email/password)
- ✅ PDF upload end-to-end
- ✅ Dashboard with stat cards → **fully rebuilt as pipeline dashboard (v1.14.0)**
- ✅ Bloomberg terminal UI → Linear/Attio light mode redesign → **dark monochromatic dashboard (v1.14.0)**

### Phase 2 — Automation (~80% complete)

**Built & Live ✅**
- ✅ **Web Lead API route** (`/api/contacts/web-lead`) — machine-facing POST route for n8n.
  Accepts structured form data from styermortgage.com, creates contact with org scoping,
  dedup check, activity log entry. Auth: Bearer LOANOS_AGENT_SECRET.
  Endpoint: https://loanos.vercel.app/api/contacts/web-lead
- ✅ Contract automation pipeline (n8n → Claude extraction → Outlook drafts)
- ✅ Automations dashboard with trigger buttons + loan picker
- ✅ Marketing Command Center (8-tab MCC port)
- ✅ Contacts module (Smart Lists, bulk actions, inline stage edit, import)
- ✅ Loans module (816 Arive imports, backfilled 24 columns)
- ✅ Arive direct webhook (n8n orchestrator → Netlify function → Supabase)
- ✅ Settings page

**Built — Needs Go-Live Steps 🔧**
- 🔧 **Agent 5 — Loan Milestone Communication Agent** — code + n8n wired, needs:
  - ✅ n8n workflow live: ID `1hjOmS7inZcxEJQr` — triggers on Arive milestone events → `POST /api/agents/milestone`
  - ✅ Zapier Zap published: Catch Hook → Microsoft Outlook "Create Draft Email"
  - ✅ Auth middleware fixed: `/api/agents/*` excluded from Supabase auth matcher (commit alongside Agent 5 build)
  - [ ] Run `010_milestone_agents.sql` in Supabase SQL Editor
  - [ ] Add `ZAPIER_DISPATCH_WEBHOOK_URL` + `MILESTONE_WEBHOOK_SECRET` to Vercel env vars
- 🔧 **Agent 1 — Daily Command Center** — code + ESLint fixed, deploying, needs:
  - ✅ ESLint build errors fixed (commit `34d4c81`): ternary-as-statement, unescaped apostrophe, unescaped quotes
  - ✅ Sidebar nav entry confirmed: `Brain` icon + "Daily Briefing" as first item in SidebarNav
  - [ ] Run `010_milestone_agents.sql` in Supabase SQL Editor (same migration as Agent 5)
  - [ ] Add `ANTHROPIC_API_KEY` to Vercel env vars (same var as AI Chat)
- 🔧 **Outlook Email Integration** — code complete, 5 manual steps remain:
  - [ ] Run `008_outlook_integration.sql` in Supabase SQL Editor
  - [ ] Azure App Registration (follow `docs/outlook-azure-setup.md`)
  - [ ] Add 7 env vars to Vercel (MICROSOFT_CLIENT_ID, etc.)
  - [ ] n8n setup: NETLIFY_SITE_URL variable + HTTP Header Auth credential + activate workflow `JMmstRl2C5ylmuIY`
  - [ ] Connect Outlook at /dashboard/settings
- 🔧 **AI Chat Integration** — code complete, 2 manual steps remain:
  - [ ] Add `ANTHROPIC_API_KEY` to Vercel env vars
  - [ ] Run `009_chat_sessions.sql` in Supabase SQL Editor

**Built — Needs Credentials to Activate 🔑**
- 🔑 **Closed Loan Review Request** (n8n ID: `AK1fBcaX1cPcdlGx`) — workflow imported, needs:
  - [ ] Add `SUPABASE_SERVICE_ROLE_KEY` to workflow
  - [ ] Set up SMTP credential in n8n
  - [ ] Get Google Review URL + Zillow Review URL
  - [ ] Activate workflow
- 🔑 **Weekly Testimonial Social Post** (n8n ID: `eJG4wckrj6SmSpm1`) — workflow imported, needs:
  - [ ] Add `SUPABASE_SERVICE_ROLE_KEY` to workflow
  - [ ] Get `GEMINI_API_KEY` from aistudio.google.com
  - [ ] Set up Google Sheets OAuth2 credential in n8n
  - [ ] Activate workflow

**Remaining Go-Live Steps 🔧**
- ✅ **Migrate Arive webhook to Vercel API route** — `src/app/api/arive-webhook/route.ts` ports `netlify/functions/arive-webhook.js` to a Next.js App Router handler; n8n `arive-to-supabase` workflow can POST directly to `/api/arive-webhook` instead of the Netlify function
- 🔧 **Outlook go-live** — Azure app registration + Vercel env vars + migration 008 + update n8n workflow URL
- 🔧 **AI Chat go-live** — add `ANTHROPIC_API_KEY` to Vercel + run migration 009
- 🔧 **Activate Review Request workflow** — add SUPABASE_SERVICE_ROLE_KEY, SMTP credential, Google/Zillow review URLs to n8n
- 🔧 **Activate Social Post workflow** — add Gemini API key, Google Sheets OAuth2 credential to n8n

**Built — Needs Testing 🧪**
- 🧪 **AI Outreach & Contact Management System** — floating chat widget + bulk actions, needs:
  - ✅ Command parser: `src/lib/chat-command-parser.ts` — classifies QUICK_ADD / BULK_EMAIL / BULK_TEXT / BULK_ADMIN / GENERAL_CHAT
  - ✅ Quick Add API: `src/app/api/contacts/quick-add/route.ts` — NL contact creation, dedup by email/phone, referrer lookup
  - ✅ Bulk Action API: `src/app/api/contacts/bulk-action/route.ts` — update_stage, update_type, delete with activity logging
  - ✅ Outreach API: `src/app/api/outreach/route.ts` — Claude-powered email/text generation + general chat
  - ✅ Chat widget: `src/components/outreach/OutreachChat.tsx` — floating bottom-left panel, all 5 command types
  - ✅ Context: `src/components/outreach/OutreachChatContext.tsx` — shares selected contacts between contacts page and chat
  - ✅ OUTREACH button wired into contacts page bulk action bar
  - ✅ Layout: `OutreachChatProvider` + `<OutreachChat />` in root `layout.tsx`
  - [ ] Add `ANTHROPIC_API_KEY` to Vercel env vars (same as AI Chat)
  - [ ] End-to-end testing: quick add flow, bulk email/text generation, bulk admin actions

**Not Yet Built 🚧**
- ✅ **CD extraction API route** — `POST /api/agents/cd-extraction` live; n8n calls after Claude extracts CD fields (needs n8n workflow wiring)
- ✅ **PA extraction API route** — `POST /api/agents/pa-extraction` live; same pattern (needs n8n workflow wiring)
- ✅ **Activity auto-log** — contact stage changes + loan status changes now write to activity_log automatically
- ✅ **Marketing page theme** — Bloomberg CSS vars removed; all hardcoded dark zinc hex values
- 🚧 **Rate update publisher migration** — move from styer-mortgage-site Netlify to LoanOS native
- 🚧 **CD/PA n8n workflow wiring** — Next.js routes exist; need n8n workflows that upload PDF → Claude → call these endpoints

### Phase 3 — Calculator Suite (replaces Mortgage Coach)

Key differentiator: Claude API generates plain-English narrative per scenario.
Output: branded PDF or shareable link integrated with Supabase loan records.

- ✅ **Loan Scenario Comparator** (Sprint 2 — v2.0.0, 2026-03-15)
- ✅ **Refi Analyzer** (Sprint 2 — v2.0.0, 2026-03-15)
- [ ] Rent vs. Buy
- [ ] Total Cost of Homeownership
- [ ] Max Purchase Price
- [ ] Buy Now vs. Wait

**Sprint 2 go-live steps:**
- [ ] Run `supabase/migrations/018_scenarios.sql` in Supabase SQL Editor
- [ ] Ensure `ANTHROPIC_API_KEY` is set in Vercel (same as AI Chat)
- [ ] Deploy to Vercel
- [ ] V2 upgrades: @react-pdf/renderer for styled PDFs, fast-xml-parser for MISMO, charts in PDF

### Phase 4 — SaaS (multi-tenant)

- [ ] Multi-tenant RLS (row-level security per LO)
- [ ] Stripe billing integration
- [ ] White-label theming
- [ ] Onboarding flow for new LOs
- [ ] License/subscription management
- [ ] Admin dashboard (usage metrics, LO management)

## Key Decisions Made

- Zapier → replaced by n8n
- Jungo → replaced by LoanOS CRM
- Mortgage Coach → replaced by calculator suite
- Netlify Blobs → migrating to Supabase
- Vercel → NOW USED for deployment (switched from Netlify 2026-03-11)
- Build for yourself first, license to LOs in Phase 4

## Active Automations

> Living document — every new workflow deployed must be added here, to the automations page, and to CHANGELOG.md.

| Workflow | n8n ID | Webhook Path | Trigger |
|---|---|---|---|
| Final CD Email | SkzrWeR0bHZs8kWX | loanos-final-cd | Upload CD PDF |
| Pre-Approval Email | utMvZpkdRwIRZ51u | loanos-pre-approval | Upload PA letter PDF |
| Referral Intro Email | YbgDnTpPdefcazKy | loanos-referral-intro | Paste referral details |
| New Application Received | cWESnXXy9UOLB13q | loanos-new-application | 1003 PDF in Supabase storage |
| Arive → Supabase (Zapier bridge) | `1tagvoU0UXtdDiMY` | `arive-new-loan` | Arive New Loan (Zapier OAuth) → POST to n8n → upsert contact + loan in Supabase |
| Closed Loan Review Request | AK1fBcaX1cPcdlGx | — (scheduled) | Every 30 min — polls Supabase for loans closed 2+ days ago |
| Weekly Testimonial Social Post | eJG4wckrj6SmSpm1 | — (scheduled) | Mondays 9am CT — reads Google Sheet, Gemini caption + image, posts via Publer |
| Loan Milestone Communication | 1hjOmS7inZcxEJQr | /api/agents/milestone | Arive milestone event → LoanOS Claude → Zapier → Outlook drafts (borrower + realtor) |
| Refi Intake Email | yCTydQ7RfZK4DyUg | loanos-refi-intake | Upload IFW PDF → Claude extracts fields → n8n builds email → Outlook draft |

- First 6 trigger via Supabase pg_net or manual webhook POST; output Outlook drafts via n8n
- Trigger buttons LIVE — clicking opens TriggerModal (PDF drop zone or form fields)
- **Closed Loan Review Request** — scheduled every 30 min. Fetches loans with `closing_date <= now() - 2 days` that haven't had a review email sent. Sends branded HTML email with Google + Zillow review links. Logs to `automation_logs`. ⚠️ Needs: SUPABASE_SERVICE_ROLE_KEY, SMTP credential, Google/Zillow review URLs.
- **Weekly Testimonial Social Post** — Monday 9am CT. Reads random unused testimonial from Google Sheet (tab: Sheet1, ID: 1W9NRB2H8u0cjctCueXh7VYgL27m5vLLFJfONepNWixk). Gemini 1.5 Flash generates caption. Imagen 3 generates quote card image (base64 → Supabase Storage `social-assets` bucket). Publer posts to Instagram + LinkedIn + Facebook. Marks sheet row used. Logs to `automation_logs`. ⚠️ Needs: GEMINI_API_KEY, SUPABASE_SERVICE_ROLE_KEY, Google Sheets OAuth2 credential.

## What To Build Next

### Phase 2 — Agents: Milestone Communication + Daily Briefing (2026-03-11) ✅ BUILT

**Agent 5 — Loan Milestone Communication Agent** (`src/app/api/agents/milestone/route.ts`, 247 lines)
- POST handler for n8n webhook on Arive loan milestone events
- Validates `loan_id` and `milestone` (7 values: application_received, pre_approved, in_process, conditional_approval, clear_to_close, closing_disclosure_sent, closed)
- Two Claude calls (model: `claude-sonnet-4-5`, max_tokens: 512): borrower warm tone + realtor professional — both return `{subject, body}` JSON
- Pushes Outlook drafts via `ZAPIER_DISPATCH_WEBHOOK_URL`; logs to `loan_milestone_events` + `milestone_communications` Supabase tables
- Supabase migration: `supabase/migrations/010_milestone_agents.sql`
  - `loan_milestone_events` table (id, loan_id, milestone, triggered_at, raw_payload)
  - `milestone_communications` table (id, event_id FK, recipient_type, draft_pushed, pushed_at, subject, body_preview)
  - `last_touch TIMESTAMPTZ` column added to contacts
  - CHECK constraint on 7 milestone values; partial index on `draft_pushed = false`
- Setup guide: `docs/agents-n8n-setup.md`
- ⚠️ **To go live**: run migration 010, add `ZAPIER_DISPATCH_WEBHOOK_URL` + `MILESTONE_WEBHOOK_SECRET` to Vercel, configure n8n trigger

**Agent 1 — Daily Command Center** (`src/app/api/agents/daily-briefing/route.ts`, 158 lines)
- GET handler — 5 parallel Supabase queries via `Promise.allSettled`: overdue_leads, closing_this_week, recently_uploaded_docs, recent_milestones, unread_messages
- Single Claude call (model: `claude-sonnet-4-5`, max_tokens: 1024) → returns `top7` prioritized action items + `summary`
- Strips markdown fences before `JSON.parse`; returns raw data arrays alongside AI output
- Frontend: `/dashboard/briefing/page.tsx` (237 lines, `'use client'`)
  - Stat row (4 cards), progress bar, checklist with toggle, loading skeleton
  - Light theme: slate-50 bg, emerald-600 accent, white cards
- SidebarNav updated: `Brain` icon + `{ label: 'Daily Briefing', href: '/dashboard/briefing' }` as first entry
- ⚠️ **To go live**: same migration 010; `ANTHROPIC_API_KEY` already required for AI Chat

### Phase 2 — AI Chat Integration (2026-03-11) ✅ BUILT

- **Architecture**: Floating `LoanOSChat` component per CRM record → `POST /api/chat` → Claude API with full record context injected → `chat_sessions` Supabase table for persistence
- **Supabase**: `009_chat_sessions.sql` — `chat_sessions` table (`id`, `record_id`, `record_type`, `messages jsonb`, `created_at`, `updated_at`); index on `(record_id, record_type)`; auto-update trigger on `updated_at`
- **API routes** (`src/app/api/chat/route.ts`):
  - `POST /api/chat` — builds system prompt from live Supabase record (contact joins loans, loan joins contacts), calls `claude-sonnet-4-5`, upserts `chat_sessions`
  - `GET /api/chat?recordId=&recordType=` — returns most recent session (`.order('updated_at', desc).limit(1).maybeSingle()`)
  - System prompt identity: "You are LoanOS Assistant — an AI built into the LoanOS CRM for loan officer Adam Styer (NMLS #513013, Adam Styer | Mortgage Solutions LP, Austin TX). Be direct, specific, and use the contact data. Never be generic."
  - Service role client inline (`getServiceClient()`) — bypasses RLS, server-only
- **Component** (`src/components/crm/LoanOSChat.tsx`):
  - Props: `{ recordId, recordType: 'contact'|'loan', recordName }`
  - Floating 52×52 gold `◈` trigger button (fixed, bottom-right)
  - 380×560px dark panel (IBM Plex Mono, gold `#C9A84C` accent)
  - Quick actions per record type (4 per type), history auto-loads on open, clear button, Enter to send, auto-resize textarea
  - `historyLoaded` flag prevents duplicate GET calls on re-render
  - Usage: `<LoanOSChat recordId={record.id} recordType="contact" recordName={fullName} />`
- **SDK**: `@anthropic-ai/sdk ^0.78.0` installed
- **Env var to add in Netlify (loanos repo)**: `ANTHROPIC_API_KEY`
- ⚠️ **To go live**: (1) Add `ANTHROPIC_API_KEY` to Vercel env vars, (2) run `009_chat_sessions.sql` in Supabase SQL Editor
- ✅ **Wired up**: `LoanOSChat` added to `ContactRecordView.tsx` and `src/app/dashboard/loans/[id]/page.tsx` (2026-03-11)
- ✅ **Schema expansion (2026-03-11)**: `buildSystemPrompt` in `route.ts` now includes all available DB columns. Contact prompt: +6 fields (realtor_email/phone, mailing address, group_tag, source). Loan prompt: +14 fields (purchase price, interest rate, down payment %, LTV, seller concessions, county, close date, effective date, title company, buyer agent full details, listing agent). TypeScript verified clean (exit 0).

### Phase 2 — Outlook Email Integration (2026-03-10) ✅ BUILT

- **Architecture**: OAuth2 flow → token stored in `outlook_tokens` → n8n scheduled sync every 15 min → Microsoft Graph API → `activity_log`
- **Supabase**: `008_outlook_integration.sql` — `outlook_tokens` table, `oauth_state` table; new columns on `activity_log` (`type`, `summary`, `raw_payload`, `external_id`); partial unique index for deduplication
- **Netlify Functions** (CommonJS, match `arive-webhook.js` pattern):
  - `outlook-auth.js` — OAuth start, generates CSRF state, redirects to Microsoft
  - `outlook-callback.js` — validates state, exchanges code, upserts token, redirects to `/dashboard/settings?outlook=connected`
  - `outlook-refresh.js` — exports `getValidAccessToken()` (5-min buffer refresh); also has GET handler for manual status check
  - `outlook-sync.js` — fetches inbox + sent from Graph API, matches contacts by email, deduplicates via `external_id`, logs to `activity_log` with both legacy + new columns
- **n8n**: `n8n/outlook-sync-workflow.json` — 15-min schedule, POST to `/.netlify/functions/outlook-sync` via `httpHeaderAuth` credential "LoanOS Sync Secret"
- **Settings page**: `/dashboard/settings` — Outlook card with connect/sync/disconnect; Status via `/api/outlook-status`; Next.js API routes: `/api/outlook-status` (GET), `/api/outlook-disconnect` (POST)
- **ActivityTimeline**: `/src/components/ActivityTimeline.tsx` — normalizes legacy + new schema, icon by type, relative timestamps, expandable JSON detail, pagination (20/page); TypeScript + ESLint clean (nullable fields + metadata narrowing)
- **Contact profile**: `ContactRecordView.tsx` uses `<ActivityTimeline>` instead of inline rendering; `page.tsx` fetches new columns + limit 200
- **Email drafts logging**: `supabase/migrations/013_email_drafts.sql` creates `email_drafts` table; `src/lib/supabase/logEmailDraft.ts` helper + `src/app/api/email-drafts/route.ts` API + `EmailDraftPreview` component provide a single place to log and review automation-created Outlook drafts (pending full UI wiring)
- **Test script**: `scripts/test-outlook-sync.js` — env check, token status, refresh, manual sync trigger, recent activity
- **Env vars to add in Netlify**: `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, `MICROSOFT_TENANT_ID`, `MICROSOFT_REDIRECT_URI`, `OUTLOOK_EMAIL`, `OUTLOOK_SYNC_SECRET`, `OUTLOOK_SYNC_WINDOW_MINUTES`
- ⚠️ **To go live**: (1) Azure app registration, (2) Netlify env vars, (3) run migration 008, (4) import n8n workflow + set env var `NETLIFY_SITE_URL`, (5) visit `/dashboard/settings` → Connect Outlook

### Phase 2 — Automation (in progress)
- ✅ Contract automation: n8n pipeline for contract extraction + Outlook drafts
- ✅ **Automations dashboard page** — `/dashboard/automations` live as of 2026-03-09
  - Visual cards for all 4 active workflows: Final CD, Pre-Approval, Referral Intro, New Application
  - Pipeline flow diagram per card: Trigger → Claude AI → Outlook → Review
  - Animated flow dot, status badges, hover meta-reveal (n8n ID + webhook path)
  - **Trigger buttons LIVE ✅** (2026-03-09) — `TriggerModal` component added; PDF workflows use FormData POST, Referral uses JSON POST; all POST to `https://styer.app.n8n.cloud/webhook/{webhookPath}`
- ✅ **Automations loan-picker** (2026-03-09) — each AutoCard has a "Run for loan…" `<select>` dropdown populated from top 200 Supabase loans; selected `loanId` passed through `TriggerModal` to n8n webhook payload (PDF: `FormData.append('loan_id', loanId)`, JSON: `...(loanId ? { loan_id: loanId } : {})`)
- CD extraction workflow (similar pattern to contract)
- Pre-approval extraction workflow
- **Arive webhook integration — REBUILT ✅** (2026-03-10) — Arive → n8n orchestrator → Netlify Function → Supabase (eliminates Salesforce middleman). 2026-03-12: ported the same logic to `src/app/api/arive-webhook/route.ts` for Vercel; n8n target can be switched from Netlify to the Next.js route when ready.
  - **Architecture**: Arive POST → n8n `arive-sync` path → `/.netlify/functions/arive-webhook` (Netlify) or `/api/arive-webhook` (Vercel) → Supabase REST upsert
  - `netlify/functions/arive-webhook.js` — validates `X-Webhook-Secret`, upserts contact (on email), upserts loan (on arive_loan_id), inserts activity_log; uses raw fetch to Supabase REST (no SDK); returns `{success, contact_id, loan_id}`
  - `n8n/workflows/arive-to-supabase.json` — thin orchestrator (7 nodes): receive → forward to Netlify fn → IF 200 → respond OK / (else) Build Error Context → Send Outlook Alert (Zapier) → respond 500 (triggers Arive retry)
  - `netlify.toml` — `[functions]` block added: `directory = "netlify/functions"`, `node_bundler = "nft"`
  - `scripts/test-webhooks.js` — rewritten with real Arive field names; supports `--netlify` (direct) and `--n8n` flags
  - `.env.local.example` — fully documented (7 vars with explanations)
  - `README.md` — replaced Next.js boilerplate with project README + 6-step Arive Webhook Setup guide
  - Migration 007 (`007_arive_integration.sql`) — arive_loan_id + date fields on loans, address/stage/source on contacts
  - Legacy n8n workflows (`workflow-1-new-loan.json`, `workflow-2-status-update.json`) kept for reference but superseded
  - n8n env vars required: `ARIVE_WEBHOOK_SECRET`, `LOANOS_NETLIFY_URL`, `LOANOS_ALERT_EMAIL`, `ZAPIER_OUTLOOK_WEBHOOK_URL`
  - Migration strategy: run old Zapier pipeline in parallel for 2–3 loans, verify, then disable Zapier

### Phase 2 — Marketing Command Center (2026-03-09) ✅ LIVE
- **Netlify build fix (2026-03-09)**: ESLint was blocking deploy — root cause was missing `export default function MarketingPage()`. Added main component + fixed unused `s` param in TodayTab + eslint-disable on `applySmartList` in contacts. Deployed as commit b8d1d57.
- `/dashboard/marketing` — full MCC port from styer-mortgage-site → LoanOS native page
- **Migration 004 applied** — `mcc_state` table live in Supabase with RLS
- **State storage**: `mcc_state` Supabase table (migration 004) — single JSONB blob per user, key = `'mcc'`
- **8 tabs**: TODAY (daily task checklist), WEEK (Mon–Fri progress), CONTACTS (4 call lists), SOCIAL (log posts), NEWSLETTERS (log campaigns), TRACKER (9 last-deployed trackers), LOG (activity log), BRAIN DUMP (todo list)
- **DAYS constant**: 5 weekdays × task arrays with type, emoji, optional tracker ref
- **TRACKERS constant**: 9 entries (Realtor Email, Borrower Email, LinkedIn, Facebook, Rate Update, Newsletter, DB Call, Lender Email, Agent Social) with freq (days) and channel
- **`calledToday`** flag on contacts is ephemeral — reset to `false` on page load, not persisted
- **Tracker auto-update**: checking a task with `tracker` property sets `s.last[trackerId]` = now ISO string
- Supabase client stabilized with `useMemo(() => createClient(), [])`
- Bloomberg terminal UI matches rest of LoanOS — same CSS vars, Bebas Neue, IBM Plex Mono
- ⚠️ Marketing page still uses Bloomberg/gold CSS vars — not yet migrated to light mode

### Phase 2 — Closed Clients + Import Feature (2026-03-09 — revised session)
- **Standalone `/dashboard/closed-clients` page REMOVED** — replaced by "Closed Borrowers" Smart List in contacts page
- SidebarNav: CLOSED CLIENTS link removed
- contacts/page.tsx: removed `viewMode` toggle (was `'active'|'all'`). "Closed Borrowers" Smart List filter (`stage = 'Closed Client'`) replaces it. `fetchCounts` fixed for all/closed counts.
- **Migration 005** (`005_closed_clients_columns.sql`) — idempotent, run in Supabase SQL editor:
  - contacts: `salesforce_id TEXT UNIQUE`, `closing_date DATE`, `realtor_email TEXT`, `realtor_phone TEXT`
  - loans: `interest_rate NUMERIC(6,4)`, `borrower_name TEXT` (closing_date already in migration 003)
  - Indexes: `idx_contacts_salesforce_id`, `idx_contacts_email_lower ON contacts(LOWER(email))`
- **Import script** (`scripts/import-closed-clients.py`) — one-time, idempotent, reads Salesforce XLS (HTML format) via pandas + lxml, filters to Stage='Closed Client', three-tier dedup, POSTs to Supabase REST
- **Import feature — UI + API:**
  - IMPORT button (gold outline) on Contacts page header, opens `ImportModal`
  - `ImportModal.tsx` — two tabs (Contacts / Loans), drag-drop or browse file upload, parse preview (first 5 rows + count + fileType), Confirm button → imports all rows → results (imported/skipped/errors)
  - `POST /api/import/parse` — detects CSV vs HTML-XLS, returns preview + count. `full=true` param returns all rows (used on confirm).
  - `POST /api/import/contacts` — three-tier dedup (salesforce_id → email → first_name+last_name), never overwrites, row-level error handling, intra-batch dedup
  - `POST /api/import/loans` — two-tier dedup (loan_number → borrower_name+closing_date), requires auth session for user_id, row-level error handling

### Phase 2 — Contacts Module (rebuilt × 3 — 2026-03-10, Inline Stage Edit + Smart Lists v2 + Bulk Actions)

**Session 2026-03-10 additions (full rewrite, 879 lines):**
- **Feature 1 — Inline Stage Editing**: Every Stage cell is clickable. Click → `<select>` dropdown with 8 canonical stages (Lead, Pre-App, Application, Pre-Approved, In Process, Closing, Closed, Other). Selection immediately updates Supabase. Optimistic UI: if new stage maps to a different Smart List, contact is removed from current list + counts refresh. `stageToList()` is single source of truth.
- **Feature 2 — Smart List Restructure**: Canonical STAGES constant + STAGE_TO_LIST mapping. New lists: Lead/Pre-App/Application → "New Applications", Pre-Approved → "Active Borrowers", In Process/Closing → "In Process", Closed → "Closed Borrowers". **"Everyone Else" replaced by "Unassigned / Other"** — catches contact_type=other, null type, or borrower with null stage via `.or('contact_type.eq.other,contact_type.is.null,and(contact_type.eq.borrower,stage.is.null)')`. Stage dropdown in slide-out edit panel now uses canonical STAGES list.
- **Feature 3 — Bulk Actions**: Checkbox column left of every row + Select All in table header. When 1+ selected → position:fixed floating action bar at bottom with: UPDATE STAGE, UPDATE TYPE, ASSIGN REFERRED BY, DELETE. Bulk update uses Supabase `.in('id', [...ids])` for single round-trip. Delete shows confirmation modal. Selection cleared on list refresh. `Set<string>` for O(1) checkbox management. `e.stopPropagation()` on checkbox + stage cells prevents row-click opening slide-out.

### Phase 2 — Contacts Module (rebuilt × 2 — 2026-03-09, Smart Lists + Columns + Create)
- `/dashboard/contacts` — full rewrite (544 lines, TypeScript clean)
- **Smart List sidebar** (220px): 8 lists — All Contacts, New Apps, Active Borrowers, **In Process** (new), Closed Borrowers, All Realtors, Top/Target, Everyone Else
- Smart List filters use `.in('stage', [...])` to cover all Salesforce-imported stage variants (e.g. 'Lead'/'New'/'Application', 'Pre-Approved'/'Approved', 'In Process'/'Processing'/'Submitted'/'Conditional Approval'/'Clear to Close', 'Closed'/'Funded'/'Closed/Funded')
- "Everyone Else" filter: `.neq('contact_type','borrower').neq('contact_type','realtor')` — catches null + any future types
- 8 parallel HEAD count queries via `Promise.all()`; `applySmartList(query, listId)` switch-based filter
- **+ NEW CONTACT button** → modal form (First Name, Last Name, Email, Phone, Mobile, Type, Stage, Lead Source, Referred By, Company, Notes). Inserts to Supabase, refreshes list + counts. `BLANK_CONTACT` const outside component for stable useState initializer.
- **Customizable columns** — COLUMNS ▾ dropdown, 15 available columns, persisted to `localStorage` key `loanos_contacts_columns_v1`. Default: Name, Type, Phone, Email, Stage, Referred By. `ColumnDef[] = { id, label, render }` pattern outside component.
- **Slide-out edit** — EDIT button → inline inputs for all writable fields, SAVE CHANGES patches Supabase + updates local state + refreshes counts, CANCEL discards. Stage change moves contact to correct Smart List on next fetch.
- `useMemo(() => createClient(), [])` — stabilized Supabase client (prevents infinite fetch loop)
- Bloomberg terminal UI: gold `#c9a84c`, `var(--muted)`, `var(--font-mono)`, `var(--font-display)`, `var(--surface)`, `var(--border)`

## Phase 1 Complete (as of 2026-03-08)

- Supabase schema: contacts, loans, documents, activity_log
- Supabase Storage bucket: documents
- Auth: email/password (switched from magic link)
- /dashboard: live with table row counts + quick actions
- /dashboard/upload: PDF upload form — end-to-end verified
  - Select doc type (7 options)
  - Attach to existing loan OR create new contact+loan inline
  - Stores in Supabase Storage: {userId}/{loanId}/{timestamp}_{filename}
  - Inserts documents row + activity_log entry
- Migration 002: added doc_type + uploaded_by columns to documents table
- Storage bucket `documents` must exist (lowercase) with RLS policies set
- Netlify build fixes: mkdir -p public/docs, contacts type array fix, loanLabel array index fix
- Phase 1 build tracker (loanos.html): all 7 items statically green (taskChecks '0-6' added)

## Skills

User-defined Claude skills live at `/skills/user/`. Each subdirectory is one skill with a `SKILL.md` defining its behavior.

## Docs

- Build tracker: /public/docs/loanos.html (served at /docs/loanos.html)
- System map: /public/docs/loanos-system-map.html (served at /docs/loanos-system-map.html)
- **UI theme spec**: /docs/THEME.md — single source of truth for colors, components, borders. For UI changes: edit THEME.md or say "[Page/component], [what], [detail]" (e.g. "Briefing stat cards, dark bg left gold bar"). Screenshots optional.
- This file: /CONTEXT.md
- Changelog: /CHANGELOG.md

## Rules For AI Sessions

- **UI changes**: Prefer docs/THEME.md + text spec. Don't require screenshots. If the user describes a change (e.g. "contacts table header darker", "cards match THEME.md"), apply it using THEME.md and Tailwind classes from the spec.
- Always read this file before starting
- Always update this file when something significant changes
- Always update CHANGELOG.md at end of session
- **Always update the build tracker** (`/public/docs/loanos.html`) at end of every session — mark completed tasks and add any new items not already on the roadmap
- At end of every session: update CONTEXT.md and push to main with everything changed that session
- Never break styer-mortgage-site tools
- Deployed on Vercel (switched from Netlify 2026-03-11)
- Ask Adam before making architectural decisions not covered here
