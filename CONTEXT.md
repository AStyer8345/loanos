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

**Email Automation Dashboard + n8n → Workflow DevKit Phase 1: shipped through shadow mode (2026-04-15 PM). Renovation Phase 2 complete. UI consolidated for LO #2 onboarding (2026-04-16 PM late-4). Security hardening complete (#9 + #10 shipped 2026-04-16 autonomous). Security findings #5 remains (ADAM-BLOCKED — GLBA attorney). 2026-04-17 autonomous: demo data polished (screenshot-ready), n8n blank email fix deployed. 2026-04-18 PM: Analytics dashboard (**`/dashboard/analytics`**) shipped — pipeline health, source conversion, realtor scoreboard, AEO vs SEO, Past Client lead source; commit** `56db9d4`**, analytics consolidated into Dashboard Performance tab** `32b9e5b`**. 2026-04-19 autonomous: loans page** `useEffect` **organizationId dep fix (commit** `a8759a0`**, live in prod** `32b9e5b`**); pre-push hook nvm tolerance fixed locally. 2026-04-19 autonomous (PM): Scenarios Tier 7 Item 2 — "Create Scenario" button on contact detail page, pre-fills borrowerName + propertyAddress from contact record via** `?contact_id=` **param. Marketing site copy pass: 2 false claims removed, KB updated. Commit** `0cd93dc`**, Vercel** `dpl_6PvCut3fRyfo3HFo59jBTCWxoL5o` **→ READY. 2026-04-20 autonomous: BLOCKER-HOT-LEAD-001 closed —** `POST /api/notify/hot-lead` **route shipped (Resend email + daily dedup via activity_log). n8n workflow** `nOCDV73m4M0jyL1B` **updated to 8 nodes — "Notify Adam" httpRequest node now calls endpoint after every hot lead surface. Commit** `358d3f5`**. ADAM-BLOCKED: set** `LOANOS_AGENT_SECRET` **in n8n Settings → Environment Variables so node can authenticate. 2026-04-22 autonomous: Manual Enrollment UI shipped — DRIP CAMPAIGNS card on contact detail always renders;** `+ ENROLL` **button opens inline campaign picker → POST** `/api/drip/campaigns/[id]/enrollments`**. Root cause of drip inactivity: n8n scheduler archived 2026-04-16 + UI hidden when empty. Commit** `b3752fb`**, Vercel READY. PR #4 (**`feat/tenant-scoping-hardening`**) queued for Adam merge — 37 tables probed, 0 leaks, migration 092 applied, Scott cleared for login. 2026-04-24 PM autonomous: Hold List UI shipped — Settings page Hold List card (add form + trash-icon delete), 3 API routes (GET/POST suppressions, DELETE suppressions/\[id\]). Closes Scott Pilot Hold List UI. Cron deploy pipeline unblocked (daily** `0 13 * * *`**, commit** `96b7e93c`**). Commit** `a1c2dec`**, Vercel READY. 2026-04-26 PM autonomous: Recent Activity timeline shipped on** `/dashboard/drip-campaigns` **—** `getRecentSends()` **query helper +** `GET /api/drip/sends/recent` **+** `RecentSendsTimeline.tsx` **(15 most-recent sends across all campaigns, contact/campaign/step/status/relative-time, status-tinted, graceful empty state). Closes recent-sends portion of Drip Dashboard widgets (TODO line 39); completion-rate-per-campaign still open. Commit** `f54c16b`**. 2026-04-27 PM autonomous: Drip Dashboard widgets fully shipped — completion rate per campaign now renders inline on each** `CampaignCard` **("X% completed", with tooltip showing completed / (completed + removed) breakdown; falls back to "— completion" until enrollments finish).** `DripCampaignWithStats` **extended with** `completed_count` **+** `removed_count`**;** `getCampaignsWithStats()` **adds two parallel** `head:true` **count queries per campaign. No schema changes, no new endpoints. Commit** `a4e8f54`**, Vercel** `dpl_7SjND6PJmpHubZFV9TmTrpdTPEMF` **READY (\~80s). 2026-04-28 PM autonomous: MISMO importer follow-ups (Scott Pilot scope) — `MISMOUpload.tsx` now surfaces server error body (`{ error?: string }` with HTTP-status fallback) instead of swallowing as generic "Failed to parse MISMO file"; `api/mismo/import/route.ts` adds secondary dedup branch on `(org_id, contact_id, property_address, loan_amount)` when `loan_number` is absent (covers pre-submission Calyx Point exports). No schema changes, no new endpoints. Build green first pass. **2026-04-28 PM (org-feature-flags): per-org UI flags shipped for Scott Pilot. Migration 094 adds `organizations.features jsonb` (NULL = all-on). Server helper `src/lib/features/getOrgFeatures.ts` (cached per request), client-safe types in `src/lib/features/types.ts`. TopNav, dashboard cards, and contact-detail surfaces (Drip card, Create Scenario, Email Automations) gate on flags. Admin UI at `/admin/feature-flags` (sys-admin only). Adam's row = NULL → unchanged UX; Scott's row = 9 flags false (Contacts/Pipeline/Loans/Settings remain visible). RLS impersonation probe confirmed both paths.** **2026-04-29 PM (Microsoft Graph adapter): Adam shipped commit `1b58ef9` — provider routing on `org_settings.email_provider` (migration 096 adds column + encrypted MS Graph token columns). `sendEmail()` dispatches to Graph or Resend; falls back to Resend on Graph error. `/api/auth/microsoft/connect` HMAC-signed OAuth state. No org has flipped to `microsoft` yet. 2026-05-01 PM autonomous: tracker hygiene cycle (May 1 launch day) — 11 modified tracker files committed, 0 code changes, Vercel pending. Bucket A empty for feature work; all current-phase items Adam-blocked. Anniversary Check-In (`ZUeGy8u8P4o6DPM3`) malformed-JWT bonus finding still open — first cron firing today; impact forward-looking only.

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

**Last worked on:** 2026-05-01 AM — 3rd consecutive maintenance-only session (AM 04-30, PM 04-30, AM 05-01). No build. Cushion intact: 8 drafts (Posts 191–198) Jan 11 → Feb 4, 2027 all `status=draft` (verified via Supabase). 0 TIMELY drafts in 48-hr horizon (May 1 → May 3). Step 1B AM scan: 0 new website content (latest tracked still `rates/2026-04-24.html`, `blog/2026-04-27-why-home-prices-arent-crashing.html`, `realtor-updates/2026-04-27-the-crash-that-isnt-coming-...`). NotebookLM PULL: 4th consecutive AM CLI success (v0.3.4); latest note `3f3ece44` from 2026-04-29 PM combined Wk48+04-30 AM. PUSH deferred (no build = no note material). Decision: held maintenance discipline per PM 2026-04-30 explicit handoff — neither "rate/market slot via new content" nor "Real Talk pillar acute" trigger fired. `today-mission.md` written as MAINTENANCE.

**Active blockers:** Unchanged. BLOCKER-LOANOS-001 (selfies not uploaded — LoanOS stream paused). [master-agent.md](http://master-agent.md) Step 1B 3A still uses `platform: "google"` for GBP `social_drafts` insert — DB constraint rejects it; GBP record-keeping handled by Publer + tracker + activity_log instead. DB pillar enum excludes `real_talk` — keep mapping Real Talk voice → `authority`. Bash-quoted INSERTs strip apostrophes — Builder must use Python urllib or PG E-strings. Stale ADAM-TODO entries: April 1 plan's Posts 24/25 (FOMC TIMELY) + Post 46 (PCE TIMELY April 30) — all `status=rejected`, won't publish; entries safe to ignore but still surface in TODO.

**What's next:** Cushion is 4 weeks deep through Feb 4, 2027 (Posts 191–198). Next session (PM 2026-05-01): scan website for new content (Step 1B AM only — informational only at PM); confirm 0 TIMELY in 48-hr horizon (May 1 → May 3). Build Wk49 (Feb 8–14, 2027) only if (a) a rate/market slot opens via fresh content forcing it, or (b) Real Talk → DB `authority` pillar gap becomes acute. If no trigger, 4th consecutive maintenance session is acceptable — quality > cadence (2026-04-19 rule) overrides cushion expansion. NotebookLM PULL/PUSH deferred PM (efficiency pattern). master-agent.md Step 1B 3A patch + Duplicate Post 180 cleanup still pending.

## Lead Gen Agent Status

**Last worked on:** 2026-05-01 AM — On-page conversion audit of `/get-preapproved.html` (Sequence A — Research). 20 prioritized findings authored across HIGH (5) / MEDIUM (7) / LOW (6) tiers + compliance spot-check + recommended ship order at `tasks/lead-gen/research/2026-05-01-get-preapproved-conversion-audit.md` (~330 lines). HIGH-tier highlights: H1 headline drops the title's "24 Hours / 40+ Lenders" promise; H2 form is missing a purchase-price qualifier (highest-leverage form change — one optional dropdown massively improves lead quality without conversion hit); H3 generic testimonial author names ("Austin Home Buyer" — should be first-name + last-initial + locale + loan-type); H4 non-clickable review trust chip; H5 no rate/time anchor in hero subhead. Compliance spot-check: all clean except M5 (missing licensed branch address in footer — Texas SAFE Act / NMLS MU.4 fix, low effort). Read-only Supabase verification: drip pipeline still 0 sends / 0 enrollments (5 weeks since deploy); `lead_source='Pre-Approval Funnel'` contacts = 0 (9th day). NotebookLM PULL succeeded (CLI v0.3.4, 5-day streak); PUSH planned at session end.

**Active blockers:** Carryover only — (1) Realtor Relationships activation criteria + cadence (Adam). (2) Long-Term Nurture + Past Client Retention archive-vs-author (Adam). (3) TCPA copy approval (Sendblue prereq, Adam). (4) Sendblue signup (Adam). (5) GSC fresh export pull deferred to SEO/SEM agent's 90-day pull. (6) Drip first-enrollment validation pending — pipeline live 24+ hrs with 0 movement is risk signal. **NEW (single batched item, points to audit file):** 7 prioritized site-side fixes recommended for `/get-preapproved.html` (HIGH-tier H1–H5 + MEDIUM M5 + M6).

**What's next:** (1) If Adam picks up the audit, ship H1 + H4 + H5 in single PR (~15 min total) for headline-rewrite + linkable-review-chip + rate/time-anchor — measure CTR delta over 14 days. (2) H2 (purchase-price field) + H3 (named testimonials) — single PR, ~30 min, requires `lead-intake.js` payload update. (3) Builder spec when Adam returns Realtor cadence answer: register `DRIP_CAMPAIGN_IDS.REALTOR_RELATIONSHIPS` in `authored-emails.ts` from 2026-04-30 drafts. (4) Drip first-enrollment validation — Adam manually enrolls one test contact in PA Welcome to confirm pipeline lifecycle. (5) Coordinate M3 (JSON-LD schema for /get-preapproved) with SEO/SEM agent's existing schema rotation. (6) Skip page re-audit until at least one HIGH-tier change ships.

## SEO/SEM Agent Status

**Last worked on:** 2026-04-30 PM — Nightly NotebookLM PUSH+CURATE. Removed 3 (CONTEXT Apr 29 stale, notebooklm-audit-2026-04-29.md superseded, 2026-04-29.md daily-opt run log superseded). Added 3 (refreshed CONTEXT Apr 30 from styerteam-mortgage-site, audit-Apr30, 2026-04-30.md daily-opt run log). 49/50. Digest WRITTEN to file only (NOT sent — task SKILL.md override). Master log appended (+43 lines for seo-sem-pm) + Master notebook re-synced (replaced 9f2c8cf3 with a2301fcf, then 81901deb after lead-gen append). Today's site work absorbed: Thursday Internal Linking + Funnel Flow rotation 3-page audit (DSCR 28+, Round Rock 30+, calculator-affordability 17+ links — all PASS); AEO older-template cluster 9/16 — pre-approval-take body `<p><strong>` (commit 5782c7d); Dripping Springs Round 1 slot 12/13 deepening with median $542,500 + neighborhoods + schools + employers + tax breakdown + Hill Country Construction H3, USDA→well/septic VA Circular swap (commit e016f79); calculator-affordability `/get-preapproved` link normalization. about.html canonical address mismatch hit 5th run (still open).

**Active blockers:** **CONSOLIDATED:** Site-wide nav USDA dropdown cascade (header + footer on ~88 pages + `/loans/usda.html` page disposition) — single Adam decision unblocks Smithville/Elgin/Florence/Jarrell + how-to-buy table cleanup (HIGH). about.html LocalBusiness vs index.html MortgageBroker address mismatch (5th run carry-forward — Adam canonical decision MEDIUM). about.html timeline-date span "91 Google + 45 Zillow" — refresh to current 136 or mark historical (MEDIUM). GTM suburb quick-form not counting as Google Ads conversions ($500/mo unattributed — HIGH). 90-day GSC export not yet pulled (HIGH — also blocks Lead Gen funnel diagnosis). NotebookLM Step 0 in daily-opt SKILL.md retirement diff pending Adam apply (12th run).

**What's next:** (1) Friday 2026-05-01 rotation: Schema/JSON-LD audit across recently-touched suburb pages (Dripping Springs, Round Rock, Manor, Liberty Hill, Bee Cave) — flag any drift from MortgageBroker + LocalBusiness + FAQPage + WebPage 4-block standard. (2) Suburb queue: Westlake Round 1 final slot 13/13 — close Round 1 of suburb deepening. (3) AEO older-template cluster 10/16 — next pair: dscr + how-to-choose-lender. (4) Once Adam decides on USDA cascade, execute site-wide cleanup. (5) GSC URL Inspection sweep — Hutto, Round Rock, Bee Cave, Lakeway (overdue).

## Scenarios Agent Status

**Last worked on:** 2026-04-30 AM — 6th consecutive no-build exit (Apr 25/26/27/28/29/30). Tiers 1–8 complete; [GOALS.md](http://GOALS.md) still has no scenarios work; **1 day to May 1 launch**. Refreshed NEEDS ADAM in [TODO.md](http://TODO.md) (now 6-streak, recommendation upgraded to option (a) retire-now given launch tomorrow).

**Active blockers:** No mission — needs retire / redirect / pause decision ([TODO.md](http://TODO.md) NEEDS ADAM, 6 streaks).

**What's next:** Adam decision: (a) retire cron (now recommended — launch tomorrow), (b) redirect to FNM 3.4 / drip / notes, (c) leave dormant.

## Standup Agent Status

**Last worked on:** 2026-04-29 — Day 35 standup. 2 days to May 1. Commits since Day 34: per-org UI feature flags for Scott Pilot (`ec9659a`) — migration 094 `organizations.features jsonb` (NULL = all-on), server helper + admin UI, Scott seeded with 9 flags false; Needs Your Attention dismiss + NEW LEAD badge gating fix (`288ff16`) — dismiss now hits service-role API so it persists across refresh, NEW LEAD now requires engagement intent; per-org From: address + Reply-To for outbound email (`4ac0812`) — migration 095 `org_settings.from_email`/`from_name`, drip cron passes through to `sendViaResend`, Scott org → "Scott Sears <scott@mortgagesolutionslp.com>". Latest prod `dpl_HnNowWSefN5uRwEBPo9tvttnrFZz` READY; all 20 most-recent deployments READY. n8n: 38 workflows, 33 active, 5 inactive (all intentional, unchanged). MCP shows no failed-execution flag.

**Active blockers:** **NEW** — Resend DKIM verification for Scott's `mortgagesolutionslp.com` sender domain; gates live drip sends from Scott's org (NEEDS ADAM). Rolled: `LOANOS_AGENT_SECRET` missing in n8n; TCPA copy + Sendblue API key for iMessage; 3 drip campaigns active in DB but missing authored content (Long-Term Nurture, Past Client Retention, Realtor Relationships); marketing site silent (single highest May 1 risk per [GOALS.md](http://GOALS.md)); selfies not uploaded; notes / activity log fix still launch-critical with no code in 6+ days; MISMO multi-borrower regex greediness (known pre-launch defect, fine for Scott's solo beta).

**What's next:** (1) Verify drip cron fired since 2026-04-28 13:00 UTC — query `drip_sends` for new rows; if zero, manually enroll one Adam contact in PA Welcome to prove end-to-end now that per-org From: address is wired. (2) Co-borrower MISMO parser test against a synthetic 2-borrower Calyx fixture before any multi-borrower file lands. (3) Notes / activity log fix — re-read original brief, start. (4) Recommend Adam smoke-test one real contract through `UfNcdpoVKQZqy0fj` post `4f7586d` deploy to verify the `contract_pdf` Switch branch fires before launch day.

## Rules For AI Sessions

- **UI changes**: Prefer `docs/THEME.md` + text spec. Don't require screenshots.
- Always read this file before starting
- Always update this file when something significant changes (keep it short — details go in CHANGELOG)
- Always update [CHANGELOG.md](http://CHANGELOG.md) at end of session
- Always update the build tracker (`/public/docs/loanos.html`) at end of session
- At end of session: update [CONTEXT.md](http://CONTEXT.md), commit, push to main
- Never break styer-mortgage-site tools
