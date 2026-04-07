## Scenarios Mission Brief — 2026-04-07 AM

### Focus Area
Mobile Share Page Audit + Fixes — 390px viewport

### Why This Matters
70%+ of borrowers open share links on phones. The share page redesign (Apr 3) was built desktop-first. Multiple components have known mobile layout issues: CashToCloseBreakdown overflows without overflow-x-auto, LOSidebarCard is buried below all content, ShareHero hero stat is misaligned. Mortgage Coach's biggest mobile advantage is that their share pages render cleanly at any screen size. Closing this gap means Adam's borrowers get a polished experience on the device they actually use.

### Session Type
[x] Build

### Objectives
1. Fix CashToCloseBreakdown horizontal overflow on mobile (grid columns overflow at 390px)
2. Hide LOSidebarCard on mobile (ShareCTA already provides CTAs)
3. Fix ShareHero hero stat alignment on mobile
4. Reduce OptionCard padding on mobile (p-4 sm:p-6)
5. Add px-4 sm:px-6 to main layout container for tighter mobile padding

### Files in Scope
- src/components/share/CashToCloseBreakdown.tsx
- src/components/share/ShareHero.tsx
- src/components/share/OptionCard.tsx
- src/components/share/SharePageLayout.tsx

### Definition of Done
- npm run build passes (0 TypeScript errors)
- At 390px: no horizontal overflow on any section
- CashToClose scrolls horizontally if needed (overflow-x-auto)
- Hero stat is readable and well-aligned on mobile
- LOSidebarCard hidden on mobile (lg:block)
- ShareCTA still shows at bottom on mobile

### Subagents to Activate
[x] Builder Subagent (direct — this session)
