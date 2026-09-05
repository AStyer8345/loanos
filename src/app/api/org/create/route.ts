import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(req: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Check they don't already have an org
    const { data: existing } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (existing?.organization_id) {
      return NextResponse.json({ error: 'Already assigned to an organization' }, { status: 400 })
    }

    const { orgName, fullName, nmlsIndividual, phone, statesLicensed, plan } = await req.json()
    if (!orgName?.trim()) return NextResponse.json({ error: 'Organization name required' }, { status: 400 })
    if (!fullName?.trim()) return NextResponse.json({ error: 'Full name required' }, { status: 400 })

    const validPlan = plan === 'professional' ? 'professional' : 'starter'
    const service = createServiceClient()
    const { data: organizationId, error } = await service.rpc('claim_new_organization', {
      p_user: user.id, p_email: user.email, p_name: orgName.trim(), p_full_name: fullName.trim(),
      p_plan: validPlan, p_profile: { nmls_individual: nmlsIndividual || null, phone: phone || null, states_licensed: Array.isArray(statesLicensed) ? statesLicensed : [] },
    })
    if (error) throw error

    return NextResponse.json({ organizationId })
  } catch (err) {
    console.error('[org/create]', err)
    return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 })
  }
}
