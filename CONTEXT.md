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

**Last worked on:** 2026-05-04 AM — 9th consecutive maintenance-only session (AM 04-30 → ... → AM 05-04). No build. **GOALS.md weekly refresh check: file unchanged 14 days (`stat` returns `2026-04-19 13:51`) — Adam did NOT refresh this morning;** Week of Apr 20 directive ("No new content on any site (improve existing only)") still governs. Cushion verified: Supabase `social_drafts?organization_id=eq.18613f82-fdd9-42dd-a09e-f3c577328258&status=eq.draft&scheduled_for=gte.2026-05-04&order=scheduled_for.asc` → 47 drafts, range Sep 23 2026 → Feb 4 2027 (drift = 0 across 9 sessions). Pillar mix nearest 8: authority×3, education×2, personal×3 (75% RT-adjacent). 0 TIMELY drafts in 48-hr horizon (May 4 07:29 UTC → May 6 07:29 UTC) — Supabase REST returned `[]`. Step 1B scanned `rates/`, `blog/2026-*.html`, `realtor-updates/` → 0 new content (latest still `rates/2026-04-24.html`, `blog/2026-04-27-why-home-prices-arent-crashing.html`, `realtor-updates/2026-04-27-the-crash-that-isnt-coming-data-for-your-buyers.html` — all already tracked). 9th consecutive zero-input scan. NotebookLM PULL/PUSH deferred per pattern (PUSH backlog now 8 sessions; will combine into next build). `today-mission.md` written as MAINTENANCE AM.

**Active blockers:** Unchanged. BLOCKER-LOANOS-001 (selfies not uploaded — `tasks/social-media/assets/selfies/` directory still missing; LoanOS stream paused 30 days). master-agent.md Step 1B 3A still uses `platform: "google"` for GBP `social_drafts` insert — DB constraint rejects it; GBP record-keeping handled by Publer + tracker + activity_log instead. DB pillar enum excludes `real_talk` — keep mapping Real Talk voice → `authority`. Bash-quoted INSERTs strip apostrophes — Builder must use Python urllib or PG E-strings. 2 stale rate/market queue entries (`blog/2026-03-30-bond-rally` 5+ wks, `rates/2026-04-14` 3+ wks) — do NOT consume unless market context refreshes. Stale ADAM-TODO entries: April 1 plan's Posts 24/25 (FOMC TIMELY) + Post 46 (PCE TIMELY April 30) — all `status=rejected`, won't publish.

**What's next:** Cushion unchanged — 47 drafts to Feb 2027, zero degradation across 9 maintenance sessions. **PM 2026-05-04 is the planned escalation point.** First action PM 05-04: re-check `stat` on GOALS.md. If still `2026-04-19 13:51` (Adam did not refresh during the day), this becomes the 10th consecutive maintenance session — append a NEEDS ADAM item to `tasks/ADAM-TODO.md` presenting two options: (a) opportunistic Wk49 build using NEW sourcing (NotebookLM pull / `loanos-pool.md` audit — only viable once selfies unblock LoanOS OR a non-LoanOS angle surfaces), or (b) cron pause with Adam approval (acknowledge cushion is 9 months deep, resume only when GOALS shift). Do NOT pause cron unilaterally — default = continue maintenance until Adam responds. If GOALS HAS been refreshed: re-read it, follow new directive, abandon escalation plan. Step 1B SKIPPED (PM); informational scan only. NotebookLM PUSH backlog: 8 sessions deep — all deferred to next build. master-agent.md Step 1B 3A patch + Duplicate Post 180 cleanup still pending.

## Lead Gen Agent Status

**Last worked on:** 2026-05-04 AM — homepage forms (`#hero-quick-form` Quick Quote + `#quick-contact-form` Quick Contact) conversion + TCPA compliance audit (Sequence A — Research). Third in funnel-page audit series. 17 findings authored (HIGH 5 / MEDIUM 6 / LOW 6) at `tasks/lead-gen/research/2026-05-04-homepage-forms-conversion-audit.md` (~330 lines). Closes audit coverage on the three primary lead-capture surfaces (PA Funnel, Rate Alert, Homepage). Single 30-min PR (TCPA two-checkbox split on 2 homepage forms + 1 rate-alert form) would close site-wide bundled-consent compliance debt — get-preapproved already shipped this pattern. **H5 deploy-gap finding**: `script.js` 407+523 explicitly set `lead_source: 'Quick Quote'` / 'Quick Contact' but Supabase shows zero rows under those values in 90 days; 8 'Website' fallback rows exist (most recent 2026-04-30) — likely Netlify deploy gap. Read-only Supabase: `drip_sends`=0, `drip_enrollments`=0, PA Funnel=0 (12th day), Rate Alert=0 (36 days), Quick Quote=0, Quick Contact=0, Website=8 (90d). NotebookLM PULL + PUSH SKIPPED — CLI auth still expired (2nd consecutive session, same as 2026-05-03 PM).

**Active blockers:** Carryover — (1) Realtor Relationships activation criteria + cadence (Adam; 4 email bodies drafted 2026-04-30). (2) Long-Term Nurture + Past Client Retention archive-vs-author (Adam). (3) TCPA copy approval (Sendblue prereq, Adam). (4) Sendblue signup (Adam) — outbound iMessage per GOALS.md. (5) GSC fresh export deferred to SEO/SEM 90-day pull. (6) Drip first-enrollment validation pending — 5+ wks zero movement. (7) 7 `/get-preapproved.html` HIGH-tier fixes pending Adam authorize. (8) 5 `/rate-alert.html` HIGH-tier fixes pending. **NEW (9):** 5 homepage-forms HIGH-tier fixes — H1 TCPA bundled-consent (BOTH forms) is the same shape as get-preapproved fix and rate-alert H1; H4 Loan Goal taxonomy unification ties to /get-preapproved M6; H5 lead_source body propagation needs deploy-status verification. **NEW (10):** NotebookLM CLI auth restoration — Adam must run `/Users/adamstyer/.local/bin/notebooklm login` to unblock both Lead Gen + SEO/SEM nightly syncs.

**What's next:** (1) Adam ships single 30-min PR for site-wide TCPA two-checkbox split (homepage 2 forms + rate-alert form). Closes BLOCKER-001 entirely. (2) Verification pass next session on H5 deploy gap — read-only check whether `lead_source: 'Quick Quote'` literal is present in styermortgage.com production page source. (3) Tomorrow's mission with all 3 main funnel pages audited: pick from (a) homepage above-the-fold non-form review, (b) `/thank-you.html` post-submit (handles 3 funnel types), (c) `/refinance-quote.html` audit (4th funnel surfaced today). (4) If `notebooklm login` restored, run delayed PUSH covering this session output. (5) Skip page re-audit until at least one HIGH-tier change ships.

## SEO/SEM Agent Status

**Last worked on:** 2026-05-03 PM — Nightly NotebookLM PUSH+CURATE **SKIPPED — CLI auth expired**. All `notebooklm` commands return `Authentication expired or invalid. Run 'notebooklm login' to re-authenticate.` Cannot run interactively from a scheduled task; Adam must run `notebooklm login` to restore. Steps 1–6 (activate, staleness audit, web sweep, push, master sync, digest) all blocked at Step 1. Local files unchanged; nothing destructive performed. Logged tasks/seo-sem/notebooklm-errors.md (2026-05-03). Same auth failure also blocked Lead Gen sync this session. Prior session (2026-05-02 PM) was the last successful PUSH+CURATE.

**Active blockers:** **NEW:** notebooklm CLI auth expired — blocks all SEO/SEM + Lead Gen nightly NotebookLM syncs until Adam runs `notebooklm login`. Carryover unchanged: site-wide USDA dropdown cascade (Smithville/Elgin/Florence/Jarrell + `/loans/usda.html` disposition, HIGH); about.html LocalBusiness vs index.html MortgageBroker address mismatch (6th run, MEDIUM); about.html timeline-date span "91 Google + 45 Zillow" refresh-or-mark-historical (MEDIUM); GTM suburb quick-form not counted as Google Ads conversion ($500/mo unattributed, HIGH); 90-day GSC export not pulled (HIGH — also blocks Lead Gen funnel diagnosis); AEO insertion call on `2026-04-27-why-home-prices-arent-crashing.html` (structural, 2nd recurrence); voice-first essay-format AEO carve-out policy (5-post cluster); NotebookLM PULL Step 0 retirement diff (14th run).

**What's next:** (1) Adam runs `/Users/adamstyer/.local/bin/notebooklm login` to restore CLI auth — unblocks both nightly syncs immediately. (2) USDA compliance cleanup once Adam decides cascade scope. (3) GSC URL Inspection sweep — Hutto/Round Rock/Bee Cave/Lakeway. (4) Round 2 suburb deepening kickoff — Round Rock slot 1, replicate Westlake Hills depth pattern. (5) Voice-first essay-format AEO carve-out policy decision.

## Scenarios Agent Status

**Last worked on:** 2026-05-03 AM — 9th consecutive no-build exit (Apr 25/26/27/28/29/30 + May 1 + May 2 + May 3). Tiers 1–8 complete; [GOALS.md](http://GOALS.md) still last-updated 2026-04-20 with no scenarios work; **launch+2; Mon 2026-05-04 is tomorrow** (next GOALS.md weekly refresh — natural drop-the-cron moment). Refreshed NEEDS ADAM in [TODO.md](http://TODO.md) line 19 (9-streak, 2026-05-03 added to flagged-dates list, recommendation strongest yet for option (a) retire NOW since GOALS refresh is tomorrow).

**Active blockers:** No mission — needs retire / redirect / pause decision ([TODO.md](http://TODO.md) NEEDS ADAM, 9 streaks).

**What's next:** Adam decision: (a) retire cron (strongest — Mon 05-04 GOALS refresh is tomorrow, natural drop-the-cron moment), (b) redirect slot to FNM 3.4 importer (Scott's actual gating item per GOALS.md), (c) leave dormant.

## Standup Agent Status

**Last worked on:** 2026-05-03 — Day 39 standup, post-launch +2. **Zero new commits since Day 38** — HEAD still `4d0323c` (2026-05-02 tracker hygiene). No code, no schema, no n8n changes, no env. Latest prod `dpl_9184MNUWedNav4Qd9rpJeuzp7fCE` (SHA `4d0323c`) READY; all 20 most-recent production deployments READY across 6 days. n8n: 39 workflows total, 5 inactive (all intentional, unchanged). MCP shows no failed-execution flag on any active workflow. **Three consecutive launch-window days have produced only tracker-hygiene + maintenance** (May 1 launch day → May 2 +1 → May 3 +2). Mon 2026-05-04 is tomorrow — next GOALS.md weekly refresh, next opportunity for new direction.

**Active blockers:** All Day 38 items unchanged. Scott's mailbox still ungated (DKIM on `mortgagesolutionslp.com` OR MS Graph OAuth — neither completed, 5th day); 5 canonical n8n credentials uncreated (gates 22-workflow inline-secret migration); Anniversary Check-In malformed-JWT — broken dedup, 2 crons fired since first run, Adam fix pending; `LOANOS_AGENT_SECRET`, TCPA + Sendblue, 3 unauthored drip campaigns, marketing site silent, selfies (29+ days), notes/activity log (10+ days), MISMO multi-borrower regex, FNM 3.4 / Calyx Point ingestion end-to-end, conversion-audit ship-approvals on `/get-preapproved.html` + `/rate-alert.html` (10 HIGH-tier total queued in styerteam-mortgage-site repo), Scenarios cron retire/redirect (9th consecutive no-op AM run today), NotebookLM playbook reconcile (~6 nights).

**What's next:** (1) Verify `drip_sends` (6th consecutive day at 0 per AM read-only checks) — manually enroll one Adam-controlled contact in PA Welcome to prove end-to-end loop. (2) MS Graph adapter synthetic round-trip — lab-validate before Scott is offered the DKIM-alternative path. (3) FNM 3.4 / Calyx Point co-borrower regex characterization with synthetic 2-borrower fixture (4th day carryover). (4) Notes / activity log fix — re-read original brief and start (4th day carryover). **Recommendation surfaced again (Day 38 + Day 39):** reserve a single 60-min Adam block to clear (a) Resend DKIM, (b) 4 styerteam-mortgage-site PR ship-approvals, (c) Scenarios retire vs redirect, (d) NotebookLM playbook reconcile — all minutes-of-decision, gating ~5 streams of autonomous work. Tomorrow's GOALS.md refresh is the natural moment.

## Rules For AI Sessions

- **UI changes**: Prefer `docs/THEME.md` + text spec. Don't require screenshots.
- Always read this file before starting
- Always update this file when something significant changes (keep it short — details go in CHANGELOG)
- Always update [CHANGELOG.md](http://CHANGELOG.md) at end of session
- Always update the build tracker (`/public/docs/loanos.html`) at end of session
- At end of session: update [CONTEXT.md](http://CONTEXT.md), commit, push to main
- Never break styer-mortgage-site tools
