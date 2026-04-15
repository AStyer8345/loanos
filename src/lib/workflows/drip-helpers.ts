// src/lib/workflows/drip-helpers.ts

const ALLOWED_EMAIL_EVENT_TYPES = new Set([
  'email.sent',
  'email.delivered',
  'email.bounced',
  'email.complained',
  'email.opened',
  'email.clicked',
  'email.delivery_delayed',
])

export interface ExitRuleInputs {
  email_opt_out: boolean
  status: string                 // drip_enrollment_status value
  recentBounce: boolean          // hard bounce in last step
  recentComplaint: boolean       // complaint in last step
}

/**
 * Returns true if the drip should stop sending.
 * Rules match §7.2 of the spec — checked before every send.
 */
export function shouldExitDrip(inputs: ExitRuleInputs): boolean {
  return (
    inputs.email_opt_out ||
    inputs.recentBounce ||
    inputs.recentComplaint ||
    inputs.status !== 'active'
  )
}

/**
 * Maps a Resend webhook event type to the canonical activity_log event_type.
 * Returns null for event types that should not be written to activity_log.
 */
export function mapResendEventType(resendType: string): string | null {
  return ALLOWED_EMAIL_EVENT_TYPES.has(resendType) ? resendType : null
}

export interface LeadClassificationInput {
  loan_goal: string | null
  situation: string | null
}

/**
 * Fallback classification without AI — uses explicit loan_goal mapping.
 * Mirror of n8n Parse Form Data campaignMap logic.
 */
export function classifyLeadFallback(input: LeadClassificationInput): 'pa' | 'dpa' | 'generic' {
  const goal = (input.loan_goal ?? '').toLowerCase()
  if (['purchase', 'buy', 'first-time buyer', 'ftb'].includes(goal)) return 'pa'
  if (['dpa', 'down payment assistance', 'tsahc', 'tdhca'].includes(goal)) return 'dpa'
  return 'generic'
}

/**
 * Returns the day-offset schedule for a named drip campaign.
 * Day 0 = send immediately on enrollment.
 */
export function buildDripScheduleDays(campaign: 'pa-welcome' | 'dpa-guide'): number[] {
  if (campaign === 'pa-welcome') return [0, 3, 7, 14, 30, 60]
  if (campaign === 'dpa-guide') return [0, 2, 5, 10, 17, 25, 38, 52]
  throw new Error(`Unknown drip campaign: ${campaign}`)
}
