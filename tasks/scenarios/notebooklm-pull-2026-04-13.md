# NotebookLM Pull Report — 2026-04-13 AM
Active Topic: Refi builder current loan pre-fill (Tier 5, item 4)

## What We Already Know
- Tiers 1-5 (partial) complete. Comparison table, "Commonly Chosen" badge, PDF badge mirroring,
  scenario naming, video embed, email from builder — all done.
- AI narrative personalizes by borrower name + property address + specific numbers
- Share page is mobile-first, card-based, equity curve chart embedded
- NotebookLM data is ~Apr 9; local session-log shows Apr 12 AM = comparison table complete

## Mortgage Coach Gaps (Remaining Open)
- Refi builder does NOT pre-populate current loan data when launched from a loan record
  (LO must manually type rate, balance, months remaining — friction point)
- Social proof block not yet built ("X borrowers in Austin chose 30yr fixed this month")
- No borrower-facing AI chat (MC NextGen advantage — not planned for this sprint)

## Prior Session Summary
- 2026-04-12 AM: Comparison table (Tier 5 item 2) — `ScenarioComparisonTable.tsx`
  persistent side-by-side data table below OptionCardsGrid on share page
- Also fixed 4 pre-existing TypeScript/ESLint build errors
- Commits 74c9d52 + c0d8b11 | Vercel READY

## Priority Improvements
1. **Refi builder pre-fill** — Tier 5, item 4 (TODAY)
2. **Social proof block** — Tier 5, item 5 (next session)

## Briefing for Builder
Do NOT re-research:
- Share page mobile layout (done)
- Commonly Chosen badge logic (done)
- AI narrative personalization (done)
- Comparison table (done Apr 12)

Focus new work here:
- `src/app/dashboard/scenarios/new/ScenarioBuilder.tsx` — refi mode initialization
- `src/app/api/scenarios/calculate/route.ts` — not needed today
- Loan record data schema: `interest_rate`, `loan_amount`, `loan_term_months` in `loans` table
- Pre-fill path: when `?loan_id=` param present + refi mode selected, read loan data and populate
  current_rate, current_balance, months_remaining into the form

NOTEBOOKLM (PULL): COMPLETE — 2026-04-13 07:30 CDT
