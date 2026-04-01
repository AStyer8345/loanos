import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getOrganization } from '@/lib/getOrganization'

// POST — create a new social draft
export async function POST(req: NextRequest) {
  try {
    const { organizationId } = await getOrganization()
    const supabase = createServiceClient()
    const body = await req.json()

    const allowedKeys = ['title', 'content', 'platform', 'format', 'hashtags', 'media_urls', 'status', 'scheduled_for', 'agent_notes', 'pillar', 'created_by']
    const insert: Record<string, unknown> = { organization_id: organizationId }
    for (const key of allowedKeys) {
      if (key in body) insert[key] = body[key]
    }
    if (insert['created_by'] === undefined || insert['created_by'] === null) {
      insert['created_by'] = 'human'
    }
    insert['created_at'] = new Date().toISOString()
    insert['updated_at'] = new Date().toISOString()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('social_drafts')
      .insert(insert)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Log activity
    const { error: activityError } = await (supabase as any) // eslint-disable-line @typescript-eslint/no-explicit-any
      .from('social_activity')
      .insert({
        organization_id: organizationId,
        action: 'drafted',
        detail: `New draft: "${data.title}" (${data.platform})`,
      })

    if (activityError) {
      console.error('[social/drafts] failed to log create activity:', activityError)
    }

    return NextResponse.json({ draft: data })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

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
    const allowedKeys = ['status', 'content', 'title', 'hashtags', 'platform', 'format', 'scheduled_for', 'media_urls', 'rejection_reason']
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

    // Log status changes as activity
    if ('status' in fields && data) {
      const actionMap: Record<string, string> = {
        approved: 'approved',
        rejected: 'rejected',
        scheduled: 'scheduled',
        posted: 'posted',
      }
      const action = actionMap[data.status] || 'updated'
      const { error: activityError } = await (supabase as any) // eslint-disable-line @typescript-eslint/no-explicit-any
        .from('social_activity')
        .insert({
          organization_id: organizationId,
          action,
          detail: `${action.charAt(0).toUpperCase() + action.slice(1)}: "${data.title}" (${data.platform})`,
        })

      if (activityError) {
        console.error('[social/drafts] failed to log status activity:', activityError)
      }
    }

    return NextResponse.json({ draft: data })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

// DELETE — remove a social draft by id
export async function DELETE(req: NextRequest) {
  try {
    const { organizationId } = await getOrganization()
    const supabase = createServiceClient()
    const body = await req.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'Missing draft id' }, { status: 400 })
    }

    const { error } = await (supabase as any) // eslint-disable-line @typescript-eslint/no-explicit-any
      .from('social_drafts')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
