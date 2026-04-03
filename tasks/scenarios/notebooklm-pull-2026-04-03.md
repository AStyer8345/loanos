# NotebookLM Pull Report — 2026-04-03 AM
Active Topic: Total Cost of Waiting (Tier 3 item 3)

## What We Already Know
- Tier 1 (share page, PDF, AI narrative, input speed) — all complete
- Tier 2 (2-1 buydown, down payment comparison, rent vs own) — all complete
- Tier 3: email from builder ✅ DONE, ARM vs fixed ✅ DONE
- Total cost of waiting is the only remaining Tier 3 item
- Pattern established: client-side math components, no API calls, IBM Plex Mono + gold #C9A84C + dark bg, compliance footer required
- All new components follow the same wiring pattern: render in ScenarioBuilder.tsx after prior sections, conditional on loanAmount > 0

## Mortgage Coach Gaps
- Mobile-optimized view for share pages — still open
- Borrower-facing AI chat (24/7 Q&A within the presentation) — not built
- Engagement tracking (view events showing when borrower viewed the link) — view_count column exists but not displayed
- "Total cost of waiting" calculator — NOT YET BUILT (today's target)

## Prior Session Summary
- Built: ARM vs Fixed Comparison (ArmVsFixedSection.tsx)
  - Client-side only, ARM = fixed −0.5%, worst-case = fixed +2.0%
  - 3 stat cards + year-by-year table + break-even context box
  - Compliance footer, no API calls
  - Build ✅, committed 3bda8ec, Vercel dpl_D6wxNX5ZGgbpMtpQtn5cqWhxXKhy (BUILDING at close)
- Deferred: engagement tracking (view_count display), total cost of waiting

## Priority Improvements
1. Total cost of waiting — today's focus
   - Input: current purchase price, current rate, expected rate in 6 months (could be same or higher), price appreciation assumption
   - Output: monthly payment delta, additional interest cost, home price increase (appreciation), total cost of delay
   - Hero stat: "Waiting costs you ~$X/mo" (red)
   - Should feel like urgency without being a scare tactic — present trade-offs
2. Engagement tracking (view_count display) — secondary if time allows
3. Share page equity build curve chart — longer-term, visual storytelling

## Briefing for Builder
DO NOT re-research these — they are done:
- Share page design pattern
- PDF design pattern
- AI narrative personalization
- Buydown/ARM/RentVsOwn component patterns

Focus new work here:
- Total cost of waiting calculation: payment delta (new rate vs current rate on same loan), price appreciation delta, cumulative 6-month interest cost difference
- Component: WaitingCostSection.tsx — pure client-side, inputs: current rate, 6-month rate, home price appreciation rate (default 3% annual → 1.5% 6 months), loan term
- Render in purchase mode results, after ArmVsFixedSection
