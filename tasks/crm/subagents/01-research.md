# ─────────────────────────────────────────────────────────────
# SUBAGENT 01: RESEARCH — CRM DOMAIN
# File: tasks/crm/subagents/01-research.md
# ─────────────────────────────────────────────────────────────

## ROLE: RESEARCH SUBAGENT — CRM
## READ ONLY. No execution. No file modification outside research output.

---

## DOMAIN
CRM (Salesforce/Jungo → LoanOS Supabase Migration)

## RESEARCH MISSION
Read `tasks/crm/today-mission.md` for today's focus.
Read `tasks/crm/notebooklm-pull-[TODAY].md` for what's already known — do not duplicate it.

---

## RESEARCH PROTOCOL

### 1. Industry Benchmarks
Study best-in-class mortgage CRM architecture and migration patterns:
- How top mortgage brokers structure contact data (borrowers, realtors, past clients)
- Jungo/Salesforce data models for mortgage — what fields matter, what's noise
- Best-in-class pipeline stage definitions for residential lending
- How leading LOs use automation to replace manual CRM tasks
- Supabase as a CRM backend — real-world patterns from engineering blogs

### 2. Competitor Analysis
- What Jungo/Velocify/BNTouch offer that LoanOS doesn't yet
- What features Adam uses in Jungo today vs. what he's never touched
- What automations are non-negotiable (birthday emails, milestone alerts, rate watch)

### 3. Platform / Technology Best Practices
- Supabase RLS patterns for multi-user CRM access (Adam + Janie with different scopes)
- n8n automation patterns for CRM triggers (new contact, status change, milestone)
- Salesforce export formats — which export method preserves the most relational data
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
Check available data on Adam's current CRM state:
- Review CONTEXT.md for current Supabase contacts/loans schema
- Check n8n workflow index in memory/tools/n8n.md for what automations already exist
- Check tasks/crm/session-log.md for any prior migration work completed
- Identify which Salesforce/Jungo fields are actively used vs. dead weight

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

## Current Gap Analysis (Jungo → LoanOS)
[What Jungo has that LoanOS doesn't yet — with priority rating for each gap]

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
