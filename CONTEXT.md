# LoanOS — AI Context File
> Read this at the start of every session before doing anything.
> Keep this file under 150 lines. Session history → CHANGELOG.md. Why decisions → DECISIONS.md. Open work → TODO.md.

## What This Is

LoanOS is a mortgage intelligence platform built by Adam Styer.
Built for personal production use first. Licensed to other LOs in Phase 4.
Replaces: Jungo CRM, Mortgage Coach, scattered Claude workflows.

## Repo

- GitHub: https://github.com/AStyer8345/loanos
- Branch: main
- Deploy: Vercel (auto on push)
- Version: 8.1.9 (as of 2026-04-05)

## Current Status

**Email Automation Dashboard + n8n → Workflow DevKit Phase 1: shipped through shadow mode (2026-04-15 PM). Renovation Phase 2 complete. Security hardening ~80% complete. Preparing for LO #2 onboarding.**

- Feature branch `feat/email-automation-dashboard` — 20+ commits, all Vercel builds READY through SHA `9583ba3`
- 4 Workflow DevKit workflows live in code: `pre-approval-email`, `pa-welcome-nurture`, `dpa-guide-nurture`, `web-lead-intake`
- Admin dashboard at `/admin/email-automation` (4 panels) + summary card on main `/dashboard` (admin-gated)
- styermortgage.com: unified `lead-intake.js` + UTM hidden fields on 5 forms (`subscribe-lead.js` kept alive as rollback)
- `WORKFLOW_DEVKIT_LEAD_INTAKE=off` by default. Set to `shadow` to start parity logging, then `live` after 7-day review
- Migration 086 (UTM cols + resend_webhook_events) + 087 (workflow_shadow_log) applied to prod Supabase

- Phase 1 (strip UI to 7 tabs) — done 2026-03-30
- Phase 2 (pipeline bulletproof + Arive sync overhaul) — done 2026-04-02
- Multi-tenancy (org-based RLS, NOT NULL hardening, org_id on all tables) — done 2026-03-25
- UI renovation (shadcn/ui, light/dark mode, 300+ color replacements) — done 2026-04-01
- Drip campaigns v1 (4 tables, 7 API routes, 3-level UI, n8n scheduler) — done 2026-04-02
- Share page redesign (12 components, card-based layout, cash-to-close breakdown, PDF via print) — done 2026-04-05
- Dashboard v6.1 (sparklines, funnel, leaderboard, pipeline table, lead sources) — done 2026-04-04
- Lender knowledge system (DB + NotebookLM + dashboard + auto-ingest) — done 2026-04-04
- Security audit: 3 critical + 9 medium gaps identified 2026-04-05
  - Critical #1 Arive webhook multi-tenant — scaffolded (Zapier middleman, shadow mode)
  - Critical #2 Rate limiting — done (web-lead 30/min, share 60/min + 30/token)
  - Critical #3 PII encryption — DONE. Companion table + AES-256-GCM + server read path + backfill (1402/1402) + migration 083 column drop. All 6 plaintext columns dropped 2026-04-12.
  - Critical #4 Admin route audit — done (middleware + per-route gates)
  - Medium: CORS/CSP done, idempotency done, secret rotation runbook done, 3 items remaining (#5 field-level encryption, #9 admin action log, #10 sys vs org admin)

## Blockers for LO #2 Onboarding

1. ~~`extractPayloadIdentity()` in `src/lib/los/verifyLosPayload.ts`~~ — DONE. Function implemented with `loanOfficerEmail` field (confirmed from 2026-04-04 Zapier run on loan 15755447). Verified by daily briefing agent 2026-04-09.
2. ~~Apply migration 075 (`los_integrations`) to Supabase~~ — done 2026-04-08
3. ~~Run PII backfill script (`scripts/backfill-activity-pii.ts`) → then drop plaintext columns~~ — DONE 2026-04-12
4. Security findings #5, #9, #10 from `tasks/security-hardening-critical-gaps.md`

## NEEDS ADAM — Email Automation Cutover (Task 23)

Before flipping `WORKFLOW_DEVKIT_LEAD_INTAKE=live`:

1. **Vercel env vars** (preview + prod): `WORKFLOW_DEVKIT_LEAD_INTAKE=shadow`, `DEFAULT_ORG_ID`, `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET`, `LOANOS_ADMIN_EMAIL`, `LOANOS_FROM_EMAIL`, `N8N_API_BASE`, `N8N_API_KEY`
2. **Netlify env vars** (verify already set): `LOANOS_URL`, `LOANOS_AGENT_SECRET`, `MAILCHIMP_BORROWER_LIST_ID`, `MAILCHIMP_API_KEY`
3. **Resend dashboard**: configure webhook endpoint → `https://loanos.vercel.app/api/resend-webhook`, subscribe to email.{sent,delivered,bounced,complained,opened,clicked}
4. **Merge feature branch**: review `feat/email-automation-dashboard` PR. Two duplicate commits (`09816c0` cancelled-loan fix, `9684d05` n8n-proxy) already landed on main via separate deploys — will no-op diff on merge.
5. **Set `WORKFLOW_DEVKIT_LEAD_INTAKE=shadow`** and let it run 7 days minimum.
6. **Parity review**: SQL diff `workflow_shadow_log` rows against n8n execution history for same window. Must be ≥100% classification match and ≥100% enrollment decision match. Zero sends from Workflow DevKit during shadow.
7. **Cutover**: flip `live`, pause Mailchimp PA/DPA journeys, archive 4 n8n workflows (`PiuIsQpBuydtFM4m`, `rwi3qEYgJKGGHkHc`, `0M8Vnf6MhB1xtaIg`, `utMvZpkdRwIRZ51u`), record cutover_date + kill_date (= cutover + 61d) in DECISIONS.md.

**Note:** Microsoft Graph / Azure AD was removed mid-session (2026-04-15 PM) — Outlook sends were swapped to Resend after Adam hit an unresolvable 2FA block creating the Azure account. All workflow emails now flow through the single Resend provider (already DKIM-verified for styermortgage.com).

See `tests/workflows/smoke-checklist.md` for full manual smoke plan.

## Recent Fixes (2026-04-12)

- **Trigger crash fix** (2026-04-12 PM): Migration 085 — `enrich_activity_log_contact()` referenced dropped columns (`from_address`, `to_address`), breaking ALL `/api/activity` POSTs since migration 083. Replaced with no-op `RETURN NEW`. Also fixed NULL logic bug in guard clause.
- **iMessage pipeline silent failure** (2026-04-12 PM): n8n workflow `nccX5ml82mMGyE9T` had 2 silent failure modes — "Find Active Loan" HTTP Request returning 0 items (killing downstream), and Code node not checking HTTP status on POST. Both fixed. 2 lost iMessages replayed.
- **Notes + Activity separation** (2026-04-12): Migration 084 — dedicated `notes` table, `event_type` column on `activity_log`, 19 notes migrated, 1404 event_types backfilled. Loan + contact detail pages now have separate Notes and Activity tabs. Notes: create/edit/soft-delete. Activity: read-only timeline with event-type icons (10 categories). iMessage events render with match_method badges. Unmatched page extended to include iMessages.
- **iMessage integration** (GOALS.md #4): n8n workflow `nccX5ml82mMGyE9T` captures both inbound AND outbound iMessages. Outbound: `imessage.sent` action, `imessage_sent` event_type, cyan icon in UI. `imessage-sync.py` runs every 5 min via launchd, deployed at `~/.local/bin/`. 137+ entries captured.
- **Inbound email rendering**: `email.received` entries show From + Subject with green icon in activity feed.
- **Migration 075 (`los_integrations`)**: Applied to live Supabase (2026-04-08).
- **Social drafts**: Weeks 1-3 (Posts 1-21) rebuilt from build reports and inserted into `social_drafts`.
- **Suburb quick-form tracking**: Fixed `generate_lead` + `thank_you_page_view` gap on styermortgage.com suburb pages.
- **Blog slug rename**: temp-placeholder posts converted to meta-refresh redirects to canonical URLs.
- **Contact schema research**: Q2-Q8 answered in `tasks/crm/research/2026-03-25-contact-data-architecture.md`.

## Active n8n Workflows

See `memory/tools/n8n.md` for full index. Key ones:
- WF1 `1tagvoU0UXtdDiMY` — Arive New Loan → Supabase (active)
- WF2 `9JyzzwKac8v3uQ7d` — Arive Status Update → Supabase (active)
- Drip Scheduler `LqBb3YDLjS2eUrDE` — daily 7am CT, 16 nodes (active)
- Lender Ingest `hHXpKUirhnBCnQTO` — daily 8am CT, Outlook → Claude → Supabase (active)

## Key Architecture

- **Stack:** Next.js 14 (App Router), Supabase (auth + DB + storage), Tailwind, Vercel
- **Tenant isolation:** `org_id` on every table, RLS policies, `get_my_organization_id()` SECURITY DEFINER helper
- **Auth:** Supabase Auth (email/password), middleware gates `/dashboard/*`
- **Webhook security:** 3-layer (slug + hashed secret + payload allowlist), shadow/enforce mode
- **PII:** `activity_log_pii` companion (AES-256-GCM). Read path decrypts server-side via `GET /api/activity`. Plaintext columns dropped (migration 083).
- **Notes:** Dedicated `notes` table with RLS. API: `/api/notes` (POST/GET), `/api/notes/[id]` (PATCH/DELETE soft-delete). Components: `NoteInput`, `NoteCard`.
- **Share page:** `src/components/share/` — 12 borrower-facing components. PDF = share page + `@media print` + `?print=1`.
- **AI chat:** Multi-round tool use (max 4 rounds), tools: lender DB, mortgage knowledge base, contact lookup, loan lookup

## Key Files & Docs

| File | Purpose |
|------|---------|
| `CHANGELOG.md` | Session-by-session changes (the detailed history that used to live here) |
| `DECISIONS.md` | Architecture decisions with reasoning and alternatives |
| `TODO.md` | Prioritized open work |
| `tasks/ADAM-TODO.md` | Granular action items requiring Adam |
| `tasks/security-hardening-critical-gaps.md` | Security tracker (pre-LO #2) |
| `audits/SECURITY-AUDIT-2026-04-05.md` | Full audit findings (A-1 through A-12, S-1 through S-4, M-1, F-1) |
| `LOANOS_SYSTEM_KNOWLEDGE_BASE.md` | Product truth — features, schema, security posture |
| `RENOVATION-PLAN.md` | Master renovation plan (hide-don't-delete philosophy) |
| `docs/THEME.md` | UI theme spec — colors, components, borders |
| `docs/security/secret-rotation-runbook.md` | Rotation procedures for every secret |
| `/skills/user/` | 10+ user-defined Claude skills |

## Social Media Agent Status
<!-- Social media agent updates these three fields each session. Replace, never append. -->

**Last worked on:** 2026-04-15 AM — Step 1B: rates/2026-04-14.html distributed (GBP auto-posted Publer 69df3eb9ac618bd4f8df9b90, FB/IG/LI drafted for approval). Week 28 built (Posts 152-156, Sep 16-22): 2 LI + 1 IG + 2 FB. 2 authority (TIMELY FOMC Sep 16 + hot-take) / 2 education / 1 personal Reel. Avg 8.0/10. All APPROVED. QA 5/5 PASS. Post 152 TIMELY FOMC: 6 placeholders, NMLS #513013, Refresh fills Sep 16 after 2 PM ET, Adam approves by 5 PM CDT. NotebookLM CLI 6th consecutive timeout.

**Active blockers:** BLOCKER-LOANOS-001 (selfies not uploaded — LoanOS stream paused). Post 152 TIMELY FOMC: Adam approve ~Sep 16. Post 147 TIMELY CPI: Adam approve ~Sep 10. Post 145 TIMELY Jobs: Adam approve ~Sep 4. Post 140 TIMELY PCE: Adam approve ~Aug 29. Rate update FB/IG/LI drafts (Apr 14 rates): awaiting approval in dashboard.

**What's next:** Week 29 build (Posts 157-161, Sep 23-29). Authority/education emphasis continues. Pull back personal (2 in Wks 27-28). Reel queue — Adam needs to film Post 155 by Sep 19. NotebookLM CLI check — 6th consecutive timeout.


## Lead Gen Agent Status
<!-- Lead gen agent updates these three fields each session. Replace, never append. -->

**Last worked on:** 2026-04-15 AM — Blocker verification + homepage form test + lead scoring spec. Set Rate RESOLVED (6.37%, called 2026-04-14 — first ever). Seq A verified functional (6.37% > 6.00% threshold → exits cleanly). Homepage forms confirmed live (Quick Quote + Quick Contact wired via commit 1bb1ef1). Lead scoring spec complete: `tasks/lead-gen/specs/2026-04-15-lead-scoring-spec.md` — 6 signals, 4 tiers, data model options, n8n build plan, 3 Adam decisions needed. NotebookLM: 2 sources added (65 total — over 50 cap, PM curate needed).

**Active blockers:** (1) Seq C INACTIVE — Outlook cred (7th session). (2) Calendly INACTIVE — webhook not wired. (3) Mailchimp journeys not built (pack ready). (4) Seq D — copy approval required. (5) Calendly HMAC signing key needed for security hardening.

**What's next:** Build lead scoring system (spec ready, need Adam decisions on threshold/SMS/data model). Seq A threshold review (6.00% vs 6.25% — adjust if Adam confirms). Calendly HMAC node (needs signing key first).

## SEO/SEM Agent Status
<!-- SEO/SEM agent updates these three fields each session. Replace, never append. -->

**Last worked on:** 2026-04-14 PM — NotebookLM PUSH+CURATE. Daily-opt session committed: 6 title standardizations, WCAG contrast fix + ARIA + WebP (commit 1879e10), PA/DPA webhook triggers, rate page 2026-04-14.html. Notebook: 3 removed (stale CONTEXT.md, Apr13 pull, audit-Apr13), 3 added (fresh CONTEXT.md, audit-Apr14, web.dev/learn/accessibility). 50/50. Digest SENT (Zapier success).

**Active blockers:** GSC URL Inspection for 5 suburbs (Adam — Dripping Springs, Round Rock, Cedar Park, Leander, Georgetown). Liberty Hill page unique content still unwritten. Temp placeholder blog post still at wrong slug.

**What's next:** Liberty Hill suburb page (MUD districts, Liberty Hill ISD, Orchard Ridge/Santa Rita Ranch). Internal link pass → hutto-mortgage-lender.html from 3-4 related pages. Lighthouse a11y audit post-WCAG/WebP deploy.

## Scenarios Agent Status
<!-- Scenarios agent updates these three fields each session. Replace, never append. -->

**Last worked on:** 2026-04-15 AM — Tier 6 launch. DetailAccordion cleanup (removed "Full Scenario Comparison" item, auto-hides without horizon data). Pre-generated Borrower Q&A: migration 086 (borrower_qa JSONB), new `/api/scenarios/generate-qa` route (authenticated, idempotent), new `BorrowerQA.tsx` accordion component (print:hidden), fire-and-forget trigger in ActionsBar. Commit 70bd469 | Vercel BUILDING.

**Active blockers:** None.

**What's next:** Mobile builder quick-input form (LO at the table on phone — rate/term/price/down only). Backfill Q&A for existing scenarios (admin button or script).

## Standup Agent Status
<!-- Standup agent updates these three fields each session. Replace, never append. -->

**Last worked on:** 2026-04-15 — Day 21 standup. n8n: 33 total, 29 active (+2: PA Welcome + DPA Guide nurture workflows live). CD & Contract Extractor `HkLjsnnhT5MgrX5H` still active=true but untested — Outlook cred unverified. Vercel unverifiable (OAuth required in automated session); last known READY. Post 39 due TODAY. Security: 0 CRITICAL, 3 MEDIUM open.

**Active blockers:** Marketing demo data zero progress (11 days to May 1 — HIGHEST RISK). Phase 2 Adam confirmation outstanding 7+ sessions (blocks Phase 3). CD & Contract Extractor needs execution test. Seq C INACTIVE (Outlook cred, 7+ sessions). Post 39 approval due today.

**What's next:** Marketing demo data cleanup (start this week or May 1 misses). CD & Contract Extractor execution test. Phase 2 Adam confirmation escalation.

## Rules For AI Sessions

- **UI changes**: Prefer `docs/THEME.md` + text spec. Don't require screenshots.
- Always read this file before starting
- Always update this file when something significant changes (keep it short — details go in CHANGELOG)
- Always update CHANGELOG.md at end of session
- Always update the build tracker (`/public/docs/loanos.html`) at end of session
- At end of session: update CONTEXT.md, commit, push to main
- Never break styer-mortgage-site tools
