# NotebookLM Pull Report — CRM — 2026-03-25 AM
Active Topic: Week 2 — Contact Migration — Dedup + Sample Run

## What We Already Know

The CRM migration from Salesforce/Jungo to LoanOS Supabase is in Week 2. Week 1 audit (2026-03-13) established the baseline state:
- **2,441 contacts** imported from Salesforce export (`report1773019847271.xls`)
- **817 historical loans** backfilled from Salesforce export (`report1773324509305.csv`)
- Multi-tenancy schema is hardened with `NOT NULL` on `organization_id` across 8 core tables (Migration 053)
- RLS policies are in place for org-scoped access
- Three-tier dedup strategy established: Salesforce ID → Email → First+Last Name
- Status normalization needed: "Closed Client" → "Closed" canonical status

## Salesforce/Jungo Field Map (known so far)

**Contacts — 30 of 32 columns mapped:**
- Skipped: "Mailing Country" and "Contact ID" (no matching schema)
- Mobile/Phone: Salesforce "Mobile" as fallback for empty "Phone" — created a schema split (`mobile_phone` vs `phone_mobile`)
- Contact Type: "Client" → `borrower`, "Business Contact" → `other`
- Stage: "Closed Client" → needs normalization to canonical "Closed"
- `salesforce_id` (Text, Unique) added for dedup tracking
- Date formats: MM/DD/YYYY → YYYY-MM-DD

**Loans — 31 CSV columns mapped:**
- Key field: "Loan # (1st TD)" → `arive_loan_id`
- Matching: Primary = `arive_loan_id`, fallback = `borrower_name` + `closing_date`
- 7-year retention window for historical records

**Still unmapped / unresolved:**
- Phone column schema split (`phone_mobile` vs `mobile_phone`) — needs merge
- Status value reconciliation: Arive raw values vs. Salesforce-imported stage variants ('Lead' vs 'New')

## Supabase Schema Decisions

- Multi-tenant: `organization_id` with NOT NULL on 8 tables (loans, contacts, documents, email_drafts, scenarios, todo_items, contact_activity, chat_sessions)
- `activity_log.organization_id` still nullable — waiting on n8n WF1/WF2 cloud push
- `contacts` table: UNIQUE constraint on email, CHECK constraint on `contact_type` (borrower|realtor|other)
- `sync_contact_stage_from_loan` trigger auto-updates contact stage on loan status change
- `salesforce_id` column added for migration tracking
- 200+ columns on `loans` table

## n8n Automation Status

**Live:**
- Arive New Loan → Supabase (WF1) — but needs cloud push
- Arive Status Update → Supabase (WF2) — but needs cloud push
- Milestone Communication Agent
- Referral Intro Email
- Pre-Approval Email

**Built but awaiting activation:**
- Closed Loan Review Request (needs SMTP + review URL)
- Weekly Testimonial Social Post (needs Gemini API key + Sheets OAuth)
- Inbound Email → Supabase (needs Outlook credentials)
- Contract Received (Phase 2)

**Planned for CRM migration (Weeks 4-5):**
- Birthday/anniversary emails
- Loan milestone alerts
- Referral acknowledgment
- Pre-approval expiration reminders
- Rate watch triggers
- Post-close check-ins
- Lead nurture sequence
- Realtor monthly value reports

## Open Questions

1. **Phone schema split** — When will `mobile_phone` be merged into `phone_mobile`? Should this happen before or during the sample run?
2. **Status normalization** — Complete mapping of Arive raw values to canonical stages not yet documented
3. **activity_log hardening** — Blocked until WF1/WF2 cloud push confirmed
4. **CSV Import** — UI exists but zero processing logic behind it. Is this needed for the sample run?
5. **500-record pagination cap** — ~2,000 contacts unreachable in UI. Priority for Week 2?
6. **"Closed Borrowers" smart list** — Queries "Closed Client" instead of "Closed". Fix before sample run?

## Briefing for Research Subagent

**DO NOT re-research:**
- Basic Salesforce field structure (30/32 columns already mapped)
- Three-tier dedup logic (established)
- Multi-tenancy architecture (hardened)
- n8n workflow inventory (audited 2026-03-12)

**Focus new research here instead:**
- Best practices for batch contact dedup in Supabase (fuzzy matching, phone normalization)
- Sample migration validation checklist — what to verify in a 100-record test run
- Phone number normalization strategies for US mortgage contacts (formats: (512) 555-1234, 512-555-1234, +15125551234)
