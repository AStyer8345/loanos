export interface ScenarioData {
  id: string
  label: string
  loanAmount: number
  purchasePrice: number
  downPayment: number
  downPaymentMode: 'dollar' | 'percent'
  interestRate: number
  loanTerm: number
  loanType: string
  pointsCredits: number
  propertyTaxes: number
  homeInsurance: number
  hoaDues: number
  pmi: number
  closingCosts: number
}

export interface CalculatedResults {
  monthlyPI: number
  totalMonthly: number
  ltv: number
  totalInterest: number
  totalCost: number
  cashToClose: number
  fiveYearCost: number
  tenYearCost: number
  monthlySavingsVsA: number
  breakEvenMonth: number | null
}

export const defaultScenario = (id: string, label: string): ScenarioData => ({
  id,
  label,
  loanAmount: 400000,
  purchasePrice: 500000,
  downPayment: 100000,
  downPaymentMode: 'dollar',
  interestRate: 6.5,
  loanTerm: 30,
  loanType: 'conventional',
  pointsCredits: 0,
  propertyTaxes: 500,
  homeInsurance: 150,
  hoaDues: 0,
  pmi: 0,
  closingCosts: 8000,
})

export function calculateResults(scenario: ScenarioData, scenarioA?: ScenarioData): CalculatedResults {
  const monthlyRate = scenario.interestRate / 100 / 12
  const numPayments = scenario.loanTerm * 12
  
  // Monthly P&I calculation (standard amortization formula)
  const monthlyPI = monthlyRate > 0
    ? (scenario.loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
      (Math.pow(1 + monthlyRate, numPayments) - 1)
    : scenario.loanAmount / numPayments
  
  const totalMonthly = monthlyPI + scenario.propertyTaxes + scenario.homeInsurance + scenario.hoaDues + scenario.pmi
  const ltv = (scenario.loanAmount / scenario.purchasePrice) * 100
  const totalInterest = (monthlyPI * numPayments) - scenario.loanAmount
  const totalCost = monthlyPI * numPayments + scenario.propertyTaxes * numPayments + 
                    scenario.homeInsurance * numPayments + scenario.hoaDues * numPayments + 
                    scenario.pmi * numPayments + scenario.closingCosts
  
  const downPaymentAmount = scenario.downPaymentMode === 'dollar' 
    ? scenario.downPayment 
    : (scenario.downPayment / 100) * scenario.purchasePrice
  const cashToClose = downPaymentAmount + scenario.closingCosts
  
  const fiveYearCost = totalMonthly * 60 + scenario.closingCosts
  const tenYearCost = totalMonthly * 120 + scenario.closingCosts
  
  // Calculate savings vs Scenario A
  let monthlySavingsVsA = 0
  let breakEvenMonth: number | null = null
  
  if (scenarioA && scenarioA.id !== scenario.id) {
    const scenarioAResults = calculateResults(scenarioA)
    monthlySavingsVsA = scenarioAResults.totalMonthly - totalMonthly
    
    // Break-even calculation (when closing cost difference is recovered by monthly savings)
    const closingCostDiff = scenario.closingCosts - scenarioA.closingCosts
    if (monthlySavingsVsA > 0 && closingCostDiff > 0) {
      breakEvenMonth = Math.ceil(closingCostDiff / monthlySavingsVsA)
    } else if (monthlySavingsVsA < 0 && closingCostDiff < 0) {
      breakEvenMonth = Math.ceil(Math.abs(closingCostDiff) / Math.abs(monthlySavingsVsA))
    }
  }
  
  return {
    monthlyPI,
    totalMonthly,
    ltv,
    totalInterest,
    totalCost,
    cashToClose,
    fiveYearCost,
    tenYearCost,
    monthlySavingsVsA,
    breakEvenMonth,
  }
}
