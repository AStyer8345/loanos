# LoanOS Launch Standup Log

---

## 2026-04-15 — Day 21 (Launch: April 26)

**Days to launch:** 11

**Yesterday shipped:**
- PA Welcome Nurture (6 emails, 60 days) + DPA Guide Nurture (8 emails, 52 days) — new n8n+Resend workflows (`rwi3qEYgJKGGHkHc`, `0M8Vnf6MhB1xtaIg`), both active; Mailchimp handles list/tags only
- Scenarios Tier 5 fully complete — social proof block added to share page (`31cc731`)
- Team page: owner team page + Invite Teammate + Sponsor LO onboarding flows (`c7985c8`)
- Marketing site: Netlify function calls proxied through same-origin API routes to fix CORS (`0759bea`)

**Vercel status:** Unable to verify — Vercel MCP requires OAuth (automated session). Last known: READY `dpl_214r73B16g7JQtx8ZZ64NDQz9jJd`. Multiple pushes occurred April 14 PM after that deployment; newest Vercel state unconfirmed.

**n8n workflow health:** 33 total, 29 active (+2 since Day 20 — PA Welcome + DPA Guide now live).
- No error states detected. All 4 inactive workflows are intentional.
- Inactive: `W0K4YDzkZd0Hzv6g` (Pre-Drop Warm-Up), `LfLSDgqgb6yCe93C` (Quarterly Rate Review), `AK1fBcaX1cPcdlGx` (Review Request polling), `PBu2Zt0YpiLHeqbL` (Post-Calendly Booking — needs Calendly cred)
- **FLAG (carry from Day 20):** `HkLjsnnhT5MgrX5H` (CD & Contract Extractor) `active: true` — still needs execution test to confirm Outlook credential is connected. Cannot confirm from MCP status alone.

**Blockers:**
- CD & Contract Extractor: active=true but untested — Outlook cred connection unverified (GOALS #1)
- Seq C INACTIVE — Outlook credential unconnected, 7+ sessions (GOALS #2 item 1)
- Phase 2 Adam confirmation outstanding — blocks Phase 3 Renovation (Follow-Up List)
- Marketing demo data: zero progress, 11 days to May 1 launch page + screenshots
- Post 39 social approval: due TODAY (April 15) — miss = social calendar gap
- Post-Calendly Booking `PBu2Zt0YpiLHeqbL`: needs Calendly HMAC signing key + webhook setup

**Today's focus:** Marketing demo data cleanup (HIGHEST urgency — blocks May 1 screenshot/launch page; 11 days out, zero progress). Parallel: CD & Contract Extractor execution test to verify GOALS #1 is truly unblocked.

**Risk watch:** Marketing demo data is the single highest risk to May 1 ship date — 11 days, zero progress. If not started this week, public launch page misses target. Phase 2 Adam confirmation now blocking Phase 3 for 7+ consecutive sessions — escalation warranted.

**Open audit findings:** 0 CRITICAL (all 4 resolved). 3 MEDIUM open: #5 field-level encryption, #9 admin action log, #10 sys vs org admin separation.

---

## 2026-04-14 — Day 20 (Launch: April 26)

**Days to launch:** 12

**Yesterday shipped:**
- Activity feed: expandable iMessage/email items on click, reorganized filter tabs (Correspondence / Email / Text / Notes / System / All) on loan detail and contact pages
- Automation reliability: `N8N_WEBHOOK_BASE_URL` env var fallback, `organization_id` + `borrower_email` passed to n8n webhooks, actionable error messages in trigger modal instead of raw "Failed to fetch"
- Loan detail sidebar: same filter tab pattern added to sidebar activity panel and full Activity tab
- Lead Gen AM: homepage Quick Quote + Quick Contact forms wired to `subscribe-lead.js`; Calendly n8n workflow `PBu2Zt0YpiLHeqbL` updated 8→11 nodes (cancel branch + contact lookup)

**Vercel status:** READY — `dpl_214r73B16g7JQtx8ZZ64NDQz9jJd` (commit `8e53dd8`)

**n8n workflow health:** 31 total, 27 active. No error states detected.
- **FLAG:** `HkLjsnnhT5MgrX5H` (CD & Contract Extractor) now shows `active: true` — was listed inactive in Day 19 standup as the top GOALS.md blocker (3-week stall). Status change may indicate Adam connected the Outlook credential. Needs verification.
- Inactive (all expected): `AK1fBcaX1cPcdlGx` (Review Request polling — intentionally deactivated), `W0K4YDzkZd0Hzv6g` (Refi Pre-Drop Warm-Up), `LfLSDgqgb6yCe93C` (Quarterly Rate Review), `PBu2Zt0YpiLHeqbL` (Post-Calendly Booking — pending config)

**Blockers:**
- Phase 2 Adam confirmation outstanding — blocks Phase 3 Renovation (Follow-Up List)
- Marketing demo data: zero progress — 12 days to May 1 launch page. Blocks screenshots.
- Post 39 social approval: deadline April 15 (TOMORROW). Miss = social calendar gap.
- 4 Adam-owned manual items unresolved: Set Rate webhook, Mailchimp journeys, DPA Guide PDF, Calendly webhook config
- Security hardening: 3 items remaining (#5 field-level encryption, #9 admin action log, #10 sys/org admin)

**Today's focus:** Verify CD & Contract Extractor activation — test a real Outlook execution to confirm it's truly running (not just toggled active). If confirmed: begin Phase 5 email template wiring (wire UI buttons to all 6 n8n email workflows). If still blocked: begin Renovation Phase 3 (Follow-Up List).

**Risk watch:** 12 days to launch — marketing demo data at zero progress is the highest lagging risk for the May 1 public launch page. If not started this week, marketing site misses May 1.

**Open audit findings:** Security audit 2026-04-05 — 3 CRITICAL open (T-1: `activity_log` INSERT org-scoping bug; T-2: RLS disabled on 6 tables including `agent_conversations`; T-3: `challenges`/`responses`/`kids` fully open policies) + 2 HIGH (T-4: milestone tables user-scoped not org-scoped; T-5: `marketing_activity_log`/`mcc_state` user-scoped). Pricing-tier gating not implemented in any API route. Security hardening tracker: 3 remaining items.

---

## 2026-04-13 — Day 19 (Launch: April 26)

**Days to launch:** 13

**Yesterday shipped:**
- Review request email button on loan detail + automations tab — one-click Outlook draft with Google + Zillow review links. Deactivated old polling workflow `AK1fBcaX1cPcdlGx` (was burning ~1,440 executions/month, zero emails sent). Inbound email poll slowed 5→30 min, iMessage sync 5→15 min.
- Outbound iMessage capture in activity timeline — `nccX5ml82mMGyE9T` now logs both inbound + outbound with distinct icons (cyan = sent)
- Borrower phone fix: Arive webhook fallback now carries `loanBorrower1_mobilePhone10digit` to contact upsert
- Migration 085: fixed `enrich_activity_log_contact()` trigger crashing ALL `/api/activity` POSTs since migration 083; fixed iMessage pipeline silent failures; replayed 2 lost iMessages

**Vercel status:** READY — `dpl_HawZvbuLAefvw84Gtvy9cu9iCozY` (commit `845c422` — review request email button)

**n8n workflow health:** 31 total, 26 active. No error states detected.
- 2 new since Day 18: `Pf1zWuKAnD4SznSR` (Rate Check Form, active) + `PBu2Zt0YpiLHeqbL` (Post-Calendly Booking, inactive — pending Adam config)
- Inactive (all intentional): CD & Contract Extractor `HkLjsnnhT5MgrX5H` (GOALS.md #2 — 3 weeks stalled), Review Request polling (deactivated this session), Quarterly Rate Review `LfLSDgqgb6yCe93C`, Pre-Drop Warm-Up `W0K4YDzkZd0Hzv6g`, Post-Calendly `PBu2Zt0YpiLHeqbL`

**Today's focus:** CD & Contract Extractor activation (GOALS.md #1 — activate `HkLjsnnhT5MgrX5H`, blocked on Adam's Outlook credential). If Outlook still unconnected: begin Renovation Phase 3 (Follow-Up List), blocked on Adam's Phase 2 confirmation.

**Risk watch:**
- HIGH — CD & Contract Extractor inactive 3 weeks. Adam must connect Outlook cred to unblock.
- HIGH — Marketing demo data zero progress. Blocks May 1 launch page screenshots.
- URGENT — Post 39 approval deadline April 15 (2 days). Miss = gap in social calendar.
- MEDIUM — 4 Adam-owned blockers unresolved: Set Rate webhook, Mailchimp journeys, DPA Guide PDF, Calendly webhook.
- MEDIUM — Phase 2 Adam confirmation outstanding (blocks Phase 3 renovation).

**Open audit findings:** 0 (no files in `audits/`)
