import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ScenarioBuilder from '../new/ScenarioBuilder'
import { ensureClosingCosts, sumClosingCosts, DEFAULT_CLOSING_COSTS } from '../new/ScenarioBuilder'
import type { ScenarioState, RefiScenarioInput, PurchaseScenarioInput } from '@/lib/scenarios/types'

export const dynamic = 'force-dynamic'

export default async function ViewScenarioPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: scenario, error } = await supabase
    .from('scenarios')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (error || !scenario) redirect('/dashboard/scenarios')

  // Reconstruct state from saved data
  const initialState: Partial<ScenarioState> = {
    mode: scenario.scenario_type,
    borrowerName: scenario.borrower_name || '',
    propertyAddress: scenario.property_address || '',
    propertyValue: scenario.property_value || 0,
    narrative: scenario.narrative || '',
    narrativeEdited: scenario.narrative_edited || false,
  }

  if (scenario.scenario_type === 'purchase') {
    // Ensure closingCostBreakdown exists on each loaded purchase scenario
    initialState.purchaseScenarios = (scenario.scenarios_data as PurchaseScenarioInput[]).map(s => ({
      ...s,
      closingCostBreakdown: ensureClosingCosts(s.closingCostBreakdown),
      totalClosingCosts: s.totalClosingCosts ?? sumClosingCosts(s.closingCostBreakdown ?? DEFAULT_CLOSING_COSTS),
      buydownYearRates: s.buydownYearRates ?? [],
    }))
  } else {
    initialState.currentLoan = scenario.current_loan_data
      ? { ...scenario.current_loan_data, debts: scenario.current_loan_data.debts ?? [] }
      : undefined
    // Ensure closingCostBreakdown exists on each loaded refi scenario
    initialState.refiScenarios = (scenario.scenarios_data as RefiScenarioInput[]).map(s => ({
      ...s,
      closingCostBreakdown: ensureClosingCosts(s.closingCostBreakdown),
      closingCosts: s.closingCosts ?? sumClosingCosts(s.closingCostBreakdown ?? DEFAULT_CLOSING_COSTS),
    }))
  }

  return <ScenarioBuilder initialState={initialState} />
}
