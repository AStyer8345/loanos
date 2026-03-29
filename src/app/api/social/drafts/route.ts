import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getOrganization } from '@/lib/getOrganization'

// GET — fetch all social drafts for the org
export async function GET() {
  try {
    const { organizationId } = await getOrganization()
    const supabase = createServiceClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('social_drafts')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ drafts: data })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

// PATCH — update a social draft by id
export async function PATCH(req: NextRequest) {
  try {
    const { organizationId } = await getOrganization()
    const supabase = createServiceClient()
    const body = await req.json()

    const { id, ...fields } = body
    if (!id) {
      return NextResponse.json({ error: 'Missing draft id' }, { status: 400 })
    }

    // Only allow specific fields to be updated
    const allowed: Record<string, unknown> = {}
    const allowedKeys = ['status', 'content', 'title', 'hashtags', 'platform', 'format', 'scheduled_for']
    for (const key of allowedKeys) {
      if (key in fields) {
        allowed[key] = fields[key]
      }
    }
    allowed['updated_at'] = new Date().toISOString()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('social_drafts')
      .update(allowed)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ draft: data })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
