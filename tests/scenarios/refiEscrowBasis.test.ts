import { describe, it, expect } from 'vitest'
import { calculateCurrentLoan, calculateRefiScenario } from '@/lib/scenarios/calculations'
import type { CurrentLoanInput, RefiScenarioInput } from '@/lib/scenarios/types'

/**
 * CHARACTERIZATION — refi savings compares a PITI against a P&I.
 *
 * calculations.ts:328 computes
 *   monthlySavings = currentCalc.totalMonthlyPayment - newTotalMonthly
 * where the current total (:293) includes taxes/insurance/HOA/PMI and the new total
 * (:325) includes whatever escrow the LO entered on the scenario — zero, by default,
 * on both the blank-start path (DEFAULT_REFI_SCENARIO) and the Import-Statement path
 * (StatementUpload writes escrow to the CURRENT loan only).
 *
 * Inputs below are verbatim from production scenario fcb3ebb5-fc9a-4fcb-88af-e11137fdcdc5
 * (refinance, 2026-03-29). The stored AI narrative on that row quotes $4,193.45,
 * $2,901.00, $1,292.45, "five months" and $77,547 — all reproduced exactly here.
 *
 * These assertions pin CURRENT behavior. They are expected to change if/when the
 * escrow-basis question is decided; see tasks/scenarios/audits/2026-08-31-refi-escrow-basis.md.
 */

const currentLoan = {
  hoa: 0, pmi: 0, debts: [], insurance: 200, interestRate: 6.625,
  loanStartDate: '2024-06', propertyTaxes: 1016, currentMonthlyPI: 0,
  originalLoanTerm: 30, originalLoanAmount: 465000, currentPayoffBalance: 0,
} as unknown as CurrentLoanInput

const asStored = {
  hoa: 0, pmi: 0, label: '', points: 0, loanTerm: 30, loanType: 'conventional',
  insurance: 0, payOffDebts: false, closingCosts: 6041, interestRate: 6.375,
  cashOutAmount: 0, newLoanAmount: 465000, pointsPercent: 0, propertyTaxes: 0,
  creditsPercent: 0, extraMonthlyPayment: 0,
} as unknown as RefiScenarioInput

const escrowCarried = {
  ...asStored, propertyTaxes: 1016, insurance: 200,
} as unknown as RefiScenarioInput

const PROPERTY_VALUE = 800000

describe('refi escrow basis (production row fcb3ebb5)', () => {
  const cc = calculateCurrentLoan(currentLoan)

  it('current loan total is PITI, not P&I', () => {
    expect(cc.monthlyPI).toBeCloseTo(2977.45, 2)
    expect(cc.totalMonthlyPayment).toBeCloseTo(4193.45, 2)
    expect(cc.totalMonthlyPayment - cc.monthlyPI).toBeCloseTo(1216, 2)
  })

  it('as stored: escrow-free scenario reproduces the stored narrative figures', () => {
    const r = calculateRefiScenario(asStored, currentLoan, cc, PROPERTY_VALUE)
    expect(r.newTotalMonthlyPayment).toBeCloseTo(2901.0, 2)
    expect(r.monthlySavings).toBeCloseTo(1292.45, 2)
    expect(r.breakEvenMonth).toBe(5)
    expect(r.totalSavings5Year).toBeCloseTo(77547.3, 2)
  })

  it('carrying escrow forward collapses the savings to the true P&I delta', () => {
    const r = calculateRefiScenario(escrowCarried, currentLoan, cc, PROPERTY_VALUE)
    expect(r.newTotalMonthlyPayment).toBeCloseTo(4117.0, 2)
    expect(r.monthlySavings).toBeCloseTo(76.45, 2)
    expect(r.breakEvenMonth).toBe(80)
    expect(r.totalSavings5Year).toBeCloseTo(4587.3, 2)
  })

  it('the entire discrepancy is the current loan escrow — nothing else moves', () => {
    const a = calculateRefiScenario(asStored, currentLoan, cc, PROPERTY_VALUE)
    const b = calculateRefiScenario(escrowCarried, currentLoan, cc, PROPERTY_VALUE)
    const escrow = currentLoan.propertyTaxes + currentLoan.insurance + currentLoan.hoa + currentLoan.pmi
    expect(a.monthlySavings - b.monthlySavings).toBeCloseTo(escrow, 2)
    // Same loan, same rate, same term: the loan-side numbers are untouched.
    expect(a.newMonthlyPI).toBeCloseTo(b.newMonthlyPI, 2)
  })

  it('net of closing costs, the sign of the 5-year outcome flips', () => {
    const a = calculateRefiScenario(asStored, currentLoan, cc, PROPERTY_VALUE)
    const b = calculateRefiScenario(escrowCarried, currentLoan, cc, PROPERTY_VALUE)
    expect(a.totalSavings5Year - 6041).toBeGreaterThan(0)
    expect(b.totalSavings5Year - 6041).toBeLessThan(0)
  })
})
