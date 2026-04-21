## Scenarios Mission Brief — 2026-04-21 AM

### Focus Area
Tier 8 Items 2 + 4: Rate Freshness Banner + SMS Share from ActionsBar

### Why This Matters
Both are pure client-side, zero-migration, ~30min each.
Rate Freshness: prevents borrowers from acting on stale rates during Scott's beta (compliance protection).
SMS Share: closes the text-first workflow gap — LOs who text borrowers currently have to manually copy the link.

### Session Type
[x] Build

### Objectives
1. Rate Freshness Banner — amber inline banner on share page when scenario is >3 days old; pure client-side date math; print:hidden
2. SMS Share button — "Text Borrower" in ActionsBar alongside Email Borrower; opens native SMS composer with pre-filled share link via `sms:` URL scheme; pure client-side

### Files in Scope
- src/components/share/RateFreshnessBanner.tsx (new)
- src/components/share/SharePageLayout.tsx (add banner above Option Cards)
- src/app/dashboard/scenarios/new/ActionsBar.tsx (add SMS button)
- Nothing else

### Definition of Done
- Banner appears on share page when created_at > 3 days ago
- Banner is hidden when < 3 days
- Banner is print:hidden
- SMS button appears in ActionsBar when share token exists
- npm run build passes with 0 TypeScript errors
- Vercel deployment READY
