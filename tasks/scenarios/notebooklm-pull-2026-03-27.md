# NotebookLM Pull Report — 2026-03-27 AM
Active Topic: 2-1 Buydown Scenario Type (Tier 2, first item)

## What We Already Know
- LoanOS calculation engine already has full buydown support: `getBuydownRates`, `calculateBuydownCost`, `buydownPayments`, `buydownCost` in PurchaseCalculatedResult
- BuydownType enum exists: 'none' | '2-1' | '3-2-1' | '1-0'
- ScenarioCard already has a "Buydown" collapsible with type selector
- The GAP: buydown results are computed but NEVER displayed in the UI, displayData.ts, share page, or PDF
- UX best practice: financial comparison tables are most effective with <5 options as columns and attributes as rows
- Mobile-first design is mandatory for share page (borrowers read on phones)

## Mortgage Coach Gaps (remaining)
- Sub-minute strategy creation on mobile (MC speed advantage)
- Borrower-facing AI chat answering questions 24/7 within presentation
- Proactive "coaching opportunities" identification
- Presentation-quality buydown scenario display (Year 1 / Year 2 / Year 3+ side by side)

## Prior Session Summary
- PM 2026-03-26: AI narrative personalization complete — borrower first name in opening, possessive language, property address in context
- AM 2026-03-26: PDF redesign complete — hero stat, summary stat cards, lede treatment
- All Tier 1 complete: input speed ✅, share page redesign ✅, PDF redesign ✅, AI narrative ✅

## Priority Improvements (unresolved)
1. **2-1 buydown display** — calculation exists, UI display missing (TODAY)
2. Down payment comparison mode (3% / 5% / 10% / 20%)
3. Rent vs own mode

## Briefing for Builder
Do NOT re-research:
- Calculation logic (already correct in calculations.ts)
- BuydownType definitions (already in types.ts)
- ScenarioCard buydown input (already in ScenarioCard.tsx)

Focus new work here:
- Add `buydownPayments` + `buydownCost` to `ScenarioDisplayRow` in displayData.ts
- Create `BuydownSection.tsx` — year-by-year payment grid (Year 1/2/3+ as rows, scenarios as columns)
- Wire into ScenarioBuilder results (show only when ≥1 scenario has buydown type != 'none')
- Add buydown section to share page (`src/app/share/[token]/page.tsx`)
