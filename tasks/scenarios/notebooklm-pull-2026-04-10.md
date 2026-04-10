# NotebookLM Pull Report — 2026-04-10 AM
Active Topic: PDF "Commonly Chosen" label (Tier 5 item 1)

## What We Already Know
- Share page redesign, PDF redesign, AI narrative personalization — all complete
- Buydown/ARM/rent-vs-own/waiting-cost analysis — all complete
- Email from builder, refi timing, equity chart, engagement tracking — complete
- Mobile polish, "Commonly Chosen" badge on share page, video embed — Tier 4 done
- Tier 5 defined: PDF badge, comparison table, scenario naming, refi pre-fill, social proof

## Mortgage Coach Gaps
Remaining (per notebook):
- Custom scenario naming ("Conservative" vs "Option A") — still generic in LoanOS
- Side-by-side comparison table on share page — buried behind DetailAccordion tap
- Refi pre-fill from loan record — refi mode still requires manual entry

## Prior Session Summary
- 2026-04-09 AM: Video/Loom embed on share page — Tier 4 complete
- 2026-04-10 AM (this session): PDF "Commonly Chosen" badge — Tier 5 item 1

## Priority Improvements
From Tier 5 queue:
1. ~~PDF "Commonly Chosen" label~~ ← this session
2. Scenario comparison table on share page
3. Builder: scenario naming
4. Refi builder: current loan pre-fill
5. Share page: social proof block

## Briefing for Builder
- Do NOT re-research share page layout — already final
- Do NOT re-research Mortgage Coach input speed — already closed
- Focus: scenario naming carries through JSON `scenarios_data` — no schema migration needed
- Comparison table: reads from `DisplayData.rows`, render below OptionCardsGrid, mobile-first
