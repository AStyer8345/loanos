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

**Renovation Phase 2 complete. Security hardening ~80% complete. Preparing for LO #2 onboarding.**

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
  - Critical #3 PII encryption — Phase 1+2 done (companion table + AES-256-GCM + server read path). Phase 3 (backfill + column drop) pending.
  - Critical #4 Admin route audit — done (middleware + per-route gates)
  - Medium: CORS/CSP done, idempotency done, secret rotation runbook done, 3 items remaining (#5 field-level encryption, #9 admin action log, #10 sys vs org admin)

## Blockers for LO #2 Onboarding

1. ~~`extractPayloadIdentity()` in `src/lib/los/verifyLosPayload.ts`~~ — DONE. Function implemented with `loanOfficerEmail` field (confirmed from 2026-04-04 Zapier run on loan 15755447). Verified by daily briefing agent 2026-04-09.
2. ~~Apply migration 075 (`los_integrations`) to Supabase~~ — done 2026-04-08
3. Run PII backfill script (`scripts/backfill-activity-pii.ts`) → then drop plaintext columns
4. Security findings #5, #9, #10 from `tasks/security-hardening-critical-gaps.md`

## Recent Fixes (2026-04-09)

- **Activity log + notes** (GOALS.md #1): Fully working. Migration 081 (`contact_activity`) live with RLS. Duplicate entries fixed — `updateLastTouch()` echo actions filtered from system feed.
- **iMessage integration** (GOALS.md #4): n8n workflow `nccX5ml82mMGyE9T` updated — writes `contact_id`, `loan_id`, `occurred_at` to columns (was metadata-only). 126 entries backfilled. Blue icon + snippet in UI.
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
- **PII:** Dual-write to `activity_log` (inline) + `activity_log_pii` (AES-256-GCM encrypted companion). Read path decrypts server-side via `GET /api/activity`.
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

**Last worked on:** 2026-04-11 AM — FHA blog (2026-04-10) distributed: GBP auto-published via Publer, FB/IG/LI drafted to social_drafts. Week 20 built (Posts 112-116, July 22-28): 2 LI + 2 IG + 1 FB, avg quality 7.8/10, all approved, QA 5/5 PASS. Pillar: RT(2)+Personal(2)+Education(1). Post 115 picks up FHA blog Tier 2 carousel (PMI vs MIP). content-repost-queue FHA entry → Completed.

**Active blockers:** BLOCKER-LOANOS-001 (selfies not uploaded — LoanOS stream still paused). Posts 29+30 Liberation Day: decision due April 28 (17 days). Post 39: Adam approve before April 15 (4 days).

**What's next:** Week 21 build (Posts 117-121, July 29 – Aug 4). Consider 1 TIMELY for Fed decision (July 29-30 FOMC). Adam: upload selfies, approve Post 39, decide Posts 29+30 by April 18.


## Lead Gen Agent Status
<!-- Lead gen agent updates these three fields each session. Replace, never append. -->

**Last worked on:** 2026-04-11 AM — Seq D org_id bug fixed (all 3 nodes corrected via REST API). End-to-end verification: Set Rate webhook never called — zero `refi_rate_update` entries in activity_log. Seq A active but idle (no rate to check). Seq C still INACTIVE (Adam hasn't activated yet).

**Active blockers:** Set Rate webhook never called — Seq A won't fire until Adam POSTs current rate (`curl -X POST .../webhook/refi-watch-set-rate -d '{"rate": 6.39}'`). Seq C still INACTIVE — Adam must connect Outlook credential + activate.

**What's next:** Confirm Set Rate called next session (check activity_log). Seq C activation check. If Set Rate + Seq C still unresolved after 2 more sessions, consider pivoting to Mailchimp Customer Journeys (largest unbuilt lead gen piece).

## SEO/SEM Agent Status
<!-- SEO/SEM agent updates these three fields each session. Replace, never append. -->

**Last worked on:** 2026-04-10 PM — NotebookLM PUSH+CURATE. AM session: AEO optimization on doc checklist (answer-first paragraph + 2 H2 rewrites), city enrichment for New Braunfels + Lakeway (15/25 suburb pages complete), FHA Loan Requirements Texas 2026 blog post published (3 social drafts queued), GSC stale indexing flag removed (suburb pages confirmed indexed). Notebook: 2 removed (404 FHA URL added before page was live, superseded Apr 8 audit), 1 added (audit-2026-04-10.md). 50/50. Digest SENT (Zapier success).

**Active blockers:** GSC 90-day export overdue — keyword prioritization inference-based. FHA blog URL removed from notebook (was 404 at indexing time — re-add once page is confirmed indexed). Liberty Hill + Elgin are 2 remaining suburb pages without at-a-glance enrichment.

**What's next:** City enrichment for Liberty Hill + Elgin (2 remaining — completes 25/25). Verify FHA blog deploy on Netlify + re-add to notebook. GSC April 10 window: check "How to Choose a Lender" impressions (published Apr 1). Adam: pull GSC export.

## Scenarios Agent Status
<!-- Scenarios agent updates these three fields each session. Replace, never append. -->

**Last worked on:** 2026-04-11 AM — Scenario naming affordance. Both ScenarioCard variants now show a gold pencil icon on hover next to the label. Click opens inline edit input with placeholder fallback. Label saves to `scenarios_data` JSON and renders on share page + PDF column headers (already wired). Tier 5 item 3 COMPLETE. Commit 7648a9a | Vercel dpl_FpVDzNMBG1H9T4hBSsWNurM3s43U → READY.

**Active blockers:** None.

**What's next:** Comparison table on share page (Tier 5 item 2) — persistent side-by-side data table below OptionCardsGrid. Refi builder pre-fill (Tier 5 item 4) also queued.

## Standup Agent Status
<!-- Standup agent updates these three fields each session. Replace, never append. -->

**Last worked on:** 2026-04-11 — Day 17 standup. Vercel READY (dpl_2BWFuqf8U8u8DD5ooswbhRoNMgHr). PII Deploy #2 shipped: activity_log no longer receives inline PII; verify-live-decrypt helper added; Publer publish backlog closed. n8n: 26/29 active, 3 intentionally inactive. CD & Contract Extractor still INACTIVE (GOALS.md #2 unstarted). PII backfill still not run.

**Active blockers:** GOALS.md #2 (email automation) — CD & Contract Extractor `HkLjsnnhT5MgrX5H` inactive, zero progress. PII backfill not run (blocks column drop + Critical #3 close). Set Rate webhook never called (Seq A idle). Adam: Phase 2 confirmation, selfies upload, Seq C activation, Post 39 approval (due April 15).

**What's next:** PII Phase 3 (run backfill → verify-live-decrypt → migration 083 column drop). Then activate CD & Contract Extractor. Adam must confirm Phase 2 to unblock Renovation Phase 3.

## Rules For AI Sessions

- **UI changes**: Prefer `docs/THEME.md` + text spec. Don't require screenshots.
- Always read this file before starting
- Always update this file when something significant changes (keep it short — details go in CHANGELOG)
- Always update CHANGELOG.md at end of session
- Always update the build tracker (`/public/docs/loanos.html`) at end of session
- At end of session: update CONTEXT.md, commit, push to main
- Never break styer-mortgage-site tools
