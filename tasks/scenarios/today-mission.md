## Scenarios Mission Brief — 2026-04-14 AM

### Focus Area
Social Proof Block — share page market context widget (Tier 5 item 5)

### Why This Matters
Borrowers on the share page see their numbers in isolation. Mortgage Coach adds
social context ("most borrowers in your situation chose X") which makes the
option cards feel more like a decision guided by market wisdom, not just math.
A compliance-safe social proof block closes this emotional gap without implying
a recommendation.

### Session Type
[x] Build

### Objectives
1. Build `SocialProofBlock.tsx` — illustrative market context widget for the share page
2. Wire into `SharePageLayout.tsx` between the NarrativeCard and BreakEvenVisual sections
3. Build passes, renders correctly for both purchase and refi modes

### Files in Scope
- `src/components/share/SocialProofBlock.tsx` (new)
- `src/components/share/SharePageLayout.tsx` (import + render)

### Definition of Done
- Component renders with 2–3 illustrative stats that match the scenario's mode and term
- Stats are date-seeded (stable per week, not per render)
- Clear "Illustrative" disclaimer present — no data claim, no recommendation
- `print:hidden` — doesn't appear in PDF
- `npm run build` passes, 0 TypeScript errors
- Looks correct at 390px mobile and desktop
