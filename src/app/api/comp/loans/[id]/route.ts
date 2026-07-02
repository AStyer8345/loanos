// SaaS-safe: org-scoped via getOrganization
// PATCH /api/comp/loans/[id] — edit a loan_compensation row.
// Derived fields (gross when source=plan, deductions, net, bps) recompute in
// the DB trigger loan_compensation_compute(); this route only writes inputs.

import { NextRequest, NextResponse } from 'next/server'
import { getOrganization } from '@/lib/getOrganization'
import { createServiceClient } from '@/lib/supabase/service'
import type { Database } from '@/lib/database.types'

type LoanCompUpdate = Database['public']['Tables']['loan_compensation']['Update']

const EDITABLE_FIELDS = [
  'deal_type', 'comp_bps', 'gross_source', 'gross_comp', 'company_share_pct',
  'loa_fee_bps', 'broker_fee', 'correspondent_fee', 'other_deduction',
  'payout_status', 'notes', 'loan_amount',
] as const

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
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

  // Editing the gross amount directly implies a manual override unless the
  // caller explicitly set a source.
  if (update.gross_comp !== undefined && update.gross_source === undefined) {
    update.gross_source = 'manual'
  }

  const svc = createServiceClient()
  const { data, error } = await svc
    .from('loan_compensation')
    .update(update as unknown as LoanCompUpdate)
    .eq('id', params.id)
    .eq('organization_id', organizationId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}
