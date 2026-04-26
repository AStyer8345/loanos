import { NextRequest, NextResponse } from 'next/server'
import { getOrganization } from '@/lib/getOrganization'
import { getRecentSends } from '@/lib/drip/queries'

export async function GET(req: NextRequest) {
  try {
    const { organizationId } = await getOrganization()
    const limitParam = req.nextUrl.searchParams.get('limit')
    const parsed = limitParam ? Number.parseInt(limitParam, 10) : 25
    const limit = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), 100) : 25

    const sends = await getRecentSends(organizationId, limit)
    return NextResponse.json({ sends })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
