# LoanOS Daily Report — 2026-03-20

## 🔴 Action Required

### n8n Workflow Errors (2026-03-19)
- **`1tagvoU0UXtdDiMY` — Arive New Loan → Supabase**: 4 consecutive errors between 18:35–19:36. All show `lastNodeExecuted: null`, meaning failures happened before any node ran (likely webhook auth or malformed payload). Check Arive webhook config — may need re-registration.
- **`utMvZpkdRwIRZ51u` — Pre-Approval Email**: 1 error at 18:35. Same `lastNodeExecuted: null` pattern — webhook trigger failing at entry point.

### Activity Gaps — High-Priority Loans (no activity in 5+ days)
These are in active pipeline stages and have zero activity_log entries since 2026-03-15:

| Borrower | Status |
|----------|--------|
| Maria Gutierrez | processing |
| Monica Castillo | processing |
| David Park | processing |
| Ryan Nguyen | underwriting |
| Priya Nair | underwriting |
| Derek Cho | underwriting |
| Lauren Simmons | underwriting |

---

## 🟡 Watch Items

### Unexpected Inactive n8n Workflows
- **`JMmstRl2C5ylmuIY` — Outlook Email Sync**: Inactive (known — needs Outlook credential/env vars before activating)
- **`w7hZLmIcQ4izmndb` — LoanOS — Contract Received**: Inactive. Note: there are now TWO "Contract Received" workflows — this one is inactive/orphaned; `UfNcdpoVKQZqy0fj` is the live one. Consider deleting `w7hZLmIcQ4izmndb`.

### Activity Gaps — Lower-Priority Loans (no activity in 5+ days)
Pre-approved, lead, application, or On Hold status — less urgent but worth a check:

| Borrower | Status |
|----------|--------|
| Rachel Kim | pre_approved |
| James Harwell | pre_approved |
| Jennifer Walsh | pre_approved |
| Tyler Owens | pre_approved |
| Amanda Reyes | pre_approved |
| Nathan Burke | pre_approved |
| Michael Torres | application |
| Sarah Blackwell | application |
| Kevin Spotts | On Hold |
| Martin Cuilla | Started |
| Courtney Dixon | lead |
| Patricia Lowe | lead |
| Unknown (2193e175) | On Hold |

### Code Quality
- **console.log statements** in API routes (3 total):
  - `src/app/api/arive-webhook/route.ts` — 2 instances
  - `src/app/api/mismo/parse/route.ts` — 1 instance
- **Dark theme violations** (bg-white / bg-gray-100 / text-gray-900 in dashboard):
  - `src/app/dashboard/scenarios/ScenarioList.tsx`
  - `src/app/dashboard/scenarios/new/StatementUpload.tsx`
  - `src/app/dashboard/scenarios/new/ScenarioCard.tsx`

---

## 🟢 All Clear

- **Stale loans**: 0 — no active loans overdue for an update
- **Pending email drafts**: 0 — no drafts stuck unsent
- **Core workflows active**: Milestone Agent, Arive Status Update, Referral Intro, New Application, Final CD, Refi Intake, Inbound Email Sync, Contract Received (`UfNcdpoVKQZqy0fj`), Web Lead Automation — all active

## Build

**PASS** — `npx tsc --noEmit` returned 0 errors
