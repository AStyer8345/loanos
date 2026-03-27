# Execution Report: Contact Stage Regression Fix
Date: 2026-03-26 PM

## What Was Executed

### Root Cause Identified
The 2026-03-25 Enterprise PM session deleted `stageNormalization.ts` and replaced all
`normalizeStage()` calls with `getStageLabel()`. This was correct for loans but broken
for contacts. `getStageLabel('Closed')` returns `'Funded / Closed'` (a loan display label).
`normalizeStage('Closed')` returned `'Closed'` (the canonical contact stage).

Impact: any contact stage updated via UI or API after 2026-03-25 would store 'Funded / Closed'
in the DB, making it invisible to the `applySmartList('closed')` filter which queries
`.in('stage', ['Closed'])`.

### Changes Made

**1. `src/lib/constants/loan-stages.ts`** — Added `normalizeContactStage()` function:
- Accepts any raw stage string (Salesforce raw, canonical, or null)
- If value is in CANONICAL_CONTACT_STAGES → returns as-is
- If value is a known alias (Closed Client, LOAN_FUNDED, etc.) → maps to canonical
- Otherwise → returns 'Other'
- Also maps 'Funded / Closed' → 'Closed' to auto-heal any records written by the bad commit

**2. `src/app/dashboard/contacts/page.tsx`** — 4 call sites fixed:
- Line 772: kanban drag stage write
- Line 807: inline stage badge click
- Line 836: bulk action stage update
- Line 888: new contact creation

**3. `src/app/api/contacts/bulk-action/route.ts`** — 1 call site fixed:
- Line 35: `update_stage` action

**4. `src/app/api/contacts/quick-add/route.ts`** — 1 call site fixed:
- Line 178: stage assignment from AI-extracted contact data

**5. `src/app/api/import/contacts/route.ts`** — 1 call site fixed:
- Line 44: stage normalization from CSV import row

## Record Counts
No DB records were modified. The regression was caught before any contact stage updates
occurred with the bad `getStageLabel` code (DB audit confirmed 0 contacts with non-canonical
stage values post-2026-03-25).

| Table | Before | After | Delta |
|-------|--------|-------|-------|
| contacts (stage = 'Closed') | 842 | 842 | 0 |
| contacts (stage corrupted) | 0 | 0 | 0 |

## Pagination Investigation

**Finding: the "500-record cap" is NOT a DB-level limit.**

Direct SQL query at OFFSET 500 with `organization_id = Adam's org` returns results correctly.
RLS policies do not cap row counts. Supabase PostgREST is not hitting a max_rows limit.

**Root cause of prior session observation:** With `CONTACTS_PAGE_SIZE = 100`, the initial load
shows 100 contacts. Each "Load More" click adds 100 more. The "500 contacts" observation was
likely from an initial session where Load More was clicked ~4 times, reaching 500. This is UX,
not a technical cap.

**Recommendation (not executing this session — Adam's input needed):** Display `counts[activeList]`
as a "X of Y contacts" indicator so Adam can see how many total contacts exist in the current
filter without clicking Load More repeatedly. This is a small UI addition.

## Build Result
`npm run build` — ✓ Compiled successfully (0 TypeScript errors, 62 static pages generated)

## Compliance Check
- GLBA: no financial data exposed or modified
- Janie access scope: unchanged (RLS policies not touched)
- Audit log: no contact records modified — no activity log entries needed
- Schema: no migrations applied

## Review Instructions for Reviewer
1. Verify `normalizeContactStage('Closed')` = 'Closed' (not 'Funded / Closed')
2. Verify `normalizeContactStage('Closed Client')` = 'Closed'
3. Verify `normalizeContactStage('Lead')` = 'Lead' (passthrough)
4. Verify no `getStageLabel` references remain in contact write paths:
   `grep -r "getStageLabel" src/app/dashboard/contacts/ src/app/api/contacts/ src/app/api/import/contacts/`
   → should return no results
5. Confirm build passes: `npm run build`
