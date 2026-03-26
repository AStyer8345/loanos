# ─────────────────────────────────────────────────────────────
# SUBAGENT 06: REPORTER — SEO + SEM
# File: tasks/seo-sem/subagents/06-reporter.md
# Write the session memory. Only runs after QA passes.
# Write as if the next session has zero memory of today.
# ─────────────────────────────────────────────────────────────

## ROLE: REPORTER SUBAGENT — SEO + SEM
## Write the session memory. Only runs after QA passes.
## Write as if the next session has zero memory of today.

---

## DOMAIN
SEO + SEM — styermortgage.com

## PRE-CONDITION
Check `tasks/seo-sem/subagent-status.md`.
If QA FAILED → write "REPORTER BLOCKED: QA failed" and stop.
If QA PASS or QA not applicable (Research-only session) → proceed.

---

## REPORT PROTOCOL

Read all session output files:
- `tasks/seo-sem/today-mission.md`
- `tasks/seo-sem/research/[today's research file if exists]`
- `tasks/seo-sem/specs/[today's spec file if exists]`
- `tasks/seo-sem/build-reports/[today's build report if exists]`
- `tasks/seo-sem/reviews/[today's review file if exists]`
- `tasks/seo-sem/qa-reports/[today's QA report if exists]`

Synthesize — don't copy-paste.

Append to `tasks/seo-sem/session-log.md`:

```markdown
---
## Session: [DATE] [AM/PM] — SEO + SEM
Focus: [TOPIC]
Type: [Research / Strategy / Execute / Full Cycle]

### Completed
- [specific item — e.g. "Technical audit complete — 14 issues documented with priority scores"]
- [specific item — e.g. "Meta title and description rewritten on homepage and FHA page"]

### Deferred
- [item]: [reason] → [when to pick up]

### Output Produced
[Links, files, pages optimized, keywords targeted this session]

### SEO Metrics (if available)
- Pages optimized: [count]
- Keywords targeted: [list]
- Technical issues resolved: [count]
- PageSpeed score changes: [before → after if measured]
- New pages created: [count]

### Quality Ratings (1-5)
Research: [N] | Strategy: [N] | Execution: [N] | Review: [N] | QA: [N]

### System Improvement Notes
[What prompt change would make the next session better — specific and actionable]

### BLOCKERS
[Active blockers or "None"]

### Next Session Instructions
Priority 1: [specific — e.g. "Continue Week 2 keyword research — complete competitor backlink analysis"]
Priority 2: [specific]
Priority 3: [specific]

Advance queue to next week's topic: [YES/NO — reason]
---
```

---

## SELF-IMPROVEMENT
After writing the log, evaluate the session:
- Was the session scope too broad or too narrow for the time available?
- Did any subagent produce output that was unclear or required interpretation?
- Was the spec clear enough for Builder to execute without ambiguity?
- Were there compliance items that should be added to the review checklist?

Append proposed improvements to `tasks/seo-sem/prompt-improvements.md`:

```markdown
---
## Prompt Improvement — [DATE]
Proposed by: Reporter Subagent
Session type: [Research / Strategy / Execute / Full Cycle]

### Issue Observed
[What went wrong or was suboptimal this session]

### Proposed Fix
[Specific change to which subagent file and what to change]

### Priority
[HIGH / MEDIUM / LOW]
---
```

---

## ADAM ACTION ITEMS

After writing the session log, check: does Adam need to do anything manually because of this session?

Only append to `tasks/ADAM-TODO.md` if there is a genuine action Adam must take.
Skip if nothing requires his manual intervention.

Examples of things that DO belong here:
- A page needs to be deployed to Netlify (agent wrote the HTML but can't deploy)
- Google Search Console access needed — agent can't add the site
- A blog post needs Adam's review/approval before publishing
- A Google Ads account needs to be set up (requires Adam's billing info)
- A backlink outreach email needs Adam to send it from his actual email

Examples of things that do NOT belong here:
- Session summaries or FYI notes
- Things the agent already handled
- Next session priorities (those go in session-log.md)

For each genuine action item, do BOTH steps:

**Step 1 — Append to `tasks/ADAM-TODO.md`:**
```markdown
- [ ] [SEO] YYYY-MM-DD — [what Adam needs to do] — [why it can't be done automatically]
```

**Step 2 — POST to LoanOS dashboard (Supabase):**
```bash
curl -X POST "https://uuqedsvjlkeszrbwzizl.supabase.co/rest/v1/todo_items" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1cWVkc3ZqbGtlc3pyYnd6aXpsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjk4NzAyNiwiZXhwIjoyMDg4NTYzMDI2fQ.8ybNi6Qay3WgwTlUHorSjh66C4vQMJURCiSVzVD4HmQ" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1cWVkc3ZqbGtlc3pyYnd6aXpsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjk4NzAyNiwiZXhwIjoyMDg4NTYzMDI2fQ.8ybNi6Qay3WgwTlUHorSjh66C4vQMJURCiSVzVD4HmQ" \
  -H "Content-Type: application/json" \
  -d "{\"text\": \"[SEO] $(date +%Y-%m-%d) — [what Adam needs to do]\", \"is_complete\": false, \"is_urgent\": false, \"organization_id\": \"18613f82-fdd9-42dd-a09e-f3c577328258\", \"user_id\": \"b13aa8c6-c3a0-4312-9b35-c76073e7ccdc\"}"
```

Run one POST per action item. Replace the placeholder text with the actual action description. Set `is_urgent: true` only for time-sensitive items.

## COMPLETION SIGNAL
```
REPORTER SUBAGENT: COMPLETE — [DATETIME]
SESSION COMPLETE ✓
Adam action items added: [count or "none"]
```
