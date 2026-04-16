# LoanOS Renovation Plan

> Created: 2026-03-30
> Status: IN PROGRESS
> Rule: Nothing gets deleted. We hide, not destroy. Every feature can be restored.

## Why

LoanOS grew too wide. 39 tables, 51 API routes, 153-column loans table, social dashboards, kids gamification, automation command center, scenario builder — all while the core (see numbers, manage pipeline, follow up with leads, communicate) isn't reliable. Webhooks break, links break, features don't work session to session.

## What Adam Actually Needs (5 Things)

1. **Dashboard** — funded count, volume, commission (MTD + YTD). Clean numbers, no clutter.
2. **Pipeline** — active loans with status, next action, and ability to text/email/call from the row.
3. **Follow-up list** — leads not under contract, sorted by who needs attention, one-click communication.
4. **Contacts** — basic info, activity timeline (merged), referred-by tracking, realtor performance metrics.
5. **Templated emails** — the 6-7 n8n email workflows wired to buttons that actually fire and deliver.

## What Gets Hidden

- Social media dashboard (SOCIAL tab)
- Kids gamification (challenges, kids, responses tables)
- Automation Command Center (replace with simplified Admin Panel — see below)
- ~~Voice Guide tab~~ KEEPING — Adam needs in-app guidance to remember workflows
- MCC state
- Marketing tab (if separate from core)
- Multi-tenant UI complexity (keep in DB, remove from UI)

## What Gets Kept

- Dashboard (simplified)
- Pipeline / Loans views
- Contacts
- AI Chatbot (for adding contacts, quick actions)
- Scenario Builder (close to done — polish in a later phase)
- Voice Guide (helps Adam remember how to use things — improve, don't hide)
- Admin Panel (replaces Automation Command Center — lean version: list automations, edit prompts, see status, no bulk actions/run history bloat)
- Settings (minimal)
- All n8n workflows (running in background as-is)
- All Supabase data (untouched)

## Phases

### Phase 1: Strip the UI
**Goal:** 4 tabs only — Dashboard, Pipeline, Contacts, Settings
**Session:** Next session after this plan is locked in
**Tasks:**
- [x] Strip nav to 7 tabs: Dashboard, Pipeline, Contacts, Scenarios, Voice Guide, Admin, Settings (2026-03-30)
- [x] Removed: Inbox Review, Reports, Marketing dropdown, Beta Waitlist from nav
- [ ] Remove or hide unused page routes (don't delete files)
- [ ] Clean up dashboard to show only: funded MTD/YTD, volume MTD/YTD, commission MTD/YTD, active loan count
- [ ] Remove hot leads / new leads / recent apps widgets if they're broken; keep if they work
- [ ] Verify build passes
- [ ] Deploy and verify on Vercel
- [ ] Adam reviews and confirms

### Phase 2: Make Pipeline Bulletproof
**Goal:** Loans in process with communication built in
**Session:** After Phase 1 confirmed working
**Tasks:**
- [x] Pipeline view: borrower name, status, loan amount, rate, closing, location — already existed, defaults updated (2026-03-30)
- [x] Each row: call, text, email buttons on hover — added actions column (2026-03-30)
- [x] Filter by status: All, In Process, Closed, Pre-Approval, Other — already existed via smart lists
- [x] Color-coded urgency: closing <7d=red, <14d=amber, rate lock expiring — already existed
- [x] Loan detail page: simplified, communication-first (2026-03-31) — removed 729 lines dead code, unified EditableSectionCard layout, KeyDatesGrid with 33 dates from raw_payload, employment in BorrowerProfileCard, descriptive activity summaries in WF1+WF2, contacts.last_activity_date on every sync
- [x] Verify Arive sync — spot-checked 3 loans. Gaps found (2026-03-30):
  - `loan_number` — NEVER populated (big gap)
  - `loan_type`, `loan_program` — NEVER populated (Conv/FHA/VA missing) → **FIXED: loan_program now mapped from lenderProductName**
  - `milestone` — NEVER populated (status works, milestone doesn't)
  - `rate_lock_date` — NEVER populated (expiration works, lock date doesn't)
  - `estimated_closing_date` vs `est_closing_date` — duplicate columns, only est_closing_date used
  - `property_zip` — sometimes string "null" instead of actual NULL
  - **Action needed**: ~~Update Arive sync n8n workflows to map these fields~~ **DONE (2026-03-30)**
- [x] Arive sync overhaul — both n8n workflows updated (2026-03-30):
  - Co-borrower data now flows to contacts (co_borrower_first/last/email/mobile/birthdate) AND loans (co_borrower_name/email/phone/home_phone/work_phone/birthdate/marital_status)
  - Employment data: employer_name, monthly_income, position_description, self_employed
  - Compensation: commission_amount, gross_loan_revenue, net_loan_revenue
  - Loan program mapped from lenderProductName
  - Borrower DOB (partial — month/day from Arive)
  - Agent contacts: buyer's agent and listing agent auto-upserted as realtor contacts with contact_id linked to loan
  - 9 new Supabase columns added via migrations (borrower_birthdate, co_borrower_*, position_description, self_employed, gross/net_loan_revenue)
- [x] Deploy and verify — deployed, READY
- [x] Adam reviews and confirms (2026-04-16)

### Phase 3: Follow-Up List
**Goal:** Never miss a lead or stale borrower
**Session:** After Phase 2 confirmed working
**Design decision (2026-04-16):** Follow-Up lives inside Contacts (per three-pillar rule), NOT as a new top-level tab or Dashboard widget. Surfaced as three smart-list segments in the existing Contacts sidebar, under a new "FOLLOW-UP" section.
**Tasks:**
- [x] Decide placement: Contacts sidebar sub-view (2026-04-16)
- [x] Segments: New Leads (30d), Going Quiet (7–30d), Pre-Approved Still Shopping — shipped in SMART_LISTS (2026-04-16)
  - New Leads: borrower, created ≤30d ago, stage null|Lead|Pre-App|Application
  - Going Quiet: last_activity_date between 7 and 30 days ago; upper cap prevents graveyard
  - Pre-Approved Shopping: stage=Pre-Approved, activity in last 90d
- [x] Dashboard cleanup: removed needs-attention badge + urgent flags section (2026-04-16) — urgency stays in Pipeline row colors from Phase 2
- [x] Lead source visibility on Dashboard: new "New Leads by Source (30d)" chart with AEO detection (ChatGPT/Claude/Perplexity/Copilot/Gemini/you.com/phind/kagi). Existing chart renamed "Closed Business by Source". (2026-04-16)
- [x] Deploy and verify — `dpl_Azdb1VkJH1V9xdXkkKgGkD4C1o3P` READY 2026-04-16
- [ ] Row-level enhancements: when a follow-up segment is active, surface last_activity_date + referred_by prominently + one-click call/text/email (deferred — row already has call/text/email from Phase 2; extra columns can wait until feedback)
- [ ] Smart sort: most urgent first when segment active (deferred — existing user-controlled sort works fine for now)
- [ ] Adam reviews and confirms

### Phase 4: Contacts That Work
**Goal:** See everything about a person in one place
**Session:** After Phase 3 confirmed working
**Tasks:**
- [x] Contact detail: name, phone, email, referred by, type, stage (2026-03-31)
- [x] Merged activity timeline (activity_log + contact_activity in one feed) (2026-03-31)
- [x] Realtor view: referral count, closed count, conversion rate, deal history (2026-03-31)
- [x] Quick-add contact from AI chatbot (verify it works end-to-end) — verified, works with Claude extraction + regex fallback + dedup (2026-03-31)
- [ ] Import from website leads (verify web lead → contact flow)
- [x] Deploy and verify (2026-03-31)
- [ ] Adam reviews and confirms

### Phase 5: Email Templates + Drip
**Goal:** Send real emails with one click, drip campaigns that actually enroll people
**Session:** After Phase 4 confirmed working
**Tasks:**
- [ ] Wire UI buttons to the 6 n8n email workflows (PA, CD, referral intro, refi intake, review request, web lead)
- [ ] Test EVERY email end-to-end: click button → email lands in inbox → links work → content correct
- [ ] Set up 1 working drip campaign with real enrollments
- [ ] Newsletter send flow: test end-to-end including all links
- [ ] Deploy and verify
- [ ] Adam reviews and confirms

### Phase 6: Metrics + Verification
**Goal:** Track what matters, verify everything works
**Session:** After Phase 5 confirmed working
**Tasks:**
- [ ] Metrics dashboard: conversion rate, realtor leaderboard, deals closed/lost, pipeline velocity
- [ ] Full app walkthrough as Adam: every button, every flow, every email
- [ ] Fix anything that breaks
- [ ] Write 1-page "How to Use LoanOS" quick reference
- [ ] Final deploy and confirm

### Known Issue: Arive Sync Gaps
**Adam suspects not all data is coming over from Arive.** Before Phase 2 (Pipeline), audit what fields the Arive webhook actually sends vs what the loans table expects. Map the gaps and fix the sync so pipeline data is complete.

## STAY ON TASK

Adam's instruction: Make the basics bulletproof first. Do not add features, do not scope creep, do not polish things that aren't in the current phase. If something cool comes up, add it to a "Later" list and move on.

## Session Protocol

Every session working on this plan:
1. Read this file first
2. Check which phase we're on
3. Do the work for that phase ONLY
4. Verify it works (build, deploy, click through)
5. Update this file marking tasks complete
6. Adam confirms before moving to next phase
7. Update CONTEXT.md + CHANGELOG.md
8. git add, commit, push

## Paused LoanOS Scheduled Tasks (to re-enable later)
- loanos-enterprise-am / pm
- loanos-crm-am / pm
- loanos-daily
- loanos-knowledge-base
- scenarios-am / pm
- loanos-aesthetics (was already disabled)
- loanos-build-watchdog (was already disabled)
