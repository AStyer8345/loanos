# Adam's Action Items
# Agents append [ ] items here after every session.
# Adam: change [ ] to [x] when done. Leave [x] items in place — agents will ignore them.
# Agents: only act on [ ] items. [x] items are complete — do not re-surface them.

---

## PENDING

<!-- Agents append new items below this line -->
- [ ] [SOCIAL] 2026-04-01 🚨 INVESTIGATE — Week 1–3 posts (21 posts) do NOT exist in social_drafts Supabase table despite session logs claiming they were written. Prior agent builds used curl to Supabase REST API which has a DNS resolution failure from the agent environment. These posts may never have been saved. Decide: (1) rebuild Weeks 1–3 using the MCP-based insert method now confirmed working, or (2) confirm posts exist elsewhere. Build reports for Weeks 1–3 also do not exist on disk.
- [ ] [SOCIAL] 2026-04-01 — Week 4 Posts 22–28 are now in social_drafts (confirmed). Schedule EVERGREEN posts (22, 23, 26, 27, 28) in LoanOS Marketing → Social tab. DO NOT schedule Posts 24–25 (FOMC TIMELY) until April 29 after 2 PM ET.
- [ ] [SOCIAL] 2026-04-01 — Create Canva assets for Week 4: Post 22 (10-slide LinkedIn carousel, VA myths) + Post 27 (4-slide Instagram carousel, 2-1 buydown) — design briefs in tasks/social-media/build-reports/2026-04-01-week4-build.md
- [ ] [SOCIAL] 2026-04-01 — Film vertical Reel for Post 23 (30–45 sec, VA loan myths buyer-facing) — script in social_drafts (Post 23 ID: 35b84305). Phone-shot vertical, hook: "Most veterans in Austin are leaving money on the table."
- [ ] [SOCIAL] 2026-04-29 — After FOMC decision (2 PM ET): Refresh agent will auto-fill Posts 24–25. Review and approve fills in LoanOS Marketing → Social tab before posting. Target publish: 3–4 PM CDT same day.
- [ ] [SOCIAL] 2026-04-01 ⚠️ URGENT — Run 7 Publer curl commands for Week 1 posts (April 7 publish is in 6 days!) — commands in tasks/social-media/qa-reports/2026-03-28-week1-qa.md (use corrected commands for Posts 2, 4, 5). DO THIS NOW or Week 1 misses its window.
- [ ] [SOCIAL] 2026-04-01 ⚠️ URGENT — Complete NMLS# 513013 profile audit on all 4 social platforms (LinkedIn, Instagram, Facebook, Google Business Profile) before April 7 publish date. No post can go live without this.
- [ ] [SOCIAL] 2026-04-01 — Run 1 Publer curl command for Week 3 Post 17 (LinkedIn long-form, April 23) — command in tasks/social-media/qa-reports/2026-04-01-week3-qa.md (run from local terminal)
- [ ] [SOCIAL] 2026-04-01 — Create Canva assets for Week 3 carousel posts: Post 15 (12 slides, LinkedIn), Post 19 (10 slides, LinkedIn), Post 20 (3-4 slides, Instagram) — design briefs in tasks/social-media/build-reports/2026-04-01-week3-build.md
- [ ] [SOCIAL] 2026-04-01 — Film vertical videos for Week 3: Post 16 (30-sec Reel, 20% down myth) + Post 18 (30-45 sec Reel, pre-approval in 24 hours) — scripts in social_drafts content field for those posts
- [ ] [SOCIAL] 2026-04-01 — Replace placeholder inventory data in Week 3 Posts 19, 20, 21 on/after April 23 — pull from unlockmls.com/housing-stats; replace all ~[~PLACEHOLDER] values in Supabase social_drafts and Publer draft before April 24 publish
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
- [x] [LEAD-GEN] 2026-03-30 — BLOCKER-004: Add Netlify env var `LOANOS_URL = https://loanos-astyer8345s-projects.vercel.app` in Netlify dashboard — DONE 2026-03-31 by Adam
- [x] [LEAD-GEN] 2026-03-30 — BLOCKER-005: After Builder fixes subscribe-lead.js, run `git push` from `/Users/adamstyer/Documents/Claude/styerteam-mortgage-site` to deploy the fix. This fixes PA speed-to-lead notification (n8n PA notify was not firing due to missing `await`). — RESOLVED: Code fixed commit `1a4f90c` 2026-03-30, deployed via subsequent commits through 2026-03-31.
- [x] [LEAD-GEN] 2026-03-30 — Confirm `LOANOS_SYSTEM_USER_ID` is set in Vercel — CONFIRMED 2026-03-31 by Adam
