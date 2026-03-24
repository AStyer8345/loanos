# LoanOS Daily Report — 2026-03-23

## 🔴 Action Required

### Stale Pipeline Loans (not updated 3+ days)
These active loans haven't moved in Supabase since 2026-03-17 or 2026-03-18:

| Borrower | Status | Last Updated |
|----------|--------|--------------|
| Farinaz Pisheh | DISCLOSURE_SENT | 2026-03-17 |
| Patrick Rademacher | Loan in Process | 2026-03-17 |
| Andrew Mcneese | CLEAR_TO_CLOSE | 2026-03-17 |
| Travis Coleman | clear_to_close | 2026-03-18 |
| Maria Gutierrez | processing | 2026-03-17 |
| Monica Castillo | processing | 2026-03-17 |
| Jessica Holt | clear_to_close | 2026-03-17 |
| Ryan Nguyen | underwriting | 2026-03-17 |
| Dhaval Poladia | UNDERWRITING_SUBMITTED | 2026-03-17 |
| Scott Tillman | processing | 2026-03-17 |
| Chelsea Wise | CLEAR_TO_CLOSE | 2026-03-17 |
| Kenneth Turner | UNDERWRITING_SUBMITTED | 2026-03-17 |
| Kyle Jennings | CLEAR_TO_CLOSE | 2026-03-17 |
| Drew Benac | Loan in Process | 2026-03-17 |

> CTC loans especially (Mcneese, Coleman, Holt, Okafor, Wise, Jennings) should be moving fast — if these haven't closed, they need attention today.

### Activity Gaps — No activity_log entries in 5+ days
These loans have zero activity log entries since 2026-03-18:
- Farinaz Pisheh (DISCLOSURE_SENT)
- Andrew Mcneese (CLEAR_TO_CLOSE)
- Travis Coleman (clear_to_close)
- Maria Gutierrez (processing)
- Monica Castillo (processing)
- Jessica Holt (clear_to_close)
- Ryan Nguyen (underwriting)
- Scott Tillman (processing)
- Kenneth Turner (UNDERWRITING_SUBMITTED)
- Priya Nair (underwriting)
- Derek Cho (underwriting)
- Lauren Simmons (underwriting)
- Linda Okafor (clear_to_close)

> Likely these are seed/demo loans that have never had real activity logged. If any are real borrowers, automation isn't firing for them.

### n8n — Unexpected Error Executions Today
These workflows fired and errored on 2026-03-23 despite being marked inactive:

| Workflow | ID | Time (UTC) | Note |
|----------|----|------------|------|
| Outlook Email Sync | JMmstRl2C5ylmuIY | 21:54–22:00 (×3) | Inactive — needs Outlook credential. Something triggered it 3x. |
| Review Request Email | AK1fBcaX1cPcdlGx | 21:54 | Marked "Fixed, inactive" — still erroring |
| Weekly Social Post | eJG4wckrj6SmSpm1 | 14:00 | Marked "Fixed, inactive" — still erroring |

> Inactive workflows shouldn't be firing repeatedly. Check if something is triggering the webhook for Outlook Email Sync. The two "Fixed, inactive" workflows may have a cron trigger that still fires even when inactive — worth disabling the trigger nodes.

---

## 🟡 Watch Items

### n8n — Unexpectedly Inactive Workflows
| Workflow | ID | Expected? |
|----------|----|-----------|
| Outlook Email Sync | JMmstRl2C5ylmuIY | Known — needs Outlook credential first |
| Contract Received | w7hZLmIcQ4izmndb | Phase 2 — intentionally inactive, but not in the audit's known-inactive list |

> `w7hZLmIcQ4izmndb` (Contract Received) is a workflow ID not in the memory index — may have been recreated. Confirm this is the correct Phase 2 workflow and add to the known-inactive list.

### console.log in API Routes
- 1 instance: `src/app/api/mismo/parse/route.ts`
- Low priority but should be cleaned before production traffic increases.

### Dark Theme Violations (bg-white / bg-gray-100 / text-gray-900 in dashboard)
These files use light-mode color tokens inside dashboard routes:
- `src/app/dashboard/scenarios/ScenarioList.tsx`
- `src/app/dashboard/scenarios/new/ScenarioCard.tsx`
- `src/app/dashboard/scenarios/new/StatementUpload.tsx`

### Potentially Unused Components
These components appear to have no static imports in `src/app/` — may be dead code or referenced dynamically:
- `src/components/SmartActionQueue.tsx`
- `src/components/crm/LoanOSChat.tsx`
- `src/components/OrgProvider.tsx`
- `src/components/NavDropdown.tsx`
- `src/components/dashboard/DailyBriefingPanel.tsx`
- `src/components/dashboard/DailyScheduleWidget.tsx`
- `src/components/dashboard/DashboardClient.tsx`
- `src/components/dashboard/TodoList.tsx`
- `src/components/GlobalSearch.tsx`
- `src/components/outreach/QuickAddConfirmation.tsx`
- `src/components/outreach/BulkActionPreview.tsx`
- `src/components/outreach/OutreachChatContext.tsx`
- `src/components/TopNav.tsx`
- `src/components/ActivityFeed.tsx`
- `src/components/NavItem.tsx`

> Some may be used via `next/dynamic` or index barrel imports — verify before deleting.

---

## 🟢 All Clear

- **Email drafts** — No pending drafts sitting unsent. Clean.
- **n8n active workflows** — 12 workflows actively running. Core automations confirmed active:
  - Arive New Loan → Supabase
  - Arive Status Update → Supabase
  - Milestone Communication Agent
  - Referral Intro Email
  - Pre-Approval Email
- **TypeScript build** — PASS (0 errors)

---

## Build

**PASS** — `npx tsc --noEmit` exited 0. No TypeScript errors.
