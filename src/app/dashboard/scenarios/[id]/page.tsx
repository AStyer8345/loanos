import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ScenarioBuilder from '../new/ScenarioBuilder'
import type { ScenarioState } from '@/lib/scenarios/types'

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
    initialState.purchaseScenarios = scenario.scenarios_data
  } else {
    initialState.currentLoan = scenario.current_loan_data
    initialState.refiScenarios = scenario.scenarios_data
  }

  return <ScenarioBuilder initialState={initialState} />
}
