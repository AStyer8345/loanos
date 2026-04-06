# NotebookLM Pull Report — 2026-04-06 AM
Active Topic: Engagement Tracking / Borrower View Count

## What We Already Know
- Tier 1 (share page, PDF, AI narrative), Tier 2 (buydown, down payment, rent vs own), and Tier 3 (email from builder, ARM vs fixed, cost of waiting) are complete per session log
- ShareEquityChart.tsx built and wired into SharePageLayout.tsx (Apr 3 share page redesign)
- RefiTimingSection.tsx built — covers "Should You Refi Now?" with break-even, rate threshold, 6-month cost of waiting
- view_count column exists in schema; increment_scenario_view_count RPC fires when share page loads
- view_count already shown in ScenarioList.tsx (list of saved scenarios)
- Mortgage Coach sends real-time "borrower viewed" alerts — LoanOS has no equivalent

## Mortgage Coach Gaps (remaining)
- No "view alert" in builder after save — Adam doesn't know when borrower opened the link
- view_count is tracked in DB but not surfaced in the builder ActionsBar

## Prior Session Summary
- AM 2026-04-03: Built WaitingCostSection (cost of waiting for purchase mode)
- Post-04-03 sessions (no log entries): built ShareEquityChart, RefiTimingSection, CashToCloseBreakdown, Share Page Redesign components
- Session log not updated since Apr 3 AM

## Priority Improvements (remaining)
1. view_count display in ActionsBar after save — show Adam how many times borrower viewed link
2. Anything else uncovered during build

## Briefing for Builder
- Do NOT rebuild: ShareEquityChart, RefiTimingSection, CashToCloseBreakdown, WaitingCostSection, ArmVsFixedSection — all exist
- Do NOT touch: auth, RLS, multi-tenant code
- Build target: ActionsBar.tsx — show view count badge after scenario is saved
- Data: view_count is on the scenarios row; fetch after save from /api/scenarios/[id] or pass from ScenarioBuilder
