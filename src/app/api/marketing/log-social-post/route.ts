import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL             = process.env.SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const AGENT_SECRET             = process.env.LOANOS_AGENT_SECRET
const SYSTEM_USER_ID           = process.env.LOANOS_SYSTEM_USER_ID

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7) }

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-webhook-secret')
  if (AGENT_SECRET && secret !== AGENT_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!SYSTEM_USER_ID) {
    return NextResponse.json({ error: 'LOANOS_SYSTEM_USER_ID not configured' }, { status: 500 })
  }

  const body = await req.json().catch(() => ({})) as Record<string, string>
  const { platform, caption, url, date, notes } = body

  if (!caption) {
    return NextResponse.json({ error: 'caption required' }, { status: 400 })
  }

  const sbHeaders = {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
  }

  // Fetch current mcc_state
  const getRes = await fetch(
    `${SUPABASE_URL}/rest/v1/mcc_state?user_id=eq.${SYSTEM_USER_ID}&key=eq.mcc&select=value`,
    { headers: sbHeaders }
  )
  const rows = await getRes.json() as Array<{ value: Record<string, unknown> }>
  const current = rows[0]?.value ?? {}
  const socialPosts = (current.socialPosts as unknown[]) ?? []
  const last        = (current.last as Record<string, string>) ?? {}

  const newPost = {
    id:       uid(),
    platform: platform ?? 'All Platforms',
    caption,
    url:      url   ?? '',
    date:     date  ?? new Date().toISOString().slice(0, 10),
    notes:    notes ?? 'Auto-posted via weekly n8n workflow',
  }

  const updatedValue = {
    ...current,
    socialPosts: [...socialPosts, newPost],
    last: { ...last, 'social-post': new Date().toISOString() },
  }

  await fetch(`${SUPABASE_URL}/rest/v1/mcc_state`, {
    method:  'POST',
    headers: { ...sbHeaders, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' },
    body:    JSON.stringify({ user_id: SYSTEM_USER_ID, key: 'mcc', value: updatedValue }),
  })

  return NextResponse.json({ ok: true, post: newPost })
}
