# LoanOS — Open Work

> Granular action items: `tasks/ADAM-TODO.md`
> Security tracker: `tasks/security-hardening-critical-gaps.md`

## Now (this week)

- [x] ~~Adam: fill in `extractPayloadIdentity()` in `src/lib/los/verifyLosPayload.ts`~~ — DONE. Implemented with `loanOfficerEmail` (confirmed 2026-04-04 Zap run). Verified 2026-04-09.
- [x] Apply migration 075 (`los_integrations`) to Supabase (done 2026-04-08)
- [x] ~~Run PII backfill script~~ — DONE (1403/1403 companions). Migration 083 applied 2026-04-12: plaintext columns dropped.
- [x] ~~Adam: register FRED API key~~ — NOT NEEDED. Sequence A uses Set Rate webhook (Option A). Resolved 2026-04-09.
- [x] ~~Adam: verify Microsoft Outlook credential in n8n UI~~ — DONE 2026-04-10 AM. Sequence A + Anniversary Check-In both ACTIVE (verified via MCP).
- [ ] Adam: upload selfies → unblocks LoanOS social content stream
- [ ] Social posts: **NEW POLICY 2026-04-19 — 1-2 posts/week at 9/10 quality bar.** Week 29 built (Posts 157-158): LinkedIn authority (Post 157, ID: 94e1d9a7, Sep 24) + Facebook personal (Post 158, ID: 94c1dc00, Sep 25). Week 30 next: 1 education post (pillar at 27.3% — needs recovery) + 1 Instagram post (no IG in Week 29). Adam action items: Post 157 blog link in first comment (BEFORE Sep 24). Canva/Reel backlog: Posts 43, 44, 47, 51, 52, 55, 60, 81, 113, 115. rates/2026-04-14.html carousel/Reel deferred (2nd deferral — assign dedicated session).
- [x] ~~Adam: build 3 Mailchimp Customer Journeys~~ — SUPERSEDED 2026-04-14. PA Welcome (6 emails) + DPA Guide (8 emails) moved to n8n+Resend workflows (`rwi3qEYgJKGGHkHc`, `0M8Vnf6MhB1xtaIg`), triggered from subscribe-lead.js. Mailchimp only handles list/tags. "Rate Watch" sequence not built — decide scope separately (name was ambiguous: market rate drops vs. quoted-rate watch for specific borrower).
- [ ] NMLS# 513013 profile audit on all 4 social platforms
- [ ] **n8n credential hygiene audit** (2026-04-22): while fixing `loanos-n8n-agent-secret`, found the Supabase `service_role` JWT hardcoded inline in all 3 HTTP nodes of workflow `nOCDV73m4M0jyL1B`. Pattern likely mirrored across the other ~16 workflows — any HTTP node hitting `uuqedsvjlkeszrbwzizl.supabase.co` that doesn't use a Supabase credential is a leak waiting to happen (key rotation = N workflow edits; any shared n8n JSON export leaks prod DB). Scope: (1) enumerate all HTTP nodes across all active workflows via MCP; (2) identify inline creds (Supabase JWT, Resend API key, Mailchimp API key, Publer API key, Anthropic API key); (3) migrate each to proper n8n credentials; (4) delete the inline values. Prereq: Adam creates the canonical credentials once in n8n UI (see `tasks/ADAM-TODO.md` [SEC] items).
- [ ] Adam: review/approve Refi Watch email copy (Sequences A + D)
- [x] ~~**NEEDS ADAM — decide on n8n Drip Scheduler `LqBb3YDLjS2eUrDE`.**~~ DECIDED 2026-04-16 PM: option (a) now, (c) later. Workflow archived via MCP (`active: false`, `isArchived: true`) — daily cron no longer runs, dead Outlook send node never fires again. Banner added to `/dashboard/drip-campaigns` so the UI stops pretending. Skipped option (b) Resend retarget (12 throwaway n8n nodes during a WDK cutover). The 6 campaigns (Ghost Referral, Incomplete App, Went Quiet, Long-Term Nurture, Past Client Retention, Realtor Relationships) move to Workflow DevKit as a dedicated phase AFTER Task 23 cutover completes — not as scope creep into Task 23. To restore: un-archive `LqBb3YDLjS2eUrDE` via MCP and re-activate.
- [x] ~~**Populate `automation_registry` transactional templates — 2/7 done (2026-04-16 PM).**~~ DONE 2026-04-16 PM (late-2). All 7 rows (Referral Intro, Review Request, Final CD, Pre-Approval, Contract Received, New Application Received, Refi Intake) now `email_mode='fixed_template'` with populated `email_template` + `email_variables`. Final CD TRID 3-day framing + wire-fraud warning preserved verbatim. See CHANGELOG 2026-04-16 PM (late-2) for per-row details and verification scan.
- [ ] **Wire n8n code nodes to fetch templates from `automation_registry` at runtime.** Registry is now fully populated (body + subject + vars on all 8 rows). Per workflow: HTTP GET `automation_registry?source_id=eq.X&source_node_id=eq.Y`, substitute `{{var}}` tags on `email_template` + `subject_template`, send. Also swaps the dead Outlook draft node for Resend at the same time since we're editing the sender anyway. **Refi Intake caveat**: template uses `{{cash_label}}`, `{{cash_amt}}`, `{{escrow_row_html}}`, `{{processor_note}}` as pre-resolved derived vars — caller must compute conditionals (`cash_to_close` sign, `escrow === 'Waived'`, org = Adam) before substitution. **Pre-Approval caveat**: `{{lo_*}}` + `{{brand_header}}` + `{{calendly_link}}` require the same profiles/organizations/org_settings lookup the current JS does. **Contract Received caveat**: workflow now has 2 registry rows (`build-borrower-email` + `build-party-email` via `source_node_id`); both need lookups. **Decision before wiring**: do these workflows migrate to Workflow DevKit (matching web-lead-intake + nurture) instead of being rewired inside n8n? Blast radius: 6 production-active workflows.
- [x] ~~**`automation_registry` schema gap — Contract Received Party Reply email.**~~ DONE 2026-04-16 PM (late-3). Picked option (b): separate registry row `Contract Received — Party Reply` (id `68dc830e-3eec-44f4-ab24-05c71174964e`, source_node_id `build-party-email`). Unique index `(org_id, source_id, source_node_id) NULLS NOT DISTINCT` widened to support multi-email workflows. Existing row renamed `Contract Received — Borrower Welcome` (source_node_id `build-borrower-email`).
- [x] ~~**n8n fix — Set Rate webhook Store Rate node:**~~ DONE 2026-04-16 PM (late-3). Workflow `3iXImUkjgMitpJKt` repaired end-to-end: (1) removed `from_address` + `subject` from Store Rate body JSON (neither column exists); (2) fixed pre-existing Validate Rate bug — `return [{json}]` → `return {json}` for `runOnceForEachItem` mode. Verified via MCP `execute_workflow` (execution 5175 success) + new `activity_log` row `9b3a765d-d02d-4b04-997d-3a8e9bd23c2c` written clean. Manual rate updates can use `curl .../webhook/refi-watch-set-rate -d '{"rate":X}'` again. Rate Drop Alert threshold still 6.00%; today's 6.37% won't trigger alerts.

---

## Scott's Pilot — Multi-Tenant MVP (goal: first real second tenant)

> Uncle Scott Sears (org `40377391-6b4c-4d1a-81d2-ffd743876f0b`) — family pilot. Scott has no Arive (no LOS integration needed). Basic CRM only. When this ships cleanly, LoanOS has its first external tenant proof point.
> Honest scope reset 2026-04-19: May 1 deadline killed. No hard external commitment. Build what Scott actually needs, not what SaaS aspirations imagine.
> Drip infrastructure (campaigns, steps, suppressions, enrollments, sends) is already shipped and proven end-to-end (2026-04-19) — PA + DPA n8n workflows now write to Supabase. Scott's campaigns will reuse the same schema.

- [ ] **Tenant scoping audit.** Walk every page/API route/server query — confirm `organization_id` / `org_id` filter applied. No exceptions. Required BEFORE Scott logs in. (Start here. Everything else depends on proving Scott's data can't leak into Adam's and vice versa.)
- [ ] **RLS coverage verification.** `get_advisors` security pass + manual audit of every table. Log every policy; flag any table where a wrong-org user could read/write.
- [ ] **Feature flags per-org.** Hide Drip, Pipeline sync, Email Intelligence, Rate Watch behind org-scoped flags. Scott's org gets only: Contacts, manual Pipeline, templated email send.
- [x] ~~**Manual Enrollment UI.**~~ Contact detail DRIP CAMPAIGNS card always renders; `+ ENROLL` button opens inline campaign picker → POST `/api/drip/campaigns/[id]/enrollments`. DONE 2026-04-22 (commit `b3752fb`, Vercel READY).
- [x] ~~**Drip end-to-end execution gap — prod deploy BLOCKED.**~~ DONE 2026-04-24 (commit `96b7e93c`). Cron dropped to daily `0 13 * * *` (Hobby-plan compatible). All 7 backed-up commits now in production. CRON_SECRET still needs to be set in Vercel (see ADAM-TODO).
- [x] ~~**Hold List UI.**~~ DONE 2026-04-24 (commit `a1c2dec`). Settings page Hold List card: add form (email + reason), timestamped list with trash-icon delete. 3 API routes: GET/POST `/api/drip/suppressions`, DELETE `/api/drip/suppressions/[id]`. Org-scoped, no cross-tenant.
- [ ] **Drip Dashboard widgets.** Active enrollments per campaign (DONE — CampaignCard), recent sends timeline (DONE 2026-04-26 PM `f54c16b` — `RecentSendsTimeline` on `/dashboard/drip-campaigns`, last 15 sends across all campaigns, status-tinted, relative-time labels). Completion rate per campaign (still TODO). Reads from `drip_enrollments` + `drip_sends` joined with contacts. ~½ day remaining.
- [ ] **Basic templated email send.** One-off send from contact detail → pick template from `automation_registry` → substitute vars → send via Resend → log to `activity_log`. Not drip, just one-shot. ~1 day.
- [ ] **Scott onboarding flow.** Manual first: Adam creates Scott's user + org membership, imports his contacts via CSV, walks Scott through UI in a live session. (Scott's contacts + closed loans already imported — confirm 2026-04-19.)
- [ ] **Post-onboarding iteration.** Whatever Scott tries and can't figure out becomes the first real-user feedback. Fix top 3 confusions before adding any new features.
- [x] ~~**MISMO 3.4 importer.**~~ DONE 2026-04-23. `/api/mismo/import` creates contact + loan from a Calyx Point MISMO XML export in one call; `ImportMismoButton` on `/dashboard/loans` (drag-drop modal, a11y complete). Shared parser in `src/lib/mismo/parse.ts`. Scott uploads his Point export → gets a loan in LoanOS without LOS integration. Follow-ups below (non-blocking, log before multi-borrower files):
  - Contact match race: two simultaneous uploads of same borrower insert two contact rows under the same org. Fix = catch Postgres `23505` on contact insert and re-fetch, or add unique index on `(organization_id, lower(email))`. (Low frequency; caught by reviewer, not urgent for Scott's solo use.)
  - Loan dedup skipped when `loan_number` is null (pre-submission Calyx exports). Fix = secondary dedup on `contact_id + property_address + loan_amount` when loan_number absent.
  - Parser regex is greedy — in co-borrower files, first `<FirstName>` / `<ContactPointEmailValue>` wins regardless of `BorrowerRoleType`. Fine for single-borrower beta with Scott, must fix before any multi-borrower file lands.
  - `MISMOUpload.tsx` (scenarios page, pre-existing) swallows server error body as "Failed to parse MISMO file" — user gets generic error instead of the real reason. One-line fix: read `data.error` from non-ok response before throwing.

> Anti-scope: don't build Arive sync, email classifier, AI drafting, or auto-enrollment until Scott says he wants it. These are for Adam's ops, not Scott's pilot.

## Next (after Now items clear)

- [ ] Security finding #5 (field-level encryption) — ADAM-BLOCKED (GLBA attorney consultation required)
- [x] ~~Security finding #9 (admin action log)~~ — DONE 2026-04-16. Migration 088 + `logAdminAction()` + 3 routes wired.
- [x] ~~Security finding #10 (sys vs org admin)~~ — DONE 2026-04-16. `requireOrgAdmin()` added to `src/lib/admin/auth.ts`.
- [x] ~~PII Phase 4: drop plaintext columns from `activity_log`~~ — DONE 2026-04-12. Migration 083 applied, post-check passed.
- [ ] Renovation Phase 3: Contacts — merged timeline, referral tracking, realtor performance
- [ ] Marketing site: demo user with synthetic data (blocks May 1 launch screenshots)
- [ ] Activate LO Waitlist n8n workflow after copy review
- [ ] Create Mailchimp audience "LoanOS Waitlist"
- [ ] **Convert Publish to Netlify background function** — rename `generate-newsletter.js` → `generate-newsletter-background.js` (and same for `generate-rate-update`). Background functions return 202 in <1s and run up to 15 min, eliminating the Vercel 60s timeout risk on publish. Preview stays synchronous. Client needs to poll/webhook for completion — decide pattern during implementation. Context: done via proxy 2026-04-14 (commit 0759bea), but 40-60s publish workload is one bad Anthropic latency spike away from timing out.

## Backlog (someday/maybe)

- [ ] Renovation Phase 4: multi-tenant UI — onboarding wizard, "Connect Arive" flow
- [ ] A-6: consolidate ~30 service-role routes onto `createUserScopedClient()` helper
- [ ] A-11: move agent routes under `/api/webhooks/agents/[org_slug]/...`
- [ ] CSP nonce rollout (drop `unsafe-inline` from script-src)
- [ ] hCaptcha on styermortgage.com web-lead form
- [ ] SOC 2 Type 1 kickoff
- [ ] Film Reels: Posts 44, 51, 23, 16, 18
- [ ] Create Canva assets: Posts 1, 5, 6, 8, 10, 12, 13, 22, 27, 43, 47, 52, 55, 60
- [x] Weeks 1-3 social posts rebuilt in social_drafts (21 posts inserted 2026-04-08)
