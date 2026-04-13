// ─── Scenario Builder Types ─────────────────────────────────────────

export type ScenarioMode = 'purchase' | 'refinance'

// ─── Closing Cost Breakdown ────────────────────────────────────────

export interface ClosingCostBreakdown {
  // Lender Fees
  originationFee: number
  underwritingFee: number
  processingFee: number
  applicationFee: number
  adminFee: number
  // Third Party Fees
  appraisal: number
  creditReport: number
  docPrepFee: number
  floodCert: number
  attorneyFee: number
  settlementFee: number
  titleSearch: number
  titleEndorsements: number
  recordingFee: number
  lendersTitlePolicy: number
  // Prepaids
  prepaidInterestDays: number
  annualHazardInsurance: number
  taxEscrowMonths: number
  insuranceEscrowMonths: number
}

export type LoanType = 'conventional' | 'fha' | 'va' | 'usda' | 'non-qm'

export type BuydownType = 'none' | '2-1' | '3-2-1' | '1-0'

export type LoanTerm = 30 | 25 | 20 | 15 | 10

// ─── Purchase Scenario Input ────────────────────────────────────────

export interface PurchaseScenarioInput {
  id: string
  label: string
  loanType: LoanType
  purchasePrice: number
  downPaymentAmount: number
  downPaymentPercent: number
  loanAmount: number
  interestRate: number
  loanTerm: LoanTerm
  pointsPercent: number // percentage of loan amount (e.g., 1.0 = 1 point)
  creditsPercent: number // lender credits as percentage of loan amount
  points: number // computed dollar amount (kept for calc compatibility)
  // Monthly costs
  propertyTaxes: number
  homeownersInsurance: number
  hoa: number
  pmi: number
  // Closing costs
  closingCostBreakdown: ClosingCostBreakdown
  totalClosingCosts: number // auto-computed from breakdown
  sellerCredits: number
  // Buydown
  buydownType: BuydownType
  buydownYearRates: number[] // override rates per year
  // Extra payment
  extraMonthlyPayment: number
}

// ─── Refinance Current Loan ─────────────────────────────────────────

export interface CurrentLoanInput {
  originalLoanAmount: number
  loanStartDate: string // YYYY-MM format
  originalLoanTerm: LoanTerm
  interestRate: number
  currentMonthlyPI: number // auto-calc, editable override
  currentPayoffBalance: number // auto-calc, editable override
  propertyTaxes: number
  insurance: number
  hoa: number
  pmi: number
  debts: DebtItem[]
}

export interface DebtItem {
  id: string
  description: string
  monthlyPayment: number
  balance: number
}

// ─── Refinance New Loan Scenario ────────────────────────────────────

export interface RefiScenarioInput {
  id: string
  label: string
  loanType: LoanType
  newLoanAmount: number
  interestRate: number
  loanTerm: LoanTerm
  pointsPercent: number
  creditsPercent: number
  points: number // computed dollar amount
  closingCostBreakdown: ClosingCostBreakdown
  closingCosts: number // auto-computed from breakdown
  cashOutAmount: number
  payOffDebts: boolean // toggle to include listed debts in cash-out
  propertyTaxes: number
  insurance: number
  hoa: number
  pmi: number
  extraMonthlyPayment: number
}

// ─── Calculated Results ─────────────────────────────────────────────

export interface AmortizationEntry {
  month: number
  payment: number
  principal: number
  interest: number
  balance: number
  cumulativePrincipal: number
  cumulativeInterest: number
}

export interface PurchaseCalculatedResult {
  scenarioId: string
  monthlyPI: number
  totalMonthlyPayment: number
  ltv: number
  apr: number
  cashToClose: number
  totalInterest: number
  totalCostLifetime: number
  totalCost5Year: number
  totalCost10Year: number
  equityYear1: number
  equityYear5: number
  equityYear10: number
  amortizationSchedule: AmortizationEntry[]
  // Buydown
  buydownPayments?: { year: number; rate: number; monthlyPI: number }[]
  buydownCost?: number
  // Extra payment
  adjustedPayoffMonths?: number
  yearsSaved?: number
  monthsSaved?: number
  interestSaved?: number
  // PMI removal
  pmiRemovalMonth?: number
}

export interface RefiCalculatedResult {
  scenarioId: string
  currentMonthlyPayment: number
  newMonthlyPI: number
  newTotalMonthlyPayment: number
  monthlySavings: number
  annualSavings: number
  netMonthlyCashFlowImprovement: number // includes eliminated debt payments
  breakEvenMonth: number
  totalSavings3Year: number
  totalSavings5Year: number
  totalSavings10Year: number
  remainingInterestCurrent: number
  totalInterestNew: number
  lifetimeInterestSavings: number
  cashOutReceived: number
  debtsEliminated: { description: string; monthlyPayment: number }[]
  newLtv: number
  equityYear1: number
  equityYear5: number
  equityYear10: number
  amortizationSchedule: AmortizationEntry[]
  currentLoanSchedule: AmortizationEntry[]
  apr: number
  adjustedPayoffMonths?: number
  yearsSaved?: number
  monthsSaved?: number
  interestSaved?: number
}

export interface ReinvestmentResult {
  monthlySavings: number
  returnRate: number
  horizonYears: number
  futureValue: number
  totalContributed: number
  totalGrowth: number
  yearlySnapshots: { year: number; value: number }[]
}

// ─── Full Scenario State ────────────────────────────────────────────

export interface ScenarioState {
  mode: ScenarioMode
  borrowerName: string
  propertyAddress: string
  propertyValue: number
  // Purchase mode
  purchaseScenarios: PurchaseScenarioInput[]
  purchaseResults: PurchaseCalculatedResult[]
  // Refinance mode
  currentLoan: CurrentLoanInput
  refiScenarios: RefiScenarioInput[]
  refiResults: RefiCalculatedResult[]
  // Shared
  narrative: string
  narrativeEdited: boolean
  reinvestment: {
    returnRate: number
    horizonYears: number
  }
  reinvestmentResult: ReinvestmentResult | null
  // Pre-fill source tracking
  fromLoanRecord?: boolean
}

// ─── Database Record ────────────────────────────────────────────────

export interface ScenarioRecord {
  id: string
  user_id: string
  scenario_type: ScenarioMode
  borrower_name: string | null
  property_address: string | null
  property_value: number | null
  current_loan_data: CurrentLoanInput | null
  scenarios_data: (PurchaseScenarioInput | RefiScenarioInput)[]
  narrative: string | null
  narrative_edited: boolean
  reinvestment_data: { returnRate: number; horizonYears: number; result: ReinvestmentResult } | null
  pdf_url: string | null
  share_token: string
  share_expires_at: string
  view_count: number
  source: 'manual' | 'mismo_import' | 'arive_sync'
  mismo_file_url: string | null
  created_at: string
  updated_at: string
}
