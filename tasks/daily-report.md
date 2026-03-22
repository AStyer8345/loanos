# LoanOS Daily Report — 2026-03-21

## 🔴 Action Required

### Stale Active Loans (65 loans not updated in 3+ days)
High-priority loans that need attention:

| Borrower | Status | Last Updated |
|----------|--------|--------------|
| Farinaz Pisheh | DISCLOSURE_SENT | 2026-03-17 |
| Patrick Rademacher | Loan in Process | 2026-03-17 |
| Andrew Mcneese | CLEAR_TO_CLOSE | 2026-03-17 |
| Travis Coleman | clear_to_close | 2026-03-18 |
| Jessica Holt | clear_to_close | 2026-03-17 |
| Linda Okafor | clear_to_close | 2026-03-17 |
| Kenneth Turner | UNDERWRITING_SUBMITTED | 2026-03-17 |
| Kyle Jennings | RE_SUBMITTAL | 2026-03-18 |
| Dhaval Poladia | UNDERWRITING_SUBMITTED | 2026-03-17 |
| Chelsea Wise | CLEAR_TO_CLOSE | 2026-03-17 |
| Drew Benac | Loan in Process | 2026-03-17 |
| Ryan Nguyen | underwriting | 2026-03-17 |
| Priya Nair | underwriting | 2026-03-17 |
| Derek Cho | underwriting | 2026-03-17 |
| Lauren Simmons | underwriting | 2026-03-17 |
| Maria Gutierrez | processing | 2026-03-17 |
| Monica Castillo | processing | 2026-03-17 |
| Scott Tillman | processing | 2026-03-18 |
| David Park | processing | 2026-03-17 |

Plus 46 additional stale loans in lead/application/pre_approved/Started/On Hold status.

### n8n Workflow Error (last 24h)
- **LoanOS — Final CD Email** (`SkzrWeR0bHZs8kWX`) — execution error at 2026-03-21 02:10 UTC
  → Check n8n execution logs for root cause

### Inactive Workflows (not in intentional inactive list)
- **LoanOS — Outlook Email Sync** (`JMmstRl2C5ylmuIY`) — inactive (needs Outlook credential)
- **LoanOS — Contract Received** (`w7hZLmIcQ4izmndb`) — inactive duplicate (superseded by `UfNcdpoVKQZqy0fj`)

---

## 🟡 Watch Items

### Activity Gaps (62 of 72 active loans have no activity_log entry in 5+ days)
Most of the pipeline has no recent activity logged. Either:
- Loans are genuinely idle (older "Started" / "On Hold" entries from Arive import), or
- Activity log is not being written consistently for all status changes

Notable active-stage loans with no logged activity:
- Andrew Mcneese | CLEAR_TO_CLOSE
- Travis Coleman | clear_to_close
- Jessica Holt | clear_to_close
- Linda Okafor | clear_to_close
- Kenneth Turner | UNDERWRITING_SUBMITTED
- Kyle Jennings | RE_SUBMITTAL

### Console.log Statements in API Routes (2 files)
- `src/app/api/arive-webhook/route.ts`
- `src/app/api/mismo/parse/route.ts`

### Unused Components (10 files)
Not imported anywhere in `src/app/`:
- `SmartActionQueue.tsx`
- `EmailDraftPreview.tsx`
- `NavDropdown.tsx`
- `dashboard/DailyBriefingPanel.tsx`
- `dashboard/DailyScheduleWidget.tsx`
- `ActivityTimeline.tsx`
- `GlobalSearch.tsx`
- `outreach/QuickAddConfirmation.tsx`
- `outreach/BulkActionPreview.tsx`
- `NavItem.tsx`

### Dark Theme Violations (3 files in dashboard)
Files using `bg-white`, `bg-gray-100`, or `text-gray-900`:
- `src/app/dashboard/scenarios/ScenarioList.tsx`
- `src/app/dashboard/scenarios/new/StatementUpload.tsx`
- `src/app/dashboard/scenarios/new/ScenarioCard.tsx`

---

## 🟢 All Clear

- **Pending email drafts**: None — no drafts sitting unsent for 24h+
- **TypeScript build**: ✅ Pass — `npx tsc --noEmit` returned no errors
- **Core n8n workflows**: All primary LoanOS workflows active (Arive sync, milestone agent, pre-approval, referral intro, refi intake, inbound email, web lead, contract received, final CD)

---

## Build
**Pass** — 0 TypeScript errors
