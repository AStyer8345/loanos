import { createClient } from '@/lib/supabase/server'
import ScenarioBuilder from './ScenarioBuilder'
import { DEFAULT_CLOSING_COSTS, sumClosingCosts } from '@/lib/scenarios/utils'
import type { ScenarioState, LoanTerm, LoanType, CurrentLoanInput } from '@/lib/scenarios/types'

export const dynamic = 'force-dynamic'

// Map Arive loan_type strings to our LoanType enum
function mapLoanType(lt: string | null): LoanType {
  if (!lt) return 'conventional'
  const lower = lt.toLowerCase()
  if (lower.includes('fha')) return 'fha'
  if (lower.includes('va')) return 'va'
  if (lower.includes('usda')) return 'usda'
  if (lower.includes('non-qm') || lower.includes('nonqm')) return 'non-qm'
  return 'conventional'
}

// Convert months to LoanTerm years (nearest standard term)
function mapLoanTerm(months: number | null): LoanTerm {
  if (!months) return 30
  const years = months / 12
  if (years <= 10) return 10
  if (years <= 15) return 15
  if (years <= 20) return 20
  if (years <= 25) return 25
  return 30
}


export default async function NewScenarioPage({
  searchParams,
}: {
  searchParams: { loan_id?: string }
}) {
  let initialState: Partial<ScenarioState> | undefined

  if (searchParams.loan_id) {
    const supabase = createClient()
    const { data: loan } = await supabase
      .from('loans')
      .select('*')
      .eq('id', searchParams.loan_id)
      .single()

    if (loan) {
      const borrowerName = [loan.borrower_first_name, loan.borrower_last_name].filter(Boolean).join(' ')
        || loan.borrower_name || ''
      const propertyAddr = [loan.property_address, loan.property_city, loan.property_state, loan.property_zip]
        .filter(Boolean).join(', ')
      const propertyValue = loan.appraised_value || loan.purchase_price || 0
      const loanType = mapLoanType(loan.loan_type)
      const loanTerm = mapLoanTerm(loan.loan_term)
      const isPurchase = (loan.loan_purpose || '').toLowerCase().includes('purchase')

      if (isPurchase) {
        // Purchase mode — pre-fill Option A from loan data
        initialState = {
          mode: 'purchase',
          fromLoanRecord: true,
          borrowerName,
          propertyAddress: propertyAddr,
          propertyValue,
          purchaseScenarios: [
            {
              id: crypto.randomUUID(),
              label: 'Option A',
              loanType,
              purchasePrice: loan.purchase_price || 0,
              downPaymentAmount: loan.down_payment || 0,
              downPaymentPercent: loan.down_payment_pct || 20,
              loanAmount: loan.loan_amount || 0,
              interestRate: loan.interest_rate || 0,
              loanTerm,
              pointsPercent: 0,
              creditsPercent: 0,
              points: loan.points || 0,
              propertyTaxes: 0,
              homeownersInsurance: 0,
              hoa: 0,
              pmi: loan.mi_monthly || 0,
              closingCostBreakdown: { ...DEFAULT_CLOSING_COSTS },
              totalClosingCosts: loan.total_closing_costs || sumClosingCosts(DEFAULT_CLOSING_COSTS),
              sellerCredits: loan.seller_credits || 0,
              buydownType: 'none',
              buydownYearRates: [],
              extraMonthlyPayment: 0,
            },
            {
              id: crypto.randomUUID(),
              label: 'Option B',
              loanType,
              purchasePrice: loan.purchase_price || 0,
              downPaymentAmount: loan.down_payment || 0,
              downPaymentPercent: loan.down_payment_pct || 20,
              loanAmount: loan.loan_amount || 0,
              interestRate: 0,
              loanTerm,
              pointsPercent: 0,
              creditsPercent: 0,
              points: 0,
              propertyTaxes: 0,
              homeownersInsurance: 0,
              hoa: 0,
              pmi: loan.mi_monthly || 0,
              closingCostBreakdown: { ...DEFAULT_CLOSING_COSTS },
              totalClosingCosts: loan.total_closing_costs || sumClosingCosts(DEFAULT_CLOSING_COSTS),
              sellerCredits: loan.seller_credits || 0,
              buydownType: 'none',
              buydownYearRates: [],
              extraMonthlyPayment: 0,
            },
          ],
        }
      } else {
        // Refinance mode
        // loan.loan_amount = the new loan being originated (= payoff balance of existing mortgage)
        // loan.interest_rate = the PROPOSED new rate — NOT the existing mortgage rate
        // loan.monthly_payment = the proposed new payment — NOT the existing payment
        // LO must enter: existing rate, original loan amount, loan start date (from borrower's statement)
        const payoffBalance = loan.loan_amount || 0
        const currentLoan: CurrentLoanInput = {
          originalLoanAmount: 0,      // LO must enter — existing mortgage original amount
          loanStartDate: '',          // LO must enter — existing mortgage start date
          originalLoanTerm: 30 as LoanTerm,
          interestRate: 0,            // LO must enter — existing mortgage rate
          currentMonthlyPI: 0,        // LO must enter — or auto-calculates from above fields
          currentPayoffBalance: payoffBalance,    // loan_amount IS the refi payoff balance
          propertyTaxes: loan.property_taxes_monthly || 0,
          insurance: loan.hoi_monthly || 0,
          hoa: loan.hoa_dues || 0,
          pmi: loan.mi_monthly || 0,
          debts: [],
        }

        initialState = {
          mode: 'refinance',
          borrowerName,
          propertyAddress: propertyAddr,
          propertyValue,
          currentLoan,
          refiScenarios: [
            {
              id: crypto.randomUUID(),
              label: 'New Loan Option',
              loanType,
              newLoanAmount: payoffBalance,        // pre-fill: new loan = payoff amount
              interestRate: loan.interest_rate || 0,  // pre-fill: proposed new rate from Arive
              loanTerm,
              pointsPercent: 0,
              creditsPercent: 0,
              points: loan.points || 0,
              closingCostBreakdown: { ...DEFAULT_CLOSING_COSTS },
              closingCosts: loan.total_closing_costs || sumClosingCosts(DEFAULT_CLOSING_COSTS),
              cashOutAmount: 0,
              payOffDebts: false,
              propertyTaxes: loan.property_taxes_monthly || 0,
              insurance: loan.hoi_monthly || 0,
              hoa: loan.hoa_dues || 0,
              pmi: loan.mi_monthly || 0,
              extraMonthlyPayment: 0,
            },
          ],
          fromLoanRecord: true,
        }
      }
    }
  }

  return <ScenarioBuilder initialState={initialState} />
}
