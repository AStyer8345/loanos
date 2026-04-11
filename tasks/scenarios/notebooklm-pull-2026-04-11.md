# NotebookLM Pull Report — 2026-04-11 AM
Active Topic: Tier 5 — Depth + Conversion

## What We Already Know
- Tiers 1–4 fully complete: input speed, share page redesign, PDF redesign, AI narrative personalization, all scenario types (2-1 buydown, down payment, rent vs own, ARM vs fixed, cost of waiting, refi timing), email from builder, engagement tracking, mobile polish, "Commonly Chosen" badge, video embed
- PDF "Commonly Chosen" badge completed 2026-04-10 AM — share page and PDF now in sync
- LoanOS design system: IBM Plex Mono, gold #C9A84C, dark bg #0a0a0a

## Mortgage Coach Gaps (remaining)
- Custom scenario naming — LoanOS still uses "Option A / B / C" generic labels
- Comparison table not persistently visible — buried in DetailAccordion tap
- Refi builder pre-fill from loan record
- Social proof block (nice to have)
- Borrower-facing AI chat (longer-term)
- LO mobile builder speed (longer-term)

## Prior Session Summary
- Built: PDF "Commonly Chosen" badge — gold column header + pill in PDF output for lowest-payment scenario
- Commit: 57ca36e | Vercel: READY

## Priority Improvements
1. **Scenario naming** (Tier 5 item 3) — let LO label each scenario; carries through to share page and PDF
2. **Comparison table on share page** (Tier 5 item 2) — persistent side-by-side table below OptionCardsGrid
3. **Refi builder pre-fill** (Tier 5 item 4) — auto-populate current rate + balance from loan record

## Briefing for Builder
DO NOT re-research:
- Share page redesign patterns (done)
- PDF layout (done)
- Buydown / ARM / rent-vs-own math (done)

Focus new work on:
- Scenario name field: optional `name` per scenario stored in `scenarios_data` JSON; surface in form as text input below each loan amount field; carry name to share page OptionCard header and PDF column header
- Where names render: OptionCard title, PDF column header, AI narrative preamble, ActionsBar tooltip
