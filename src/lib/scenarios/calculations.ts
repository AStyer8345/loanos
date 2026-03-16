import type {
  PurchaseScenarioInput,
  PurchaseCalculatedResult,
  RefiScenarioInput,
  RefiCalculatedResult,
  CurrentLoanInput,
  AmortizationEntry,
  ReinvestmentResult,
  BuydownType,
} from './types'

// ─── Core Amortization ─────────────────────────────────────────────

/** Monthly P&I payment: M = P[r(1+r)^n]/[(1+r)^n-1] */
export function monthlyPayment(principal: number, annualRate: number, termYears: number): number {
  if (principal <= 0 || termYears <= 0) return 0
  if (annualRate <= 0) return principal / (termYears * 12)
  const r = annualRate / 100 / 12
  const n = termYears * 12
  return principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
}

/** Full amortization schedule with optional extra payment */
export function amortizationSchedule(
  principal: number,
  annualRate: number,
  termYears: number,
  extraMonthly: number = 0
): AmortizationEntry[] {
  if (principal <= 0 || termYears <= 0) return []
  const r = annualRate / 100 / 12
  const basePayment = monthlyPayment(principal, annualRate, termYears)
  const schedule: AmortizationEntry[] = []
  let balance = principal
  let cumPrincipal = 0
  let cumInterest = 0

  const maxMonths = termYears * 12
  for (let m = 1; m <= maxMonths && balance > 0.01; m++) {
    const interestPortion = balance * r
    let principalPortion = basePayment - interestPortion + extraMonthly
    if (principalPortion > balance) principalPortion = balance
    const payment = interestPortion + principalPortion
    balance -= principalPortion
    if (balance < 0) balance = 0
    cumPrincipal += principalPortion
    cumInterest += interestPortion

    schedule.push({
      month: m,
      payment: round2(payment),
      principal: round2(principalPortion),
      interest: round2(interestPortion),
      balance: round2(balance),
      cumulativePrincipal: round2(cumPrincipal),
      cumulativeInterest: round2(cumInterest),
    })

    if (balance <= 0) break
  }
  return schedule
}

// ─── Remaining Balance ──────────────────────────────────────────────

/** Calculate remaining balance after N months of payments */
export function remainingBalance(
  principal: number,
  annualRate: number,
  termYears: number,
  monthsPaid: number
): number {
  if (principal <= 0 || annualRate <= 0 || termYears <= 0) {
    return Math.max(0, principal - (principal / (termYears * 12)) * monthsPaid)
  }
  const r = annualRate / 100 / 12
  const n = termYears * 12
  if (monthsPaid >= n) return 0
  const factor = Math.pow(1 + r, monthsPaid)
  return principal * factor - monthlyPayment(principal, annualRate, termYears) * ((factor - 1) / r)
}

/** Months elapsed from YYYY-MM start date to today */
export function monthsElapsed(startDate: string): number {
  if (!startDate) return 0
  const [year, month] = startDate.split('-').map(Number)
  const now = new Date()
  return (now.getFullYear() - year) * 12 + (now.getMonth() + 1 - month)
}

// ─── APR Estimate ───────────────────────────────────────────────────

/** Simplified APR: solve for rate that makes PV of payments = loan amount - upfront costs */
export function estimateAPR(
  loanAmount: number,
  annualRate: number,
  termYears: number,
  upfrontCosts: number
): number {
  if (loanAmount <= 0 || termYears <= 0) return 0
  const netProceeds = loanAmount - upfrontCosts
  if (netProceeds <= 0) return annualRate
  const payment = monthlyPayment(loanAmount, annualRate, termYears)
  const n = termYears * 12
  // Newton-Raphson to find monthly rate where PV of payments = netProceeds
  let guess = annualRate / 100 / 12
  for (let i = 0; i < 100; i++) {
    const factor = Math.pow(1 + guess, n)
    const pv = payment * (factor - 1) / (guess * factor)
    const dpv = payment * (
      ((n * Math.pow(1 + guess, n - 1) * guess * factor - (factor - 1) * (factor + guess * n * Math.pow(1 + guess, n - 1))) /
      (guess * factor) ** 2)
    )
    const diff = pv - netProceeds
    if (Math.abs(diff) < 0.01) break
    guess = guess - diff / dpv
    if (guess <= 0) { guess = annualRate / 100 / 12; break }
  }
  return round3(guess * 12 * 100)
}

// ─── Buydown ────────────────────────────────────────────────────────

export function getBuydownRates(baseRate: number, buydownType: BuydownType): number[] {
  switch (buydownType) {
    case '3-2-1': return [baseRate - 3, baseRate - 2, baseRate - 1]
    case '2-1': return [baseRate - 2, baseRate - 1]
    case '1-0': return [baseRate - 1]
    default: return []
  }
}

export function calculateBuydownCost(
  loanAmount: number,
  baseRate: number,
  buydownType: BuydownType,
  termYears: number
): number {
  const rates = getBuydownRates(baseRate, buydownType)
  let totalCost = 0
  const basePmt = monthlyPayment(loanAmount, baseRate, termYears)
  for (const rate of rates) {
    const reducedPmt = monthlyPayment(loanAmount, Math.max(rate, 0), termYears)
    totalCost += (basePmt - reducedPmt) * 12
  }
  return round2(totalCost)
}

// ─── PMI Removal ────────────────────────────────────────────────────

/** Month when LTV drops to 78% for conventional loans */
export function pmiRemovalMonth(
  loanAmount: number,
  propertyValue: number,
  annualRate: number,
  termYears: number,
  loanType: string
): number | undefined {
  if (loanType !== 'conventional' || propertyValue <= 0) return undefined
  const threshold = propertyValue * 0.78
  const schedule = amortizationSchedule(loanAmount, annualRate, termYears)
  for (const entry of schedule) {
    if (entry.balance <= threshold) return entry.month
  }
  return undefined
}

// ─── Purchase Calculations ──────────────────────────────────────────

export function calculatePurchaseScenario(
  scenario: PurchaseScenarioInput,
  propertyValue: number
): PurchaseCalculatedResult {
  const { loanAmount, interestRate, loanTerm, points, totalClosingCosts, sellerCredits, extraMonthlyPayment } = scenario
  const pv = propertyValue || scenario.purchasePrice

  const pi = monthlyPayment(loanAmount, interestRate, loanTerm)
  const totalMonthly = pi + scenario.propertyTaxes + scenario.homeownersInsurance + scenario.hoa + scenario.pmi
  const ltv = pv > 0 ? (loanAmount / pv) * 100 : 0

  // Credits from creditsPercent (new) or negative points (legacy)
  const lenderCredits = scenario.creditsPercent > 0
    ? Math.round(loanAmount * (scenario.creditsPercent / 100))
    : (points < 0 ? Math.abs(points) : 0)
  const pointsCost = points > 0 ? points : 0
  const upfrontCosts = pointsCost + totalClosingCosts - sellerCredits - lenderCredits
  const apr = estimateAPR(loanAmount, interestRate, loanTerm, Math.max(upfrontCosts, 0))

  const cashToClose = scenario.downPaymentAmount + totalClosingCosts + pointsCost - sellerCredits - lenderCredits

  // Amortization
  const schedule = amortizationSchedule(loanAmount, interestRate, loanTerm, extraMonthlyPayment)
  const totalInterest = schedule.length > 0 ? schedule[schedule.length - 1].cumulativeInterest : 0

  // Total costs at various horizons
  const monthlyNonPI = scenario.propertyTaxes + scenario.homeownersInsurance + scenario.hoa + scenario.pmi
  const totalCostLifetime = schedule.reduce((s, e) => s + e.payment, 0) + monthlyNonPI * schedule.length + cashToClose
  const months5 = Math.min(60, schedule.length)
  const months10 = Math.min(120, schedule.length)
  const cost5 = schedule.slice(0, months5).reduce((s, e) => s + e.payment, 0) + monthlyNonPI * months5 + cashToClose
  const cost10 = schedule.slice(0, months10).reduce((s, e) => s + e.payment, 0) + monthlyNonPI * months10 + cashToClose

  // Equity (principal paid + down payment, no appreciation)
  const downPmt = scenario.downPaymentAmount
  const eq1 = downPmt + (schedule[11]?.cumulativePrincipal ?? 0)
  const eq5 = downPmt + (schedule[59]?.cumulativePrincipal ?? schedule[schedule.length - 1]?.cumulativePrincipal ?? 0)
  const eq10 = downPmt + (schedule[119]?.cumulativePrincipal ?? schedule[schedule.length - 1]?.cumulativePrincipal ?? 0)

  // Buydown
  let buydownPayments: PurchaseCalculatedResult['buydownPayments']
  let buydownCost: number | undefined
  if (scenario.buydownType !== 'none') {
    const overrideRates = scenario.buydownYearRates.length > 0
      ? scenario.buydownYearRates
      : getBuydownRates(interestRate, scenario.buydownType)
    buydownPayments = overrideRates.map((rate, i) => ({
      year: i + 1,
      rate: Math.max(rate, 0),
      monthlyPI: monthlyPayment(loanAmount, Math.max(rate, 0), loanTerm),
    }))
    buydownCost = calculateBuydownCost(loanAmount, interestRate, scenario.buydownType, loanTerm)
  }

  // Extra payment impact
  let adjustedPayoffMonths: number | undefined
  let yearsSaved: number | undefined
  let monthsSaved: number | undefined
  let interestSaved: number | undefined
  if (extraMonthlyPayment > 0) {
    const baseSchedule = amortizationSchedule(loanAmount, interestRate, loanTerm)
    adjustedPayoffMonths = schedule.length
    const totalMonthsSaved = baseSchedule.length - schedule.length
    yearsSaved = Math.floor(totalMonthsSaved / 12)
    monthsSaved = totalMonthsSaved % 12
    interestSaved = (baseSchedule[baseSchedule.length - 1]?.cumulativeInterest ?? 0) - totalInterest
  }

  return {
    scenarioId: scenario.id,
    monthlyPI: round2(pi),
    totalMonthlyPayment: round2(totalMonthly),
    ltv: round1(ltv),
    apr: round3(apr),
    cashToClose: round2(Math.max(cashToClose, 0)),
    totalInterest: round2(totalInterest),
    totalCostLifetime: round2(totalCostLifetime),
    totalCost5Year: round2(cost5),
    totalCost10Year: round2(cost10),
    equityYear1: round2(eq1),
    equityYear5: round2(eq5),
    equityYear10: round2(eq10),
    amortizationSchedule: schedule,
    buydownPayments,
    buydownCost,
    pmiRemovalMonth: pmiRemovalMonth(loanAmount, pv, interestRate, loanTerm, scenario.loanType),
    adjustedPayoffMonths,
    yearsSaved,
    monthsSaved,
    interestSaved: interestSaved ? round2(interestSaved) : undefined,
  }
}

// ─── Refinance Calculations ─────────────────────────────────────────

export function calculateCurrentLoan(current: CurrentLoanInput): {
  monthlyPI: number
  payoffBalance: number
  remainingMonths: number
  totalMonthlyPayment: number
  remainingSchedule: AmortizationEntry[]
} {
  const elapsed = monthsElapsed(current.loanStartDate)
  const calcPI = monthlyPayment(current.originalLoanAmount, current.interestRate, current.originalLoanTerm)
  const calcBalance = remainingBalance(current.originalLoanAmount, current.interestRate, current.originalLoanTerm, elapsed)
  const totalMonths = current.originalLoanTerm * 12
  const remaining = Math.max(totalMonths - elapsed, 0)

  const pi = current.currentMonthlyPI > 0 ? current.currentMonthlyPI : calcPI
  const balance = current.currentPayoffBalance > 0 ? current.currentPayoffBalance : calcBalance
  const totalPmt = pi + current.propertyTaxes + current.insurance + current.hoa + current.pmi

  // Remaining amortization from current position
  const remainingSchedule = amortizationSchedule(balance, current.interestRate, remaining / 12)

  return {
    monthlyPI: round2(pi),
    payoffBalance: round2(balance),
    remainingMonths: remaining,
    totalMonthlyPayment: round2(totalPmt),
    remainingSchedule,
  }
}

export function calculateRefiScenario(
  scenario: RefiScenarioInput,
  currentLoan: CurrentLoanInput,
  currentCalc: ReturnType<typeof calculateCurrentLoan>,
  propertyValue: number
): RefiCalculatedResult {
  const { interestRate, loanTerm, points, closingCosts, cashOutAmount, extraMonthlyPayment } = scenario

  // Determine actual loan amount
  let actualLoanAmount = scenario.newLoanAmount
  if (scenario.payOffDebts && currentLoan.debts.length > 0) {
    const totalDebtBalance = currentLoan.debts.reduce((s, d) => s + d.balance, 0)
    actualLoanAmount = currentCalc.payoffBalance + totalDebtBalance + closingCosts
  } else if (cashOutAmount > 0) {
    actualLoanAmount = currentCalc.payoffBalance + cashOutAmount
  }

  const newPI = monthlyPayment(actualLoanAmount, interestRate, loanTerm)
  const newTotalMonthly = newPI + scenario.propertyTaxes + scenario.insurance + scenario.hoa + scenario.pmi

  // Savings
  const monthlySavings = currentCalc.totalMonthlyPayment - newTotalMonthly
  const debtPayments = scenario.payOffDebts
    ? currentLoan.debts.reduce((s, d) => s + d.monthlyPayment, 0)
    : 0
  const netCashFlowImprovement = monthlySavings + debtPayments

  // Break-even: month when cumulative savings exceed closing costs
  let breakEven = 0
  if (monthlySavings > 0 && closingCosts > 0) {
    breakEven = Math.ceil(closingCosts / monthlySavings)
  }

  // Amortization schedules
  const newSchedule = amortizationSchedule(actualLoanAmount, interestRate, loanTerm, extraMonthlyPayment)
  const totalInterestNew = newSchedule.length > 0 ? newSchedule[newSchedule.length - 1].cumulativeInterest : 0
  const remainingInterestCurrent = currentCalc.remainingSchedule.length > 0
    ? currentCalc.remainingSchedule[currentCalc.remainingSchedule.length - 1].cumulativeInterest
    : 0

  // Savings over time
  const savings3 = monthlySavings * 36
  const savings5 = monthlySavings * 60
  const savings10 = monthlySavings * 120

  // LTV
  const pv = propertyValue || 0
  const newLtv = pv > 0 ? (actualLoanAmount / pv) * 100 : 0

  // Equity
  const currentEquity = pv - actualLoanAmount
  const eq1 = currentEquity + (newSchedule[11]?.cumulativePrincipal ?? 0)
  const eq5 = currentEquity + (newSchedule[59]?.cumulativePrincipal ?? newSchedule[newSchedule.length - 1]?.cumulativePrincipal ?? 0)
  const eq10 = currentEquity + (newSchedule[119]?.cumulativePrincipal ?? newSchedule[newSchedule.length - 1]?.cumulativePrincipal ?? 0)

  // APR — include lender credits offset
  const refiLenderCredits = scenario.creditsPercent > 0
    ? Math.round(actualLoanAmount * (scenario.creditsPercent / 100))
    : 0
  const upfront = (points > 0 ? points : 0) + closingCosts - refiLenderCredits
  const apr = estimateAPR(actualLoanAmount, interestRate, loanTerm, Math.max(upfront, 0))

  // Extra payment impact
  let adjustedPayoffMonths: number | undefined
  let yearsSaved: number | undefined
  let monthsSaved: number | undefined
  let interestSaved: number | undefined
  if (extraMonthlyPayment > 0) {
    const baseSchedule = amortizationSchedule(actualLoanAmount, interestRate, loanTerm)
    adjustedPayoffMonths = newSchedule.length
    const totalMonthsSaved = baseSchedule.length - newSchedule.length
    yearsSaved = Math.floor(totalMonthsSaved / 12)
    monthsSaved = totalMonthsSaved % 12
    interestSaved = (baseSchedule[baseSchedule.length - 1]?.cumulativeInterest ?? 0) - totalInterestNew
  }

  return {
    scenarioId: scenario.id,
    currentMonthlyPayment: currentCalc.totalMonthlyPayment,
    newMonthlyPI: round2(newPI),
    newTotalMonthlyPayment: round2(newTotalMonthly),
    monthlySavings: round2(monthlySavings),
    annualSavings: round2(monthlySavings * 12),
    netMonthlyCashFlowImprovement: round2(netCashFlowImprovement),
    breakEvenMonth: breakEven,
    totalSavings3Year: round2(savings3),
    totalSavings5Year: round2(savings5),
    totalSavings10Year: round2(savings10),
    remainingInterestCurrent: round2(remainingInterestCurrent),
    totalInterestNew: round2(totalInterestNew),
    lifetimeInterestSavings: round2(remainingInterestCurrent - totalInterestNew),
    cashOutReceived: round2(cashOutAmount),
    debtsEliminated: scenario.payOffDebts
      ? currentLoan.debts.map(d => ({ description: d.description, monthlyPayment: d.monthlyPayment }))
      : [],
    newLtv: round1(newLtv),
    equityYear1: round2(eq1),
    equityYear5: round2(eq5),
    equityYear10: round2(eq10),
    amortizationSchedule: newSchedule,
    currentLoanSchedule: currentCalc.remainingSchedule,
    apr: round3(apr),
    adjustedPayoffMonths,
    yearsSaved,
    monthsSaved,
    interestSaved: interestSaved ? round2(interestSaved) : undefined,
  }
}

// ─── Reinvestment Analysis (FV of Annuity) ──────────────────────────

export function calculateReinvestment(
  monthlySavings: number,
  annualReturnRate: number,
  horizonYears: number
): ReinvestmentResult {
  if (monthlySavings <= 0 || horizonYears <= 0) {
    return { monthlySavings, returnRate: annualReturnRate, horizonYears, futureValue: 0, totalContributed: 0, totalGrowth: 0, yearlySnapshots: [] }
  }
  const r = annualReturnRate / 100 / 12
  const snapshots: { year: number; value: number }[] = []
  let balance = 0
  for (let m = 1; m <= horizonYears * 12; m++) {
    balance = balance * (1 + r) + monthlySavings
    if (m % 12 === 0) {
      snapshots.push({ year: m / 12, value: round2(balance) })
    }
  }
  const totalContributed = monthlySavings * horizonYears * 12
  return {
    monthlySavings,
    returnRate: annualReturnRate,
    horizonYears,
    futureValue: round2(balance),
    totalContributed: round2(totalContributed),
    totalGrowth: round2(balance - totalContributed),
    yearlySnapshots: snapshots,
  }
}

// ─── Helpers ────────────────────────────────────────────────────────

function round1(n: number): number { return Math.round(n * 10) / 10 }
function round2(n: number): number { return Math.round(n * 100) / 100 }
function round3(n: number): number { return Math.round(n * 1000) / 1000 }
