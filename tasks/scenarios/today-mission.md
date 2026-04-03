## Scenarios Mission Brief — 2026-04-02 AM

### Focus Area
ARM vs Fixed Comparison (Tier 3 item 2) — 5/1 ARM initial savings vs 30yr fixed with break-even year if rates rise

### Why This Matters
Borrowers constantly ask "should I do the ARM?" when rate-sensitive. MC can show this in seconds with a visual comparison. LoanOS can't show it at all. Adam currently has to switch tools or build manual scenarios.

### Session Type
[x] Build

### Objectives
1. New ArmVsFixedSection component renders in purchase mode results
2. Shows ARM initial savings, 5-yr cumulative savings, and worst-case break-even after rate adjustment
3. Build passes, 0 TypeScript errors, deployed to Vercel READY

### Files in Scope
- `src/app/dashboard/scenarios/new/ArmVsFixedSection.tsx` (new)
- `src/app/dashboard/scenarios/new/ScenarioBuilder.tsx` (import + render)

### Definition of Done
- Component renders when purchaseScenarios[0] has a valid rate and loan amount
- Shows: ARM rate (fixed rate minus 0.5%), Year 1-5 payment, Year 6+ worst-case payment (rate+2%)
- Shows: monthly savings first 5 yrs, 5-yr cumulative savings, break-even month vs staying fixed
- Compliance note: illustrative only, ARM rates adjust — not a product recommendation
- npm run build passes with 0 TypeScript errors
- Pushed to Vercel, deployment READY

### Subagents to Activate
(No subagent files exist for builder/QA/reporter — orchestrator building directly)
