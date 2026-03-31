# Prompt Improvements — Social Media
Reporter Subagent appends suggested improvements here each session.

---
## Session: 2026-03-26 AM

**master-agent.md — STEP 4:** Add explicit check: if account audit data has not been received after 2+ sessions, write a BLOCKER to BLOCKERS.md flagging it as a soft blocker with instructions for Adam to share analytics screenshots. This prevents infinite deferral of the audit step.

**01-research.md — Section 5 (Performance Data):** Add a note that if no account access is available, the agent should document this explicitly in the "Performance Data" section of the research output as "STATUS: BLOCKED — account access required" rather than leaving the section empty. This makes the gap visible.

**master-agent.md — domain-queue.md update trigger:** After each Research session that produces a new spec, master-agent.md should check if domain-queue.md needs to be updated with new completed items. Current session moved two items from "in progress" to "effectively done pending account audit" — domain-queue should reflect this.
---
## Session: 2026-03-27 AM

**02-architect.md — FOMC calendar check:** Add explicit instruction to look up the FOMC meeting calendar before writing any post that references a Fed meeting. Current spec left Post 29-30 as templates with [bracket] placeholders — this is correct but the subagent should also note the actual scheduled Fed meeting date so Builder has it without needing to search.

**02-architect.md — Weekly post count clarification:** The pillar spec said 7 posts/week but domain-queue goal is 5/week. Add a step to the Architect that explicitly asks: "Does this plan meet the target cadence in domain-queue.md? If it exceeds target, note which posts are optional vs. core."

**domain-queue.md — Update to reflect calendar skeleton complete:** The 30-Day Content Calendar item should be moved from QUEUE to IN PROGRESS now that the skeleton spec exists. The next step is Builder writing copy for Week 1.
---
## Session: 2026-03-31 AM

**03-builder.md — LinkedIn hashtag count (recurring):** This is the second session flagging LinkedIn hashtag count violations (Posts 10 and 12 both had 6 hashtags; max is 5). The existing platform spec states ≤5 but Builder continues to over-count. Add a bold warning directly before the LinkedIn hashtag spec: "**STOP: Count your LinkedIn hashtags before writing. Maximum is 5. If you wrote more than 5, delete down to 5 before continuing.**" Making the count-check explicit prevents repeated Reviewer rejection.

**master-agent.md — Sequence C: Reviewer must run same session as Builder:** This session ran Reviewer on Week 2 posts 3 days after Builder wrote them. Posts sat in social_drafts unreviewed for 3 days. Add to Sequence C definition: "Builder and Reviewer MUST complete in the same session. If session runs long and Reviewer cannot run, note it as a DEFERRED item in session-log and write 'REVIEWER PENDING — WEEK [X]' to BLOCKERS.md so the next session picks it up immediately."

---
## Session: 2026-03-28

**03-builder.md — Add explicit Instagram hashtag requirement:** In the Instagram platform spec section, add an explicit line item: "Instagram captions MUST include 5–10 relevant hashtags. This is a hard platform spec requirement — posts with zero hashtags will be auto-rejected by Reviewer." Builder wrote all three Instagram captions (Posts 2, 4, 6) without any hashtags in Round 1. All three were rejected, requiring a full fix pass. Adding this as a named requirement prevents a wasted Reviewer round.

**03-builder.md — Generate curl commands AFTER quality review in a dedicated "Final Post Copy" section:** Add instruction: "Curl commands for Publer must be generated in a 'Publer Curl Commands' section that appears after 'Final Post Copy.' Curl text must reference final production captions, not initial draft captions. Never generate curl commands before quality rewrites are confirmed." Three of seven curl commands in this session used pre-rewrite captions; QA had to write corrected versions of all three.

**03-builder.md — Enforce tilde (~) prefix on ALL placeholder data from first draft:** Add rule: "Any stat or figure not verified from a live source in this session MUST carry a ~ (tilde) prefix in both slide copy and caption, from the first draft pass. Tildes must survive rewrites — if a Quality or Review pass removes a tilde from a placeholder figure, re-add it. Do not present unverified data as fact at any stage." The Quality rewrite of Post 5 removed tildes from the caption; Reviewer caught it and flagged a factual accuracy risk. A tilde-on-first-write rule prevents downstream removal.
---
