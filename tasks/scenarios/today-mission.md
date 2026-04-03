## Scenarios Mission Brief — 2026-04-03 AM

### Focus Area
Total Cost of Waiting calculator — "What does waiting 6 months to buy cost?"

### Why This Matters
Mortgage Coach's emotional storytelling advantage: it creates urgency by showing
the real cost of delay. When borrowers say "we'll wait and see what rates do,"
Adam currently has no quick visual to show the payment, price, and interest cost
of waiting 6 months. This closes the urgency gap without being a scare tactic —
it presents trade-offs only (rates could go down too).

### Session Type
[x] Build

### Objectives
1. Build WaitingCostSection.tsx — pure client-side, renders in purchase mode results
2. Inputs: 6-month projected rate (user types), appreciation rate (default 3% annual), loan term inherited
3. Hero stat: monthly payment increase in amber/red
4. Key stats: home price increase, 6-month interest differential, total cost of waiting
5. npm run build passes, 0 TypeScript errors, Vercel READY

### Files in Scope
- `src/app/dashboard/scenarios/new/WaitingCostSection.tsx` (new)
- `src/app/dashboard/scenarios/new/ScenarioBuilder.tsx` (import + render)

### Definition of Done
- Component renders in purchase mode after ArmVsFixedSection when loanAmount > 0
- Hero stat shows monthly payment delta clearly
- 2 user inputs: projected rate in 6 months, annual appreciation %
- Compliance note: illustrative only, market conditions unpredictable, rates could decrease
- Build passes, pushed to Vercel, deployment READY

### Subagents to Activate
(No subagent files exist for builder/QA/reporter — orchestrator building directly)
