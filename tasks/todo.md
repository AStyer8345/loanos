# LoanOS — Task Backlog

_Last updated: 2026-03-22 (daily prep — activity_log null org fixes)_

---

## 🔴 High Priority

- [x] **daily-briefing unscoped fallback** — Fixed 2026-03-21. Replaced `withOrg` ternary fallback with hard 500 check before any queries. `organizationId` must be non-null before any data fetch runs.
- [x] **Final CD Email n8n check constraint crash** — Fixed 2026-03-21 morning audit. `Log CD Email` node was sending `status: 'draft'` but `email_drafts_status_check` only allows `pending/sent/discarded`. Updated to `status: 'pending'`. Workflow `SkzrWeR0bHZs8kWX`.
- [x] **activity_log null org rows (Next.js)** — Fixed 2026-03-22. `updateLastTouch.ts` now fetches org_id from profile. `outlook-sync logEmailActivity` now stamps `contact.organization_id`. `generate-narrative` unscoped insert removed. Migration 046 backfilled 3 orphan rows.

- [ ] **n8n activity_log null org — Arive Status Update** (`9JyzzwKac8v3uQ7d`) — inserts `status_updated` to activity_log without `organization_id`. Needs a `Get Org ID` node (same as WF1/WF2 pattern) before the activity_log HTTP Request node.
- [ ] **n8n activity_log null org — Outlook Email Sync** (`JMmstRl2C5ylmuIY`) — inserts `email.received` rows without `organization_id`. Also blocked on Azure App Registration. Low priority until Azure is unblocked.
- [ ] **Wire logEmailDraft to pre-approval automation** — n8n workflow `utMvZpkdRwIRZ51u` needs a node to POST draft payload to `/api/email-drafts` (or a new `/api/email-drafts/log` route) after building the email body. Requires n8n access.
- [ ] **n8n Outlook Email Sync credentials** (`JMmstRl2C5ylmuIY`) — needs Azure env vars. MICROSOFT_CLIENT_ID is still a placeholder in `.env.local`. Azure App Registration not completed. Blocked on Adam.

---

## 🟡 Medium Priority

- [ ] **daily-briefing unscoped milestone queries** — `loan_milestone_events` and `milestone_communications` in `/api/agents/daily-briefing` use `createServiceClient()` but are not scoped to `organization_id` (neither table has that column). Low risk single-tenant but should be fixed before multi-tenant launch: join through `loans.organization_id` or add `organization_id` to both tables.
- [ ] **Wire logEmailDraft to refi-intake** — `/api/automations/refi-intake/route.ts` extracts PDF fields but doesn't log email drafts — that happens in the n8n workflow `yCTydQ7RfZK4DyUg`. Wire logEmailDraft there.
- [ ] **Wire logEmailDraft to final-cd** — same pattern — n8n workflow `SkzrWeR0bHZs8kWX`.
- [ ] **E2E test WF1 + WF2** — all migrations confirmed applied: trigger test webhook, verify loan row in Supabase, verify loan_status_history row.

---

## 🟢 Low Priority / Cleanup

- [ ] **Migration file numbering** — files 001–015 use 3-digit prefix, 0016/0017 use 4-digit. Rename to 016/017 for consistency.
- [ ] **Performance page to Supabase** — currently stores all financial data in localStorage (`loanDashboard2026`). Device-specific, lost on browser clear. Move to Supabase before licensing.
- [ ] **Kanban board** — contacts page has LIST | KANBAN toggle. Verify drag-and-drop works after last `@hello-pangea/dnd` install.
- [ ] **Dead API route `/api/pipeline/stats`** — fully functional but its output is now unused; dashboard server component pulls all data directly. Consider removing or repurposing.

---

## ✅ Completed (2026-03-22 daily prep — activity_log null org fixes)

- [x] **Migration 046 applied** — Backfilled 3 null `organization_id` rows in `activity_log`. All 3 were created after migration 043 by n8n workflows and a code bug. Assigned to Adam's org. `activity_log` now has 0 null org rows.
- [x] **`updateLastTouch.ts` fixed** — Was inserting to `activity_log` without `organization_id`. Now fetches `profiles.organization_id` for the authenticated user and stamps it on every insert.
- [x] **`outlook-sync/route.ts` `logEmailActivity()` fixed** — Was inserting without `organization_id`. Now passes `contact.organization_id` (already present on the contact row fetched from Supabase) into the activity_log row.
- [x] **`generate-narrative/route.ts` unscoped insert removed** — Route has no auth (IP rate-limited only), so org_id is unknowable. The activity_log insert was producing orphan rows. Removed the insert entirely. Unused `createServiceClient` import also cleaned up.

## ✅ Completed (session 13 — 2026-03-21 multi-tenancy audit)

- [x] **Migration 043 applied** — Backfilled null `organization_id` on legacy rows: 78 `activity_log` rows + 2 `contacts` rows + 2 `chat_sessions` rows. All pre-migration records that had null org were assigned to Adam's org (`18613f82-fdd9-42dd-a09e-f3c577328258`). All three tables now have 0 null org rows.
- [x] **Migration 044 applied** — Replaced user_id-scoped RLS on `chat_sessions` with org-scoped policies. `chat_sessions` already had `organization_id` column from migration 039 but policies still checked `auth.uid() = user_id`. All 4 policies (SELECT/INSERT/UPDATE/DELETE) now use `organization_id = get_my_organization_id()`.
- [x] **daily-briefing unscoped fallback fixed** — `withOrg` helper was `organizationId ? query.eq() : query` — the fallback path let all queries run without org filter if org lookup failed. Replaced with a hard 500 return before any data fetches. `withOrg` now always applies the filter unconditionally.

## ✅ Completed (morning audit — 2026-03-20)

- [x] **Arive New Loan null first_name fixed** — n8n workflow `1tagvoU0UXtdDiMY` was crashing when Arive sent a webhook with null `firstName`. The "HTTP Request" (contact upsert) node body had `first_name: $json.firstName` — JSON.stringify serializes null as a literal null, which violated the NOT NULL constraint on `contacts.first_name`. Fixed: added `|| ''` fallback for both `first_name` and `last_name`. Pushed to n8n (workflow active).
- [x] **chat_sessions RLS verified correct** — Migration 035 confirmed applied. All 4 policies scoped to `auth.uid() = user_id`. Stale todo removed.

## ✅ Completed (session 11 — 2026-03-20 multi-tenancy policy audit)

- [x] **Migration 040 applied** — Dropped 3 sets of stale/incorrect RLS policies: (1) 4 legacy user_id policies on `contacts` (coexisted with org policies, creating OR-expanded access), (2) UPDATE policy on `activity_log` (audit logs are immutable by design), (3) redundant catch-all ALL policy on `marketing_activity_log`. All 3 issues were data-isolation risks in a multi-tenant context.
- [x] **Isolation verification script** — `scripts/verify-tenant-isolation.ts` built. Creates two test orgs, inserts one loan + one contact per org, verifies org_id assignment and cross-org exclusion at the data layer, cleans up all test records. Note: service role bypasses RLS — full policy-level test requires real auth session simulation.

## ✅ Completed (session 8 — 2026-03-19 morning audit)

- [x] **chat_sessions missing user_id on insert** — `/api/chat/route.ts` was inserting new sessions without `user_id`. After migration 020 scoped RLS to `auth.uid() = user_id`, any browser-direct query would fail to see new sessions. Fixed: added `user_id: userId` to the insert payload.
- [x] **Dashboard "Needs Attention" label mismatch** — UI said "3+ days no activity" but threshold was 7 days. Fixed label to "7+ days no activity".
- [x] **Contract Received `fetch is not defined`** — Confirmed already fixed. `Upsert Contacts` node uses `this.helpers.httpRequest()` in current workflow (last updated 2026-03-16). Last successful execution: run 306. Todo was stale.
- [x] **Fix chat_sessions RLS** — Migration 020 was already applied. `user_id` column exists and policies are scoped to `auth.uid() = user_id`. Todo was stale.
- [x] **Wire TodoList to dashboard** — `TodoList` is already imported and rendered in Queue tab of `DashboardClient.tsx` (line 451). Todo was stale.

## ✅ Completed (session 7 — 2026-03-18 morning audit)

- [x] **Loans page borrower name fixed** — `buildLoansQuery` was selecting only `borrower_name` (old column, null for all Arive loans). Added `borrower_first_name` + `borrower_last_name` to the select. Added `borrowerDisplayName()` helper with fallback chain: `first+last → borrower_name → loan_name → '(unnamed)'`. Updated display, search, and sort to use the helper. Arive-synced loans now show real names in the loans table.

## ✅ Completed (session 6 — 2026-03-17 morning audit)

- [x] **Arive Status Update null new_status fixed** — n8n workflow `9JyzzwKac8v3uQ7d` `Log Status History` node was failing with NOT NULL constraint when Arive sent `currentLoanStatus_status: null`. Fixed: body now uses `status || oldStatus || 'unknown'` fallback.
- [x] **Stale todos cleared** — Marked done: pipeline/stats fix (v3.5.0), auth on /api/agents/* (already had validateAgentSecret), STAGE_MAP consolidation (already on constants), netlify removal (v3.5.0), createServiceClient extraction (already in service.ts), briefing dark theme (already dark), console.log cleanup (only 1 innocuous log found in mismo/parse).

## ✅ Completed (session 5 — 2026-03-16 morning audit)

- [x] **Daily briefing broken auth fixed** — `/api/agents/daily-briefing` used `validateAgentSecret` exclusively, so browser calls from `/dashboard/briefing` always returned 401. Fixed to accept either agent secret (server-to-server) OR Supabase session auth (browser).
- [x] **Daily briefing column name fixed** — same route used `est_closing_date` (old column, doesn't exist for Arive loans). Fixed to `estimated_closing_date`.
- [x] **Review Request Email n8n workflow fixed** — `AK1fBcaX1cPcdlGx` was erroring every 30 minutes with Supabase 400. Root cause: `close_date` column doesn't exist. Fixed to `closing_date`. Pushed to n8n.

## ✅ Completed (session 4 — 2026-03-15 full audit)

- [x] **All migrations confirmed applied** — verified via Supabase MCP. 15 tables, 201 loan columns. todo_items, user_settings, loan_milestone_events, milestone_communications, loan_status_history all exist.
- [x] **RLS re-enabled on 6 tables** — activity_log (had policy but RLS was off), loan_milestone_events, milestone_communications, outlook_tokens, oauth_state, automation_logs. All 15 tables now have RLS enabled.
- [x] **User-scoped read policies added** — loan_milestone_events (via arive_loan_id → loans.user_id), milestone_communications (via milestone_event_id → loans.user_id).
- [x] **Migration 013 verified applied** — `email_drafts` table exists with 0 rows.
- [x] **Full audit report written** — `tasks/audit-reports/full-audit-2026-03-15.md`

## ✅ Completed (session 3 — 2026-03-15 morning audit)

- [x] **Chat route column names fixed** — `est_closing_date` → `estimated_closing_date`, `borrower_name` → `borrower_first_name`/`borrower_last_name` fallback chain. Chat AI context now shows correct borrower and close date for Arive loans.
- [x] **Daily briefing `max_tokens` bumped** — 1024 → 2048. Matches chat route.

## ✅ Completed (session 2 — 2026-03-14)

- [x] Pipeline Dashboard redesign (v1.14.0)
- [x] EmailDraftPreview component built
- [x] `email_drafts` migration + API route + logEmailDraft helper created
- [x] logEmailDraft wired to milestone agent
- [x] **EmailDraftPreview added to dashboard** (2026-03-14 morning audit)
- [x] **Marketing tab crash fixed** — `user_id` added to upsert/select, switched to SSR-aware Supabase client
- [x] **Content Board built** — `/dashboard/marketing/content` kanban (Ideas/In Progress/Published), persisted to `mcc_state` key `content_board`
- [x] **Settings page expanded** — 4 credential sections (Identity, Integrations, Website, Social) + per-section saves + last-saved timestamps + show/hide token fields + Anthropic/Mailchimp test buttons
- [x] **Migration 0017 applied** — `user_settings` table confirmed in production
- [x] Refi intake email automation (v1.13.0)
- [x] Arive full field expansion + n8n pipeline rebuild (v1.12.0)
- [x] Global Search ⌘K, Activity Feed bell, Kanban, Smart list delete/edit (v1.11.0)
