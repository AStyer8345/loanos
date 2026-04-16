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
- 2026-04-16 PM: nurture content filled — 14 authored bodies (6 PA / 8 DPA) now in-file via `EMAILS` arrays + new `renderDripHtml` helper; stub `<p>${subject}</p>` placeholders gone
- 2026-04-16 PM (late-2): `automation_registry` 7/7 populated — all transactional templates now `email_mode='fixed_template'` with real HTML + `{{var}}` merge tags. Editor at `/dashboard/automations` no longer shows empty boxes. Final CD TRID 3-day framing + wire-fraud warning preserved verbatim. Runtime wiring still TODO (templates are read-only previews today).
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

- Security findings #5, #9, #10 — see `tasks/security-hardening-critical-gaps.md` (all prior items DONE)

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

See `memory/tools/n8n.md` for full index. Core active: Arive→Supabase (`1tagvoU0UXtdDiMY`, `9JyzzwKac8v3uQ7d`), Drip Scheduler (`LqBb3YDLjS2eUrDE` daily 7am), Lender Ingest (`hHXpKUirhnBCnQTO` daily 8am).

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

**Last worked on:** 2026-04-16 AM — Backfill Q&A. Extracted `generateQAPairs.ts` shared utility, refactored generate-qa route, new `POST /api/scenarios/backfill-qa` batch route (parallel chunks of 3), `ScenarioList.tsx` gold banner + "Generate Q&A (N)" button. Also fixed pre-existing ghost `@types` build blocker. Commit 44591dc | Vercel dpl_AcAJa7aKTQgd8UxLRrYTRdqBpWCY → READY ✅

**Active blockers:** None.

**What's next:** Mobile builder quick-input form (LO at the table on phone — rate/term/price/down only, generates share link).

## Standup Agent Status
<!-- Standup agent updates these three fields each session. Replace, never append. -->

**Last worked on:** 2026-04-16 — Day 22 standup. Vercel CONFIRMED READY (`dpl_CWxQo5KnaCfsW93QFyBYZrvjW3D8`, SHA `80fb0ee`). n8n: 33 total, 29 active — no errors. 4 commits confirmed shipped (admin page fix, email log, per-LO drafts UI, email fallback fix). Security: 0 CRITICAL, 3 MEDIUM open.

**Active blockers:** Marketing demo data zero progress (10 days to May 1 — HIGHEST RISK). Phase 2 Adam confirmation outstanding 8+ sessions (blocks Phase 3). Workflow DevKit cutover (Task 23) blocked on Adam env vars + Resend webhook config. Seq C INACTIVE (Outlook cred, 7+ sessions).

**What's next:** Marketing demo data cleanup (must start this week — May 1 at risk). CD & Contract Extractor execution test. Phase 2 Adam confirmation escalation.

## Rules For AI Sessions

- **UI changes**: Prefer `docs/THEME.md` + text spec. Don't require screenshots.
- Always read this file before starting
- Always update this file when something significant changes (keep it short — details go in CHANGELOG)
- Always update CHANGELOG.md at end of session
- Always update the build tracker (`/public/docs/loanos.html`) at end of session
- At end of session: update CONTEXT.md, commit, push to main
- Never break styer-mortgage-site tools
