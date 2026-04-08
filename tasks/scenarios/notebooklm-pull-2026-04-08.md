# NotebookLM Pull Report — 2026-04-08 AM
Active Topic: "Commonly Chosen" highlight — Tier 4 item 2

## What We Already Know
- Tier 1/2/3 complete: input speed, share page redesign, PDF redesign, AI narrative, buydown, down payment comparison, rent vs own, email from builder, ARM vs Fixed, cost of waiting, refi timing, equity chart, engagement tracking
- All features built and deployed to Vercel ✅
- Mobile audit (Tier 4 item 1) done 2026-04-07: CashToCloseBreakdown overflow, ShareHero text-left, OptionCard padding, LOSidebarCard hidden on mobile

## Mortgage Coach Gaps (remaining)
- Visual guidance to borrowers on which option to focus (without compliance violation)
- Video/loom embed on share page
- Scenario option highlight on OptionCards (PaymentComparisonChart has it, cards don't)

## Prior Session Summary
Built: Mobile share page audit — 4 component fixes for 390px viewport
Next: "Most Popular" / "Commonly Chosen" highlight on OptionCard

## Priority Improvements
1. "Commonly Chosen" badge on lowest-payment OptionCard (Tier 4 item 2)
2. Video/loom embed placeholder (Tier 4 item 3)

## Briefing for Builder
Do NOT re-research: share page layout, equity chart, mobile layout, engagement tracking — all done.
Focus new work here:
- OptionCard.tsx: add isCommonlyChosen prop → render badge
- OptionCardsGrid.tsx: compute lowest-payment index → pass prop
- Compliant framing: "Commonly Chosen" — no "Best Option" or recommendation
