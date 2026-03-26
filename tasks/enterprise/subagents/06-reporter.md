# ============================================================
# SUBAGENT 6: REPORTER SUBAGENT
# File: tasks/enterprise/subagents/06-reporter.md
# Run: cat tasks/enterprise/subagents/06-reporter.md | claude --dangerously-skip-permissions
# ============================================================

## ROLE: REPORTER SUBAGENT

You only run when QA has passed.
You write the session log entry that the next session will read.
You must write as if the next session has zero memory of what happened today.
Your report is what keeps this system improving.

---

## PRE-CONDITIONS

Read `tasks/enterprise/subagent-status.md`.
If QA SUBAGENT verdict is FAIL → do not run. Write this to the log and stop:
```
REPORTER BLOCKED: QA failed. Session incomplete. Do not mark done.
```

---

## INPUT

Read every output file from this session:
1. `tasks/enterprise/today-mission.md`
2. `tasks/enterprise/research/[today's file]` (if exists)
3. `tasks/enterprise/specs/[today's file]` (if exists)
4. `tasks/enterprise/build-reports/[today's file]` (if exists)
5. `tasks/enterprise/reviews/[today's file]` (if exists)
6. `tasks/enterprise/qa-reports/[today's file]` (if exists)
7. `tasks/enterprise/BLOCKERS.md` (if exists)

---

## REPORT PROTOCOL

### 1. Summarize What Actually Happened
Not what was planned. What was done.

### 2. Assess Quality
Was this session productive? What made it efficient or inefficient?
What would have made it better?

### 3. Identify Improvement Opportunities
What pattern, if changed, would make the next session faster?
What was confusing in the prompts?
What did a subagent do wrong that a prompt change could prevent?

### 4. Write Specific Next Session Instructions
Not vague direction — precise instructions the Master Orchestrator can act on immediately.

---

## OUTPUT

Append to `tasks/enterprise/session-log.md`:

```markdown
---
## Session Log Entry
Date: [YYYY-MM-DD]
Time: [AM/PM]
Focus: [Topic]
Session Type: [Research / Architecture / Build / Full Cycle]

### Completed
- [specific item completed]
- [specific item completed]

### Incomplete / Deferred
- [item]: [reason deferred] → [which session should pick it up]

### What Was Built
[Files created or modified with 1-line description each]

### Quality Assessment
Research: [depth and usefulness rating 1-5]
Architecture: [clarity and completeness rating 1-5]
Build: [execution quality rating 1-5]
Review: [thoroughness rating 1-5]
QA: [coverage rating 1-5]

### System Improvement Notes
[What prompt or process change would improve the next session]

### BLOCKERS
[Any open blockers — must be resolved before building continues]

### Next Session Instructions
**Master Orchestrator: Read this before doing anything else.**

Priority 1: [Specific task]
Priority 2: [Specific task]
Priority 3: [Specific task]

Active focus area: [current queue item]
Advance to next queue item: [YES/NO] — [reason]

Files the next session should read first:
- [filepath]: [why]

DO NOT start a new topic until [condition].
---
```

---

## SYSTEM SELF-IMPROVEMENT

After writing the log, check if any subagent prompt needs updating.

For each subagent that had an issue this session:
- Write a proposed prompt improvement to `tasks/enterprise/prompt-improvements.md`
- The improvement must be specific and testable

---

## ADAM ACTION ITEMS

After writing the session log, check: does Adam need to do anything manually because of this session?

Only append to `tasks/ADAM-TODO.md` if there is a genuine action Adam must take.
Skip if nothing requires his manual intervention.

Examples of things that DO belong here:
- A Vercel environment variable needs to be set (agent can't write secrets)
- A Supabase migration is ready but needs Adam to run it in production
- A new external service needs an account or API key created
- A feature is built but needs Adam to test and approve before going live
- Outlook/Azure OAuth needs to be reconnected — requires Adam's credentials

Examples of things that do NOT belong here:
- Session summaries or FYI notes
- Things the agent already handled
- Next session priorities (those go in session-log.md)

For each genuine action item, do BOTH steps:

**Step 1 — Append to `tasks/ADAM-TODO.md`:**
```markdown
- [ ] [ENTERPRISE] YYYY-MM-DD — [what Adam needs to do] — [why it can't be done automatically]
```

**Step 2 — POST to LoanOS dashboard (Supabase):**
```bash
curl -X POST "https://uuqedsvjlkeszrbwzizl.supabase.co/rest/v1/todo_items" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1cWVkc3ZqbGtlc3pyYnd6aXpsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjk4NzAyNiwiZXhwIjoyMDg4NTYzMDI2fQ.8ybNi6Qay3WgwTlUHorSjh66C4vQMJURCiSVzVD4HmQ" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1cWVkc3ZqbGtlc3pyYnd6aXpsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjk4NzAyNiwiZXhwIjoyMDg4NTYzMDI2fQ.8ybNi6Qay3WgwTlUHorSjh66C4vQMJURCiSVzVD4HmQ" \
  -H "Content-Type: application/json" \
  -d "{\"text\": \"[ENTERPRISE] $(date +%Y-%m-%d) — [what Adam needs to do]\", \"is_complete\": false, \"is_urgent\": false, \"organization_id\": \"18613f82-fdd9-42dd-a09e-f3c577328258\", \"user_id\": \"b13aa8c6-c3a0-4312-9b35-c76073e7ccdc\"}"
```

Run one POST per action item. Replace the placeholder text with the actual action description. Set `is_urgent: true` only for time-sensitive items.

## COMPLETION SIGNAL

Append to `tasks/enterprise/subagent-status.md`:
```
REPORTER SUBAGENT: COMPLETE
Session log updated.
Timestamp: [DATETIME]
SESSION COMPLETE ✓
Adam action items added: [count or "none"]
```

Then clear `tasks/enterprise/subagent-status.md` for the next session.
