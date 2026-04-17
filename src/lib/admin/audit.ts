import { createServiceClient } from '@/lib/supabase/service'
import type { TablesInsert, Json } from '@/lib/database.types'

interface AdminAuditParams {
  actorId: string
  actorEmail?: string | null
  action: string
  resourceType?: string
  resourceId?: string
  details?: Record<string, Json>
}

/**
 * Writes an immutable entry to admin_audit_log.
 * Never throws — audit failures must not break the action being logged.
 */
export async function logAdminAction(params: AdminAuditParams): Promise<void> {
  try {
    const serviceClient = createServiceClient()
    const row: TablesInsert<'admin_audit_log'> = {
      actor_id: params.actorId,
      actor_email: params.actorEmail ?? null,
      action: params.action,
      resource_type: params.resourceType ?? null,
      resource_id: params.resourceId ?? null,
      details: params.details ?? {},
    }
    await serviceClient.from('admin_audit_log').insert(row)
  } catch {
    // Intentionally silent — audit log failures must not surface to callers
  }
}
