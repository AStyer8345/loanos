import { NextResponse } from 'next/server'
import { getOrganization } from '@/lib/getOrganization'
import { getApprovalQueue } from '@/lib/drip/queries'

export async function GET() {
  try {
    const { organizationId } = await getOrganization()
    const queue = await getApprovalQueue(organizationId)
    return NextResponse.json({ queue })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
