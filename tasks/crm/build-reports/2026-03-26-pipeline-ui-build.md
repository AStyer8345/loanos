# Build Report: Pipeline UI Enhancements
Date: 2026-03-26 (PM session)
Status: COMPLETE ✅

---

## What Was Built

### 1. "Closing This Week" stat in summary bar
- **File**: `src/app/dashboard/loans/page.tsx`
- **Location**: Stats bar (line ~920)
- **Logic**: Counts loans in the current filtered view with `daysUntilClose(closing_date)` between 0 and 7
- **Display**: Shows count in amber if > 0, white if 0
- **Always visible** when filtered list has any loans

### 2. "Last Milestone" column (opt-in)
- **Files modified**: `src/app/dashboard/loans/page.tsx` (5 change points)
- **How it works**:
  1. Query now fetches `loan_milestone_events!loan_id(created_at)` alongside each loan
  2. `flattenLoans()` reduces the events array to the most recent `created_at` (sorted ISO string → `.pop()`)
  3. `fmtRelativeDate()` helper converts to human-readable relative time ("today", "3 days ago", "2w ago", etc.)
  4. Column renders amber if last milestone > 30 days ago (surfaces neglected loans)
- **Column is opt-in** — not in DEFAULT_LOAN_COLUMNS, user adds via COLUMNS picker
- **Milestone events are already tracked** — `loan_milestone_events` table populated by n8n WF1/milestone route

## Pre-existing Features Confirmed (no duplication)
- `daysUntilClose()` and `closingUrgencyStyle()` were already built — row highlighting and countdown label were live
- Summary bar (Total Loans, Volume, Commission) already existed — added "Closing This Week" as 4th stat
- Rate lock expiration column with EXPIRED/warning colors — already built

## TypeScript
- Build: `npm run build` — PASS (0 errors)
- Added `last_milestone_at?: string | null` to `Loan` interface
- `fmtRelativeDate()` added as pure helper function

## Schema Changes
None — `loan_milestone_events` table exists and is populated by existing workflows.

## Records Migrated
0 — UI-only changes

## n8n Workflows Updated
0
