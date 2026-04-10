## Scenarios Mission Brief — 2026-04-10 AM

### Focus Area
PDF: "Commonly Chosen" label — mirror share page badge in PDF output

### Why This Matters
The share page now visually anchors borrowers to the lowest-payment scenario with a gold "Commonly Chosen" pill. When Adam prints or sends the PDF, that signal disappears. Borrowers who review the PDF alone have no visual anchor. Closing this gap means the PDF and the share page tell the same story.

### Session Type
[x] Build

### Objectives
1. Add "Commonly Chosen" gold pill badge to the scenario column header in the PDF Summary Table that corresponds to the lowest total monthly payment (purchase mode only, 2+ scenarios)
2. Apply gold column header treatment (gold background, white text) to that column to match the visual weight of the share page card treatment
3. Build must pass — no TypeScript errors

### Files in Scope
- `src/app/api/scenarios/generate-pdf/route.ts` — ONLY this file

### Definition of Done
- `npm run build` passes
- "Commonly Chosen" gold badge appears in the column header of the lowest-payment scenario when there are 2+ scenarios
- Badge is hidden (column renders normally) when only 1 scenario
- No change for refi mode (refi has no "Commonly Chosen" concept)
- Pushed to main, Vercel READY

### Subagents to Activate
[x] Builder (this session — inline implementation)
[x] QA (build check)
[x] Reporter
