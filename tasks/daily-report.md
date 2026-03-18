# LoanOS Daily Report — 2026-03-17

## 🔴 Action Required

### Activity Gaps — Loans in Active Statuses, No Updates in 5+ Days
These are real files that need attention — not seed records:

| Borrower | Status | Action Needed |
|----------|--------|---------------|
| Patrick Rademacher | Loan in Process | Check file status in Arive |
| Dhaval Poladia | DISCLOSURE_SENT | Follow up — disclosures sent, awaiting signature? |
| Drew Benac | Loan in Process | Check file status in Arive |
| Chelsea Wise | RE_SUBMITTAL | Check UW re-submittal status |
| Unknown borrower (7f3ce5a8) | under_contract | No borrower name — check Arive |

### n8n Workflow Error — Arive Status Update → Supabase
- Workflow `9JyzzwKac8v3uQ7d` had a **webhook error on 2026-03-16 at 20:28 UTC**
- This means a status update from Arive may have failed to sync to Supabase
- Check n8n execution logs for details: https://styer.app.n8n.cloud
- Potentially affected: any loan whose Arive status changed around that time

---

## 🟡 Watch Items

### Unexpected Inactive Workflows
| Workflow | ID | Note |
|----------|----|------|
| LoanOS — Outlook Email Sync | `JMmstRl2C5ylmuIY` | Needs env vars before activation |
| LoanOS — Contract Received (duplicate) | `w7hZLmIcQ4izmndb` | Appears to be a duplicate — `UfNcdpoVKQZqy0fj` is the active version. Safe to delete? |

### console.log in API Routes (1 file)
- `src/app/api/mismo/parse/route.ts`

### Dark Theme Violations — bg-white / bg-gray-100 / text-gray-900 in Dashboard
- `src/app/dashboard/scenarios/ScenarioList.tsx`
- `src/app/dashboard/scenarios/new/StatementUpload.tsx`
- `src/app/dashboard/scenarios/new/ScenarioCard.tsx`

### Unused Components (16 files)
These are defined but never imported in `src/app/`:
- `src/components/SmartActionQueue.tsx`
- `src/components/EmailDraftPreview.tsx`
- `src/components/NavDropdown.tsx`
- `src/components/dashboard/PipelineCharts.tsx`
- `src/components/dashboard/RecentActivity.tsx`
- `src/components/dashboard/RecentLoans.tsx`
- `src/components/dashboard/DailyBriefingPanel.tsx`
- `src/components/dashboard/DailyScheduleWidget.tsx`
- `src/components/dashboard/TodoList.tsx`
- `src/components/dashboard/UrgentFlags.tsx`
- `src/components/dashboard/PipelineKPIs.tsx`
- `src/components/dashboard/PipelineSummary.tsx`
- `src/components/ActivityTimeline.tsx`
- `src/components/GlobalSearch.tsx`
- `src/components/outreach/QuickAddConfirmation.tsx`
- `src/components/outreach/BulkActionPreview.tsx`

---

## 🟢 All Clear

- **Stale loans**: None — all non-closed/funded loans updated within 3 days
- **Pending email drafts**: None sitting unsent 24h+
- **Active workflow coverage**: All core workflows active
  - Milestone Communication Agent ✅
  - Arive New Loan → Supabase ✅
  - Referral Intro Email ✅
  - Pre-Approval Email ✅
  - Final CD Email ✅
  - Contract Received ✅
  - Refi Intake Email ✅
  - New Application Received ✅
- **n8n manual test errors**: eJG4wckrj6SmSpm1 and AK1fBcaX1cPcdlGx showed errors today but both are intentionally inactive — errors were from manual tests, not live triggers

---

## Build

**Pass** — `npx tsc --noEmit` produced no errors.
