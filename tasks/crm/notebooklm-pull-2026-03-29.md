# NotebookLM Pull Report — CRM — 2026-03-29 AM
Active Topic: Realtor Relationship System — Architecture Spec

## What We Already Know

LoanOS holds 1,060 realtor contacts. The schema is mid-migration: legacy `top_realtor`/`target_realtor`
boolean flags coexist with the new `production_tier` (A/B/C) column added in migration 060.
Referral attribution is broken — `referred_by` on the contacts table stores plain text names,
not UUID foreign keys, making it impossible to join referral volume to realtor records via SQL.
Crystal Kilpatrick has sent 53 referrals (5x the next producer) and is untiered.
`realtor_stage` column exists but has 0 rows populated. `last_touch_at` is populated on only 15 of
1,060 realtor records. Zero automated touchpoints currently reach any realtor.

## LoanOS Contact Schema (current state — post migration 060)

Key columns added in migration 060 (applied 2026-03-27):
- `do_not_call` BOOLEAN DEFAULT false — TCPA compliance gate
- `production_tier` TEXT CHECK ('A','B','C') — replaces top_realtor/target_realtor booleans
- `realtor_stage` TEXT CHECK ('Active Partner','Prospecting','Lead') — 0 rows populated
- `current_rate` NUMERIC(5,3) — borrower refi scoring
- `current_loan_balance` NUMERIC(12,2) — borrower refi scoring

Still present / legacy:
- `top_realtor` BOOLEAN — still in database.types.ts and import API
- `target_realtor` BOOLEAN — still in database.types.ts and import API
- `referred_by` TEXT — deeply embedded in UI (default column, bulk action, link rendering)
- `last_touch_at` TIMESTAMPTZ — populated on 15 of 1,060 realtors; no auto-update trigger

## Supabase Schema Decisions (confirmed)

- Adam confirmed all 7 realtor architecture questions (answered 2026-03-28 at 18:45Z):
  1. `referred_by` → add UUID FK `referred_by_contact_id` (keep text field for now)
  2. Deprecate `top_realtor`/`target_realtor` booleans (code cleanup required before DB drop)
  3. `last_touch_at` = auto-tracked via trigger, not manual
  4. Crystal Kilpatrick = Tier A (backfill her record)
  5. Cadence: A=weekly, B=monthly, untiered=monthly (no separate cadence column needed)
  6. No co-marketing fields
  7. No preferred_contact_method field

## n8n Automation Status

- All 15 core workflows confirmed Active (verified 2026-03-27 PM)
- Zero realtor-facing workflows exist
- email_opt_out enforcement: complete in milestone route.ts + Review Request + Referral Intro (2026-03-28 AM)
- Automation Coverage Audit: all 4 Adam questions answered — builder sequence fully unblocked
  - Q1: drip=manual (no auto-enrollment)
  - Q2: WF2=Arive handles milestone emails (no WF2 changes)
  - Q3: review=Arive fund event
  - Q4: rate=compare to rate update email
- First realtor workflow to build: WF-R1 (Referral Thank-You) — no schema dependency

## Open Questions

None blocking architecture. Builder may need to decide:
- Whether to set untiered realtors' `realtor_stage` to 'Lead' or leave NULL during backfill
- Whether to backfill `loans.referral_contact_id` or defer until referred_by FK is cleaned up

## Briefing for Architect Subagent

Do NOT re-research:
- Whether to use UUID FK vs text for referred_by — DECIDED: add `referred_by_contact_id` UUID FK
- Whether to drop boolean flags — DECIDED: deprecate (code cleanup first)
- Whether to add co-marketing fields — DECIDED: no
- Whether to add preferred_contact_method — DECIDED: no
- Outreach cadence design — DECIDED: derived from production_tier (A=weekly, B/rest=monthly)

Focus spec on:
- Exact DDL + DML for migration 061
- Boolean deprecation path (code cleanup steps + DROP COLUMN)
- `last_touch_at` auto-update trigger
- `buyer_agent_contact_id` / `referred_by_contact_id` backfill SQL
- Smart list definitions using new columns
- WF-R1 build plan (n8n workflow spec)
