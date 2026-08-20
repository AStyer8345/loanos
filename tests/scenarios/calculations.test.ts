/**
 * Characterization tests for the Scenarios calculation engine.
 *
 * These lock in the numeric behavior of src/lib/scenarios/calculations.ts, which
 * produces every figure on the borrower-facing share page and PDF. The engine had
 * no test coverage before 2026-08-20 despite being the numeric core of the product.
 *
 * Expected values below were verified against independent closed-form calculation,
 * not copied from the implementation. Where a value merely records current behavior
 * rather than a verified-correct result, it is marked CHARACTERIZATION.
 */
import { describe, it, expect } from 'vitest'
import {
  monthlyPayment,
  amortizationSchedule,
  remainingBalance,
  monthsElapsed,
  estimateAPR,
  getBuydownRates,
  calculateBuydownCost,
  pmiRemovalMonth,
  calculateReinvestment,
  calculatePurchaseScenario,
  calculateCurrentLoan,
  calculateRefiScenario,
} from '@/lib/scenarios/calculations'
import type {
  PurchaseScenarioInput,
  RefiScenarioInput,
  CurrentLoanInput,
  ClosingCostBreakdown,
} from '@/lib/scenarios/types'

const ccb = {} as ClosingCostBreakdown

function purchase(over: Partial<PurchaseScenarioInput> = {}): PurchaseScenarioInput {
  return {
    id: 'a', label: 'A', loanType: 'conventional',
    purchasePrice: 500000, downPaymentAmount: 100000, downPaymentPercent: 20,
    loanAmount: 400000, interestRate: 6.5, loanTerm: 30,
    pointsPercent: 0, creditsPercent: 0, points: 0,
    propertyTaxes: 800, homeownersInsurance: 150, hoa: 0, pmi: 0,
    closingCostBreakdown: ccb, totalClosingCosts: 8000, sellerCredits: 0,
    buydownType: 'none', buydownYearRates: [], extraMonthlyPayment: 0,
    ...over,
  }
}

function currentLoan(over: Partial<CurrentLoanInput> = {}): CurrentLoanInput {
  return {
    originalLoanAmount: 400000, loanStartDate: '2021-08', originalLoanTerm: 30,
    interestRate: 7.5, currentMonthlyPI: 0, currentPayoffBalance: 0,
    propertyTaxes: 800, insurance: 150, hoa: 0, pmi: 0, debts: [],
    ...over,
  }
}

function refi(over: Partial<RefiScenarioInput> = {}): RefiScenarioInput {
  return {
    id: 'r', label: 'R', loanType: 'conventional',
    newLoanAmount: 380000, interestRate: 6.0, loanTerm: 30,
    pointsPercent: 0, creditsPercent: 0, points: 0,
    closingCostBreakdown: ccb, closingCosts: 6000,
    cashOutAmount: 0, payOffDebts: false,
    propertyTaxes: 800, insurance: 150, hoa: 0, pmi: 0,
    extraMonthlyPayment: 0,
    ...over,
  }
}

// ─── Core amortization ──────────────────────────────────────────────

describe('monthlyPayment', () => {
  it('matches the standard annuity formula', () => {
    // Independently verified: $400k @ 6.5% / 30yr = $2,528.27
    expect(monthlyPayment(400000, 6.5, 30)).toBeCloseTo(2528.27, 2)
  })

  it('produces a payment that exactly amortizes the loan', () => {
    // Property check rather than a hand-computed constant: discounting the
    // payment stream at the note rate must return the original principal.
    for (const [p, rate, term] of [
      [400000, 6.5, 30], [250000, 7.25, 15], [750000, 5.875, 20], [180000, 3.25, 10],
    ] as const) {
      const m = monthlyPayment(p, rate, term)
      const r = rate / 100 / 12
      const n = term * 12
      const pv = m * (1 - Math.pow(1 + r, -n)) / r
      expect(pv).toBeCloseTo(p, 4)
    }
  })

  it('falls back to straight-line when the rate is zero', () => {
    expect(monthlyPayment(120000, 0, 10)).toBe(1000)
  })

  it('returns 0 for non-positive principal or term', () => {
    expect(monthlyPayment(0, 6.5, 30)).toBe(0)
    expect(monthlyPayment(-1000, 6.5, 30)).toBe(0)
    expect(monthlyPayment(400000, 6.5, 0)).toBe(0)
  })
})

describe('amortizationSchedule', () => {
  it('runs the full term and retires the balance exactly', () => {
    const s = amortizationSchedule(400000, 6.5, 30)
    expect(s).toHaveLength(360)
    expect(s[s.length - 1].balance).toBe(0)
  })

  it('splits the first payment correctly', () => {
    const s = amortizationSchedule(400000, 6.5, 30)
    // First month interest = 400000 * 0.065/12 = 2166.67
    expect(s[0].interest).toBeCloseTo(2166.67, 2)
    expect(s[0].principal).toBeCloseTo(361.61, 2)
  })

  it('reconciles total interest with payments minus principal', () => {
    const s = amortizationSchedule(400000, 6.5, 30)
    const total = s[s.length - 1].cumulativeInterest
    expect(total).toBeCloseTo(360 * 2528.272093971861 - 400000, 0)
    expect(total).toBeCloseTo(510177.95, 1)
  })

  it('shortens the term and cuts interest when extra payment is applied', () => {
    const base = amortizationSchedule(400000, 6.5, 30)
    const extra = amortizationSchedule(400000, 6.5, 30, 500)
    expect(extra).toHaveLength(233)
    expect(extra[extra.length - 1].balance).toBe(0)
    const saved = base[base.length - 1].cumulativeInterest - extra[extra.length - 1].cumulativeInterest
    expect(saved).toBeGreaterThan(200000)
  })

  it('handles a zero-rate loan without producing interest', () => {
    const s = amortizationSchedule(120000, 0, 10)
    expect(s).toHaveLength(120)
    expect(s[s.length - 1].cumulativeInterest).toBe(0)
    expect(s[s.length - 1].balance).toBe(0)
  })

  it('returns an empty schedule for degenerate input', () => {
    expect(amortizationSchedule(0, 6.5, 30)).toEqual([])
    expect(amortizationSchedule(400000, 6.5, 0)).toEqual([])
  })
})

describe('remainingBalance', () => {
  it('agrees with the iterative schedule to the cent', () => {
    // Closed-form vs iterative are independent code paths; they must not drift.
    const s = amortizationSchedule(400000, 6.5, 30)
    expect(remainingBalance(400000, 6.5, 30, 60)).toBeCloseTo(s[59].balance, 2)
    expect(remainingBalance(400000, 6.5, 30, 120)).toBeCloseTo(s[119].balance, 2)
    expect(remainingBalance(400000, 6.5, 30, 240)).toBeCloseTo(s[239].balance, 2)
  })

  it('returns the full principal at month 0 and zero at term', () => {
    expect(remainingBalance(400000, 6.5, 30, 0)).toBe(400000)
    expect(remainingBalance(400000, 6.5, 30, 360)).toBe(0)
    expect(remainingBalance(400000, 6.5, 30, 500)).toBe(0)
  })
})

describe('monthsElapsed', () => {
  it('counts whole months from a YYYY-MM start', () => {
    const now = new Date()
    const stamp = `${now.getFullYear() - 3}-${String(now.getMonth() + 1).padStart(2, '0')}`
    expect(monthsElapsed(stamp)).toBe(36)
  })

  it('returns 0 for an empty date', () => {
    expect(monthsElapsed('')).toBe(0)
  })

  it('CHARACTERIZATION: returns a negative count for a future start date', () => {
    // Not clamped. Feeds remainingBalance, which then reports a payoff ABOVE the
    // original loan amount. See tests/scenarios findings memo 2026-08-20.
    const now = new Date()
    const future = `${now.getFullYear() + 1}-${String(now.getMonth() + 1).padStart(2, '0')}`
    expect(monthsElapsed(future)).toBe(-12)
  })
})

// ─── APR ────────────────────────────────────────────────────────────

describe('estimateAPR', () => {
  it('equals the note rate when there are no upfront costs', () => {
    expect(estimateAPR(400000, 6.5, 30, 0)).toBeCloseTo(6.5, 3)
  })

  it('converges to the independently-computed APR with costs financed', () => {
    // Solving 2528.272 * annuity(i,360) = 392000 gives i ≈ 6.696% annual.
    expect(estimateAPR(400000, 6.5, 30, 8000)).toBeCloseTo(6.695, 2)
    expect(estimateAPR(400000, 6.5, 30, 4000)).toBeCloseTo(6.597, 2)
    expect(estimateAPR(400000, 6.5, 30, 12000)).toBeCloseTo(6.795, 2)
  })

  it('rises monotonically with upfront cost', () => {
    const a = estimateAPR(400000, 6.5, 30, 0)
    const b = estimateAPR(400000, 6.5, 30, 5000)
    const c = estimateAPR(400000, 6.5, 30, 15000)
    expect(b).toBeGreaterThan(a)
    expect(c).toBeGreaterThan(b)
  })

  it('degrades safely on nonsense input', () => {
    expect(estimateAPR(0, 6.5, 30, 1000)).toBe(0)
    expect(estimateAPR(400000, 6.5, 0, 1000)).toBe(0)
    // Costs exceeding the loan fall back to the note rate rather than diverging.
    expect(estimateAPR(400000, 6.5, 30, 500000)).toBe(6.5)
  })
})

// ─── Buydown ────────────────────────────────────────────────────────

describe('buydown', () => {
  it('steps the rate down per buydown type', () => {
    expect(getBuydownRates(6.5, '2-1')).toEqual([4.5, 5.5])
    expect(getBuydownRates(6.5, '3-2-1')).toEqual([3.5, 4.5, 5.5])
    expect(getBuydownRates(6.5, '1-0')).toEqual([5.5])
    expect(getBuydownRates(6.5, 'none')).toEqual([])
  })

  it('prices the subsidy as the sum of annual payment differences', () => {
    const cost = calculateBuydownCost(400000, 6.5, '2-1', 30)
    const base = monthlyPayment(400000, 6.5, 30)
    const y1 = (base - monthlyPayment(400000, 4.5, 30)) * 12
    const y2 = (base - monthlyPayment(400000, 5.5, 30)) * 12
    expect(cost).toBeCloseTo(y1 + y2, 1)
    expect(cost).toBeCloseTo(9103.76, 1)
  })

  it('floors the bought-down rate at zero', () => {
    // A 3-2-1 on a 2% note must not produce a negative rate.
    expect(calculateBuydownCost(400000, 2, '3-2-1', 30)).toBeGreaterThan(0)
    expect(Number.isFinite(calculateBuydownCost(400000, 2, '3-2-1', 30))).toBe(true)
  })
})

// ─── PMI ────────────────────────────────────────────────────────────

describe('pmiRemovalMonth', () => {
  it('finds the month the balance crosses 78% of value', () => {
    expect(pmiRemovalMonth(450000, 500000, 6.5, 30, 'conventional')).toBe(109)
  })

  it('applies only to conventional loans', () => {
    expect(pmiRemovalMonth(450000, 500000, 6.5, 30, 'fha')).toBeUndefined()
    expect(pmiRemovalMonth(450000, 500000, 6.5, 30, 'va')).toBeUndefined()
  })

  it('returns undefined without a property value', () => {
    expect(pmiRemovalMonth(450000, 0, 6.5, 30, 'conventional')).toBeUndefined()
  })
})

// ─── Reinvestment ───────────────────────────────────────────────────

describe('calculateReinvestment', () => {
  it('matches the future value of an ordinary annuity', () => {
    // 500/mo @ 7% for 10y => 500 * ((1+r)^120 - 1)/r ≈ 86,542
    const r = calculateReinvestment(500, 7, 10)
    expect(r.futureValue).toBeCloseTo(86542.4, 0)
    expect(r.totalContributed).toBe(60000)
    expect(r.totalGrowth).toBeCloseTo(r.futureValue - 60000, 2)
    expect(r.yearlySnapshots).toHaveLength(10)
  })

  it('returns a zeroed result for non-positive savings or horizon', () => {
    expect(calculateReinvestment(0, 7, 10).futureValue).toBe(0)
    expect(calculateReinvestment(500, 7, 0).futureValue).toBe(0)
  })
})

// ─── Purchase ───────────────────────────────────────────────────────

describe('calculatePurchaseScenario', () => {
  it('computes the headline figures for a standard 80% LTV purchase', () => {
    const r = calculatePurchaseScenario(purchase(), 500000)
    expect(r.monthlyPI).toBeCloseTo(2528.27, 2)
    expect(r.totalMonthlyPayment).toBeCloseTo(3478.27, 2) // + 800 tax + 150 ins
    expect(r.ltv).toBe(80)
    expect(r.apr).toBeCloseTo(6.695, 2)
    expect(r.cashToClose).toBe(108000) // 100k down + 8k closing
  })

  it('reconciles the 5-year cost with its components', () => {
    const r = calculatePurchaseScenario(purchase(), 500000)
    const s = amortizationSchedule(400000, 6.5, 30)
    const pi60 = s.slice(0, 60).reduce((acc, e) => acc + e.payment, 0)
    expect(r.totalCost5Year).toBeCloseTo(pi60 + 950 * 60 + 108000, 1)
  })

  it('builds equity from down payment plus principal paid', () => {
    const r = calculatePurchaseScenario(purchase(), 500000)
    const s = amortizationSchedule(400000, 6.5, 30)
    expect(r.equityYear1).toBeCloseTo(100000 + s[11].cumulativePrincipal, 2)
    expect(r.equityYear5).toBeCloseTo(100000 + s[59].cumulativePrincipal, 2)
    expect(r.equityYear10).toBeCloseTo(100000 + s[119].cumulativePrincipal, 2)
  })

  it('applies lender credits to cash to close and APR', () => {
    const base = calculatePurchaseScenario(purchase(), 500000)
    const credited = calculatePurchaseScenario(purchase({ creditsPercent: 1 }), 500000)
    expect(credited.cashToClose).toBe(base.cashToClose - 4000) // 1% of 400k
    expect(credited.apr).toBeLessThan(base.apr)
  })

  it('treats legacy negative points as a credit', () => {
    const r = calculatePurchaseScenario(purchase({ points: -3000 }), 500000)
    expect(r.cashToClose).toBe(105000)
  })

  it('reports extra-payment savings', () => {
    const r = calculatePurchaseScenario(purchase({ extraMonthlyPayment: 500 }), 500000)
    expect(r.adjustedPayoffMonths).toBe(233)
    expect(r.yearsSaved).toBe(10)
    expect(r.monthsSaved).toBe(7)
    expect(r.interestSaved).toBeGreaterThan(200000)
  })

  it('emits buydown payments and cost when a buydown is selected', () => {
    const r = calculatePurchaseScenario(purchase({ buydownType: '2-1' }), 500000)
    expect(r.buydownPayments).toHaveLength(2)
    expect(r.buydownPayments?.[0].rate).toBe(4.5)
    expect(r.buydownCost).toBeCloseTo(9103.76, 1)
  })

  it('falls back to purchase price when property value is absent', () => {
    const r = calculatePurchaseScenario(purchase(), 0)
    expect(r.ltv).toBe(80)
  })

  it('CHARACTERIZATION: pmiRemovalMonth ignores extra monthly payments', () => {
    // The loan retires 173 months early with $1,000/mo extra, so PMI would in
    // reality clear far sooner than the reported month. See findings memo 2026-08-20.
    const noExtra = calculatePurchaseScenario(
      purchase({ loanAmount: 450000, downPaymentAmount: 50000 }), 500000)
    const withExtra = calculatePurchaseScenario(
      purchase({ loanAmount: 450000, downPaymentAmount: 50000, extraMonthlyPayment: 1000 }), 500000)
    expect(noExtra.pmiRemovalMonth).toBe(109)
    expect(withExtra.pmiRemovalMonth).toBe(109)
    expect(withExtra.adjustedPayoffMonths).toBe(187)
  })
})

// ─── Current loan ───────────────────────────────────────────────────

describe('calculateCurrentLoan', () => {
  it('derives payment and payoff from origination facts', () => {
    const now = new Date()
    const fiveYearsAgo = `${now.getFullYear() - 5}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const c = calculateCurrentLoan(currentLoan({ loanStartDate: fiveYearsAgo }))
    expect(c.monthlyPI).toBeCloseTo(2796.86, 2) // 400k @ 7.5 / 30
    expect(c.payoffBalance).toBeCloseTo(378469.75, 1)
    expect(c.remainingMonths).toBe(300)
    expect(c.totalMonthlyPayment).toBeCloseTo(3746.86, 2)
  })

  it('prefers explicit overrides over derived values', () => {
    const c = calculateCurrentLoan(currentLoan({
      currentMonthlyPI: 2500, currentPayoffBalance: 350000,
    }))
    expect(c.monthlyPI).toBe(2500)
    expect(c.payoffBalance).toBe(350000)
  })
})

// ─── Refinance ──────────────────────────────────────────────────────

describe('calculateRefiScenario', () => {
  const c = currentLoan()

  it('computes savings and break-even for a rate-and-term refi', () => {
    const cc = calculateCurrentLoan(c)
    const r = calculateRefiScenario(refi(), c, cc, 600000)
    expect(r.monthlySavings).toBeCloseTo(cc.totalMonthlyPayment - r.newTotalMonthlyPayment, 2)
    expect(r.breakEvenMonth).toBe(Math.ceil(6000 / r.monthlySavings))
    expect(r.annualSavings).toBeCloseTo(r.monthlySavings * 12, 1)
  })

  it('rolls payoff plus debts plus closing costs when consolidating', () => {
    const withDebt = currentLoan({
      debts: [{ id: 'd', description: 'Card', monthlyPayment: 400, balance: 12000 }],
    })
    const cc = calculateCurrentLoan(withDebt)
    const r = calculateRefiScenario(refi({ payOffDebts: true }), withDebt, cc, 600000)
    const expectedLoan = cc.payoffBalance + 12000 + 6000
    expect(r.newMonthlyPI).toBeCloseTo(monthlyPayment(expectedLoan, 6.0, 30), 2)
    expect(r.newLtv).toBeCloseTo((expectedLoan / 600000) * 100, 1)
    expect(r.debtsEliminated).toHaveLength(1)
    // Eliminated debt payments count toward net cash flow, not monthly savings.
    expect(r.netMonthlyCashFlowImprovement).toBeCloseTo(r.monthlySavings + 400, 2)
  })

  it('adds cash out to the payoff balance', () => {
    const cc = calculateCurrentLoan(c)
    const r = calculateRefiScenario(refi({ cashOutAmount: 50000 }), c, cc, 600000)
    const expectedLoan = cc.payoffBalance + 50000
    expect(r.newMonthlyPI).toBeCloseTo(monthlyPayment(expectedLoan, 6.0, 30), 2)
    expect(r.cashOutReceived).toBe(50000)
  })

  it('CHARACTERIZATION: savings horizons are gross of closing costs', () => {
    // totalSavings3/5/10Year are monthlySavings * n, with no closing-cost deduction.
    // The dashboard discloses this ("Gross savings — does not deduct closing cost
    // differences"); the PDF and AI narrative do not. See findings memo 2026-08-20.
    const cc = calculateCurrentLoan(c)
    const r = calculateRefiScenario(refi(), c, cc, 600000)
    // monthlySavings is rounded to cents on output; the horizons multiply the
    // unrounded value, so allow sub-dollar drift.
    expect(r.totalSavings3Year).toBeCloseTo(r.monthlySavings * 36, 0)
    expect(r.totalSavings5Year).toBeCloseTo(r.monthlySavings * 60, 0)
    expect(r.totalSavings10Year).toBeCloseTo(r.monthlySavings * 120, 0)
    // The closing costs the break-even calculation uses are not deducted here.
    expect(r.breakEvenMonth).toBeGreaterThan(0)
    expect(r.totalSavings5Year).toBeGreaterThan(r.monthlySavings * 60 - 6000)
  })

  it('CHARACTERIZATION: break-even is 0 when the refi never pays back', () => {
    // Callers must treat 0 as "never", not "immediately". displayData.ts and
    // RefiTimingSection.tsx both guard this; generate-narrative does not.
    const cc = calculateCurrentLoan(c)
    const r = calculateRefiScenario(refi({ interestRate: 9.0 }), c, cc, 600000)
    expect(r.monthlySavings).toBeLessThan(0)
    expect(r.breakEvenMonth).toBe(0)
  })

  it('CHARACTERIZATION: consolidating drops cash out from the loan but still reports it', () => {
    // payOffDebts wins the branch, so cashOutAmount never reaches actualLoanAmount —
    // yet cashOutReceived still echoes it, and the AI narrative renders it verbatim.
    const withDebt = currentLoan({
      debts: [{ id: 'd', description: 'Card', monthlyPayment: 400, balance: 12000 }],
    })
    const cc = calculateCurrentLoan(withDebt)
    const r = calculateRefiScenario(
      refi({ payOffDebts: true, cashOutAmount: 50000 }), withDebt, cc, 600000)
    const loanWithoutCashOut = cc.payoffBalance + 12000 + 6000
    expect(r.newMonthlyPI).toBeCloseTo(monthlyPayment(loanWithoutCashOut, 6.0, 30), 2)
    expect(r.cashOutReceived).toBe(50000) // reported anyway
  })

  it('CHARACTERIZATION: a missing property value yields negative equity, not zero', () => {
    // newLtv guards pv <= 0; the equity figures do not.
    const cc = calculateCurrentLoan(c)
    const r = calculateRefiScenario(refi(), c, cc, 0)
    expect(r.newLtv).toBe(0)
    expect(r.equityYear1).toBeLessThan(0)
  })
})
