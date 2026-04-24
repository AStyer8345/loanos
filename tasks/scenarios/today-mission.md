## Scenarios Mission Brief — 2026-04-24 AM

### Focus Area
Tier 8 Item 5 — Mobile swipe cards for scenario comparison table

### Why This Matters
ScenarioComparisonTable renders with overflow-x-auto on mobile — functional but cramped on 390px screens.
Borrowers on phones (70%+ of viewers) see a pinched, horizontal-scrolling table that's hard to read.
A swipeable card version (one option per card, prev/next navigation) matches how mobile users
expect to compare options — like swiping through product cards on any e-commerce app.
Closes the last remaining Tier 8 item and completes the Scenarios program.

### Session Type
[x] Build

### Objectives
1. Create MobileComparisonCards.tsx — md:hidden, shows one scenario column per card, prev/next navigation
2. Update SharePageLayout.tsx — render MobileComparisonCards and hide ScenarioComparisonTable on mobile
3. Build passes with 0 TypeScript errors

### Files in Scope
- src/components/share/MobileComparisonCards.tsx (new)
- src/components/share/SharePageLayout.tsx (render mobile cards + hide desktop table on mobile)

### Definition of Done
- MobileComparisonCards visible at 390px viewport, ScenarioComparisonTable visible on md+
- "Commonly Chosen" gold treatment matches desktop table
- Build passes, committed and pushed

### Subagents to Activate
[x] Builder Subagent (direct)
[x] QA Subagent (npm run build)
