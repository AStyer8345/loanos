# Mission Brief — 2026-03-26 PM

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
