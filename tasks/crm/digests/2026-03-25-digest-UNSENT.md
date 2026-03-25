# LoanOS CRM Migration Digest — 2026-03-25
**To:** adam@thestyerteam.com
**Status:** UNSENT — ZAPIER_DISPATCH_WEBHOOK_URL not set in environment
**Session:** AM — Strategy (Sequence B)

---

## What Was Accomplished Today

**Infrastructure Confirmation**
- Queried live Supabase contacts schema — confirmed phone column split resolved (migration 014 applied, `mobile_phone` dropped)
- Confirmed `contacts_email_unique` UNIQUE constraint exists — enables clean upsert dedup
- Confirmed `contacts_salesforce_id_key` UNIQUE constraint exists
- Stage data confirmed clean — no "Closed Client" values in DB (only canonical "Closed")

**Critical Discovery: salesforce_id Gap**
Only 44 of 2,377 contacts have `salesforce_id` populated. The bulk Week 1 import didn't carry this field. The three-tier dedup strategy (Salesforce ID → Email → Name) collapses to Email → Name for 98% of records. Email is the clean dedup key — 2,375 contacts have email, all unique.

**Research Completed**
- Full field mapping (25 Salesforce columns → contacts table columns) documented
- Phone normalization strategy: strip to 10-digit string, store as TEXT
- Sample migration validation checklist written (data integrity + field-level + compliance + edge cases)
- Stage normalization map documented

**Architecture Spec Written**
`tasks/crm/specs/2026-03-25-contact-dedup-spec.md` — complete spec including:
- Node.js migration script architecture
- All normalization functions (phone, email, name, date, boolean, contact_type, stage)
- Row transformation logic (Salesforce column → contacts column mapping)
- Upsert logic (`onConflict: email` for 98% of records; name+phone query fallback for 2 no-email contacts)
- Post-run validation SQL (5 queries)
- Rollback plan (DELETE WHERE salesforce_id IN sample IDs AND updated_at > 1 hour ago)

---

## Current Migration Progress

| Asset | Count |
|-------|-------|
| Contacts in LoanOS | 2,377 |
| With email | 2,375 (all unique) |
| With salesforce_id | 44 (98% gap — fill during Week 3) |
| Closed contacts | 853 |
| Active (In Process + Pre-Approved + Application) | 70 |

---

## Blockers

**SOFT BLOCKER:** Sample run cannot execute until you confirm:
1. Where is the Salesforce CSV export stored? (`report1773019847271.xls` or a fresh export?)
2. What values appear in the Salesforce "Type" column? (Need full list for contact_type mapping.)

The migration script spec is ready. Builder just needs the CSV path.

---

## What Can Be Done Without Adam's Input

- **"Closed Borrowers" smart list fix** — UI query fix, zero risk, immediately executable. Changes `stage IN ('Closed Client')` → `stage IN ('Closed')`. Should return 853 records after fix.

---

## Top 3 Priorities for Tomorrow

1. **Adam provides Salesforce CSV location** → Builder writes + dry-runs `scripts/crm/migrate-contacts.js` → reviews output
2. **Adam reviews dry-run output** → approves sample insert → Builder runs 100-record sample + validates via Supabase MCP
3. **n8n WF1 + WF2 cloud push** (outstanding from prior work) → enables `activity_log.organization_id` NOT NULL hardening

---

## Week 2 Status: 60% Complete

Research ✅ | Architecture ✅ | Sample Run ⏳ (pending CSV) | Validation ⏳ | Full Run → Week 3
