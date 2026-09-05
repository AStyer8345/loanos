export const ROUTING_REASONS = [
  'waiting:borrower', 'waiting:third_party',
  'escalation:relationship_risk', 'escalation:borrower_concern',
  'escalation:loan_strategy', 'escalation:loan_structure',
  'escalation:closing_risk', 'escalation:revenue_risk',
  'escalation:sales_opportunity', 'escalation:team_request',
] as const

export function parseRouting(body: unknown): { assigned_to?: string | null; follow_up_reason?: string | null } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Invalid routing request')
  const raw = body as Record<string, unknown>
  if (!Object.keys(raw).length || Object.keys(raw).some(key => !['assigned_to', 'follow_up_reason'].includes(key))) throw new Error('Only task routing can be changed here')
  const result: { assigned_to?: string | null; follow_up_reason?: string | null } = {}
  if ('assigned_to' in raw) {
    if (raw.assigned_to !== null && (typeof raw.assigned_to !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw.assigned_to))) throw new Error('Invalid team member')
    result.assigned_to = raw.assigned_to as string | null
  }
  if ('follow_up_reason' in raw) {
    if (raw.follow_up_reason !== null && !ROUTING_REASONS.includes(raw.follow_up_reason as typeof ROUTING_REASONS[number])) throw new Error('Choose a supported routing reason')
    result.follow_up_reason = raw.follow_up_reason as string | null
  }
  return result
}
