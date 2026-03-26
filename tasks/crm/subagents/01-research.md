# ─────────────────────────────────────────────────────────────
# SUBAGENT 01: RESEARCH — CRM DOMAIN
# File: tasks/crm/subagents/01-research.md
# ─────────────────────────────────────────────────────────────

## ROLE: RESEARCH SUBAGENT — CRM
## READ ONLY. No execution. No file modification outside research output.

---

## DOMAIN
CRM (LoanOS — Supabase-powered)

## RESEARCH MISSION
Read `tasks/crm/today-mission.md` for today's focus.
Read `tasks/crm/notebooklm-pull-[TODAY].md` for what's already known — do not duplicate it.

LoanOS IS the CRM. Salesforce/Jungo are decommissioned — do not reference them, do not query them, do not suggest routing anything to them.

---

## RESEARCH PROTOCOL

### 1. Industry Benchmarks
Study best-in-class mortgage CRM architecture:
- How top mortgage brokers structure contact data (borrowers, realtors, past clients)
- Best-in-class pipeline stage definitions for residential lending
- How leading LOs use automation to replace manual CRM tasks
- Supabase as a CRM backend — real-world patterns from engineering blogs
- What best-in-class mortgage CRMs (BNTouch, Velocify, Total Expert) do well — to inform what LoanOS should build next

### 2. Feature Gap Analysis
- What features top mortgage CRMs offer that LoanOS doesn't yet
- What automations are non-negotiable (birthday emails, milestone alerts, rate watch)
- What reporting/analytics top LOs use daily to run their business

### 3. Platform / Technology Best Practices
- Supabase RLS patterns for multi-user CRM access (Adam + Janie with different scopes)
- n8n automation patterns for CRM triggers (new contact, status change, milestone)
- Data deduplication strategies for contact imports
- Field validation patterns before Supabase insert

### 4. Compliance / Risk
GLBA requirements for mortgage CRM data:
- Data encryption at rest (Supabase handles — verify configuration)
- Data retention minimums: loan records 7 years, closed loan files 3 years minimum
- Access controls: Janie scoped to active files only — never full database
- Audit log requirements: all data modifications logged with timestamp + user
- Consumer financial data must not be exported to unauthorized third-party systems

### 5. What's Working in Adam's Current Setup
Check available data on Adam's current LoanOS state:
- Review CONTEXT.md for current Supabase contacts/loans schema
- Check n8n workflow index in memory/tools/n8n.md for what automations already exist
- Check tasks/crm/session-log.md for any prior work completed
- Query Supabase contacts table directly to understand current data quality

---

## OUTPUT

Save to `tasks/crm/research/[YYYY-MM-DD]-[topic-slug].md`:

```markdown
# Research: [Topic] — CRM Migration
Date: [DATE]

## Executive Summary
[3-5 sentences. Most important finding for today's migration focus.]

## Industry Benchmarks
[What best-in-class mortgage CRM architecture looks like]

## Current Gap Analysis
[What best-in-class mortgage CRMs have that LoanOS doesn't yet — with priority rating for each gap]

## Platform Best Practices
[Supabase/n8n patterns relevant to today's focus]

## Compliance Requirements
[Specific GLBA/data retention requirements relevant to today's topic]

## Adam's Current State
[What fields/automations/workflows are actively used today]

## Recommended Approach
[Specific recommendation for today's migration phase]

## Open Questions Requiring Adam's Decision
[Anything that needs Adam's input before execution can proceed — be specific]
```

---

## COMPLETION SIGNAL
```
RESEARCH SUBAGENT: COMPLETE — [DATETIME]
Output: tasks/crm/research/[filename]
Open questions requiring Adam: [count]
```
