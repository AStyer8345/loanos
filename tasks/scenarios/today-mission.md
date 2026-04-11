## Scenarios Mission Brief — 2026-04-11 AM

### Focus Area
Scenario naming in the builder — let the LO label each scenario (e.g., "Conservative", "Seller Buydown", "20% Down") instead of the generic "Option A / B / C" labels. Names carry through to the share page and PDF.

### Why This Matters
Mortgage Coach lets advisors name each scenario before presenting. "Option A / B / C" feels like a spreadsheet. "Conservative 30yr" vs "Seller Buydown 2-1" tells a story — borrowers immediately understand what they're comparing. This is one of the last friction points between LoanOS Scenarios and MC presentations.

### Session Type
[x] Build

### Objectives
1. Add optional `name` text input per scenario in the builder form (above each scenario column)
2. Store name in the existing `scenarios_data` JSON (no schema migration needed)
3. Surface name as the card title on the share page OptionCard (fallback: "Option A / B / C")
4. Surface name in the PDF column header (fallback: "Option A / B / C")
5. Build passes, 0 TypeScript errors

### Files in Scope
- `src/app/dashboard/scenarios/new/ScenarioBuilder.tsx` — add name input field per scenario
- `src/components/share/OptionCard.tsx` — use scenario name as card title
- `src/components/share/OptionCardsGrid.tsx` — pass name down to OptionCard
- `src/app/api/scenarios/generate-pdf/route.ts` — use name in column headers
- Type files as needed (ScenarioDisplayRow, ShareData)

### Definition of Done
- Builder form shows a text input "Scenario name (optional)" per scenario column
- Default placeholder: "Option A", "Option B", "Option C"
- Share page cards show the custom name as the heading (not "Option A")
- PDF column headers show the custom name (not "Option A")
- `npm run build` passes with 0 TypeScript errors
- Vercel deployment reaches READY

### Subagents to Activate
[x] Builder Subagent (direct build — no research needed)
[x] QA Subagent
[x] Reporter Subagent
