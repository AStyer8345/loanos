import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOrganization } from '@/lib/getOrganization'

type OnboardingStep = 'arive' | 'import' | 'automations' | 'complete'

const STEP_COLUMN: Record<OnboardingStep, string> = {
  arive: 'setup_arive_done',
  import: 'setup_import_done',
  automations: 'setup_automations_done',
  complete: 'onboarding_completed',
}

const STEP_NUMBER: Record<OnboardingStep, number> = {
  arive: 1,
  import: 2,
  automations: 3,
  complete: 4,
}

export async function POST(req: Request) {
  try {
    const { organizationId } = await getOrganization()
    const { step } = await req.json() as { step: OnboardingStep }

    if (!step || !STEP_COLUMN[step]) {
      return NextResponse.json({ error: 'Invalid step' }, { status: 400 })
    }

    // Use user-scoped client so RLS on org_settings applies as a defense-in-depth
    // backstop. Policy requires role in ('owner','admin') which matches the
    // onboarding actor (org owner completing their own setup).
    const supabase = createClient()
    const column = STEP_COLUMN[step]

    const { error } = await supabase
      .from('org_settings')
      .update({
        [column]: true,
        onboarding_step: STEP_NUMBER[step],
        updated_at: new Date().toISOString(),
      })
      .eq('organization_id', organizationId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[onboarding/step]', err)
    return NextResponse.json({ error: 'Failed to update onboarding step' }, { status: 500 })
  }
}
