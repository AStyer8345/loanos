# LoanOS Daily Report — 2026-03-30 (Run 2)

> Note: A first run earlier today already wrote a 2026-03-30 report. This second run includes a new code fix. Findings supersede the earlier report.

## ACTION REQUIRED (for Adam)

- **Kyle Jennings** (CLEAR_TO_CLOSE, last updated 2026-03-23 — 7 days stale). CTC should close within days. If this is an active file, needs immediate follow-up.
- **Travis Coleman** (clear_to_close, 2026-03-18 — 12 days stale). Same concern.
- **Scott Tillman** (processing, 2026-03-18 — 12 days stale).
- **Oscar Lopez** (APPLICATION_INTAKE, 2026-03-22 — 8 days stale).
- **Andrea Taylor** (Application, 2026-03-20 — 10 days stale).
- **(unnamed)** (under_contract, 2026-03-20 — 10 days stale). Missing borrower name — Arive loan with null first/last name.
- **Andrew Mcneese** appears as "stale" (LOAN_FUNDED, 2026-03-24) but is likely terminal. Status `LOAN_FUNDED` (uppercase) is not in the terminal filter — only `funded` (lowercase) is. Status normalization issue — false positive in health checks.
- **30+ bulk-import loans (2026-03-17 batch)** — same recurring issue. Please mark dead/cancelled if not active.
- **n8n UI action still pending:** Set Outlook credential on "Draft Thank-You to Realtor" node in workflow J9Pe24vUi6fpZtdZ.

## WATCH ITEMS

- Status normalization: `LOAN_FUNDED` vs `funded`, `CLEAR_TO_CLOSE` vs `clear_to_close` — causing false positives in stale loan detection. 22 distinct status variants exist. Low urgency but worth cleaning up before licensing.
- `import/loans` and `import/contacts` routes still have no file size limit (parse route fixed today; downstream routes should get limits too before licensing).

## ALL CLEAR

- Build: PASS
- TypeScript: PASS (0 errors)
- console.log in API routes: 0
- Dark theme violations: 0
- Orphaned components: 0
- Untyped `as any` effective: 0 (all have eslint-disable-next-line)
- Pending email drafts: 0
- n8n: all 17 active workflows confirmed

## BUILD

Status: **Pass**
Error count: 0 (yesterday: 0 — trend: stable)

## CODE QUALITY METRICS

- console.log in API routes: **0** (yesterday: 0 — stable)
- Orphaned components: **0** (yesterday: 0 — stable)
- Dark theme violations: **0** (yesterday: 0 — stable)
- Untyped `any` casts: **0 effective** (12 raw hits; all have eslint-disable-next-line)
- Unscoped Supabase queries: **0 new** (all API routes confirmed org-scoped)

## PIPELINE HEALTH

- Stale loans (3+ days, real): **7** — Kyle Jennings (CTC, 7d), Oscar Lopez (App Intake, 8d), Andrea Taylor (App, 10d), unnamed (under_contract, 10d), Travis Coleman (CTC, 12d), Scott Tillman (processing, 12d), Andrew Mcneese (LOAN_FUNDED — likely false positive)
- Stale loans (bulk import batch 2026-03-17): **63**
- Pending email drafts (24h+): **0**
- Activity gaps (5+ days): same bulk import population
- n8n workflow errors: none detected (all 17 active)

## FIXED_TODAY

- `src/app/api/import/parse/route.ts` — Added `getOrganization()` auth check (unauthenticated → 401) and 10 MB file size cap (oversized file → 413). Route was the only import-related route without auth; `import/loans` and `import/contacts` both already used `getOrganization()`. Without this, any internet user could POST arbitrary large files and trigger CPU-intensive regex parsing. Fix gates the route behind a valid Supabase session. Import UX is unaffected — the dashboard always has an active session.
- Verification: `npm run build` passes cleanly. TypeScript: 0 errors.
- Informed by: TOMORROW_PRIORITY from 2026-03-30 run 1.

## RECURRING_ISSUES (same issue 2+ runs)

- **Stale bulk-import loans (2026-03-17 batch)** — fifth occurrence (first: 2026-03-27). 63 loans. Data governance issue — Adam must resolve.
- **Kyle Jennings + other real stale CTC/processing loans** — appears regularly. Adam must review.
- **n8n J9Pe24vUi6fpZtdZ Outlook credential** — flagged 3+ consecutive runs. Adam must set in n8n UI.

## TOMORROW_PRIORITY

**Add file size limits to `import/loans/route.ts` and `import/contacts/route.ts`.** These accept POST bodies with potentially large row arrays (the `full=true` parse result piped into the confirm flow). Check if there's a max payload size guard. Add a row count or byte cap consistent with today's 10 MB parse limit.

## LESSONS_LEARNED

- **`import/parse` auth gap pattern** — When sibling routes share a directory, verify ALL have auth. The parse route was the prototype; auth was added to the consumers (`loans`, `contacts`) but never backfilled to the original. When fixing auth on a route, grep sibling routes in the same directory and confirm they all follow the same pattern.
- **`getOrganization()` throws, not returns error** — Use try/catch, not destructuring `{ error }`. Correct pattern: `try { await getOrganization() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }`.
