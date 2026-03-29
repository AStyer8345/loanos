# Realtor Relationship System — Architecture Spec
**Date:** 2026-03-29
**Author:** CRM Architect Subagent
**Status:** READY FOR BUILDER
**Source research:** tasks/crm/research/2026-03-28-realtor-relationship-system.md
**Adam's decisions:** Logged 2026-03-28T18:45:00Z in subagent-status.md

---

## Adam's Confirmed Decisions

| Question | Adam's Answer |
|----------|--------------|
| Q5: referred_by field | Add UUID FK `referred_by_contact_id` (keep text field for now) |
| Q6: Boolean flags (top_realtor / target_realtor) | Deprecate — remove from code + drop from DB |
| Q7: last_touch_at tracking | Auto-tracked via DB trigger, not manual |
| Q8: Crystal Kilpatrick tier | Tier A — backfill her record |
| Q9: Outreach cadence system | A=weekly, B=monthly, untiered=monthly. No separate cadence column needed. |
| Q10: Co-marketing fields | No — do not add any co_marketing_* columns |
| Q11: preferred_contact_method | No — do not add this field |

---

## Part 1 — Migration 061 (Supabase Schema)

**File:** `supabase/migrations/061_realtor_relationship_schema.sql`

> ⚠️ NOTE: Two files use the `060_` prefix (`060_contact_schema_improvements.sql` and
> `060_org_settings_onboarding_tracking.sql`). Builder must confirm both are applied and
> use `061` as the next number. If a `061_` file already exists, use `062_`.

### 1a — DDL: New Columns on `contacts`

```sql
-- =====================================================
-- Migration 061: Realtor Relationship System Schema
-- Date: 2026-03-29
-- =====================================================

-- Referral performance tracking (for realtor contacts)
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS referred_by_contact_id uuid REFERENCES contacts(id);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS referral_ytd_count integer NOT NULL DEFAULT 0;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS referral_lifetime_count integer NOT NULL DEFAULT 0;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS last_referral_date date;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS deals_ytd_count integer NOT NULL DEFAULT 0;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS deals_lifetime_count integer NOT NULL DEFAULT 0;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS last_deal_closed_date date;

-- Outreach tracking (for any contact type, primarily realtors)
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS last_outreach_date date;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS referral_source_notes text;

-- Loans: dedicated referral source FK (separate from buyer/listing agent)
ALTER TABLE loans ADD COLUMN IF NOT EXISTS referral_contact_id uuid REFERENCES contacts(id);
```

### 1b — last_touch_at Auto-Update Trigger

`last_touch_at` exists on `contacts` but is populated on only 15 of 1,060 realtors. Adam confirmed
it should be auto-tracked. Add a trigger that fires on every `activity_log` INSERT and updates the
contact's `last_touch_at`.

```sql
-- Function: update contacts.last_touch_at on every activity_log insert
CREATE OR REPLACE FUNCTION fn_update_contact_last_touch_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only fire when contact_id is set (some activity_log rows are loan-level only)
  IF NEW.contact_id IS NOT NULL THEN
    UPDATE contacts
    SET last_touch_at = COALESCE(NEW.created_at, NOW())
    WHERE id = NEW.contact_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger: fires AFTER INSERT on activity_log (INSERT only — not UPDATE, to prevent loops)
DROP TRIGGER IF EXISTS trg_activity_log_update_last_touch ON activity_log;
CREATE TRIGGER trg_activity_log_update_last_touch
  AFTER INSERT ON activity_log
  FOR EACH ROW
  EXECUTE FUNCTION fn_update_contact_last_touch_at();
```

> ⚠️ HIGH RISK: Verify `activity_log` has a `contact_id` column (not just `loan_id`).
> Run: `SELECT column_name FROM information_schema.columns WHERE table_name = 'activity_log' AND column_name = 'contact_id';`
> If it doesn't exist, the trigger must use a different join path or be deferred.

### 1c — DML: Backfill referred_by_contact_id

Match the existing `contacts.referred_by` text field against realtor contact names.

**Step 1 — Audit before backfill (run as a dry-run first):**
```sql
-- Count matchable records (preview only — do not UPDATE yet)
SELECT
  b.id AS borrower_id,
  b.first_name,
  b.last_name,
  b.referred_by,
  r.id AS realtor_id,
  r.first_name AS realtor_first,
  r.last_name AS realtor_last
FROM contacts b
JOIN contacts r
  ON r.contact_type = 'realtor'
  AND LOWER(TRIM(b.referred_by)) = LOWER(TRIM(r.first_name || ' ' || r.last_name))
WHERE b.referred_by IS NOT NULL
  AND b.referred_by_contact_id IS NULL
  AND b.organization_id = '98e4c4d1-12e9-47f7-b93c-ca8d25d46a12'  -- Adam's org UUID
ORDER BY r.last_name, r.first_name;
```

> 📋 Adam's org UUID: `98e4c4d1-12e9-47f7-b93c-ca8d25d46a12`
> If this is incorrect, run: `SELECT id FROM organizations LIMIT 5;` to find the right value.

**Step 2 — Verify match count is reasonable (expect ~300–800 records):**
```sql
SELECT COUNT(*)
FROM contacts b
JOIN contacts r
  ON r.contact_type = 'realtor'
  AND LOWER(TRIM(b.referred_by)) = LOWER(TRIM(r.first_name || ' ' || r.last_name))
WHERE b.referred_by IS NOT NULL
  AND b.referred_by_contact_id IS NULL;
```

**Step 3 — Apply the backfill (only after Step 2 count looks sane):**
```sql
UPDATE contacts b
SET referred_by_contact_id = r.id,
    updated_at = NOW()
FROM contacts r
WHERE r.contact_type = 'realtor'
  AND LOWER(TRIM(b.referred_by)) = LOWER(TRIM(r.first_name || ' ' || r.last_name))
  AND b.referred_by IS NOT NULL
  AND b.referred_by_contact_id IS NULL
  AND b.organization_id = '98e4c4d1-12e9-47f7-b93c-ca8d25d46a12';
```

**Step 4 — Verify Crystal Kilpatrick specifically:**
```sql
SELECT id, first_name, last_name, production_tier, referral_lifetime_count
FROM contacts
WHERE contact_type = 'realtor'
  AND LOWER(first_name || ' ' || last_name) LIKE '%kilpatrick%';
```

Crystal should appear as Tier A after the production_tier backfill below.

### 1d — DML: Backfill referral_lifetime_count and last_referral_date

After `referred_by_contact_id` is backfilled:

```sql
-- Backfill referral_lifetime_count for all realtors
UPDATE contacts r
SET referral_lifetime_count = sub.cnt,
    updated_at = NOW()
FROM (
  SELECT referred_by_contact_id, COUNT(*) as cnt
  FROM contacts
  WHERE referred_by_contact_id IS NOT NULL
    AND contact_type != 'realtor'
  GROUP BY referred_by_contact_id
) sub
WHERE r.id = sub.referred_by_contact_id;

-- Backfill last_referral_date for all realtors
UPDATE contacts r
SET last_referral_date = sub.latest_date,
    updated_at = NOW()
FROM (
  SELECT referred_by_contact_id, MAX(created_at::date) AS latest_date
  FROM contacts
  WHERE referred_by_contact_id IS NOT NULL
    AND contact_type != 'realtor'
  GROUP BY referred_by_contact_id
) sub
WHERE r.id = sub.referred_by_contact_id;

-- Backfill referral_ytd_count (current year = 2026)
UPDATE contacts r
SET referral_ytd_count = sub.cnt,
    updated_at = NOW()
FROM (
  SELECT referred_by_contact_id, COUNT(*) as cnt
  FROM contacts
  WHERE referred_by_contact_id IS NOT NULL
    AND contact_type != 'realtor'
    AND EXTRACT(YEAR FROM created_at) = 2026
  GROUP BY referred_by_contact_id
) sub
WHERE r.id = sub.referred_by_contact_id;
```

### 1e — DML: Backfill Crystal Kilpatrick Tier A

After `referred_by_contact_id` backfill, Crystal will have a matched contact ID. Also find her by name:

```sql
UPDATE contacts
SET production_tier = 'A',
    updated_at = NOW()
WHERE contact_type = 'realtor'
  AND LOWER(first_name) = 'crystal'
  AND LOWER(last_name) = 'kilpatrick'
  AND (production_tier IS NULL OR production_tier != 'A');
```

### 1f — DML: Backfill realtor_stage for tiered realtors

Set `realtor_stage` for realtors who have a `production_tier` but no stage:

```sql
-- Tier A and B → 'Active Partner'
UPDATE contacts
SET realtor_stage = 'Active Partner',
    updated_at = NOW()
WHERE contact_type = 'realtor'
  AND production_tier IN ('A', 'B')
  AND realtor_stage IS NULL;

-- Tier NULL (untiered) → leave NULL for now (don't mass-set 943 unworked contacts)
-- They can be set to 'Lead' manually or via smart list bulk action
```

### 1g — DML: Backfill deals_lifetime_count from loans table

```sql
-- Backfill deals_lifetime_count using existing buyer_agent_contact_id on loans
UPDATE contacts r
SET deals_lifetime_count = sub.cnt,
    updated_at = NOW()
FROM (
  SELECT buyer_agent_contact_id AS contact_id, COUNT(*) AS cnt
  FROM loans
  WHERE buyer_agent_contact_id IS NOT NULL
    AND status IN ('loan_funded', 'funded', 'closed', 'Funded', 'Closed')
  GROUP BY buyer_agent_contact_id
) sub
WHERE r.id = sub.contact_id
  AND r.contact_type = 'realtor';

-- Also backfill last_deal_closed_date
UPDATE contacts r
SET last_deal_closed_date = sub.latest_date,
    updated_at = NOW()
FROM (
  SELECT buyer_agent_contact_id AS contact_id, MAX(closing_date) AS latest_date
  FROM loans
  WHERE buyer_agent_contact_id IS NOT NULL
    AND closing_date IS NOT NULL
  GROUP BY buyer_agent_contact_id
) sub
WHERE r.id = sub.contact_id
  AND r.contact_type = 'realtor';
```

### 1h — Boolean Deprecation Path

> ⚠️ HIGH RISK: `top_realtor` and `target_realtor` have code references. Must remove code BEFORE running DROP COLUMN.

**Code cleanup required by Builder BEFORE applying DDL:**

**File 1: `src/app/api/import/contacts/route.ts`** (lines ~54–55)

Remove these two lines from the contact object construction:
```typescript
// REMOVE:
top_realtor:      parseBool(g('Top Realtor')   ?? g('top_realtor')),
target_realtor:   parseBool(g('Target Realtor') ?? g('target_realtor')),
```

Replace with a `production_tier` mapping from the CSV:
```typescript
// ADD — map legacy CSV columns to production_tier if not already set
production_tier: (
  parseBool(g('Top Realtor') ?? g('top_realtor'))
    ? 'A'
    : parseBool(g('Target Realtor') ?? g('target_realtor'))
      ? 'B'
      : undefined
) ?? undefined,
```

**File 2: `src/lib/database.types.ts`** — auto-generated, do NOT edit manually.
After running the DROP COLUMN migration, regenerate types by running:
```bash
cd /Users/adamstyer/Documents/loanos-clone
npx supabase gen types typescript --project-id uuqedsvjlkeszrbwzizl > src/lib/database.types.ts
```
Or use the Supabase MCP: `generate_typescript_types`

**Grep check before dropping (Builder must run this):**
```bash
grep -rn "top_realtor\|target_realtor" src/ --include="*.ts" --include="*.tsx"
```
Expected result after code cleanup: only `database.types.ts` (which will be regenerated after DROP).

**DDL: Drop legacy boolean columns (run AFTER code cleanup + build passes):**
```sql
-- Run AFTER: import API cleaned up + npm run build passes with no errors
ALTER TABLE contacts DROP COLUMN IF EXISTS top_realtor;
ALTER TABLE contacts DROP COLUMN IF EXISTS target_realtor;
```

**Full migration 061 delivery sequence:**
1. Add new columns (1a DDL) — safe, additive
2. Add trigger (1b) — safe
3. Run all DML backfills (1c through 1g)
4. Remove code references to top_realtor/target_realtor (import API)
5. Run `npm run build` — must pass before proceeding
6. Apply DROP COLUMN (1h DDL)
7. Regenerate `database.types.ts`
8. Run `npm run build` again — must pass

---

## Part 2 — New Smart Lists (contacts/page.tsx)

Add to the `SMART_LISTS` array in `src/app/dashboard/contacts/page.tsx`.
These lists use the new columns added in migration 061.

```typescript
// Add after existing realtor smart lists:

{
  id: 'active_deal_partners',
  label: 'Active Deal Partners',
  filter: (c: Contact) => c.contact_type === 'realtor' && /* see note */,
  // NOTE: This list requires a JOIN to loans — it cannot be done with a client-side filter.
  // Use a Supabase RPC or add a computed field. Defer to a separate builder task.
  // For now, use a simpler proxy: realtors where deals_ytd_count > 0 AND last_deal_closed_date >= 90 days ago
  filter: (c: Contact) =>
    c.contact_type === 'realtor' &&
    c.deals_ytd_count != null && c.deals_ytd_count > 0,
},

{
  id: 'due_for_outreach',
  label: 'Due for Outreach (60+ days)',
  filter: (c: Contact) => {
    if (c.contact_type !== 'realtor') return false;
    const touchDate = c.last_outreach_date ?? c.last_touch_at;
    if (!touchDate) return true; // never touched
    return new Date(touchDate) < new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
  },
},

{
  id: 'top_producers',
  label: 'Top Producers',
  filter: (c: Contact) =>
    c.contact_type === 'realtor' &&
    c.referral_ytd_count != null && c.referral_ytd_count >= 2,
},

{
  id: 'tier_a_not_this_month',
  label: 'Tier A — Not Contacted This Month',
  filter: (c: Contact) => {
    if (c.contact_type !== 'realtor' || c.production_tier !== 'A') return false;
    const touchDate = c.last_outreach_date ?? c.last_touch_at;
    if (!touchDate) return true;
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    return new Date(touchDate) < startOfMonth;
  },
},
```

**TypeScript type additions needed in the `Contact` type at the top of contacts/page.tsx:**
```typescript
// Add to Contact type:
referred_by_contact_id?: string | null;
referral_ytd_count?: number | null;
referral_lifetime_count?: number | null;
last_referral_date?: string | null;
deals_ytd_count?: number | null;
deals_lifetime_count?: number | null;
last_deal_closed_date?: string | null;
last_outreach_date?: string | null;
referral_source_notes?: string | null;
```

**Columns to add to `COLUMNS` definition:**
```typescript
{ id: 'referral_lifetime', label: 'Referrals',  minWidth: 90, render: c => c.referral_lifetime_count ? String(c.referral_lifetime_count) : null },
{ id: 'last_referral',     label: 'Last Referral', minWidth: 120, render: c => c.last_referral_date ? fmtDate(c.last_referral_date) : null },
{ id: 'last_deal',         label: 'Last Deal', minWidth: 120, render: c => c.last_deal_closed_date ? fmtDate(c.last_deal_closed_date) : null },
```

These are opt-in (not in DEFAULT_COLUMNS). Users add them via the COLUMNS picker.

---

## Part 3 — WF-R1: Referral Thank-You (n8n Workflow)

**Priority:** Immediate — no schema dependency (works with text field today; improves once referred_by_contact_id is populated)

### Trigger Design

**Option A (recommended):** Extend the existing `LoanOS — Pre-Approval Lead Notify` workflow (ID: `J9Pe24vUi6fpZtdZ`) — it already fires when a new pre-approval contact is detected. Add a branch that checks if `referred_by` is set and, if so, sends a thank-you to the realtor.

**Option B:** New standalone workflow triggered by a Supabase webhook on `contacts` INSERT where `referred_by IS NOT NULL`. Supabase webhooks require a separate setup step.

Use **Option A** for simplicity. Modify `J9Pe24vUi6fpZtdZ`.

### WF-R1 Node Map (extension to J9Pe24vUi6fpZtdZ)

Insert after the existing `Send Pre-Approval Notification` node (or whatever the final node is today — Builder should read the live workflow):

```
[Existing: Pre-Approval Lead Notify trigger + notification logic]
        ↓
[NEW: Check Has Referral] — IF node
  condition: {{ $json.referred_by !== null && $json.referred_by !== '' }}
        ↓ true
[NEW: Fetch Realtor Contact] — HTTP GET
  URL: https://uuqedsvjlkeszrbwzizl.supabase.co/rest/v1/contacts
  Query params:
    select=id,first_name,last_name,email,phone,email_opt_out
    contact_type=eq.realtor
    or=(first_name.ilike.{{ $json.referred_by.split(' ')[0] }},last_name.ilike.{{ $json.referred_by.split(' ').slice(-1)[0] }})
    organization_id=eq.98e4c4d1-12e9-47f7-b93c-ca8d25d46a12
    limit=1
  Headers:
    apikey: <service_role_key>
    Authorization: Bearer <service_role_key>
        ↓
[NEW: Check Realtor Found & Not Opted Out] — IF node
  condition: {{ $json[0] !== undefined && $json[0].email_opt_out !== true }}
        ↓ true
[NEW: Build Thank-You Email] — Code node
  Output:
    to: {{ $json[0].email }}
    subject: "Just wanted to give you a heads up on {{ $('Webhook').item.json.first_name }} {{ $('Webhook').item.json.last_name }}"
    body: <see email template below>
    realtorId: {{ $json[0].id }}
    realtorName: {{ $json[0].first_name }} {{ $json[0].last_name }}
        ↓
[NEW: Draft Thank-You in Outlook] — Microsoft Outlook node
  Operation: Create Draft
  Subject: {{ $json.subject }}
  To: {{ $json.to }}
  Body: {{ $json.body }}
        ↓
[NEW: Log Outreach to activity_log] — HTTP POST
  URL: https://uuqedsvjlkeszrbwzizl.supabase.co/rest/v1/activity_log
  Body:
    contact_id: {{ $json.realtorId }}
    organization_id: "98e4c4d1-12e9-47f7-b93c-ca8d25d46a12"
    activity_type: "referral_thank_you"
    description: "Referral thank-you drafted for {{ $json.realtorName }} — referred {{ $('Webhook').item.json.first_name }} {{ $('Webhook').item.json.last_name }}"
    created_at: {{ new Date().toISOString() }}
        ↓ false (realtor not found or opted out)
[End — no action]
```

### Email Template (thank-you body)

```html
<p>Hey {{ realtorFirstName }},</p>
<p>
  Just wanted to let you know {{ borrowerFirstName }} reached out — I got them.
  I'll keep you posted as things move forward.
</p>
<p>
  Thanks for the trust. These mean a lot.<br>
  — Adam
</p>
<p style="font-size: 12px; color: #666;">
  Adam Styer | Mortgage Solutions LP<br>
  NMLS #513013 | (512) 000-0000
</p>
```

Short, personal, immediate. Not a form email.

### WF-R1 Build Notes for Builder

- The workflow modifies `J9Pe24vUi6fpZtdZ` — get the full current workflow via `get_workflow_details` before editing
- Node IDs: use the format `wfr1-001`, `wfr1-002`, etc. for new nodes
- Credential: Microsoft Outlook account (same as other email draft workflows)
- Supabase credentials: same service role key used throughout (header auth format)
- The IF node uses Option A logic (extend existing) — Builder should verify the Pre-Approval Lead Notify still receives `referred_by` in its webhook payload. If not, a separate trigger is needed.
- Validate via `validate_workflow` before `update_workflow`
- Do NOT activate the workflow (it's already active — changes take effect on save)

---

## Part 4 — Verification Checklist (post-Builder execution)

Builder / QA should verify after execution:

### Schema
```sql
-- Verify new columns exist on contacts
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'contacts'
  AND column_name IN (
    'referred_by_contact_id', 'referral_ytd_count', 'referral_lifetime_count',
    'last_referral_date', 'deals_ytd_count', 'deals_lifetime_count',
    'last_deal_closed_date', 'last_outreach_date', 'referral_source_notes'
  );
-- Expect: 9 rows

-- Verify boolean columns are gone
SELECT COUNT(*) FROM information_schema.columns
WHERE table_name = 'contacts'
  AND column_name IN ('top_realtor', 'target_realtor');
-- Expect: 0

-- Verify trigger exists
SELECT trigger_name FROM information_schema.triggers
WHERE trigger_name = 'trg_activity_log_update_last_touch';
-- Expect: 1 row

-- Verify loans.referral_contact_id exists
SELECT COUNT(*) FROM information_schema.columns
WHERE table_name = 'loans' AND column_name = 'referral_contact_id';
-- Expect: 1
```

### Backfill
```sql
-- Crystal Kilpatrick should be Tier A
SELECT first_name, last_name, production_tier, referral_lifetime_count
FROM contacts
WHERE contact_type = 'realtor'
  AND LOWER(first_name || ' ' || last_name) LIKE '%kilpatrick%';
-- Expect: production_tier = 'A', referral_lifetime_count >= 53

-- referred_by_contact_id backfill count
SELECT COUNT(*) FROM contacts
WHERE referred_by_contact_id IS NOT NULL;
-- Expect: > 0 (hundreds of records)

-- Tiered realtors with Active Partner stage
SELECT COUNT(*) FROM contacts
WHERE contact_type = 'realtor'
  AND production_tier IN ('A','B')
  AND realtor_stage = 'Active Partner';
-- Expect: ≥ 120 (117 tiered + Crystal)
```

### Build
```bash
npm run build
# Expect: 0 TypeScript errors
# If errors mention top_realtor/target_realtor: import API or types not cleaned up
```

---

## Scope Notes — What Was Excluded

Per Adam's decisions, the following are explicitly NOT in this spec:
- `co_marketing_active`, `co_marketing_sent_count`, `co_marketing_last_sent_at` — not needed
- `preferred_contact_method` — not needed
- `outreach_cadence` column — cadence is derived from production_tier (A=weekly, B/rest=monthly)
- `last_outreach_channel` — too granular for now; activity_log already captures this

The following are deferred to a future session (not blocking Realtor System MVP):
- WF-R2 (Loan Milestone Update to Realtor) — gated on buyer_agent_contact_id population
- WF-R3 (Rate Update to Realtors) — integrates with existing Mailchimp rate update
- WF-R4 through WF-R8 — medium/low priority, defer until WF-R1 is live
- "Active Deal Partners" smart list via SQL JOIN — needs Supabase RPC, not client-side filter

---

## Summary

| Item | Status |
|------|--------|
| Migration 061 DDL | Specced — 9 new columns + 1 loans column + trigger |
| Boolean deprecation path | Specced — code cleanup + DROP COLUMN with sequence |
| Backfill SQL | Specced — 6 DML operations with verification queries |
| Smart lists (4) | Specced — Due for Outreach, Top Producers, Tier A Missing, Active Deal Partners |
| WF-R1 node map | Specced — modifies J9Pe24vUi6fpZtdZ, 5 new nodes, Outlook draft |
| Verification checklist | Included |
| HIGH RISK items | 2 flagged (boolean drop, backfill count check) |
| Builder questions | 0 — spec is self-contained |
