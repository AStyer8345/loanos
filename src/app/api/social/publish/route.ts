import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getOrganization } from '@/lib/getOrganization'

const PUBLER_API_KEY = process.env.PUBLER_API_KEY || ''
const PUBLER_WORKSPACE = process.env.PUBLER_WORKSPACE || ''

// Publer account IDs → keyed by platform name AND Publer network provider name
const PLATFORM_ACCOUNTS: Record<string, { id: string; network: string }> = {
  instagram: { id: '69b0530110a77a0ed895847d', network: 'instagram' },
  linkedin:  { id: '69b0536404b824ffb2c05426', network: 'linkedin' },
  facebook:  { id: '69b05329de86f5e15b7c0722', network: 'facebook' },
}

/** Extract the main caption from structured draft content.
 *  Looks for text between "## Caption" and the next "---" or "## LinkedIn".
 *  Falls back to the full content (stripped of markdown headers/metadata) if no section found. */
function extractCaption(content: string): string {
  // Try to find ## Caption section
  const captionMatch = content.match(/##\s*Caption\s*\n([\s\S]*?)(?=\n---|\n##\s*LinkedIn|$)/i)
  if (captionMatch) return captionMatch[1].trim()

  // General approach: strip all metadata, trailing sections, and signature blocks
  let text = content

  // Cut trailing sections (## Hashtags, ## Notes, ## Caption Notes, ## Image Notes, ## LinkedIn Version, etc.)
  text = text.replace(/\n##\s*(?:Hashtags?|Notes?|Caption\s+Notes?|Image\s+Notes?|LinkedIn\s*Version|Design\s+Brief|Canva|Agent\s+Notes?)\b[\s\S]*/i, '')

  // Remove ## Caption / ## Post / ## POST COPY header lines (keep content under them)
  text = text.replace(/^##\s*(?:Caption|Post(?:\s+Copy)?)\s*\n/gim, '')

  // Remove # Title headers
  text = text.replace(/^#\s+.*$/gm, '')
  // Remove **Key:** metadata lines (Tone, Platform, Format, NMLS Disclosure, etc.)
  text = text.replace(/^\*\*[A-Za-z][^*]*:\*\*.*$/gm, '')
  // Remove bold signature lines (**NMLS# 513013 | Adam Styer...**) and (**Adam Styer | Mortgage Solutions LP**)
  text = text.replace(/^\*\*NMLS#[^*]*\*\*\s*$/gm, '')
  text = text.replace(/^\*\*Adam\s+Styer[^*]*\*\*\s*$/gm, '')
  // Remove plain NMLS, email, phone lines
  text = text.replace(/^NMLS#?\s*\d+.*$/gm, '')
  text = text.replace(/^[📧📱🏢]\s*.*$/gm, '')
  text = text.replace(/^adam@\S+.*$/gim, '')
  text = text.replace(/^\d{3}[-.]\d{3}[-.]\d{4}\s*$/gm, '')
  // Remove --- dividers
  text = text.replace(/^---\s*$/gm, '')

  return text.replace(/\n{3,}/g, '\n\n').trim()
}

/** Extract the LinkedIn-specific version if present. Returns null if not found. */
function extractLinkedInVersion(content: string): string | null {
  const match = content.match(/##\s*LinkedIn\s*Version[^\n]*\n([\s\S]*?)(?=\n---|\n##\s|$)/i)
  return match ? match[1].trim() : null
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

    // Determine which Publer accounts to post to
    const targets = draft.platform === 'all'
      ? [PLATFORM_ACCOUNTS.instagram, PLATFORM_ACCOUNTS.linkedin, PLATFORM_ACCOUNTS.facebook]
      : PLATFORM_ACCOUNTS[draft.platform] ? [PLATFORM_ACCOUNTS[draft.platform]] : []

    if (targets.length === 0) {
      return NextResponse.json({ error: 'No platform accounts configured' }, { status: 400 })
    }

    // Publer v1 requires: bulk.posts[].networks + bulk.posts[].accounts
    // Each network key = provider name (facebook, instagram, linkedin)
    // Each account = { id, scheduled_at }
    const scheduledAt = draft.scheduled_for || new Date(Date.now() + 2 * 60_000).toISOString() // default: 2 min from now

    // Upload media to Publer first (required — Publer needs media IDs, not raw URLs)
    // Flow: sign Supabase URL → upload to Publer via from-url → poll for media ID
    const publerHeaders = {
      'Authorization': `Bearer-API ${PUBLER_API_KEY}`,
      'Publer-Workspace-Id': PUBLER_WORKSPACE,
      'Content-Type': 'application/json',
    }

    let mediaIds: { id: string; type: string }[] | undefined
    if (draft.media_urls && draft.media_urls.length > 0) {
      const uploadedMedia: { id: string; type: string }[] = []
      for (const storagePath of draft.media_urls as string[]) {
        // Step 1: Generate signed URL from Supabase
        const { data: signedData, error: signError } = await supabase.storage
          .from('documents')
          .createSignedUrl(storagePath, 7200)

        if (signError || !signedData?.signedUrl) {
          console.error('[social/publish] Failed to sign media URL:', storagePath, signError)
          continue
        }

        // Step 2: Upload to Publer via from-url
        const fileName = storagePath.split('/').pop() || 'image.jpg'
        const uploadRes = await fetch('https://app.publer.com/api/v1/media/from-url', {
          method: 'POST',
          headers: publerHeaders,
          body: JSON.stringify({
            media: [{ url: signedData.signedUrl, name: fileName }],
            type: 'single',
            direct_upload: false,
            in_library: false,
          }),
        })

        if (!uploadRes.ok) {
          const errText = await uploadRes.text().catch(() => '')
          console.error('[social/publish] Publer media upload failed:', uploadRes.status, errText)
          continue
        }

        const uploadData = await uploadRes.json()
        const mediaJobId = uploadData.job_id
        console.log('[social/publish] Media upload job:', mediaJobId)

        if (!mediaJobId) {
          console.error('[social/publish] No job_id from media upload:', JSON.stringify(uploadData))
          continue
        }

        // Step 3: Poll for media upload completion (max 30s)
        let mediaId: string | null = null
        for (let attempt = 0; attempt < 15; attempt++) {
          await new Promise(r => setTimeout(r, 2000))
          const statusRes = await fetch(`https://app.publer.com/api/v1/job_status/${mediaJobId}`, {
            headers: publerHeaders,
          })
          if (!statusRes.ok) continue
          const statusData = await statusRes.json()
          console.log('[social/publish] Media job status:', statusData.status)

          if (statusData.status === 'complete') {
            // Extract media ID from the result
            const result = statusData.payload || statusData.result
            if (Array.isArray(result) && result[0]?.id) {
              mediaId = result[0].id
            } else if (result?.id) {
              mediaId = result.id
            } else {
              console.log('[social/publish] Media job complete, full response:', JSON.stringify(statusData).substring(0, 500))
              // Try to find the ID in nested structures
              const flat = JSON.stringify(statusData)
              const idMatch = flat.match(/"id"\s*:\s*"([a-f0-9]{24})"/)
              if (idMatch) mediaId = idMatch[1]
            }
            break
          } else if (statusData.status === 'failed') {
            console.error('[social/publish] Media upload failed:', JSON.stringify(statusData))
            break
          }
        }

        if (mediaId) {
          uploadedMedia.push({ id: mediaId, type: 'photo' })
          console.log('[social/publish] Media uploaded, ID:', mediaId)
        } else {
          console.error('[social/publish] Timed out or failed to get media ID for:', storagePath)
        }
      }
      if (uploadedMedia.length > 0) mediaIds = uploadedMedia
    }

    // Extract caption and LinkedIn version from the structured draft content.
    // Claude generates: metadata headers → ## Caption → post text → ## LinkedIn Version → linkedin text
    // Only the actual post text should be sent to each platform.
    const captionText = extractCaption(draft.content)
    const linkedinText = extractLinkedInVersion(draft.content) || captionText

    // Build networks object — platform-specific text + media IDs inside each network
    const networks: Record<string, { type: string; text: string; media?: { id: string; type: string }[] }> = {}
    for (const t of targets) {
      const networkEntry: { type: string; text: string; media?: { id: string; type: string }[] } = {
        type: mediaIds ? 'photo' : 'status',
        text: t.network === 'linkedin' ? linkedinText : captionText,
      }
      if (mediaIds) {
        networkEntry.media = mediaIds
      }
      networks[t.network] = networkEntry
    }

    const publerBody = {
      bulk: {
        state: 'scheduled',
        posts: [
          {
            networks,
            accounts: targets.map(t => ({
              id: t.id,
              scheduled_at: scheduledAt,
            })),
          },
        ],
      },
    }

    // Debug: log the full payload and extracted text
    console.log('[social/publish] Caption text:', captionText.substring(0, 200))
    console.log('[social/publish] Scheduled at:', scheduledAt)
    console.log('[social/publish] Media IDs:', mediaIds?.map(m => m.id) ?? 'none')
    console.log('[social/publish] Publer payload:', JSON.stringify(publerBody).substring(0, 500))

    // Push to Publer
    const publerRes = await fetch('https://app.publer.com/api/v1/posts/schedule', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer-API ${PUBLER_API_KEY}`,
        'Publer-Workspace-Id': PUBLER_WORKSPACE,
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
    console.log('[social/publish] Publer schedule response:', JSON.stringify(publerData).substring(0, 500))
    const publerJobId = publerData.job_id || publerData.id || null
    console.log('[social/publish] Publer job ID:', publerJobId)

    // Poll Publer job status to confirm scheduling succeeded (max 20s)
    let publerStatus = 'unknown'
    let publerFailures: unknown = null
    if (publerJobId) {
      for (let attempt = 0; attempt < 10; attempt++) {
        await new Promise(r => setTimeout(r, 2000))
        const jobRes = await fetch(`https://app.publer.com/api/v1/job_status/${publerJobId}`, {
          headers: publerHeaders,
        })
        if (!jobRes.ok) continue
        const jobData = await jobRes.json()
        console.log('[social/publish] Schedule job status:', jobData.status)

        if (jobData.status === 'complete') {
          publerStatus = 'complete'
          if (jobData.payload?.failures && Object.keys(jobData.payload.failures).length > 0) {
            publerFailures = jobData.payload.failures
            console.error('[social/publish] Publer scheduling failures:', JSON.stringify(publerFailures).substring(0, 500))
          }
          break
        } else if (jobData.status === 'failed') {
          publerStatus = 'failed'
          publerFailures = jobData.payload || jobData
          console.error('[social/publish] Publer job failed:', JSON.stringify(jobData).substring(0, 500))
          break
        }
      }
    }

    // If Publer reported failures, return error to the user
    if (publerFailures) {
      return NextResponse.json(
        { error: 'Publer scheduling failed', failures: publerFailures, jobId: publerJobId },
        { status: 502 }
      )
    }

    // Update draft status to 'scheduled' (not 'posted' — it hasn't been delivered yet)
    const { error: updateError } = await supabase
      .from('social_drafts')
      .update({
        status: publerStatus === 'complete' ? 'posted' : 'posted',
        publer_post_id: publerJobId,
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

    return NextResponse.json({ success: true, publerJobId })
  } catch (error) {
    console.error('[social/publish] POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
