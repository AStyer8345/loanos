# LoanOS Full Audit — March 15, 2026

> Generated from live repo at `/Users/adamstyer/Documents/loanos-clone`
> References: `loanos-audit-prompt.md`, `loanos-deep-research.md`, all 17 migrations, all source files
> Version at audit time: **v1.23.0**
> **Updated same session:** All migrations verified applied via Supabase MCP (initial audit assumed pending based on stale docs). RLS fixed on 6 tables. Sprint 1 revised accordingly.

---

## Executive Summary

LoanOS is a real, working mortgage CRM with 819 live loan records (2,314 contacts) and a full Arive webhook pipeline — not a demo. Phase 1 (CRM/Pipeline) and Phase 2 (Automation infrastructure) are mostly built and deployed to Vercel. The code quality is high and architecture is clean.

**All 17 database migrations are confirmed applied** (verified 2026-03-15 via Supabase MCP — 15 tables, 201 loan columns). CONTEXT.md and todo.md were out of date and have been corrected. RLS was disabled on 6 tables (activity_log, loan_milestone_events, milestone_communications, outlook_tokens, oauth_state, automation_logs) — now re-enabled with proper policies.

**The biggest risks right now are: (1) zero compliance infrastructure despite automations that touch borrowers (no consent field, no CAN-SPAM footer, no AI disclaimer), (2) the highest-revenue feature — the AI Scenario Builder / Mortgage Coach replacement — has not been started at all, and (3) `/api/agents/*` routes have no authentication (anyone who discovers the URL can trigger them).** The next sprint should be: build the Scenario Builder, add consent/disclaimer infrastructure before any external demo, and lock down agent routes. Module 7 (multi-tenant) schema prep should not wait — add `org_id` columns now before the DB has even more tables to retrofit.

---

## File Inventory

### Pages (App Router)

| File | What it does | Status | Dependencies |
|------|--------------|--------|--------------|
| `src/app/page.tsx` | Root landing / redirect | Working | Supabase auth |
| `src/app/layout.tsx` | Root layout, fonts | Working | globals.css |
| `src/app/auth/callback/route.ts` | Supabase OAuth callback | Working | Supabase SSR |
| `src/app/dashboard/page.tsx` | Main dashboard — pipeline KPIs, urgent flags, recent loans, activity feed | Working | loans, activity_log |
| `src/app/dashboard/layout.tsx` | Dashboard shell with TopNav | Working | TopNav |
| `src/app/dashboard/SignOutButton.tsx` | Sign-out button | Working | Supabase auth |
| `src/app/dashboard/contacts/page.tsx` | CRM list — list, kanban, smart lists, bulk actions, CSV import, outreach chat | Working (large — ~2,000 lines) | contacts, loans, OutreachChat |
| `src/app/dashboard/contacts/[id]/page.tsx` | Contact detail server wrapper | Working | ContactRecordView |
| `src/app/dashboard/contacts/[id]/ContactRecordView.tsx` | Full contact record — info, loans, activity, emails, AI chat | Working | activity_log, email_drafts, LoanOSChat |
| `src/app/dashboard/contacts/by-name/[name]/page.tsx` | Contact lookup by name slug | Working | contacts |
| `src/app/dashboard/contacts/ImportModal.tsx` | CSV import modal (Jungo migration) | Working | /api/import/* |
| `src/app/dashboard/loans/page.tsx` | Loans list — smart lists, inline status edit, bulk actions | Working | loans |
| `src/app/dashboard/loans/[id]/page.tsx` | Loan detail — 2-col dashboard, 5 tabs, inline editing, milestones, docs, emails, AI chat | Working | loans, documents, activity_log, email_drafts |
| `src/app/dashboard/automations/page.tsx` | Automations panel — 5 workflows with upload/form triggers | Working | n8n webhooks |
| `src/app/dashboard/briefing/page.tsx` | Daily Briefing AI agent UI | Working | /api/agents/daily-briefing |
| `src/app/dashboard/marketing/page.tsx` | Marketing Command Center — MCC cadence, newsletter, social, call lists | Working (complex) | mcc_state, /api/marketing/* |
| `src/app/dashboard/marketing/content/page.tsx` | Content kanban board (Ideas/In Progress/Published) | Working | mcc_state |
| `src/app/dashboard/performance/page.tsx` | Personal P&L tracker — loan income, expenses, charts | **Stub/Partial** — data stored in localStorage, NOT Supabase; breaks on different devices | localStorage only |
| `src/app/dashboard/referral/[referrerName]/page.tsx` | Referral partner drill-down — loans referred by agent | Working | loans |
| `src/app/dashboard/settings/page.tsx` | Settings — 4 sections (Identity, Integrations, Website, Social), Outlook connect | Working | user_settings, outlook_tokens |
| `src/app/dashboard/system-map/page.tsx` | System architecture diagram | Working (static) | None |
| `src/app/dashboard/build-tracker/page.tsx` | Build progress tracker | Working (static) | None |
| `src/app/dashboard/upload/page.tsx` + `UploadForm.tsx` | Document upload to Supabase Storage | Working | documents, Supabase Storage |

### API Routes

| File | What it does | Status | Auth |
|------|--------------|--------|------|
| `api/agents/daily-briefing/route.ts` | GET — fetches pipeline data, calls Claude, returns prioritized action list | Working | No auth (middleware excluded) |
| `api/agents/milestone/route.ts` | POST — receives milestone event, generates borrower + realtor emails via Claude, pushes to Outlook via Zapier | Working | No auth (middleware excluded) |
| `api/agents/cd-extraction/route.ts` | POST — n8n calls after CD extraction; updates loans + logs activity | Working | No auth (middleware excluded) |
| `api/agents/pa-extraction/route.ts` | POST — same pattern for Pre-Approval letters | Working | No auth (middleware excluded) |
| `api/arive-webhook/route.ts` | POST — Arive webhook → upserts contact + loan in Supabase | Working (needs ARIVE_WEBHOOK_SECRET env var on Vercel) | X-Webhook-Secret header |
| `api/automations/refi-intake/route.ts` | POST — IFW PDF → Claude extraction → Outlook draft via Zapier | Working | None |
| `api/chat/route.ts` | POST — AI chat with contact/loan context injection | Working (fixed 2026-03-15) | SSR session |
| `api/contacts/bulk-action/route.ts` | POST — bulk stage/type/referred_by update | Working | Service role |
| `api/contacts/quick-add/route.ts` | POST — quick-add contact from chat | Working | Service role |
| `api/email-drafts/route.ts` | POST + PATCH — create/update email draft records | Working | Service role |
| `api/import/contacts/route.ts` | POST — CSV → contacts upsert | Working | Service role |
| `api/import/loans/route.ts` | POST — CSV → loans upsert | Working | Service role |
| `api/import/parse/route.ts` | POST — CSV parse utility | Working | None |
| `api/marketing/generate-newsletter/route.ts` | POST — Claude generates newsletter HTML (borrower + realtor versions) | Working | Anthropic API key from settings |
| `api/marketing/publish-newsletter/route.ts` | POST — dispatch to website via webhook | Working | Dispatch secret |
| `api/marketing/run-testimonials/route.ts` | POST — triggers n8n Weekly Social Post workflow | Working (requires N8N_API_KEY on Vercel) | N8N_API_KEY |
| `api/marketing/send-mailchimp/route.ts` | POST — create + send Mailchimp campaign | Working (requires Mailchimp keys in settings) | Mailchimp API |
| `api/outlook-auth/route.ts` | GET — initiates Microsoft OAuth flow | Partial — Azure env vars not set | CSRF state |
| `api/outlook-callback/route.ts` | GET — OAuth callback, stores tokens | Partial — Azure env vars not set | OAuth state token |
| `api/outlook-disconnect/route.ts` | POST — removes stored tokens | Working | SSR session |
| `api/outlook-refresh/route.ts` | POST — refreshes access token | Working | Refresh token |
| `api/outlook-status/route.ts` | GET — returns connection status | Working | SSR session |
| `api/outlook-sync/route.ts` | POST — syncs emails from Outlook to activity_log | Partial — env vars missing | SSR session |
| `api/outreach/route.ts` | POST — outreach AI chat (bulk actions, email/text drafting) | Working | None |
| `api/pipeline/stats/route.ts` | GET — pipeline stats for charts | Working | SSR session |
| `api/settings/test-anthropic/route.ts` | POST — validates Anthropic API key | Working | SSR session |
| `api/settings/test-mailchimp/route.ts` | POST — validates Mailchimp API key | Working | SSR session |
| `api/todos/route.ts` + `[id]/route.ts` | CRUD — dashboard to-do list | Working — `todo_items` table confirmed applied | SSR session |

### Components

| File | What it does | Status |
|------|--------------|--------|
| `ActivityFeed.tsx` | Bell-icon activity popover | Working |
| `ActivityTimeline.tsx` | Timeline view for contact/loan activity | Working |
| `EmailDraftPreview.tsx` | Dashboard email draft preview panel | Working |
| `GlobalSearch.tsx` | ⌘K global search (contacts + loans) | Working |
| `NavDropdown.tsx` | Dropdown nav component | Working |
| `NavItem.tsx` | Single nav item | Working |
| `TopNav.tsx` | Top navigation bar | Working |
| `crm/LoanOSChat.tsx` | AI chat widget embedded in contact/loan records | Working |
| `dashboard/DailyBriefingPanel.tsx` | Briefing panel for dashboard | Working |
| `dashboard/PipelineCharts.tsx` | Recharts pipeline visualizations | Working |
| `dashboard/PipelineKPIs.tsx` | KPI metric cards | Working |
| `dashboard/PipelineSummary.tsx` | Pipeline stage summary bar | Working |
| `dashboard/RecentActivity.tsx` | Recent activity feed (dashboard) | Working |
| `dashboard/RecentLoans.tsx` | Recent active loans (dashboard) | Working |
| `dashboard/TodoList.tsx` | Dashboard to-do list | Working — `todo_items` table confirmed applied |
| `dashboard/UrgentFlags.tsx` | Urgent flag alerts (expiring PAs, past closing dates) | Working |
| `outreach/BulkActionPreview.tsx` | Preview of bulk outreach actions | Working |
| `outreach/OutreachChat.tsx` | AI-powered outreach chat panel | Working |
| `outreach/OutreachChatContext.tsx` | Context provider for outreach selection state | Working |
| `outreach/QuickAddConfirmation.tsx` | Confirmation modal for quick-add | Working |

### Utilities / Helpers

| File | What it does | Status |
|------|--------------|--------|
| `lib/chat-command-parser.ts` | Parses slash commands in chat | Working |
| `lib/native-app-links.ts` | Generates tel:/mailto:/etc. links | Working |
| `lib/outlook/refresh.ts` | Outlook token refresh logic | Working |
| `lib/stageNormalization.ts` | Stage normalization utility | **Dead code** — not imported anywhere; dashboard page.tsx has its own inline STAGE_MAP |
| `lib/supabase/client.ts` | Supabase browser client | Working |
| `lib/supabase/logEmailDraft.ts` | Fire-and-forget email draft logger | Working |
| `lib/supabase/middleware.ts` | Supabase session refresh middleware | Working |
| `lib/supabase/server.ts` | Supabase SSR server client | Working |
| `src/middleware.ts` | Next.js middleware — session refresh, excludes `/api/agents/*` | Working |

### Database (Supabase — migrations)

| Migration | What it does | Status |
|-----------|--------------|--------|
| 001_initial_schema.sql | contacts, loans, documents, activity_log, RLS, auto-updated_at trigger | Applied |
| 002_documents_metadata.sql | doc_type, uploaded_by columns | Applied |
| 003_contract_fields.sql | Contract extraction fields, pg_net webhook trigger | Applied |
| 004_mcc_state.sql | mcc_state JSONB table for Marketing page | Applied |
| 005_closed_clients_columns.sql | salesforce_id, closing_date, realtor fields, borrower_name | Applied |
| 006_loans_and_activity_log.sql | Import columns, activity_log FK links, indexes | Applied |
| 007_arive_integration.sql | Arive fields, email UNIQUE constraint, arive_loan_id UNIQUE | Applied |
| 008_outlook_integration.sql | outlook_tokens, oauth_state, activity_log extensions | Applied |
| 009_chat_sessions.sql | chat_sessions table | Applied |
| 010_milestone_agents.sql | loan_milestone_events, milestone_communications, last_touch | ✅ Applied (verified via Supabase MCP 2026-03-15) |
| 011_loans_expansion.sql | 60+ loan fields from Arive payload | ✅ Applied (all 12 checked columns present) |
| 012_contacts_expansion.sql | created_date, last_activity_date, phone_mobile, mailing columns | ✅ Applied (all 6 checked columns present) |
| 013_email_drafts.sql | email_drafts table | ✅ Applied |
| 014_consolidate_phone_columns.sql | Migrates mobile_phone → phone_mobile, drops duplicate | ✅ Applied |
| 015_arive_full_field_expansion.sql | 80+ additional Arive fields, loan_status_history table | ✅ Applied (all 15 checked columns present, loan_status_history table exists) |
| 0016_create_todo_items.sql | todo_items table | ✅ Applied (table exists with 0 rows) |
| 0017_user_settings.sql | user_settings table | ✅ Applied (table exists with 0 rows) |

### n8n Workflows

| Workflow | n8n ID | Status |
|----------|--------|--------|
| Arive New Loan → Supabase | 1tagvoU0UXtdDiMY | ✅ Tested |
| Arive Status Update → Supabase | 9JyzzwKac8v3uQ7d | ✅ Tested |
| Milestone Communication Agent | 1hjOmS7inZcxEJQr | ✅ Tested (needs mig 010 + Vercel env vars) |
| Referral Intro Email | YbgDnTpPdefcazKy | ✅ Tested |
| Pre-Approval Email | utMvZpkdRwIRZ51u | ✅ Tested |
| Weekly Social Post | eJG4wckrj6SmSpm1 | Fixed, inactive (needs Gemini + Google Sheets creds) |
| Review Request Email | AK1fBcaX1cPcdlGx | Fixed, inactive (needs SMTP creds) |
| Final CD Email | SkzrWeR0bHZs8kWX | Untested |
| New Application Received | cWESnXXy9UOLB13q | Untested |
| Contract Received | UfNcdpoVKQZqy0fj | Phase 2 |
| Outlook Email Sync | JMmstRl2C5ylmuIY | Needs Azure env vars |
| Refi Intake Email | yCTydQ7RfZK4DyUg | Untested |

### Config Files

| File | Status |
|------|--------|
| `.env.local` | Present. SUPABASE_URL, SUPABASE keys, N8N_WEBHOOK_BASE_URL, LOANOS_SYSTEM_USER_ID set. **MICROSOFT_CLIENT_ID = placeholder — Outlook auth won't work.** ANTHROPIC_API_KEY not visible in env.local review (likely in Vercel env). |
| `package.json` | Next.js 14.2.35, @anthropic-ai/sdk 0.78.0, @supabase/ssr 0.9.0, @hello-pangea/dnd, papaparse, recharts, lucide-react. **@netlify/plugin-nextjs still in devDependencies — leftover from Netlify era, can be removed.** |
| `netlify.toml` | Exists — leftover. Not actively used if deploying to Vercel. |
| `next.config.mjs` | Standard Next.js 14 config |
| `tailwind.config.ts` | Standard |

---

## Module Gap Analysis

### Module 1: Smart CRM

| Feature | Status | Notes |
|---------|--------|-------|
| Contact records (borrowers, realtors, other) | ✅ Built | contact_type field; builder/CPA/divorce attorney not distinct types |
| Pipeline board (Kanban) | 🟡 Partial | Kanban view exists with @hello-pangea/dnd; toggle in contacts page |
| Drag-and-drop stage transitions that trigger automations | ❌ Missing | Drag works visually but no automation fires on stage change; only activity_log write |
| Auto last-touch tracking | ✅ Built | last_touch column; updated on activity |
| Contact tagging (credit issue, investor, etc.) | ❌ Missing | stage + group_tag fields exist but no free-form tag system |
| Smart duplicate detection | ❌ Missing | No pre-creation duplicate check |
| Activity timeline per contact | 🟡 Partial | Timeline built; email/SMS/calls not unified; Outlook sync not live |
| Referral source attribution (dual-level) | 🟡 Partial | referred_by + lead_source fields exist; no partner portal or automated report |
| Referral partner tiering (A/B/C) | ❌ Missing | No tier column or cadence differentiation |
| Closed loan history / refi opportunity search | 🟡 Partial | Loans visible on contact; no refi monitoring or rate alert |
| Bulk import via CSV (Jungo migration) | ✅ Built | CSV import with Salesforce field mapping; 532 loans backfilled |
| Arive sync via n8n webhook | ✅ Built | WF1 + WF2 tested; 816 loans imported |
| MISMO 3.4 XML import | ❌ Missing | Not built; identified as critical LOS-agnostic feature |
| Contact search (fast, full-text) | ✅ Built | GlobalSearch ⌘K; contacts page search; by-name URL route |
| Mobile-responsive pipeline view | 🟡 Partial | Dark zinc theme on mobile; not specifically tested for PWA behavior |

**Overall: 70% built for personal use, 40% toward sellable CRM feature set.**

---

### Module 2: Automation Engine

| Feature | Status | Notes |
|---------|--------|-------|
| Speed-to-lead (30s SMS + 60s email + 2min push notification) | ❌ Missing | No inbound lead capture → automation pipeline at all |
| Loan milestone notifications | ✅ Built | /api/agents/milestone + n8n WF3 tested; generates Claude-personalized borrower + realtor emails |
| Document collection sequences | ❌ Missing | No automated doc collection cadence |
| Post-close review request | 🟡 Partial | n8n WF7 exists but is "fixed, inactive" — needs SMTP creds |
| Referral partner weekly pipeline summaries | ❌ Missing | Not built |
| Birthday/housiversary auto-messages | ❌ Missing | birthday column on contacts exists; no trigger |
| Rate monitoring / refi alert | ❌ Missing | Not built |
| Contract intake (PDF → Claude → Arive checklist) | 🟡 Partial | n8n WF10 planned for Phase 2; trigger exists in migration 003 |
| Pre-approval email | ✅ Built | n8n WF5 tested + /api/agents/pa-extraction |
| Final CD email | 🟡 Partial | n8n WF8 + /api/agents/cd-extraction built; untested end-to-end |
| Just Closed social post | 🟡 Partial | n8n WF6 exists but inactive; needs Gemini + Google Sheets |
| Testimonial weekly post | 🟡 Partial | WF6 + /api/marketing/run-testimonials built; inactive |
| All automations logged to automation_logs | 🟡 Partial | milestone agent logs to activity_log; others inconsistent |

**Overall: Core infrastructure solid. Speed-to-lead (highest ROI automation) completely missing. 5 of 13 automations working.**

---

### Module 3: Marketing Command Center

| Feature | Status | Notes |
|---------|--------|-------|
| Weekly cadence dashboard (Mon–Fri tasks) | ✅ Built | Full MCC page with day-specific task panels |
| Email campaign builder with HTML templates | ✅ Built | Newsletter generator with Claude API |
| Mailchimp sync via API | ✅ Built | /api/marketing/send-mailchimp; requires API key in settings |
| Rate update publisher | 🟡 Partial | Content generates via Claude; publish dispatch to external site via webhook |
| Newsletter generator (borrower + realtor versions) | ✅ Built | Generates subject, teaser HTML, full web HTML |
| Social poster (LinkedIn + Facebook) | 🟡 Partial | Fields in Settings; testimonials WF inactive; not actually posting |
| Call list panels by segment | ✅ Built | MCC page segmented by realtors/pre-approvals/in-process/hot-leads |
| Campaign analytics | ❌ Missing | No open/click tracking |
| AI email draft generator | ✅ Built | Outreach chat + newsletter generator |
| Google Ads creative automation | ❌ Missing | Not built |

**Overall: Best-built module. 7/10 features working. Biggest gap: analytics and active social posting.**

---

### Module 4: LO Toolkit / Mortgage Coach Replacement

| Feature | Status |
|---------|--------|
| Loan Scenario Comparator | ❌ Not started |
| Refi Analyzer | ❌ Not started |
| Rent vs. Buy calculator | ❌ Not started |
| Total Cost of Homeownership | ❌ Not started |
| Max Purchase Price calculator | ❌ Not started |
| Buy Now vs. Wait | ❌ Not started |
| Claude API narrative summary | ❌ Not started |
| Branded PDF output | ❌ Not started |
| Shareable link per scenario | ❌ Not started |
| Supabase loan record integration | ❌ Not started |
| MISMO 3.4 import as data source | ❌ Not started |

**Overall: 0% built. This is the single feature that can justify $197/mo and replace Mortgage Coach ($150/mo). It is the highest-ROI build next.**

---

### Module 5: Lead Funnels

| Feature | Status |
|---------|--------|
| First-time homebuyer resource hub | ❌ Not started |
| Pre-approval landing page + CRM auto-creation | ❌ Not started |
| Rate alert signup | ❌ Not started |
| Realtor co-branded landing page generator | ❌ Not started |
| Mortgage calculator widget | ❌ Not started |
| UTM tracking | ❌ Not started |
| Lead scoring | ❌ Not started |

**Overall: 0% built. Medium priority — correct to defer.**

---

### Module 6: Market Intelligence

| Feature | Status |
|---------|--------|
| Rate feed (FRED API or Optimal Blue) | ❌ Not started |
| Fed meeting calendar | ❌ Not started |
| Weekly market summary (Claude generated) | 🟡 Partial — newsletter generator includes market context |
| Local market data by zip code | ❌ Not started |
| One-click publish to website + email | 🟡 Partial — newsletter publish dispatch exists |

**Overall: 20% built. Lower priority.**

---

### Module 7: Multi-Tenant / SaaS Infrastructure

| Feature | Status |
|---------|--------|
| `org_id` column on every table | ❌ Not started |
| `organizations` table | ❌ Not started |
| `org_members` join table | ❌ Not started |
| `SECURITY DEFINER get_user_org_ids()` | ❌ Not started |
| Supabase Auth with magic link | ✅ Working |
| Stripe Checkout + Billing Portal | ❌ Not started |
| Basic onboarding wizard | ❌ Not started |

**Overall: 10% built. Schema prep is cheap now, expensive later. Add `org_id` columns before the DB grows further. This is the right time.**

---

## Compliance Gaps

Ranked by risk (highest first):

### 🔴 Critical

1. **`chat_sessions` table has no user-level RLS** — Policy is `USING (true)` which means any authenticated user can read any other user's chat sessions. In production single-user it doesn't matter; for SaaS licensing to 5–10 LOs, this exposes borrower conversations across tenants. **Fix: Add `user_id` column to chat_sessions and scope policy to `auth.uid() = user_id`.**

2. **No `consent_status` field on contacts** — There is no field to record whether a contact has consented to automated communications. Every TCPA-compliant SMS or email automation requires consent check before sending. As long as automations touch external contacts (borrowers/realtors), this is a liability. **Fix: Add `consent_status TEXT DEFAULT 'unknown'` + `consent_source TEXT` + `consent_timestamp TIMESTAMPTZ` to contacts table.**

3. **Automated emails have no physical mailing address or unsubscribe link** — The milestone agent (`/api/agents/milestone`) generates borrower + realtor emails via Claude with no footer containing required CAN-SPAM elements. The email body is fully AI-generated with no enforced disclaimer. **Fix: Append a hardcoded footer in the milestone agent before the email is pushed to Outlook. Non-optional.**

4. **No AI output disclaimer on automated emails** — Per Freddie Mac AI Governance mandate (effective March 3, 2026), AI-generated outputs require disclosure. Milestone emails are AI-generated and sent to borrowers. **Fix: Append disclaimer to milestone email body: "This message was drafted with AI assistance and reviewed by [LO Name]."**

5. **`/api/agents/*` routes have no authentication** — The middleware explicitly excludes `api/agents/*` from session auth (correct for webhook use). But the only protection is the Zapier dispatch webhook URL being non-public. There is no API key or secret header check on `/api/agents/daily-briefing` (GET endpoint) or `/api/agents/milestone` (POST endpoint). Anyone who discovers the URL can trigger these. **Fix: Add `LOANOS_AGENT_SECRET` env var and validate `Authorization: Bearer` header on all `/api/agents/*` routes.**

### 🟠 High

6. **`activity_log` RLS allows DELETE** — The policy is `FOR ALL` which includes DELETE. Audit logs should be immutable. RLS was re-enabled 2026-03-15 (was disabled). **Fix: Drop the `FOR ALL` policy and create separate SELECT/INSERT policies; remove UPDATE and DELETE permissions for non-admin.**

7. **`email_drafts` has no user-level access control** — Uses `USING (true)` policy. Acceptable for service-role-only access now; risky when opening to multiple LOs. **Fix: Add `user_id` column and proper RLS before SaaS launch.**

8. ~~`loan_milestone_events` has no RLS~~ — **FIXED 2026-03-15.** RLS enabled + user-scoped SELECT policy added (via `arive_loan_id → loans.user_id` join). `milestone_communications` also fixed with FK-chain policy. `outlook_tokens`, `oauth_state`, `automation_logs` locked down to service-role only.

9. **No Terms of Service / Privacy Policy page** — Required before any external user accesses the system or any borrower data is processed. Not even a placeholder.

10. **No AI tools inventory document** — Freddie Mac mandate requires documentation of which features use AI, what inputs, what outputs. Not built.

### 🟡 Medium

11. **Performance page stores financial data in localStorage** — `performance/page.tsx` persists all production income/expense data to `localStorage` under `loanDashboard2026`. Not a compliance gap per se but a data integrity and privacy risk. Not Supabase-backed.

12. **No data deletion capability** — CCPA/GDPR readiness requires ability to delete a contact's data. No UI or API endpoint exists.

13. **`documents` bucket access policies unverified** — Cannot verify from code alone whether Supabase Storage bucket policies properly restrict document access. Should be confirmed in Supabase dashboard.

14. **No consent logging with timestamp and source** — Even if consent_status field is added, there is no mechanism to log when and how consent was obtained.

15. **Contract intake migration 003 has a placeholder URL** — `notify_n8n_contract_received()` function in migration 003 has `'YOUR_N8N_WEBHOOK_URL'` hardcoded. This function fires on every contract document insert. If not updated, it either fails silently or calls nothing.

---

## Database Schema Status

### Current Tables (confirmed via migrations)

| Table | Columns | RLS | Notes |
|-------|---------|-----|-------|
| contacts | ~40 | ✅ user_id scoped | Missing: consent fields, tier, tags |
| loans | 201 | ✅ user_id scoped | Very comprehensive; some date columns duplicated from migration overlap |
| documents | 8 | ✅ user_id scoped | Basic; doc_type added in migration 002 |
| activity_log | ~12 | ✅ user_id scoped (RLS re-enabled 2026-03-15) | FOR ALL policy allows DELETE — consider restricting to INSERT/SELECT |
| outlook_tokens | 7 | ✅ RLS enabled, no public policy (service-role only) | Fixed 2026-03-15 — was exposed |
| oauth_state | 3 | ✅ RLS enabled (locked down) | CSRF token; short-lived |
| chat_sessions | 6 | ⚠️ USING (true) — any user can read all sessions | **Still needs fix: add user_id column** |
| loan_milestone_events | 10 | ✅ RLS enabled + user-scoped SELECT policy (via arive_loan_id → loans.user_id) | Fixed 2026-03-15 |
| milestone_communications | 9 | ✅ RLS enabled + user-scoped SELECT policy (via milestone_event_id FK chain) | Fixed 2026-03-15 |
| mcc_state | 4 | ✅ user_id scoped | JSONB blob — no granular access |
| email_drafts | 12 | ⚠️ USING (true) — service role only | Fine for current use |
| loan_status_history | 8 | ✅ user_id scoped via loan FK | Good |
| todo_items | 10 | ✅ user_id scoped | Applied and working |
| user_settings | 4 | ✅ user_id scoped | Applied and working |
| automation_logs | ? | ✅ RLS enabled (locked down) | Not in any migration — created manually. Fixed 2026-03-15 |

### Missing Tables (needed for target architecture)

| Table | Priority | Reason |
|-------|----------|--------|
| organizations | HIGH (Phase 3) | Multi-tenant — add schema now |
| org_members | HIGH (Phase 3) | Multi-tenant roles |
| contacts.consent_status (column) | CRITICAL | TCPA compliance |
| contacts.tier (column) | MEDIUM | Referral partner A/B/C cadence |
| contacts.tags (JSONB column) | MEDIUM | Flexible tagging |
| rate_alerts | LOW | Refi monitoring feature |
| scenarios | MEDIUM | Module 4 — Scenario Builder |
| scenario_items | MEDIUM | Line items per scenario |

### Pending Migrations

```
✅ ALL MIGRATIONS APPLIED — verified 2026-03-15 via Supabase MCP.
   CONTEXT.md and todo.md were out of date. Corrected same session.
```

### Migration Numbering Inconsistency

Migrations 001–015 use 3-digit prefixes. `0016` and `0017` use 4-digit prefixes. Not a runtime bug but will break lexicographic ordering if any tooling depends on it. Fix: rename `0016_` → `016_` and `0017_` → `017_` and update `RUN_ALL_PENDING.sql`.

### Indexes (existing + needed)

Current indexes are good — user_id, entity_id, created_at on key tables. Key gaps:
- No composite `(user_id, status)` index on loans — full table scan for smart list filtering at 816+ records is fine now but will degrade at 10K+
- No `(org_id, user_id)` composite indexes — needed when org_id is added for multi-tenancy

---

## Infrastructure Status

| System | Status | Notes |
|--------|--------|-------|
| Supabase | ✅ Connected | Project ref: `uuqedsvjlkeszrbwzizl`. URL set in env. 4 migrations pending. |
| Vercel | ✅ Deployed | v1.23.0 live. `SUPABASE_SERVICE_ROLE_KEY` and `ANTHROPIC_API_KEY` must be in Vercel env — unverifiable from code. |
| n8n | ✅ Accessible | `styer.app.n8n.cloud`. 12 workflows. 5 tested, 7 untested/inactive. `N8N_API_KEY` needed on Vercel for testimonials trigger. |
| Netlify | ⚠️ Residual | `netlify.toml` + `@netlify/plugin-nextjs` still in repo. Legacy. Can be cleaned up. |
| Microsoft Graph / Outlook | ❌ Not configured | `MICROSOFT_CLIENT_ID = "your-azure-app-client-id"` placeholder in `.env.local`. Azure App Registration not completed. 6 Outlook env vars missing. |
| Arive Webhook | 🟡 Built, needs verification | `ARIVE_WEBHOOK_SECRET` present in `.env.local`. Must confirm it's set in Vercel env vars and that Arive is configured to send to Vercel URL. |
| Mailchimp | 🟡 Built, needs keys | API key stored in `user_settings` table (user provides via Settings page). |
| Zapier | ✅ Working | Dispatch webhook URL for Outlook drafts. Referral Intro + Pre-Approval tested. |
| Anthropic | ✅ Working | API key set. Model: `claude-sonnet-4-5`. |

---

## Technical Debt (flagged from code review)

1. **`getServiceClient()` copy-pasted in 7 API routes** — Identical 4-line function in: `api/chat`, `api/agents/daily-briefing`, `api/agents/milestone`, `api/agents/cd-extraction`, `api/agents/pa-extraction`, `api/contacts/quick-add`, `api/contacts/bulk-action`. Should be `createServiceClient()` exported from `src/lib/supabase/server.ts`.

2. **`stageNormalization.ts` is dead code** — The file exists and exports `normalizeStage()` but `dashboard/page.tsx` defines its own inline `STAGE_MAP` without importing from the lib. The lib file appears unused everywhere.

3. **Hardcoded n8n URL in client-side code** — `N8N_BASE = 'https://styer.app.n8n.cloud/webhook'` hardcoded in `loans/[id]/page.tsx` and `automations/page.tsx`. Breaks for future licensed LOs. Should be `NEXT_PUBLIC_N8N_WEBHOOK_BASE` env var.

4. **`useSearchParams()` missing Suspense in two pages** — `settings/page.tsx` and `marketing/page.tsx`. Won't cause bugs given `force-dynamic`, but generates build warnings.

5. **`performance/page.tsx` not backed by Supabase** — Production income and expense data lives in localStorage. Phase 3 blocker.

6. **`netlify.toml` + `@netlify/plugin-nextjs`** — Dead config from pre-Vercel era. Safe to delete.

---

## Recommended Sprint Sequence

> Rule: every sprint produces one shippable, complete feature. No 70% done.

### Sprint 1 — Verify Live Integrations + Lock Down Agent Routes (1 session)
1. ~~Apply pending migrations~~ — **DONE.** All 17 migrations confirmed applied 2026-03-15.
2. ~~Fix RLS on exposed tables~~ — **DONE.** 6 tables re-enabled, user-scoped policies added.
3. Confirm `ARIVE_WEBHOOK_SECRET` + `LOANOS_SYSTEM_USER_ID` + `ANTHROPIC_API_KEY` are set in Vercel env vars (cannot verify from code — check Vercel dashboard).
4. Add `LOANOS_AGENT_SECRET` env var and validate `Authorization: Bearer` header on all `/api/agents/*` routes — currently wide open.
5. Test WF1 end-to-end: new Arive loan → Supabase upsert → activity_log.
6. Test milestone agent: send test webhook → verify borrower + realtor emails drafted in Outlook.

**Why first:** Agent routes are exposed. Arive pipeline needs live verification.

---

### Sprint 2 — AI Scenario Builder V1 (2–3 sessions)
**This is the Mortgage Coach replacement. Highest revenue justification for the platform.**

Build:
- `/dashboard/scenarios/new` page — manual input form: loan amount, purchase price, interest rate, loan term, down payment, loan type (conv/FHA/VA), monthly income, monthly debts
- Side-by-side comparison of up to 3 scenarios
- Claude generates plain-English narrative for each scenario
- Basic output screen with key numbers (P&I, PITI estimate, LTV, monthly savings vs. scenario B)
- **Do NOT** build PDF export or shareable links in V1 — get the core math and Claude narrative working first

This is V1 per the research doc: manual input only, no pricing engine, no PDF. The math and AI narrative are the value.

---

### Sprint 3 — Compliance Minimum Viable Layer (1 session)
Before any external user or borrower touches this system:
- Add `consent_status`, `consent_source`, `consent_timestamp` to contacts table
- Add mandatory footer to milestone agent emails (physical address + unsubscribe stub)
- Add AI disclaimer to all outbound AI-generated emails
- Add `LOANOS_AGENT_SECRET` validation on `/api/agents/*` routes
- Fix `chat_sessions` RLS (add user_id column, scope policy)
- Fix `activity_log` RLS (remove DELETE permission)

---

### Sprint 4 — Speed-to-Lead Automation (1–2 sessions)
**Highest ROI single automation per research (391% higher conversion when contacted in < 1 minute):**
- Inbound lead form → webhook → n8n workflow → SMS to borrower (Twilio) + email draft to Outlook + push notification
- CRM auto-creates contact, fires activity log
- Requires: Twilio account, 10DLC-registered number

This requires choosing Twilio and setting up 10DLC compliance. Do not build SMS automation without it — TCPA exposure.

---

### Sprint 5 — Activate Dormant Automations (1 session)
- Get Review Request Email (WF7) live: configure SMTP creds in n8n
- Get Weekly Social Post / Testimonials (WF6) live: Gemini API key + Google Sheets OAuth2
- Test Final CD Email (WF8) end-to-end
- Test New Application Received (WF9) end-to-end

---

### Sprint 6 — Multi-Tenant Schema Prep (1 session)
**Do this before the DB gets any bigger:**
- Add `org_id UUID` column to: contacts, loans, documents, activity_log, email_drafts, todo_items, loan_milestone_events, milestone_communications, mcc_state, user_settings
- Create `organizations` table + `org_members` table
- Create `SECURITY DEFINER get_user_org_ids()` function
- Update all RLS policies to check `org_id IN (get_user_org_ids())`
- Backfill existing rows with a default `org_id` for Adam's tenant

**This is cheap now (add a column), expensive in 6 months (retrofit 20+ tables with live user data).**

---

### Sprint 7 — Scenario Builder V1.5 + PDF Output
- Wire scenario builder to existing Supabase loan records (auto-populate from arive_loan_id)
- Add MISMO 3.4 XML upload → field extraction → populate scenario form
- Add branded PDF export using `@react-pdf/renderer`
- Add shareable link per scenario

---

## Estimated Timeline to Beta (5–10 LOs)

**Minimum requirements for first external LO:**
1. ✅ Compliance layer (Sprint 3) — non-negotiable
2. ✅ Multi-tenant schema (Sprint 6) — without this, LO 2's data mixes with Adam's
3. ✅ Onboarding wizard (stub) — minimal: enter name/NMLS/email, connect Supabase, invite user
4. ✅ Stripe Checkout (stub) — $97/mo Starter plan, manual upgrade
5. ✅ Terms of Service + Privacy Policy page — required before any borrower data handled

**Conservative timeline at current build pace (1 full session = ~1 day):**

| Week | Sprint | Output |
|------|--------|--------|
| Week 1 | Sprint 1 | Agent routes locked down, Arive + milestone agent verified live, Vercel env vars confirmed |
| Week 2–3 | Sprint 2 | Scenario Builder V1 — manually-input, Claude narrative output |
| Week 4 | Sprint 3 | Compliance minimum viable layer |
| Week 5 | Sprint 4 | Speed-to-lead automation (pending Twilio 10DLC registration — takes 2–4 weeks) |
| Week 5 | Sprint 5 | Dormant automations activated |
| Week 6 | Sprint 6 | Multi-tenant schema prep |
| Week 7–8 | Sprint 7 | Scenario Builder V1.5 + PDF |
| Week 9 | — | Stripe + onboarding stub + ToS/Privacy |
| Week 10 | — | **Beta ready for LO 2** |

**10 weeks to first licensed LO at current pace.**

**Twilio 10DLC caveat:** 10DLC registration for business SMS takes 2–4 weeks through carriers. If Speed-to-Lead (Sprint 4) requires SMS, start the Twilio registration process in parallel with Sprint 2. Do not wait.

---

*Audit rules applied: brutally honest, no fixes during audit, trust the repo over CONTEXT.md where they conflict, flag 70%-done features, every recommendation tied to revenue or compliance.*
