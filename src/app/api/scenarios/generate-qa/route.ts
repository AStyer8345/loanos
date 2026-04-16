import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOrganization } from '@/lib/getOrganization'
import { generateQAPairs } from '@/lib/scenarios/generateQAPairs'
import type { Json } from '@/lib/database.types'

export type { BorrowerQAPair } from '@/lib/scenarios/generateQAPairs'

export async function POST(req: NextRequest) {
  try {
    const { organizationId } = await getOrganization()
    const supabase = createClient()

    const { scenarioId } = await req.json()
    if (!scenarioId) {
      return NextResponse.json({ error: 'Missing scenarioId' }, { status: 400 })
    }

    // Fetch scenario through RLS — confirms org ownership
    const { data: scenario, error: fetchErr } = await supabase
      .from('scenarios')
      .select('id, scenario_type, borrower_name, scenarios_data, results_data, current_loan_data')
      .eq('id', scenarioId)
      .eq('organization_id', organizationId)
      .single()

    if (fetchErr || !scenario) {
      return NextResponse.json({ error: 'Scenario not found' }, { status: 404 })
    }

    // Skip if Q&A already exists — idempotent
    const { data: existing } = await supabase
      .from('scenarios')
      .select('borrower_qa')
      .eq('id', scenarioId)
      .single()
    if (existing?.borrower_qa) {
      return NextResponse.json({ ok: true, cached: true })
    }

    const pairs = await generateQAPairs(scenario)

    if (pairs.length === 0) {
      return NextResponse.json({ ok: false, error: 'Empty Q&A array' }, { status: 200 })
    }

    // Persist to DB — cast required: BorrowerQAPair[] → Json (JSONB column)
    await supabase
      .from('scenarios')
      .update({ borrower_qa: pairs as unknown as Json })
      .eq('id', scenarioId)
      .eq('organization_id', organizationId)

    return NextResponse.json({ ok: true, count: pairs.length })
  } catch (error) {
    console.error('[scenarios/generate-qa] error:', error)
    // Return 200 — caller is fire-and-forget, shouldn't surface UI errors
    return NextResponse.json({ ok: false, error: 'Generation failed' }, { status: 200 })
  }
}
