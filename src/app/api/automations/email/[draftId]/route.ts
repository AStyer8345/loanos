import { NextRequest, NextResponse } from 'next/server'
import { getOrganization } from '@/lib/getOrganization'
import { createServiceClient } from '@/lib/supabase/service'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { draftId: string } }
) {
  let organizationId: string
  try {
    const ctx = await getOrganization()
    organizationId = ctx.organizationId
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { draftId } = params
    const body = await req.json()
    const { subject, body_html } = body as { subject?: string; body_html?: string }

    if (!subject && !body_html) {
      return NextResponse.json(
        { error: 'Provide at least one field to update: subject, body_html' },
        { status: 400 }
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase: any = createServiceClient()

    const updates: Record<string, string> = {
      updated_at: new Date().toISOString(),
    }

    if (subject !== undefined) {
      updates.subject = subject
    }

    if (body_html !== undefined) {
      updates.body_html = body_html
      // Compute body_preview from HTML
      updates.body_preview = body_html
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 200)
    }

    const { data, error } = await supabase
      .from('email_drafts')
      .update(updates)
      .eq('id', draftId)
      .eq('organization_id', organizationId)
      .select()
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Draft not found or update failed' }, { status: 404 })
    }

    return NextResponse.json({ success: true, draft: data })
  } catch (error) {
    console.error('[automations/email/[draftId]] PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
