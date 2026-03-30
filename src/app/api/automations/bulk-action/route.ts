import { NextRequest, NextResponse } from 'next/server'
import { getOrganization } from '@/lib/getOrganization'
import { createServiceClient } from '@/lib/supabase/service'

// POST /api/automations/bulk-action
// Body: { action: 'pause_all' | 'resume_all' }
// Updates all non-disabled automations for the org to paused or active
export async function POST(req: NextRequest) {
  try {
    const { organizationId } = await getOrganization()

    const body = await req.json()
    const action: string = body.action ?? ''

    if (action !== 'pause_all' && action !== 'resume_all') {
      return NextResponse.json(
        { error: "action must be 'pause_all' or 'resume_all'" },
        { status: 400 }
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase: any = createServiceClient()

    const newStatus = action === 'pause_all' ? 'paused' : 'active'

    const { data, error } = await supabase
      .from('automation_registry')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('org_id', organizationId)
      .neq('status', 'disabled')
      .select('id')

    if (error) {
      console.error('Bulk action failed:', error)
      return NextResponse.json({ error: 'Bulk action failed' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, updated: data?.length ?? 0, status: newStatus })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
