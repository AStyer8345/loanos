import { createClient } from '@/lib/supabase/server'
import ScenarioBuilder from './ScenarioBuilder'
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

// Format a date string to YYYY-MM for loanStartDate
function toYYYYMM(dateStr: string | null): string {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  if (isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
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
              points: loan.points || 0,
              propertyTaxes: 0, // not individually stored in loans
              homeownersInsurance: 0,
              hoa: 0,
              pmi: loan.mi_monthly || 0,
              totalClosingCosts: loan.total_closing_costs || 0,
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
              points: 0,
              propertyTaxes: 0,
              homeownersInsurance: 0,
              hoa: 0,
              pmi: loan.mi_monthly || 0,
              totalClosingCosts: loan.total_closing_costs || 0,
              sellerCredits: loan.seller_credits || 0,
              buydownType: 'none',
              buydownYearRates: [],
              extraMonthlyPayment: 0,
            },
          ],
        }
      } else {
        // Refinance mode — pre-fill current loan from loan data
        const currentLoan: CurrentLoanInput = {
          originalLoanAmount: loan.loan_amount || 0,
          loanStartDate: toYYYYMM(loan.loan_created_date || loan.application_date),
          originalLoanTerm: loanTerm,
          interestRate: loan.interest_rate || 0,
          currentMonthlyPI: loan.monthly_payment || 0,
          currentPayoffBalance: 0, // auto-calculates from above
          propertyTaxes: 0,
          insurance: 0,
          hoa: 0,
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
              newLoanAmount: 0,
              interestRate: 0,
              loanTerm: 30,
              points: 0,
              closingCosts: 0,
              cashOutAmount: 0,
              payOffDebts: false,
              propertyTaxes: 0,
              insurance: 0,
              hoa: 0,
              pmi: 0,
              extraMonthlyPayment: 0,
            },
          ],
        }
      }
    }
  }

  return <ScenarioBuilder initialState={initialState} />
}
