import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getOrganization } from '@/lib/getOrganization'
import { normalizePlan, type Plan, type ProfessionalFeature } from './entitlements'

export class PlanExceededError extends Error {
  constructor(
    public requiredPlan: Plan,
    public currentPlan: Plan,
    public feature?: string
  ) {
    super(
      `Feature${feature ? ` "${feature}"` : ''} requires ${requiredPlan} plan (current: ${currentPlan})`
    )
    this.name = 'PlanExceededError'
  }
}

/**
 * Resolve the current org's plan. Throws if there's no active session.
 * Returns the normalized Plan value.
 */
export async function getCurrentPlan(): Promise<{
  organizationId: string
  userId: string
  role: 'owner' | 'admin' | 'member'
  plan: Plan
}> {
  const ctx = await getOrganization()
  const svc = createServiceClient()
  const { data: org } = await svc
    .from('organizations')
    .select('plan')
    .eq('id', ctx.organizationId)
    .single()
  return {
    ...ctx,
    plan: normalizePlan(org?.plan),
  }
}

/**
 * Guard helper for API route handlers. Resolves the session's org + plan and
 * throws PlanExceededError if the org's plan is below the required tier.
 *
 * Usage:
 *   export async function POST(req: NextRequest) {
 *     try {
 *       const { organizationId, userId, plan } = await requirePlan('professional', 'dripCampaigns')
 *       // ... handler
 *     } catch (e) {
 *       if (e instanceof PlanExceededError) return planDeniedResponse(e)
 *       throw e
 *     }
 *   }
 */
export async function requirePlan(
  requiredPlan: Plan,
  feature?: ProfessionalFeature
): Promise<{
  organizationId: string
  userId: string
  role: 'owner' | 'admin' | 'member'
  plan: Plan
}> {
  const ctx = await getCurrentPlan()
  if (requiredPlan === 'professional' && ctx.plan !== 'professional') {
    throw new PlanExceededError(requiredPlan, ctx.plan, feature)
  }
  return ctx
}

/**
 * Build the standard 402 Payment Required response for a plan violation.
 * Catch PlanExceededError in route handlers and return this.
 */
export function planDeniedResponse(err: PlanExceededError): NextResponse {
  return NextResponse.json(
    {
      error: 'Plan upgrade required',
      requiredPlan: err.requiredPlan,
      currentPlan: err.currentPlan,
      feature: err.feature,
      message: err.message,
    },
    { status: 402 }
  )
}
