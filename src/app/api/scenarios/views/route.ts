import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOrganization } from '@/lib/getOrganization'

export async function GET(req: NextRequest) {
  try {
    const { organizationId } = await getOrganization()
    const supabase = createClient()

    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const { data, error } = await supabase
      .from('scenarios')
      .select('view_count')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single()

    if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({ view_count: data.view_count ?? 0 })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
