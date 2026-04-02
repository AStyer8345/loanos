import { NextRequest, NextResponse } from 'next/server'
import { getOrganization } from '@/lib/getOrganization'
import { updateEnrollment } from '@/lib/drip/queries'
import type { DripEnrollmentStatus } from '@/lib/drip/types'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; enrollmentId: string } }
) {
  try {
    const { organizationId } = await getOrganization()
    const body = await req.json() as {
      status?: DripEnrollmentStatus
      removed_reason?: string
      current_step?: number
      next_send_at?: string | null
    }
    const updates: Record<string, unknown> = {}
    if (body.status) {
      updates.status = body.status
      if (body.status === 'removed') {
        updates.removed_at = new Date().toISOString()
        updates.removed_reason = body.removed_reason ?? 'manual'
      }
    }
    if (body.current_step !== undefined) updates.current_step = body.current_step
    if (body.next_send_at !== undefined) updates.next_send_at = body.next_send_at
    const enrollment = await updateEnrollment(organizationId, params.enrollmentId, updates)
    return NextResponse.json(enrollment)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
