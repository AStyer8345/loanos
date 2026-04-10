# LoanOS — Open Work

> Granular action items: `tasks/ADAM-TODO.md`
> Security tracker: `tasks/security-hardening-critical-gaps.md`

## Now (this week)

- [x] ~~Adam: fill in `extractPayloadIdentity()` in `src/lib/los/verifyLosPayload.ts`~~ — DONE. Implemented with `loanOfficerEmail` (confirmed 2026-04-04 Zap run). Verified 2026-04-09.
- [x] Apply migration 075 (`los_integrations`) to Supabase (done 2026-04-08)
- [ ] Run PII backfill script (`scripts/backfill-activity-pii.ts`)
- [ ] Adam: register FRED API key → unblocks Refi Watch Sequence A (Rate Drop Alert) for 644 past clients
- [ ] Adam: verify Microsoft Outlook credential in n8n UI → activates Refi Watch Sequences B + Set Rate (both built, both INACTIVE)
- [ ] Adam: upload selfies → unblocks LoanOS social content stream
- [ ] Social posts: at Week 15 (Posts 87-91 built). Adam must film Post 88 Reel (by June 18) + create Post 91 Canva (by June 23). Posts 29+30 Liberation Day decision by April 28.
- [ ] Adam: build 3 Mailchimp Customer Journeys (PA Welcome, Rate Watch, DPA Guide)
- [ ] NMLS# 513013 profile audit on all 4 social platforms
- [ ] Adam: review/approve Refi Watch email copy (Sequences A + D)

## Next (after Now items clear)

- [ ] Security findings #5 (field-level encryption), #9 (admin action log), #10 (sys vs org admin)
- [ ] PII Phase 4: drop plaintext columns from `activity_log` after backfill verified
- [ ] Renovation Phase 3: Contacts — merged timeline, referral tracking, realtor performance
- [ ] Marketing site: demo user with synthetic data (blocks May 1 launch screenshots)
- [ ] Activate LO Waitlist n8n workflow after copy review
- [ ] Create Mailchimp audience "LoanOS Waitlist"

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
