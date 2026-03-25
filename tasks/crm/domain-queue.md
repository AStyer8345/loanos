# CRM Domain Queue
# LoanOS CRM Migration Program — Salesforce/Jungo → LoanOS Supabase
# Schedule: 6:00 AM daily
# Notebook: LoanOS CRM Intelligence

DOMAIN: CRM (Salesforce/Jungo → LoanOS Supabase)
NOTEBOOK: LoanOS CRM Intelligence
CURRENT STACK: Salesforce + Jungo (legacy) → migrating to LoanOS Supabase + n8n
GOAL: LoanOS CRM fully replaces Jungo by Week 8. Zero data in Salesforce needed. Cancel subscriptions.

---

ACTIVE: Week 2 — Contact Migration — Dedup + Sample Run
  NOTE: Week 1 audit is already complete.
  See: _audit/2026-03-13_loanos-crm-audit/LoanOS_CRM_Audit_2026-03-13.md (CRM state baseline)
  See: 2026-03-12_LoanOS-Automation-Audit.md (automation inventory)
  Start here: finalize dedup logic and field mapping spec, then run 100-record sample migration.

QUEUE:
- Week 3: Full Contact Migration + Pipeline Migration
    Dedup logic finalized. Field mapping spec approved. Data cleaning rules defined.
    Run migration script on 100-record sample. Validate in LoanOS Supabase.
    Identify and resolve any field mapping issues before full run.

- Week 3: Full Contact Migration + Pipeline Migration
    Full contact migration (all records, batched). Active loan records migrated.
    Historical closed loan records migrated (7-year retention window).
    Realtor contact migration with production volume data.
    All migrated records verified by Reviewer + QA.

- Week 4: Automation Rebuild in n8n (Phase 1 — Core)
    Rebuild highest-priority automations first:
    - Birthday/anniversary emails
    - Loan milestone alerts (application received, approved, CTC, funded)
    - Referral acknowledgment to realtors
    - Pre-approval expiration reminders (90 days)
    Each workflow: inactive until Adam approves activation.

- Week 5: Automation Rebuild in n8n (Phase 2 — Nurture)
    - Past client rate watch triggers (rate drop alerts)
    - 6-month / 1-year / 2-year post-close check-ins
    - Pre-application lead nurture sequence (Mailchimp → n8n hand-off)
    - Realtor monthly value report automation

- Week 6: Realtor Relationship System
    Realtor contact enrichment (production volume, active listings, preferred areas).
    Monthly realtor value report automation in n8n.
    Referral tracking dashboard in LoanOS.
    Co-branded resource delivery system (PA letters, rate sheets).

- Week 7: Reporting + Pipeline Dashboard
    Pipeline dashboard: applications / conditional approval / CTC / funded counts.
    Revenue forecast: locked pipeline × avg commission.
    Lead source ROI report by source (realtor referral, web, Zillow, etc.).
    Realtor production tracking: loans per realtor partner YTD.
    Janie-facing view: active files only, scoped by RLS.

- Week 8: Salesforce Decommission
    Confirm 100% of active contacts migrated and verified in LoanOS.
    Confirm all automations live and tested in n8n — zero running in Salesforce.
    Confirm 7-year retention records preserved with correct timestamps.
    Run final data reconciliation: Salesforce export count vs. LoanOS count.
    Cancel Salesforce subscription. Cancel Jungo subscription.
    LoanOS is now the single source of truth.

---

COMPLIANCE REQUIREMENTS:
- GLBA: customer financial data encrypted at rest (Supabase handles — verify config)
- Data retention: loan records minimum 7 years
- Access controls: Janie access scoped to active files only via RLS
- Audit log: all data modifications logged with timestamp + user_id (activity_log table)
- No financial data exported to unauthorized third-party systems during migration

---

COMPLETED:
- Week 1 — Data Audit + Field Mapping (completed 2026-03-13)
    Source: _audit/2026-03-13_loanos-crm-audit/LoanOS_CRM_Audit_2026-03-13.md
    Source: 2026-03-12_LoanOS-Automation-Audit.md
