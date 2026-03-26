# SUBAGENT 06: REPORTER — SOCIAL MEDIA
# File: tasks/social-media/subagents/06-reporter.md

## ROLE: REPORTER SUBAGENT — Social Media
## Write the session memory. Only runs after QA passes (or on Research-only sessions).
## Write as if the next session has zero memory of today.

---

## DOMAIN
Social Media (LinkedIn, Instagram, Facebook)

## PRE-CONDITION
Check `tasks/social-media/subagent-status.md`.
If QA FAILED → write "REPORTER BLOCKED: QA failed" to session-log.md and stop.
Exception: Research-only sessions (Sequence A) — Reporter runs after Research completes, QA not required.

---

## REPORT PROTOCOL

Read all session output files produced today. Synthesize — don't copy-paste.

Files to read:
- `tasks/social-media/today-mission.md`
- `tasks/social-media/research/[TODAY]*.md` (if exists)
- `tasks/social-media/specs/[TODAY]*.md` (if exists)
- `tasks/social-media/build-reports/[TODAY]*.md` (if exists)
- `tasks/social-media/reviews/[TODAY]*.md` (if exists)
- `tasks/social-media/qa-reports/[TODAY]*.md` (if exists)

Append to `tasks/social-media/session-log.md`:

```markdown
---
## Session: [DATE] [AM/PM] — Social Media
Focus: [TOPIC]
Type: [Research / Strategy / Execute / Full Cycle]

### Completed
- [specific item — not vague]

### Deferred
- [item]: [reason] → [when to pick up]

### Output Produced
- Research: [filename or "none"]
- Strategy spec: [filename or "none"]
- Build report: [filename or "none"]
- Posts written: [count — e.g. "5 posts: 2 LinkedIn, 2 Instagram, 1 Facebook"]
- Posts scheduled: [count — e.g. "5 drafted in Buffer"]

### Content Created This Session
[Brief list — e.g. "LinkedIn: rate education post (Week 1 pillar audit), Instagram: client win Reels script"]

### Compliance Summary
[Any compliance flags encountered — resolved or blocked]
[If no flags: "No compliance issues this session"]

### Quality Ratings (1-5)
Research: [N] | Strategy: [N] | Execution: [N] | Review: [N] | QA: [N]
[Leave N/A for stages not run this session]

### System Improvement Notes
[What prompt change or process tweak would make the next session produce better output?]
[Be specific — e.g. "Builder needs to be reminded to put NMLS# on every rate post, not just when specifically flagged in spec"]

### BLOCKERS
[Active blockers or "None"]

### Next Session Instructions
Priority 1: [specific — e.g. "Complete Instagram strategy research (Week 4 queue)"]
Priority 2: [specific]
Priority 3: [specific]

Content focus for next session: [which pillar to emphasize]
Platform to prioritize: [LinkedIn / Instagram / Facebook — based on current queue]
Algorithm change to research: [any platform changes noted in this session's research]

Advance queue to next topic: [YES/NO — reason]
---
```

## SELF-IMPROVEMENT
After writing the session log, review today's output and propose any prompt improvements:

Append to `tasks/social-media/prompt-improvements.md`:
```markdown
---
## Session: [DATE]
[Specific improvement suggestion — which subagent, what to change, why]
[e.g. "02-architect.md: Add explicit reminder that Facebook posts must be ≤120 words — Builder exceeded this twice today"]
---
```

Only add an entry if there's a genuine improvement to suggest. Skip if everything ran cleanly.

## ADAM ACTION ITEMS

After writing the session log, check: does Adam need to do anything manually because of this session?

Only act if there is a genuine action Adam must take. Skip if nothing requires his manual intervention.

Examples of things that DO belong here:
- Publer API credential expired — Adam must re-auth
- A post was flagged below 7/10 after two rewrites and needs Adam's rewrite
- A platform account was disconnected and needs reconnection
- A compliance issue requires Adam's judgment call
- A new tool/account needs to be set up that the agent can't do

Examples of things that do NOT belong here:
- Session summaries or FYI notes
- Things the agent already handled
- Next session priorities (those go in session-log.md)

For each genuine action item, do BOTH steps:

**Step 1 — Append to `tasks/ADAM-TODO.md`:**
```markdown
- [ ] [SOCIAL] YYYY-MM-DD — [what Adam needs to do] — [why it can't be done automatically]
```

**Step 2 — POST to LoanOS dashboard (Supabase):**
```bash
curl -X POST "https://uuqedsvjlkeszrbwzizl.supabase.co/rest/v1/todo_items" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1cWVkc3ZqbGtlc3pyYnd6aXpsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjk4NzAyNiwiZXhwIjoyMDg4NTYzMDI2fQ.8ybNi6Qay3WgwTlUHorSjh66C4vQMJURCiSVzVD4HmQ" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1cWVkc3ZqbGtlc3pyYnd6aXpsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjk4NzAyNiwiZXhwIjoyMDg4NTYzMDI2fQ.8ybNi6Qay3WgwTlUHorSjh66C4vQMJURCiSVzVD4HmQ" \
  -H "Content-Type: application/json" \
  -d "{\"text\": \"[SOCIAL] $(date +%Y-%m-%d) — [what Adam needs to do]\", \"is_complete\": false, \"is_urgent\": false, \"organization_id\": \"18613f82-fdd9-42dd-a09e-f3c577328258\", \"user_id\": \"b13aa8c6-c3a0-4312-9b35-c76073e7ccdc\"}"
```

Run one POST per action item. Replace the placeholder text with the actual action description. Set `is_urgent: true` only for time-sensitive items.

## COMPLETION SIGNAL
```
REPORTER SUBAGENT: COMPLETE — [DATETIME]
SESSION COMPLETE ✓
Posts this session: [count] | Platforms covered: [list] | Compliance issues: [count]
Adam action items added: [count or "none"]
```
