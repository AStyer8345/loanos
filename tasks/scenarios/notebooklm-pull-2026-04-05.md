# NotebookLM Pull Report — 2026-04-05 AM
Active Topic: Refi "Should I Wait?" Calculator + Engagement Tracking Polish

## What We Already Know
- All Tier 1 (share page, PDF, AI narrative), Tier 2 (buydown, down payment, rent vs own), and Tier 3 (email from builder, ARM vs fixed, total cost of waiting) are COMPLETE
- Share page completely rebuilt 2026-04-03: 12-component architecture in `src/components/share/`
- Equity build curve chart added to share page 2026-04-04 AM (ShareEquityChart.tsx)
- Cash to Close fee breakdown added 2026-04-05 (CashToCloseBreakdown.tsx)
- view_count atomic increment via RPC done (migration 077), displayed in ScenarioList.tsx
- Security hardening was the primary focus 2026-04-05 (not scenarios)

## Mortgage Coach Gaps (Still Open)
- **Refi "should I wait?" calculator**: Purchase mode has WaitingCostSection.tsx showing cost of waiting. Refi mode has no parallel — borrowers can't see "what rate drop makes this refi worth it?" or "how long until I break even if I refi today?"
- **Engagement tracking in ActionsBar**: view_count shown in list (raw number) but not displayed with context in ActionsBar after save — Adam doesn't see "Borrower viewed 3 times" inline when he saves a scenario
- **Borrower-facing AI chat**: MC has a 24/7 borrower chat inside presentations. LoanOS doesn't. (Lower priority — significant engineering effort)

## Prior Session Summary
- 2026-04-03 AM: WaitingCostSection.tsx — purchase mode cost of waiting
- 2026-04-03 sessions 2+3: Share page rebuild (12 components), tabbed dashboard results, PDF unified with @media print
- 2026-04-04 AM: ShareEquityChart.tsx — equity build curve on share page
- 2026-04-05: Security hardening (8 sessions), Cash to Close breakdown, chatbot UX

## Priority Improvements
1. **Refi "Should I Wait?" calculator** — parallel to WaitingCostSection. Borrower inputs: current rate, proposed new rate, loan balance, years left. Shows: monthly savings, break-even months, 5-yr savings, lifetime savings. Renders in refi mode.
2. **Engagement tracking polish** — upgrade ScenarioList view_count from raw number to "N views" with icon, show last-viewed date if available
3. **Borrower AI chat on share page** — longer-term, high effort, but closes the biggest remaining MC gap

## Briefing for Builder
Do NOT re-research: share page architecture, PDF approach, any Tier 1/2/3 analysis tools (all done).

Focus new work here:
- **Refi waiting calculator**: new component `RefiWaitingSection.tsx` in `src/app/dashboard/scenarios/new/`, renders in refi mode after BreakEvenTable. Inputs: current rate (pre-filled from `scenarios[0].interestRate` or user-editable), proposed rate (default = current - 0.5%). Calculate: newP&I - oldP&I = monthly savings, break-even = closingCosts / monthlySavings, lifetime interest difference.
- Data available on `ScenarioDisplayRow`: `currentLoanData.interestRate`, `currentLoanData.remainingBalance`, `currentLoanData.monthlyPayment`, `currentLoanData.monthsRemaining`. Closing costs: default $3,500 or user-editable.
- Follow WaitingCostSection.tsx pattern exactly — same 3-card hero + comparison table + context box + compliance footer.
