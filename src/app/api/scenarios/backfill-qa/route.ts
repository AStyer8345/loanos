import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOrganization } from '@/lib/getOrganization'
import { generateQAPairs } from '@/lib/scenarios/generateQAPairs'
import type { Json } from '@/lib/database.types'

export async function POST() {
  try {
    const { organizationId } = await getOrganization()
    const supabase = createClient()

    // Fetch all scenarios in this org that are missing Q&A
    const { data: scenarios, error } = await supabase
      .from('scenarios')
      .select('id, scenario_type, borrower_name, scenarios_data, results_data, current_loan_data')
      .eq('organization_id', organizationId)
      .is('borrower_qa', null)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch scenarios' }, { status: 500 })
    }

    if (!scenarios || scenarios.length === 0) {
      return NextResponse.json({ processed: 0, skipped: 0, errors: 0, message: 'All scenarios already have Q&A' })
    }

    let processed = 0
    let errors = 0

    // Process in parallel chunks of 3 to stay within Vercel timeout
    const CHUNK_SIZE = 3
    for (let i = 0; i < scenarios.length; i += CHUNK_SIZE) {
      const chunk = scenarios.slice(i, i + CHUNK_SIZE)

      await Promise.all(chunk.map(async (scenario) => {
        try {
          const pairs = await generateQAPairs(scenario)
          if (pairs.length === 0) {
            errors++
            return
          }
          const { error: updateErr } = await supabase
            .from('scenarios')
            .update({ borrower_qa: pairs as unknown as Json })
            .eq('id', scenario.id)
            .eq('organization_id', organizationId)

          if (updateErr) {
            errors++
          } else {
            processed++
          }
        } catch {
          errors++
        }
      }))
    }

    return NextResponse.json({ processed, skipped: 0, errors })
  } catch (error) {
    console.error('[scenarios/backfill-qa] error:', error)
    return NextResponse.json({ error: 'Backfill failed' }, { status: 500 })
  }
}
