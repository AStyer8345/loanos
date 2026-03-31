## Mission Brief — 2026-03-31 AM

### Domain
Social Media

### Focus Area
Week 2 Compliance Review + QA — Posts 8–14 (April 13–17, 2026)

### Session Type
[x] Execute / Build (Sequence C — continuation)
Posts 8–14 were built in the 2026-03-28 AM run 2 session but Reviewer and QA were never completed.
Today completes the chain: Reviewer → QA → social_drafts verification → Reporter → NotebookLM PUSH

### Objectives
1. Run compliance + spec review (Reviewer subagent) on all 7 Week 2 posts (Posts 8–14)
2. Verify Posts 8–14 exist in social_drafts Supabase table — insert any missing
3. Complete QA report confirming all 7 posts are queryable from LoanOS Marketing → Social tab
4. Update session log for the completed Week 2 execution chain

### Definition of Done
- Reviewer has approved all 7 Week 2 posts (or flagged specific blocks with fix instructions)
- All 7 posts confirmed in social_drafts Supabase table
- QA report written
- Session log updated with Week 2 completion entry
- NotebookLM PUSH complete

### Resources / Files in Scope
- tasks/social-media/build-reports/2026-03-28-week2-build.md — build output to review
- tasks/social-media/specs/2026-03-27-30day-calendar-skeleton.md — original calendar brief
- Supabase social_drafts table (project: uuqedsvjlkeszrbwzizl)
- tasks/social-media/reviews/ — write 2026-03-31-week2-review.md
- tasks/social-media/qa-reports/ — write 2026-03-31-week2-qa.md
- tasks/social-media/subagent-status.md — status signals
- tasks/social-media/session-log.md — session summary append

### HIGH RISK Items
- Posts 8 and 9: Rate Education — HIGH compliance risk. Must confirm no specific rate percentages, directional language only, NMLS# 513013 in caption
- Posts 12–14: Placeholder stats (~[~PLACEHOLDER]) — do NOT flag as blocking; expected. Must confirm tilde prefix is present
- NEVER write posts live to Publer — curl commands for Adam only
- social_drafts inserts must use status: 'draft' — never 'scheduled' or 'published'

---

## PRIOR SESSION MISSION (2026-03-28 AM run 2 — COMPLETED)
## Mission Brief — 2026-03-28 AM (run 2 — Week 2 Execution)

### Domain
Social Media

### Focus Area
Week 2 Content Execution — Posts 8–14 (April 13–17, 2026)

### Session Type
[ ] Research + Planning (Sequence A)
[ ] Strategy / Architecture (Sequence B)
[x] Execute / Build (Sequence C)
[ ] Full Cycle (Sequence D)

### Objectives
1. Write post copy for all 7 Week 2 posts (Posts 8–14, April 13–17)
2. Run Quality review — all posts must score ≥7/10 before Reviewer
3. Run Reviewer compliance check — Post 8 HIGH-risk (lock/float guidance) must pass
4. Generate Publer draft curl commands for all 7 posts

### Definition of Done
- 7 Week 2 post copy drafts written (Posts 8–14)
- All posts scored ≥7/10 by Quality subagent
- Reviewer approves all posts (APPROVED or APPROVED WITH NOTES)
- Publer curl commands generated for Adam to run manually
- Build report, review, and QA report files written
- Session log updated

### Resources / Files in Scope
- Spec: `tasks/social-media/specs/2026-03-27-30day-calendar-skeleton.md` (Posts 8–14)
- Content pillars: `tasks/social-media/specs/2026-03-26-content-pillars-draft.md`
- Prior pull: `tasks/social-media/notebooklm-pull-2026-03-28.md` (reuse from earlier)
- Output: `tasks/social-media/build-reports/2026-03-28-week2-build.md`
- Review: `tasks/social-media/reviews/2026-03-28-week2-review.md`
- QA: `tasks/social-media/qa-reports/2026-03-28-week2-qa.md`

### HIGH RISK Items
- Post 8 (LinkedIn Rate Education, Apr 14): HIGH risk — lock/float guidance. No specific rates without APR. NMLS# 513013 required.
- Publer API unreachable from agent environment (DNS) — curl commands only, Adam runs from terminal
- Post 8 "My actual recommendation for April 2026 buyers" — directional guidance only, no guaranteed rate predictions

### Carry-Forward Notes
- Week 1 posts (1–7) fully written, reviewed, QA'd — awaiting Adam's curl execution
- NMLS# profile audit still pending — must complete before April 7 publish date
- Placeholder Unlock MLS data in Posts 5/6/7 — Adam replaces on/after 2026-04-02
- Week 2 Posts 12/13/14 (county market data) also need placeholder stats — mark with ~ prefix
- Canva assets needed: Posts 8, 10, 12, 13 — Builder generates prompts, Adam creates in Canva
