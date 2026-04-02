import { NextRequest, NextResponse } from 'next/server'
import { getOrganization } from '@/lib/getOrganization'
import { getCampaignById, updateCampaign } from '@/lib/drip/queries'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { organizationId } = await getOrganization()
    const campaign = await getCampaignById(organizationId, params.id)
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }
    return NextResponse.json(campaign)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { organizationId } = await getOrganization()
    const body = await req.json()
    const ALLOWED = ['name', 'description', 'status', 'exit_rules'] as const
    const updates: Record<string, unknown> = {}
    for (const field of ALLOWED) {
      if (field in body) updates[field] = body[field]
    }
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }
    const campaign = await updateCampaign(organizationId, params.id, updates)
    return NextResponse.json(campaign)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
