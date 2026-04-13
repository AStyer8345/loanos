## Scenarios Mission Brief — 2026-04-13 AM

### Focus Area
Refi builder: current loan pre-fill (Tier 5, item 4)

### Why This Matters
When an LO launches the scenario builder from a refi loan record, the current
loan section is pre-filled with the NEW loan's rate and payment (Arive's proposed
terms), not the borrower's existing mortgage. The LO sees wrong numbers and must
erase and re-enter. The refi scenario's newLoanAmount is also left at 0 despite
the loan amount being known. This closes the fast-input gap vs Mortgage Coach.

### Session Type
[x] Build

### Objectives
1. Fix semantic bug: stop populating current loan with new loan's rate/payment
2. Pre-fill currentPayoffBalance = loan.loan_amount (correct for refi payoffs)
3. Pre-fill newLoanAmount + interestRate + loanTerm in the refi scenario card
4. Pre-fill taxes/insurance/HOA in currentLoan from Arive data where available
5. Add subtle info banner in refi step when opened from a loan record

### Files in Scope
- src/app/dashboard/scenarios/new/page.tsx
- src/app/dashboard/scenarios/new/ScenarioBuilder.tsx
- src/lib/scenarios/types.ts

### Definition of Done
- npm run build passes, 0 TypeScript errors
- When opening from refi loan_id: payoff balance pre-filled, rate/amount blank for LO to enter
- Refi scenario: newLoanAmount + rate + term pre-filled from loan record
- Info banner shows in refi step when loan_id was provided
- Committed and pushed to main, Vercel READY
