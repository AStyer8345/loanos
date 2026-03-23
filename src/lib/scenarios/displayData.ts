/**
 * buildDisplayData — computes all values needed for the 7-section output.
 * Used by: output page (in-app), share/[token]/page.tsx, generate-pdf/route.ts
 * Never re-implement savings/break-even calculations outside this file.
 */

import type {
  PurchaseScenarioInput, PurchaseCalculatedResult,
  RefiScenarioInput, RefiCalculatedResult, CurrentLoanInput,
  ClosingCostBreakdown,
} from './types'

const APPRECIATION_RATE = 0.04 // 4% annual, used for 15yr home value projection

// ─── Horizon Analysis ──────────────────────────────────────────────

export interface HorizonAnalysis {
  // 60-month (5-year)
  totalPIPaid5yr: number        // sum of P&I payments months 1-60
  principalPaid5yr: number      // cumulative principal at month 60
  balanceAt5yr: number          // loan balance at month 60
  interestMIPaid5yr: number     // cumulative interest + pmi*60 at month 60
  totalCost5yr: number          // totalPI5yr + nonPI*60 + cashToClose
  netSavings5yr: number         // monthlySavings*60 - additionalCostToClose
  // 15-year
  totalPIPaid15yr: number
  principalPaid15yr: number
  balanceAt15yr: number
  interestMIPaid15yr: number
  totalPITI15yr: number         // totalMonthlyPayment × 180
  interestPaid15yr: number      // cumulative interest at month 180
  homeValue15yr: number         // purchasePrice × (1+0.04)^15 (purchase only)
  equity15yr: number            // homeValue15yr - balanceAt15yr
}

// ─── Display Row ───────────────────────────────────────────────────

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
  // Monthly payment breakdown
  propertyTaxes: number
  homeownersInsurance: number
  hoa: number
  pmi: number
  // Cash to close detail
  downPaymentAmount?: number
  sellerCredits?: number
  closingCostBreakdown?: ClosingCostBreakdown
  pointsPercent: number
  creditsPercent: number
  // Savings vs baseline
  monthlySavingsVsCurrent?: number
  savings5yr?: number
  savings15yr?: number
  breakEvenMonths?: number
  breakEvenYears?: number
  additionalCostToClose?: number
  isRecommended: boolean
  // Horizon analysis (5yr and 15yr)
  horizonAnalysis?: HorizonAnalysis
}

export interface KeyMetrics {
  monthlySavings: number
  savings5yr: number
  savings15yr: number
  interestAt15yrBest: number
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

    // Horizon analysis from amortization schedule
    const sched = r.amortizationSchedule
    const e60 = sched[Math.min(59, sched.length - 1)]
    const e180 = sched[Math.min(179, sched.length - 1)]
    const monthlyNonPI = s.propertyTaxes + s.homeownersInsurance + s.hoa + s.pmi
    const totalPIPaid5yr = sched.slice(0, 60).reduce((sum, e) => sum + e.payment, 0)
    const totalPIPaid15yr = sched.slice(0, 180).reduce((sum, e) => sum + e.payment, 0)
    const homeValue15yr = (s.purchasePrice || 0) * Math.pow(1 + APPRECIATION_RATE, 15)
    const balAt15yr = e180?.balance ?? 0

    const horizonAnalysis: HorizonAnalysis = {
      totalPIPaid5yr: round2(totalPIPaid5yr),
      principalPaid5yr: round2(e60?.cumulativePrincipal ?? 0),
      balanceAt5yr: round2(e60?.balance ?? 0),
      interestMIPaid5yr: round2((e60?.cumulativeInterest ?? 0) + s.pmi * 60),
      totalCost5yr: round2(totalPIPaid5yr + monthlyNonPI * 60 + r.cashToClose),
      netSavings5yr: round2(monthlySavings * 60 - Math.max(additionalCostToClose, 0)),
      totalPIPaid15yr: round2(totalPIPaid15yr),
      principalPaid15yr: round2(e180?.cumulativePrincipal ?? 0),
      balanceAt15yr: round2(balAt15yr),
      interestMIPaid15yr: round2((e180?.cumulativeInterest ?? 0) + s.pmi * 180),
      totalPITI15yr: round2(r.totalMonthlyPayment * 180),
      interestPaid15yr: round2(e180?.cumulativeInterest ?? 0),
      homeValue15yr: round2(homeValue15yr),
      equity15yr: round2(homeValue15yr - balAt15yr),
    }

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
      propertyTaxes: s.propertyTaxes,
      homeownersInsurance: s.homeownersInsurance,
      hoa: s.hoa,
      pmi: s.pmi,
      downPaymentAmount: s.downPaymentAmount,
      sellerCredits: s.sellerCredits,
      closingCostBreakdown: s.closingCostBreakdown,
      pointsPercent: s.pointsPercent ?? 0,
      creditsPercent: s.creditsPercent ?? 0,
      monthlySavingsVsCurrent: i !== baselineIdx ? monthlySavings : 0,
      savings5yr: monthlySavings * 60,
      savings15yr: monthlySavings * 180,
      breakEvenMonths: i !== baselineIdx && breakEvenMonths > 0 ? breakEvenMonths : undefined,
      breakEvenYears: i !== baselineIdx && breakEvenMonths > 0 ? Math.round(breakEvenMonths / 12 * 10) / 10 : undefined,
      additionalCostToClose: i !== baselineIdx ? additionalCostToClose : undefined,
      isRecommended: i === recommendedIdx,
      horizonAnalysis,
    }
  })

  const bestRow = rows[recommendedIdx]
  const bestHorizon = bestRow.horizonAnalysis
  const keyMetrics: KeyMetrics = {
    monthlySavings: bestRow.monthlySavingsVsCurrent ?? 0,
    savings5yr: (bestRow.monthlySavingsVsCurrent ?? 0) * 60,
    savings15yr: (bestRow.monthlySavingsVsCurrent ?? 0) * 180,
    interestAt15yrBest: bestHorizon?.interestPaid15yr ?? 0,
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
    const sched = r.amortizationSchedule
    const e60 = sched[Math.min(59, sched.length - 1)]
    const e180 = sched[Math.min(179, sched.length - 1)]
    const monthlyNonPI = s.propertyTaxes + s.insurance + s.hoa + s.pmi
    const totalPIPaid5yr = sched.slice(0, 60).reduce((sum, e) => sum + e.payment, 0)
    const totalPIPaid15yr = sched.slice(0, 180).reduce((sum, e) => sum + e.payment, 0)
    const balAt15yr = e180?.balance ?? 0

    const horizonAnalysis: HorizonAnalysis = {
      totalPIPaid5yr: round2(totalPIPaid5yr),
      principalPaid5yr: round2(e60?.cumulativePrincipal ?? 0),
      balanceAt5yr: round2(e60?.balance ?? 0),
      interestMIPaid5yr: round2((e60?.cumulativeInterest ?? 0) + s.pmi * 60),
      totalCost5yr: round2(totalPIPaid5yr + monthlyNonPI * 60 + s.closingCosts),
      netSavings5yr: round2(r.monthlySavings * 60 - s.closingCosts),
      totalPIPaid15yr: round2(totalPIPaid15yr),
      principalPaid15yr: round2(e180?.cumulativePrincipal ?? 0),
      balanceAt15yr: round2(balAt15yr),
      interestMIPaid15yr: round2((e180?.cumulativeInterest ?? 0) + s.pmi * 180),
      totalPITI15yr: round2(r.newTotalMonthlyPayment * 180),
      interestPaid15yr: round2(e180?.cumulativeInterest ?? 0),
      homeValue15yr: 0, // not applicable for refi
      equity15yr: 0,
    }

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
      propertyTaxes: s.propertyTaxes,
      homeownersInsurance: s.insurance,
      hoa: s.hoa,
      pmi: s.pmi,
      closingCostBreakdown: s.closingCostBreakdown,
      pointsPercent: s.pointsPercent ?? 0,
      creditsPercent: s.creditsPercent ?? 0,
      monthlySavingsVsCurrent: r.monthlySavings,
      savings5yr: r.totalSavings5Year,
      savings15yr: r.monthlySavings * 180,
      breakEvenMonths: r.breakEvenMonth > 0 ? r.breakEvenMonth : undefined,
      breakEvenYears: r.breakEvenMonth > 0 ? Math.round(r.breakEvenMonth / 12 * 10) / 10 : undefined,
      additionalCostToClose: s.closingCosts,
      isRecommended: i === recommendedIdx,
      horizonAnalysis,
    }
  })

  const bestRow = rows[recommendedIdx]
  const bestHorizon = bestRow.horizonAnalysis
  const keyMetrics: KeyMetrics = {
    monthlySavings: bestRow.monthlySavingsVsCurrent ?? 0,
    savings5yr: bestRow.savings5yr ?? 0,
    savings15yr: bestRow.savings15yr ?? 0,
    interestAt15yrBest: bestHorizon?.interestPaid15yr ?? 0,
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
    keyMetrics: { monthlySavings: 0, savings5yr: 0, savings15yr: 0, interestAt15yrBest: 0 },
    breakEvenRows: [],
    cumulativeSavingsData: [],
    recommendedIdx: 0,
  }
}

function round2(n: number): number { return Math.round(n * 100) / 100 }
