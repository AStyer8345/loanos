# LoanOS Daily Report — 2026-03-22

## 🔴 Action Required

### CTC Loans Stale 3–5+ Days (High Urgency)
These files should be actively closing — no updates logged since Mar 17–19:

| Borrower | Status | Last Updated |
|----------|--------|-------------|
| Andrew Mcneese | CLEAR_TO_CLOSE | 2026-03-17 |
| Travis Coleman | clear_to_close | 2026-03-18 |
| Jessica Holt | clear_to_close | 2026-03-17 |
| Linda Okafor | clear_to_close | 2026-03-17 |
| Chelsea Wise | CLEAR_TO_CLOSE | 2026-03-19 |

**Action:** Verify with Janie. If closed/funded, update Arive status to trigger sync.

### Underwriting Files with No Activity in 5+ Days
| Borrower | Status | Last Updated |
|----------|--------|-------------|
| Kenneth Turner | UNDERWRITING_SUBMITTED | 2026-03-17 |
| Ryan Nguyen | underwriting | 2026-03-17 |
| Priya Nair | underwriting | 2026-03-17 |
| Derek Cho | underwriting | 2026-03-17 |
| Lauren Simmons | underwriting | 2026-03-17 |

**Action:** Chase UW decisions. 5 days with no logged update is a flag.

### n8n Inactive Workflows (Not on Intentional Inactive List)
| Workflow | ID | Action |
|----------|-----|--------|
| LoanOS — Outlook Email Sync | `JMmstRl2C5ylmuIY` | Blocked on Outlook credential — activate once env vars are set |
| LoanOS — Contract Received (duplicate) | `w7hZLmIcQ4izmndb` | Likely superseded by `UfNcdpoVKQZqy0fj` (active) — consider deleting |

---

## 🟡 Watch Items

### Other Stale Active Loans (3+ days, lower urgency)
In Process / Processing / Pre-Approved / RE-Submittal loans not updated since Mar 17–18:

| Borrower | Status |
|----------|--------|
| Farinaz Pisheh | DISCLOSURE_SENT |
| Patrick Rademacher | Loan in Process |
| Drew Benac | Loan in Process |
| Kyle Jennings | RE_SUBMITTAL |
| Maria Gutierrez | processing |
| Monica Castillo | processing |
| Scott Tillman | processing |
| David Park | processing |
| Rachel Kim | pre_approved |
| Jennifer Walsh | pre_approved |
| Tyler Owens | pre_approved |
| Amanda Reyes | pre_approved |
| James Harwell | pre_approved |
| Nathan Burke | pre_approved |

Note: Many loans showing "Started" / "On Hold" / "Cancelled" (bulk import rows) are expected to be stale — not actionable.

### Recent n8n Error (Near 24h Boundary)
- **LoanOS — Final CD Email** (`SkzrWeR0bHZs8kWX`) — error execution at 2026-03-21 02:10 UTC (~22h ago)
- No other errors in last 24h
- **Action:** Check n8n execution logs if Final CD email sending is expected

### Console.log in API Routes (2 files)
- `src/app/api/arive-webhook/route.ts`
- `src/app/api/mismo/parse/route.ts`

### Dark Theme Violations in Dashboard (3 files)
Using `bg-white`, `bg-gray-100`, or `text-gray-900`:
- `src/app/dashboard/scenarios/ScenarioList.tsx`
- `src/app/dashboard/scenarios/new/StatementUpload.tsx`
- `src/app/dashboard/scenarios/new/ScenarioCard.tsx`

### Potentially Unused Components (10)
Not imported in `src/app/` — verify before removing:
- `ActivityTimeline.tsx`
- `EmailDraftPreview.tsx`
- `GlobalSearch.tsx`
- `NavDropdown.tsx`
- `NavItem.tsx`
- `SmartActionQueue.tsx`
- `dashboard/DailyBriefingPanel.tsx`
- `dashboard/DailyScheduleWidget.tsx`
- `outreach/BulkActionPreview.tsx`
- `outreach/QuickAddConfirmation.tsx`

---

## 🟢 All Clear

- **Pending email drafts:** 0 — no drafts sitting unsent ✅
- **n8n errors (last 24h):** 0 ✅
- **13 of 15 workflows active** — Milestone Agent, Arive Sync (both), Pre-Approval, Referral Intro, Final CD Email, Contract Received, New App Received, Refi Intake, Inbound Email, Web Lead all running ✅
- **Intentionally inactive:** Weekly Social Post (`eJG4wckrj6SmSpm1`), Review Request Email (`AK1fBcaX1cPcdlGx`) ✅

---

## Build

**Pass** — `tsc --noEmit` returned 0 errors ✅
