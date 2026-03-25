## Mission Brief — 2026-03-25 AM

### Domain
CRM (Salesforce/Jungo → LoanOS Migration)

### Focus Area
Week 2 — Contact Migration — Dedup Logic + Field Mapping Finalization

### Session Type
[x] Strategy / Architecture (Sequence B)
[ ] Research + Planning (Sequence A)
[ ] Execute / Build (Sequence C)
[ ] Full Cycle (Sequence D)

**Sequence:** PULL (done) → Research → Architect → Reporter → PUSH

### Context from Prior Sessions
- Week 1 audit complete (2026-03-13): 2,441 contacts + 817 historical loans imported
- 30 of 32 Salesforce contact columns mapped; 2 still unmapped (Mailing Country, Contact ID)
- Three-tier dedup strategy established: Salesforce ID → Email → First+Last Name
- `salesforce_id` column added to contacts table for dedup tracking
- Phone schema has unresolved split: `phone_mobile` vs `mobile_phone`
- Status normalization needed: "Closed Client" → "Closed"
- Multi-tenancy hardened (NOT NULL on 8 tables, migration 053)

### Objectives
1. Research and document best practices for batch contact dedup in Supabase (fuzzy matching, phone normalization for US mortgage contacts)
2. Research sample migration validation checklist — what to verify in a 100-record test run
3. Write finalized dedup logic spec and field mapping spec ready for Builder to execute
4. Resolve the `phone_mobile` / `mobile_phone` schema split question definitively

### Definition of Done
- Research file written: tasks/crm/research/2026-03-25-dedup-field-mapping.md
- Architecture spec written: tasks/crm/specs/2026-03-25-contact-dedup-spec.md
- Spec is complete enough that Builder can execute a 100-record sample run without asking questions
- Session log updated
- NotebookLM PUSH complete

### Resources / Files in Scope
- tasks/crm/notebooklm-pull-2026-03-25.md (prior context)
- _audit/2026-03-13_loanos-crm-audit/LoanOS_CRM_Audit_2026-03-13.md (Week 1 baseline)
- supabase/migrations/ (contacts table schema — current state)
- tasks/crm/domain-queue.md (week plan)
- CONTEXT.md (Supabase schema + RLS state)

### HIGH RISK Items
- Any schema migration to contacts table could affect 2,441 existing records — must use ALTER TABLE with caution
- Phone column rename/merge must be additive (add new, backfill, drop old — not rename in place)
- UNIQUE constraint on email already exists — dedup logic must handle duplicate email conflicts before insert
- Do NOT touch active loan records this session
- Do NOT execute any migration script this session — spec only
