# NotebookLM Pull Report — 2026-04-09 AM
Active Topic: Share page video/loom embed + PDF "Commonly Chosen" label

## What We Already Know
- Tiers 1-3 complete: Share page redesign, PDF redesign, AI narrative, buydown, down payment, rent vs own, email from builder, ARM vs fixed, total cost of waiting, refi timing, equity chart, engagement tracking
- Tier 4: Mobile audit done (Apr 7), "Commonly Chosen" badge done (Apr 8)
- Only remaining Tier 4 item: video/loom embed placeholder on share page
- MC gap still open: borrower-facing AI chat, proactive opportunity identification, mobile-first builder
- 70%+ of borrowers open share page on phones — mobile-first always
- Design system: IBM Plex Mono, gold #C9A84C, dark backgrounds

## Mortgage Coach Gaps
- Borrower-facing AI chat (within the presentation) — not yet in scope
- Mobile-optimized LO builder interface — not in scope yet
- Enterprise usage insights — not in scope
- Proactive opportunity identification (non-credit coaching) — not in scope

## Prior Session Summary
- Apr 8 AM: "Commonly Chosen" badge — lowest-payment OptionCard gets gold pill badge + card treatment; hidden for single-scenario views
- Files: `src/components/share/OptionCardsGrid.tsx`, `src/components/share/OptionCard.tsx`
- Build: ✅ PASS | Commit: bcf6eb4 | Vercel: READY

## Priority Improvements
1. Share page: video/loom embed placeholder (Tier 4 item 3 — LAST TIER 4 ITEM)
2. PDF: "Commonly Chosen" label in PDF output
3. Define Tier 5 in domain-queue.md

## Briefing for Builder
Do NOT re-research:
- Basic share page structure (done)
- OptionCard gold treatment (done — now tracks isCommonlyChosen not index)
- Mobile layout fixes (done Apr 7)
Focus new work on:
- Loom embed slot above OptionCardsGrid on share page
- Input: videoUrl field on scenario, or hardcoded LO profile video fallback
- Must render at mobile (390px) — responsive iframe embed
