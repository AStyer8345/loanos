import { NextRequest, NextResponse } from 'next/server'
import { getOrganization } from '@/lib/getOrganization'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET() {
  try {
    const { organizationId } = await getOrganization()
    const supabase = createServiceClient() as any // eslint-disable-line @typescript-eslint/no-explicit-any
    const { data, error } = await supabase
      .from('drip_suppressions')
      .select('id, email, scope, campaign_id, reason, added_at, added_by')
      .eq('org_id', organizationId)
      .order('added_at', { ascending: false })
    if (error) throw error
    return NextResponse.json({ suppressions: data ?? [] })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { organizationId, userId } = await getOrganization()
    const body = await req.json() as { email: string; reason?: string; scope?: string; campaign_id?: string }

    const email = (body.email ?? '').trim().toLowerCase()
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }

    const supabase = createServiceClient() as any // eslint-disable-line @typescript-eslint/no-explicit-any
    const { data, error } = await supabase
      .from('drip_suppressions')
      .insert({
        org_id: organizationId,
        email,
        scope: body.scope ?? 'global',
        campaign_id: body.campaign_id ?? null,
        reason: body.reason?.trim() || null,
        added_by: userId ?? 'user',
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'This email is already on the hold list' }, { status: 409 })
      }
      throw error
    }

    return NextResponse.json(data, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
