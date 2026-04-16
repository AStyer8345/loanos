## Scenarios Mission Brief — 2026-04-16 AM

### Focus Area
Backfill Borrower Q&A for existing scenarios — one-click admin button to generate Q&A
for all saved scenarios that predate the Q&A feature (shipped Apr 15).

### Why This Matters
Pre-generated Q&A only fires on new saves. Adam's entire scenario history returns a blank
Q&A accordion on the share page. Old share links show the accordion shell with no content.
This fixes that in one click from the scenarios list page.

### Session Type
[x] Build

### Objectives
1. Shared utility: extract Q&A generation logic from generate-qa into generateQAPairs.ts
2. Batch backfill route: POST /api/scenarios/backfill-qa (all Q&A-null scenarios, parallel chunks of 3)
3. Scenarios page: show qaNeededCount to ScenarioList
4. ScenarioList: "Generate Q&A (N)" button with progress and success feedback
5. npm run build passes, Vercel deploys READY

### Files in Scope
- src/lib/scenarios/generateQAPairs.ts (new)
- src/app/api/scenarios/generate-qa/route.ts (refactored)
- src/app/api/scenarios/backfill-qa/route.ts (new)
- src/app/dashboard/scenarios/page.tsx
- src/app/dashboard/scenarios/ScenarioList.tsx

### Definition of Done
- Scenarios list shows "Generate Q&A (N)" button when N > 0 scenarios lack Q&A
- Button hidden when all scenarios already have Q&A
- Backfill processes all missing scenarios, returns { processed, skipped, errors }
- Build passes with 0 TypeScript errors

### Subagents to Activate
[x] Builder (direct)
[x] QA (npm run build)
[x] Reporter
