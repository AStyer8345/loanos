# LoanOS Changelog

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
