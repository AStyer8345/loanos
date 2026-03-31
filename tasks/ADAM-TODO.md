# Adam's Action Items
# Agents append [ ] items here after every session.
# Adam: change [ ] to [x] when done. Leave [x] items in place — agents will ignore them.
# Agents: only act on [ ] items. [x] items are complete — do not re-surface them.

---

## PENDING

<!-- Agents append new items below this line -->
- [ ] [SOCIAL] 2026-03-31 — Run 3 Publer curl commands for Week 2 text posts (Posts 9, 11, 14) — commands in tasks/social-media/qa-reports/2026-03-31-week2-qa.md (run from local terminal, API unreachable from agent)
- [ ] [SOCIAL] 2026-03-31 — Create Canva assets for Week 2 carousel posts: Post 8 (12 slides), Post 10 (8 slides), Post 12 (10 slides), Post 13 (6 slides) — design briefs in tasks/social-media/build-reports/2026-03-28-week2-build.md
- [ ] [SOCIAL] 2026-03-31 — Film vertical videos for Week 2: Post 9 (30-sec Reel, rate lock questions) + Post 11 (30-45 sec, why I became a broker) — scripts with timecodes in tasks/social-media/build-reports/2026-03-28-week2-build.md
- [ ] [SOCIAL] 2026-03-31 — Replace placeholder county market data in Week 2 Posts 12 & 13 on/after April 16 — pull from unlockmls.com/housing-stats; replace all ~[~PLACEHOLDER] values in Supabase social_drafts and Publer draft before April 17 publish
- [ ] [SOCIAL] 2026-03-28 — Run 7 Publer curl commands to create Week 1 post DRAFTS — commands in tasks/social-media/qa-reports/2026-03-28-week1-qa.md (use corrected commands for Posts 2, 4, 5)
- [ ] [SOCIAL] 2026-03-28 — Replace placeholder market data in Posts 5, 6, & 7 before April 7 — pull live figures from unlockmls.com/housing-stats/ on or after 2026-04-02
- [ ] [SOCIAL] 2026-03-28 — Create Canva assets: Post 1 (12-slide PDF), Post 5 (10-slide PDF), Post 6 (5-slide carousel) — design briefs in tasks/social-media/build-reports/2026-03-28-week1-build.md
- [ ] [SOCIAL] 2026-03-28 — Film vertical video for Posts 2 & 4 — scripts (with timecodes) in tasks/social-media/build-reports/2026-03-28-week1-build.md
- [ ] [SOCIAL] 2026-03-28 — Complete NMLS# 513013 profile audit on all 4 social platforms (LinkedIn, Instagram, Facebook, Google Business Profile) before April 7 publish date
- [ ] [CRM] 2026-03-27 — WARNING: WF2 will overwrite closing_date with Arive's estimated date on next webhook. 5 loans currently have closing_date ≠ est_closing_date — if any were manually set to an intentional actual closing date, check them before a new Arive webhook fires. To prevent this long-term, investigate whether Arive exposes `keyDates_actualFundingDate` in the webhook payload.
- [ ] [LEAD-GEN] 2026-03-27 — Pre-Approval Funnel spec is ready to build. Confirm 3 Netlify env vars are set (MAILCHIMP_API_KEY, MAILCHIMP_BORROWER_LIST_ID, LOANOS_AGENT_SECRET) on styermortgage.com in Netlify dashboard → Builder can execute immediately after confirmation. Spec: tasks/lead-gen/specs/2026-03-27-pre-approval-funnel-spec.md
- [ ] [CRM] 2026-03-26 — Answer 8 contact schema questions in `tasks/crm/research/2026-03-25-contact-data-architecture.md` — these gate the Contact Data Architecture spec and all smart list / schema improvements
- [x] [CRM] 2026-03-26 — Confirm email_opt_out is enforced in n8n milestone email workflows — FIXED 2026-03-26 AM session: enforcement now in milestone route.ts
- [x] [CRM] 2026-03-26 — Answer 5 loan pipeline questions — ANSWERED 2026-03-27: sort=closing date, active=app_received→closing_scheduled, rate lock=yes in Arive+add closing_date to webhook, Janie=Arive only, Kanban=yes build it
- [x] [CRM] 2026-03-27 — Answer 4 automation coverage questions — FULLY ANSWERED 2026-03-28: drip=manual, WF2=Arive handles milestone emails (no change to WF2), review=Arive fund event, rate=compare to rate update email. Automation builder UNBLOCKED.

- [ ] [LEAD-GEN] 2026-03-28 — Create "Rate Watch Welcome Series" Customer Journey in Mailchimp UI: Trigger = tag `rate-alert`, 4-email sequence (Days 0/3/7/14) with full copy in tasks/lead-gen/specs/2026-03-28-rate-alert-funnel-spec.md
- [ ] [LEAD-GEN] 2026-03-28 — Create recurring weekly Friday 9:00 AM CT Mailchimp campaign to send rate update to all `rate-alert` tagged subscribers — use template in spec
- [x] [LEAD-GEN] 2026-03-29 — DEPLOY: `git push` from `/Users/adamstyer/Documents/Claude/styerteam-mortgage-site` — COMPLETE (commit 1b3f0be, 2026-03-29 10:00 AM CT). Both funnels live.
- [ ] [LEAD-GEN] 2026-03-30 — BLOCKER-004: Add Netlify env var `LOANOS_URL = https://loanos-astyer8345s-projects.vercel.app` in Netlify dashboard → styermortgage.com → Site settings → Environment variables. Without this, ALL LoanOS contact creation via subscribe-lead.js fails. (Builder will handle the code change — just add the env var.)
- [ ] [LEAD-GEN] 2026-03-30 — BLOCKER-005: After Builder fixes subscribe-lead.js, run `git push` from `/Users/adamstyer/Documents/Claude/styerteam-mortgage-site` to deploy the fix. This fixes PA speed-to-lead notification (n8n PA notify was not firing due to missing `await`).
- [ ] [LEAD-GEN] 2026-03-30 — Confirm `LOANOS_SYSTEM_USER_ID` is set as an env var in Vercel dashboard for the LoanOS project (team_aJNpxKvLlNTUiDdWTdhX0Vgf, project loanos). Required for web-lead API route to function. Check: Vercel → loanos project → Settings → Environment Variables.
