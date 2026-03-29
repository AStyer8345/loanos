## Scenarios Mission Brief — 2026-03-29 AM

### Focus Area
Rent vs Own comparison mode — client-side component that answers "should I keep renting or buy now?"

### Why This Matters
This is the highest-impact "emotional" scenario MC uses to create urgency. MC anchors on a clean "Break even in Year X" headline and shows equity growth vs. $0 equity from renting. LoanOS has no equivalent. Every time Adam runs this comparison today, he manually does it in MC.

### Session Type
[x] Build

### Objectives
1. Build `RentVsOwnSection.tsx` — client-side component, no API call, renders in purchase mode results after DownPaymentSection
2. Inputs pulled from existing ScenarioBuilder state: purchasePrice, downPaymentPercent (from first scenario), rate, term, taxes, HOI, HOA + one new input: monthly rent
3. Outputs: break-even year, monthly rent vs PITI comparison, equity at year 5/10/15, total cost of renting vs owning over 10 years
4. Hero metric displayed in gold: "Break even in Year X"
5. Build passes with 0 TypeScript errors

### Files in Scope
- `src/app/dashboard/scenarios/new/RentVsOwnSection.tsx` (new)
- `src/app/dashboard/scenarios/new/ScenarioBuilder.tsx` (import + render only)

Everything else is OFF LIMITS.

### Definition of Done
- `npm run build` passes, 0 TypeScript errors
- Component renders in purchase mode results after DownPaymentSection
- Hero "Break even in Year X" visible, gold-styled
- Monthly rent vs PITI table shows clearly
- Equity build at years 5, 10, 15 shown
- Compliance note present
- Git committed and pushed to main
- Vercel deployment READY

### Subagents to Activate
[ ] Research Subagent — SKIP (enough context from NotebookLM)
[x] Builder Subagent
[x] QA Subagent
[x] Reporter Subagent
