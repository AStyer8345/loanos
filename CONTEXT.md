# LoanOS — AI Context File
> Read this at the start of every session before doing anything.
> Keep this file under 150 lines. Session history → CHANGELOG.md. Why decisions → DECISIONS.md. Open work → TODO.md.

## What This Is

LoanOS is a mortgage intelligence platform built by Adam Styer.
Built for personal production use first. Licensed to other LOs in Phase 4.
Replaces: Jungo CRM, Mortgage Coach, scattered Claude workflows.

## Current Phase
<!-- Read by loanos-autonomous routine. ONE line. Update when phase shifts. -->
**Email Automation Cutover (Task 23) + Security Findings #5/#9/#10 + Marketing Demo Data Prep (May 1 critical path)**

## Repo

- GitHub: https://github.com/AStyer8345/loanos
- Branch: main
- Deploy: Vercel (auto on push)
- Version: 8.1.9 (as of 2026-04-05)

## Current Status

**Email Automation Dashboard + n8n → Workflow DevKit Phase 1: shipped through shadow mode (2026-04-15 PM). Renovation Phase 2 complete. UI consolidated for LO #2 onboarding (2026-04-16 PM late-4). Security hardening complete (#9 + #10 shipped 2026-04-16 autonomous). Security findings #5 remains (ADAM-BLOCKED — GLBA attorney). 2026-04-17 autonomous: demo data polished (screenshot-ready), n8n blank email fix deployed. 2026-04-18 PM: Analytics dashboard (`/dashboard/analytics`) shipped — pipeline health, source conversion, realtor scoreboard, AEO vs SEO, Past Client lead source; commit `56db9d4`, Vercel `dpl_E4g57GkXnqQfYUrz2hWWnhyh42Tq` READY.**

- 2026-04-16 PM (late-4): UI consolidation — TopNav 9 tabs → 4 + More + ⚙ (Email pillar consolidates drip-campaigns/drafts/automations under one tab). Drip scheduler n8n `LqBb3YDLjS2eUrDE` archived (option (a) of TODO #18); banner added on `/dashboard/drip-campaigns`. Mini Pipeline Table cut from dashboard (duplicate of Pipeline tab). Live in `dpl_BdBkGhQjmFf4itLRiZpXb3EN2tMP` (READY 75s). New three-pillar rule in memory: Contacts / Pipeline / Drip = the only first-class surfaces.
- Feature branch `feat/email-automation-dashboard` — 20+ commits, all Vercel builds READY through SHA `9583ba3`
- 4 Workflow DevKit workflows live in code: `pre-approval-email`, `pa-welcome-nurture`, `dpa-guide-nurture`, `web-lead-intake`
- 2026-04-16 PM: nurture content filled — 14 authored bodies (6 PA / 8 DPA) now in-file via `EMAILS` arrays + new `renderDripHtml` helper; stub `<p>${subject}</p>` placeholders gone
- 2026-04-16 PM (late-2): `automation_registry` 7/7 populated — all transactional templates now `email_mode='fixed_template'` with real HTML + `{{var}}` merge tags. Editor at `/dashboard/automations` no longer shows empty boxes. Final CD TRID 3-day framing + wire-fraud warning preserved verbatim. Runtime wiring still TODO (templates are read-only previews today).
- 2026-04-16 PM (late-3): `automation_registry` now 8/8 with subjects. Schema: `+subject_template` column, unique index widened to include `source_node_id`. New row `Contract Received — Party Reply`. Set Rate webhook (`3iXImUkjgMitpJKt`) fully repaired — from_address/subject removed from body + pre-existing Validate Rate `return [{json}]` bug fixed. MCP `execute_workflow` 5175 success, row `9b3a765d` landed clean. Manual rate updates can use `curl` again.
- Admin dashboard at `/admin/email-automation` (4 panels) + summary card on main `/dashboard` (admin-gated)
- styermortgage.com: unified `lead-intake.js` + UTM hidden fields on 5 forms (`subscribe-lead.js` kept alive as rollback)
- `WORKFLOW_DEVKIT_LEAD_INTAKE=off` by default. Set to `shadow` to start parity logging, then `live` after 7-day review
- Migration 086 (UTM cols + resend_webhook_events) + 087 (workflow_shadow_log) applied to prod Supabase

- Phase 1 (strip UI to 7 tabs) — done 2026-03-30
- Phase 2 (pipeline bulletproof + Arive sync overhaul) — done 2026-04-02, Adam-confirmed 2026-04-16
- Phase 3 (Follow-Up segments in Contacts + Dashboard lead-source overhaul with AEO detection + clickable drill-down + LeadSourceSelect dropdown) — shipped 2026-04-16 (final deploy `dpl_AKhAtzUsqeQNyG3MME1dYrTuFdJv`), awaiting Adam review. Also fixed stale `outputFileTracingIncludes` config that broke local builds for ~6 hours.
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
  - Medium: CORS/CSP done, idempotency done, secret rotation runbook done, #9 admin action log DONE (migration 088 + `logAdminAction()` + 3 routes wired, `dpl_2SERCMokPK4QHEDG32NeVkzdftgr`), #10 sys vs org admin DONE (`requireOrgAdmin()` added), #5 field-level encryption ADAM-BLOCKED (GLBA attorney)

## Blockers for LO #2 Onboarding

- Security finding #5 (SSN/DOB/income field-level encryption) — ADAM-BLOCKED, needs GLBA attorney consultation before scope can be defined. #9 and #10 cleared 2026-04-16.

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

## Recent Fixes

See CHANGELOG.md for full fix history. Key recent: migration 085 (trigger crash), notes/activity separation (migration 084), iMessage pipeline (silent failures fixed), PII encryption complete (migration 083 column drop).

## Active n8n Workflows

See `memory/tools/n8n.md` for full index. Core active: Arive→Supabase (`1tagvoU0UXtdDiMY`, `9JyzzwKac8v3uQ7d`), Lender Ingest (`hHXpKUirhnBCnQTO` daily 8am). Drip Scheduler (`LqBb3YDLjS2eUrDE`) archived 2026-04-16 PM pending WDK migration of the 6 campaigns.

## Key Architecture

- **Stack:** Next.js 14 (App Router), Supabase (auth + DB + storage), Tailwind, Vercel
- **Tenant isolation:** `org_id` on every table, RLS policies, `get_my_organization_id()` SECURITY DEFINER helper
- **Auth:** Supabase Auth (email/password), middleware gates `/dashboard/*`
- **Webhook security:** 3-layer (slug + hashed secret + payload allowlist), shadow/enforce mode
- **PII:** `activity_log_pii` companion (AES-256-GCM). Read path decrypts server-side via `GET /api/activity`. Plaintext columns dropped (migration 083).
- **Notes:** `notes` table + RLS. API `/api/notes`. Components: `NoteInput`, `NoteCard`.
- **Share page:** `src/components/share/` — 12 components. PDF via `@media print` + `?print=1`.
- **AI chat:** Multi-round tool use (max 4 rounds), tools: lender DB, knowledge base, contact, loan lookup

## Key Files & Docs

Key files: `CHANGELOG.md` (history), `DECISIONS.md` (arch), `TODO.md` (open work), `tasks/ADAM-TODO.md` (Adam queue), `tasks/security-hardening-critical-gaps.md` (security tracker), `LOANOS_SYSTEM_KNOWLEDGE_BASE.md` (product truth), `docs/THEME.md` (UI spec)

## Social Media Agent Status
<!-- Social media agent updates these three fields each session. Replace, never append. -->

**Last worked on:** 2026-04-15 AM — Step 1B: rates/2026-04-14.html distributed (GBP auto-posted Publer 69df3eb9ac618bd4f8df9b90, FB/IG/LI drafted for approval). Week 28 built (Posts 152-156, Sep 16-22): 2 LI + 1 IG + 2 FB. 2 authority (TIMELY FOMC Sep 16 + hot-take) / 2 education / 1 personal Reel. Avg 8.0/10. All APPROVED. QA 5/5 PASS. Post 152 TIMELY FOMC: 6 placeholders, NMLS #513013, Refresh fills Sep 16 after 2 PM ET, Adam approves by 5 PM CDT. NotebookLM CLI 6th consecutive timeout.

**Active blockers:** BLOCKER-LOANOS-001 (selfies not uploaded — LoanOS stream paused). Post 152 TIMELY FOMC: Adam approve ~Sep 16. Post 147 TIMELY CPI: Adam approve ~Sep 10. Post 145 TIMELY Jobs: Adam approve ~Sep 4. Post 140 TIMELY PCE: Adam approve ~Aug 29. Rate update FB/IG/LI drafts (Apr 14 rates): awaiting approval in dashboard.

**What's next:** Week 29 build (Posts 157-161, Sep 23-29). Authority/education emphasis continues. Pull back personal (2 in Wks 27-28). Reel queue — Adam needs to film Post 155 by Sep 19. NotebookLM CLI check — 6th consecutive timeout.


## Lead Gen Agent Status
<!-- Lead gen agent updates these three fields each session. Replace, never append. -->

**Last worked on:** 2026-04-15 PM — Nightly NotebookLM PUSH+CURATE. AM miscount corrected (was 50, not 65). Notebook: 3 removed (audit-Apr14, CONTEXT.md Apr14 LoanOS, session-log.md Apr14), 3 added (fresh CONTEXT.md Apr15 LoanOS, audit-Apr15, lead-scoring-spec.md [catch-up]). 50/50. Digest SENT (Zapier success). Lead scoring spec confirmed pushed to notebook.

**Active blockers:** (1) Seq C INACTIVE — Outlook cred (7+ sessions). (2) Calendly INACTIVE — webhook not wired in Calendly UI. (3) Mailchimp 3 journeys not built (Execution Pack delivered, 45 min Adam). (4) Seq D — copy approval + manual trigger. (5) Lead scoring threshold decision: 6.00% vs 6.25% (Adam).

**What's next:** Build lead scoring system (spec ready — DB migration + n8n Lead Score Updater workflow + intake wiring). Calendly webhook activation + HMAC code node. Mailchimp 3 Customer Journeys (Adam-owned, ~45 min).

## SEO/SEM Agent Status
<!-- SEO/SEM agent updates these three fields each session. Replace, never append. -->

**Last worked on:** 2026-04-15 PM — Nightly NotebookLM PUSH+CURATE. Cedar Park + Leander AEO H2 question format + unified lead-intake.js + UTM fields committed today. Notebook: 3 removed (audit-Apr14, CONTEXT.md Apr14, 2026-03-28-schema-eeat-web.md [superseded]), 3 added (fresh CONTEXT.md Apr15, audit-Apr15, 2026-04-14-accessibility-cwv-web.md [catch-up]). 50/50. Digest SENT (Zapier success).

**Active blockers:** GSC URL Inspection for Cedar Park + Leander + Round Rock (Adam-owned). Liberty Hill unique content still unwritten. Pre-publish lint command for blog title brand drift needed.

**What's next:** Georgetown suburb H2 AEO audit + county context. Liberty Hill content enrichment (Liberty Hill ISD + Williamson County tax + Orchard Ridge/Santa Rita Ranch). Pre-publish lint command (Claude-executable).

## Scenarios Agent Status
<!-- Scenarios agent updates these three fields each session. Replace, never append. -->

**Last worked on:** 2026-04-18 AM — Borrower AI chat on share page. New `BorrowerChat.tsx` (print:hidden, max 3 turns, optimistic UI, animated dots) + `POST /api/share/[token]/chat` (public, rate-limited, service client, Claude with scenario context). Tier 7 Item 1 COMPLETE. Commit 223630c | Vercel dpl_A4JCF99yisz7GAKiM6SBrWmLWQ3g → BUILDING

**Active blockers:** None.

**What's next:** Tier 7 Item 2 — Quick scenario from contacts page ("Create Scenario" button pre-fills borrower name + address).

## Standup Agent Status
<!-- Standup agent updates these three fields each session. Replace, never append. -->

**Last worked on:** 2026-04-18 — Day 24 standup. Vercel READY (`dpl_HrEW3D315oPrR87SQxTjYcyTW6TV`, SHA `291bfbe`). n8n: 33 total, 29 active — no errors, 4 inactive all intentional. Scenarios Tier 6 complete (MobileQuickInput shipped). `HkLjsnnhT5MgrX5H` active but execution-untested.

**Active blockers:** Marketing site zero progress (13 days to May 1 — HIGHEST RISK). Phase 3 Adam confirmation outstanding. Task 23 cutover blocked on Adam env vars + Resend webhook. Seq C INACTIVE (Outlook cred, 8+ sessions).

**What's next:** Phase 5 email template wiring (wire 6 n8n workflow buttons in UI). Marketing site demo data → screenshots → launch page.

## Rules For AI Sessions

- **UI changes**: Prefer `docs/THEME.md` + text spec. Don't require screenshots.
- Always read this file before starting
- Always update this file when something significant changes (keep it short — details go in CHANGELOG)
- Always update CHANGELOG.md at end of session
- Always update the build tracker (`/public/docs/loanos.html`) at end of session
- At end of session: update CONTEXT.md, commit, push to main
- Never break styer-mortgage-site tools
