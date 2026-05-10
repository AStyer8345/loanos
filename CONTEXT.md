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

**Last worked on:** 2026-05-10 AM (on-time cron at 02:29 CDT) — 21st consecutive maintenance session (AM 04-30 → PM 04-30 → AM 05-01 → PM 05-01 → AM 05-02 → PM 05-02 → AM 05-03 → PM 05-03 → AM 05-04 → PM 05-04 → AM 05-05 → PM 05-05 → AM 05-06 → PM 05-06 → AM 05-07 → PM 05-07 → AM 05-08 → PM 05-08 → AM 05-09 → PM 05-09 → **AM 05-10**). **ESCALATION HELD per PM 05-09 forward rule**: ADAM-TODO line `[SOCIAL] 2026-05-04 PM` still `[ ]` open across 11 cycles (filed PM 05-04 → unanswered through AM/PM 05-05 → AM/PM 05-06 → AM/PM 05-07 → AM/PM 05-08 → AM/PM 05-09 → AM 05-10). One-ask-per-cycle rule active — did NOT re-escalate. **GOALS.md re-checked**: `stat -f "%Sm"` returns `Apr 19 13:51:27 2026` — file unchanged 21 days. Mon 05-04 GOALS day passed; next natural refresh Mon 2026-05-11 (1 day out — tomorrow). Week-of-Apr-20 directive still governs. AM session: ran Step 1B (GBP scan, 15th consecutive zero-input) + Refresh (07, 0 TIMELY in 48-hr horizon May 10 00:00 → May 12 07:30 UTC) per master-agent.md. Cushion verified (Adam-org filtered): Supabase `social_drafts?organization_id=eq.18613f82-fdd9-42dd-a09e-f3c577328258&status=eq.draft` `Prefer: count=exact` → content-range `0-46/47` = 47 drafts, range Sep 23 2026 → Feb 4 2027 (drift = 0 across all 21 sessions). Pillar totals: authority×19, personal×13, education×15. Platform totals: linkedin×18, instagram×16, facebook×13. Org-filter rule re-confirmed: unfiltered query returns 232 rows (mostly older LoanOS demo-seed); always filter by Adam's org_id + status=draft. NotebookLM PULL/PUSH deferred (PUSH backlog now 20 sessions deep; also blocked structurally by expired CLI auth, 8th day).

**Active blockers:** Unchanged structurally from PM 05-09. BLOCKER-LOANOS-001 (selfies not uploaded — `tasks/social-media/assets/selfies/` directory still missing 38 days; parent `assets/` also missing; LoanOS stream paused). **Carryover (escalation ask):** `[SOCIAL] 2026-05-04 PM` ADAM-TODO line awaits Adam's decision on cron disposition (A redirect / B pause). 11 cycles open (PM 05-04 → AM 05-05 → PM 05-05 → AM 05-06 → PM 05-06 → AM 05-07 → PM 05-07 → AM 05-08 → PM 05-08 → AM 05-09 → PM 05-09 → AM 05-10). master-agent.md Step 1B 3A still uses `platform: "google"` for GBP `social_drafts` insert — DB constraint rejects it. DB pillar enum excludes `real_talk` — keep mapping Real Talk voice → `authority`. Bash-quoted INSERTs strip apostrophes — Builder must use Python urllib or PG E-strings. 2 stale rate/market queue entries (`blog/2026-03-30-bond-rally` 6+ wks, `rates/2026-04-14` ~4 wks) — do NOT consume unless market context refreshes. Stale ADAM-TODO entries: April 1 plan's Posts 24/25 (FOMC TIMELY) + Post 46 (PCE TIMELY April 30) — all `status=rejected`, won't publish.

**What's next:** Cushion unchanged — 47 drafts to Feb 2027, zero degradation across 21 maintenance sessions. **Awaiting Adam's call on the PM 05-04 escalation entry in ADAM-TODO** (11 cycles open since the ask was filed). Default behavior until response: continue maintenance pattern. If Adam picks (B) pause, agent stops both `styer-social-am` + `styer-social-pm` cron tasks via the `schedule` skill once approved. If Adam picks (A) redirect, next session reads new sourcing target + restarts Sequence A. If Adam ignores, PM 05-10 will be the 22nd consecutive maintenance session; the next natural decision point becomes Mon 2026-05-11 GOALS refresh (1 day out — tomorrow, 2 more no-op cron fires until then). PM 05-10 forward rule: re-check `tasks/ADAM-TODO.md` for `[SOCIAL] 2026-05-04 PM` line — if Adam responded between AM 05-10 and PM 05-10, follow chosen branch. If still no response, hold maintenance — do NOT re-escalate (one ask per cycle, still active). PM session: skip Step 1B + Refresh (07) per master-agent.md. Cushion check is identical query (Adam-org filter required). If GOALS.md mtime changes, break maintenance and re-plan. NotebookLM PUSH backlog: 20 sessions deep — all deferred to next build. master-agent.md Step 1B 3A patch + Duplicate Post 180 cleanup still pending.

## Lead Gen Agent Status

**Last worked on:** 2026-05-10 AM — **PR-5 Final Light-Pass Spec authored** at `tasks/lead-gen/specs/2026-05-10-final-light-pass-pr-spec.md` (~470 lines). Single PR closes the entire 4-audit pile: ~40 atomic edits across 6 conceptual clusters spanning 6 source files (`get-preapproved.html`, `rate-alert.html`, `index.html`, `thank-you.html`, `script.js`, `subscribe-lead.js`). Cross-cut A (Loan Goal taxonomy unified across 3 funnel surfaces + TAG_MAP); Cross-cut B+C (MortgageBroker + Service JSON-LD + meta description + OG image fallback on get-preapproved + rate-alert); Cross-cut D (21-day footnote sourcing on both pages); homepage polish + M2 purchase_price_range cross-page parity (mirror PR-2 pattern); get-preapproved hero promotion + microcopy; thank-you + rate-alert polish bundle (per-branch document.title, per-branch Calendly h2, em-dash literal cleanup, GA sessionStorage dedup, mobile order removal, form-tagline microcopy, rate-move language softened, loans-closed fallback social proof). 8 LOW + 2 NONE risk rows; no MEDIUM/HIGH. § 6 Adam-data prereqs (3 decisions, ~3 min): canonical Loan Goal taxonomy variant (A audit-default vs B M6 wording), canonical email + address (carry-over from PR-4 § 6), 21-day average confirmation (default ships conservative footnote without retroactive PR-3 swap). Pipeline read-only (03:48 CT, 9th baseline): drip_sends=0, drip_enrollments=0, PA Funnel=0 (18th day), Rate Alert=0 (42 days), Quick Quote/Contact=0, Website=8 (90d unchanged), AEO=5, Web Lead=2, **lead_source IS NULL=1 (NEW datapoint — `srhoyt5@gmail.com` 05-09 21:51 UTC, first NULL-source row observed)**, contacts_7d=4 (was 3 — net +1 from the NULL row). NotebookLM PULL + PUSH SKIPPED — CLI auth still expired (9th day, 15th sub-session blocked).

**Active blockers:** Carryover unchanged structurally — (1) Realtor Relationships activation criteria + cadence (Adam). (2) Long-Term Nurture + Past Client Retention archive-vs-author (Adam). (3) TCPA copy approval (Sendblue prereq, Adam). (4) Sendblue signup (Adam). (5) GSC fresh export — SEO/SEM 90-day pull. (6) Drip first-enrollment validation — 5+ wks zero movement. (7-10) HIGH-tier funnel-page audit findings unactioned — **collapsed into 5 spec asks: PR-1 (compliance) + PR-2 (form-page) + PR-3 (thank-you) + PR-4 (cross-page brand+footer) + PR-5 (final light-pass M+L). Consolidation arc CLOSED. Audit-series queue fully drained once all 5 ship.** (12) PR-1 ready 05-06; (13) PR-2 ready 05-07; (14) PR-3 ready 05-08; (15) PR-4 ready 05-09; (16) PR-5 ready 05-10. Once all five ship: BLOCKER-001 resolves + ~15 HIGH-tier fixes land + ~25 M+L tier fixes land + 5 of 5 series compliance FAILs close + audit-series queue drains. (11) NotebookLM CLI auth restoration — Adam must run `/Users/adamstyer/.local/bin/notebooklm login`. Backlog now 8 lead-gen artifacts queued (3 audits + 5 specs). NEW: NULL lead_source row pattern surfaced (1 row 05-09) — out-of-scope for PR-5; needs separate investigation when bandwidth allows.

**What's next:** (1) **Adam authorize PR-1 + PR-2 + PR-3 + PR-4 + PR-5** — recommended order PR-1 → PR-2 → PR-3 → PR-4 → PR-5 per PR-5 spec § 7 sequencing matrix; Builder ships all five back-to-back in ~190 min total + ~35 min Adam review. PR-3 + PR-4 + PR-5 can bundle into one Builder push (all single-page-low-risk on `thank-you.html` + others). PR-5 must rebase on top of PR-2 for `script.js` Quick Contact handler conflict and `index.html` line 408 CTA + `get-preapproved.html` line 376–382 Loan Goal. (2) Tomorrow's mission options if Adam doesn't authorize: (a) `/refinance-quote.html` audit — natural extension to 5/5 funnel coverage; produces clean baseline before agent shifts to net-new strategic work. (b) `/austin-mortgage-rates.html` audit — high-traffic SEO landing capture surface; never audited. (c) Architect-mode strategic work on net-new lead-gen channels (Realtor Relationships drip activation pending Adam decisions, Long-Term Nurture archive vs author). (d) Deterministic POST verification probe — DOWNGRADED priority per 05-09 correction. (e) Coordinate with SEO/SEM agent on lead_source taxonomy. (3) If `notebooklm login` restored, delayed PUSH covers 8 backlogged outputs. **Recommended tomorrow: option (a) `/refinance-quote.html` audit** — closes funnel-page audit series at 5/5 coverage, clean baseline before strategic pivot. (4) NEW: NULL lead_source investigation (1 row 05-09) — separate ~30-min audit when next bandwidth allows.

## SEO/SEM Agent Status

**Last worked on:** 2026-05-09 22:00 PM-cron-on-time — Nightly NotebookLM PUSH+CURATE **SKIPPED — CLI auth expired (8th consecutive nightly run blocked; 14 sub-sessions blocked since 05-03)**. Cron fired ON TIME (22:00 vs 22:00 target — no jitter). `notebooklm list --json` returns same `Authentication expired or invalid` error with WebLiteSignIn redirect. Steps 1–7 all blocked at Step 1. Local files unchanged outside trackers. Logged tasks/seo-sem/notebooklm-errors.md (2026-05-09 PM-cron-on-time entry). ADAM-TODO line refreshed in place (count bumped to 8 days / 8 nightly runs / 14 sub-sessions; not re-stacked per stale-flags rule). Prior successful PUSH+CURATE remains 2026-05-02 PM.

**Active blockers:** notebooklm CLI auth expired (8th consecutive day, 8th nightly run, 14 sub-sessions blocked since 05-03 PM) — blocks all SEO/SEM + Lead Gen nightly NotebookLM syncs and the Lead Gen morning PULL until Adam runs `notebooklm login`. Carryover unchanged: site-wide USDA dropdown cascade (Smithville/Elgin/Florence/Jarrell + `/loans/usda.html` disposition, HIGH); about.html LocalBusiness vs index.html MortgageBroker address mismatch (11th run, MEDIUM); about.html timeline-date span "91 Google + 45 Zillow" refresh-or-mark-historical (MEDIUM); GTM suburb quick-form not counted as Google Ads conversion ($500/mo unattributed, HIGH); 90-day GSC export not pulled (HIGH — also blocks Lead Gen funnel diagnosis); AEO insertion call on `2026-04-27-why-home-prices-arent-crashing.html` (structural, 2nd recurrence); voice-first essay-format AEO carve-out policy (5-post cluster); NotebookLM PULL Step 0 retirement diff (19th run).

**What's next:** (1) Adam runs `/Users/adamstyer/.local/bin/notebooklm login` to restore CLI auth — unblocks both nightly syncs + Lead Gen morning PULL immediately. Recovery night will need to push Lead Gen's 7-deep artifact backlog (rate-alert 05-02 / homepage forms 05-04 / thank-you 05-05 / closeout-PR spec 05-06 / conversion-PR spec 05-07 / thank-you-conversion PR spec 05-08 / cross-page-brand-footer PR spec 05-09) plus the SEO/SEM PM-side backlog; expect a heavier-than-usual staleness audit (notebook freshness gap is widening ~2 sources/day; SEO/SEM notebook last refreshed 2026-05-01 → ~16 stale + ~9 ready-to-add at 50-source cap). (2) USDA compliance cleanup once Adam decides cascade scope. (3) GSC URL Inspection sweep — Hutto/Round Rock/Bee Cave/Lakeway. (4) Round 2 suburb deepening kickoff — Round Rock slot 1, replicate Westlake Hills depth pattern. (5) Voice-first essay-format AEO carve-out policy decision.

## Scenarios Agent Status

**Last worked on:** 2026-05-09 AM — 15th consecutive no-build exit (Apr 25/26/27/28/29/30 + May 1/2/3/4/5/6/7/8 + **May 9**). Tiers 1–8 complete; [GOALS.md](http://GOALS.md) `stat` re-verified at `Apr 19 13:51:27 2026` — file unchanged 20 days, Mon 2026-05-04 refresh day skipped. Refreshed NEEDS ADAM in [TODO.md](http://TODO.md) line 23 (15-streak, 2026-05-09 added to flagged-dates list, recommendation unchanged — option (a) retire NOW; 2 more no-op runs forecast unless decided before Mon 2026-05-11).

**Active blockers:** No mission — needs retire / redirect / pause decision ([TODO.md](http://TODO.md) NEEDS ADAM, 15 streaks). NotebookLM PULL/PUSH also blocked structurally (12th consecutive skip + `notebooklm` CLI auth expired since 2026-05-03 PM, ADAM-TODO line — same `Authentication expired or invalid` error per other agents' re-verifications this AM).

**What's next:** Adam decision: (a) retire cron — strongest signal yet at launch+8 / 15-streak; (b) redirect slot to FNM 3.4 importer (Scott's actual gating item per GOALS.md, highest-leverage repurposing target); (c) leave dormant — bumps to 16-streak tomorrow. Without Mon 2026-05-11 refresh, no fresh signal arrives in autonomous mode for 2 more runs.

## Standup Agent Status

**Last worked on:** 2026-05-08 — Day 44 standup, post-launch +7 (vs May 1 GOALS target) / +12 (vs original Apr 26 task target). HEAD `255fecd` (today's AM autonomous wrap-up) on `origin/main`, working tree clean, 0 unpushed. Vercel `dpl_H7mBD9U1rx67ExCX5Vn7hRmAf9Lu` READY. n8n 34 active / 5 inactive (all intentional, unchanged from Day 43). Anniversary Check-In dedup malformed-JWT 7th day open (~7 firings now). 8-day zero-feature-code streak; last real feature `1b58ef9` (MS Graph adapter, 2026-04-30). Auto-lane hygiene-only across all 5 agents for a 9th consecutive cycle. New today: lead-gen filed PR-3 thank-you-conversion spec (~270 lines) — completes the consolidation trilogy (PR-1 + PR-2 + PR-3); 2nd consecutive non-zero `Website` lead-source row (`lucashdr@hotmail.com` 02:29 UTC).

**Active blockers:** Drip queue at 0 sends 10th day (cutover unproven); Scott DKIM/MS Graph 9th day; 5 canonical n8n credentials uncreated; `LOANOS_AGENT_SECRET`; TCPA + Sendblue; 3 unauthored drip campaigns; selfies (33+ days); notes/activity log; MISMO regex; FNM 3.4 / Calyx Point importer (Scott gating); 15 HIGH-tier conversion findings in styerteam-mortgage-site now bundled into PR-1 + PR-2 + PR-3 trilogy (all specs filed, all awaiting Adam authorize); Scenarios cron retire (13-streak); NotebookLM CLI auth (7th day, 11 sub-sessions blocked); social PM 05-04 escalation (7 cycles open); GOALS.md 19 days stale; CONTEXT.md still 161 lines.

**What's next:** (1) Drip end-to-end smoke — manually enroll Adam-owned contact in PA Welcome to prove the loop. (2) MS Graph adapter synthetic round-trip lab-validate before offering Scott the DKIM-alternative. (3) FNM 3.4 importer (Scott's actual beta-gating item per GOALS). **Strongest 7-standup-running recommendation:** reserve one 60-min Adam block to clear (a) Resend DKIM, (b) lead-gen trilogy authorize — PR-1 (`tasks/lead-gen/specs/2026-05-06-compliance-closeout-pr-spec.md`) + PR-2 (`tasks/lead-gen/specs/2026-05-07-conversion-consolidation-pr-spec.md`) + PR-3 (`tasks/lead-gen/specs/2026-05-08-thank-you-conversion-pr-spec.md`), (c) Scenarios retire/redirect/pause, (d) `notebooklm login`, (e) social PM 05-04 A-vs-B answer, (f) GOALS.md refresh (next natural moment Mon 2026-05-11 = 3 days out). Each is minutes-of-decision; together they unblock 6+ autonomous streams. **If Mon 2026-05-11 also skips refresh**, autonomous lanes hit hygiene-only exhaustion for a 3rd consecutive week.

## Rules For AI Sessions

- **UI changes**: Prefer `docs/THEME.md` + text spec. Don't require screenshots.
- Always read this file before starting
- Always update this file when something significant changes (keep it short — details go in CHANGELOG)
- Always update [CHANGELOG.md](http://CHANGELOG.md) at end of session
- Always update the build tracker (`/public/docs/loanos.html`) at end of session
- At end of session: update [CONTEXT.md](http://CONTEXT.md), commit, push to main
- Never break styer-mortgage-site tools
