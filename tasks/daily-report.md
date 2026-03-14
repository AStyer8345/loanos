# LoanOS Daily Report — 2026-03-14

## 🔴 Action Required

### n8n Workflow Failures (Last 24h)
Two critical Arive sync workflows failed repeatedly yesterday:

| Workflow | ID | Errors | Last Failure |
|----------|----|--------|-------------|
| Arive New Loan → Supabase | `1tagvoU0UXtdDiMY` | 3 errors (exec 141, 143, 148) | 2026-03-13 20:12 UTC |
| Arive Status Update → Supabase | `9JyzzwKac8v3uQ7d` | 1 error (exec 147) | 2026-03-13 20:11 UTC |

These two workflows are the core data ingestion pipeline. Failures mean new loans and status changes from Arive are NOT syncing to Supabase. Check n8n execution logs for root cause.

### Stale Active Loans (3+ days no update)
57 loans in active statuses (processing, Started, Approved, In Process, etc.) not updated since 2026-03-10. Named loans flagged:

| Borrower | Status | Last Updated |
|----------|--------|-------------|
| Eric Birdsall | processing | 2026-03-10 |
| Martin Cuilla | Started | 2026-03-10 |
| Brian Richards | processing | 2026-03-10 |
| Farinaz Pisheh | Approved | 2026-03-10 |
| Kenneth Turner | In Process | 2026-03-10 |
| Jay Shapiro | processing | 2026-03-10 |
| David Kloster | Started | 2026-03-10 |
| Loren Mesta | processing | 2026-03-10 |
| Giulia Lewers | processing | 2026-03-10 |
| Debbie Johnson | processing | 2026-03-10 |
| Brian Moskal | Started | 2026-03-10 |
| Matthew Ikenberry | Suspended | 2026-03-10 |
| Kyle Jennings | Loan in Process | 2026-03-10 |

*Note: Many of these may be seed/test data (many have null borrower names). The Arive sync failures above are likely the reason real loans aren't updating.*

---

## 🟡 Watch Items

### Inactive Workflows (Unexpected)
| Workflow | ID | Notes |
|----------|----|-------|
| LoanOS — Outlook Email Sync | `JMmstRl2C5ylmuIY` | Marked "Needs env vars" — may be intentional |
| LoanOS — Contract Received (duplicate) | `w7hZLmIcQ4izmndb` | Duplicate of active `UfNcdpoVKQZqy0fj` — safe to ignore or delete |
| LoanOS — Refi Intake Email | `yCTydQ7RfZK4DyUg` | Marked "Untested" — may need activation |

### Pending Email Drafts
None — all clear.

### Console.log in API Routes (3 files)
| File |
|------|
| `src/app/api/outlook-sync/route.ts` |
| `src/app/api/outlook-callback/route.ts` |
| `src/app/api/arive-webhook/route.ts` |

### Unused Components (4 components)
| Component | File |
|-----------|------|
| ActivityFeed | `src/components/ActivityFeed.tsx` |
| GlobalSearch | `src/components/GlobalSearch.tsx` |
| NavDropdown | `src/components/NavDropdown.tsx` |
| NavItem | `src/components/NavItem.tsx` |

### Dark Theme Violations (bg-white / bg-gray-100 / text-gray-900)
5 files in `src/app/dashboard/`:
- `loans/[id]/page.tsx`
- `loans/page.tsx`
- `settings/page.tsx`
- `briefing/page.tsx`
- `automations/page.tsx`

---

## 🟢 All Clear

- **Email drafts**: No pending drafts older than 24h
- **Core workflows active**: Milestone Agent, Final CD Email, Contract Received, Referral Intro, Pre-Approval, New Application all show `active=true`
- **Weekly Social Post / Review Request**: Confirmed intentionally inactive (expected)

---

## Build

**FAIL — 2 TypeScript errors**

```
error TS2688: Cannot find type definition file for 'json5 2'
error TS2688: Cannot find type definition file for 'react-dom 2'
```

These appear to be phantom entries in tsconfig (likely duplicate or stale `@types` references), not runtime errors. Low risk but should be cleaned up.
