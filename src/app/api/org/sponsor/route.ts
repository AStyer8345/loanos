import { NextResponse } from 'next/server'
import { getOrganization } from '@/lib/getOrganization'
import { createServiceClient } from '@/lib/supabase/service'

/**
 * "Sponsor LO" — creates a brand-new org and invites a user as its OWNER.
 *
 * Different from /api/org/invite, which adds the invitee as a MEMBER of the
 * caller's existing org (shared pipeline). Sponsor creates an isolated tenant:
 * the sponsored LO gets their own org, their own Arive webhook, their own
 * pipeline. Caller only sees them on the sponsored-orgs list.
 *
 * Gate: only existing org owners can sponsor (prevents random members from
 * minting sister orgs). Future: add a `sponsored_by` column to organizations
 * so we can surface "LOs you've sponsored" on the team page.
 */
export async function POST(req: Request) {
  try {
    const { role: myRole } = await getOrganization()
    if (myRole !== 'owner') {
      return NextResponse.json({ error: 'Only org owners can sponsor new LOs' }, { status: 403 })
    }

    const { email, orgName, fullName, plan = 'starter' } = await req.json()
    if (!email?.trim()) return NextResponse.json({ error: 'Email required' }, { status: 400 })
    if (!orgName?.trim()) return NextResponse.json({ error: 'Organization name required' }, { status: 400 })
    if (!fullName?.trim()) return NextResponse.json({ error: 'Full name required' }, { status: 400 })

    const validPlan = plan === 'professional' ? 'professional' : 'starter'
    const slug = orgName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

    const service = createServiceClient()

    // 1. Create the new org
    const { data: org, error: orgError } = await service
      .from('organizations')
      .insert({ name: orgName.trim(), slug, plan: validPlan })
      .select('id')
      .single()

    if (orgError) throw orgError

    // 2. Invite via Supabase Auth — sends magic link email.
    //    redirectTo lands them at /invite/accept where they set a password.
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
    const { data, error } = await service.auth.admin.inviteUserByEmail(email.trim(), {
      data: { organization_id: org.id, role: 'owner', sponsored: true },
      // Lands at /auth/callback (code exchange) → /invite/accept (set password)
      redirectTo: appUrl ? `${appUrl}/auth/callback?next=/invite/accept` : undefined,
    })

    if (error) {
      // Roll back the org we just created so we don't leak empty tenants
      await service.from('organizations').delete().eq('id', org.id)
      throw error
    }

    // 3. Pre-create profile so middleware knows what org to send them to
    await service.from('profiles').upsert({
      id: data.user.id,
      organization_id: org.id,
      role: 'owner',
      full_name: fullName.trim(),
      email: email.trim(),
    })

    // 4. Pre-create org_settings with onboarding_completed = false so the
    //    wizard fires on their first login
    await service.from('org_settings').insert({
      organization_id: org.id,
      onboarding_completed: false,
    }).then(() => null, () => null)

    return NextResponse.json({
      success: true,
      organizationId: org.id,
      userId: data.user.id,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to sponsor LO'
    console.error('[org/sponsor]', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
