// SaaS-safe: org-scoped via getOrganization
// GET /api/comp/plan — fetch the org's active compensation plan
// PUT /api/comp/plan — update plan defaults (creates one if missing)

import { NextRequest, NextResponse } from 'next/server'
import { getOrganization } from '@/lib/getOrganization'
import { createServiceClient } from '@/lib/supabase/service'
import type { Database } from '@/lib/database.types'

type CompPlanUpdate = Database['public']['Tables']['comp_plans']['Update']

const EDITABLE_FIELDS = [
  'comp_bps', 'company_share_pct', 'loa_fee_bps', 'broker_fee',
  'correspondent_fee', 'default_deal_type', 'admin_fee',
  'closing_coord_fee', 'processing_fee', 'name',
] as const

export async function GET() {
  let organizationId: string
  try {
    ({ organizationId } = await getOrganization())
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const svc = createServiceClient()
  const { data, error } = await svc
    .from('comp_plans')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PUT(request: NextRequest) {
  let organizationId: string
  try {
    ({ organizationId } = await getOrganization())
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const update: Record<string, unknown> = {}
  for (const field of EDITABLE_FIELDS) {
    if (body[field] !== undefined) update[field] = body[field]
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No editable fields provided' }, { status: 400 })
  }
  update.updated_at = new Date().toISOString()

  const svc = createServiceClient()
  const { data: existing } = await svc
    .from('comp_plans')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .maybeSingle()

  if (existing) {
    const { data, error } = await svc
      .from('comp_plans')
      .update(update as unknown as CompPlanUpdate)
      .eq('id', existing.id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  const { data, error } = await svc
    .from('comp_plans')
    .insert({ organization_id: organizationId, ...update } as unknown as Database['public']['Tables']['comp_plans']['Insert'])
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
