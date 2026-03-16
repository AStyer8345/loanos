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

Phase 1 complete. Phase 2 (Automation) ~95% complete — all major features built, several pending go-live steps.
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
**Sprint 1 Security Lockdown (2026-03-15)**: All 4 `/api/agents/*` routes locked down with `Authorization: Bearer <LOANOS_AGENT_SECRET>` header validation — shared helper at `src/lib/auth/validateAgentSecret.ts`. `getServiceClient()` eliminated from 7 routes, replaced with `createServiceClient()` from `src/lib/supabase/service.ts`. Hardcoded n8n URL replaced with `process.env.NEXT_PUBLIC_N8N_WEBHOOK_BASE` in `loans/[id]/page.tsx` and `automations/page.tsx`. `netlify.toml` deleted, `@netlify/plugin-nextjs` removed. Migrations `0016`/`0017` renamed to `017`/`018` (016 already existed). 4 new migrations created (019–022): fix activity_log RLS (no DELETE), fix chat_sessions RLS (add user_id + scope), fix email_drafts RLS (add user_id + scope), disable contract webhook trigger. Migrations 019–022 applied to Supabase via MCP (2026-03-15). n8n WF3 (Milestone, `1hjOmS7inZcxEJQr`) updated with `Authorization: Bearer 0bbc8cff-94b2-43bb-b005-a8b0665b1f7d` header — only WF3 actually calls a LoanOS agent route (WF5/WF8/WF9 call Supabase/Claude directly, not agent routes). **Vercel env vars (LOANOS_AGENT_SECRET, NEXT_PUBLIC_N8N_WEBHOOK_BASE) must still be added manually in Vercel dashboard.** `stageNormalization.ts` NOT deleted — actively used by quick-add and bulk-action routes (audit was wrong). `npm run build` passes clean. Full results: `tasks/audit-reports/sprint-1-results.md`.
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
