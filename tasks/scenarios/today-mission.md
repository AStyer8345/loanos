## Scenarios Mission Brief — 2026-03-27 AM

### Focus Area
2-1 Buydown Scenario Display — expose the year-by-year payment schedule that's already calculated but never shown

### Why This Matters
When a seller offers a rate buydown (very common in today's market), Adam needs to show borrowers exactly what their payments look like in Year 1, Year 2, and Year 3+. Mortgage Coach does this clearly. LoanOS calculates it but hides the results. This closes a concrete MC gap that shows up in every seller-concession negotiation.

### Session Type
[x] Build

### Objectives
1. Show buydown year-by-year payment schedule in purchase results (Year 1/2/3+ rows, scenarios as columns)
2. Show buydown cost + break-even month within the same section
3. Section only renders when ≥1 scenario has buydown type != 'none'

### Files in Scope
- `src/lib/scenarios/displayData.ts` — add buydown fields to ScenarioDisplayRow + buildPurchaseDisplayData
- `src/app/dashboard/scenarios/new/BuydownSection.tsx` — NEW: buydown schedule grid component
- `src/app/dashboard/scenarios/new/ScenarioBuilder.tsx` — import + render BuydownSection

### Definition of Done
- `npm run build` passes, 0 TypeScript errors
- When a scenario has buydown type "2-1 Buydown" and user clicks Calculate, a "Buydown Schedule" section appears showing Year 1/Year 2/Year 3+ payments for each scenario
- Non-buydown scenarios show "—" in the buydown rows (or the section hides cleanly)
- Buydown cost ($X,XXX) and break-even month shown per scenario

### Subagents to Activate
[x] Builder Subagent
[x] QA Subagent
[x] Reporter Subagent
