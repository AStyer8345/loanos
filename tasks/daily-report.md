# LoanOS Daily Report — 2026-03-19

## 🔴 Action Required

### n8n Execution Errors — Arive New Loan → Supabase (`1tagvoU0UXtdDiMY`)
4 errors fired today in rapid succession:
- Execution 572 — 19:36:14 UTC
- Execution 568 — 19:31:13 UTC
- Execution 566 — 19:31:01 UTC
- Execution 564 — 19:29:15 UTC

All 4 errored within a ~7-minute window. Likely a bad Arive webhook payload or Supabase schema mismatch. Workflow is still active but failing on every trigger. **Check the n8n execution log for the error message.**

### n8n Execution Error — Pre-Approval Email (`utMvZpkdRwIRZ51u`)
- Execution 559 — 19:35:37 UTC (today)

Single error. May be a bad payload or missing field. **Review execution 559 in n8n.**

---

## 🟡 Watch Items

### n8n — Unexpected Inactive Workflows
| Workflow ID | Name | Notes |
|-------------|------|-------|
| `JMmstRl2C5ylmuIY` | LoanOS — Outlook Email Sync | Known — needs Outlook env vars configured |
| `w7hZLmIcQ4izmndb` | LoanOS — Contract Received (duplicate) | Old/stale version — `UfNcdpoVKQZqy0fj` is the active one. Safe to archive. |

### Code Quality
- **`console.log` in API routes:** 1 file — `src/app/api/mismo/parse/route.ts`
- **Dark theme violations** (`bg-white`, `bg-gray-100`, `text-gray-900`) in:
  - `src/app/dashboard/scenarios/ScenarioList.tsx`
  - `src/app/dashboard/scenarios/new/StatementUpload.tsx`
  - `src/app/dashboard/scenarios/new/ScenarioCard.tsx`

### Unused Components (never imported in `src/app/`)
`ActivityTimeline`, `EmailDraftPreview`, `GlobalSearch`, `NavDropdown`, `NavItem`, `SmartActionQueue`, `dashboard/DailyBriefingPanel`, `dashboard/DailyScheduleWidget`, `dashboard/TodoList`, `outreach/BulkActionPreview`, `outreach/QuickAddConfirmation`

---

## 🟢 All Clear

- **Stale loans:** 0 — all 93 active loans updated within the last 2 days
- **Pending email drafts:** 0 — no drafts sitting unsent 24h+
- **Activity log:** Pisheh, Rademacher, Mcneese all have entries in the last 5 days
- **TypeScript build:** PASS — 0 errors
- **Weekly Social Post** (`eJG4wckrj6SmSpm1`): Now showing as active (memory had it as "Fixed, inactive" — update memory if this was intentional)

---

## Build

**Pass** — `npx tsc --noEmit` completed with 0 errors
