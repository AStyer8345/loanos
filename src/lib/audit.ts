import { createServiceClient } from '@/lib/supabase/service'

export type AuditEvent =
  | 'login'
  | 'logout'
  | 'data_export'
  | 'bulk_delete'
  | 'api_access'
  | 'auth_failure'
  | 'document_download'

export async function logSecurityEvent({
  eventType,
  actorId,
  actorEmail,
  ipAddress,
  resource,
  resourceId,
  details,
}: {
  eventType: AuditEvent
  actorId?: string
  actorEmail?: string
  ipAddress?: string
  resource?: string
  resourceId?: string
  details?: Record<string, unknown>
}): Promise<void> {
  try {
    const supabase = createServiceClient()
    await supabase.from('security_audit_log').insert({
      event_type: eventType,
      actor_id: actorId ?? null,
      actor_email: actorEmail ?? null,
      ip_address: ipAddress ?? null,
      resource: resource ?? null,
      resource_id: resourceId ?? null,
      details: details ?? null,
    })
  } catch {
    // Never let audit logging break the main request
  }
}
