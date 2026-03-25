# Agent Session Log — crm
# Append-only. Never delete entries.

---
## Session Log Entry
Date: 2026-03-25
Time: INIT
Focus: System Initialization

### Completed
- Agent system initialized for domain: crm

### Next Session Instructions
Priority 1: Run PULL mode — seed NotebookLM with foundational context
Priority 2: Begin Week 1 research (see domain-queue.md)
Priority 3: Do NOT execute anything until research + strategy spec complete

Advance queue: NO
---

---
## Session: 2026-03-25 AM — CRM Migration
Focus: Week 2 — Contact Migration — Dedup Logic + Field Mapping Finalization
Type: Strategy (Sequence B — Research + Architect)

### Completed
- **NotebookLM PULL** — 6/6 queries successful; pull report at `tasks/crm/notebooklm-pull-2026-03-25.md`
- **Live schema audit** — queried live Supabase contacts table; confirmed phone column split resolved (`mobile_phone` dropped, `phone` canonical with 1,659 records, `phone_mobile` has 9)
- **Critical finding: salesforce_id gap** — only 44 of 2,377 contacts have `salesforce_id` set; bulk import did not populate this field; three-tier dedup effectively collapses to Email → Name for 98% of records
- **Stage data confirmed clean** — no "Closed Client" values in live DB; "Closed Borrowers" smart list bug is a UI query bug, not a data problem
- **Research file written** — `tasks/crm/research/2026-03-25-dedup-field-mapping.md` — covers dedup strategy, phone normalization, sample validation checklist, full field mapping table
- **Architecture spec written** — `tasks/crm/specs/2026-03-25-contact-dedup-spec.md` — complete enough for Builder to execute without questions; includes script architecture, all normalization functions, upsert logic, rollback plan, post-run SQL validation

### Deferred
- **Sample run execution** — Blocked pending Adam confirming Salesforce CSV file location. Builder can write the script from the spec immediately, but cannot run it without the source file.
- **Pagination fix** (500-record hard cap) — deferred to separate ticket; 1,877 contacts are unreachable in the UI but data is intact in Supabase
- **"Closed Borrowers" UI fix** — spec written; can be executed by Builder immediately (no dependencies)

### Migration Progress
| Asset | Before | After | Delta |
|-------|--------|-------|-------|
| Contacts in LoanOS | 2,377 | 2,377 | 0 (no run yet) |
| Active loans in LoanOS | 817 | 817 | 0 |
| n8n workflows rebuilt | 5 live | 5 live | 0 |
| Salesforce automations remaining | unknown | unknown | 0 |

### Queue Position
Current week: Week 2 of 8 — Contact Migration — Dedup + Sample Run
Advance to next topic: NO — sample run not yet executed (pending CSV location)

### Quality Ratings (1-5)
Research: 5 | Strategy: 5 | Execution: N/A | Review: N/A | QA: N/A

### System Improvement Notes
- The NotebookLM pull report stated "2,441 contacts" but live DB has 2,377. Pull context should note it may reflect stale counts — always query live DB first thing in session.
- The phone column split question (pull report listed as open) was already resolved in the DB via migration 014. Future pull reports should query live schema rather than rely only on NoteookLM memory.
- Architect spec should always include Adam's org UUID and user_id as constants — eliminates a Supabase query step for Builder.

### BLOCKERS
**SOFT BLOCKER:** Sample run cannot execute until Adam confirms location of Salesforce CSV export (`report1773019847271.xls` or fresh export). Adam must also confirm full "Type" column value list from Salesforce for contact_type mapping.

### Next Session Instructions
Priority 1: Adam confirms Salesforce CSV location → Builder executes "Closed Borrowers" UI fix + writes `scripts/crm/migrate-contacts.js` → runs dry-run on 100 records
Priority 2: Adam reviews dry-run output → approves sample insert → Builder runs sample + validates
Priority 3: If sample passes, update domain-queue.md to advance Week 2 → Week 3 (Full Migration)

### Data Integrity Status
- Phone: 718 contacts (30%) have no phone at all — normal for legacy mortgage CRM data; not a migration blocker
- email: 2 contacts missing email — need name+phone fallback during sample run
- salesforce_id: 2,333 contacts (98%) missing — must be backfilled during migration via upsert; critical for dedup tracking in Week 3 full run
- stage: 13 contacts with null stage — will default to 'Lead' on next upsert pass
---
