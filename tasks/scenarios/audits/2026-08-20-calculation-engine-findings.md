# Scenarios Calculation Engine — Correctness Audit + Test Coverage

**Date:** 2026-08-20 AM (scenarios-am)
**Scope:** `src/lib/scenarios/calculations.ts` and its consumers
**Deliverable:** `tests/scenarios/calculations.test.ts` — 45 tests, first coverage this engine has ever had
**Production writes:** none. **Runtime behavior changed:** none.

---

## Why this run went past the health check

The 08-19 run proved Scenarios *compiles*, has an *intact schema*, and calls a *current model*. It stated its own limit plainly: build-and-schema level, not correctness. Calculation math has been untested since the last code change on **2026-04-24**.

That limit was recorded as needing Adam's say-so, because a runtime smoke test means writing to production. **That framing was too broad.** It conflates two layers:

- the **route** layer (HTTP + Supabase + Anthropic + storage) — genuinely needs production writes;
- the **math** layer — `calculations.ts` is a pure, dependency-free module of exported functions.

The math is the part that actually produces every number a borrower reads, and it is testable in complete isolation. No authorization was needed and none was assumed. That gap is now closed.

---

## Verdict: the engine is numerically sound

Every core result was checked against independent closed-form calculation, not read off the implementation:

| Check | Result |
|---|---|
| `monthlyPayment(400000, 6.5, 30)` | **$2,528.27** — matches the standard annuity formula |
| Payment amortizes exactly | PV of the payment stream returns principal to 4 decimals, across 4 rate/term combinations |
| Total interest | $510,177.95 = 360 × payment − principal, reconciles exactly |
| **Closed-form vs iterative** | `remainingBalance()` and `amortizationSchedule()` are independent code paths — they **agree to the cent** at months 60, 120, 240 |
| APR, no costs | 6.5% — equals the note rate, correct |
| APR, $8k costs | 6.695% vs 6.696% computed by hand — correct, and monotonic in cost |
| 2-1 buydown subsidy | $9,103.76 = sum of annual payment deltas, verified |
| Reinvestment FV | $86,542 = ordinary-annuity FV of $500/mo @ 7% × 10y, verified |
| Zero-rate and degenerate inputs | Straight-line fallback, empty schedules, no NaN/Infinity leakage |
| Purchase 5-year cost | Reconciles exactly against its components |

The `remainingBalance` ⇄ `amortizationSchedule` agreement is the strongest single signal here: two independently-written implementations of the same quantity that match to the cent are unlikely to be jointly wrong.

**Nothing in the engine produces a materially wrong number.** The findings below are about *what gets omitted or mislabeled downstream*, not broken arithmetic.

---

## Findings

All four are **latent**. Scenarios has had zero production usage since 2026-05-01, so none of these has reached a real borrower. None is urgent. They are recorded so the decision on this task is made with full information.

### 1. The gross-savings disclosure does not reach either borrower-facing output — MODERATE

`totalSavings3/5/10Year` are `monthlySavings × n` with **no closing-cost deduction** (`calculations.ts:348-350`). That is a deliberate, documented choice — and the LO dashboard says so outright (`KeyMetricsGrid.tsx:325-331`):

> "Gross savings — does not deduct closing cost differences. See 'More Info' for net figures."

The net figure is already computed and available (`displayData.ts:277`, `netSavings5yr`). **The problem is that the disclosure travels no further than the dashboard.** Both borrower-facing surfaces present the gross number without it:

- **PDF** (`generate-pdf/route.ts:266`) — renders `Savings — 5 Years` with the sub-label `cumulative`. Not "gross", not "before closing costs". Grep for any disclosure language across the PDF route and the share components returns **zero hits**.
- **AI narrative** (`generate-narrative/route.ts:61`) — feeds `- 5-Year Savings: $X` into the prompt raw. The model has no way to know closing costs were excluded, and writes prose accordingly.

On the baseline refi tested ($6,000 costs), the borrower sees **$31,114** where the net is **$25,114** — a 24% overstatement at 5 years, **47% at 3 years**. Within the same result object, `breakEvenMonth` correctly says it takes 12 months to recover those same $6,000.

This is the one finding with compliance texture, given the charter rule *"never recommend a product, present trade-offs only."* The fix is small: pass `netSavings5yr` alongside, or carry the dashboard's disclosure string into the PDF card and the narrative prompt.

### 2. Debt consolidation silently drops cash-out from the loan but still reports it — MODERATE

`calculations.ts:317-322` branches: if `payOffDebts` is true, `cashOutAmount` **never reaches** `actualLoanAmount`. But line 398 still returns `cashOutReceived: cashOutAmount`, and `generate-narrative:63` renders it to the borrower verbatim as `- Cash Out: $50,000`.

**Reachable from the UI.** `ScenarioCard.tsx:535` is a free-entry "Cash Out Amount" field; `:540` is an independent `payOffDebts` checkbox. Nothing prevents both being set on one scenario.

Measured: payoff $378,469.75 + $12,000 debts + $6,000 costs = **$396,600 financed**, while the output reports **$50,000 cash out received**. The borrower is told about money that was never financed.

### 3. `pmiRemovalMonth` ignores extra monthly payments — LOW/MODERATE

`calculations.ts:268` calls the schedule without `extraMonthlyPayment`. Measured: a $450k loan reports PMI clearing at **month 109** both with and without $1,000/mo extra — even though the extra payment retires the loan in 187 months instead of 360. Real removal would be far earlier. Borrower-facing and always errs late.

### 4. Two unclamped edge cases — LOW

- **Break-even `0` means "never."** When `monthlySavings <= 0`, `breakEvenMonth` stays `0` (`:336`). `displayData.ts:308` and `RefiTimingSection.tsx:55` both guard this correctly. **`generate-narrative:60` does not** — it sends `Break-Even: Month 0` to the model, which reads as "immediately."
- **A future `loanStartDate` is not clamped.** `monthsElapsed` returns negative, and the payoff balance comes back **above** the original loan amount ($403,421 on a $400k loan) with `remainingMonths` of 372 on a 360-month term. Data-entry error, but it fails silently into plausible-looking output.

---

## Hypotheses tested and falsified — do not re-raise

Recorded so future runs don't burn a session re-deriving them:

- **`RefiTimingSection` recommending a losing refi** — no. Line 55 filters `monthlySavings <= 0` and returns `null`. Properly guarded.
- **`breakEvenMonth: 0` rendering as "month 0" in the dashboard or PDF** — no. `displayData.ts:308` and `:326` both gate on `> 0`.
- **Dashboard overstating savings** — no. It discloses the gross basis explicitly and links to net figures. The dashboard is the *well-designed* surface here; the gap is that the PDF and narrative don't inherit its care.
- **`interestSaved` falsy-zero collapsing to `undefined`** (`:272`) — unreachable in practice. Any `extraMonthlyPayment > 0` produces nonzero savings.
- **Buydown producing negative rates** — no. `Math.max(rate, 0)` is applied on both paths.

---

## Limits

- **Pure-function scope only.** The 9 API routes, PDF rendering, share-page rendering, and narrative quality remain untested. A rotated Anthropic/Resend key, an RLS change, or storage-permission drift is still invisible to this work — as it was to the 08-19 build check.
- **Findings 1–4 are read from code paths, not observed in a live render.** The data flow is unambiguous (raw calc field → prompt string / PDF cell), but no PDF was generated and no narrative was produced.
- Tests run on `codex/website-ai-assistant`, so Adam's in-flight work is included in what passed.

---

## Effect on the open decision (TODO L100)

**None. (c) pause still holds, and this is not an argument against it.**

The tests are deliberately *decision-neutral infrastructure*: they are worth having under either branch.

- Under **(c) pause**, they replace the regression-watch the cron was nominally providing — permanently, at zero recurring cost. That is strictly better than a daily no-op run.
- Under **(b) redirect**, they are the safety net any new Scenarios work would need before touching a shared calculation engine.

What this run does change is that the engine is now **characterized** rather than merely *compiling*. Four latent defects are documented with reproduction, severity, and reachability, so nobody has to rediscover them.

The usage question is untouched and remains Adam's: **34 rows, newest 2026-05-01, 111 days silent.** A correct engine nobody opens is still an engine nobody opens.
