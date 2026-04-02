import { NextRequest, NextResponse } from 'next/server'
import { getOrganization } from '@/lib/getOrganization'
import { updateSendStatus } from '@/lib/drip/queries'
import type { DripSendStatus } from '@/lib/drip/types'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { sendId: string } }
) {
  try {
    const { organizationId } = await getOrganization()
    const body = await req.json() as {
      action: 'approve' | 'skip' | 'cancel'
      edited_subject?: string
      edited_body?: string
    }
    const statusMap: Record<string, DripSendStatus> = {
      approve: 'approved',
      skip: 'skipped',
      cancel: 'cancelled',
    }
    const newStatus = statusMap[body.action]
    if (!newStatus) {
      return NextResponse.json({ error: 'Invalid action. Use: approve, skip, cancel' }, { status: 400 })
    }
    const updates = body.action === 'approve' && (body.edited_subject || body.edited_body)
      ? { generated_subject: body.edited_subject, generated_body: body.edited_body }
      : undefined
    const send = await updateSendStatus(organizationId, params.sendId, newStatus, updates)
    return NextResponse.json(send)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
