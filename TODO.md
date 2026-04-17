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
- [ ] Social posts: through Week 20 (Posts 112-116, July 22-28 built). Post 39 CPI filled ✅ — Adam: APPROVE before April 15 publish (4 days!). Film Reels: Post 98 (by July 2), Post 103 (by July 9). Approve Post 101 after NFP Refresh (July 4/7). **Posts 29+30 Liberation Day: decision required by April 28 — decision needed by April 18 to avoid emergency.** Canva backlog: Posts 43, 44, 47, 51, 52, 55, 60, 81, 115. New Adam items: Post 113 Reel (guitar, film by July 20), Post 115 Carousel (create Canva by July 22). Week 21 next (Posts 117-121, consider 1 TIMELY for FOMC July 29-30).
- [x] ~~Adam: build 3 Mailchimp Customer Journeys~~ — SUPERSEDED 2026-04-14. PA Welcome (6 emails) + DPA Guide (8 emails) moved to n8n+Resend workflows (`rwi3qEYgJKGGHkHc`, `0M8Vnf6MhB1xtaIg`), triggered from subscribe-lead.js. Mailchimp only handles list/tags. "Rate Watch" sequence not built — decide scope separately (name was ambiguous: market rate drops vs. quoted-rate watch for specific borrower).
- [ ] NMLS# 513013 profile audit on all 4 social platforms
- [ ] Adam: review/approve Refi Watch email copy (Sequences A + D)
- [x] ~~**NEEDS ADAM — decide on n8n Drip Scheduler `LqBb3YDLjS2eUrDE`.**~~ DECIDED 2026-04-16 PM: option (a) now, (c) later. Workflow archived via MCP (`active: false`, `isArchived: true`) — daily cron no longer runs, dead Outlook send node never fires again. Banner added to `/dashboard/drip-campaigns` so the UI stops pretending. Skipped option (b) Resend retarget (12 throwaway n8n nodes during a WDK cutover). The 6 campaigns (Ghost Referral, Incomplete App, Went Quiet, Long-Term Nurture, Past Client Retention, Realtor Relationships) move to Workflow DevKit as a dedicated phase AFTER Task 23 cutover completes — not as scope creep into Task 23. To restore: un-archive `LqBb3YDLjS2eUrDE` via MCP and re-activate.
- [x] ~~**Populate `automation_registry` transactional templates — 2/7 done (2026-04-16 PM).**~~ DONE 2026-04-16 PM (late-2). All 7 rows (Referral Intro, Review Request, Final CD, Pre-Approval, Contract Received, New Application Received, Refi Intake) now `email_mode='fixed_template'` with populated `email_template` + `email_variables`. Final CD TRID 3-day framing + wire-fraud warning preserved verbatim. See CHANGELOG 2026-04-16 PM (late-2) for per-row details and verification scan.
- [ ] **Wire n8n code nodes to fetch templates from `automation_registry` at runtime.** Registry is now fully populated (body + subject + vars on all 8 rows). Per workflow: HTTP GET `automation_registry?source_id=eq.X&source_node_id=eq.Y`, substitute `{{var}}` tags on `email_template` + `subject_template`, send. Also swaps the dead Outlook draft node for Resend at the same time since we're editing the sender anyway. **Refi Intake caveat**: template uses `{{cash_label}}`, `{{cash_amt}}`, `{{escrow_row_html}}`, `{{processor_note}}` as pre-resolved derived vars — caller must compute conditionals (`cash_to_close` sign, `escrow === 'Waived'`, org = Adam) before substitution. **Pre-Approval caveat**: `{{lo_*}}` + `{{brand_header}}` + `{{calendly_link}}` require the same profiles/organizations/org_settings lookup the current JS does. **Contract Received caveat**: workflow now has 2 registry rows (`build-borrower-email` + `build-party-email` via `source_node_id`); both need lookups. **Decision before wiring**: do these workflows migrate to Workflow DevKit (matching web-lead-intake + nurture) instead of being rewired inside n8n? Blast radius: 6 production-active workflows.
- [x] ~~**`automation_registry` schema gap — Contract Received Party Reply email.**~~ DONE 2026-04-16 PM (late-3). Picked option (b): separate registry row `Contract Received — Party Reply` (id `68dc830e-3eec-44f4-ab24-05c71174964e`, source_node_id `build-party-email`). Unique index `(org_id, source_id, source_node_id) NULLS NOT DISTINCT` widened to support multi-email workflows. Existing row renamed `Contract Received — Borrower Welcome` (source_node_id `build-borrower-email`).
- [x] ~~**n8n fix — Set Rate webhook Store Rate node:**~~ DONE 2026-04-16 PM (late-3). Workflow `3iXImUkjgMitpJKt` repaired end-to-end: (1) removed `from_address` + `subject` from Store Rate body JSON (neither column exists); (2) fixed pre-existing Validate Rate bug — `return [{json}]` → `return {json}` for `runOnceForEachItem` mode. Verified via MCP `execute_workflow` (execution 5175 success) + new `activity_log` row `9b3a765d-d02d-4b04-997d-3a8e9bd23c2c` written clean. Manual rate updates can use `curl .../webhook/refi-watch-set-rate -d '{"rate":X}'` again. Rate Drop Alert threshold still 6.00%; today's 6.37% won't trigger alerts.

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
