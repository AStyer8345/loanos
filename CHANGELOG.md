# LoanOS Changelog

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
