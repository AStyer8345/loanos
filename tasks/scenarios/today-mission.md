## Scenarios Mission Brief — 2026-04-06 AM

### Focus Area
Engagement tracking — view_count live display in ActionsBar after save

### Why This Matters
Mortgage Coach notifies loan officers when a borrower opens the link. LoanOS already increments view_count atomically via Supabase RPC when the share page loads — but Adam can only see it in the Scenarios list, not in the builder. Adding a live "views" counter in ActionsBar gives Adam the follow-up trigger signal exactly when it matters: while he's still in the builder with the borrower's file open.

### Session Type
[x] Build

### Objectives
1. Add `GET /api/scenarios/views?id=XXX` — lightweight endpoint returning `{view_count}`
2. Add live view_count display to ActionsBar — fetches on scenarioId set, polls every 30s
3. Visual: "👁 N views" badge near Copy Share Link — gold + subtle animation on first view (0→1 transition)

### Files in Scope
- `src/app/api/scenarios/views/route.ts` (NEW)
- `src/app/dashboard/scenarios/new/ActionsBar.tsx` (add view count badge)

### Definition of Done
- After saving, a view count badge appears in ActionsBar
- Counter live-updates on 30s interval
- npm run build passes, 0 TypeScript errors, git committed, Vercel READY

### Subagents to Activate
[x] Builder (direct)
