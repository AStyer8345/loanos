# NotebookLM Pull Report — CRM — 2026-03-27 AM
Active Topic: Loan Pipeline + Contact Data (lock_expiry_date, WF2 updates, contact sync)

## What We Already Know
- LoanOS is the live CRM: 2,331 contacts, 817+ loans
- `rate_lock_expiration` column EXISTS in loans table — already synced by WF2 from Arive `lockExpirationDate`
- No `lock_expiry_date` column needed — `rate_lock_expiration` is the canonical column
- Rate lock expiry UI warnings (amber/red badges) already built in loans/page.tsx
- WF2 already stamps `organization_id` via `Get Org ID` node
- WF2 maps `est_closing_date` from `keyDates_estimatedFundingDate` but NOT `closing_date`
- Migration 060 added `current_rate`, `current_loan_balance`, `do_not_call`, `production_tier`, `realtor_stage` to contacts

## LoanOS Contact Schema (current state)
- New columns added (migration 060): current_rate NUMERIC(5,3), current_loan_balance NUMERIC(12,2), do_not_call BOOLEAN, production_tier TEXT, realtor_stage TEXT
- Phone fields consolidated: phone_mobile/home_phone data migrated to phone
- email_opt_out: 321 contacts (13.5%) opted out — now enforced in milestone route

## Supabase Schema Decisions (loans table relevant to today)
- `rate_lock_expiration` DATE — EXISTS, synced by WF2
- `closing_date` DATE — EXISTS but NOT synced by WF2 (gap)
- `est_closing_date` DATE — EXISTS, synced from keyDates_estimatedFundingDate
- `interest_rate` NUMERIC — EXISTS, synced by WF2
- `loan_amount` NUMERIC — EXISTS, synced by WF2

## n8n Automation Status
- WF2 (9JyzzwKac8v3uQ7d) — Active. Maps 80+ Arive fields. Stamps org_id. Does NOT map closing_date to loans. Does NOT sync current_rate/balance to contacts.
- WF1 (1tagvoU0UXtdDiMY) — Active (status per MEMORY.md)
- 5 other workflows active (communication/email workflows)

## Open Questions
- What Arive field maps to bare `closing_date` (not estimated)? Need to check raw_payload.
- Should contact current_rate/balance sync happen on every status update, or only on funded/closed?

## Briefing for Builder Subagent
Do NOT re-research rate_lock_expiration — it already exists and works.
Do NOT write migration 061 — no new schema columns needed.
Focus new work on:
1. Add `closing_date` mapping to WF2 (find correct Arive field name from raw_payload)
2. Add `current_rate`/`current_loan_balance` sync from loan to contact in WF2 (on status update)
