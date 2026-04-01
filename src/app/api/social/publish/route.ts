import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getOrganization } from '@/lib/getOrganization'

const PUBLER_API_KEY = process.env.PUBLER_API_KEY || ''
const PUBLER_WORKSPACE = process.env.PUBLER_WORKSPACE || ''

const PLATFORM_ACCOUNTS: Record<string, string> = {
  instagram: '69b0530110a77a0ed895847d',
  linkedin: '69b0536404b824ffb2c05426',
  facebook: '69b05329de86f5e15b7c0722',
  all: '', // handled specially
}

export async function POST(req: NextRequest) {
  let organizationId: string
  let userId: string
  try {
    const ctx = await getOrganization()
    organizationId = ctx.organizationId
    userId = ctx.userId
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    if (!PUBLER_API_KEY || !PUBLER_WORKSPACE) {
      return NextResponse.json({ error: 'Publer credentials not configured — add PUBLER_API_KEY and PUBLER_WORKSPACE env vars' }, { status: 500 })
    }

    const { draftId } = await req.json()
    if (!draftId) {
      return NextResponse.json({ error: 'draftId required' }, { status: 400 })
    }

    const supabase = createServiceClient() as any // eslint-disable-line @typescript-eslint/no-explicit-any

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

    // Build the Publer post body — uses app.publer.io/api
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
    const publerRes = await fetch('https://app.publer.io/api/v1/post', {
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
    const { error: updateError } = await supabase
      .from('social_drafts')
      .update({
        status: 'posted',
        publer_post_id: publerPostId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', draftId)

    if (updateError) {
      console.error('[social/publish] Failed to update draft status:', updateError)
      return NextResponse.json({ error: 'Failed to update draft status' }, { status: 500 })
    }

    // Log activity
    const { error: activityError } = await supabase
      .from('social_activity')
      .insert({
        organization_id: organizationId,
        action: 'posted',
        detail: `Published "${draft.title}" to Publer (${draft.platform})`,
      })

    if (activityError) {
      console.error('[social/publish] Failed to log activity:', activityError)
    }

    // Log to Marketing History (mcc_state.log) so it appears in the History tab
    try {
      const platformLabel = draft.platform === 'all' ? 'All Platforms' :
        draft.platform.charAt(0).toUpperCase() + draft.platform.slice(1)

      const channelMap: Record<string, string> = {
        linkedin: 'LinkedIn',
        facebook: 'Facebook',
        instagram: 'Facebook', // History tab groups Instagram under Facebook
        all: 'Facebook',       // Multi-platform defaults to Facebook channel
      }

      const logEntry = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        activity: `Social post published — "${draft.title || 'Untitled'}" (${platformLabel})`,
        channel: channelMap[draft.platform] || 'Other',
        notes: draft.content?.substring(0, 120) || '',
      }

      // Read current mcc_state
      const { data: mccRow } = await supabase
        .from('mcc_state')
        .select('value')
        .eq('user_id', userId)
        .eq('key', 'mcc')
        .single()

      const currentState = (mccRow?.value || { log: [], last: {} }) as { log: unknown[]; last: Record<string, string>; [k: string]: unknown }
      const updatedState = {
        ...currentState,
        log: [logEntry, ...(currentState.log || [])],
      }

      await supabase
        .from('mcc_state')
        .upsert(
          { user_id: userId, key: 'mcc', value: updatedState, updated_at: new Date().toISOString() } as Record<string, unknown>,
          { onConflict: 'user_id,key' }
        )
    } catch (logErr) {
      // Non-blocking — don't fail the publish because history logging failed
      console.error('[social/publish] Failed to log to mcc_state:', logErr)
    }

    return NextResponse.json({ success: true, publerPostId })
  } catch (error) {
    console.error('[social/publish] POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
