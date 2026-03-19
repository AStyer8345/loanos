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

    const { orgName, fullName, nmlsIndividual, phone, statesLicensed } = await req.json()
    if (!orgName?.trim()) return NextResponse.json({ error: 'Organization name required' }, { status: 400 })
    if (!fullName?.trim()) return NextResponse.json({ error: 'Full name required' }, { status: 400 })

    const slug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const service = createServiceClient()

    // Create organization
    const { data: org, error: orgError } = await service
      .from('organizations')
      .insert({ name: orgName.trim(), slug })
      .select('id')
      .single()

    if (orgError) throw orgError

    // Create profile linked to org
    const { error: profileError } = await service
      .from('profiles')
      .upsert({
        id: user.id,
        organization_id: org.id,
        role: 'owner',
        full_name: fullName.trim(),
        email: user.email,
        nmls_individual: nmlsIndividual || null,
        phone: phone || null,
        states_licensed: statesLicensed?.length ? statesLicensed : [],
      })

    if (profileError) throw profileError

    // Create default org_settings row (best-effort — table exists after migration 039)
    await service.from('org_settings').insert({ organization_id: org.id }).then(() => null).catch(() => null)

    return NextResponse.json({ organizationId: org.id })
  } catch (err) {
    console.error('[org/create]', err)
    return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 })
  }
}
