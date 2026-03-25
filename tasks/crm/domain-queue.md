# CRM Domain Queue
# LoanOS CRM Migration Program — Salesforce/Jungo → LoanOS Supabase
# Schedule: 6:00 AM daily
# Notebook: LoanOS CRM Intelligence

DOMAIN: CRM (Salesforce/Jungo → LoanOS Supabase)
NOTEBOOK: LoanOS CRM Intelligence
CURRENT STACK: LoanOS is primary. Salesforce/Jungo still active (contract through Oct 2026).
GOAL: Confirm LoanOS fully covers Adam's workflow, then cancel Salesforce/Jungo.

STATUS UPDATE (2026-03-25):
  - Contacts: already in LoanOS (2,377 records)
  - Loans: already in LoanOS (817+ historical + Arive webhook handling new)
  - n8n automations: mostly built and running
  - Data migration phases (Weeks 2-5): COMPLETE or N/A
  - Remaining: decommission audit — confirm nothing is missing, then cancel

---

ACTIVE: Decommission Audit — Confirm LoanOS Covers Everything, Cancel Salesforce

  The question is not "how do we migrate" — the data is already there.
  The question is "what would break or be missed if Salesforce went dark today?"

  Checklist:
  1. [ ] Automations audit — list every automation currently running in Salesforce/Jungo.
         For each: is the equivalent live in n8n? If not, what's missing?
  2. [ ] Workflow gaps — are there any manual processes Adam does IN Salesforce
         that have no equivalent in LoanOS yet? (e.g. logging a call, creating a task)
  3. [ ] Reporting — any reports Adam pulls from Salesforce that LoanOS doesn't have?
  4. [ ] Contacts completeness — any contacts/leads in Salesforce NOT in LoanOS?
         (Run: export Salesforce contacts, compare email list against LoanOS)
  5. [ ] Realtor database — realtors fully migrated with production volume data?
  6. [ ] UI gaps blocking daily use — pagination cap (1,877 contacts unreachable),
         "Closed Borrowers" smart list bug, etc.
  7. [ ] Adam signs off: "I don't need to log into Salesforce for anything"

  When all 7 items are checked → cancel Salesforce. Subscription runs Oct 2026 regardless.

---

QUEUE:
- Fix UI gaps blocking daily use (pagination, smart list bugs) — no dependency on Salesforce
- n8n automation gap fill (whatever's missing from item 1 above)
- Realtor enrichment (production volume, preferred areas) — Week 6 original plan

---

COMPLETED:
- Week 1 — Data Audit + Field Mapping (2026-03-13)
- Data Migration — Contacts + Loans already in LoanOS (confirmed 2026-03-25)
- n8n Core Automations — mostly live (confirmed 2026-03-25)
