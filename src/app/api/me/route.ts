import { NextRequest, NextResponse } from 'next/server'
import { getOrganization } from '@/lib/getOrganization'
import { getOrgFeatures } from '@/lib/features/getOrgFeatures'
import { checkRateLimit } from '@/lib/rateLimit'

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
  const { allowed } = checkRateLimit(`me:${ip}`, 10, 60_000)
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  try {
    const ctx = await getOrganization()
    const features = await getOrgFeatures()
    return NextResponse.json({ ...ctx, features })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
