# LoanOS — Task Backlog

_Last updated: 2026-03-17 (morning audit)_

---

## 🔴 High Priority

- [ ] **Fix Contract Received `fetch is not defined`** — `Upsert Contacts` Code node in workflow `UfNcdpoVKQZqy0fj` uses native `fetch()` which is not available in n8n's JS sandbox. Replace `fetch` calls with HTTP Request nodes or `$helpers.request()`. Workflow is active and erroring.
- [ ] **Wire logEmailDraft to pre-approval automation** — n8n workflow `utMvZpkdRwIRZ51u` needs a node to POST draft payload to `/api/email-drafts` (or a new `/api/email-drafts/log` route) after building the email body. Requires n8n access.
- [ ] **n8n Outlook Email Sync** (`JMmstRl2C5ylmuIY`) — needs Azure env vars. MICROSOFT_CLIENT_ID is still a placeholder in `.env.local`. Azure App Registration not completed. Blocked on Adam.
- [ ] **Fix chat_sessions RLS** — `USING (true)` policy means any authenticated user can read all chat sessions. Add `user_id` column, backfill from record owner, scope policy to `auth.uid() = user_id`. Critical before multi-tenant.

---

## 🟡 Medium Priority

- [ ] **Wire logEmailDraft to refi-intake** — `/api/automations/refi-intake/route.ts` extracts PDF fields but doesn't log email drafts — that happens in the n8n workflow `yCTydQ7RfZK4DyUg`. Wire logEmailDraft there.
- [ ] **Wire logEmailDraft to final-cd** — same pattern — n8n workflow `SkzrWeR0bHZs8kWX`.
- [ ] **E2E test WF1 + WF2** — all migrations confirmed applied: trigger test webhook, verify loan row in Supabase, verify loan_status_history row.

---

## 🟢 Low Priority / Cleanup

- [ ] **Migration file numbering** — files 001–015 use 3-digit prefix, 0016/0017 use 4-digit. Rename to 016/017 for consistency.
- [ ] **Performance page to Supabase** — currently stores all financial data in localStorage (`loanDashboard2026`). Device-specific, lost on browser clear. Move to Supabase before licensing.
- [ ] **Kanban board** — contacts page has LIST | KANBAN toggle. Verify drag-and-drop works after last `@hello-pangea/dnd` install.

---

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
