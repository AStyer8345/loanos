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

Phase 1 complete. Phase 2 (Automation) ~90% complete — all major features built, several pending go-live steps.
816 Arive loans imported and backfilled as of March 10, 2026. Salesforce CSV backfill complete (2026-03-12) — 532 loans updated with `arive_loan_id` + additional fields from Salesforce export.
AI Chat fully live as of March 11, 2026 — contact context working, clear button fixed. Outlook Email integration built — needs manual deploy steps to go live.
Agent 5 (Loan Milestone Communication Agent): n8n workflow live (ID: 1hjOmS7inZcxEJQr), Zapier Zap published, auth middleware fixed (`/api/agents/*` excluded) — needs migration 010 + Vercel env vars to fully activate. Agent 1 (Daily Briefing): ESLint build errors fixed (commit 34d4c81), deploying to Vercel — visible in sidebar as first nav item.
ARIVE webhook integration + Jungo CSV backfill + DB field expansion complete (2026-03-11). Migrations 011 + 012 need to be run in Supabase SQL Editor. Netlify/Vercel webhook endpoints need ARIVE_WEBHOOK_SECRET + LOANOS_SYSTEM_USER_ID env vars. Contact detail view: phone_mobile display row + inline notes editing with save-on-blur.
v1.9.0 deployed to Vercel (2026-03-12).

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
- ✅ Dashboard with stat cards
- ✅ Bloomberg terminal UI → Linear/Attio light mode redesign

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

**Not Yet Built 🚧**
- 🚧 **CD extraction workflow** — same n8n pattern as contract pipeline, Claude extracts Closing Disclosure fields
- 🚧 **Pre-approval extraction workflow** — same pattern, Claude extracts PA letter fields
- 🚧 **Rate update publisher migration** — move from styer-mortgage-site Netlify to LoanOS native
- 🚧 **Activity auto-log** — automatic activity_log entries from key CRM actions (stage changes, notes, calls)
- 🚧 **Marketing page light mode** — still using Bloomberg/gold CSS vars, needs migration to emerald/Inter theme

### Phase 3 — Calculator Suite (replaces Mortgage Coach)

Key differentiator: Claude API generates plain-English narrative per scenario.
Output: branded PDF or shareable link integrated with Supabase loan records.

- [ ] Loan Scenario Comparator
- [ ] Refi Analyzer
- [ ] Rent vs. Buy
- [ ] Total Cost of Homeownership
- [ ] Max Purchase Price
- [ ] Buy Now vs. Wait

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
| Arive → Supabase (direct) | Next API (`/api/arive-webhook`) | arive-sync (n8n) | Arive POST → n8n orchestrator → `/api/arive-webhook` → Supabase |
| Closed Loan Review Request | AK1fBcaX1cPcdlGx | — (scheduled) | Every 30 min — polls Supabase for loans closed 2+ days ago |
| Weekly Testimonial Social Post | eJG4wckrj6SmSpm1 | — (scheduled) | Mondays 9am CT — reads Google Sheet, Gemini caption + image, posts via Publer |
| Loan Milestone Communication | 1hjOmS7inZcxEJQr | /api/agents/milestone | Arive milestone event → LoanOS Claude → Zapier → Outlook drafts (borrower + realtor) |

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
- This file: /CONTEXT.md
- Changelog: /CHANGELOG.md

## Rules For AI Sessions

- Always read this file before starting
- Always update this file when something significant changes
- Always update CHANGELOG.md at end of session
- **Always update the build tracker** (`/public/docs/loanos.html`) at end of every session — mark completed tasks and add any new items not already on the roadmap
- At end of every session: update CONTEXT.md and push to main with everything changed that session
- Never break styer-mortgage-site tools
- Deployed on Vercel (switched from Netlify 2026-03-11)
- Ask Adam before making architectural decisions not covered here
