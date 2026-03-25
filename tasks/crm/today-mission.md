## Mission Brief — 2026-03-25 AM (SUPERSEDED — see PM below)

### Domain
CRM (Salesforce/Jungo → LoanOS Migration)

### Focus Area
Week 2 — Contact Migration — Dedup Logic + Field Mapping Finalization

### Session Type
[x] Strategy / Architecture (Sequence B)

**Status: COMPLETE. Spec written but DEPRECATED — Adam confirmed contacts/loans already migrated. Do not execute the dedup spec.**

---

## Mission Brief — 2026-03-25 PM

### Domain
CRM (Salesforce/Jungo → LoanOS Migration)

### Focus Area
Decommission Audit — Confirm LoanOS Covers Everything, Cancel Salesforce

### Session Type
[x] Research + Planning (Sequence A)

### Context Change (Post-AM Session)
Adam confirmed in a post-AM-session conversation that:
- Contacts are already in LoanOS (2,377 records)
- Loans are already in LoanOS (817+ historical + Arive webhook for new)
- n8n automations are mostly built
- Data migration phases (dedup/sample run spec from AM session) are NO LONGER NEEDED
- Goal revised: decommission audit → cancel Salesforce when ready

The CSV migration spec (tasks/crm/specs/2026-03-25-contact-dedup-spec.md) is written but DO NOT EXECUTE.

### Objectives
1. Produce a complete Salesforce/Jungo automation inventory vs. n8n equivalent gap analysis
2. Identify UI gaps currently blocking daily LoanOS use
3. Document reporting gaps (anything Adam currently pulls from Salesforce not available in LoanOS)
4. Define the sign-off checklist: what must be true for Adam to say "I don't need Salesforce anymore"

### Definition of Done
- Research file written: tasks/crm/research/2026-03-25-decommission-audit-research.md
- Gap analysis table complete (Salesforce automation → n8n status)
- UI gaps documented with severity
- Next session has clear action list

### Resources / Files in Scope
- tasks/crm/domain-queue.md
- 2026-03-12_LoanOS-Automation-Audit.md
- MEMORY.md (n8n workflow IDs + status)
- tasks/crm/notebooklm-pull-2026-03-25.md
- CONTEXT.md (multi-tenancy status, outstanding items)

### HIGH RISK Items
NONE — this is a read-only audit session. No data migration, no Supabase writes, no n8n changes.

---

## Mission Brief — 2026-03-25 PM Late (Session 2)

### Domain
LoanOS CRM

### Focus Area
Contact Data Architecture Review — what information actually matters for a mortgage LO contact record?

### Session Type
[x] Research + Planning (Sequence A)

### Objectives
1. Audit the LoanOS contacts table schema against what top-performing LOs actually track
2. Identify fields that are empty/unused vs. fields that are missing but would add value
3. Recommend smart list definitions that Adam should have as daily working views
4. Identify UI organization improvements (what should be above the fold on a contact record?)

### Definition of Done
- Research file written at tasks/crm/research/2026-03-25-contact-data-architecture.md
- Field inventory completed (used vs. unused vs. missing)
- Smart list recommendations written with query logic
- Open questions for Adam documented

### Resources / Files in Scope
- Supabase: contacts table (live schema query)
- LoanOS contacts UI (src/app/contacts/)
- n8n workflow index (CLAUDE.md)
- domain-queue.md (scope definition)

### HIGH RISK Items
- None — research only, no schema changes or execution in this session
