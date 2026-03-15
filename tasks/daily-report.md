# LoanOS Daily Report — 2026-03-14

## 🔴 Action Required

### n8n — Arive Status Update Workflow Failing
- Workflow: `LoanOS — Arive Status Update → Supabase` (`9JyzzwKac8v3uQ7d`)
- 2 errors today: executions #168 (22:51 UTC) and #170 (22:54 UTC)
- This pipeline syncs Arive loan status changes into Supabase — failures mean status updates from Arive won't reflect in LoanOS
- **Action**: Check n8n execution logs for root cause and fix

### Stale Active Loans (41 total, not updated since 2026-03-10)
Key loans in active statuses with no update in 4+ days:

| Borrower | Status |
|----------|--------|
| Kyle Jennings | Loan in Process |
| Martin Cuilla | Started |
| Giulia Lewers | processing |
| Loren Mesta | processing |
| Jay Shapiro | processing |
| Debbie Johnson | processing |
| Kevin Spotts | processing |
| Kyle Stavar | processing |
| David Reed | processing |
| Andrew Andress | processing |
| Colin Recko | Started |
| Matthew Ikenberry | Suspended |

> Most "Started" records appear to be batch-seeded test data from 2026-03-10. "processing" and "Loan in Process" statuses are the priority to review.

**David Annen duplicates** — 5 loan records with the same name and "Started" status. Likely seeded test data; worth cleaning up.

### Activity Gaps — All Active Loans Silent
All 8 key in-process loans have **0 activity log entries** in the past 5 days:
- Dhaval Poladia (In Process)
- Kenneth Turner (In Process)
- Kyle Jennings (Loan in Process)
- Drew Benac (Loan in Process)
- Chelsea Wise (Loan in Process)
- Patrick Rademacher (Loan in Process)
- Farinaz Pisheh (QUALIFICATION)
- Andrew Mcneese (RE_SUBMITTAL)

This may indicate the activity_log pipeline is broken, or these are all seeded records with no real loan events.

---

## 🟡 Watch Items

### Review Request Email — Active but Erroring Repeatedly
- Workflow: `Closed Loan — Review Request Email` (`AK1fBcaX1cPcdlGx`)
- Shows as **ACTIVE** in n8n (memory marks it "Fixed, inactive" — discrepancy)
- 3 trigger errors today: executions #172, #173, #175 (23:00–00:00 UTC)
- **Action**: Deactivate this workflow if it's not ready, or investigate and fix the trigger error

### Unexpected Inactive Workflows
| Workflow | ID | Notes |
|----------|-----|-------|
| LoanOS — Outlook Email Sync | `JMmstRl2C5ylmuIY` | Expected — needs env vars per memory |
| LoanOS — Contract Received (duplicate) | `w7hZLmIcQ4izmndb` | Different ID from active `UfNcdpoVKQZqy0fj`. Likely stale duplicate — safe to delete |

### Unused Components (src/components/)
- `ActivityFeed.tsx` — 0 imports in src/app
- `GlobalSearch.tsx` — 0 imports in src/app
- `NavDropdown.tsx` — 0 imports in src/app
- `NavItem.tsx` — 0 imports in src/app

### Dark Theme Violation
- `src/app/dashboard/automations/page.tsx` uses hardcoded light colors (`bg-white`, `bg-gray-100`, or `text-gray-900`)

---

## 🟢 All Clear

- No pending email drafts older than 24h
- No `console.log` statements in `src/app/api/`
- Core active workflows running: Milestone Agent, Arive New Loan → Supabase, Final CD Email, Contract Received (`UfNcdpoVKQZqy0fj`), Referral Intro, New Application Received, Pre-Approval Email, Refi Intake Email

---

## Build

**FAIL** — 2 TypeScript errors

```
error TS2688: Cannot find type definition file for 'json5 2'
error TS2688: Cannot find type definition file for 'react-dom 2'
```

These are type definition naming errors (likely a tsconfig `types` array issue with duplicate/stale entries), not runtime bugs. Low risk but should be cleaned up.
