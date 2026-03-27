## Mission Brief — 2026-03-27 AM

### Domain
LoanOS CRM

### Focus Area
WF2 Enhancements: closing_date sync + contact current_rate/loan_balance auto-sync

### Session Type
[x] Execute / Build (Sequence C)

### Context Correction
Prior session notes referenced "migration 061: add lock_expiry_date column". This was incorrect.
Live schema audit confirms:
- `rate_lock_expiration` EXISTS in loans table — already synced by WF2 from Arive `lockExpirationDate`
- No new schema migration needed
- UI rate lock expiry warnings already built

### Objectives
1. Add `closing_date` to WF2 field sync — map from `keyDates_estimatedFundingDate`
2. Add contact current_rate/current_loan_balance auto-sync in WF2 — when funded/closed, PATCH borrower's contact record with interest_rate → current_rate and loan_amount → current_loan_balance
3. Verify WF2 still Active after update. Run npm run build (no TS changes expected).

### Definition of Done
- WF2 updated in n8n cloud with closing_date field + contact sync logic
- WF2 confirmed Active
- No regressions to existing WF2 field mappings

### Resources / Files in Scope
- n8n workflow ID: 9JyzzwKac8v3uQ7d (WF2 — Arive Status Update → Supabase)
- Supabase loans table: closing_date column
- Supabase contacts table: current_rate, current_loan_balance columns (added in migration 060)

### HIGH RISK Items
- Contact PATCH fires only on funded/closed status — NOT on every update
- All changes additive — no existing fields removed or altered
- Validate WF2 JSON before updating

---

# Mission Brief — 2026-03-26 AM (scheduled)

---

## Mission Brief — 2026-03-26 PM

## Domain
LoanOS CRM

## Focus Area
Contact Stage Data Integrity — Fix `getStageLabel` regression + investigate pagination cap

## Session Type
[x] Execute / Build (Sequence C)

## Background
The 2026-03-25 Enterprise PM session deleted `stageNormalization.ts` and replaced all
`normalizeStage()` calls with `getStageLabel()` from `loan-stages.ts`. This was correct
for loans but WRONG for contacts. `getStageLabel('Closed')` returns 'Funded / Closed'
(a loan display label), not 'Closed' (the canonical contact stage). Any contact whose stage
is updated via the UI or API after 2026-03-25 would have 'Funded / Closed' written to the DB,
making them invisible to the 'Closed Borrowers' smart list and causing stage data corruption.

The "Closed Borrowers" smart list showing 0 results (reported in prior session) is related:
the query `.in('stage', ['Closed'])` won't match contacts with `stage = 'Funded / Closed'`.

## Objectives
1. Add `normalizeContactStage()` to loan-stages.ts (recreate deleted contact normalization logic)
2. Fix all 4 affected files: contacts/page.tsx (3 sites), bulk-action/route.ts, quick-add/route.ts, import/contacts/route.ts
3. Verify npm run build passes
4. Investigate pagination cap — confirm whether it's a Supabase max_rows setting or frontend issue

## Definition of Done
- `normalizeContactStage('Closed')` returns 'Closed'
- `normalizeContactStage('Closed Client')` returns 'Closed'
- `normalizeContactStage('LOAN_FUNDED')` returns 'Closed'
- All 4 files use `normalizeContactStage` instead of `getStageLabel` for contact stage writes
- npm run build passes 0 TypeScript errors
- Pagination investigation complete with finding documented

## Resources / Files in Scope
- src/lib/constants/loan-stages.ts (add normalizeContactStage)
- src/app/dashboard/contacts/page.tsx (3 call sites)
- src/app/api/contacts/bulk-action/route.ts (1 call site)
- src/app/api/contacts/quick-add/route.ts (1 call site)
- src/app/api/import/contacts/route.ts (1 call site)

## HIGH RISK Items
- This touches all contact stage write paths. Do NOT change read paths or query logic.
- Do NOT change loan stage logic (getStageLabel is correct for loans).
- Do NOT alter any Supabase migration or schema.
- Existing contacts with stage = 'Closed' in DB are fine — only future writes were broken.

---

## Mission Brief — 2026-03-26 AM (automated scheduled session)

### Domain
LoanOS CRM

### Focus Area
1. COMPLIANCE: email_opt_out enforcement in n8n milestone email workflows
2. UX: "X of Y contacts" count indicator on contacts page
3. RESEARCH: Loan Pipeline Organization (next queue topic)

### Session Type
[x] Execute / Build (Tasks 1 + 2) — Sequence C
[x] Research + Planning (Task 3) — Sequence A

### Objectives
1. Ensure n8n Milestone Communication Agent checks email_opt_out before firing — 321 opted-out contacts are at compliance risk
2. Add "Showing X of Y contacts" indicator to contacts page — resolves pagination UX confusion
3. Research loan pipeline organization best practices for mortgage LOs

### Definition of Done
1. n8n Milestone Communication Agent updated with email_opt_out filter
2. "X of Y contacts" count appears on contacts page — npm run build passes
3. Research file written at tasks/crm/research/2026-03-26-loan-pipeline-organization.md

### Resources / Files in Scope
- n8n workflow: LoanOS — Milestone Communication Agent (ID: 1hjOmS7inZcxEJQr)
- src/app/(dashboard)/contacts/page.tsx
- src/app/api/contacts/route.ts (may need count query)

### HIGH RISK Items
- n8n workflow update: adding opt-out filter reduces sends (safe direction, never expands)
- Do NOT touch loan records, active borrower data, or schema
