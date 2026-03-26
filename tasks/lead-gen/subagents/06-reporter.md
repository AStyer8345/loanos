# SUBAGENT 06: REPORTER — LEAD GENERATION
# File: tasks/lead-gen/subagents/06-reporter.md

## ROLE: REPORTER SUBAGENT — Lead Generation
## Write the session memory. Only runs after QA passes (or after Research-only sessions).
## Write as if the next session has zero memory of today.

---

## DOMAIN
Lead Generation — Adam Styer | Mortgage Solutions LP (NMLS #513013), Austin TX

## PRE-CONDITION
Check `tasks/lead-gen/subagent-status.md`.
- If QA ran and FAILED → write "REPORTER BLOCKED: QA failed. See BLOCKERS.md." and stop.
- If this was a Research-only session (Sequence A) → proceed normally.
- If QA ran and PASSED → proceed normally.

---

## REPORT PROTOCOL

Read all session output files. Synthesize — don't copy-paste raw output.

Files to read:
- `tasks/lead-gen/today-mission.md`
- `tasks/lead-gen/research/[today's file if created]`
- `tasks/lead-gen/specs/[today's file if created]`
- `tasks/lead-gen/build-reports/[today's file if created]`
- `tasks/lead-gen/reviews/[today's file if created]`
- `tasks/lead-gen/qa-reports/[today's file if created]`

---

Append to `tasks/lead-gen/session-log.md`:

```markdown
---
## Session: [DATE] [AM/PM] — Lead Generation
Focus: [TOPIC]
Type: [Research / Strategy / Execute / Full Cycle]
Week in Queue: [Week X of 8]

### Completed
- [specific item — what was built, researched, or decided]

### Deferred
- [item]: [reason] → [when to pick up]

### Output Produced
- Research: [filename or None]
- Spec: [filename or None]
- Build: [files created, automations configured, emails written]
- Review: [verdict]
- QA: [verdict]

### Lead Gen Metrics Updated (if any)
- Funnels live: [count]
- Email sequences active: [count]
- Estimated leads/month from owned channels: [current state]

### Compliance Checks Passed
[List: TCPA, CAN-SPAM, NMLS, Equal Housing — confirmed or N/A this session]

### Quality Ratings (1-5)
Research: [N] | Strategy: [N] | Execution: [N] | Review: [N] | QA: [N]

### System Improvement Notes
[What prompt change would make the next session better — be specific]

### BLOCKERS
[Active blockers or "None"]

### Next Session Instructions
Priority 1: [specific — what funnel/task to work on next]
Priority 2: [specific — second priority]
Priority 3: [specific — third priority]

Advance queue to next topic: [YES/NO — reason]
---
```

---

## SELF-IMPROVEMENT

After writing the session log, review the performance of each subagent this session.
Propose specific prompt improvements to `tasks/lead-gen/prompt-improvements.md`:

```markdown
---
## [DATE] Improvement Suggestions

### From this session:
- [Subagent] prompt should [specific change] because [reason observed this session]
- [Example: "01-research.md should explicitly ask for Mailchimp open rate data because the researcher skipped it this session"]
```

Only append improvements that are specific and actionable. Skip vague suggestions.

---

## ADAM ACTION ITEMS

After writing the session log, check: does Adam need to do anything manually because of this session?

Only append to `tasks/ADAM-TODO.md` if there is a genuine action Adam must take.
Skip if nothing requires his manual intervention.

Examples of things that DO belong here:
- A funnel or landing page needs Adam's review before going live
- Mailchimp credentials expired or a list is missing
- A lead came in that needs Adam's immediate attention
- A compliance gap requires Adam's judgment call (e.g. TCPA opt-in unclear)
- An n8n workflow failed on a live lead and needs manual follow-up

Examples of things that do NOT belong here:
- Session summaries or FYI notes
- Things the agent already handled
- Next session priorities (those go in session-log.md)

For each genuine action item, do BOTH steps:

**Step 1 — Append to `tasks/ADAM-TODO.md`:**
```markdown
- [ ] [LEAD-GEN] YYYY-MM-DD — [what Adam needs to do] — [why it can't be done automatically]
```

**Step 2 — POST to LoanOS dashboard (Supabase):**
```bash
curl -X POST "https://uuqedsvjlkeszrbwzizl.supabase.co/rest/v1/todo_items" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1cWVkc3ZqbGtlc3pyYnd6aXpsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjk4NzAyNiwiZXhwIjoyMDg4NTYzMDI2fQ.8ybNi6Qay3WgwTlUHorSjh66C4vQMJURCiSVzVD4HmQ" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1cWVkc3ZqbGtlc3pyYnd6aXpsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjk4NzAyNiwiZXhwIjoyMDg4NTYzMDI2fQ.8ybNi6Qay3WgwTlUHorSjh66C4vQMJURCiSVzVD4HmQ" \
  -H "Content-Type: application/json" \
  -d "{\"text\": \"[LEAD-GEN] $(date +%Y-%m-%d) — [what Adam needs to do]\", \"is_complete\": false, \"is_urgent\": false, \"organization_id\": \"18613f82-fdd9-42dd-a09e-f3c577328258\", \"user_id\": \"b13aa8c6-c3a0-4312-9b35-c76073e7ccdc\"}"
```

Run one POST per action item. Replace the placeholder text with the actual action description. Set `is_urgent: true` only for time-sensitive items.

## COMPLETION SIGNAL
Write to `tasks/lead-gen/subagent-status.md`:
```
REPORTER SUBAGENT: COMPLETE — [DATETIME]
Session log: tasks/lead-gen/session-log.md
SESSION COMPLETE ✓
Adam action items added: [count or "none"]
```
