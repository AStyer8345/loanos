# NotebookLM Pull Report — 2026-04-04 AM
Active Topic: Equity Build Curve Chart (Share Page)

## What We Already Know
- All Tier 1, 2, 3 improvements complete as of 2026-04-03 AM
- Share page completely rebuilt (2026-04-03): 12-component architecture in `src/components/share/`, Recharts already installed (PaymentComparisonChart uses it), clean component separation
- PDF unified with share page via `@media print` + `?print=1` — old 627-line generate-pdf template no longer called
- Dashboard results rebuilt into 3 tabbed sections: Comparison | Analysis | Charts
- ARM vs Fixed, Cost of Waiting, Rent vs Own, Down Payment Comparison, Buydown all live in Analysis tab

## Mortgage Coach Gaps (Still Open)
- **Equity build curve**: Not yet on share page. Research repeatedly identifies this as "the single most emotionally compelling chart" — visualizes growing net worth vs declining loan balance over 30 years. MC has this. LoanOS does not.
- **Engagement tracking**: `view_count` column already in schema — not yet displayed to Adam after save. MC shows LO when borrower opens the link.
- **Cost of waiting (refi mode)**: Purchase mode has WaitingCostSection.tsx. Refi mode has no parallel tool.

## Prior Session Summary
- 2026-04-03 AM: WaitingCostSection.tsx (purchase mode) — shows what waiting 6 months costs in monthly payment delta + home price increase + total lifetime cost delta
- 2026-04-03 sessions 2+3: Share page rebuilt (12 new components), dashboard results tabbed, PDF unified with share page, dynamic LO branding added to share page

## Priority Improvements
1. **Equity build curve on share page** — most impactful remaining MC gap, Recharts already present
2. **Engagement tracking** — view_count display in ActionsBar after save (simpler, operational)
3. **Cost of waiting (refi)** — parallel to purchase mode's WaitingCostSection

## Briefing for Builder
Do NOT re-research: share page architecture (just rebuilt), PDF approach (now @media print), buydown/ARM/downpayment/rent-vs-own (all done)

Focus new work here:
- Equity build curve: Recharts LineChart with two lines — `Loan Balance` (orange/red, declining) and `Equity` (gold, rising). X-axis = Year 0-30. Data derived from amortization simulation on the lowest-rate scenario. Overlay a third line for appreciation if we have purchase price. Add to share page as a new ShareEquityChart.tsx component.
- Data inputs needed: loanAmount, interestRate, termMonths, downPayment (for initial equity), purchasePrice (for appreciation). All available in DisplayData.
