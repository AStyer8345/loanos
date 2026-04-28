# LoanOS — AI Context File

> Read this at the start of every session before doing anything. Keep this file under 150 lines. Session history → [CHANGELOG.md](http://CHANGELOG.md). Why decisions → [DECISIONS.md](http://DECISIONS.md). Open work → [TODO.md](http://TODO.md).

## What This Is

LoanOS is a mortgage intelligence platform built by Adam Styer. Built for personal production use first. Licensed to other LOs in Phase 4. Replaces: Jungo CRM, Mortgage Coach, scattered Claude workflows.

## Current Phase

**Email Automation Cutover (Task 23) + Security Findings #5/#9/#10 + Marketing Demo Data Prep (May 1 critical path)**

## Repo

- GitHub: <https://github.com/AStyer8345/loanos>
- Branch: main
- Deploy: Vercel (auto on push)
- Version: 8.1.9 (as of 2026-04-05)

## Current Status

**Email Automation Dashboard + n8n → Workflow DevKit Phase 1: shipped through shadow mode (2026-04-15 PM). Renovation Phase 2 complete. UI consolidated for LO #2 onboarding (2026-04-16 PM late-4). Security hardening complete (#9 + #10 shipped 2026-04-16 autonomous). Security findings #5 remains (ADAM-BLOCKED — GLBA attorney). 2026-04-17 autonomous: demo data polished (screenshot-ready), n8n blank email fix deployed. 2026-04-18 PM: Analytics dashboard (**`/dashboard/analytics`**) shipped — pipeline health, source conversion, realtor scoreboard, AEO vs SEO, Past Client lead source; commit** `56db9d4`**, analytics consolidated into Dashboard Performance tab** `32b9e5b`**. 2026-04-19 autonomous: loans page** `useEffect` **organizationId dep fix (commit** `a8759a0`**, live in prod** `32b9e5b`**); pre-push hook nvm tolerance fixed locally. 2026-04-19 autonomous (PM): Scenarios Tier 7 Item 2 — "Create Scenario" button on contact detail page, pre-fills borrowerName + propertyAddress from contact record via** `?contact_id=` **param. Marketing site copy pass: 2 false claims removed, KB updated. Commit** `0cd93dc`**, Vercel** `dpl_6PvCut3fRyfo3HFo59jBTCWxoL5o` **→ READY. 2026-04-20 autonomous: BLOCKER-HOT-LEAD-001 closed —** `POST /api/notify/hot-lead` **route shipped (Resend email + daily dedup via activity_log). n8n workflow** `nOCDV73m4M0jyL1B` **updated to 8 nodes — "Notify Adam" httpRequest node now calls endpoint after every hot lead surface. Commit** `358d3f5`**. ADAM-BLOCKED: set** `LOANOS_AGENT_SECRET` **in n8n Settings → Environment Variables so node can authenticate. 2026-04-22 autonomous: Manual Enrollment UI shipped — DRIP CAMPAIGNS card on contact detail always renders;** `+ ENROLL` **button opens inline campaign picker → POST** `/api/drip/campaigns/[id]/enrollments`**. Root cause of drip inactivity: n8n scheduler archived 2026-04-16 + UI hidden when empty. Commit** `b3752fb`**, Vercel READY. PR #4 (**`feat/tenant-scoping-hardening`**) queued for Adam merge — 37 tables probed, 0 leaks, migration 092 applied, Scott cleared for login. 2026-04-24 PM autonomous: Hold List UI shipped — Settings page Hold List card (add form + trash-icon delete), 3 API routes (GET/POST suppressions, DELETE suppressions/\[id\]). Closes Scott Pilot Hold List UI. Cron deploy pipeline unblocked (daily** `0 13 * * *`**, commit** `96b7e93c`**). Commit** `a1c2dec`**, Vercel READY. 2026-04-26 PM autonomous: Recent Activity timeline shipped on** `/dashboard/drip-campaigns` **—** `getRecentSends()` **query helper +** `GET /api/drip/sends/recent` **+** `RecentSendsTimeline.tsx` **(15 most-recent sends across all campaigns, contact/campaign/step/status/relative-time, status-tinted, graceful empty state). Closes recent-sends portion of Drip Dashboard widgets (TODO line 39); completion-rate-per-campaign still open. Commit** `f54c16b`**. 2026-04-27 PM autonomous: Drip Dashboard widgets fully shipped — completion rate per campaign now renders inline on each** `CampaignCard` **("X% completed", with tooltip showing completed / (completed + removed) breakdown; falls back to "— completion" until enrollments finish).** `DripCampaignWithStats` **extended with** `completed_count` **+** `removed_count`**;** `getCampaignsWithStats()` **adds two parallel** `head:true` **count queries per campaign. No schema changes, no new endpoints. Commit** `a4e8f54`**, Vercel** `dpl_7SjND6PJmpHubZFV9TmTrpdTPEMF` **READY (\~80s). 2026-04-28 PM autonomous: MISMO importer follow-ups (Scott Pilot scope) — `MISMOUpload.tsx` now surfaces server error body (`{ error?: string }` with HTTP-status fallback) instead of swallowing as generic "Failed to parse MISMO file"; `api/mismo/import/route.ts` adds secondary dedup branch on `(org_id, contact_id, property_address, loan_amount)` when `loan_number` is absent (covers pre-submission Calyx Point exports). No schema changes, no new endpoints. Build green first pass.**

- 2026-04-16 PM (late-4): UI consolidation — TopNav 9 tabs → 4 + More + ⚙ (Email pillar consolidates drip-campaigns/drafts/automations under one tab). Drip scheduler n8n `LqBb3YDLjS2eUrDE` archived (option (a) of TODO #18); banner added on `/dashboard/drip-campaigns`. Mini Pipeline Table cut from dashboard (duplicate of Pipeline tab). Live in `dpl_BdBkGhQjmFf4itLRiZpXb3EN2tMP` (READY 75s). New three-pillar rule in memory: Contacts / Pipeline / Drip = the only first-class surfaces.

- Feature branch `feat/email-automation-dashboard` — 20+ commits, all Vercel builds READY through SHA `9583ba3`

- 4 Workflow DevKit workflows live in code: `pre-approval-email`, `pa-welcome-nurture`, `dpa-guide-nurture`, `web-lead-intake`

- 2026-04-16 PM: nurture content filled — 14 authored bodies (6 PA / 8 DPA) now in-file via `EMAILS` arrays + new `renderDripHtml` helper; stub `<p>${subject}</p>` placeholders gone

- 2026-04-16 PM (late-2): `automation_registry` 7/7 populated — all transactional templates now `email_mode='fixed_template'` with real HTML + `{{var}}` merge tags. Editor at `/dashboard/automations` no longer shows empty boxes. Final CD TRID 3-day framing + wire-fraud warning preserved verbatim. Runtime wiring still TODO (templates are read-only previews today).

- 2026-04-16 PM (late-3): `automation_registry` now 8/8 with subjects. Schema: `+subject_template` column, unique index widened to include `source_node_id`. New row `Contract Received — Party Reply`. Set Rate webhook (`3iXImUkjgMitpJKt`) fully repaired — from_address/subject removed from body + pre-existing Validate Rate `return [{json}]` bug fixed. MCP `execute_workflow` 5175 success, row `9b3a765d` landed clean. Manual rate updates can use `curl` again.

- Admin dashboard at `/admin/email-automation` (4 panels) + summary card on main `/dashboard` (admin-gated)

- [styermortgage.com](http://styermortgage.com): unified `lead-intake.js` + UTM hidden fields on 5 forms (`subscribe-lead.js` kept alive as rollback)

- `WORKFLOW_DEVKIT_LEAD_INTAKE=off` by default. Set to `shadow` to start parity logging, then `live` after 7-day review

- Migration 086 (UTM cols + resend_webhook_events) + 087 (workflow_shadow_log) applied to prod Supabase

- Phase 1 (strip UI to 7 tabs) — done 2026-03-30

- Phase 2 (pipeline bulletproof + Arive sync overhaul) — done 2026-04-02, Adam-confirmed 2026-04-16

- Phase 3 (Follow-Up segments in Contacts + Dashboard lead-source overhaul with AEO detection + clickable drill-down + LeadSourceSelect dropdown) — shipped 2026-04-16 (final deploy `dpl_AKhAtzUsqeQNyG3MME1dYrTuFdJv`), awaiting Adam review. Also fixed stale `outputFileTracingIncludes` config that broke local builds for \~6 hours.

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
5. **Set** `WORKFLOW_DEVKIT_LEAD_INTAKE=shadow` and let it run 7 days minimum.
6. **Parity review**: SQL diff `workflow_shadow_log` rows against n8n execution history for same window. Must be ≥100% classification match and ≥100% enrollment decision match. Zero sends from Workflow DevKit during shadow.
7. **Cutover**: flip `live`, pause Mailchimp PA/DPA journeys, archive 4 n8n workflows (`PiuIsQpBuydtFM4m`, `rwi3qEYgJKGGHkHc`, `0M8Vnf6MhB1xtaIg`, `utMvZpkdRwIRZ51u`), record cutover_date + kill_date (= cutover + 61d) in [DECISIONS.md](http://DECISIONS.md).

**Note:** Microsoft Graph / Azure AD was removed mid-session (2026-04-15 PM) — Outlook sends were swapped to Resend after Adam hit an unresolvable 2FA block creating the Azure account. All workflow emails now flow through the single Resend provider (already DKIM-verified for [styermortgage.com](http://styermortgage.com)).

See `tests/workflows/smoke-checklist.md` for full manual smoke plan.

## Recent Fixes

See [CHANGELOG.md](http://CHANGELOG.md) for full fix history. Key recent: migration 085 (trigger crash), notes/activity separation (migration 084), iMessage pipeline (silent failures fixed), PII encryption complete (migration 083 column drop).

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

**Last worked on:** 2026-04-28 AM — Step 1B GBP + Wk45 Content Build (Jan 11–17, 2027). GBP auto-published blog "Why Home Prices Aren't Crashing" (Publer job `69f062de8b17fc4ff5c6b9ea`, 250 words, NMLS baked in, directional rate language only); companion realtor-update SKIPPED (duplicate-data with blog). Posts 191 (Facebook, Real Talk → DB `authority`, ID `5c64d991`, Mon Jan 11 9 AM CT — borrower-facing native of blog) + 192 (LinkedIn, Education, ID `1abae5ab`, Wed Jan 13 9 AM CT — realtor-facing native of realtor-update, teaches objection-handling) shipped to social_drafts. Both EVERGREEN, 9/10 first draft, 0 rewrites, Reviewer APPROVED, QA PASS. NMLS #513013 in both. Closes 12-day FB gap from Post 188. 🎉 NotebookLM CLI RECOVERED after 22-day outage — both master (note `ce305c48`) and social domain (note `57df50d6`) notebooks pushed successfully.

**Active blockers:** BLOCKER-LOANOS-001 (selfies not uploaded — LoanOS stream paused). NotebookLM CLI: PRIOR streak broken this session (22-day outage ended); needs one more AM session of confirmed success before declaring fully resolved. [master-agent.md](http://master-agent.md) Step 1B 3A still uses `platform: "google"` for GBP `social_drafts` insert — DB constraint rejects it (allowed: all/facebook/instagram/linkedin); GBP record-keeping handled by Publer + tracker + activity_log instead. DB pillar enum excludes `real_talk` — keep mapping Real Talk voice → `authority`. Bash-quoted INSERTs strip apostrophes — Builder must use Python or PG E-strings.

**What's next:** Week 46 (Jan 18–24, 2027): rotate Instagram (last IG: 189 Jan 4 — will be 14-day gap by Wk46) + LinkedIn or Facebook second slot. Pillar mix is well-balanced after Wk45; consider lifting Personal or Education depending on Adam's content investment that week. [content-repost-queue.md](http://content-repost-queue.md) Apr 20 blog + Apr 24 rates still pending native versions — pick up if a market or rate-themed slot opens. Duplicate Post 180 cleanup (30da3c7a vs 868fe397) still pending. [master-agent.md](http://master-agent.md) Step 1B 3A patch (drop GBP social_drafts insert OR relax DB platform constraint to include "google") still pending.

## Lead Gen Agent Status

**Last worked on:** 2026-04-28 AM — PA-funnel zero-leads diagnosis. Traced get-preapproved.html → lead-intake.js → /api/contacts/web-lead end-to-end; all three layers preserve `lead_source: 'Pre-Approval Funnel'` correctly. **Not a code bug.** Quantified actual funnel volume: n8n PA-notify webhook triggerCount = 1 in 32 days; only Jung Lee (2026-04-13) has TCPA-Consent notes (predates lead-intake cutover, was manually edited to AEO source); 7 web_lead contacts since 2026-03-29 are mostly SEO-agent manual inserts. Conclusion: PA funnel form has captured zero real submissions since the 2026-04-15 cutover. Traffic/CTR problem, not pipeline bug. NotebookLM CLI 0.3.4 responsive (1st AM op in 20 sessions). Diagnosis: `tasks/lead-gen/research/2026-04-28-pa-funnel-zero-leads-diagnosis.md`.

**Active blockers:** (1) `CRON_SECRET` not set in Vercel (Adam, load-bearing). (2) Zero contacts enrolled — manual enrollment needed to prove drip loop. (3) Realtor Relationships activation criteria + cadence (Adam). (4) Long-Term Nurture + Past Client Retention archive-vs-author (Adam). (5) TCPA copy approval (Sendblue prereq). (6) Sendblue signup. (7) `LOANOS_AGENT_SECRET` in n8n. (8) PR #4 unmerged. PA-funnel zero-count item RESOLVED — was misdiagnosed as code bug.

**What's next:** (1) Pull GSC + GA4 metrics for `/get-preapproved.html` since 2026-04-15 — characterize impressions/CTR/page-views to drive GOALS.md title/meta rewrite work. (2) Once CRON_SECRET set, manually enroll one Adam contact in PA Welcome to verify drip loop. (3) Realtor Relationships build (content-only, ~1.5 hr, Adam-blocked on cadence). (4) Long-Term Nurture / Past Client Retention archive-or-author decision (Adam). (5) iMessage blockers unchanged.

## SEO/SEM Agent Status

**Last worked on:** 2026-04-26 PM — Nightly NotebookLM PUSH+CURATE. Removed 3 (CONTEXT Apr 25 stale, Pasted Text junk source, 2026-04-14 a11y/CWV web research superseded by 3 web.dev sources). Added 2 (refreshed CONTEXT Apr 26 from styerteam-mortgage-site, audit-Apr26). 49/50. Digest SENT (Zapier success). Master log appended + Master notebook re-synced. Today's site work absorbed: Liberty Hill suburb deepening (USDA removed, neighborhoods/schools/employers added, commit cbddcc0); AEO body paragraphs + question H2s on the final 2 rate-shopper posts — completes that cluster's AEO sweep (commit 23d00c7); daily-opt run log committed (6bc3af5).

**Active blockers:** USDA cleanup — Smithville/Elgin/Florence/Jarrell still pending body+schema+FAQ; Liberty Hill done today (MEDIUM). Pillar-page loan table USDA cleanup still pending (HIGH). GTM suburb quick-form not counting as Google Ads conversions ($500/mo unattributed — HIGH). 90-day GSC export not yet pulled (blocks Page-2/3 quick-win identification). NotebookLM Step 0 in daily-opt [SKILL.md](http://SKILL.md) references missing `notebook_advisor.py` — confirmed dead path; ESCALATED Adam decision.

**What's next:** (1) Continue suburb deepening sweep — next suburb per domain-queue ordering. (2) Identify next content cluster for AEO H2 sweep (rate-shopper cluster done). (3) Finish USDA cleanup on remaining 4 suburbs + pillar-page loan table. (4) Monday 2026-04-27 — verify GSC sitemap shows Success status. (5) Week 7 → Week 8 transition prep before May 1 launch focus pulls SEO/SEM bandwidth.

## Scenarios Agent Status

**Last worked on:** 2026-04-27 AM — 3rd consecutive no-build exit (Apr 25/26/27). Tiers 1–8 complete; [GOALS.md](http://GOALS.md) has no scenarios work. Prior NEEDS ADAM was missing from [TODO.md](http://TODO.md) — added fresh entry above NotebookLM NEEDS ADAM.

**Active blockers:** No mission — needs retire / redirect / pause decision ([TODO.md](http://TODO.md) NEEDS ADAM).

**What's next:** Adam decision: (a) retire cron, (b) redirect to FNM 3.4 / drip / notes, (c) leave dormant.

## Standup Agent Status

**Last worked on:** 2026-04-27 — Day 33 standup. 4 days to launch (May 1). Scheduled-task config still references April 26 (passed); operational target is May 1 per [GOALS.md](http://GOALS.md) — conflict logged, continuing to run. Yesterday: Recent Activity timeline + tracker commit. Today already: completion rate widget (`a4e8f54`, READY) + AM lead-gen RPC fix (`get_due_drip_enrollments` two-column rename). All 20 most-recent Vercel deployments READY. n8n: 38 workflows, 33 active, 5 inactive (all intentional).

**Active blockers (all rolled 5+ standups, Adam-gated):** PR #4 (`feat/tenant-scoping-hardening`) still unmerged; `CRON_SECRET` not set in Vercel — now actually load-bearing after today's AM RPC fix; `LOANOS_AGENT_SECRET` missing in n8n; TCPA copy + Sendblue API key for iMessage; 3 drip campaigns active in DB but missing authored content (Long-Term Nurture, Past Client Retention, Realtor Relationships); marketing site silent (highest launch risk per [GOALS.md](http://GOALS.md)); selfies not uploaded.

**What's next:** Post-13:00-UTC: query Vercel cron history + `drip_sends` to confirm whether cron fired (CRON_SECRET dependent). FNM 3.4 / Calyx Point coverage check on shipped MISMO importer (co-borrower regex greediness is a known pre-launch defect). Notes / activity log fix — still launch-critical per [GOALS.md](http://GOALS.md), no code in 24h+.

## Rules For AI Sessions

- **UI changes**: Prefer `docs/THEME.md` + text spec. Don't require screenshots.
- Always read this file before starting
- Always update this file when something significant changes (keep it short — details go in CHANGELOG)
- Always update [CHANGELOG.md](http://CHANGELOG.md) at end of session
- Always update the build tracker (`/public/docs/loanos.html`) at end of session
- At end of session: update [CONTEXT.md](http://CONTEXT.md), commit, push to main
- Never break styer-mortgage-site tools
