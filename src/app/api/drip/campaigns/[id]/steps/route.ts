import { NextRequest, NextResponse } from 'next/server'
import { getOrganization } from '@/lib/getOrganization'
import { getSteps, updateStep, getCampaignById } from '@/lib/drip/queries'
import { createServiceClient } from '@/lib/supabase/service'
import type { DripTriggerType, DripChannel, DripTone, TriggerConfig } from '@/lib/drip/types'

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
    const steps = await getSteps(organizationId, params.id)
    return NextResponse.json({ steps })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { organizationId } = await getOrganization()
    const campaign = await getCampaignById(organizationId, params.id)
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }
    const body = await req.json() as {
      name: string
      step_order: number
      trigger_type: DripTriggerType
      trigger_config: TriggerConfig
      skeleton: string
      channel?: DripChannel
      requires_approval?: boolean
      tone?: DripTone
    }
    if (!body.name || !body.trigger_type || !body.skeleton) {
      return NextResponse.json({ error: 'name, trigger_type, and skeleton are required' }, { status: 400 })
    }
    const supabase: any = createServiceClient() // eslint-disable-line @typescript-eslint/no-explicit-any
    const { data, error } = await supabase
      .from('drip_steps')
      .insert({
        org_id: organizationId,
        campaign_id: params.id,
        step_order: body.step_order,
        name: body.name,
        trigger_type: body.trigger_type,
        trigger_config: body.trigger_config ?? {},
        skeleton: body.skeleton,
        channel: body.channel ?? 'email',
        requires_approval: body.requires_approval ?? false,
        tone: body.tone ?? 'knowledgeable_friend',
      })
      .select()
      .single()
    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { organizationId } = await getOrganization()
    const body = await req.json() as { stepId: string; updates: Record<string, unknown> }
    if (!body.stepId) {
      return NextResponse.json({ error: 'stepId is required' }, { status: 400 })
    }
    const ALLOWED = ['name', 'skeleton', 'trigger_config', 'channel', 'requires_approval', 'tone', 'step_order'] as const
    const updates: Record<string, unknown> = {}
    for (const field of ALLOWED) {
      if (field in body.updates) updates[field] = body.updates[field]
    }
    const step = await updateStep(organizationId, body.stepId, updates)
    return NextResponse.json(step)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
