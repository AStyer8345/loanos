# Migration Spec: Contact Dedup + Sample Run — CRM
Date: 2026-03-25
Status: READY FOR EXECUTION (with noted dependencies)

---

## Scope

### In Scope
1. **Fix "Closed Borrowers" smart list bug** — UI query fix, no data change
2. **Contact migration script** — Node.js script to import 100-record sample from Salesforce CSV
3. **Phone normalization logic** — applied during import, not a schema migration
4. **salesforce_id backfill** — set on matched/inserted records during import
5. **Sample validation** — using Supabase MCP to verify after run

### Out of Scope (this session)
- Full 2,441-contact migration (Week 3)
- Pagination fix (tracked separately)
- n8n automation rebuild (Weeks 4-5)
- Loan record migration (Week 3)
- Any schema changes to contacts table (schema is complete)

---

## Key Reference Data

| Constant | Value |
|----------|-------|
| Adam's org UUID | `18613f82-fdd9-42dd-a09e-f3c577328258` |
| Adam's user_id | `b13aa8c6-c3a0-4312-9b35-c76073e7ccdc` |
| Supabase project | `uuqedsvjlkeszrbwzizl` |
| Live contact count | 2,377 |
| contacts UNIQUE constraint | `contacts_email_unique` on `email` |
| salesforce_id UNIQUE constraint | `contacts_salesforce_id_key` on `salesforce_id` |

---

## BLOCKER DEPENDENCY — Must Resolve Before Builder Executes Sample Run

The following questions from Research require Adam's decision. The UI fix (Part 1) can proceed without them. The sample run script (Part 2) requires answers to at least items 1 and 2.

1. **Salesforce CSV location** — Where is `report1773019847271.xls` (or a fresh Salesforce export) stored locally? Builder cannot run the sample without this file.
2. **Full contact_type values** — What values appear in the Salesforce "Type" column? CHECK constraint allows: `borrower`, `realtor`, `other`, `advisor`, `title`, `insurance`. Need full Salesforce value list.
3. **Staging vs. direct upsert** — Does Adam want to insert into a `contacts_staging` table for review, or directly upsert into `contacts`? **Default if no answer: direct upsert** (simpler, reversible via DELETE WHERE salesforce_id IN sample set).

---

## Part 1: Fix "Closed Borrowers" Smart List Bug

**Risk: NONE. UI-only change. No data modification.**

### File to Edit
`src/app/(dashboard)/contacts/page.tsx`

### What to Find
Search for the smart list query that references `'Closed Client'`. It will look like:
```typescript
stage: { in: ['Closed Client'] }
// OR
.in('stage', ['Closed Client'])
// OR
stage === 'Closed Client'
```

### What to Change
Replace `'Closed Client'` with `'Closed'` everywhere in the smart list definitions.

### Verification
After fix: smart list "Closed Borrowers" should return 853 records (confirmed live count).

---

## Part 2: Contact Migration Script

### Location
`scripts/crm/migrate-contacts.js`

This is a standalone Node.js script. It is NOT a Next.js route, NOT an n8n workflow. Run locally from the repo root:
```bash
node scripts/crm/migrate-contacts.js --sample 100 --source /path/to/salesforce-export.xls
```

### Dependencies
```bash
npm install xlsx @supabase/supabase-js --save-dev
```
(xlsx for parsing .xls/.xlsx, supabase-js for upsert)

### Script Architecture

```
[READ CSV/XLS]
    ↓
[PARSE ROWS] — convert raw Salesforce fields to LoanOS schema
    ↓
[NORMALIZE] — phone, email, name, dates, booleans
    ↓
[VALIDATE] — check required fields, catch CHECK constraint violations early
    ↓
[DEDUP CHECK] — query by salesforce_id, then by email (for records missing salesforce_id)
    ↓
[UPSERT BATCH] — 100 records max, onConflict: email
    ↓
[LOG RESULT] — write to scripts/crm/run-logs/[DATE]-sample-run.json
    ↓
[VALIDATE] — query Supabase, compare counts, spot-check fields
```

---

## Part 2A: Field Normalization Functions

Builder must implement these exact functions in the script:

### Email Normalization
```javascript
function normalizeEmail(raw) {
  if (!raw || raw.trim() === '') return null;
  return raw.toLowerCase().trim();
}
```

### Phone Normalization
```javascript
function normalizePhone(raw) {
  if (!raw || raw.trim() === '') return null;
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) {
    return digits.slice(1); // strip +1 → 10 digits
  }
  if (digits.length === 10) return digits;
  return null; // invalid — log and skip
}
```

### Name Normalization
```javascript
function normalizeName(raw) {
  if (!raw) return '';
  return raw.trim()
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}
```

### Date Normalization (MM/DD/YYYY → YYYY-MM-DD)
```javascript
function normalizeDate(raw) {
  if (!raw || raw.trim() === '') return null;
  const parts = raw.split('/');
  if (parts.length !== 3) return null;
  const [mm, dd, yyyy] = parts;
  if (!yyyy || yyyy.length !== 4) return null;
  return `${yyyy}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}`;
}
```

### Boolean Normalization
```javascript
function normalizeBool(raw) {
  if (!raw) return false;
  return raw.toLowerCase() === 'true';
}
```

### Contact Type Mapping
```javascript
const CONTACT_TYPE_MAP = {
  'client': 'borrower',
  'borrower': 'borrower',
  'realtor': 'realtor',
  'agent': 'realtor',
  'business contact': 'other',
  'advisor': 'advisor',
  'title': 'title',
  'insurance': 'insurance',
  '': 'borrower', // default
};

function mapContactType(raw) {
  if (!raw) return 'borrower';
  const key = raw.toLowerCase().trim();
  return CONTACT_TYPE_MAP[key] || 'other'; // unknown → 'other' (safe fallback)
}
```

### Stage Mapping
```javascript
const STAGE_MAP = {
  'lead': 'Lead',
  'new': 'Lead',
  'active': 'Lead',
  'client': 'Lead',
  'closed client': 'Closed',
  'closed': 'Closed',
  'pre-approved': 'Pre-Approved',
  'preapproved': 'Pre-Approved',
  'in process': 'In Process',
  'application': 'Application',
  'other': 'Other',
};

function mapStage(raw) {
  if (!raw) return 'Lead';
  return STAGE_MAP[raw.toLowerCase().trim()] || 'Lead'; // unknown → Lead (safe default)
}
```

---

## Part 2B: Row Transformation

Builder must map Salesforce column headers → contacts fields as follows:

```javascript
function transformRow(row, orgId, userId) {
  const email = normalizeEmail(row['Email']);
  const phone = normalizePhone(row['Phone']);
  const phoneMobile = normalizePhone(row['Mobile']);

  return {
    first_name: normalizeName(row['First Name']) || 'Unknown',
    last_name: normalizeName(row['Last Name']) || 'Unknown',
    email: email,
    phone: phone,
    phone_mobile: phoneMobile,
    contact_type: mapContactType(row['Type']),
    stage: mapStage(row['Stage']),
    account_name: row['Account Name'] || null,
    lead_source: row['Lead Source'] || null,
    referred_by: row['Referred By'] || null,
    company_name: row['Company'] || null,
    mailing_street: row['Mailing Street'] || null,
    mailing_city: row['Mailing City'] || null,
    mailing_state: row['Mailing State/Province'] || null,
    mailing_zip: row['Mailing Zip/Postal Code'] || null,
    mailing_country: row['Mailing Country'] || null,
    title: row['Title'] || null,
    notes: row['Notes'] || null,
    group_tag: row['Group'] || 'Client',
    birthdate: normalizeDate(row['Birthdate']),
    salesforce_created_date: normalizeDate(row['Created Date']),
    salesforce_id: row['Contact ID'] || null,
    top_realtor: normalizeBool(row['Top Realtor']),
    target_realtor: normalizeBool(row['Target Realtor']),
    email_opt_out: normalizeBool(row['Email Opt Out']),
    organization_id: orgId,      // REQUIRED — hardcoded
    user_id: userId,              // REQUIRED — hardcoded
  };
}
```

**Column names in the XLS may vary.** Builder must print the first row of the XLS to console before running the full transform, and adjust column name strings if needed.

---

## Part 2C: Dedup and Upsert Logic

```javascript
async function upsertBatch(supabase, records, log) {
  // Primary dedup: email UNIQUE constraint
  const withEmail = records.filter(r => r.email !== null);
  const withoutEmail = records.filter(r => r.email === null);

  // Upsert records with email — let Supabase handle dedup via onConflict
  if (withEmail.length > 0) {
    const { data, error } = await supabase
      .from('contacts')
      .upsert(withEmail, {
        onConflict: 'email',
        ignoreDuplicates: false  // UPDATE on conflict (not skip)
      })
      .select('id, email, salesforce_id');

    if (error) log.errors.push({ phase: 'email-upsert', error: error.message });
    else log.upserted += data.length;
  }

  // Handle no-email records: query by name+phone, skip if found, insert if not
  for (const record of withoutEmail) {
    const { data: existing } = await supabase
      .from('contacts')
      .select('id')
      .eq('first_name', record.first_name)
      .eq('last_name', record.last_name)
      .eq('organization_id', record.organization_id)
      .maybeSingle();

    if (existing) {
      log.skipped.push({ name: `${record.first_name} ${record.last_name}`, reason: 'name match found, no email' });
    } else {
      const { error } = await supabase.from('contacts').insert(record);
      if (error) log.errors.push({ phase: 'no-email-insert', record, error: error.message });
      else log.inserted += 1;
    }
  }
}
```

---

## Part 2D: Run Log Format

Write to `scripts/crm/run-logs/[YYYY-MM-DD]-sample-run.json`:

```json
{
  "run_date": "2026-03-25",
  "mode": "sample",
  "source_file": "/path/to/export.xls",
  "source_row_count": 100,
  "results": {
    "upserted": 0,
    "inserted": 0,
    "skipped": 0,
    "errors": 0
  },
  "invalid_phones": [],
  "skipped_records": [],
  "errors": [],
  "validation": {
    "contacts_before": 2377,
    "contacts_after": 0,
    "delta": 0,
    "all_org_id_set": null,
    "sample_spot_check": []
  }
}
```

---

## Part 2E: Post-Run Validation SQL

After the sample run, Builder must run these queries via Supabase MCP to verify:

```sql
-- 1. Count check — should equal 2377 + net new records
SELECT COUNT(*) FROM contacts WHERE organization_id = '18613f82-fdd9-42dd-a09e-f3c577328258';

-- 2. Confirm no nulls on required fields in new/updated records
SELECT id, first_name, last_name, organization_id, user_id
FROM contacts
WHERE organization_id = '18613f82-fdd9-42dd-a09e-f3c577328258'
  AND (first_name IS NULL OR last_name IS NULL OR organization_id IS NULL OR user_id IS NULL)
  AND updated_at > NOW() - INTERVAL '1 hour';

-- 3. Stage distribution — should show no unexpected values
SELECT stage, COUNT(*) FROM contacts GROUP BY stage ORDER BY COUNT(*) DESC;

-- 4. Contact_type distribution — should only have allowed values
SELECT contact_type, COUNT(*) FROM contacts GROUP BY contact_type ORDER BY COUNT(*) DESC;

-- 5. Spot-check salesforce_id backfill
SELECT id, email, salesforce_id, first_name, last_name
FROM contacts
WHERE salesforce_id IS NOT NULL
  AND updated_at > NOW() - INTERVAL '1 hour'
LIMIT 10;
```

---

## Implementation Order

1. **Fix "Closed Borrowers" UI bug** — independent, zero risk, do first
2. **Confirm Salesforce CSV exists and locate it** — if not found, STOP and ask Adam
3. **Create `scripts/crm/` directory and `migrate-contacts.js`**
4. **Install dependencies** (`npm install xlsx @supabase/supabase-js --save-dev`)
5. **Print column headers** from XLS row 0 — confirm column name strings before transforming
6. **Run with `--dry-run` flag first** — transform 100 rows, log output, do NOT insert
7. **Review dry-run output** — confirm field mapping looks correct
8. **Run with `--sample 100`** — insert to live contacts table
9. **Run post-run validation SQL** via Supabase MCP
10. **Write run log** to `scripts/crm/run-logs/`

---

## Risk Register

| Action | Data Loss Risk | Reversible? | Live Impact | Mitigation |
|--------|---------------|-------------|-------------|------------|
| Fix "Closed Borrowers" query | NONE | YES — revert code | None | Simple string fix |
| Sample upsert (email onConflict) | LOW | YES — DELETE WHERE salesforce_id IN (sample IDs) | Updates existing records' fields | Dry-run first; log all changed IDs |
| No-email insert | LOW | YES — DELETE by ID | Adds new records only | Log all inserted IDs for rollback |
| salesforce_id backfill | NONE | YES — SET salesforce_id = NULL | Updates existing records | Only set if previously NULL |

**No HIGH risk items in this session.**

---

## Definition of Done

Builder is done when ALL of the following are true:
- [ ] "Closed Borrowers" smart list returns 853 records
- [ ] `scripts/crm/migrate-contacts.js` exists and runs without uncaught errors
- [ ] 100-record sample run completed successfully
- [ ] Run log written to `scripts/crm/run-logs/2026-03-25-sample-run.json`
- [ ] All 5 post-run SQL queries executed and results match expectations
- [ ] No records inserted with NULL organization_id
- [ ] No stage values outside canonical set
- [ ] No contact_type values outside CHECK constraint allowed set

---

## Rollback Plan

If the sample run produces unexpected results:
```sql
-- Rollback: delete all contacts updated/inserted in the last hour that have a salesforce_id
-- (This targets only migration-created records, not pre-existing ones)
DELETE FROM contacts
WHERE salesforce_id IS NOT NULL
  AND updated_at > NOW() - INTERVAL '1 hour'
  AND organization_id = '18613f82-fdd9-42dd-a09e-f3c577328258';
```

If rollback is needed — run via Supabase MCP `execute_sql`, then verify count returns to 2,377.

---

## Adam Approval Required Before Execution?

**YES** — for the sample run specifically.

Builder can execute the "Closed Borrowers" UI fix immediately without approval.

For the sample run: Adam must confirm the Salesforce CSV file location before Builder can proceed. This is a data write to the production contacts table (even at 100 records). Run the script spec by Adam during working hours before executing.
