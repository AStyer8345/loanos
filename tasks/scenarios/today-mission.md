## Scenarios Mission Brief — 2026-03-26 AM

### Focus Area
PDF Redesign — Hero stat + Summary stat cards + Narrative lede

### Why This Matters
The share page now opens with an emotional hook (borrower name, hero number, summary stats).
The PDF still opens with "Sarah — Purchase Analysis" followed immediately by a data table.
Borrowers receive the PDF, open it, see numbers — not a story. They don't share it.
Mortgage Coach presentations lead with the most important number and aspirational framing.
This session brings the PDF up to the share page's standard.

### Session Type
[x] Build

### Objectives
1. PDF opens with borrower headline ("Sarah's Purchase Options") + hero stat ($X/mo) right-aligned — same emotional pattern as share page
2. Three summary stat cards directly below hero (matching share page: lowest payment / lowest CTC / lowest 15yr interest OR monthly savings / 5yr savings / break-even)
3. First paragraph of AI narrative gets gold left-border lede treatment (larger text, distinct from body)

### Files in Scope
- `src/app/api/scenarios/generate-pdf/route.ts` — ONLY this file

### Definition of Done
- `npm run build` passes with 0 TypeScript errors
- PDF HTML includes: hero title block with borrower name + hero stat, 3 summary stat cards, narrative lede styling
- Dark header and existing sections (comparison table, key metrics, break-even, charts, closing costs, footer) unchanged
- No auth/RLS/multi-tenant code touched

### Subagents to Activate
Note: Only 00-notebooklm.md subagent exists. Builder/QA/Reporter running inline.
[x] Builder (inline)
[x] QA (npm run build)
[x] Reporter (session-log.md update)
