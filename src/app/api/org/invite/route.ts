import { NextResponse } from 'next/server'
import { getOrganization } from '@/lib/getOrganization'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(req: Request) {
  try {
    const { role: myRole, organizationId } = await getOrganization()
    if (!['owner', 'admin'].includes(myRole!)) {
      return NextResponse.json({ error: 'Only owners and admins can invite members' }, { status: 403 })
    }

    const { email, role = 'member' } = await req.json()
    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return NextResponse.json({ error: 'Email required' }, { status: 400 })
    if (!['admin', 'member'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    const service = createServiceClient()

    const { data: existing, error: lookupError } = await service.from('profiles').select('id,organization_id').ilike('email', email.trim()).limit(1)
    if (lookupError) throw lookupError
    if (existing?.length) return NextResponse.json({ error: 'This account already has a team membership. No invitation or membership change was made.' }, { status: 409 })

    // Invite user via Supabase Auth admin (sends magic link email).
    // redirectTo chains through /auth/callback (code exchange) and lands them
    // on /invite/accept where they set a password.
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
    const { data, error } = await service.auth.admin.inviteUserByEmail(email.trim(), {
      data: { organization_id: organizationId, role },
      redirectTo: appUrl ? `${appUrl}/auth/callback?next=/invite/accept` : undefined,
    })

    if (error) throw error

    // Pre-create profile so middleware doesn't redirect them to onboarding
    const { error: profileError } = await service.rpc('attach_invited_profile', {
      p_user: data.user.id, p_email: email.trim(), p_org: organizationId, p_role: role,
    })
    if (profileError) throw profileError

    return NextResponse.json({ success: true, userId: data.user.id })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to send invite'
    console.error('[org/invite]', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
