import { NextRequest, NextResponse } from 'next/server'
import { getOrganization } from '@/lib/getOrganization'
import { getCampaignsWithStats } from '@/lib/drip/queries'
import { createServiceClient } from '@/lib/supabase/service'
import type { DripAudience, DripCampaignStatus, ExitRule } from '@/lib/drip/types'

export async function GET() {
  try {
    const { organizationId } = await getOrganization()
    const campaigns = await getCampaignsWithStats(organizationId)
    return NextResponse.json({ campaigns })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { organizationId } = await getOrganization()
    const body = await req.json() as {
      name: string
      audience: DripAudience
      description?: string
      status?: DripCampaignStatus
      exit_rules?: ExitRule[]
    }

    if (!body.name || !body.audience) {
      return NextResponse.json({ error: 'name and audience are required' }, { status: 400 })
    }

    const supabase: any = createServiceClient() // eslint-disable-line @typescript-eslint/no-explicit-any
    const { data, error } = await supabase
      .from('drip_campaigns')
      .insert({
        org_id: organizationId,
        name: body.name,
        audience: body.audience,
        description: body.description ?? null,
        status: body.status ?? 'active',
        exit_rules: body.exit_rules ?? [],
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'A campaign with that name already exists' }, { status: 409 })
      }
      throw error
    }

    return NextResponse.json(data, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
