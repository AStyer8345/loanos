# LoanOS — AI Context File

**2026-09-05 production intake:** Profile membership writes are server-only; website and assistant inquiries share durable capture and tracked delivery. See `docs/COMMAND_CENTER_INTAKE.md`. Production was verified on `codex/website-ai-assistant`; preserve that deployed base when merging PR #9.

> Read this at the start of every session before doing anything. Keep this file under 150 lines. Session history → [CHANGELOG.md](http://CHANGELOG.md). Why decisions → [DECISIONS.md](http://DECISIONS.md). Open work → [TODO.md](http://TODO.md).

## What This Is

LoanOS is a mortgage intelligence platform built by Adam Styer. Built for personal production use first. Licensed to other LOs in Phase 4. Replaces: Jungo CRM, Mortgage Coach, scattered Claude workflows.

## Current Phase

**Unified Command Center (Adam-directed 2026-07-02 — LoanOS product work RESUMED, GOALS.md updated).** Phase 1 shipped: `status_normalized` on loans, comp tracking (`comp_plans`/`loan_compensation`, auto-synced to funded loans, Performance tab panel), dashboard widgets (NotesScratchpad / UnknownSenders / Stalled), Inbox Review create-contact. `CLAUDE_MODEL` now `claude-fable-5`. Follow-ups in TODO.md § Unified Command Center. Carry-over: Email Automation Cutover (Task 23) + Security Finding #5. 2026-07-03 loanos-autonomous (first unpaused cycle): MISMO importer now stamps loan `lead_source` from the linked contact; the primary Arive n8n path + the other Command Center follow-ups are queued in tasks/ADAM-TODO.md. **2026-07-03 (Adam-directed): noise cleanup — dashboard is 2 tabs (Pipeline + Performance), dead routes/components cut (−2,897 lines, commit `6bfe0fb`); needs-attention shows decrypted sender/subject/message; CD & Contract Extractor repaired (33 backlog docs attached); Arive comp-clobbering fixed; adam.styer@hypersmart.loan cutover in n8n. See CHANGELOG 2026-07-03.**

## Repo

- GitHub: <https://github.com/AStyer8345/loanos>
- Branch: main
- Deploy: Vercel (auto on push)
- Version: 8.1.9 (as of 2026-04-05)

## Current Status

**Email Automation Dashboard + n8n → Workflow DevKit Phase 1: shipped through shadow mode (2026-04-15 PM). Renovation Phase 2 complete. UI consolidated for LO #2 onboarding (2026-04-16 PM late-4). Security hardening complete (#9 + #10 shipped 2026-04-16 autonomous). Security findings #5 remains (ADAM-BLOCKED — GLBA attorney). 2026-04-17 autonomous: demo data polished (screenshot-ready), n8n blank email fix deployed. 2026-04-18 PM: Analytics dashboard (**`/dashboard/analytics`**) shipped — pipeline health, source conversion, realtor scoreboard, AEO vs SEO, Past Client lead source; commit** `56db9d4`**, analytics consolidated into Dashboard Performance tab** `32b9e5b`**. 2026-04-19 autonomous: loans page** `useEffect` **organizationId dep fix (commit** `a8759a0`**, live in prod** `32b9e5b`**); pre-push hook nvm tolerance fixed locally. 2026-04-19 autonomous (PM): Scenarios Tier 7 Item 2 — "Create Scenario" button on contact detail page, pre-fills borrowerName + propertyAddress from contact record via** `?contact_id=` **param. Marketing site copy pass: 2 false claims removed, KB updated. Commit** `0cd93dc`**, Vercel** `dpl_6PvCut3fRyfo3HFo59jBTCWxoL5o` **→ READY. 2026-04-20 autonomous: BLOCKER-HOT-LEAD-001 closed —** `POST /api/notify/hot-lead` **route shipped (Resend email + daily dedup via activity_log). n8n workflow** `nOCDV73m4M0jyL1B` **updated to 8 nodes — "Notify Adam" httpRequest node now calls endpoint after every hot lead surface. Commit** `358d3f5`**. ADAM-BLOCKED: set** `LOANOS_AGENT_SECRET` **in n8n Settings → Environment Variables so node can authenticate. 2026-04-22 autonomous: Manual Enrollment UI shipped — DRIP CAMPAIGNS card on contact detail always renders;** `+ ENROLL` **button opens inline campaign picker → POST** `/api/drip/campaigns/[id]/enrollments`**. Root cause of drip inactivity: n8n scheduler archived 2026-04-16 + UI hidden when empty. Commit** `b3752fb`**, Vercel READY. PR #4 (**`feat/tenant-scoping-hardening`**) queued for Adam merge — 37 tables probed, 0 leaks, migration 092 applied, Scott cleared for login. 2026-04-24 PM autonomous: Hold List UI shipped — Settings page Hold List card (add form + trash-icon delete), 3 API routes (GET/POST suppressions, DELETE suppressions/\[id\]). Closes Scott Pilot Hold List UI. Cron deploy pipeline unblocked (daily** `0 13 * * *`**, commit** `96b7e93c`**). Commit** `a1c2dec`**, Vercel READY. 2026-04-26 PM autonomous: Recent Activity timeline shipped on** `/dashboard/drip-campaigns` **—** `getRecentSends()` **query helper +** `GET /api/drip/sends/recent` **+** `RecentSendsTimeline.tsx` **(15 most-recent sends across all campaigns, contact/campaign/step/status/relative-time, status-tinted, graceful empty state). Closes recent-sends portion of Drip Dashboard widgets (TODO line 39); completion-rate-per-campaign still open. Commit** `f54c16b`**. 2026-04-27 PM autonomous: Drip Dashboard widgets fully shipped — completion rate per campaign now renders inline on each** `CampaignCard` **("X% completed", with tooltip showing completed / (completed + removed) breakdown; falls back to "— completion" until enrollments finish).** `DripCampaignWithStats` **extended with** `completed_count` **+** `removed_count`**;** `getCampaignsWithStats()` **adds two parallel** `head:true` **count queries per campaign. No schema changes, no new endpoints. Commit** `a4e8f54`**, Vercel** `dpl_7SjND6PJmpHubZFV9TmTrpdTPEMF` **READY (\~80s). 2026-04-28 PM autonomous: MISMO importer follow-ups (Scott Pilot scope) — `MISMOUpload.tsx` now surfaces server error body (`{ error?: string }` with HTTP-status fallback) instead of swallowing as generic "Failed to parse MISMO file"; `api/mismo/import/route.ts` adds secondary dedup branch on `(org_id, contact_id, property_address, loan_amount)` when `loan_number` is absent (covers pre-submission Calyx Point exports). No schema changes, no new endpoints. Build green first pass. **2026-04-28 PM (org-feature-flags): per-org UI flags shipped for Scott Pilot. Migration 094 adds `organizations.features jsonb` (NULL = all-on). Server helper `src/lib/features/getOrgFeatures.ts` (cached per request), client-safe types in `src/lib/features/types.ts`. TopNav, dashboard cards, and contact-detail surfaces (Drip card, Create Scenario, Email Automations) gate on flags. Admin UI at `/admin/feature-flags` (sys-admin only). Adam's row = NULL → unchanged UX; Scott's row = 9 flags false (Contacts/Pipeline/Loans/Settings remain visible). RLS impersonation probe confirmed both paths.** **2026-04-29 PM (Microsoft Graph adapter): Adam shipped commit `1b58ef9` — provider routing on `org_settings.email_provider` (migration 096 adds column + encrypted MS Graph token columns). `sendEmail()` dispatches to Graph or Resend; falls back to Resend on Graph error. `/api/auth/microsoft/connect` HMAC-signed OAuth state. No org has flipped to `microsoft` yet. 2026-05-01 PM autonomous: tracker hygiene cycle (May 1 launch day) — 11 modified tracker files committed, 0 code changes, Vercel pending. Bucket A empty for feature work; all current-phase items Adam-blocked. Anniversary Check-In (`ZUeGy8u8P4o6DPM3`) malformed-JWT bonus finding still open — first cron firing today; impact forward-looking only. **2026-05-04 autonomous: 5th consecutive tracker hygiene cycle (post-launch +3). 13 modified tracker files committed, 0 code changes. AM agents added 2 new ADAM-TODO lines (homepage forms audit + NotebookLM CLI re-auth, now 2 sessions blocked). All Bucket B items unchanged from 2026-05-03 entry.** **2026-05-15 PM autonomous: 13th consecutive tracker hygiene cycle. 17 modified tracker files + 2 new specs (Realtor Relationships activation ~357 lines, pile-pressure snapshot ~140 lines) committed. Working tree had been dirty ~48h since `2df6700` because Thu 05-14 autonomous wrap-up cron did not fire (Day 51 standup gap). 0 code changes. Bucket A empty for feature work; Bucket B = unchanged Adam-queue.** **2026-05-16 PM autonomous: 14th consecutive tracker hygiene cycle. 13 modified tracker files (CHANGELOG/CONTEXT/TODO/ADAM-TODO + per-agent state from this AM's lead-gen-am restraint + social-am 33rd-streak maintenance + nightly notebooklm). 0 code changes, 0 new artifacts, 0 ADAM-TODO additions (per 05-15 AM lead-gen-am restraint rule extended). `npm run build` green first pass (113 static pages, Middleware 74.5 kB). Latest production `dpl_87bYxwsTZas4Axyr4U3MQirT1D1q` (commit `7adabf6`, 2026-05-15 PM) READY before this push. Bucket A empty for feature work; Bucket B = unchanged Adam-queue (Realtor Relationships Phase-1 authorize, PR-1..PR-5, Resend DKIM Scott, drip cron smoke + CRON_SECRET, FNM 3.4 onboarding, Scenarios cron retire 20-streak, NotebookLM CLI auth 15th day / 31 sub-sessions, social PM 05-04 24 cycles, GOALS.md 27 days stale, iMessage path, CONTEXT.md trim 161 lines).**

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

- Completed phases (full detail in CHANGELOG): Phase 1 UI strip, Phase 2 pipeline+Arive sync, Phase 3 Follow-Up segments + lead-source overhaul, multi-tenancy RLS, shadcn UI renovation, Drip campaigns v1, Share page redesign, Dashboard v6.1, Lender knowledge system.

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

**Last worked on:** 2026-07-04 AM (styer-social-am). Maintenance hold holds. Step 1B: **1 NEW evergreen blog** — `blog/2026-06-30-bank-statement-loans-texas.html` ("Bank Statement Loans in Texas — How Self-Employed Borrowers Qualify"; Jun 30 14:30, missed by the 06-30 AM scan, caught inline by PM 07-04 → formalized this session). Verified HyperSmart ×14 / 0 MSLP, NMLS #513013 ×6, no rate figures (no APR trigger), evergreen. **Arguably the single most on-brand held piece** — GOALS line 21 names "bank statement" explicitly. HELD (nod-first; not auto-fired). Routed to tracker + content-repost-queue; ADAM-TODO L15 rollup refreshed in place **7→8 GBP-ready** (no new line). Bundle now **8** GBP-ready + 1 hard-held May-18 rate page. **⏰ `styer-gbp-weekly` fires TOMORROW Sun 07-05 ~9 AM CT under old-brand footer** unless Adam picks a/b/c on ADAM-TODO L14 today (<29h out — most time-sensitive open item). Cushion **48** via REST head (`0-47/48` = 47 SQL-authoritative; matches PM 07-04 draft-47), drift 0, no writes since 2026-04-30. GOALS.md `Jul 2 12:38` (social-media-am in "Keep running"). Builder/Architect/Quality/Reviewer/QA all held. NotebookLM PULL/PUSH + master-note skipped — CLI auth expired (~62 days). BLOCKER-LOANOS-001 (selfies) still active, LoanOS-stream-only (moot). 0 drafts, 0 Publer calls, 0 social_drafts inserts, 0 live posts, 0 emails, 0 fabricated data.

**Active blockers:** (1) **`styer-gbp-weekly` auto-publishes a fresh OLD-brand GBP post every Sunday** (Week 26 fired 06-28; **Week 27 fires TOMORROW Sun 07-05 ~9 AM CT**) — fix is in the task SKILL.md footer, not the n8n workflow; Adam picks a/b/c on ADAM-TODO L14. (2) **8 GBP-ready pieces awaiting one "ship it"** — 2× 06-14 blogs + 06-08 + 06-15 rate/market (TIMELY, ship first) + 06-16 DSCR-req + 06-23 no-ratio/low-DSCR + 06-22 newsletter + 06-30 bank-statement (ADAM-TODO L15). (3) **HELD `rates/2026-05-18.html`** — ~6½ wks stale; needs fresh rate update or OK to post dated. (4) **Old MSLP-branded Publer posts still queued:** FB `69d904b3b17de1805a6e4a87` (Jul 10) + draft LI `69c92fa536ecd279f42a7d4b`. GBP *listing name* still "Adam Styer | Mortgage Solutions LP" (Google-side rename, Adam-only). (5) **Cushion-footer A/B/C** — 33/47 old `social_drafts` carry MSLP; one decision covers drafts + Publer posts. (6) **Symlink-stat bug** — Builder-shippable, flip `[x]`. (7) NotebookLM CLI auth expired (`notebooklm login`). (8) Builder paused — 47-draft backlog + positioning/site-copy lock. (9) Selfies — MOOT.

**What's next:** **Most time-sensitive:** the `styer-gbp-weekly` Week-27 fire is <29h out (Sun 07-05 ~9 AM CT) and will publish another old-brand footer unless Adam picks ADAM-TODO L14 option (a) today — footer → "Adam Styer · HyperSmart Home Loans · NMLS #513013" both stops the weekly leak AND aligns with the held bundle's intended footer; one edit resolves the inconsistency between holding 8 pieces and auto-firing this. **Highest-leverage:** Adam replies "ship it" → schedules all **8** GBP-ready pieces to GBP under the HyperSmart footer, staggered one/day — dead-on for GOALS "complicated income" (4 DSCR-lane + the new bank-statement piece). If Adam ships only one, make it the 06-15 rate/market blog (decays). **Other open-for-Adam:** May-18 rate page (fresh update or dated-OK); GBP listing Google-side rename; `stat -L` symlink fix (`[x]`). Builder otherwise paused. First action each AM session: `stat -L -f "%Sm" GOALS.md` (never bare `stat -f`).

## Lead Gen Agent Status

**Last worked on:** 2026-07-05 AM (lead-gen-am). Verify-only, read-only. Cron LATE fire (~8h, fired 11:04 CDT). Scorer `nOCDV73m4M0jyL1B` HEALTHY: get_workflow_details confirms active=true, responseMode=onReceived, versionId==activeVersionId (d54c385e), updatedAt 2026-06-09 (the fix); **ZERO execs since 07-04** (= no new Website web-form lead), **zero errored execs since the 06-09 fix** holds. **1 new contact since 07-04, non-web path** (scorer correctly idle): Satish Skariah (null lead_source, 0/new, 07-04 22:20). No Website-source lead in window → no speed-to-lead miss. Hot-lead sweep: still only **Emily Christensen** (70/hot, 05-05) — standing as ADAM-TODO L18; NOT re-stacked. NotebookLM auth live-probed 11:04 CDT — still expired (63d). No writes, no notifications, no emails.

**Active blockers:** None critical. (1) NotebookLM CLI auth expired (~63 days, live-probed 07-05 11:04 CDT) — `notebooklm login`; blocks PULL/PUSH. (2) **Backfill DE-RISKED** — outage-era contacts still score=0/new, but read-only check confirms re-POST fires **zero** hot-lead alerts (max would-be score = 3) and is low-value. Adam-opt-in per ADAM-TODO; safe anytime. (3) BLOCKER-001 — homepage Quick Quote/Contact still bundle SMS consent (LOW: no SMS wired).

**What's next:** Pipeline healthy — speed-to-lead proven on 10+ real live web leads; this window (07-04 → 07-05) had no Website web-form lead, only 1 non-web/manual contact (scorer correctly idle). Remaining items need a supervised/opt-in session: (a) **Emily Christensen** — 30-sec dashboard check, already in ADAM-TODO L18. (b) backfill (safe, low-value, Adam-opt-in). (c) `notebooklm login` to unblock PULL/PUSH. (d) Domain-queue items 2–4: activate Website Lead Follow-up (`AK1fBcaX1cPcdlGx`, email-only — confirm no SMS first) + test New Application Received (`cWESnXXy9UOLB13q`) + Refi Intake (`yCTydQ7RfZK4DyUg`) — live-system writes, off-priority per GOALS (no funnel-building this week), out of scope for an unattended AM verify. (e) Data hygiene (non-urgent): **Joel Geddes dup row (06-27 double-submit)** + **"Codex Diagnostic" synthetic test contact left in prod `contacts` (06-28)** — both 3/cold, Adam may delete; duplicate Kiersten McBride (06-04 + 06-15, same phone); Web Lead Automation logs `web_lead.received` w/ `contact_id=null` (orphaned).

## SEO/SEM Agent Status

**Last worked on:** 2026-06-17 10:29 nightly (late fire, ~12h vs 06-16 22:00 slot). NotebookLM PUSH+CURATE no-op both halves — CLI auth live-confirmed expired (45 calendar days since 2026-05-03). Last successful PUSH+CURATE remains 2026-05-02 PM. No notebook contact, no source mutations, no master-log append.

**Active blockers:** (1) NotebookLM CLI auth — Adam runs `notebooklm login` (45 days blocked; sole blocker for the nightly sync). (2) Carryover under "complicated income" + wholesale pricing repositioning: USDA dropdown cascade, about.html vs index.html address mismatch, timeline-date span, GTM suburb quick-form conversion, 90-day GSC export. (3) SEO/SEM PUSH backlog at 50-source ceiling (~50 stale + ~30 ready-to-add — full rotation required on recovery night).

**What's next:** (a) `notebooklm login` → staged recovery night (push lead-gen artifact backlog + SEO/SEM at-cap rotation). (b) Phase A compliance cleanup on styermortgage.com (testimonials, rate widget, 21-day claim, EHL/NMLS, GLBA privacy). (c) Pivot SEO/SEM roadmap to specialist-positioning content. (d) GOALS refresh window Mon 06-22; if mtime advances, next nightly re-reads for regime change.

## Scenarios Agent Status

**Last worked on:** 2026-07-05 (scenarios-am) — 63rd consecutive no-build maintenance exit. `stat -L` GOALS.md mtime = **`Jul 2 12:38:29 2026`** — UNCHANGED since the 07-03/07-04 fires already processed the 07-02 un-pause; no scenarios directive added in the 3 days since. Standing state: the 07-02 edit **RESUMED LoanOS product work** (Unified Command Center shipped same day, CHANGELOG 07-02); resumed scope is command-center dashboard / comp / reporting — NOT Scenarios (program COMPLETE, Tiers 1–8, last code build 2026-04-24). GOALS line 72 keeps the cron with no scenarios directive. No code / build / push / email this session.

**Active blockers:** Not "mission paused" — that premise is void. scenarios-am fires **un-paused-but-unassigned**: pause lifted, but Scenarios queue empty + no scenarios directive in the 07-02 refresh + Adam's directed focus is the command center, not Scenarios. Charter binds this cron to Scenarios files only — can't self-assign command-center work. Adam decision open on TODO line 43 (63-streak): (b) redirect or (c) pause — (a) retire off the table (cron kept at 07-02 edit). NotebookLM CLI auth expired — **live-probed 07-05, still expired** (~63 days) — Adam runs `notebooklm login`.

**What's next:** Adam picks on TODO line 43. **Recommendation holds at (b) redirect to "complicated income" Scenarios templates** (self-employed / 1099 / bank-statement / DSCR / jumbo) — with product work un-paused and the positioning shift the live priority, a scoped Scenarios redirect has a real GOALS-aligned target; otherwise (c) pause the cron to end the daily no-op. Forward rule: `stat -L` GOALS first each run — the un-pause is recorded; break maintenance and re-plan only if a future refresh adds a scenarios-specific directive to GOALS line 72. Next natural refresh window = Mon 2026-07-07. Otherwise 64-streak next AM pending Adam's call.

## Standup Agent Status

**Last worked on:** 2026-05-17 — Day 53 standup, post-launch +16 (vs May 1 GOALS target) / +21 (vs original Apr 26 task target). HEAD = origin/main = `69749dc` (2026-05-16 PM autonomous wrap-up — the unpushed-commit gap flagged Day 52 self-resolved within 24h). Vercel auto-deployed `69749dc` as `dpl_FVfrSpVEi7TC6PQ5ogETofoVr9DT` (production READY, region iad1, ~71s build). 20 most-recent production deployments all READY across 17+ days. 0 unpushed commits, but working tree dirty again — 17 modified tracker files from this AM's lead-gen-am (3rd-restraint), social-am (35th-streak), and 05-16 PM social-pm + notebooklm-nightly carryover writes. n8n MCP NOT loaded this session (live re-query deferred to next available session); inheriting Day 52 inventory: 40 total / 35 active / 5 inactive (all intentional/test/staging). Anniversary Check-In dedup malformed-JWT 16th day open (~17 firings). 17-day zero-feature-code streak; last real feature `1b58ef9` (MS Graph adapter, 2026-04-30). **GOALS.md 27 days stale** (`Last updated: 2026-04-20`); Mon 2026-05-18 is the threshold (~1 day out).

**Active blockers:** Drip queue at 0 sends 19th day (cutover unproven; Realtor Relationships Phase-1 spec still highest-leverage alternate first-send path); Scott DKIM 18th day; 5 canonical n8n credentials uncreated; `LOANOS_AGENT_SECRET`; TCPA + Sendblue; 3 unauthored drip campaigns (Realtor Relationships spec-ready, Long-Term Nurture + Past Client Retention still unauthored); selfies (46+ days); notes/activity log; MISMO regex; FNM 3.4 / Calyx Point importer built but Scott not onboarded; ~20 HIGH-tier conversion findings in styerteam-mortgage-site bundled into PR-1+PR-2+PR-3+PR-4+PR-5 quintet (11/10/9/8/7 days unauthorized); Scenarios cron retire (**21-streak**, deep into 4th-week); NotebookLM CLI auth (16th day, 34 sub-sessions blocked); social PM 05-04 escalation (**26 cycles open**); GOALS.md 27 days stale (3 consecutive Mon skips + Tue/Wed/Thu/Fri/Sat-full-day/Sun-AM catch-up windows ALL passed); CONTEXT.md still 161 lines (12+ days over cap); iMessage path decision (5 days open); Realtor Relationships Phase-1 spec (3 Adam decisions ~5 min, 4 days open). **RESOLVED:** Day 52's "1 unpushed local commit" gap — push fired in the 24h window.

**What's next:** (1) **Authorize Realtor Relationships Phase-1** per `tasks/lead-gen/specs/2026-05-14-realtor-relationships-activation-spec.md` § 5 (3 decisions, ~5 min, sensible defaults; cheapest path to flipping drip-queue-at-0-sends since it bypasses DKIM). (2) Read iMessage brief and pick Sendblue / Twilio-primary / both. (3) Drip end-to-end smoke — manually enroll Adam-owned contact in PA Welcome (alternate validation path). (4) FNM 3.4 importer onboarding for Scott. **Strongest 15-standup-running recommendation:** reserve one 60–75 min Adam block to clear (a) Realtor Relationships Phase-1 authorize, (b) Resend DKIM, (c) PR-1 → PR-5 quintet authorize, (d) Scenarios retire/redirect/pause (21-streak), (e) `notebooklm login`, (f) social PM 05-04 A-vs-B answer (26 cycles), (g) **GOALS.md refresh — Mon 2026-05-18 is THE threshold (~1 day out)**, (h) iMessage path decision. **Cohort-pause planning signal:** if Mon 2026-05-18 GOALS refresh also slips, 4th-consecutive-week threshold triggers pause-all-5-agents planning. **Mechanical follow-up for next wrap-up cron:** push step fired this cycle — restore one-cycle observation window before declaring wrap-up cron reliability fully recovered.

## Rules For AI Sessions

- **UI changes**: Prefer `docs/THEME.md` + text spec. Don't require screenshots.
- Always read this file before starting
- Always update this file when something significant changes (keep it short — details go in CHANGELOG)
- Always update [CHANGELOG.md](http://CHANGELOG.md) at end of session
- Always update the build tracker (`/public/docs/loanos.html`) at end of session
- At end of session: update [CONTEXT.md](http://CONTEXT.md), commit, push to main
- Never break styer-mortgage-site tools
