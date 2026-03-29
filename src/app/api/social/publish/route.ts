import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getOrganization } from '@/lib/getOrganization'

const PUBLER_API_KEY = '14ff59c284cf0e2d0720672cf1e1ccdc81af5fa56f8a88c2'
const PUBLER_WORKSPACE = '69b052bf835c8c689fab8fd8'

const PLATFORM_ACCOUNTS: Record<string, string> = {
  instagram: '69b0530110a77a0ed895847d',
  linkedin: '69b0536404b824ffb2c05426',
  facebook: '69b05329de86f5e15b7c0722',
  all: '', // handled specially
}

export async function POST(req: NextRequest) {
  let organizationId: string
  try {
    const ctx = await getOrganization()
    organizationId = ctx.organizationId
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { draftId } = await req.json()
    if (!draftId) {
      return NextResponse.json({ error: 'draftId required' }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase: any = createServiceClient()

    // Fetch the draft
    const { data: draft, error: fetchError } = await supabase
      .from('social_drafts')
      .select('*')
      .eq('id', draftId)
      .eq('organization_id', organizationId)
      .single()

    if (fetchError || !draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
    }

    if (draft.status !== 'approved') {
      return NextResponse.json({ error: 'Draft must be approved before publishing' }, { status: 400 })
    }

    // Determine which Publer profiles to post to
    let profiles: string[] = []
    if (draft.platform === 'all') {
      profiles = [
        PLATFORM_ACCOUNTS.instagram,
        PLATFORM_ACCOUNTS.linkedin,
        PLATFORM_ACCOUNTS.facebook,
      ]
    } else {
      const accountId = PLATFORM_ACCOUNTS[draft.platform]
      if (accountId) profiles = [accountId]
    }

    if (profiles.length === 0) {
      return NextResponse.json({ error: 'No platform accounts configured' }, { status: 400 })
    }

    // Build the Publer post body — uses api.publer.io, not app.publer.com
    const publerBody: Record<string, unknown> = {
      workspaceId: PUBLER_WORKSPACE,
      profiles,
      text: draft.content,
      isDraft: true, // Creates as draft in Publer for final review
    }

    // Add scheduled time if set
    if (draft.scheduled_for) {
      publerBody.scheduledAt = draft.scheduled_for
    }

    // Add media if present
    if (draft.media_urls && draft.media_urls.length > 0) {
      publerBody.media = draft.media_urls.map((url: string) => ({ url }))
    }

    // Push to Publer
    const publerRes = await fetch('https://api.publer.io/v1/posts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PUBLER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(publerBody),
    })

    if (!publerRes.ok) {
      const errorText = await publerRes.text().catch(() => 'Unknown error')
      console.error('[social/publish] Publer API error:', publerRes.status, errorText)
      return NextResponse.json(
        { error: `Publer API error: ${publerRes.status}`, detail: errorText },
        { status: 502 }
      )
    }

    const publerData = await publerRes.json()
    const publerPostId = publerData.id || publerData.post_id || null

    // Only update draft status to 'posted' after Publer confirms
    await supabase
      .from('social_drafts')
      .update({
        status: 'posted',
        publer_post_id: publerPostId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', draftId)

    // Log activity
    await supabase
      .from('social_activity')
      .insert({
        organization_id: organizationId,
        action: 'scheduled',
        detail: `Published "${draft.title}" to Publer (${draft.platform})`,
      })

    return NextResponse.json({ success: true, publerPostId })
  } catch (error) {
    console.error('[social/publish] POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
