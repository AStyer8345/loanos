# LoanOS Changelog

## [1.9.0] — 2026-03-11 — ARIVE Webhook Integration + DB Expansion + Contact Detail Improvements

### Added

**Supabase DB Migrations**
- `supabase/migrations/011_loans_expansion.sql` — expands `loans` table with ~50 ARIVE fields: borrower/co-borrower, loan terms (rate, APR, points, LTV/CLTV, down payment), property details, milestone dates (application/submission/approval/closing/funding/rate-lock/estimated-closing), financials (PITI, cash-to-close, closing costs, MI), qualifying (credit score, DTI, monthly income), parties (referring agent, listing/buyer agent, title, escrow, processor, UW, lender), lead source, notes, ARIVE timestamps; adds UNIQUE constraint on `arive_loan_id`
- `supabase/migrations/012_contacts_expansion.sql` — adds to `contacts`: `created_date`, `last_activity_date`, `notes`, `phone_mobile`, `mailing_street`, `mailing_city`, `mailing_state`, `mailing_zip`, `mailing_country`, `title`

**Arive Webhook**
- `netlify/functions/arive-webhook.js` — Netlify serverless function; validates `X-Webhook-Secret`; upserts contact (on `email`) with borrower name/phone/group/stage/source/type; upserts loan (on `arive_loan_id` or `loan_number`) with full camelCase ARIVE payload mapped to all expansion columns; inserts `activity_log` row with `action: 'arive_sync'`; raw fetch to Supabase REST (no SDK)

**Jungo CSV Backfill Script**
- `scripts/backfill-jungo-contacts.js` — one-time Node.js script; reads Jungo/Salesforce CSV export; matches contacts by email (case-insensitive); only fills NULL/empty DB fields — never overwrites existing data; supports `--headers` flag to inspect CSV columns before running; env vars from `.env.local`

**Contact Detail View**
- `ContactRecordView.tsx` — extended `Contact` type with 5 new fields (`mailing_country`, `phone_mobile`, `title`, `created_date`, `last_activity_date`); added `phone_mobile` display row in CONTACT INFO card labeled "Mobile"; added `onSaveNotes` prop; replaced static notes preview card with inline editable textarea — save-on-blur, shows "Saving…"/"Saved" status, no button
- `contacts/[id]/page.tsx` — added `handleSaveNotes` function (updates DB + local state); wired `onSaveNotes={handleSaveNotes}` into `<ContactRecordView />`

### Go-Live Steps
- [ ] Run `011_loans_expansion.sql` in Supabase SQL Editor
- [ ] Run `012_contacts_expansion.sql` in Supabase SQL Editor
- [ ] Set Netlify env vars: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ARIVE_WEBHOOK_SECRET`, `LOANOS_SYSTEM_USER_ID`
- [ ] Configure ARIVE webhook to POST to `https://<site>.netlify.app/.netlify/functions/arive-webhook` with `X-Webhook-Secret` header

---

## [1.8.0] — 2026-03-11 — Loan Milestone Agent + Daily Briefing Agent

### Added

**Agent 5 — Loan Milestone Communication Agent**
- `supabase/migrations/010_milestone_agents.sql` — `loan_milestone_events` table (id, loan_id, milestone, triggered_at, raw_payload), `milestone_communications` table (id, event_id FK, recipient_type, draft_pushed, pushed_at, subject, body_preview), `last_touch TIMESTAMPTZ` on contacts; CHECK constraint on 7 milestone values; partial index on `draft_pushed = false`
- `src/app/api/agents/milestone/route.ts` — POST handler; validates loan_id + milestone; two Claude calls (`claude-sonnet-4-5`, max_tokens: 512) — borrower warm tone + realtor professional, both return `{subject, body}` JSON; pushes Outlook drafts via `ZAPIER_DISPATCH_WEBHOOK_URL`; logs to both new tables
- `docs/agents-n8n-setup.md` — full setup guide for both agents; required env vars table; DB table reference

**Agent 1 — Daily Command Center**
- `src/app/api/agents/daily-briefing/route.ts` — GET handler; 5 parallel Supabase queries via `Promise.allSettled` (overdue_leads, closing_this_week, recently_uploaded_docs, recent_milestones, unread_messages); single Claude call (`claude-sonnet-4-5`, max_tokens: 1024) → `top7` prioritized actions + `summary`; strips markdown fences before JSON.parse
- `src/app/dashboard/briefing/page.tsx` — `'use client'` checklist page; stat row (4 cards), progress bar, priority checklist with toggle, loading skeleton; light theme (slate-50, emerald-600 accent)
- `src/app/dashboard/SidebarNav.tsx` — added `Brain` import from lucide-react; added Daily Briefing as first nav entry

### Environment Variables to Add (Vercel — loanos repo)
- `ZAPIER_DISPATCH_WEBHOOK_URL` — Zapier → Outlook draft creation webhook (Agent 5)
- `MILESTONE_WEBHOOK_SECRET` — shared secret validating n8n → /api/agents/milestone calls

### Go-Live Steps
- [ ] Run `010_milestone_agents.sql` in Supabase SQL Editor
- [ ] Add `ZAPIER_DISPATCH_WEBHOOK_URL` + `MILESTONE_WEBHOOK_SECRET` to Vercel env vars
- [ ] Configure n8n webhook to POST to `/api/agents/milestone` on Arive milestone events

---

## [1.7.3] — 2026-03-11 — AI Chat Contact Context + Clear Button Fixes

### Fixed
- `src/app/api/chat/route.ts` — contact SELECT was querying 7 non-existent columns (`mobile_phone`, `lead_source`, `referred_by`, `company_name`, `last_touch`, `top_realtor`, `target_realtor`), causing Supabase to return an error and the system prompt to fall back to generic with no contact data. Removed all 7 columns and cleaned up the prompt template to match actual schema.
- `src/components/crm/LoanOSChat.tsx` — clear button called `setHistoryLoaded(false)`, which recreated the `loadHistory` useCallback (it's in its dependency array), triggering the `useEffect([isOpen, loadHistory])` to re-fetch from Supabase. Removed the call — `setSessionId(null)` is sufficient to ensure the next message creates a fresh session.

## [1.7.2] — 2026-03-11 — AI Chat System Prompt Schema Expansion

### Changed
- `src/app/api/chat/route.ts` — `buildSystemPrompt` expanded for both record types to include all available schema columns

**Contact prompt** — added 6 fields: `realtor_email`, `realtor_phone`, `mailing_street/city/state/zip` (assembled into mailing address), `group_tag`, `source`; associated loan block now also fetches `interest_rate`, `closing_date`, `est_closing_date`, `sales_price`, `buyer_agent_name`

**Loan prompt** — added 14 fields: `sales_price` (purchase price), `interest_rate`, `down_payment_pct`, `estimated_ltv`, `seller_concessions`, `county`, `closing_date`, `est_closing_date` (fallback), `effective_date`, `title_company`, `buyer_agent_name/email/brokerage`, `listing_agent_name/email`; `borrowerName` now prefers `data.borrower_name` (loans table) over contact join

**Omitted (confirmed not in schema)**: `processor`, `days_in_stage`, `last_activity`, `notes` (spec desired but no migration added these columns)

## [1.7.1] — 2026-03-11 — AI Chat Bug Fixes

### Fixed
- `src/app/api/chat/route.ts` — corrected model ID from `claude-sonnet-4-20250514` to `claude-sonnet-4-5` (date suffix was causing API failures)
- `src/components/crm/LoanOSChat.tsx` — fixed silent failure: API error responses (non-2xx or `data.error`) now show "Error: assistant unavailable. Try again." in chat instead of silently dropping; previously `if (data.message)` would pass when API returned `{error: '...'}` with no visible feedback
- `src/components/crm/LoanOSChat.tsx` — updated quick action text to match spec (contact: check-in email, next action, text message, summarize; loan: what needs attention, realtor update email, days until close, borrower status update)
- `src/components/crm/LoanOSChat.tsx` — header now shows both `recordName` and `recordType` (was showing one or the other)

## [1.7.0] — 2026-03-11 — AI Chat Integration

### Added

**Supabase Migration**
- `supabase/migrations/009_chat_sessions.sql` — creates `chat_sessions` table (`id uuid`, `record_id text`, `record_type text check in ('contact','loan')`, `messages jsonb`, `created_at`, `updated_at`); index on `(record_id, record_type)`; RLS enabled; auto-update trigger on `updated_at`

**API Route**
- `src/app/api/chat/route.ts` — POST + GET handlers for AI chat assistant
  - POST: builds system prompt from live Supabase record (contact joins loans, loan joins contacts), calls Claude API (`claude-sonnet-4-5`, `max_tokens: 1024`), upserts `chat_sessions` (update if sessionId exists, insert otherwise)
  - GET: returns most recent `chat_sessions` row for a given record (`recordId` + `recordType` query params)
  - Uses inline service role client (`getServiceClient()`) — bypasses RLS, never exposed to browser
  - System prompt identity: LoanOS Assistant for Adam Styer, direct and record-specific

**Component**
- `src/components/crm/LoanOSChat.tsx` — self-contained floating chat UI
  - Props: `{ recordId, recordType: 'contact'|'loan', recordName }`
  - Fixed 52×52 gold `◈` trigger button (bottom-right corner)
  - 380×560px dark panel (IBM Plex Mono, `#C9A84C` accent, `#0f0f0f`/`#1a1a1a` surface)
  - Quick actions per record type (4 each), history loads on first open, clear chat button
  - Enter sends / Shift+Enter newline, auto-resize textarea, `historyLoaded` guard prevents duplicate fetches

### Dependencies
- `@anthropic-ai/sdk ^0.78.0` — added to package.json

### Wired Into Record Views
- `src/app/dashboard/contacts/[id]/ContactRecordView.tsx` — `LoanOSChat` imported and rendered with `recordId={contact.id}`, `recordType="contact"`, `recordName={fullName(contact)}`
- `src/app/dashboard/loans/[id]/page.tsx` — `LoanOSChat` imported and rendered with `recordId={loanId}`, `recordType="loan"`, `recordName={displayName}`

### Environment Variables
- `ANTHROPIC_API_KEY` — add to Vercel env vars for loanos repo

---

## [1.6.1] — 2026-03-11 — Deploy Platform Switch

### Changed
- Deployment moved from Netlify to Vercel

---

## [1.6.0] — 2026-03-10 — Outlook Email Integration

### Added

**Netlify Functions**
- `netlify/functions/outlook-auth.js` — initiates Microsoft OAuth2 flow; generates CSRF state, redirects to Azure authorize endpoint
- `netlify/functions/outlook-callback.js` — handles OAuth callback; exchanges code for tokens, stores in `outlook_tokens` table
- `netlify/functions/outlook-refresh.js` — exports `getValidAccessToken(email)` with 5-minute buffer refresh logic; standalone HTTP handler for status checks
- `netlify/functions/outlook-sync.js` — fetches inbox + sent items from Graph API (`@odata.nextLink` pagination), matches emails to contacts by address, deduplicates via `external_id`, logs to `activity_log`

**Supabase Migration**
- `supabase/migrations/008_outlook_integration.sql` — creates `outlook_tokens` table; extends `activity_log` with `type`, `summary`, `raw_payload`, `external_id` columns; adds `external_id` unique index for deduplication

**UI**
- `src/components/ActivityTimeline.tsx` — dual-schema normalize (legacy `action`/`metadata` + new `type`/`summary`/`raw_payload`); icon by type (email/doc/call/note/activity); relative timestamps; expandable JSON detail; 20/page pagination
- `src/app/dashboard/settings/page.tsx` — Outlook integration card: Connect, manual Sync Now, Disconnect; shows token status + expiry
- `src/app/dashboard/SidebarNav.tsx` — added Settings nav entry with Settings icon

**API Routes**
- `src/app/api/outlook-status/route.ts` — GET; queries `outlook_tokens`; returns `{connected, email, expires_at, token_valid}`
- `src/app/api/outlook-disconnect/route.ts` — POST; deletes all rows from `outlook_tokens`

**n8n**
- `n8n/outlook-sync-workflow.json` — 15-minute schedule → POST to `outlook-sync` Netlify function with `x-sync-secret` header → IF node → log stats or log error

**Docs & Scripts**
- `docs/outlook-azure-setup.md` — step-by-step Azure app registration guide
- `scripts/test-outlook-sync.js` — CLI test runner: env check, token status, refresh check, sync trigger, recent activity query; supports `--status`, `--sync`, `--refresh` flags

### Changed

- `src/app/dashboard/contacts/[id]/ContactRecordView.tsx` — imports `ActivityTimeline`; extended `ActivityEntry` type with new columns; replaced inline activity rendering with `<ActivityTimeline rows={activity} />`
- `src/app/dashboard/contacts/[id]/page.tsx` — `fetchActivity` selects new columns (`type`, `summary`, `raw_payload`, `external_id`); limit increased 100→200
- `.env.local` — added Microsoft/Outlook env var placeholder block (7 vars)

### Architecture

```
Outlook 365 inbox + sent
        ↓ Graph API (15-min poll)
netlify/functions/outlook-sync.js
        ↓ match contact by email address
supabase: activity_log (external_id deduplication)
        ↓ render
ActivityTimeline component (contact profile → Activity tab)
```

---

## [1.5.0] — 2026-03-10 — Arive Direct Webhook (Netlify Function + n8n Orchestrator)

### Added

**Netlify Function: `netlify/functions/arive-webhook.js`**
- Receives Arive loan events, validates `X-Webhook-Secret` header
- Upserts contact (on `email`) and loan (on `arive_loan_id`) via Supabase REST API
- Inserts `activity_log` row per event
- Returns `{ success, contact_id, loan_id, arive_loan_id }` on 200
- No SDK dependency — raw `fetch` only

**n8n Workflow: `n8n/workflows/arive-to-supabase.json`**
- 7-node orchestrator: Arive Webhook → Forward to Netlify Function → IF 200 → Respond OK / (else) Build Error Context → Send Outlook Alert (Zapier) → Respond 500
- `neverError: true` on HTTP node enables proper branching on non-2xx
- Error branch sends Outlook alert via Zapier webhook and responds 500 so Arive retries
- Webhook path: `arive-sync`

### Changed

- `netlify.toml` — added `[functions]` block: `directory = "netlify/functions"`, `node_bundler = "nft"`
- `scripts/test-webhooks.js` — full rewrite with real Arive field names (`ariveLoanId`, `loanBorrower1_emailAddressText`, `keyDates_*`, etc.); supports `--netlify` and `--n8n` flags
- `.env.local.example` — fully documented (7 required vars with explanations)
- `README.md` — replaced Next.js boilerplate with project README including 6-step Arive Webhook Setup guide, env vars table, n8n workflow table, Netlify function table, migration table

### Architecture

```
Arive (loan event)
  └─► n8n: arive-to-supabase workflow (path: arive-sync)
        └─► POST /.netlify/functions/arive-webhook
              ├─► upsert contacts (on email)
              ├─► upsert loans (on arive_loan_id)
              ├─► insert activity_log
              └─► 200 { success, contact_id, loan_id }
        └─► IF not 200 → Outlook alert via Zapier + respond 500 (Arive retries)
```

---

## [1.4.0] — 2026-03-10 — Two New n8n Automations: Review Request + Social Post

### Added

**Workflow 1 — Closed Loan Review Request Email** (`automations/workflow-1-closed-loan-review-request.json`)
- n8n ID: `AK1fBcaX1cPcdlGx`
- Trigger: every 30 minutes (scheduled)
- Logic: fetches loans where `closing_date <= now() - 2 days` and no prior `review_request` log entry; sends branded HTML email with Google + Zillow review links; logs to `automation_logs`
- 5 nodes: scheduleTrigger → code (fetch loans + contacts) → code (build HTML email) → emailSend → httpRequest (log)
- Hardcoded: `supabaseUrl`, `fromEmail: adam@styermortgage.com`
- Remaining placeholders: `YOUR_SUPABASE_SERVICE_ROLE_KEY`, `YOUR_GOOGLE_REVIEW_URL`, `YOUR_ZILLOW_REVIEW_URL`, `REPLACE_WITH_SMTP_CRED_ID`

**Workflow 2 — Weekly Testimonial Social Post** (`automations/workflow-2-weekly-testimonial-post.json`)
- n8n ID: `eJG4wckrj6SmSpm1`
- Trigger: Mondays at 9am CT (cron: `0 9 * * 1`, timezone: `America/Chicago`)
- Logic: reads random unused testimonial from Google Sheet → Gemini 1.5 Flash generates caption → Imagen 3 generates quote card image (base64) → uploads to Supabase Storage `social-assets` bucket → Publer posts to Instagram + LinkedIn + Facebook → marks sheet row used → logs to `automation_logs`
- 10 nodes: scheduleTrigger → googleSheets (read) → code (random select) → httpRequest (Gemini caption) → code (extract + build prompt) → httpRequest (Imagen) → code (upload to Supabase Storage) → httpRequest (Publer post) → googleSheets (mark used) → httpRequest (log)
- Hardcoded: Sheet ID `1W9NRB2H8u0cjctCueXh7VYgL27m5vLLFJfONepNWixk`, `supabaseUrl`, `supabaseStorageBucket: social-assets`, Publer API key + 3 account IDs (Instagram, LinkedIn, Facebook)
- Remaining placeholders: `YOUR_GEMINI_API_KEY`, `YOUR_SUPABASE_SERVICE_ROLE_KEY`, `REPLACE_WITH_GOOGLE_SHEETS_CRED_ID` (both sheets nodes)

**Supabase Infrastructure**
- `automation_logs` table created (SQL Editor): `id uuid PK`, `type text`, `loan_id uuid`, `testimonial_id text`, `platform text`, `sent_at timestamptz`, `posted_at timestamptz`, `created_at timestamptz`. RLS disabled. Indexes on `type` and `loan_id`.
- `social-assets` Supabase Storage bucket created as **PUBLIC** — images must be publicly accessible for Publer to fetch them

### Notes
- n8n Variables feature NOT available on Adam's plan (403 `feat:variables`) — all credentials hardcoded directly in workflow JSON
- Both JSONs validated with `node -e "JSON.parse(...)"` — no `$env` refs remain
- Both workflows imported to n8n via `POST /api/v1/workflows` API
- Both workflows are **inactive** until credentials are filled in and Adam activates them

### Pending Manual Steps to Activate
1. Get `SUPABASE_SERVICE_ROLE_KEY` from Supabase → Settings → API → service_role
2. Get `GEMINI_API_KEY` from aistudio.google.com
3. Get Google Review URL + Zillow Review URL
4. Set up SMTP credential in n8n (for workflow 1 emailSend node)
5. Set up Google Sheets OAuth2 credential in n8n (for workflow 2 both sheets nodes)
6. Update both workflow JSONs with real values, re-import via PUT `/api/v1/workflows/{id}`
7. Activate both workflows in n8n dashboard

---

## [1.3.0] — 2026-03-10 — 816 Arive Loans Imported + Backfilled

### Added
- 816 loans imported from full Arive CSV export (`report1773124619094.csv`, 31 columns) via Python import script
- Contact matching: 98% match rate (806/816 loans linked to existing contacts by borrower name)
- Raw payload stored in `raw_payload` JSONB for future re-extraction
- Backfill script parsed double-encoded raw_payload → 24 typed columns: status, loan_name, property_city, property_state, loan_program, occupancy, lender, investor, term_months, ltv, monthly_payment, purchase_price, property_type, property_zip, lock_date, commissions, hazard_insurance, mortgage_insurance, property_tax, escrow_agent, closing_date, title_company, buyer_agent_name, listing_agent_name

### Fixed
- **Auth client bug** in `loans/page.tsx` and `loans/[id]/page.tsx` — was using bare `createClient` from `@supabase/supabase-js` (no auth session → RLS blocked all rows). Switched to `createClient` from `@/lib/supabase/client` (SSR-aware `createBrowserClient` from `@supabase/ssr`)
- **Smart list status coverage** — added all Arive status values to `SMART_LISTS` constant: `Loan in Process`, `processing`, `Pre-Approved`, `QUALIFICATION`, `DISCLOSURE_SENT` → In Process; `lead`, `APPLICATION_INTAKE` → Started; `Suspended` → Cancelled
- **StatusBadge color mapping** — added Arive-specific status values to color matching: `pre-approved`, `qualification`, `disclosure_sent` → blue; `lead`, `application_intake` → amber; `suspended` → red
- Removed unused imports (`FileText`, `Activity`, `StickyNote`) from `ContactRecordView.tsx` (lint auto-fix)

### Manual Steps Completed (Supabase)
- ✅ Combined migration 003 + 006 applied — adds 30+ columns to loans table, activity_log FK columns, 7 indexes
- ✅ 816 loans backfilled from raw_payload via REST API with service_role_key

---

## [1.2.0] — 2026-03-09 — Arive → Supabase n8n Integration

### Added
- `supabase/migrations/007_arive_integration.sql` — idempotent migration. Adds to contacts: `mailing_street`, `mailing_city`, `mailing_state`, `mailing_zip`, `group_tag`, `stage` (idempotent — already exists), `source`. Attempts `contacts_email_unique` UNIQUE CONSTRAINT (warns but doesn't fail if duplicate emails block it). Adds to loans: `arive_loan_id TEXT UNIQUE`, `first_payment_date DATE`, `est_closing_date DATE`, `funding_date DATE`, `sales_contract_date DATE`, `raw_payload JSONB`. Creates indexes: `idx_loans_arive_loan_id`, `idx_contacts_email`, `idx_contacts_source`.
- `n8n/workflows/workflow-1-new-loan.json` — importable n8n workflow (10 nodes). Receives Arive POST on new loan creation. Upserts contact by email, upserts loan by `arive_loan_id`, logs `action: 'loan_created'` to activity_log. Returns 200. Error Trigger catches failures and logs `action: 'arive.webhook.error'`.
- `n8n/workflows/workflow-2-status-update.json` — importable n8n workflow (12 nodes). Receives Arive POST on loan status change. Finds loan by `arive_loan_id`. If found: PATCHes status + date fields, logs `action: 'loan_status_updated'`, returns 200. If not found: logs `action: 'error_loan_not_found'`, returns 404.
- `n8n/README.md` — 9-step setup guide: run migration, find system user UUID, configure n8n credentials (Header Auth for Arive secret, Header Auth for Supabase service key), set `LOANOS_SYSTEM_USER_ID` env var, import both workflows, configure Error Trigger workflow ID, get webhook URLs, configure Arive, test with script. Includes Arive field mapping table and troubleshooting section for 5 failure modes.
- `scripts/test-webhooks.js` — Node.js test runner (no external dependencies, uses native fetch). Sends POST to `arive-new-loan` with realistic fake payload, waits 2s, sends POST to `arive-status-update` using same `arive_loan_id`. Logs responses. Prints pass/fail summary. Exits 0 on all-pass, 1 on any failure. Reads `N8N_WEBHOOK_BASE_URL` + `ARIVE_WEBHOOK_SECRET` from env.
- `.env.example` — documents all required env vars: `SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`, `N8N_WEBHOOK_BASE_URL`, `ARIVE_WEBHOOK_SECRET`, `LOANOS_SYSTEM_USER_ID` (n8n internal), `NEXT_PUBLIC_SUPABASE_URL`.

### Notes
- Runs **parallel to existing Zapier/Salesforce flows** — zero overlap
- All existing n8n workflows untouched
- Pattern matches established codebase convention: `httpRequest` nodes (not `n8n-nodes-base.supabase`), `apikey` Header Auth credential name, `action` column in activity_log, Supabase URL `https://uuqedsvjlkeszrbwzizl.supabase.co`
- Migration 007 is next after existing 006 — migrations 001-006 were already live
- `loans_arive_loan_id_unique` UNIQUE constraint is safe to add — all existing loans have NULL `arive_loan_id` (PostgreSQL UNIQUE allows multiple NULLs)
- Manual step required: run migration 007 in Supabase SQL editor before importing workflows

---

## [1.1.1] — 2026-03-09 — Automations: Loan-picker + webhook loan_id passthrough

### Changed
- `src/app/dashboard/automations/page.tsx` — five-edit update:
  - **Edit 1**: Added `useEffect` to imports; `supabase = createClient()` module-level singleton
  - **Edit 2**: Added `LoanOption` interface (`{ id: string; label: string }`)
  - **Edit 3**: `TriggerModal` — accepts `loanId: string | null`; appends to PDF `FormData` and JSON body before n8n POST
  - **Edit 4**: `AutoCard` — added `loans: LoanOption[]` + `onTrigger: (loanId: string | null) => void` props; renders "Run for loan…" `<select>` dropdown above Trigger button
  - **Edit 5**: `AutomationsPage` — added `activeLoanId` + `loans` state; `useEffect` fetches top 200 loans on mount (ordered by `closing_date desc`); plumbed `loans` + `onTrigger` into `AutoCard`, `loanId` + reset into `TriggerModal`

---

## [1.1.0] — 2026-03-10 — Contacts: Inline Stage Edit + Smart Lists v2 + Bulk Actions

### Changed
- `src/app/dashboard/contacts/page.tsx` — full rewrite (879 lines). Three major feature additions:

**Feature 1 — Inline Stage Editing**
- Every Stage cell is now clickable → opens `<select>` dropdown with 8 canonical stages in-place
- `handleStageChange()` — optimistic UI: removes contact from current list if new stage maps to a different Smart List, otherwise updates local state immediately. Supabase write + count refresh follow.
- `autoFocus` + `onBlur` pattern on select — no extra editing state needed beyond `editingStageId`
- `e.stopPropagation()` on stage badge click + select prevents row-click from opening slide-out panel
- Stage dropdown in slide-out edit panel updated to use same canonical STAGES list

**Feature 2 — Smart List Restructure**
- `STAGES` canonical array: Lead, Pre-App, Application, Pre-Approved, In Process, Closing, Closed, Other
- `STAGE_TO_LIST` record + `stageToList(stage, contactType)` as single source of truth
- Smart List mapping: Lead/Pre-App/Application → new-apps, Pre-Approved → active, In Process/Closing → in-process, Closed → closed, Other → unassigned
- "Everyone Else" replaced by **"Unassigned / Other"** — query: `.or('contact_type.eq.other,contact_type.is.null,and(contact_type.eq.borrower,stage.is.null)')` — catches type=other, null type, and borrowers with null stage without including realtors
- `fetchCounts` updated to use same Supabase OR pattern for unassigned count; all keys updated to match new list IDs
- `setSelectedIds(new Set())` called on list switch + every `fetchContacts()` to clear stale selection

**Feature 3 — Bulk Actions**
- Checkbox `<th>` + `<td>` added as first column in table. Select All in header toggles all visible contacts.
- `selectedIds: Set<string>` state for O(1) membership checks
- `toggleSelect(id, e)` + `toggleSelectAll()` handlers
- Floating action bar (position:fixed, bottom:24px) renders when `someSelected` — buttons: UPDATE STAGE, UPDATE TYPE, ASSIGN REFERRED BY, DELETE, ✕ (clear)
- Bulk action modal: stage dropdown / type dropdown / referred_by text input; `handleBulkUpdate()` patches all selected IDs in one Supabase `.in()` call
- Delete confirmation modal with irreversibility warning; `handleBulkDelete()` deletes + refreshes
- Row background highlighted when selected

---

## [1.0.9] — 2026-03-09 — UI Redesign: Bloomberg Dark → Linear/Attio Light Mode

### Changed
- `src/app/globals.css` — full palette swap: `--bg: #F9FAFB`, `--surface: #FFFFFF`, `--border: #E2E8F0`, `--text: #0F172A`, `--muted: #64748B`, `--accent: #059669`. Legacy `--gold` and `--green` remapped to `#059669` for backward compat. Google Fonts changed from Bebas Neue + IBM Plex Mono/Sans to Inter only.
- `src/app/dashboard/layout.tsx` — sidebar: `bg-white border-r border-slate-200`, `"OS"` logo accent `text-emerald-600`, clean `text-slate-900` wordmark.
- `src/app/dashboard/SidebarNav.tsx` — full rewrite: lucide-react icons per nav item (LayoutDashboard, Users, Upload, Zap, BarChart2, CheckSquare, GitBranch); active state `bg-emerald-50 text-emerald-600 border-l-2 border-emerald-600`; sentence-case labels; no uppercase/monospace.
- `src/app/dashboard/SignOutButton.tsx` — light-mode styles: `text-slate-500 hover:text-slate-900 border-slate-200 hover:border-slate-300`; `w-full` to fill sidebar footer.
- `src/app/dashboard/page.tsx` — full rewrite: white card-on-canvas stat grid (`bg-white rounded-lg border border-slate-200 shadow-sm`), `text-4xl font-bold text-slate-900` numbers, pill status bar (`bg-emerald-50 border-emerald-200` with `animate-pulse` dot), emerald primary CTA button.
- `src/app/dashboard/automations/page.tsx` — full rewrite: all `rgba(201,168,76,...)` gold replaced with emerald equivalents; `TriggerModal` converted to Tailwind (`bg-black/50` overlay, `border-l-4 border-l-emerald-500`); `AutoCard` left accent `bg-emerald-500`, status badge `bg-emerald-50 border-emerald-200 text-emerald-700`; pipeline step nodes `border-emerald-300 bg-emerald-50 text-emerald-600`; `flow-dot` keyframe `background: #059669`; card hover `hover:shadow-md hover:border-slate-300` (no gold glow); Bebas Neue headers replaced with `text-2xl font-semibold tracking-tight`.

### Added
- `lucide-react@^0.577.0` — installed as dependency for sidebar icons

---

## [1.0.8] — 2026-03-09 — Build Tracker Update + Session Rules

### Changed
- `public/docs/loanos.html` — Phase 2 roadmap updated: added 5 new completed items (Referral Intro Email, Automations Dashboard, Marketing Command Center, Contacts Module rewrite, Salesforce Import). `taskChecks` marks items 1-0 through 1-9 done. Items 1-10 (Rate update publisher) and 1-11 (Activity auto-log) remain unchecked.
- `CONTEXT.md` — added rule: always update build tracker at end of every session (mark completed tasks + add new items not on roadmap).

## [1.0.7] — 2026-03-09 — Closed Clients + Import Feature

### Added
- `supabase/migrations/005_closed_clients_columns.sql` — idempotent migration: adds `salesforce_id TEXT UNIQUE`, `closing_date DATE`, `realtor_email TEXT`, `realtor_phone TEXT` to contacts; adds `interest_rate NUMERIC(6,4)`, `borrower_name TEXT` to loans; creates `idx_contacts_salesforce_id` and `idx_contacts_email_lower` indexes. Run manually in Supabase SQL editor.
- `scripts/import-closed-clients.py` — one-time import script for 868 Closed Client records from Salesforce XLS export. Reads HTML-formatted XLS via pandas + lxml, applies three-tier dedup, POSTs to Supabase REST. Idempotent.
- `src/app/api/import/parse/route.ts` — POST endpoint, accepts `multipart/form-data` file. Auto-detects CSV vs Salesforce HTML-XLS. Returns `{ columns, rows (5 preview), count, fileType }`. `full=true` form field returns all rows.
- `src/app/api/import/contacts/route.ts` — POST endpoint accepts `{ rows }` JSON. Three-tier dedup: salesforce_id → email (case-insensitive) → first_name+last_name. Never overwrites. Row-level error handling. Returns `{ imported, skipped, errors }`.
- `src/app/api/import/loans/route.ts` — POST endpoint accepts `{ rows }` JSON. Requires authenticated session (user_id NOT NULL). Two-tier dedup: loan_number → borrower_name+closing_date. Row-level error handling. Returns `{ imported, skipped, errors }`.
- `src/app/dashboard/contacts/ImportModal.tsx` — two-tab modal (Contacts / Loans). Drag-drop or browse file upload. Calls parse route for preview (5 rows + count). Confirm re-parses with `full=true` and POSTs to appropriate import route. Shows imported/skipped/error results.
- Import button (gold outline) added to Contacts page header next to `+ NEW CONTACT`.

### Changed
- `contacts/page.tsx` — removed `viewMode` state and Active/All toggle. Removed standalone `viewMode` conditional in `fetchContacts`. Fixed `fetchCounts` for all/closed. Fixed `applySmartList` closed case to include `'Closed Client'`. Added `salesforce_id`, `closing_date`, `realtor_email`, `realtor_phone` to `Contact` type and `ALL_COLUMNS`. Wired `ImportModal`.
- `src/app/api/import/parse/route.ts` — added `full` form field support to return all rows for import confirmation step.

### Removed
- `src/app/dashboard/closed-clients/` — entire directory deleted. Replaced by "Closed Borrowers" Smart List filter in `/dashboard/contacts`.
- `SidebarNav.tsx` — removed CLOSED CLIENTS nav entry.

---

## [1.0.6] — 2026-03-09 — Automations Trigger Buttons Live

### Changed
- `/dashboard/automations/page.tsx` — full rewrite to wire up trigger buttons
  - Added `TriggerModal` component: Bloomberg-styled overlay with drag/drop PDF zone (3 workflows) or form fields (Referral Intro)
  - PDF workflows (`final-cd`, `pre-approval`, `new-application`): FormData POST with `file`, `triggered_by`, `workflow_id`
  - Form workflow (`referral-intro`): JSON POST with `lead_name`, `agent`, `details`
  - All POST to `https://styer.app.n8n.cloud/webhook/{webhookPath}`
  - Loading/success/error states in modal; success message: "Workflow triggered — check Outlook for the draft."
  - Modal opens from `AutomationsPage` state (`activeWf`) — avoids z-index stacking issues
  - `AutoCard` now accepts `onTrigger: () => void`; TRIGGER button is gold + active (was disabled gray)
  - Removed "Coming soon" tooltip; footer note updated to reflect live infra
  - `'use client'` with `useState`, `useRef`, `ChangeEvent` imports added

---

## [1.0.5] — 2026-03-09 — Automations Dashboard

### Added
- `/dashboard/automations/page.tsx` — visual dashboard for all 4 active n8n workflows
  - Cards for: Final CD Email, Pre-Approval Email, Referral Intro Email, New Application Received
  - Each card: workflow icon, trigger label, description, Active status badge, animated pipeline flow (Trigger → Claude AI → Outlook → Review), hover meta-reveal showing n8n ID + webhook path, disabled Trigger button with tooltip
  - Animated flow dot traveling along connector lines between pipeline steps (staggered per connector)
  - Staggered card entrance animation on page load (cardIn keyframe, 0.12s delay per card)
  - Stat row: 4 Active / 0 Errors / Last Updated: 2026-03-09 / Engine: n8n + Claude API
  - Infra status bar with pulsing green dot
- `SidebarNav.tsx` — added ⚡ AUTOMATIONS link after UPLOAD DOC
- `CONTEXT.md` — added `## Active Automations` table as living document for all workflows

---

## [1.0.4] — 2026-03-09 — Closed Clients Section

### Added
- `/dashboard/closed-clients/page.tsx` — new page querying `contacts WHERE stage = 'Closed Client'` joined with `loans` via PostgREST nested select. Columns: Name, Loan Amount, Close Date, Loan Type, Referring Agent. Client-side search by name + sort by close date (default: most recent first). Bloomberg terminal UI.
- `SidebarNav.tsx` — added CLOSED CLIENTS nav link after CONTACTS
- `dashboard/page.tsx` — added 5th parallel HEAD count for Closed Clients; added CLOSED CLIENTS stat card; changed grid to `lg:grid-cols-5`
- `contacts/page.tsx` — added `viewMode` state (`'active' | 'all'`). Default `'active'` excludes `stage = 'Closed Client'` from All Contacts list + count. Active/All toggle buttons in filter bar.

---

## [1.0.3] — 2026-03-09 — MCC Live (Netlify Build Fixed)

### Fixed
- `marketing/page.tsx`: missing `export default function MarketingPage()` was blocking Netlify build and causing 12 cascading ESLint `no-unused-vars` errors — all tab components, hooks, and constants were defined but unreachable
- `marketing/page.tsx`: removed unused `s` prop from `TodayTab` signature
- `contacts/page.tsx`: added `eslint-disable-next-line` for `no-explicit-any` on `applySmartList`

### Added
- `MarketingPage` component: tab nav (TODAY → BRAIN DUMP), Supabase load on mount, `save()` + `toggle()` wired to all 8 tab sub-components

---

## [1.0.2] — 2026-03-09 — Contract Automation Live

### Completed
- n8n workflow `loanos-contract-received` published and tested end-to-end with real contract PDF
- Migration 003 (`003_contract_fields.sql`) applied — 14 contract columns + `contract_data JSONB` live in `loans` table
- Full pipeline confirmed: PDF upload → Supabase trigger → n8n webhook → Claude extraction → loan update → two Outlook drafts

---

## [1.0.1] — 2026-03-09 — MCC Migration Applied + Dev Server Fixed

### Fixed
- `supabase/migrations/004_mcc_state.sql` — migration applied in Supabase; `mcc_state` table + RLS now live
- `.claude/launch.json` (project-level, not in repo) — corrected `runtimeArgs` from `loanos` → `loanos-clone`; ran `npm install` in `loanos-clone` to restore `node_modules`

---

## [1.0.0] — 2026-03-09 — Marketing Command Center (MCC) Native Integration

### Added
- `supabase/migrations/004_mcc_state.sql` — new `mcc_state` table: `(user_id UUID, key TEXT, value JSONB, updated_at TIMESTAMPTZ)`, PRIMARY KEY `(user_id, key)`, RLS (SELECT/INSERT/UPDATE per user)
- `src/app/dashboard/marketing/page.tsx` — full MCC port as native LoanOS dashboard page (`'use client'`)
  - **8 tabs**: TODAY, WEEK, CONTACTS, SOCIAL, NEWSLETTERS, TRACKER, LOG, BRAIN DUMP
  - **State pattern**: single JSONB blob (`mcc_state` table, key = `'mcc'`) — mirrors Netlify Blobs shape
  - **DAYS**: Mon–Fri × task arrays (type: email/call/social/text/video/admin, optional tracker ref)
  - **TRACKERS**: 9 trackers (Realtor Email, Borrower Email, LinkedIn, Facebook, Rate Update, Newsletter, DB Call, Lender Email, Agent Social) — shows days-since-last + traffic-light color
  - **CONTACTS**: 4 call lists (Realtors, Pre-Approvals, Active Files, Hot Leads) — add/edit/delete, log calls with history + last touch, call notes
  - **calledToday**: ephemeral — reset to false on page load, never persisted
  - Tracker auto-update: checking a task with `tracker` property writes `s.last[trackerId]` = now
  - `upsert` with `onConflict: 'user_id,key'` for both first-save and update paths
  - `useMemo(() => createClient(), [])` — stable Supabase client
  - Shared UI atoms: `Card`, `SectionLabel`, `Input`, `Btn` (default/gold/danger variants)
  - Bloomberg terminal UI: CSS vars, Bebas Neue, IBM Plex Mono, gold `#c9a84c`
- `src/app/dashboard/SidebarNav.tsx` — added MARKETING nav link (before BUILD TRACKER)

### Manual Steps Completed (Supabase)
- ✅ Migration `004_mcc_state.sql` applied — `mcc_state` table + RLS live

---

## [0.9.0] — 2026-03-09 — Contacts: Smart List Fixes + Create Contact + Customizable Columns

### Changed
- `src/app/dashboard/contacts/page.tsx` — full rewrite (544 lines, TypeScript clean)
  - **In Process smart list** — new 8th list: `contact_type = 'borrower'` AND `stage IN ['In Process','Processing','Submitted','Conditional Approval','Clear to Close']`
  - **All stage filters** updated to `.in('stage', [...])` arrays covering all Salesforce-imported variants (was single `.eq()`)
  - **Everyone Else** fixed: now `.neq('contact_type','borrower').neq('contact_type','realtor')` — catches null + 'other' + any future types (was `.eq('contact_type','other')`)
  - **+ NEW CONTACT modal** — gold button in header → form (First/Last Name, Email, Phone, Mobile, Type, Stage, Lead Source, Referred By, Company, Notes) → Supabase insert → list + count refresh
  - **Customizable columns** — COLUMNS ▾ dropdown checklist (15 columns available), persisted to `localStorage` key `loanos_contacts_columns_v1`, default: Name, Type, Phone, Email, Stage, Referred By
  - **Slide-out edit** — EDIT → inline inputs → SAVE patches Supabase + updates local state; stage change moves contact to correct Smart List on next fetch
  - `ColumnDef[] = { id, label, render }` config array outside component; `BLANK_CONTACT` const outside component
  - `Promise.all()` expanded to 8 parallel HEAD count queries (added in-process)

---

## [0.8.0] — 2026-03-09 — Smart List Contacts Rebuild

### Changed
- `src/app/dashboard/contacts/page.tsx` — full rewrite with Smart List sidebar (557 lines, TypeScript clean)
  - **Smart List sidebar** (w-56): 7 lists — All Contacts, New Applications, Active Borrowers, Closed Borrowers, All Realtors, Top/Target Realtors, Everyone Else
  - Live count badges: 7 parallel Supabase `{ count: 'exact', head: true }` queries via `Promise.all()`
  - `applySmartList(query, listId)` — switch-based Supabase filter chaining (`.eq()`, `.in()`, `.or()`)
  - Switching active list resets page, search, filters, selected contact, and edit state
  - Gold `#c9a84c` active list highlight; section headers (BORROWERS, REALTORS, OTHER) in muted text
  - Main content: dynamic header shows active list label + contact count
  - Filters: 300ms debounced search (name/email/phone), stage select, lead_source select, CLEAR button
  - Table: 6 columns (Name, Type badge, Email, Phone, Stage, Lead Source), sticky header, 50/page pagination
  - `useMemo(() => createClient(), [])` — stabilized Supabase client to prevent infinite fetch loops
  - Row hover + selected state via direct `.style.background` mutation (no re-render cost)
  - Main content shifts right (`paddingRight: 400px`, `transition: 0.2s`) when slide-out panel is open
  - Slide-out panel (400px fixed, `top: 56px`): contact name in Bebas Neue, type badge, EDIT/CANCEL/SAVE
  - Edit mode: `orderedFields()` — priority fields first, then alpha, skips id/timestamps
  - Save patches Supabase in-place, updates local state; cancel discards; saving spinner state
  - Bloomberg terminal UI: `var(--muted)` for secondary text, `var(--font-mono)`, gold `#c9a84c` accents

---

## [0.7.0] — 2026-03-08 — Contacts Module

### Added
- `src/app/dashboard/contacts/page.tsx` — full Contacts module (Client Component)
  - Paginated table: 50/page, ordered by last_name, total count displayed
  - Real-time search (300ms debounce): searches first_name, last_name, email, phone via Supabase `.or()` ilike
  - Filters: contact_type (borrower/realtor/other), stage, lead_source (options auto-populated from live data)
  - Clear filters button appears when any filter is active
  - Table columns: Name, Type (color-coded badge), Phone, Email, Stage, Lead Source, Referred By, Created
  - Click row → 400px fixed slide-out panel with all contact fields (priority fields first, then alphabetical)
  - Edit mode in slide-out: inline inputs/selects/textarea per field type, readonly for created_at/updated_at
  - Save updates Supabase and refreshes row in-place (no full reload), cancel discards changes
  - Bloomberg terminal UI: Bebas Neue header, IBM Plex Mono labels + data, gold #c9a84c accents
  - Row hover and selected states; main content shifts right (paddingRight: 400px) when panel open
- `src/app/dashboard/SidebarNav.tsx` — added CONTACTS nav link (after DASHBOARD, before UPLOAD DOC)

---

## [0.6.0] — 2026-03-08 — Phase 2: Contract Automation

### Added
- `supabase/migrations/003_contract_fields.sql` — adds 14 contract-extracted columns to `loans` table (`sales_price`, `closing_date`, `effective_date`, `option_expiration`, `earnest_money`, `option_fee`, `seller_concessions`, `down_payment_pct`, `estimated_ltv`, `county`, `title_company`, agent/brokerage fields, `contract_data JSONB`); enables `pg_net`; creates `on_contract_document_inserted` trigger that fires n8n webhook only on `doc_type = 'contract'` inserts
- `n8n/prompts/contract-extraction.txt` — Claude system prompt for Texas TREC contract PDF extraction; returns strict JSON schema with 35 fields; field-by-field location guide by page/paragraph
- `n8n/contract-received.workflow.json` — 13-node importable n8n workflow:
  - Webhook trigger → IF filter → Download PDF from Supabase Storage
  - Build + Call Claude API (`claude-opus-4-6`, document content type)
  - Parse Contract Fields (strips markdown fences, calculates derived fields)
  - Update loan record + Log contract.received in parallel
  - Build + Draft party reply email (Outlook draft to adam@thestyerteam.com)
  - Build + Draft borrower welcome email (Outlook draft to adam@thestyerteam.com)
  - Log emails.drafted
- `docs/contract-automation-setup.md` — step-by-step setup guide (migration, n8n import, credential config, placeholder replacements, test instructions, troubleshooting)

---

## [0.5.0] — 2026-03-08

### Added
- `src/app/dashboard/layout.tsx` — fixed 220px sidebar shell (server component); wraps all dashboard routes
- `src/app/dashboard/SidebarNav.tsx` — client component; active route highlighting via `usePathname`
- `src/app/dashboard/build-tracker/page.tsx` — auth-gated iframe → `/docs/loanos.html`
- `src/app/dashboard/system-map/page.tsx` — auth-gated iframe → `/docs/loanos-system-map.html`
- `public/docs/loanos.html` — moved from `docs/`; Phase 1 all 7 items statically green (`'0-6':true`)
- `public/docs/loanos-system-map.html` — moved from `docs/`

### Changed
- `src/app/globals.css` — Bloomberg design tokens (CSS vars: `--bg`, `--surface`, `--surface2`, `--border`, `--gold`, `--text`, `--muted`, `--green`, `--red`); Google Fonts (Bebas Neue + IBM Plex Mono + IBM Plex Sans); `.action-btn:hover` rule
- `tailwind.config.ts` — extended with gold/surface color tokens + display/mono/sans font families
- `src/app/dashboard/page.tsx` — Bloomberg redesign: 4 stat cards (large Bebas Neue numbers), green infra status bar, terminal-style action buttons; removed stale Session panel
- `src/app/dashboard/upload/page.tsx` — Bloomberg aesthetic wrapper (visual only)
- `src/app/dashboard/upload/UploadForm.tsx` — visual redesign (dark inputs, gold dropzone, monospaced labels); all Supabase upload logic preserved exactly

---

## [0.4.0] — 2026-03-08

### Changed
- `src/app/page.tsx` — switched auth from magic link (`signInWithOtp`) to email/password (`signInWithPassword`)
- `netlify.toml` — added `mkdir -p public/docs &&` prefix to prevent cp failure when directory missing

### Fixed
- `src/app/dashboard/upload/page.tsx` — `contacts` type corrected to array (`[]`) — Supabase joins always return arrays
- `src/app/dashboard/upload/UploadForm.tsx` — `loanLabel()` now reads `loan.contacts?.[0]` instead of treating contacts as a single object (TypeScript build error on Netlify)
- Supabase Storage bucket renamed from `DOCUMENTS` to `documents` (bucket names are case-sensitive)

### Manual Steps Completed
- Migration 002 applied in Supabase SQL Editor
- Storage bucket `documents` created with RLS upload + read policies
- Password set via `auth.users` SQL update (bypassed email rate limit)
- Test loan seeded: `INSERT INTO loans (user_id, loan_number, property_address)`

---

## [0.3.0] — 2026-03-08

### Added
- `supabase/migrations/002_documents_metadata.sql` — adds `doc_type` and `uploaded_by` columns to `documents` table
- `src/app/dashboard/upload/page.tsx` — server component: auth-gated, fetches loans, renders UploadForm
- `src/app/dashboard/upload/UploadForm.tsx` — client component: full PDF upload flow
  - Doc type select (Purchase Contract, CD, Pre-Approval Letter, Income, Bank Statements, ID, Other)
  - Existing loan dropdown OR new contact+loan inline creation (first name, last name, loan number)
  - Dashed PDF file picker with name + size preview
  - Uploads to Supabase Storage at `{userId}/{loanId}/{timestamp}_{safeFilename}`
  - Inserts `documents` row + `activity_log` entry
  - Green/red result banner, form resets on success
- Dashboard "Actions" section with Upload Document link

### Manual Steps Required
- Run `002_documents_metadata.sql` in Supabase SQL Editor
- Add Supabase Storage policy: allow authenticated uploads to `{userId}/` prefix in `documents` bucket

---

## [0.2.0] — 2026-03-08

### Added
- `CONTEXT.md` — AI session context file (stack, phase roadmap, env vars, rules, next steps)
- `skills/user/` — 10 user-defined Claude skills cloned from `AStyer8345/adam-styer-skills`
  - content-creator, contract-received, email-best-practices, final-cd-email
  - frontend-design, referral-intro-email, send-rate-update, strategy-advisor
  - weekly-newsletter, weekly-rate-update (+ APR calculations reference)
- `CHANGELOG.md` — this file

### Fixed
- `claude-sonnet-4-6` → `claude-sonnet-4-5-20251022` in `docs/README.md` (×2) and `docs/loanos-system-map.html` (×1)
- devDependencies (`postcss`, etc.) now install correctly — fixed `NODE_ENV=production` blocking dev installs

---

## [0.1.0] — 2026-03-08

### Added
- Next.js 14 app shell (App Router, TypeScript, Tailwind CSS)
- Supabase auth — magic link login
- Protected `/dashboard` route with session middleware
- Supabase Postgres schema — 4 tables: `contacts`, `loans`, `documents`, `activity_log`
- Supabase Storage bucket: `documents`
- Netlify deployment with `@netlify/plugin-nextjs` v5
- `docs/` — `loanos.html` (build tracker) + `loanos-system-map.html` (architecture diagram)
- GitHub repo: `AStyer8345/loanos` on `main`
