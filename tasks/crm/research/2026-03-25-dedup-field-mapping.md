# Research: Dedup Logic + Field Mapping Finalization — CRM Migration
Date: 2026-03-25

## Executive Summary

Live Supabase query results change the Week 2 picture significantly. Only 44 of 2,377 contacts have `salesforce_id` populated — the bulk import did not carry this field. The three-tier dedup strategy (Salesforce ID → Email → Name) effectively collapses to Email → Name for 98% of records. Email is already the clean dedup key: 2,375 contacts have email, all unique, UNIQUE constraint in place. The `mobile_phone` column was already dropped (migration 014 applied). Phone normalization is needed for comparison only, not schema changes. Stage data is already clean — no "Closed Client" values exist in the live DB.

---

## Live Schema Findings (Supabase query, 2026-03-25)

### Contact Counts
| Metric | Value |
|--------|-------|
| Total contacts | 2,377 |
| With email | 2,375 |
| Unique emails | 2,375 |
| Missing email | 2 |
| With salesforce_id | 44 |
| Missing salesforce_id | 2,333 (98%) |
| With phone (primary) | 1,659 |
| With phone_mobile | 9 |
| No phone at all | 718 |

### Stage Distribution
| Stage | Count |
|-------|-------|
| Lead | 1,436 |
| Closed | 853 |
| Pre-Approved | 38 |
| In Process | 21 |
| null | 13 |
| Application | 11 |
| Other | 5 |

**Key finding:** No "Closed Client" values exist — stage is already normalized. The "Closed Borrowers" smart list bug is a UI query bug (`stage IN ('Closed Client')` instead of `'Closed'`), not a data problem.

### Phone Column State
- `mobile_phone` column: **DROPPED** (migration 014 applied)
- `phone` column: canonical primary phone — 1,659 records populated
- `phone_mobile` column: secondary mobile — only 9 records
- **Decision: Phone schema split is resolved. No schema migration needed.**

---

## Critical Gap: salesforce_id Not Populated in Bulk Import

The Week 1 bulk import (2,441 contacts from `report1773019847271.xls`) did NOT set `salesforce_id` on imported records. Only 44 records have it — these are likely records created individually or via a different import path.

**Impact on dedup strategy:**
- The "three-tier" dedup (Salesforce ID → Email → Name) cannot use salesforce_id as primary key for 98% of records
- Email must be the primary dedup key
- The 2 contacts without email need name + phone matching

**Recommended dedup order for the sample run:**
1. **Email exact match** (covers 2,375/2,377 records) → upsert via `onConflict: email`
2. **First + Last name match** (fallback for 2 email-less records) → query then skip/flag
3. **salesforce_id** — use to backfill the column post-import, not as dedup key

---

## Industry Benchmarks — Mortgage CRM Migration

### Contact Dedup Patterns
**What works in practice for mortgage contact databases:**
- **Email as primary dedup key** — most reliable for professional contacts. Mortgage borrowers reliably give email.
- **Name normalization before comparison** — lowercase, trim, remove suffixes (Jr., III) before name-based fallback matching
- **Fuzzy phone matching** — strip to 10 digits, compare. US formats vary wildly: `(512) 555-1234`, `512-555-1234`, `5125551234`, `+15125551234`
- **Import-then-audit pattern** — insert sample 100 records into a staging table first, run dedup logic, review results, then promote to production contacts table

### Supabase Upsert Best Practices
- `.upsert(data, { onConflict: 'email' })` handles exact email dedup natively — UNIQUE constraint on email must exist (it does)
- Multi-column conflict: `.upsert(data, { onConflict: 'first_name,last_name' })` — requires a UNIQUE constraint on that column pair (doesn't exist yet)
- For the 2 no-email contacts: query by name first, skip if found, insert if not found — manual upsert logic
- Batch size: 100 records max per upsert call to avoid timeout on complex conflict resolution

### Sample Migration Validation Checklist (100-Record Run)
What must be verified after a 100-record sample insert:

**Data integrity:**
- [ ] Record count matches: 100 source rows → N contacts inserted + M updated (N + M = 100)
- [ ] No silent drops: every source row accounted for in insert log
- [ ] No phantom duplicates: contact count before vs. after
- [ ] salesforce_id backfilled correctly on matched records
- [ ] stage values are canonical (no "Closed Client", "Lead (Old)", etc.)

**Field-level checks:**
- [ ] email lowercased
- [ ] first_name / last_name trimmed and title-cased
- [ ] phone normalized (digits only, 10 or 11 chars)
- [ ] birthdate / salesforce_created_date parsed from MM/DD/YYYY → YYYY-MM-DD
- [ ] contact_type maps correctly ("Client" → "borrower", "Business Contact" → "other")
- [ ] organization_id set to Adam's org on all inserted records

**Compliance:**
- [ ] All 100 records have organization_id set (NOT NULL constraint will catch this)
- [ ] No financial data written to unauthorized table
- [ ] activity_log entry created for each new contact (or confirmed logging is deferred)

**Edge cases to include in sample:**
- [ ] At least 2 records with no email
- [ ] At least 5 records with phone in non-standard format
- [ ] At least 2 records with duplicate name (different email)
- [ ] At least 1 record whose email already exists in contacts (should update, not duplicate)
- [ ] At least 1 record with null stage

---

## Phone Normalization Strategy

US mortgage contacts have phone in these formats:
- `(512) 555-1234` — most common from Salesforce
- `512-555-1234`
- `5125551234`
- `+1 (512) 555-1234`
- `+15125551234`

**Recommended normalization (pre-insert, in migration script):**
```javascript
function normalizePhone(raw) {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, ''); // strip all non-digits
  if (digits.length === 11 && digits.startsWith('1')) {
    return digits.slice(1); // strip leading country code → 10 digits
  }
  if (digits.length === 10) return digits;
  return null; // invalid — flag for review, don't insert garbage
}
```

**Storage decision:** Store as plain 10-digit string (no formatting, no +1 prefix). Display layer can format for UI. Do NOT store E.164 — Supabase has no E.164 column type without a Postgres extension, and Adam's existing schema uses TEXT.

**For the sample run:** Normalize phone before comparing/inserting. Log invalid phone numbers to a separate review file.

---

## Field Mapping: Confirmed Final State

### Salesforce Export → contacts Table

| Salesforce Field | contacts Column | Notes |
|----------------|-----------------|-------|
| First Name | `first_name` | trim, title-case |
| Last Name | `last_name` | trim, title-case |
| Email | `email` | lowercase, trim |
| Phone | `phone` | normalize to 10-digit |
| Mobile | `phone_mobile` | normalize to 10-digit |
| Birthdate | `birthdate` | MM/DD/YYYY → YYYY-MM-DD |
| Account Name | `account_name` | as-is |
| Stage | `stage` | map (see below) |
| Type | `contact_type` | map: Client→borrower, Business Contact→other |
| Lead Source | `lead_source` | as-is |
| Mailing Street | `mailing_street` | as-is |
| Mailing City | `mailing_city` | as-is |
| Mailing State/Province | `mailing_state` | as-is |
| Mailing Zip/Postal Code | `mailing_zip` | as-is |
| Referred By | `referred_by` | as-is (plain text) |
| Top Realtor | `top_realtor` | "True"/"False" → boolean |
| Target Realtor | `target_realtor` | "True"/"False" → boolean |
| Email Opt Out | `email_opt_out` | "True"/"False" → boolean |
| Title | `title` | as-is |
| Created Date | `salesforce_created_date` | MM/DD/YYYY → YYYY-MM-DD |
| Contact ID (Salesforce) | `salesforce_id` | as-is — 18-char Salesforce ID |
| Group | `group_tag` | as-is |
| Notes | `notes` | as-is |
| Company | `company_name` | as-is |
| Mailing Country | `mailing_country` | as-is |
| Last Activity | `last_activity_date` | parse timestamp |
| *(hardcoded)* | `organization_id` | Adam's org UUID — REQUIRED |

**Skipped Salesforce fields (no mapping):**
- "Contact ID" → mapped to `salesforce_id` (clarification: this IS the 18-char ID, not a local ID)
- Salesforce system fields (Last Modified By, Created By, Owner, etc.) — not migrated

### Stage Mapping: Salesforce → LoanOS

| Salesforce Stage | LoanOS Stage | Notes |
|----------------|-------------|-------|
| Lead | Lead | ✅ direct |
| New | Lead | normalize |
| Active | Lead | normalize |
| Client | Lead | normalize (generic) |
| Closed Client | Closed | ✅ normalize |
| Closed | Closed | ✅ direct |
| Pre-Approved | Pre-Approved | ✅ direct |
| In Process | In Process | ✅ direct |
| Application | Application | ✅ direct |
| Other | Other | ✅ direct |
| null / empty | Lead | default |

**Note:** Live data shows no "Closed Client" values currently — this may mean prior import already normalized them, OR those contacts weren't included. Confirm with 100-record sample.

---

## Current Gap Analysis (Jungo → LoanOS)

| Feature | Jungo/Salesforce | LoanOS Status | Priority |
|---------|----------------|---------------|----------|
| Contact import with all fields | ✅ | ⚠️ CSV import wired but no backend logic | HIGH |
| Pagination beyond 500 records | ✅ | ❌ Hard cap, 1,877 contacts unreachable | HIGH |
| Smart list bug ("Closed Borrowers") | ✅ | ❌ UI queries wrong stage value | MEDIUM |
| Phone normalization | ✅ | ❌ Raw formats stored | MEDIUM |
| Realtor production tracking | ✅ | ❌ Not built | LOW (Week 6) |
| Birthday/anniversary automations | ✅ | ❌ Not built | MEDIUM (Week 4) |

---

## Adam's Current State

**Contacts actively used in LoanOS:**
- 2,377 total; only ~70 (In Process + Pre-Approved + Application) are "active file" contacts
- 853 Closed contacts — past clients, high value for rate watch / anniversary automations
- 1,436 Lead — largest segment, mostly from Salesforce historical imports

**Phone data quality:**
- 718 contacts (30%) have no phone at all — this is normal for older mortgage CRM data
- `phone_mobile` populated for only 9 records — the Salesforce import used `phone` as primary

**What Adam uses in Jungo today (must preserve):**
- Stage tracking — which contacts are leads vs. active vs. closed
- Realtor flags (top_realtor, target_realtor) — for referral source tracking
- Birthday/anniversary dates — trigger for automated outreach
- Notes — ad-hoc LO context on contact

---

## Compliance Requirements

- **GLBA:** All contact/loan financial data must stay in Supabase (encrypted at rest — Supabase AES-256 at rest). Do NOT export to CSVs that leave the system unencrypted.
- **Data retention:** Loan records minimum 7 years. Contact records follow loan records for borrowers.
- **Access control:** Janie scoped to active files only via RLS — RLS policies confirmed correct.
- **Audit log:** New contacts from migration should be logged to activity_log with `action: 'contact_created'`, `organization_id` set. Do NOT skip logging.
- **No PII to unauthorized systems:** The sample run results should be written to tasks/crm/ (local, git-tracked) — not emailed or sent to external services.

---

## Recommended Approach for Week 2

1. **Fix the "Closed Borrowers" smart list bug** (UI change only — no data migration) before sample run so validation makes sense
2. **Write the migration script** as a Node.js script (not a Supabase migration) — reads Salesforce CSV, normalizes fields, upserts 100 records to contacts, logs result
3. **Use email as primary dedup key** — `.upsert(batch, { onConflict: 'email' })` covers 98% of records
4. **Handle the 2 no-email contacts separately** — query by name+phone, skip if found, insert if not found
5. **Backfill salesforce_id** on matched records post-upsert — critical for Week 3 full migration tracking
6. **Validate sample** using the checklist above before approving full run

---

## Open Questions Requiring Adam's Decision

1. **Salesforce export status** — The sample run needs the raw Salesforce CSV. The audit referenced `report1773019847271.xls` — does Adam have access to a fresh export, or will we use the same file? Where is this file stored locally?
2. **Contact type mapping** — The Salesforce export "Type" column has values beyond "Client" and "Business Contact". What other values exist (e.g., "Realtor", "Business Partner")? Need full value list to map `contact_type` correctly.
3. **Pagination fix priority** — 1,877 contacts are currently unreachable in the UI (500-record hard cap). Should this be fixed before or after the sample run so validation can actually see all migrated records?
4. **Script location** — Where should the migration script live? Suggested: `scripts/crm/migrate-contacts.js` (not deployed to Vercel, run locally or via n8n Code node).
5. **Staging table vs. direct upsert** — Should the sample run insert into a `contacts_staging` table for review before promoting, or directly upsert into `contacts`? Direct upsert is faster but less reversible.
