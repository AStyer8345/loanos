import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/auth'
import { writeActivityWithPii } from '@/lib/activity/pii'

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const result = await requireAdmin()
  if (result.error) return result.error
  const { user, serviceClient } = result

  const orgId = params.id
  const { plan } = await req.json()

  if (!['starter', 'professional'].includes(plan)) {
    return NextResponse.json({ error: 'Invalid plan. Must be starter or professional.' }, { status: 400 })
  }

  // Get current plan for logging
  const { data: org } = await serviceClient!
    .from('organizations')
    .select('plan')
    .eq('id', orgId)
    .single()

  if (!org) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
  }

  const previousPlan = org.plan

  // Update plan
  const { error: updateError } = await serviceClient!
    .from('organizations')
    .update({ plan })
    .eq('id', orgId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Log the override with encrypted PII companion
  await writeActivityWithPii(
    serviceClient!,
    {
      organization_id: orgId,
      action: 'admin_plan_override',
      entity_type: 'billing',
      entity_id: orgId,
    },
    {
      summary: `Plan changed from ${previousPlan} to ${plan} by admin`,
      metadata: { previous_plan: previousPlan, new_plan: plan, overridden_by: user!.id },
    },
  )

  return NextResponse.json({ success: true, previous_plan: previousPlan, new_plan: plan })
}
