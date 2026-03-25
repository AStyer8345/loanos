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
Priority 1: Run decommission audit — list all Salesforce/Jungo automations still active; confirm n8n equivalent exists for each
Priority 2: Fix UI gaps blocking daily LoanOS use: pagination cap (500-record hard limit), "Closed Borrowers" smart list bug
Priority 3: Adam walks through LoanOS for one week noting anything missing → final sign-off checklist

### Context Update (2026-03-25, post-session conversation)
Adam confirmed: contacts + loans already in LoanOS. n8n automations mostly built. Data migration phases are complete.
CSV migration script spec (tasks/crm/specs/2026-03-25-contact-dedup-spec.md) is no longer needed — do not execute.
Goal revised: decommission audit → cancel Salesforce. Salesforce contract runs through Oct 2026 regardless.
domain-queue.md updated to reflect this.

### Data Integrity Status
- Phone: 718 contacts (30%) have no phone at all — normal for legacy mortgage CRM data; not a migration blocker
- email: 2 contacts missing email — need name+phone fallback during sample run
- salesforce_id: 2,333 contacts (98%) missing — must be backfilled during migration via upsert; critical for dedup tracking in Week 3 full run
- stage: 13 contacts with null stage — will default to 'Lead' on next upsert pass
---

---
## Session: 2026-03-25 PM — CRM Migration
Focus: Decommission Audit — Confirm LoanOS Covers Everything, Cancel Salesforce
Type: Research (Sequence A)

### Completed
- **Decommission audit research written** — `tasks/crm/research/2026-03-25-decommission-audit-research.md` — all 7 checklist items covered
- **Automation gap analysis** — Full inventory: 5 live, 7 need action, 6 not yet built, 1 blocked (Azure)
- **UI gaps documented** — Pagination cap (1,877 contacts unreachable), "Closed Borrowers" smart list bug (0 results), ZAPIER_DISPATCH_WEBHOOK_URL missing (milestone emails silent)
- **Contacts completeness gap** — LoanOS has 2,377; referenced import count was 2,441 → 64-contact delta needs fresh SF export to verify
- **NotebookLM PUSH+CURATE complete** — 2 error-status SQL sources removed, decommission audit research added, session note created
- **Daily digest SENT** — Zapier webhook success (`019d26da-43e5-47e0-f387-7934ade5d516`) to adam@thestyerteam.com

### Deferred
- Execution work (UI fixes, automation testing) — deferred to next session (Builder sequence)
- Birthday/anniversary automation build — deferred; not a blocker for decommissioning
- Realtor ranking dashboard — deferred post-decommission

### Migration Progress
| Asset | Count |
|-------|-------|
| Contacts in LoanOS | 2,377 |
| Loans in LoanOS | 817+ |
| n8n workflows live | 5 |
| n8n workflows needing action | 7 |
| n8n workflows not built | 6 |
| UI gaps blocking daily use | 3 (HIGH severity) |

### Queue Position
Current: Decommission Audit
Advance to next topic: NO — audit complete but execution items remain

### Quality Ratings (1-5)
Research: 5 | Strategy: N/A | Execution: N/A | Review: N/A | QA: N/A

### BLOCKERS
**ADAM ACTION REQUIRED:**
1. Push WF1 to n8n cloud (workflow `1tagvoU0UXtdDiMY`) — null org_id rows accumulate until pushed
2. Push WF2 to n8n cloud (workflow `9JyzzwKac8v3uQ7d`) — same
3. Set `ZAPIER_DISPATCH_WEBHOOK_URL` in Vercel env vars — milestone emails go silent without this
4. Provide SMTP review page URL for Review Request Email workflow
5. Run fresh Salesforce contact export to verify 64-contact gap

### Next Session Instructions
Priority 1 (Builder): Fix "Closed Borrowers" smart list — 1-line code change in contacts query
Priority 2 (Builder): Fix contacts pagination cap — remove 500-record hard limit in contacts API + UI
Priority 3 (Builder + Adam): Test CD email, New App email, Refi Intake email end-to-end
Priority 4 (Research): Run Salesforce export diff — quantify 64-contact gap before decommission
---

---
## Session: 2026-03-25 PM Late — LoanOS CRM
Focus: Contact Data Architecture Review — what actually matters on a contact record
Type: Research (Sequence A)

### Completed
- **Full schema audit** — queried live contacts table (49 columns, 2,377 records); documented % populated for every field; identified dead columns (title: 0%, co_borrower_email: 0%, realtor_email: <0.1%) vs. well-used fields (email: 99.9%, first/last name: 100%, birthdate: 69%)
- **Phone field fragmentation documented** — 3 phone fields (phone, phone_mobile, home_phone) in broken state; `phone_mobile` has only 9 records; `home_phone` is a Salesforce import artifact (199 records); `phone` is the de-facto primary phone — architectural consolidation needed before any SMS automation
- **Critical compliance gap identified** — 321 contacts (13.5%) have `email_opt_out = true`; this flag is NOT currently enforced in the n8n automations UI — high priority before any marketing campaign runs
- **TCPA gap identified** — no `do_not_call` field in schema; legally required before any SMS/Twilio automation is built
- **Missing high-value fields documented** — `current_rate`, `current_loan_balance` (for refi scoring), `production_tier` (for realtor ranking), `preferred_contact_method`, `tags` (text array for free-form segmentation)
- **8 smart list recommendations written** — including Birthdays This Month, Past Clients Refi Watch, Realtors Not Touched 30+ Days, Pre-Approval Expiring Soon (highest ROI lists currently missing)
- **UI organization recommendations written** — "days since last touch" as computed column, realtor-specific detail view, rate/loan-type on linked loans visible from contact record
- **Research file:** `tasks/crm/research/2026-03-25-contact-data-architecture.md`
- **8 open questions for Adam** documented

### Deferred
- Schema changes (phone consolidation, do_not_call addition) — blocked on Adam's decisions re: questions 1, 5
- Smart list implementation — deferred to Builder session
- `last_touch_at` backfill — needs Adam decision on strategy (question 7)
- Realtor-specific UI view (borrower vs. realtor different layouts) — deferred; scoped as future enhancement

### CRM Progress
| Asset | Before | After | Delta |
|-------|--------|-------|-------|
| Contacts in LoanOS | 2,377 | 2,377 | 0 (research only) |
| Loans in LoanOS | 817+ | 817+ | 0 |
| n8n workflows live | 5 | 5 | 0 |
| Documented schema gaps | 0 | 12 (fields to hide/remove) | +12 |
| Missing high-value fields identified | 0 | 10 | +10 |
| Smart list recommendations | 0 | 8 | +8 |

### Queue Position
Current: Contact Data Architecture Review (active)
Advance to next topic: NO — research complete, but 8 open questions need Adam's input before spec can be written

### Quality Ratings (1-5)
Research: 5 | Strategy: N/A | Execution: N/A | Review: N/A | QA: N/A

### System Improvement Notes
- Research subagent should automatically check `email_opt_out` population — this is a compliance signal that should always appear in any audit regardless of session topic
- Contact type breakdown (borrower/realtor/other with stage counts) should be pulled in every research session — 5-line query, provides the segmentation picture all subsequent work depends on
- Pull report query for "what are the highest-priority open items" was stale (reflected old dedup migration topic) — the Research subagent should always query the live DB first and treat NoteookLM as secondary context

### BLOCKERS
**ADAM DECISIONS REQUIRED (8 questions from research):**
1. Phone field consolidation strategy — rename `phone` to `mobile`? Or add separate `office_phone`?
2. Realtor stage semantics — separate stage system (Prospecting/Active/Inactive) or simple boolean?
3. `closing_date` on contact vs. loan — deprecate contact-level field?
4. Past-client refi trigger — should closed rate/balance be pulled from Arive sync automatically?
5. `do_not_call` field — add now (proactive) or wait until SMS automation is being built?
6. Realtor production tiers — replace `top_realtor`/`target_realtor` booleans with a single `production_tier`?
7. `last_touch_at` backfill — backfill from activity history or leave null until real interaction?
8. `realtor_email`/`realtor_phone` cleanup — remove these 2 records + hide fields from UI?

### Next Session Instructions
Priority 1 (Adam): Answer the 8 open questions above — these gate the architecture spec
Priority 2 (Builder): Fix "Closed Borrowers" smart list (`stage = 'Closed'` not `'Closed Client'`)
Priority 3 (Builder): Fix contacts pagination cap (500-record hard limit → remove or raise to 5,000)
Priority 4 (Builder): Add `email_opt_out` enforcement to n8n milestone email workflows
Priority 5 (Architect): Once Adam answers open questions, write contact schema improvement spec

### Data Integrity Status
- email_opt_out: 321 contacts (13.5%) opted out — enforcement gap in n8n automations is HIGH priority
- phone: 613 contacts (25.8%) have no phone field of any kind — acceptable for legacy data
- last_touch_at: only 648 contacts (27%) populated — "Realtors Not Touched 30+ Days" smart list will be mostly noise until backfilled
- co_borrower fields: data entry gap on forms — 260 co-borrower first names exist but 0 co-borrower emails
---
