# LoanOS Daily Report — 2026-03-18

## 🔴 Action Required

### n8n Production Workflow Error
- **Workflow:** `9JyzzwKac8v3uQ7d` — LoanOS — Arive Status Update → Supabase
- **Execution #313** failed via webhook on 2026-03-16 (yesterday)
- This is a live production webhook (not a manual test) — investigate what Arive payload triggered it

### Activity Gaps — Active Pipeline Loans (5+ days, no log entries)
These are real loans in mid-process states with no activity_log entry in the last 5 days:

| Borrower | Status | Loan ID |
|----------|--------|---------|
| Patrick Rademacher | Loan in Process | b3ad0f2c |
| Dhaval Poladia | DISCLOSURE_SENT | 2e8f14c4 |
| Chelsea Wise | RE_SUBMITTAL | 348ea1c1 |
| (no name) | under_contract | 7f3ce5a8 |

---

## 🟡 Watch Items

### n8n — Unexpected Inactive Workflows
| Workflow ID | Name | Notes |
|-------------|------|-------|
| `JMmstRl2C5ylmuIY` | LoanOS — Outlook Email Sync | Known — needs env vars configured |
| `w7hZLmIcQ4izmndb` | LoanOS — Contract Received (duplicate) | Old/stale version — `UfNcdpoVKQZqy0fj` is the active one. Safe to archive. |

### Code Quality
- **`console.log` in API routes:** 1 file — `src/app/api/mismo/parse/route.ts`
- **Dark theme violations** (`bg-white`, `bg-gray-100`, `text-gray-900`) in:
  - `src/app/dashboard/scenarios/ScenarioList.tsx`
  - `src/app/dashboard/scenarios/new/StatementUpload.tsx`
  - `src/app/dashboard/scenarios/new/ScenarioCard.tsx`

### Unused Components (7 files — never imported in `src/app/`)
`ActivityFeed`, `ActivityTimeline`, `EmailDraftPreview`, `GlobalSearch`, `NavDropdown`, `NavItem`, `SmartActionQueue`

### Seed Loan Activity Gaps
40+ loans in "Started" / "On Hold" status with no activity in 5+ days — mostly seed/test data (identifiable by `a0000000-...` ID pattern). Low urgency, but worth periodically pruning test data.

---

## 🟢 All Clear

- **Stale loans:** 0 — no active loans stuck without an update in 3+ days
- **Pending email drafts:** 0 — no drafts sitting unsent 24h+
- **n8n core workflows:** 8 of 8 expected workflows active (`Milestone Agent`, `Arive New Loan → Supabase`, `Pre-Approval Email`, `Referral Intro`, `Final CD Email`, `Contract Received`, `New Application Received`, `Refi Intake Email`)
- **Execution errors from `eJG4wckrj6SmSpm1` and `AK1fBcaX1cPcdlGx`** are manual test runs on intentionally-inactive workflows — not production issues

---

## Build

**Pass** — `npx tsc --noEmit` completed with 0 errors
