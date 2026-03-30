import { NextResponse } from 'next/server'
import { getOrganization } from '@/lib/getOrganization'
import { createServiceClient } from '@/lib/supabase/service'

// GET /api/automations/registry
// List all automations for the org, ordered by group_name then name
export async function GET() {
  try {
    const { organizationId } = await getOrganization()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase: any = createServiceClient()

    const { data, error } = await supabase
      .from('automation_registry')
      .select('*')
      .eq('org_id', organizationId)
      .order('group_name', { ascending: true })
      .order('name', { ascending: true })

    if (error) {
      console.error('Failed to fetch automations:', error)
      return NextResponse.json({ error: 'Failed to fetch automations' }, { status: 500 })
    }

    return NextResponse.json({ automations: data ?? [] })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
