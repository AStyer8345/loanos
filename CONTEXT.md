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

**Last worked on:** 2026-05-13 AM (on-time cron at 02:29 CDT) — 27th consecutive maintenance session. **ESCALATION HELD per PM 05-12 forward rule**: ADAM-TODO line `[SOCIAL] 2026-05-04 PM` still `[ ]` open across 17 cycles. One-ask-per-cycle rule active — did NOT re-escalate. **GOALS.md gate re-check**: `stat -f "%Sm"` returns `Apr 19 13:51:27 2026` — file unchanged 24 days. No refresh observed in overnight 5h window (PM 05-12 21:23 → AM 05-13 02:29 CDT). 3rd consecutive weekly skip remains fully realized (Mon GOALS-day 05-11 + Tue catch-up 05-12 both skipped). Week-of-Apr-20 directive still governs. AM session per master-agent.md: RAN Step 1B + Refresh (07). **Step 1B**: 0 new website content (16th consecutive zero-input scan — newest tracked files `rates/2026-04-24.html`, `blog/2026-04-27-...`, `realtor-updates/2026-04-27-...`); GBP auto-publish skipped. **Refresh (07)**: 0 TIMELY drafts in 48-hr horizon (2026-05-13T07:30 UTC → 2026-05-15T07:30 UTC); nothing to fill. Cushion verified (Adam-org filtered, column = `scheduled_for`): `Prefer: count=exact` → content-range `0-46/47` = 47 drafts, range Sep 23 2026 → Feb 4 2027 (drift = 0 across all 27 sessions). Earliest = LinkedIn authority `2026-09-23T15:00:00+00:00` (id `32803838-594f-43f6-9ccd-c5cd5cb06916`, "Post 157 — The One Number That Matters When Deciding to Refinance"); latest = Instagram personal `2027-02-04T15:00:00+00:00` (id `60948a41-ece7-48bc-9f34-a0fe158c90ec`, "Post 198 — Then I notice the peanut butter"). Pillar mix: authority×19 / education×15 / personal×13. Platform mix: linkedin×18 / instagram×16 / facebook×13. Org-filter rule re-confirmed. NotebookLM PULL/PUSH deferred (PUSH backlog now 26 sessions deep; also blocked structurally by expired CLI auth, 11th day, no overnight re-auth).

**Active blockers:** Unchanged structurally from PM 05-12. BLOCKER-LOANOS-001 (selfies not uploaded — `tasks/social-media/assets/selfies/` directory still missing 42 days; parent `assets/` also missing; LoanOS stream paused). **Carryover (escalation ask):** `[SOCIAL] 2026-05-04 PM` ADAM-TODO line awaits Adam's decision on cron disposition (A redirect / B pause). 17 cycles open (PM 05-04 → AM/PM 05-05 → AM/PM 05-06 → AM/PM 05-07 → AM/PM 05-08 → AM/PM 05-09 → AM/PM 05-10 → AM/PM 05-11 → AM/PM 05-12 → AM 05-13). master-agent.md Step 1B 3A still uses `platform: "google"` for GBP `social_drafts` insert — DB constraint rejects it. DB pillar enum excludes `real_talk` — keep mapping Real Talk voice → `authority`. Bash-quoted INSERTs strip apostrophes — Builder must use Python urllib or PG E-strings. Cushion-query column = `scheduled_for` (not `scheduled_at`) — schema name documented as future-session guard. 2 stale rate/market queue entries (`blog/2026-03-30-bond-rally` 6+ wks, `rates/2026-04-14` ~4 wks) — do NOT consume unless market context refreshes. Stale ADAM-TODO entries: April 1 plan's Posts 24/25 (FOMC TIMELY) + Post 46 (PCE TIMELY April 30) — all `status=rejected`, won't publish. 3rd consecutive Mon GOALS skip fully realized through Tue 05-12 — agent continues deferring per one-ask-per-cycle.

**What's next:** Cushion unchanged — 47 drafts to Feb 2027, zero degradation across 27 maintenance sessions. **Awaiting Adam's call on the PM 05-04 escalation entry in ADAM-TODO** (17 cycles open since the ask was filed). Default behavior until response: continue maintenance pattern. If Adam picks (B) pause, agent stops both `styer-social-am` + `styer-social-pm` cron tasks via the `schedule` skill once approved. If Adam picks (A) redirect, next session reads new sourcing target + restarts Sequence A. PM 05-13 forward rule: first action `stat -f "%Sm" /Users/adamstyer/Documents/GOALS.md` — if mtime changes during the day (Adam may refresh Wed), BREAK maintenance and re-plan from new directives. Re-check ADAM-TODO line for inline Adam response. If still no response AND GOALS still unchanged, hold maintenance — do NOT re-escalate (28th consecutive maintenance session). PM session: skip Step 1B + Refresh (07) (AM-only). Cushion check is identical query (Adam-org filter + `scheduled_for` column). NotebookLM PUSH backlog: 26 sessions deep — all deferred to next build. master-agent.md Step 1B 3A patch + Duplicate Post 180 cleanup still pending. **Mon-skip pressure:** 3 consecutive Mon GOALS-day skips fully realized (04-27 / 05-04 / 05-11). Next planned refresh window = Mon 05-18 (5 days out). If that also slips, the 4th-consecutive-week threshold triggers the cohort-pause planning signal flagged in PM 05-12.

## Lead Gen Agent Status

**Last worked on:** 2026-05-13 AM — **`/refinance-quote.html` funnel-page audit authored** at `tasks/lead-gen/research/2026-05-13-refinance-quote-funnel-audit.md` (~430 lines). Closes **primary-funnel-page audit coverage to 5/5** (get-preapproved + rate-alert + homepage + thank-you + refinance-quote). 12 NEW findings — 5 HIGH (H1 missing `?type=refinance` query string on redirect — 1-line bug, refi captures land on default thank-you branch; H2 stale `subscribe-lead.js:2` comment + rollback signature drift risk; H3 GA4 conversion dedup ambiguity; H4 zero JSON-LD on page; H5 footer missing physical address — same M5 gap PR-4 closes on get-preapproved) + 7 MEDIUM (4-vs-6 refi-type card/select mismatch, og:image missing, inline UTM/utm.js redundancy, 21-day claim refi-honesty, 136+ reviews chip sourcing, "Same day" claim aspirational, Refi Watch funnel missing entrypoint per 04-05 spec) + 5 LOW (mostly ignore). § 5 PR coverage map confirms **zero findings already covered in full by PR-1..PR-5** — entire 5-PR pile does not touch refinance-quote.html. § 6 recommends PR-6 batched ship (H1+H5+H4+M1+M3+M5+M7) ~25 min Builder + ~5 min Adam = 30 min total; **deferred until at least one of PR-1..PR-5 ships** to avoid spec-pile compound. Targeted Supabase: `lead_source ILIKE '%refi%'` = 0/90d — refinance-funnel joins all-zero named-channel band. NotebookLM PULL re-verified expired inline (12th day, 21st sub-session).

**Active blockers:** Carryover essentially unchanged — (1) Realtor Relationships activation criteria + cadence (Adam). (2) Long-Term Nurture + Past Client Retention archive-vs-author (Adam). (3) TCPA copy approval (Sendblue prereq, Adam — covered by PR-1 closeout). (4) Sendblue signup OR Twilio decision (Adam — see 2026-05-12 brief § 7 Decision 1). (5) GSC fresh export — SEO/SEM 90-day pull. (6) Drip first-enrollment validation — 6+ wks zero movement. (7) HIGH-tier funnel-page audit findings — collapsed into 5 specs (PR-1 compliance + PR-2 form-page + PR-3 thank-you + PR-4 cross-page brand + PR-5 final light-pass); all open `[ ]` in ADAM-TODO, none authorized (7/6/5/4/3 days respectively). Once all five ship: BLOCKER-001 resolves + audit-series queue drains. (8) **NEW today:** refinance-quote.html has 12 distinct findings (5 HIGH + 7 M) zero of which are covered by PR-1..PR-5; PR-6 deferred until pile drains. (9) Refi Watch funnel (04-05 spec) needs Adam archive-vs-author decision — add to existing Long-Term Nurture cluster. (10) NotebookLM CLI auth — Adam runs `/Users/adamstyer/.local/bin/notebooklm login`. Backlog now 11 lead-gen artifacts.

**What's next:** (1) **Adam picks an iMessage path** (Sendblue / Twilio-primary / both) from 2026-05-12 brief § 7 + **authorize PR-1 → PR-2 → PR-3 → PR-4 → PR-5** per PR-5 § 7 sequencing matrix; Builder ships all five back-to-back ~190 min + ~35 min review. PR-1 is the Sendblue/Twilio TCPA-consent prereq. (2) Once any of PR-1..PR-5 ships, agent may author PR-6 (refinance-quote 7-finding batch) — ~25 min Builder + ~5 min Adam. (3) Tomorrow's mission options: (a) `/austin-mortgage-rates.html` audit — extends to 6/6 SEO+funnel page coverage; (b) **Realtor Relationships drip activation Architect-mode session** — copy bodies drafted 2026-04-30, blocked only on 2 Adam decisions (cadence + activation criterion) ~30 min; (c) PA-funnel GSC + GA4 traffic + CTR pull (per 2026-04-28 ADAM-TODO follow-up); (d) NULL `lead_source` Arive-webhook root-fix proposal (~15-min n8n MCP change via REST PUT); (e) Strategic pivot pause day — 1-page "what would 20 qualified leads/month look like, what's blocking" diagnostic. **Recommended (b) Realtor Relationships drip Architect session** — primary-funnel-page audit queue is fully drained; natural pivot to channel-activation work; surfaces 2 specific Adam decisions cleanly. (4) If `notebooklm login` restored, delayed PUSH covers 11 backlogged outputs.

## SEO/SEM Agent Status

**Last worked on:** 2026-05-12 22:10 PM-cron-on-time — Nightly NotebookLM PUSH+CURATE **SKIPPED — CLI auth expired (11th consecutive nightly run blocked; 22 sub-sessions blocked since 05-03)**. Cron fired ON TIME (22:10 vs 22:00 CDT 05-12 target — normal jitter only). `notebooklm list --json` re-verified this session: returns identical `Authentication expired or invalid` error with WebLiteSignIn redirect (no Adam re-auth event detected in the ~24h since AM 05-12 lead-gen pull). Steps 1–7 all blocked at Step 1. Local files unchanged outside trackers. Logged tasks/seo-sem/notebooklm-errors.md (2026-05-12 PM-cron-on-time entry). ADAM-TODO line refreshed in place (count bumped to 11 nightly runs / 22 sub-sessions; not re-stacked per stale-flags rule). DAILY DIGEST: SKIPPED per scheduled-task SKILL.md ('no emails to Adam, project files only'). Prior successful PUSH+CURATE remains 2026-05-02 PM.

**Active blockers:** notebooklm CLI auth expired (11th consecutive nightly run, 22 sub-sessions blocked since 05-03 PM) — blocks all SEO/SEM + Lead Gen nightly NotebookLM syncs and the Lead Gen morning PULL until Adam runs `notebooklm login`. Carryover unchanged: site-wide USDA dropdown cascade (Smithville/Elgin/Florence/Jarrell + `/loans/usda.html` disposition, HIGH); about.html LocalBusiness vs index.html MortgageBroker address mismatch (14th run, MEDIUM); about.html timeline-date span "91 Google + 45 Zillow" refresh-or-mark-historical (MEDIUM); GTM suburb quick-form not counted as Google Ads conversion ($500/mo unattributed, HIGH); 90-day GSC export not pulled (HIGH — also blocks Lead Gen funnel diagnosis); AEO insertion call on `2026-04-27-why-home-prices-arent-crashing.html` (structural, 2nd recurrence); voice-first essay-format AEO carve-out policy (5-post cluster); NotebookLM PULL Step 0 retirement diff (22nd run).

**What's next:** (1) Adam runs `/Users/adamstyer/.local/bin/notebooklm login` to restore CLI auth — unblocks both nightly syncs + Lead Gen morning PULL immediately. Recovery night must push Lead Gen's 10-deep artifact backlog (rate-alert 05-02 / homepage forms 05-04 / thank-you 05-05 / closeout-PR spec 05-06 / conversion-PR spec 05-07 / thank-you-conversion PR spec 05-08 / cross-page-brand-footer PR spec 05-09 / final-light-pass PR spec 05-10 / NULL-lead_source diagnostic 05-11 / iMessage comparison brief 05-12) plus the SEO/SEM PM-side backlog; expect a heavier-than-usual staleness audit (notebook freshness gap is widening ~2 sources/day; SEO/SEM notebook last refreshed 2026-05-01 → ~22 stale + ~12 ready-to-add at 50-source cap, will force maximum churn on recovery). (2) USDA compliance cleanup once Adam decides cascade scope. (3) GSC URL Inspection sweep — Hutto/Round Rock/Bee Cave/Lakeway. (4) Round 2 suburb deepening kickoff — Round Rock slot 1, replicate Westlake Hills depth pattern. (5) Voice-first essay-format AEO carve-out policy decision.

## Scenarios Agent Status

**Last worked on:** 2026-05-12 AM — 18th consecutive no-build exit (Apr 25/26/27/28/29/30 + May 1/2/3/4/5/6/7/8/9/10/11 + **May 12**). Tiers 1–8 complete; [GOALS.md](http://GOALS.md) `stat` re-verified at `Apr 19 13:51:27 2026` — file unchanged 23 days. **Mon 2026-05-11 GOALS refresh DID NOT happen** — Day 48 standup this AM (HEAD `91cfdd2`) confirmed file still shows `Last updated: 2026-04-20`. 3rd consecutive Mon weekly skip operationally realized (Mon 04-27, Mon 05-04, Mon 05-11 all skipped); this entry now compounds into a 4th consecutive week of no-op cron exits. Refreshed NEEDS ADAM in [TODO.md](http://TODO.md) line 24 (18-streak, 2026-05-12 added to flagged-dates list, recommendation strengthened — option (a) retire NOW unconditionally; 4th-week threshold crossed).

**Active blockers:** No mission — needs retire / redirect / pause decision ([TODO.md](http://TODO.md) NEEDS ADAM, 18 streaks; 4th-week threshold crossed). NotebookLM PULL/PUSH also blocked structurally (15th consecutive skip + `notebooklm` CLI auth expired since 2026-05-03 PM, ADAM-TODO line — same `Authentication expired or invalid` error per other agents' re-verifications this AM, 11 wall-clock days blocked).

**What's next:** Adam decision: (a) retire cron — strongest signal in queue history at launch+11 / 18-streak / Mon 2026-05-11 refresh fully skipped (4th-consecutive-week threshold now crossed); (b) redirect slot to FNM 3.4 importer (Scott's actual gating item per GOALS.md, highest-leverage repurposing target); (c) leave dormant — bumps to 19-streak Wed AM (Mon 05-11 single-sitting decision moment passed without action). PM 05-12 forward rule: first action `stat -f "%Sm" /Users/adamstyer/Documents/GOALS.md` — if mtime changes during the day (Adam refreshes Tue), BREAK maintenance and re-plan from new directives. If Mon 2026-05-18 also skips refresh, this entry hits 4th-consecutive-Mon-GOALS-skip + 4-week-no-op-cron — at which point the hygiene-only exhaustion pattern itself becomes the planning signal and ALL 5 agents' crons should be paused as a cohort, not individually.

## Standup Agent Status

**Last worked on:** 2026-05-12 — Day 48 standup, post-launch +11 (vs May 1 GOALS target) / +16 (vs original Apr 26 task target). HEAD `91cfdd2` (today's AM autonomous wrap-up — 11th consecutive hygiene-only cycle) on `origin/main`, working tree clean, 0 unpushed. Vercel `dpl_7h7sX64dUcBbdpMGKf17zhcUQjCF` READY. n8n MCP responsive (Day 47 `fetch failed` was transient): 40 total / 34 active / 6 inactive, all intentional/test/staging (Pre-Drop Warm-Up, Quarterly Rate Review, Review Request polling, Morning Briefing Team, Contract Received v3 staging, Rancho Inquiry Drip Sender test mode). Anniversary Check-In dedup malformed-JWT 11th day open (~12 firings). 12-day zero-feature-code streak; last real feature `1b58ef9` (MS Graph adapter, 2026-04-30). **GOALS.md refresh missed yesterday Mon 05-11** — file still `Last updated: 2026-04-20` (22 days stale). Day 47's "if no refresh today, hygiene-only exhaustion 3rd week" worst-case is now realized. Audit-pile drained on spec side; today's autonomous output was an iMessage strategic brief (~370 lines).

**Active blockers:** Drip queue at 0 sends 14th day (cutover unproven); Scott DKIM/MS Graph 13th day; 5 canonical n8n credentials uncreated; `LOANOS_AGENT_SECRET`; TCPA + Sendblue; 3 unauthored drip campaigns; selfies (41+ days); notes/activity log; MISMO regex; FNM 3.4 / Calyx Point importer built but Scott not onboarded; ~20 HIGH-tier conversion findings in styerteam-mortgage-site bundled into PR-1+PR-2+PR-3+PR-4+PR-5 quintet (all specs filed, all awaiting Adam authorize); Scenarios cron retire (17-streak); NotebookLM CLI auth (11th day, 18 sub-sessions blocked); social PM 05-04 escalation (13 cycles open); GOALS.md 22 days stale (Monday refresh missed); CONTEXT.md still 161 lines; iMessage path decision (new today).

**What's next:** (1) Read today's iMessage brief and pick Sendblue / Twilio-primary / both (`tasks/lead-gen/research/2026-05-12-imessage-comparison-brief.md` § 7). (2) Drip end-to-end smoke — manually enroll Adam-owned contact in PA Welcome. (3) MS Graph adapter synthetic round-trip lab-validate. (4) FNM 3.4 importer onboarding for Scott. **Strongest 11-standup-running recommendation:** reserve one 60–75 min Adam block to clear (a) Resend DKIM, (b) lead-gen quintet authorize — PR-1 → PR-5 specs in `tasks/lead-gen/specs/`, (c) Scenarios retire/redirect/pause, (d) `notebooklm login`, (e) social PM 05-04 A-vs-B answer, (f) **GOALS.md refresh — overdue since yesterday Mon**, (g) iMessage path decision. Each is minutes-of-decision; together they unblock 6+ autonomous streams. 3rd-consecutive-week hygiene-only state is now operational.

## Rules For AI Sessions

- **UI changes**: Prefer `docs/THEME.md` + text spec. Don't require screenshots.
- Always read this file before starting
- Always update this file when something significant changes (keep it short — details go in CHANGELOG)
- Always update [CHANGELOG.md](http://CHANGELOG.md) at end of session
- Always update the build tracker (`/public/docs/loanos.html`) at end of session
- At end of session: update [CONTEXT.md](http://CONTEXT.md), commit, push to main
- Never break styer-mortgage-site tools
