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
Deploy: Netlify (not Vercel)

## Current Status

Phase 1 complete. Phase 2 (Automation) in progress — contract pipeline built and debugged as of March 8, 2026.

### Phase 1 (complete)
- Supabase connected
- Auth: email/password — switched from magic link
- 4 tables live: contacts, loans, documents, activity_log
- Supabase Storage bucket: `documents` (must be lowercase — case-sensitive)
- PDF upload end-to-end verified: Storage → documents row → activity_log
- Next.js 14 deploying to Netlify (deploy fixes applied)
- HTML docs moved to `public/docs/` — served by Next.js at `/docs/*.html`
- /dashboard/build-tracker: auth-gated iframe → /docs/loanos.html
- /dashboard/system-map: auth-gated iframe → /docs/loanos-system-map.html
- Bloomberg terminal × modern SaaS redesign: Bebas Neue + IBM Plex Mono/Sans, gold accent (#c9a84c), dark surface palette

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
- Hosting: Netlify
- Database: Supabase (Postgres)
- Auth: Supabase email/password
- File Storage: Supabase Storage (bucket: documents)
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

### loanos repo (Netlify — add as you build)
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY

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

- Phase 1 (COMPLETE): Foundation — Supabase schema, auth, PDF upload, basic dashboard
- Phase 2 (IN PROGRESS): Automation — n8n workflows, contract/CD/pre-approval extraction, Outlook drafts
- Phase 3: Calculator Suite — 6 calculators replacing Mortgage Coach, Claude narratives
- Phase 4: SaaS — multi-tenant RLS, Stripe billing, white-label, license to LOs

## Calculator Suite (Phase 3 — replaces Mortgage Coach)

1. Loan Scenario Comparator
2. Refi Analyzer
3. Rent vs. Buy
4. Total Cost of Homeownership
5. Max Purchase Price
6. Buy Now vs. Wait

Key differentiator: Claude API generates plain-English narrative per scenario.
Output: branded PDF or shareable link integrated with Supabase loan records.

## Key Decisions Made

- Zapier → replaced by n8n
- Jungo → replaced by LoanOS CRM
- Mortgage Coach → replaced by calculator suite
- Netlify Blobs → migrating to Supabase
- Vercel → NOT used, Netlify only
- Build for yourself first, license to LOs in Phase 4

## Active Automations

> Living document — every new workflow deployed must be added here, to the automations page, and to CHANGELOG.md.

| Workflow | n8n ID | Webhook Path | Trigger |
|---|---|---|---|
| Final CD Email | SkzrWeR0bHZs8kWX | loanos-final-cd | Upload CD PDF |
| Pre-Approval Email | utMvZpkdRwIRZ51u | loanos-pre-approval | Upload PA letter PDF |
| Referral Intro Email | YbgDnTpPdefcazKy | loanos-referral-intro | Paste referral details |
| New Application Received | cWESnXXy9UOLB13q | loanos-new-application | 1003 PDF in Supabase storage |

- All 4 trigger via Supabase pg_net or manual webhook POST
- All output to Outlook drafts via n8n
- Trigger buttons LIVE — clicking opens TriggerModal (PDF drop zone or form fields)

## What To Build Next

### Phase 2 — Automation (in progress)
- ✅ Contract automation: n8n pipeline for contract extraction + Outlook drafts
- ✅ **Automations dashboard page** — `/dashboard/automations` live as of 2026-03-09
  - Visual cards for all 4 active workflows: Final CD, Pre-Approval, Referral Intro, New Application
  - Pipeline flow diagram per card: Trigger → Claude AI → Outlook → Review
  - Animated flow dot, status badges, hover meta-reveal (n8n ID + webhook path)
  - **Trigger buttons LIVE ✅** (2026-03-09) — `TriggerModal` component added; PDF workflows use FormData POST, Referral uses JSON POST; all POST to `https://styer.app.n8n.cloud/webhook/{webhookPath}`
- CD extraction workflow (similar pattern to contract)
- Pre-approval extraction workflow
- Arive webhook integration (planned)

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
- This file: /CONTEXT.md
- Changelog: /CHANGELOG.md

## Rules For AI Sessions

- Always read this file before starting
- Always update this file when something significant changes
- Always update CHANGELOG.md at end of session
- At end of every session: update CONTEXT.md and push to main with everything changed that session
- Never break styer-mortgage-site tools
- Never use Vercel
- Ask Adam before making architectural decisions not covered here
