import { NextRequest, NextResponse } from 'next/server'
import { getOrganization } from '@/lib/getOrganization'
import { createServiceClient } from '@/lib/supabase/service'

// GET /api/automations/registry/[id]/runs
// Paginated run history for an automation
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const { organizationId } = await getOrganization()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase: any = createServiceClient()

    const url = new URL(req.url)
    const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '20', 10), 100)
    const offset = parseInt(url.searchParams.get('offset') ?? '0', 10)

    // Verify the automation belongs to this org first
    const { data: automation, error: authError } = await supabase
      .from('automation_registry')
      .select('id')
      .eq('id', id)
      .eq('org_id', organizationId)
      .single()

    if (authError || !automation) {
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 })
    }

    const { data, error, count } = await supabase
      .from('automation_runs')
      .select('*', { count: 'exact' })
      .eq('automation_id', id)
      .eq('org_id', organizationId)
      .order('started_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Failed to fetch runs:', error)
      return NextResponse.json({ error: 'Failed to fetch runs' }, { status: 500 })
    }

    return NextResponse.json({ runs: data ?? [], total: count ?? 0, limit, offset })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
