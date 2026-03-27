# Spec: Contact Schema Improvement
Date: 2026-03-27
Status: APPROVED — All 8 Adam decisions collected
Session: Architect → Builder

---

## Background

Research (`2026-03-25-contact-data-architecture.md`) identified 8 blocking decisions required before the contacts schema could be improved. Adam answered all 8 on 2026-03-27. This spec documents each decision, the resulting schema change, and the implementation plan.

---

## Adam's Decisions (verbatim → interpreted)

| # | Question | Adam's Answer | Schema Action |
|---|----------|---------------|---------------|
| 1 | Phone field consolidation | "One phone field — put everything into phone" | DML: copy phone_mobile/home_phone → phone where phone is null. Keep columns (don't drop), hide from UI |
| 2 | Realtor stage system | "Separate stage system: Active Partner, Prospecting, Lead" | ADD `realtor_stage` text column with CHECK constraint |
| 3 | contact.closing_date deprecation | "Deprecate — always pull from most recent loan" | Hide `closing_date` from contact UI. No schema drop. |
| 4 | Past client refi trigger | "Store on both contact and loan; auto-pull from Arive sync" | ADD `current_rate` numeric(5,3) and `current_loan_balance` numeric(12,2) to contacts |
| 5 | do_not_call | "Yes, add it now" | ADD `do_not_call` boolean NOT NULL DEFAULT false |
| 6 | Realtor production tiers | "Single production_tier field, A/B/C" | ADD `production_tier` text with CHECK('A','B','C'). Backfill: top_realtor=true → 'A', target_realtor=true (only) → 'B'. Keep boolean columns, hide from UI. |
| 7 | last_touch_at backfill | "Leave it null" | No action |
| 8 | realtor_email/realtor_phone cleanup | "Yes, clean those up and hide the fields" | DML: NULL out realtor_email/realtor_phone on the 1 sample contact. Hide both fields from UI. |

---

## Pre-Migration Data Audit (live DB — 2026-03-27)

### Phone Consolidation
| Situation | Count |
|-----------|-------|
| phone_mobile only (no phone) | 1 → copy to phone |
| phone_mobile + phone (both) | 8 → phone already set; discard phone_mobile |
| home_phone only (no phone) | 105 → copy to phone |
| home_phone + phone (both) | 94 → phone already set; discard home_phone |
| **Net phone updates** | **106 records** |

### realtor_email / realtor_phone
- 1 record: Dwayne Johnson (SAMPLE) — borrower contact with realtor_email/realtor_phone filled (data entry error)
- Action: NULL both fields on that record

### production_tier Backfill
| Source booleans | Count | Maps to |
|-----------------|-------|---------|
| top_realtor=true AND target_realtor=true | 33 | 'A' |
| top_realtor=true AND target_realtor=false | 81 | 'A' |
| top_realtor=false AND target_realtor=true | 6 | 'B' |
| Neither | rest | NULL |

---

## Migration 060: Schema + Data Changes

### DDL Changes (additive only — no drops)
```sql
-- New columns
ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS do_not_call         BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS production_tier     TEXT CHECK (production_tier IN ('A','B','C')),
  ADD COLUMN IF NOT EXISTS realtor_stage       TEXT CHECK (realtor_stage IN ('Active Partner','Prospecting','Lead')),
  ADD COLUMN IF NOT EXISTS current_rate        NUMERIC(5,3),
  ADD COLUMN IF NOT EXISTS current_loan_balance NUMERIC(12,2);
```

### DML: Phone Consolidation
```sql
-- Copy phone_mobile → phone where phone is null
UPDATE contacts SET phone = phone_mobile, updated_at = NOW()
WHERE phone_mobile IS NOT NULL AND phone IS NULL;

-- Copy home_phone → phone where phone is null
UPDATE contacts SET phone = home_phone, updated_at = NOW()
WHERE home_phone IS NOT NULL AND phone IS NULL;
```

### DML: production_tier Backfill
```sql
UPDATE contacts
SET production_tier = 'A', updated_at = NOW()
WHERE top_realtor = true;

UPDATE contacts
SET production_tier = 'B', updated_at = NOW()
WHERE top_realtor = false AND target_realtor = true AND production_tier IS NULL;
```

### DML: realtor_email/realtor_phone Cleanup
```sql
UPDATE contacts
SET realtor_email = NULL, realtor_phone = NULL, updated_at = NOW()
WHERE realtor_email IS NOT NULL OR realtor_phone IS NOT NULL;
```

---

## UI Changes

### Fields to hide (keep in DB, remove from all contact forms/views):
- `home_phone` — consolidated into phone
- `phone_mobile` — consolidated into phone
- `realtor_email` — dead field, cleared
- `realtor_phone` — dead field, cleared
- `top_realtor` — replaced by production_tier
- `target_realtor` — replaced by production_tier
- `closing_date` (contact-level) — derived from loan
- `title` — 0% populated, irrelevant
- `account_name` — SF legacy
- `contact_group` — duplicate of group_tag
- `mailing_country` — 100% domestic
- `salesforce_created_date` — migration artifact

### New fields to add to UI:
- `do_not_call` — boolean toggle on contact edit form (all types)
- `production_tier` — A/B/C badge select (realtor only)
- `realtor_stage` — dropdown (realtor only): Active Partner / Prospecting / Lead
- `current_rate` — numeric input (borrower only, labeled "Current Rate")
- `current_loan_balance` — numeric input (borrower only, labeled "Current Balance")

---

## Risks & Rollback

- All schema changes are additive (ADD COLUMN) — zero risk of data loss
- Phone DML only writes to contacts where phone IS NULL — no existing phone values overwritten
- production_tier DML: top_realtor=true → 'A' is conservative; may need Adam to refine C-tier manually
- realtor_email/realtor_phone DML: only 1 record affected (sample/test contact)
- Rollback: SET the new columns to NULL; restore old column visibility in UI

---

## Out of Scope (future spec)
- `last_loan_closed_date` computed field — needs loan JOIN
- `last_referral_date` / `total_referrals_sent` — needs referral tracking table
- `current_rate` / `current_loan_balance` auto-sync from Arive via WF2 — WF2 update is a separate build item
- Dedicated "Janie view" for contacts
- Removing/dropping old boolean columns (top_realtor, target_realtor) — deferred until production_tier is in production use for 30+ days
