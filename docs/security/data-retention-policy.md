# Data Retention Policy
**Adam Styer | Mortgage Solutions LP** — NMLS #513013
**Effective Date:** 2026-03-18

## Retention Schedule

| Record Type | Minimum Retention | Authority |
|------------|------------------|-----------|
| Closed loan files | 3 years from closing date | RESPA / 12 CFR §1024 |
| Pre-approval records | 3 years from application date | ECOA / Reg B |
| Uploaded documents | Same as associated loan | RESPA |
| Activity log | 3 years | FTC Safeguards |
| Security audit log | 3 years | FTC Safeguards |
| Chat / AI sessions | 1 year | Internal policy |
| Marketing activity log | 1 year | Internal policy |

## Annual Archival Process

Run every January:

1. Run `scripts/retention-audit.sql` in Supabase SQL Editor
2. Review each result set — export to CSV if needed
3. For closed loans past 3 years: verify no open disputes or litigation holds before deleting
4. Delete eligible records:
   - Loans: `DELETE FROM loans WHERE id IN (...)`
   - Contacts: `DELETE FROM contacts WHERE id IN (...)`
   - Documents: Delete from Supabase Storage `documents` bucket
   - Chat sessions: `DELETE FROM chat_sessions WHERE id IN (...)`
   - Audit log (3+ years): `DELETE FROM security_audit_log WHERE id IN (...)`
5. Log the deletion event in `security_audit_log` (event_type: `bulk_delete`, resource: `retention_purge`)

## Deletion Requests

Borrowers may request deletion of their personal data. Process:

1. Verify identity via email (match to contact record)
2. Confirm no legal hold applies (active dispute, pending audit, or loan within retention window)
3. If approved, delete from:
   - `loans` (all records for this contact)
   - `contacts` (the contact record)
   - Supabase Storage `documents` bucket (all files for this contact's loans)
   - `activity_log` (rows referencing this contact/loan)
   - `chat_sessions` (rows referencing this contact/loan)
   - `email_drafts` (rows referencing this contact/loan)
4. Respond to the borrower within 30 days confirming deletion

## Notes

- Automated purge workflows are not yet implemented — all deletions are manual for now (Phase 4 will add automation)
- Never delete records that are within their minimum retention window, even on borrower request — RESPA compliance takes precedence
