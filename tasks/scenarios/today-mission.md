## Scenarios Mission Brief — 2026-04-12 AM

### Focus Area
Persistent scenario comparison table on share page (Tier 5 item 2)

### Why This Matters
MC presentations put all numbers in one scannable view. In LoanOS, the full
comparison table is buried behind two taps (accordion → expand) under "Detailed
Comparison." Most borrowers never find it. A borrower who wants to compare all
numbers in one glance currently can't — without knowing to scroll down and tap
the accordion open. This closes that gap: the table is always visible, below the
option cards, no tap required.

### Session Type
[x] Build

### Objectives
1. Create `ScenarioComparisonTable.tsx` — persistent side-by-side table below OptionCardsGrid
2. Render it in SharePageLayout after the "Your Options" section (multi-scenario only)
3. Mirror "Commonly Chosen" gold column treatment from OptionCard + PDF
4. Build passes, no TypeScript errors

### Files in Scope
- `src/components/share/ScenarioComparisonTable.tsx` (new)
- `src/components/share/SharePageLayout.tsx` (add import + render)

Everything else is off limits.

### Definition of Done
- `npm run build` passes, 0 TypeScript errors
- Table renders below OptionCardsGrid on multi-scenario share pages
- Table hidden on single-scenario pages
- Commonly Chosen column has gold header treatment
- Mobile: horizontally scrollable with overflow-x-auto
- Committed and pushed to main, Vercel READY
