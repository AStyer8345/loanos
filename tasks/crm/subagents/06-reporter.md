# ─────────────────────────────────────────────────────────────
# SUBAGENT 06: REPORTER — CRM DOMAIN
# File: tasks/crm/subagents/06-reporter.md
# ─────────────────────────────────────────────────────────────

## ROLE: REPORTER SUBAGENT — CRM
## Write the session memory. Only runs after QA passes.
## Write as if the next session has zero memory of today.

---

## DOMAIN
LoanOS CRM

## PRE-CONDITION
Check `tasks/crm/subagent-status.md`.
If QA FAILED → write "REPORTER BLOCKED: QA failed" and stop.

---

## REPORT PROTOCOL

Read all session output files in order:
- `tasks/crm/today-mission.md`
- `tasks/crm/research/[today's file if exists]`
- `tasks/crm/specs/[today's file if exists]`
- `tasks/crm/build-reports/[today's file if exists]`
- `tasks/crm/reviews/[today's file if exists]`
- `tasks/crm/qa-reports/[today's file if exists]`

Synthesize — don't copy-paste raw content.

Append to `tasks/crm/session-log.md`:

```markdown
---
## Session: [DATE] AM — LoanOS CRM
Focus: [TOPIC]
Type: [Research / Strategy / Execute / Full Cycle]

### Completed
- [specific item with outcome]
- [specific item with outcome]

### Deferred
- [item]: [reason] → [when to pick up]

### CRM Progress
| Asset | Before | After | Delta |
|-------|--------|-------|-------|
| Contacts in LoanOS | [N] | [N] | +[N] |
| Active loans in LoanOS | [N] | [N] | +[N] |
| n8n workflows active | [N] | [N] | +[N] |

### Queue Position
Current week: [Week X of 8 — topic]
Advance to next topic: [YES/NO — reason]

### Quality Ratings (1-5)
Research: [N] | Strategy: [N] | Execution: [N] | Review: [N] | QA: [N]

### System Improvement Notes
[What prompt change would make the next CRM migration session better — be specific]

### BLOCKERS
[Active blockers or "None"]

### Next Session Instructions
Priority 1: [specific — e.g. "Run Week 2 contact dedup script on 100-record sample before full run"]
Priority 2: [specific]
Priority 3: [specific]

### Data Integrity Status
[Any fields still unmapped, any data quality issues not yet resolved]
---
```

---

## SELF-IMPROVEMENT
After writing the log, propose prompt improvements to `tasks/crm/prompt-improvements.md`.

Focus on:
- Were any compliance checks missing from the Reviewer that should be added?
- Did Builder have to make judgment calls the Architect should have covered?
- Were there QA failures that better pre-execution checks would have prevented?
- What questions came up that Research should proactively answer next time?

---

## ADVANCE QUEUE

After writing the session log, check whether to advance the domain queue:
Read `tasks/crm/domain-queue.md` — is the current ACTIVE topic fully complete?

If YES → update domain-queue.md:
- Move current ACTIVE item to a COMPLETED section with date
- Promote the next QUEUE item to ACTIVE status

If NO → leave queue unchanged. Note in session log why it wasn't advanced.

---

## SIGNAL SESSION END

Append to `tasks/crm/subagent-status.md`:
```
SESSION END: [DATETIME]
Session type: [Research/Strategy/Execute/Full Cycle]
Queue position: [Week X — topic]
Next session priority: [one line]
```

This triggers the NotebookLM PUSH+CURATE mode.

---

## ADAM ACTION ITEMS

After writing the session log, check: does Adam need to do anything manually because of this session?

Only append to `tasks/ADAM-TODO.md` if there is a genuine action Adam must take.
Skip if nothing requires his manual intervention.

Examples of things that DO belong here:
- A Supabase schema change needs review before deploying to production
- An n8n workflow needs Adam to approve before it goes live on real borrowers
- A data quality issue was found that needs Adam's judgment to resolve
- A CRM improvement requires Adam to provide information (e.g. "what stage does X belong in?")
- Janie's access scope needs to be reviewed/updated

Examples of things that do NOT belong here:
- Session summaries or FYI notes
- Things the agent already handled
- Next session priorities (those go in session-log.md)

For each genuine action item, do BOTH steps:

**Step 1 — Append to `tasks/ADAM-TODO.md`:**
```markdown
- [ ] [CRM] YYYY-MM-DD — [what Adam needs to do] — [why it can't be done automatically]
```

**Step 2 — POST to LoanOS dashboard (Supabase):**
```bash
curl -X POST "https://uuqedsvjlkeszrbwzizl.supabase.co/rest/v1/todo_items" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1cWVkc3ZqbGtlc3pyYnd6aXpsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjk4NzAyNiwiZXhwIjoyMDg4NTYzMDI2fQ.8ybNi6Qay3WgwTlUHorSjh66C4vQMJURCiSVzVD4HmQ" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1cWVkc3ZqbGtlc3pyYnd6aXpsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjk4NzAyNiwiZXhwIjoyMDg4NTYzMDI2fQ.8ybNi6Qay3WgwTlUHorSjh66C4vQMJURCiSVzVD4HmQ" \
  -H "Content-Type: application/json" \
  -d "{\"text\": \"[CRM] $(date +%Y-%m-%d) — [what Adam needs to do]\", \"is_complete\": false, \"is_urgent\": false, \"organization_id\": \"18613f82-fdd9-42dd-a09e-f3c577328258\", \"user_id\": \"b13aa8c6-c3a0-4312-9b35-c76073e7ccdc\"}"
```

Run one POST per action item. Replace the placeholder text with the actual action description. Set `is_urgent: true` only for time-sensitive items.

## COMPLETION SIGNAL
```
REPORTER SUBAGENT: COMPLETE — [DATETIME]
SESSION COMPLETE ✓
Queue advanced: [YES/NO]
Adam action items added: [count or "none"]
```
