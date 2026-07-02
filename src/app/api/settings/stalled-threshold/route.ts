// PATCH /api/settings/stalled-threshold — set org_settings.stalled_threshold_days

import { NextRequest, NextResponse } from 'next/server'
import { getOrganization } from '@/lib/getOrganization'
import { createServiceClient } from '@/lib/supabase/service'

export async function PATCH(request: NextRequest) {
  let organizationId: string
  try {
    ({ organizationId } = await getOrganization())
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const days = Number(body.days)
  if (!Number.isInteger(days) || days < 1 || days > 90) {
    return NextResponse.json({ error: 'days must be an integer between 1 and 90' }, { status: 400 })
  }

  const svc = createServiceClient()
  const { error } = await svc
    .from('org_settings')
    .update({ stalled_threshold_days: days })
    .eq('organization_id', organizationId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, days })
}
