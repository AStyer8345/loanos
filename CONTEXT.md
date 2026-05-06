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

**Email Automation Dashboard + n8n → Workflow DevKit Phase 1: shipped through shadow mode (2026-04-15 PM). Renovation Phase 2 complete. UI consolidated for LO #2 onboarding (2026-04-16 PM late-4). Security hardening complete (#9 + #10 shipped 2026-04-16 autonomous). Security findings #5 remains (ADAM-BLOCKED — GLBA attorney). 2026-04-17 autonomous: demo data polished (screenshot-ready), n8n blank email fix deployed. 2026-04-18 PM: Analytics dashboard (**`/dashboard/analytics`**) shipped — pipeline health, source conversion, realtor scoreboard, AEO vs SEO, Past Client lead source; commit** `56db9d4`**, analytics consolidated into Dashboard Performance tab** `32b9e5b`**. 2026-04-19 autonomous: loans page** `useEffect` **organizationId dep fix (commit** `a8759a0`**, live in prod** `32b9e5b`**); pre-push hook nvm tolerance fixed locally. 2026-04-19 autonomous (PM): Scenarios Tier 7 Item 2 — "Create Scenario" button on contact detail page, pre-fills borrowerName + propertyAddress from contact record via** `?contact_id=` **param. Marketing site copy pass: 2 false claims removed, KB updated. Commit** `0cd93dc`**, Vercel** `dpl_6PvCut3fRyfo3HFo59jBTCWxoL5o` **→ READY. 2026-04-20 autonomous: BLOCKER-HOT-LEAD-001 closed —** `POST /api/notify/hot-lead` **route shipped (Resend email + daily dedup via activity_log). n8n workflow** `nOCDV73m4M0jyL1B` **updated to 8 nodes — "Notify Adam" httpRequest node now calls endpoint after every hot lead surface. Commit** `358d3f5`**. ADAM-BLOCKED: set** `LOANOS_AGENT_SECRET` **in n8n Settings → Environment Variables so node can authenticate. 2026-04-22 autonomous: Manual Enrollment UI shipped — DRIP CAMPAIGNS card on contact detail always renders;** `+ ENROLL` **button opens inline campaign picker → POST** `/api/drip/campaigns/[id]/enrollments`**. Root cause of drip inactivity: n8n scheduler archived 2026-04-16 + UI hidden when empty. Commit** `b3752fb`**, Vercel READY. PR #4 (**`feat/tenant-scoping-hardening`**) queued for Adam merge — 37 tables probed, 0 leaks, migration 092 applied, Scott cleared for login. 2026-04-24 PM autonomous: Hold List UI shipped — Settings page Hold List card (add form + trash-icon delete), 3 API routes (GET/POST suppressions, DELETE suppressions/\[id\]). Closes Scott Pilot Hold List UI. Cron deploy pipeline unblocked (daily** `0 13 * * *`**, commit** `96b7e93c`**). Commit** `a1c2dec`**, Vercel READY. 2026-04-26 PM autonomous: Recent Activity timeline shipped on** `/dashboard/drip-campaigns` **—** `getRecentSends()` **query helper +** `GET /api/drip/sends/recent` **+** `RecentSendsTimeline.tsx` **(15 most-recent sends across all campaigns, contact/campaign/step/status/relative-time, status-tinted, graceful empty state). Closes recent-sends portion of Drip Dashboard widgets (TODO line 39); completion-rate-per-campaign still open. Commit** `f54c16b`**. 2026-04-27 PM autonomous: Drip Dashboard widgets fully shipped — completion rate per campaign now renders inline on each** `CampaignCard` **("X% completed", with tooltip showing completed / (completed + removed) breakdown; falls back to "— completion" until enrollments finish).** `DripCampaignWithStats` **extended with** `completed_count` **+** `removed_count`**;** `getCampaignsWithStats()` **adds two parallel** `head:true` **count queries per campaign. No schema changes, no new endpoints. Commit** `a4e8f54`**, Vercel** `dpl_7SjND6PJmpHubZFV9TmTrpdTPEMF` **READY (\~80s). 2026-04-28 PM autonomous: MISMO importer follow-ups (Scott Pilot scope) — `MISMOUpload.tsx` now surfaces server error body (`{ error?: string }` with HTTP-status fallback) instead of swallowing as generic "Failed to parse MISMO file"; `api/mismo/import/route.ts` adds secondary dedup branch on `(org_id, contact_id, property_address, loan_amount)` when `loan_number` is absent (covers pre-submission Calyx Point exports). No schema changes, no new endpoints. Build green first pass. **2026-04-28 PM (org-feature-flags): per-org UI flags shipped for Scott Pilot. Migration 094 adds `organizations.features jsonb` (NULL = all-on). Server helper `src/lib/features/getOrgFeatures.ts` (cached per request), client-safe types in `src/lib/features/types.ts`. TopNav, dashboard cards, and contact-detail surfaces (Drip card, Create Scenario, Email Automations) gate on flags. Admin UI at `/admin/feature-flags` (sys-admin only). Adam's row = NULL → unchanged UX; Scott's row = 9 flags false (Contacts/Pipeline/Loans/Settings remain visible). RLS impersonation probe confirmed both paths.** **2026-04-29 PM (Microsoft Graph adapter): Adam shipped commit `1b58ef9` — provider routing on `org_settings.email_provider` (migration 096 adds column + encrypted MS Graph token columns). `sendEmail()` dispatches to Graph or Resend; falls back to Resend on Graph error. `/api/auth/microsoft/connect` HMAC-signed OAuth state. No org has flipped to `microsoft` yet. 2026-05-01 PM autonomous: tracker hygiene cycle (May 1 launch day) — 11 modified tracker files committed, 0 code changes, Vercel pending. Bucket A empty for feature work; all current-phase items Adam-blocked. Anniversary Check-In (`ZUeGy8u8P4o6DPM3`) malformed-JWT bonus finding still open — first cron firing today; impact forward-looking only. **2026-05-04 autonomous: 5th consecutive tracker hygiene cycle (post-launch +3). 13 modified tracker files committed, 0 code changes. AM agents added 2 new ADAM-TODO lines (homepage forms audit + NotebookLM CLI re-auth, now 2 sessions blocked). All Bucket B items unchanged from 2026-05-03 entry.**

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

**Last worked on:** 2026-05-06 AM (on-time cron at 02:29 CDT) — 13th consecutive maintenance session (AM 04-30 → PM 04-30 → AM 05-01 → PM 05-01 → AM 05-02 → PM 05-02 → AM 05-03 → PM 05-03 → AM 05-04 → PM 05-04 → AM 05-05 → PM 05-05 → **AM 05-06**). **ESCALATION HELD per PM 05-05 forward rule**: ADAM-TODO line `[SOCIAL] 2026-05-04 PM` still `[ ]` open across 3 cycles (filed PM 05-04 → unanswered through AM 05-05 → PM 05-05 → still unanswered now). One-ask-per-cycle rule active — did NOT re-escalate. **GOALS.md re-checked**: `stat -L` returns target mtime `Apr 20 09:37:31 2026` — file unchanged 16 days. Week-of-Apr-20 directive still governs. Cushion verified: Supabase `social_drafts?organization_id=eq.18613f82-fdd9-42dd-a09e-f3c577328258&status=eq.draft&scheduled_for=gte.2026-05-05&order=scheduled_for.asc` → 47 drafts, range Sep 23 2026 → Feb 4 2027 (drift = 0 across all 13 sessions). Pillar mix nearest 8: authority×3, personal×3, education×2 (75% RT-adjacent). 0 TIMELY drafts in 48-hr horizon (2026-05-06T07:30Z → 2026-05-08T07:30Z). Step 1B (AM) ran — 12th consecutive zero-input scan. Refresh (07) ran — empty horizon. Latest files unchanged (`rates/2026-04-24.html`, `blog/2026-04-27-...`, `realtor-updates/2026-04-27-...`). NotebookLM PULL/PUSH deferred (PUSH backlog now 12 sessions deep; also blocked structurally by expired CLI auth, 4th day).

**Active blockers:** Unchanged structurally from PM 05-05. BLOCKER-LOANOS-001 (selfies not uploaded — `tasks/social-media/assets/selfies/` directory still missing 33 days; parent `assets/` also missing; LoanOS stream paused). **Carryover (escalation ask):** `[SOCIAL] 2026-05-04 PM` ADAM-TODO line awaits Adam's decision on cron disposition (A redirect / B pause). 3 cycles open (PM 05-04 → AM 05-05 → PM 05-05 → AM 05-06). master-agent.md Step 1B 3A still uses `platform: "google"` for GBP `social_drafts` insert — DB constraint rejects it. DB pillar enum excludes `real_talk` — keep mapping Real Talk voice → `authority`. Bash-quoted INSERTs strip apostrophes — Builder must use Python urllib or PG E-strings. 2 stale rate/market queue entries (`blog/2026-03-30-bond-rally` 5+ wks, `rates/2026-04-14` 3+ wks) — do NOT consume unless market context refreshes. Stale ADAM-TODO entries: April 1 plan's Posts 24/25 (FOMC TIMELY) + Post 46 (PCE TIMELY April 30) — all `status=rejected`, won't publish.

**What's next:** Cushion unchanged — 47 drafts to Feb 2027, zero degradation across 13 maintenance sessions. **Awaiting Adam's call on the PM 05-04 escalation entry in ADAM-TODO** (3 cycles open since the ask was filed). Default behavior until response: continue maintenance pattern. If Adam picks (B) pause, agent stops both `styer-social-am` + `styer-social-pm` cron tasks via the `schedule` skill once approved. If Adam picks (A) redirect, next session reads new sourcing target + restarts Sequence A. If Adam ignores, PM 05-06 will be the 14th consecutive maintenance session; the next natural decision point becomes Mon 2026-05-11 GOALS refresh (5 days out, 9 more no-op cron fires until then). PM 05-06 forward rule: re-check ADAM-TODO line — if Adam responded between AM 05-06 and PM 05-06, follow chosen branch. If still no response, hold maintenance — do NOT re-escalate (one ask per cycle, still active). PM sessions skip Step 1B and Refresh (07). NotebookLM PUSH backlog: 12 sessions deep — all deferred to next build. master-agent.md Step 1B 3A patch + Duplicate Post 180 cleanup still pending.

## Lead Gen Agent Status

**Last worked on:** 2026-05-06 AM — Compliance Closeout PR — Drop-In Spec authored at `tasks/lead-gen/specs/2026-05-06-compliance-closeout-pr-spec.md` (~360 lines). Single PR consolidates H1 from all 4 funnel-page audits (05-01, 05-02, 05-04, 05-05) into 6 atomic copy-paste-ready diffs across 5 files: `index.html` × 2 forms, `rate-alert.html`, `get-preapproved.html`, `thank-you.html`, `script.js`. Closes 4 of 5 series compliance FAILs + fully resolves BLOCKER-001. New finding surfaced: `/get-preapproved.html` checkbox A still uses bundled "phone, email, or text" wording — BLOCKER-001 partial-fix shipped two checkboxes but didn't tighten the copy; closeout spec includes the fix. Spec includes 8-step post-deploy test plan, risk assessment (5 rows, all LOW or NONE), 4-item out-of-scope, 9-step Builder execution checklist. Estimated ship time: 30 min Builder + 5 min Adam review. Pipeline read-only (03:55 CT): drip_sends=0, drip_enrollments=0, PA Funnel=0 (14th day), Rate Alert=0 (38 days), Quick Quote/Contact=0, Website=8 (90d unchanged), contacts_7d=3 — pattern unchanged across 5 consecutive baselines. NotebookLM PULL + PUSH SKIPPED — CLI auth still expired (5th day, 8th sub-session blocked).

**Active blockers:** Carryover unchanged structurally — (1) Realtor Relationships activation criteria + cadence (Adam). (2) Long-Term Nurture + Past Client Retention archive-vs-author (Adam). (3) TCPA copy approval (Sendblue prereq, Adam). (4) Sendblue signup (Adam). (5) GSC fresh export — SEO/SEM 90-day pull. (6) Drip first-enrollment validation — 5+ wks zero movement. (7-10) 20 HIGH-tier funnel-page audit findings unactioned — **now consolidated into the closeout PR spec (collapses to single ask)**. **NEW (12):** Closeout PR spec ready for Adam authorize — once shipped, BLOCKER-001 fully resolves and 4 of 5 series compliance FAILs close. (11) NotebookLM CLI auth restoration — Adam must run `/Users/adamstyer/.local/bin/notebooklm login`. Backlog now 4 lead-gen artifacts queued (3 audits + closeout spec).

**What's next:** (1) **Adam authorize the closeout PR spec** — single 30-min Builder run resolves BLOCKER-001 and 4 of 5 series compliance FAILs in one ship. Highest-leverage unblock available without any new agent work. (2) Once authorized, Builder Sequence C run on styerteam-mortgage-site (separate session). (3) Tomorrow's mission options if Adam doesn't authorize: (a) `/refinance-quote.html` audit (never audited; would extend series to 5/5), (b) `/austin-mortgage-rates.html` audit (high-traffic SEO landing CTAing into funnel), (c) deterministic POST verification to `/.netlify/functions/subscribe-lead` characterizing the upstream H5 deploy gap, (d) PR-2 spec (HIGH-tier conversion findings consolidation, post-compliance), (e) GSC pull if SEO/SEM 90-day export progresses. (4) If `notebooklm login` restored, run delayed PUSH covering 4 backlogged outputs. (5) **Skip page re-audit until at least one HIGH-tier change ships** — rule held forward from 05-04.

## SEO/SEM Agent Status

**Last worked on:** 2026-05-05 22:10 PM-cron-on-time — Nightly NotebookLM PUSH+CURATE **SKIPPED — CLI auth expired (4th consecutive nightly run blocked; 6 sub-sessions blocked since 05-03)**. Cron fired ON TIME (22:10 vs 22:00 target — normal jitter only, no late-fire pattern this slot; distinct from the 13h-late PM 05-04 fire that ran earlier today at 11:03 CDT). `notebooklm list --json` returns same `Authentication expired or invalid` error with WebLiteSignIn redirect. Steps 1–7 all blocked at Step 1. Local files unchanged outside trackers. Logged tasks/seo-sem/notebooklm-errors.md (2026-05-05 PM-cron-on-time entry). ADAM-TODO line 18 + TODO.md line 20 refreshed in place (count bumped to 3 days / 4 nightly runs / 6 sub-sessions; not re-stacked per stale-flags rule). Prior successful PUSH+CURATE remains 2026-05-02 PM.

**Active blockers:** notebooklm CLI auth expired (3rd consecutive day, 4th nightly run, 6 sub-sessions blocked since 05-03 PM) — blocks all SEO/SEM + Lead Gen nightly NotebookLM syncs and the Lead Gen morning PULL until Adam runs `notebooklm login`. Carryover unchanged: site-wide USDA dropdown cascade (Smithville/Elgin/Florence/Jarrell + `/loans/usda.html` disposition, HIGH); about.html LocalBusiness vs index.html MortgageBroker address mismatch (7th run, MEDIUM); about.html timeline-date span "91 Google + 45 Zillow" refresh-or-mark-historical (MEDIUM); GTM suburb quick-form not counted as Google Ads conversion ($500/mo unattributed, HIGH); 90-day GSC export not pulled (HIGH — also blocks Lead Gen funnel diagnosis); AEO insertion call on `2026-04-27-why-home-prices-arent-crashing.html` (structural, 2nd recurrence); voice-first essay-format AEO carve-out policy (5-post cluster); NotebookLM PULL Step 0 retirement diff (15th run).

**What's next:** (1) Adam runs `/Users/adamstyer/.local/bin/notebooklm login` to restore CLI auth — unblocks both nightly syncs + Lead Gen morning PULL immediately. Recovery night will need to push Lead Gen's 3-deep audit-file backlog (rate-alert 05-02 / homepage forms 05-04 / thank-you 05-05) plus the SEO/SEM PM-side backlog; expect a heavier-than-usual staleness audit (notebook freshness gap is widening ~2 sources/day; SEO/SEM notebook last refreshed 2026-05-01 → ~8 stale + ~5 ready-to-add at 50-source cap). (2) USDA compliance cleanup once Adam decides cascade scope. (3) GSC URL Inspection sweep — Hutto/Round Rock/Bee Cave/Lakeway. (4) Round 2 suburb deepening kickoff — Round Rock slot 1, replicate Westlake Hills depth pattern. (5) Voice-first essay-format AEO carve-out policy decision.

## Scenarios Agent Status

**Last worked on:** 2026-05-06 AM — 12th consecutive no-build exit (Apr 25/26/27/28/29/30 + May 1/2/3/4/5 + **May 6**). Tiers 1–8 complete; [GOALS.md](http://GOALS.md) `stat` re-verified at `Apr 19 13:51:27 2026` — Mon 2026-05-04 GOALS refresh day passed without action, file unchanged 17 days. Day 42 standup (post-launch +5) confirms 6-day zero-feature-code streak and autonomous lanes at hygiene-only exhaustion across all 5 agents. Refreshed NEEDS ADAM in [TODO.md](http://TODO.md) line 20 (12-streak, 2026-05-06 added to flagged-dates list, recommendation strongest yet for option (a) retire NOW — Mon GOALS skipped, 5 more no-op runs forecast unless decided before Mon 2026-05-11).

**Active blockers:** No mission — needs retire / redirect / pause decision ([TODO.md](http://TODO.md) NEEDS ADAM, 12 streaks). NotebookLM PULL/PUSH also blocked structurally (9th consecutive skip + `notebooklm` CLI auth expired since 2026-05-03 PM, ADAM-TODO line 20 — re-verified at session start: same `Authentication expired or invalid` error).

**What's next:** Adam decision: (a) retire cron — strongest yet on launch+5 with Mon GOALS skipped, natural drop-the-cron moment passed; (b) redirect slot to FNM 3.4 importer (Scott's actual gating item per GOALS.md, highest-leverage repurposing target); (c) leave dormant — bumps to 13-streak tomorrow. Without Mon 2026-05-11 refresh, no fresh signal arrives in autonomous mode for 5 more runs.

## Standup Agent Status

**Last worked on:** 2026-05-06 — Day 42 standup, post-launch +5 (vs May 1 GOALS target) / +10 (vs original Apr 26 task target). HEAD still `5fd8e6b`; PM 05-05 wrap-up did not commit — 2nd consecutive stalled wrap-up day. Vercel `dpl_HpsoHiffWTea7mQEivqmC2zAQW8u` READY. n8n 34 active / 5 inactive (all intentional). Anniversary Check-In dedup malformed-JWT 6th day open. Six-day zero-feature-code streak. Auto-lane hygiene-only across all 5 agents.

**Active blockers:** Drip queue at 0 sends 8th day (cutover unproven); Scott DKIM/MS Graph 8th day; 5 canonical n8n credentials uncreated; `LOANOS_AGENT_SECRET`; TCPA + Sendblue; 3 unauthored drip campaigns; selfies (32+ days); notes/activity log; MISMO regex; FNM 3.4 / Calyx Point importer (Scott gating); 15 HIGH-tier conversion findings in styerteam-mortgage-site (closeout PR spec ready); Scenarios cron retire (12-streak); NotebookLM CLI auth (4th night); social PM 05-04 escalation (3+ cycles); GOALS.md 16 days stale; CONTEXT.md still 162 lines.

**What's next:** (1) Drip end-to-end smoke — manually enroll Adam-owned contact in PA Welcome to prove the loop. (2) MS Graph adapter synthetic round-trip lab-validate before offering Scott the DKIM-alternative. (3) FNM 3.4 importer (Scott's actual beta-gating item per GOALS). **Strongest 5-standup-running recommendation:** reserve one 60-min Adam block to clear (a) Resend DKIM, (b) lead-gen closeout PR authorize at `tasks/lead-gen/specs/2026-05-06-compliance-closeout-pr-spec.md`, (c) Scenarios retire/redirect/pause, (d) `notebooklm login`, (e) social PM 05-04 A-vs-B answer, (f) GOALS.md refresh (next natural moment Mon 2026-05-11). Each is minutes-of-decision; together they unblock 6+ autonomous streams.

## Rules For AI Sessions

- **UI changes**: Prefer `docs/THEME.md` + text spec. Don't require screenshots.
- Always read this file before starting
- Always update this file when something significant changes (keep it short — details go in CHANGELOG)
- Always update [CHANGELOG.md](http://CHANGELOG.md) at end of session
- Always update the build tracker (`/public/docs/loanos.html`) at end of session
- At end of session: update [CONTEXT.md](http://CONTEXT.md), commit, push to main
- Never break styer-mortgage-site tools
