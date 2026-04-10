import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getOrganization } from '@/lib/getOrganization'

const PUBLER_API_KEY_ENV = process.env.PUBLER_API_KEY || ''

type PublerAccount = { id: string; network: string }
type PublerConfig = {
  workspace_id: string
  /** Optional per-tenant API key. When present, overrides PUBLER_API_KEY env var.
   *  Unblocks multi-tenant publishing (LO #2, #3, ...) without redeploying env vars. */
  api_key?: string
  accounts: Partial<Record<'instagram' | 'linkedin' | 'facebook' | 'google', PublerAccount>>
}

/**
 * Load per-org Publer configuration from social_settings (key='publer_config').
 * Returns null if the org hasn't wired up Publer yet — caller must fail closed.
 *
 * Stored shape (JSON-stringified in social_settings.value):
 *   { "workspace_id": "...", "accounts": { "instagram": {"id":"...","network":"instagram"}, ... } }
 *
 * This replaces the old hardcoded PLATFORM_ACCOUNTS map that pointed every tenant
 * at Adam's personal Publer workspace (security audit S-2, 2026-04-05).
 */
async function loadPublerConfig(
  supabase: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  organizationId: string
): Promise<PublerConfig | null> {
  const { data } = await supabase
    .from('social_settings')
    .select('value')
    .eq('organization_id', organizationId)
    .eq('key', 'publer_config')
    .maybeSingle()

  if (!data?.value) return null
  try {
    const parsed = JSON.parse(data.value) as PublerConfig
    if (!parsed?.workspace_id || !parsed?.accounts) return null
    return parsed
  } catch {
    return null
  }
}

/** Recursively walk a Publer job payload looking for post IDs.
 *  Publer's payload shape varies across API versions:
 *    - { posts: [{ id: "..." }, ...] }
 *    - { successes: [{ id: "..." }, ...] }
 *    - { successes: ["id1", "id2"] }
 *    - { ids: ["id1", "id2"] }
 *  We pattern-match all known shapes and fall back to a flat regex scan
 *  for 24-char hex ObjectIds (Publer's ID format) as a last resort.
 *
 *  Returns an empty array if nothing resembling a post ID is found — the caller
 *  treats that as a silent failure per Bug #5. */
function extractPublerPostIds(payload: unknown): string[] {
  if (!payload || typeof payload !== 'object') return []
  const p = payload as Record<string, unknown>
  const candidates = [p.posts, p.successes, p.ids, p.success]
  for (const c of candidates) {
    if (!Array.isArray(c)) continue
    const ids = c
      .map((item) => (typeof item === 'string' ? item : (item as { id?: unknown })?.id))
      .filter((id): id is string => typeof id === 'string' && id.length > 0)
    if (ids.length > 0) return ids
  }
  // Fallback: scan for any 24-char hex strings (Publer/Mongo ObjectId format)
  const flat = JSON.stringify(payload)
  const matches = flat.match(/"([a-f0-9]{24})"/g)
  if (matches) {
    return Array.from(new Set(matches.map((m) => m.replace(/"/g, ''))))
  }
  return []
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
    const { draftId, mode: rawMode } = await req.json()
    if (!draftId) {
      return NextResponse.json({ error: 'draftId required' }, { status: 400 })
    }
    // mode controls whether we publish immediately (2 min from now) or honor draft.scheduled_for.
    // Default = 'scheduled' for backwards compatibility with any non-dashboard callers (n8n, agent-secret routes).
    // The dashboard always passes mode explicitly.
    const mode: 'now' | 'scheduled' = rawMode === 'now' ? 'now' : 'scheduled'

    const supabase = createServiceClient() as any // eslint-disable-line @typescript-eslint/no-explicit-any

    // Load per-org Publer config — fail closed if tenant hasn't set up Publer.
    // Replaces hardcoded account IDs that used to point every tenant at Adam's workspace.
    const publerConfig = await loadPublerConfig(supabase, organizationId)
    if (!publerConfig) {
      return NextResponse.json(
        {
          error: 'Publer not configured for this organization',
          detail: 'Add your Publer workspace ID and social account IDs in Settings → Integrations before publishing.',
        },
        { status: 400 }
      )
    }
    const PUBLER_WORKSPACE = publerConfig.workspace_id
    const PLATFORM_ACCOUNTS = publerConfig.accounts
    // Prefer per-tenant API key from publer_config; fall back to global env var for legacy single-tenant.
    // Fail closed if neither is set — no point continuing without a key.
    const PUBLER_API_KEY = publerConfig.api_key?.trim() || PUBLER_API_KEY_ENV
    if (!PUBLER_API_KEY) {
      return NextResponse.json(
        {
          error: 'Publer API key not configured',
          detail: 'Add your Publer API key in Settings → Integrations → Social Publishing, or set PUBLER_API_KEY env var.',
        },
        { status: 400 }
      )
    }

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

    // Determine which Publer accounts to post to — filter out platforms the org hasn't connected.
    const platformKey = draft.platform as 'instagram' | 'linkedin' | 'facebook' | 'google' | 'all'
    const targets: PublerAccount[] = platformKey === 'all'
      ? (['instagram', 'linkedin', 'facebook', 'google'] as const)
          .map((k) => PLATFORM_ACCOUNTS[k])
          .filter((a): a is PublerAccount => !!a?.id)
      : PLATFORM_ACCOUNTS[platformKey]?.id
        ? [PLATFORM_ACCOUNTS[platformKey] as PublerAccount]
        : []

    if (targets.length === 0) {
      return NextResponse.json(
        { error: `No Publer account configured for platform "${draft.platform}"` },
        { status: 400 }
      )
    }

    // Bug #4 guard: refuse to schedule a media-required post with no media attached.
    // Meta silently rejects text-only Stories/Reels/Carousels/Images at post time, and
    // Instagram rejects ALL text-only posts. Fail fast here rather than find out weeks later
    // that a scheduled post never actually made it to the platform.
    const hasMedia = Array.isArray(draft.media_urls) && draft.media_urls.length > 0
    const rawFormat = (draft.format || '').toLowerCase()
    const isTextOnly = rawFormat === 'text_only' || rawFormat === 'text'
    const targetsInstagram = targets.some((t) => t.network === 'instagram')
    if (!hasMedia) {
      if (!isTextOnly) {
        return NextResponse.json(
          {
            error: `Cannot publish: format "${draft.format}" requires media but no media is attached to this draft.`,
            detail: 'Upload an image or video, or switch the format to Text Only.',
          },
          { status: 400 }
        )
      }
      if (targetsInstagram) {
        return NextResponse.json(
          {
            error: 'Cannot publish to Instagram: Instagram does not allow text-only posts.',
            detail: 'Add media or remove Instagram from the post targets.',
          },
          { status: 400 }
        )
      }
    }

    // Publer v1 requires: bulk.posts[].networks + bulk.posts[].accounts
    // Each network key = provider name (facebook, instagram, linkedin)
    // Each account = { id, scheduled_at }
    //
    // Resolve scheduledAt based on mode:
    //   'now'       → 2 minutes from now (Publer has no "immediate" state; 2 min is the de-facto now)
    //   'scheduled' → draft.scheduled_for, which must exist and be in the future
    let scheduledAt: string
    if (mode === 'now') {
      scheduledAt = new Date(Date.now() + 2 * 60_000).toISOString()
    } else {
      if (!draft.scheduled_for) {
        return NextResponse.json(
          { error: 'Cannot schedule: draft has no scheduled_for date. Use mode:"now" to publish immediately.' },
          { status: 400 }
        )
      }
      const ts = new Date(draft.scheduled_for).getTime()
      if (!Number.isFinite(ts) || ts <= Date.now()) {
        return NextResponse.json(
          { error: 'Cannot schedule: scheduled_for is in the past. Use mode:"now" to publish immediately.' },
          { status: 400 }
        )
      }
      scheduledAt = draft.scheduled_for
    }

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
        const ext = fileName.split('.').pop()?.toLowerCase() || ''
        const isVideo = ['mp4', 'mov', 'webm', 'avi', 'mkv', 'm4v'].includes(ext)
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

        // Step 3: Poll for media upload completion (photos ~10s, videos up to ~60s)
        const maxAttempts = isVideo ? 30 : 15
        let mediaId: string | null = null
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
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
          uploadedMedia.push({ id: mediaId, type: isVideo ? 'video' : 'photo' })
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
    // Determine post type from media: video > photo > status
    const postType = mediaIds
      ? (mediaIds.some(m => m.type === 'video') ? 'video' : 'photo')
      : 'status'

    const networks: Record<string, { type: string; text: string; media?: { id: string; type: string }[] }> = {}
    for (const t of targets) {
      const networkEntry: { type: string; text: string; media?: { id: string; type: string }[] } = {
        type: postType,
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

    // Poll Publer job status to confirm scheduling succeeded (max 20s).
    // Bug #5 fix: don't trust `status: 'complete'` alone — also verify Publer returned
    // actual post IDs in the payload. A complete job with zero successes is a silent
    // failure and should be reported to the user, not swallowed as success.
    let publerFailures: unknown = null
    let publerPostIds: string[] = []
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
          if (jobData.payload?.failures && Object.keys(jobData.payload.failures).length > 0) {
            publerFailures = jobData.payload.failures
            console.error('[social/publish] Publer scheduling failures:', JSON.stringify(publerFailures).substring(0, 500))
          }
          // Extract post IDs from payload. Publer's API has shifted shapes over time, so try
          // multiple known locations: payload.posts, payload.successes, payload.ids.
          publerPostIds = extractPublerPostIds(jobData.payload)
          console.log('[social/publish] Extracted Publer post IDs:', publerPostIds)
          break
        } else if (jobData.status === 'failed') {
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

    // Bug #5: complete-but-empty is a silent failure. Report it instead of marking success.
    // Only enforce when we have a job ID to poll — if Publer skipped the job flow entirely
    // (older API behavior), fall through and trust the 200 from /posts/schedule.
    if (publerJobId && publerPostIds.length === 0) {
      console.error('[social/publish] Publer returned complete with no post IDs — silent failure')
      return NextResponse.json(
        {
          error: 'Publer accepted the request but returned no post IDs',
          detail: 'This usually means the post was rejected silently (bad media, missing caption, account disconnected). Check Publer directly.',
          jobId: publerJobId,
        },
        { status: 502 }
      )
    }

    // Update draft status based on mode:
    //   'now'       → 'posted' (fires in ~2 min; UX-wise users think of this as done)
    //   'scheduled' → 'scheduled' (sitting in Publer's queue until scheduled_for)
    // Store the first real Publer post ID — prefer it over the job ID so the column lives up
    // to its name and so we can later build "view in Publer" deeplinks. Fall back to the job
    // ID if post-ID extraction came up empty (older API behavior).
    const { error: updateError } = await supabase
      .from('social_drafts')
      .update({
        status: mode === 'now' ? 'posted' : 'scheduled',
        publer_post_id: publerPostIds[0] || publerJobId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', draftId)

    if (updateError) {
      console.error('[social/publish] Failed to update draft status:', updateError)
      return NextResponse.json({ error: 'Failed to update draft status' }, { status: 500 })
    }

    // Log activity — tell the truth about whether we posted now or queued for later
    const scheduledDateLabel = new Date(scheduledAt).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    })
    const { error: activityError } = await supabase
      .from('social_activity')
      .insert({
        organization_id: organizationId,
        action: mode === 'now' ? 'posted' : 'scheduled',
        detail: mode === 'now'
          ? `Published "${draft.title}" to Publer (${draft.platform})`
          : `Scheduled "${draft.title}" for ${scheduledDateLabel} to Publer (${draft.platform})`,
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
        google: 'Google',
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

    return NextResponse.json({ success: true, publerJobId, publerPostIds })
  } catch (error) {
    console.error('[social/publish] POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
