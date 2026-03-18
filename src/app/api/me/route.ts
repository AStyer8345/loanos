import { NextResponse } from 'next/server'
import { getOrganization } from '@/lib/getOrganization'

export async function GET() {
  try {
    const ctx = await getOrganization()
    return NextResponse.json(ctx)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
