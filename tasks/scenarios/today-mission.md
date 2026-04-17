## Scenarios Mission Brief — 2026-04-17 AM

### Focus Area
Mobile Builder Quick-Input Form (Tier 6 Item 3)

### Why This Matters
Mortgage Coach's "red light" feature: LO can create a share link in under 60 seconds on
their phone while sitting at a table with a borrower. The full ScenarioBuilder wizard
(3 steps, 20+ fields) is desktop-centric in practice. This closes that gap with a 4-field
mobile-only card that produces a real share link in one tap.

### Session Type
[x] Full cycle (Build + Test)

### Objectives
1. New MobileQuickInput component — shown md:hidden at top of ScenarioBuilder
2. 4 fields: purchase price, down payment %, rate, loan term
3. Live P&I preview updates as user types
4. "Get Share Link" calls calculate API + save API, returns working /share/[token] URL
5. Share link inline with one-tap copy. Build passes, Vercel READY.

### Files in Scope
- src/app/dashboard/scenarios/new/MobileQuickInput.tsx (new)
- src/app/dashboard/scenarios/new/ScenarioBuilder.tsx (import + render)

### Definition of Done
- npm run build passes, 0 TypeScript errors
- Component visible on mobile (< md), hidden on desktop
- 4 fields compute live P&I via client-side formula
- "Get Share Link" produces a real /share/[token] URL in one tap
- Share link copyable with a single tap

### Subagents to Activate
[x] Builder (direct build)
[x] QA (npm run build)
[x] Reporter (if QA passes)
