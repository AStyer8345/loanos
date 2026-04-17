# NotebookLM Pull Report — 2026-04-17 AM
Active Topic: Mobile Builder Quick-Input Form (Tier 6 Item 3)

## What We Already Know
- Tiers 1-5 complete: input speed, share page, PDF, AI narrative, buydown, down payment, rent vs own, email, ARM vs fixed, waiting cost, refi timing, equity chart, engagement tracking, mobile share audit, "Commonly Chosen" badge, video embed, PDF badge, comparison table, scenario naming, refi pre-fill, social proof, DetailAccordion cleanup, Borrower Q&A, Q&A Backfill
- MC gap progression: strong progress — personalized narrative, share page, PDF, engagement tracking, social proof all shipped
- The "red light" scenario creation is the key MC mobile advantage: fast enough to build a scenario in under 60 seconds on phone

## Mortgage Coach Gaps
- Interactive borrower AI chat (24/7, answers questions in real-time) — largest remaining MC gap
- Mobile builder agility: MC has a dedicated mobile app for < 1-minute scenario creation ("red light" creation)
- Mobile builder quick-input: current ScenarioBuilder is desktop-centric in practice

## Prior Session Summary
- April 16 AM: Backfill Q&A — extracted generateQAPairs.ts, refactored generate-qa route, new POST /api/scenarios/backfill-qa, ScenarioList gold banner + button, fixed ghost @types build blocker
- Commit 44591dc | Vercel dpl_AcAJa7aKTQgd8UxLRrYTRdqBpWCY → READY

## Priority Improvements
1. Mobile builder quick-input form (Tier 6 Item 3) — TODAY's target
2. Define Tier 7 — after mobile quick-input ships
3. Borrower-facing AI chat — biggest remaining MC gap (complex, defer to Tier 7)

## Briefing for Builder
Focus: MobileQuickInput component with rate/term/price/down only. Must:
- Render only on mobile (sm:hidden or similar)
- Instant calculation (no full form submission required)
- Generate share link via existing save flow
- 4 fields max: purchase price, down payment %, rate, loan term
- Show estimated monthly payment live as user types
- One-tap "Get Share Link" button

NOTEBOOKLM (PULL): COMPLETE — 2026-04-17 07:30 AM CDT
