/**
 * buildDisplayData — computes all values needed for the 7-section output.
 * Used by: output page (in-app), share/[token]/page.tsx, generate-pdf/route.ts
 * Never re-implement savings/break-even calculations outside this file.
 */

import type {
  PurchaseScenarioInput, PurchaseCalculatedResult,
  RefiScenarioInput, RefiCalculatedResult, CurrentLoanInput,
} from './types'

export interface ScenarioDisplayRow {
  label: string
  loanType: string
  purchasePrice?: number
  loanAmount: number
  interestRate: number
  apr: number
  monthlyPI: number
  totalMonthlyPayment: number
  cashToClose: number
  totalInterest: number
  // Savings vs baseline
  monthlySavingsVsCurrent?: number
  savings5yr?: number
  savings15yr?: number
  breakEvenMonths?: number
  breakEvenYears?: number
  additionalCostToClose?: number
  isRecommended: boolean
}

export interface KeyMetrics {
  monthlySavings: number
  savings5yr: number
  savings15yr: number
  totalInterestBest: number
}

export interface BreakEvenRow {
  label: string
  additionalCostToClose: number
  monthlySavings: number
  breakEvenMonths: number
  breakEvenYears: number
}

export interface CumulativeSavingsPoint {
  month: number
  [scenarioLabel: string]: number
}

export interface DisplayData {
  mode: 'purchase' | 'refinance'
  rows: ScenarioDisplayRow[]
  keyMetrics: KeyMetrics
  breakEvenRows: BreakEvenRow[]
  cumulativeSavingsData: CumulativeSavingsPoint[]
  recommendedIdx: number
}

// ─── Purchase ──────────────────────────────────────────────────────

export function buildPurchaseDisplayData(
  scenarios: PurchaseScenarioInput[],
  results: PurchaseCalculatedResult[]
): DisplayData {
  if (!results.length) return emptyDisplayData('purchase')

  // Baseline = scenario with highest monthly payment (most expensive)
  const baselineIdx = results.reduce((maxIdx, r, i) =>
    r.totalMonthlyPayment > results[maxIdx].totalMonthlyPayment ? i : maxIdx
  , 0)

  // Recommended = scenario with lowest total monthly payment
  const recommendedIdx = results.reduce((minIdx, r, i) =>
    r.totalMonthlyPayment < results[minIdx].totalMonthlyPayment ? i : minIdx
  , 0)

  const rows: ScenarioDisplayRow[] = scenarios.map((s, i) => {
    const r = results[i]
    const monthlySavings = results[baselineIdx].totalMonthlyPayment - r.totalMonthlyPayment
    const additionalCostToClose = r.cashToClose - results[baselineIdx].cashToClose
    const breakEvenMonths = monthlySavings > 0 && additionalCostToClose > 0
      ? Math.ceil(additionalCostToClose / monthlySavings)
      : 0

    return {
      label: s.label || `Option ${i + 1}`,
      loanType: s.loanType,
      purchasePrice: s.purchasePrice,
      loanAmount: s.loanAmount,
      interestRate: s.interestRate,
      apr: r.apr,
      monthlyPI: r.monthlyPI,
      totalMonthlyPayment: r.totalMonthlyPayment,
      cashToClose: r.cashToClose,
      totalInterest: r.totalInterest,
      monthlySavingsVsCurrent: i !== baselineIdx ? monthlySavings : 0,
      savings5yr: monthlySavings * 60,
      savings15yr: monthlySavings * 180,
      breakEvenMonths: i !== baselineIdx && breakEvenMonths > 0 ? breakEvenMonths : undefined,
      breakEvenYears: i !== baselineIdx && breakEvenMonths > 0 ? Math.round(breakEvenMonths / 12 * 10) / 10 : undefined,
      additionalCostToClose: i !== baselineIdx ? additionalCostToClose : undefined,
      isRecommended: i === recommendedIdx,
    }
  })

  const bestRow = rows[recommendedIdx]
  const keyMetrics: KeyMetrics = {
    monthlySavings: bestRow.monthlySavingsVsCurrent ?? 0,
    savings5yr: (bestRow.monthlySavingsVsCurrent ?? 0) * 60,
    savings15yr: (bestRow.monthlySavingsVsCurrent ?? 0) * 180,
    totalInterestBest: results[recommendedIdx].totalInterest,
  }

  const breakEvenRows: BreakEvenRow[] = rows
    .filter((r, i) => i !== baselineIdx && (r.breakEvenMonths ?? 0) > 0)
    .map(r => ({
      label: r.label,
      additionalCostToClose: r.additionalCostToClose ?? 0,
      monthlySavings: r.monthlySavingsVsCurrent ?? 0,
      breakEvenMonths: r.breakEvenMonths ?? 0,
      breakEvenYears: r.breakEvenYears ?? 0,
    }))

  const cumulativeSavingsData: CumulativeSavingsPoint[] = []
  for (let month = 0; month <= 84; month++) {
    const point: CumulativeSavingsPoint = { month }
    scenarios.forEach((_, i) => {
      if (i === baselineIdx) return
      const label = rows[i].label
      const savings = (rows[i].monthlySavingsVsCurrent ?? 0) * month - (rows[i].additionalCostToClose ?? 0)
      point[label] = Math.round(savings)
    })
    cumulativeSavingsData.push(point)
  }

  return { mode: 'purchase', rows, keyMetrics, breakEvenRows, cumulativeSavingsData, recommendedIdx }
}

// ─── Refinance ─────────────────────────────────────────────────────

export function buildRefiDisplayData(
  _currentLoan: CurrentLoanInput,
  scenarios: RefiScenarioInput[],
  results: RefiCalculatedResult[]
): DisplayData {
  if (!results.length) return emptyDisplayData('refinance')

  // Recommended = highest monthly savings
  const recommendedIdx = results.reduce((maxIdx, r, i) =>
    r.monthlySavings > results[maxIdx].monthlySavings ? i : maxIdx
  , 0)

  const rows: ScenarioDisplayRow[] = scenarios.map((s, i) => {
    const r = results[i]
    return {
      label: s.label || `Option ${i + 1}`,
      loanType: s.loanType,
      loanAmount: s.newLoanAmount,
      interestRate: s.interestRate,
      apr: r.apr,
      monthlyPI: r.newMonthlyPI,
      totalMonthlyPayment: r.newTotalMonthlyPayment,
      cashToClose: s.closingCosts,
      totalInterest: r.totalInterestNew,
      monthlySavingsVsCurrent: r.monthlySavings,
      savings5yr: r.totalSavings5Year,
      savings15yr: r.monthlySavings * 180,
      breakEvenMonths: r.breakEvenMonth > 0 ? r.breakEvenMonth : undefined,
      breakEvenYears: r.breakEvenMonth > 0 ? Math.round(r.breakEvenMonth / 12 * 10) / 10 : undefined,
      additionalCostToClose: s.closingCosts,
      isRecommended: i === recommendedIdx,
    }
  })

  const bestRow = rows[recommendedIdx]
  const keyMetrics: KeyMetrics = {
    monthlySavings: bestRow.monthlySavingsVsCurrent ?? 0,
    savings5yr: bestRow.savings5yr ?? 0,
    savings15yr: bestRow.savings15yr ?? 0,
    totalInterestBest: results[recommendedIdx].totalInterestNew,
  }

  const breakEvenRows: BreakEvenRow[] = rows
    .filter(r => (r.breakEvenMonths ?? 0) > 0)
    .map(r => ({
      label: r.label,
      additionalCostToClose: r.additionalCostToClose ?? 0,
      monthlySavings: r.monthlySavingsVsCurrent ?? 0,
      breakEvenMonths: r.breakEvenMonths ?? 0,
      breakEvenYears: r.breakEvenYears ?? 0,
    }))

  const cumulativeSavingsData: CumulativeSavingsPoint[] = []
  for (let month = 0; month <= 84; month++) {
    const point: CumulativeSavingsPoint = { month }
    scenarios.forEach((s, i) => {
      const label = rows[i].label
      const savings = (rows[i].monthlySavingsVsCurrent ?? 0) * month - s.closingCosts
      point[label] = Math.round(savings)
    })
    cumulativeSavingsData.push(point)
  }

  return { mode: 'refinance', rows, keyMetrics, breakEvenRows, cumulativeSavingsData, recommendedIdx }
}

// ─── Internal ──────────────────────────────────────────────────────

function emptyDisplayData(mode: 'purchase' | 'refinance'): DisplayData {
  return {
    mode,
    rows: [],
    keyMetrics: { monthlySavings: 0, savings5yr: 0, savings15yr: 0, totalInterestBest: 0 },
    breakEvenRows: [],
    cumulativeSavingsData: [],
    recommendedIdx: 0,
  }
}
