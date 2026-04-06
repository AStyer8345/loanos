/**
 * POST /api/activity
 *
 * Server-side activity log endpoint for client components that need to write
 * PII-bearing activity entries. The encryption key only exists server-side,
 * so client components call this instead of inserting directly.
 *
 * Body: { publicFields: ActivityPublicFields, pii: PiiPayload }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getOrganization } from '@/lib/getOrganization'
import { createServiceClient } from '@/lib/supabase/service'
import { writeActivityWithPii, type ActivityPublicFields, type PiiPayload } from '@/lib/activity/pii'

export async function POST(request: NextRequest) {
  const { organizationId, userId } = await getOrganization()
  const body = await request.json()

  const publicFields: ActivityPublicFields = {
    ...body.publicFields,
    organization_id: organizationId, // enforce from session, never trust client
    user_id: body.publicFields?.user_id ?? userId,
  }

  const pii: PiiPayload = body.pii ?? {}

  const serviceClient = createServiceClient()
  const { activityId, error } = await writeActivityWithPii(serviceClient, publicFields, pii)

  if (error) {
    return NextResponse.json({ error }, { status: 500 })
  }

  return NextResponse.json({ id: activityId })
}
