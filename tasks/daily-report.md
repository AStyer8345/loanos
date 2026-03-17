# LoanOS Daily Report — 2026-03-16

## 🔴 Action Required

### Workflow Failures — Needs Fix

**Arive Status Update → Supabase** (`9JyzzwKac8v3uQ7d`) — 3 errors today
- Error: `null value in column "new_status" of relation "loan_status_history" violates not-null constraint`
- Arive is sending status updates where the status field is blank/null. The `loan_status_history` INSERT needs a null guard or the workflow needs to skip the history insert when new_status is empty.

**Contract Received** (`UfNcdpoVKQZqy0fj`) — 1 error today
- Error: `fetch is not defined [line 19]`
- A Code node in this workflow uses `fetch()` which is not available in n8n's node environment. Needs to be replaced with the HTTP Request node or `$http` helper.

### Stale Loans (not updated in 3+ days, active status)

| Borrower | Status | Last Updated |
|----------|--------|-------------|
| David Kloster | Started | 2026-03-12 |
| Jackson Harris | Started | 2026-03-12 |
| Drew Benac | Loan in Process | 2026-03-12 |
| David Annen | Started | 2026-03-10 (4 duplicate records) |
| Colin Recko | Started | 2026-03-10 |

Note: David Annen has 4 separate loan records in the DB — possible duplicate issue worth cleaning up.

### Active Pipeline — No Activity in 5+ Days

These loans are in active/in-process statuses but have zero activity log entries in the last 5 days:

| Borrower | Status |
|----------|--------|
| (unnamed) | under_contract |
| Dhaval Poladia | DISCLOSURE_SENT |
| Kyle Jennings | UNDERWRITING_SUBMITTED |
| Chelsea Wise | RE_SUBMITTAL |
| Drew Benac | Loan in Process |
| Patrick Rademacher | Loan in Process |

(49 of 73 active loans have no recent activity — most are "Started"/"On Hold" pre-pipeline leads, but the 6 above are in active processing stages and need attention.)

---

## 🟡 Watch Items

### Inactive Workflows (unexpected)

- **LoanOS — Contract Received** (`w7hZLmIcQ4izmndb`) — INACTIVE. Appears to be an old/duplicate version of the Contract Received workflow. The active version is `UfNcdpoVKQZqy0fj`. Safe to archive if confirmed.
- **LoanOS — Outlook Email Sync** (`JMmstRl2C5ylmuIY`) — INACTIVE (known: needs Outlook credential env vars)

### Code Quality

**console.log in API routes (1):**
- `src/app/api/mismo/parse/route.ts`

**Dark theme violations — bg-white/bg-gray-100/text-gray-900 in dashboard (3 files):**
- `src/app/dashboard/scenarios/ScenarioList.tsx`
- `src/app/dashboard/scenarios/new/StatementUpload.tsx`
- `src/app/dashboard/scenarios/new/ScenarioCard.tsx`

**Unused components (16 unique):**
- `ActivityFeed.tsx`, `ActivityTimeline.tsx`, `EmailDraftPreview.tsx`, `GlobalSearch.tsx`, `NavDropdown.tsx`, `NavItem.tsx`
- `dashboard/DailyBriefingPanel.tsx`, `PipelineCharts.tsx`, `PipelineKPIs.tsx`, `PipelineSummary.tsx`, `RecentActivity.tsx`, `RecentLoans.tsx`, `TodoList.tsx`, `UrgentFlags.tsx`
- `outreach/BulkActionPreview.tsx`, `QuickAddConfirmation.tsx`

---

## 🟢 All Clear

- **Pending email drafts** — 0 stuck drafts
- **TypeScript build** — PASS, no errors
- **Core workflows active** — Milestone Agent, Arive New Loan, Referral Intro, Pre-Approval, Final CD, New Application, Refi Intake, Inbound Email Sync all active

---

## Build

**Pass** — `npx tsc --noEmit` returned 0 errors
