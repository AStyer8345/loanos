import { NextRequest, NextResponse } from 'next/server'
import { getOrganization } from '@/lib/getOrganization'
import { checkRateLimit } from '@/lib/rateLimit'

// Server-side proxy for n8n webhook calls. The browser posts same-origin to
// this route and we forward to n8n. This avoids cross-origin failures (CORS,
// TLS quirks, Cloudflare upload stalls) that surfaced as "Failed to fetch" in
// the UI when the client hit styer.app.n8n.cloud directly, especially for
// multipart PDF uploads.
const N8N_BASE =
  process.env.N8N_WEBHOOK_BASE ||
  process.env.N8N_WEBHOOK_BASE_URL ||
  process.env.NEXT_PUBLIC_N8N_WEBHOOK_BASE ||
  ''

// Allowlist of webhook paths the proxy will forward to. Keeps this endpoint
// from becoming an open relay to arbitrary n8n paths.
const ALLOWED_PATHS = new Set([
  'loanos-contract-received',
  'loanos-new-application',
  'loanos-final-cd',
  'loanos-referral-intro',
  'loanos-pre-approval',
  'loanos-refi-intake',
  'loanos-review-request',
  'loanos-website-lead',
])

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  let userId: string
  try {
    const ctx = await getOrganization()
    userId = ctx.userId
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { allowed } = checkRateLimit(`n8n-proxy:${userId}`, 30, 60_000)
  if (!allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  if (!N8N_BASE) {
    return NextResponse.json(
      { error: 'N8N_WEBHOOK_BASE is not configured for this deployment' },
      { status: 500 }
    )
  }

  const url = new URL(req.url)
  const path = url.searchParams.get('path') || ''
  if (!ALLOWED_PATHS.has(path)) {
    return NextResponse.json({ error: `Webhook path not allowed: ${path}` }, { status: 400 })
  }

  const target = `${N8N_BASE}/${path}`
  const contentType = req.headers.get('content-type') || ''

  try {
    let upstream: Response
    if (contentType.includes('multipart/form-data')) {
      // Re-build FormData server-side so Node sets a fresh boundary header.
      const incoming = await req.formData()
      const fd = new FormData()
      for (const [key, value] of incoming.entries()) {
        fd.append(key, value as Blob | string)
      }
      upstream = await fetch(target, { method: 'POST', body: fd })
    } else {
      const body = await req.text()
      upstream = await fetch(target, {
        method: 'POST',
        headers: { 'Content-Type': contentType || 'application/json' },
        body,
      })
    }

    const respText = await upstream.text()
    const respContentType = upstream.headers.get('content-type') || 'application/json'
    return new NextResponse(respText, {
      status: upstream.status,
      headers: { 'Content-Type': respContentType },
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    console.error('[n8n-proxy]', path, msg)
    return NextResponse.json(
      { error: `Failed to reach n8n: ${msg}` },
      { status: 502 }
    )
  }
}
