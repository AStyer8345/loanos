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

**Email Automation Dashboard + n8n → Workflow DevKit Phase 1: shipped through shadow mode (2026-04-15 PM). Renovation Phase 2 complete. UI consolidated for LO #2 onboarding (2026-04-16 PM late-4). Security hardening complete (#9 + #10 shipped 2026-04-16 autonomous). Security findings #5 remains (ADAM-BLOCKED — GLBA attorney). 2026-04-17 autonomous: demo data polished (screenshot-ready), n8n blank email fix deployed. 2026-04-18 PM: Analytics dashboard (`/dashboard/analytics`) shipped — pipeline health, source conversion, realtor scoreboard, AEO vs SEO, Past Client lead source; commit `56db9d4`, analytics consolidated into Dashboard Performance tab `32b9e5b`. 2026-04-19 autonomous: loans page `useEffect` organizationId dep fix (commit `a8759a0`, live in prod `32b9e5b`); pre-push hook nvm tolerance fixed locally. 2026-04-19 autonomous (PM): Scenarios Tier 7 Item 2 — "Create Scenario" button on contact detail page, pre-fills borrowerName + propertyAddress from contact record via `?contact_id=` param. Marketing site copy pass: 2 false claims removed, KB updated. Commit `0cd93dc`, Vercel `dpl_6PvCut3fRyfo3HFo59jBTCWxoL5o` → READY. 2026-04-20 autonomous: BLOCKER-HOT-LEAD-001 closed — `POST /api/notify/hot-lead` route shipped (Resend email + daily dedup via activity_log). n8n workflow `nOCDV73m4M0jyL1B` updated to 8 nodes — "Notify Adam" httpRequest node now calls endpoint after every hot lead surface. Commit `358d3f5`. ADAM-BLOCKED: set `LOANOS_AGENT_SECRET` in n8n Settings → Environment Variables so node can authenticate. 2026-04-22 autonomous: Manual Enrollment UI shipped — DRIP CAMPAIGNS card on contact detail always renders; `+ ENROLL` button opens inline campaign picker → POST `/api/drip/campaigns/[id]/enrollments`. Root cause of drip inactivity: n8n scheduler archived 2026-04-16 + UI hidden when empty. Commit `b3752fb`, Vercel READY. PR #4 (`feat/tenant-scoping-hardening`) queued for Adam merge — 37 tables probed, 0 leaks, migration 092 applied, Scott cleared for login.**

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

**Last worked on:** 2026-04-23 AM — Week 36 build (Nov 9–15): "Post 171 — Stop Waiting for 2021 to Come Back" (Facebook real-talk, ID: c37c0ac3, Nov 11 2PM CST) + "Post 172 — What Underwriters Actually Look For" (Instagram education, ID: bd67761b, Nov 13 9AM CST). Both APPROVED, QA PASS, 9/10. Step 1B: no new site content. Rolling pillar: Auth ~30.1% / Personal ~30.2% / Education ~29.7% / RT ~12.8%. NotebookLM: 13th+ consecutive timeout — SKIPPED.

**Active blockers:** BLOCKER-LOANOS-001 (selfies not uploaded — LoanOS stream paused). NotebookLM CLI timing out 13+ consecutive sessions — NEEDS ADAM. Post 157 (ID: 94e1d9a7, LinkedIn, Sep 24) needs blog link in first comment before publish. DUPLICATE ALERT: Week 29 built twice — orphaned duplicates (32803838, 94e1d9a7, 94c1dc00, 58757106) still in social_drafts.

**What's next:** Week 37 (Nov 16–22): RT still below 15% target (~12.8%). Priority: 1 real-talk + 1 education. Platform: LinkedIn (skipped Wk 36) for one post. Content-repost-queue: rates/2026-04-14 native carousel still pending.


## Lead Gen Agent Status
<!-- Lead gen agent updates these three fields each session. Replace, never append. -->

**Last worked on:** 2026-04-23 AM — Drip campaign end-to-end fix shipped. 3 new files: `src/lib/drip/authored-emails.ts` (25 authored emails across 5 campaigns), `src/app/api/drip/run/route.ts` (Vercel Cron, hourly), `vercel.json` (cron schedule). Enrollment POST updated to compute `next_send_at` from step 1's `trigger_config.days`. Build green. ADAM action: set `CRON_SECRET` in Vercel env vars (prod + preview) to activate cron.

**Active blockers:** (1) ADAM must set `CRON_SECRET` in Vercel dashboard (cron won't fire without it — 2-min fix). (2) ADAM must set `LOANOS_AGENT_SECRET` in n8n env vars (hot lead auth). (3) FNM 3.4 import not started. (4) NotebookLM CLI timeout 13+ sessions.

**What's next:** Verify first drip send fires after CRON_SECRET is set. FNM 3.4 file import for Scott. Week 7 (LO Waitlist / multi-tenant).

## SEO/SEM Agent Status
<!-- SEO/SEM agent updates these three fields each session. Replace, never append. -->

**Last worked on:** 2026-04-22 PM — Nightly NotebookLM PUSH+CURATE. Removed 3 (audit-2026-04-21, CONTEXT.md Apr 21 stale, gsc-monitoring-web Apr 5 [covered by 2 other GSC sources]). Added 3 (CONTEXT.md Apr 22 [Bee Cave AEO + Leander deepening + broker-vs-bank AEO H2], audit-2026-04-22, ahrefs local link building [Week 7 prep]). 50/50. Digest SENT (Zapier success).

**Active blockers:** USDA compliance: Buda/Smithville/Elgin/Florence/Jarrell pages claim USDA (Adam does not offer — HIGH). GTM suburb quick-form not counting as Google Ads conversions ($500/mo unattributed — HIGH). Blog next due April 24.

**What's next:** Blog post "How to Buy a House in Austin TX 2026" (April 24 target — pillar, 3k+ words). Liberty Hill unique content. GSC Request Indexing — Taylor/Smithville/Elgin/Florence/Jarrell. USDA cleanup pending Adam confirmation.

## Scenarios Agent Status
<!-- Scenarios agent updates these three fields each session. Replace, never append. -->

**Last worked on:** 2026-04-22 AM — Tier 8 Items 1 + 3 shipped. BorrowerIntentCapture.tsx ("Which option interests you most?" 3-tap buttons, writes to scenarios.borrower_intent JSONB via POST /api/share/[token]/intent, Resend notification to Adam, idempotent). LONoteCard.tsx (gold-bordered card on share page above BorrowerChat, 250-char textarea in ActionsBar). Migration 093 applied (borrower_intent + lo_note). MC gap closed: borrower option interest signal. Commit `ccaced0`, Vercel `dpl_G1SRXiQgn3WPr4GiuRg6GANj4vGE` → READY.

**Active blockers:** None.

**What's next:** Tier 8 Item 5 (mobile swipe cards, ~1.5hr) — only remaining Tier 8 item. Alternatively declare Scenarios program complete.

## Standup Agent Status
<!-- Standup agent updates these three fields each session. Replace, never append. -->

**Last worked on:** 2026-04-22 — Day 28 standup. Vercel READY (`dpl_5ciKw4PB7AibBfVkkLj1uNx2ozn9`, SHA `548e82f`). PR #4 (`feat/tenant-scoping-hardening`) queued — 37 tables probed, 0 leaks, migration 092 applied, Scott cleared for login pending merge. 4 days to launch.

**Active blockers:** PR #4 unmerged (Scott cannot safely log in). `LOANOS_AGENT_SECRET` missing from n8n (hot lead auth broken — 30s fix). FNM 3.4 import not started (Scott's #1 blocker). Marketing site zero progress (4 days to April 26 — HIGHEST RISK, Adam-owned).

**What's next:** FNM 3.4 file import (Scott blocker). PR #4 merge (NEEDS ADAM). Drip end-to-end fix. Phase 5 email template wiring.

## Rules For AI Sessions

- **UI changes**: Prefer `docs/THEME.md` + text spec. Don't require screenshots.
- Always read this file before starting
- Always update this file when something significant changes (keep it short — details go in CHANGELOG)
- Always update CHANGELOG.md at end of session
- Always update the build tracker (`/public/docs/loanos.html`) at end of session
- At end of session: update CONTEXT.md, commit, push to main
- Never break styer-mortgage-site tools
