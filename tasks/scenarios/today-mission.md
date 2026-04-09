## Scenarios Mission Brief — 2026-04-09 AM

### Focus Area
Share page: video/loom embed placeholder (Tier 4 item 3 — final Tier 4 item)

### Why This Matters
Mortgage Coach presentations include a video walkthrough from the LO. Adam records a 60-second Loom explaining the options and borrowers watch it before calling. This turns a confusing spreadsheet into a guided experience. LoanOS share page has all the data but no voice. Adding a video slot closes this MC advantage at zero extra infrastructure cost: no new tables, just a key in `user_settings` (key: `scenario_video_url`).

### Session Type
[x] Build

### Objectives
1. Add `videoUrl` field to `ShareBranding` type, read from `user_settings.scenario_video_url`
2. Create `ShareVideoEmbed.tsx` — responsive 16:9 iframe embed, Loom + YouTube URL normalization, renders null when no URL set
3. Wire embed above "Your Options" section in `SharePageLayout.tsx`
4. Update `domain-queue.md` with Tier 4 complete + Tier 5 items

### Files in Scope
- `src/app/api/share/[token]/route.ts` — add `videoUrl` to ShareBranding + read from settings
- `src/components/share/ShareVideoEmbed.tsx` (new)
- `src/components/share/SharePageLayout.tsx` — import + render above OptionCardsGrid
- `tasks/scenarios/domain-queue.md` — mark Tier 4 done, define Tier 5

### Definition of Done
- `npm run build` passes with 0 TypeScript errors
- Responsive 16:9 iframe at 390px mobile through desktop
- Loom share URLs auto-converted to embed URLs
- No URL set → component renders nothing
- Section header "Walk Me Through This" in LoanOS gold style
- `print:hidden` — does not appear in PDF
- Committed and pushed
