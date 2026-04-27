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
    } else if (contentType.includes('application/json')) {
      const text = await req.text()
      let parsed: Record<string, unknown> | null = null
      try {
        const j = JSON.parse(text)
        if (j && typeof j === 'object' && !Array.isArray(j)) parsed = j as Record<string, unknown>
      } catch {
        // not JSON-parseable; fall through to plain forward
      }

      if (parsed && typeof parsed.file_url === 'string') {
        // PDF-via-URL path: client uploaded the file to Supabase Storage to
        // sidestep Vercel's 4.5MB ingress limit, then sent us the signed URL.
        // Fetch it here and forward to n8n as the same multipart shape it has
        // always received (binary `file` + `loan_context` JSON string).
        const supabaseBase = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
        let allowedHost: string | null = null
        try { allowedHost = supabaseBase ? new URL(supabaseBase).host : null } catch { allowedHost = null }
        let fileUrlParsed: URL
        try { fileUrlParsed = new URL(parsed.file_url) } catch {
          return NextResponse.json({ error: 'Invalid file_url' }, { status: 400 })
        }
        if (!allowedHost || fileUrlParsed.host !== allowedHost) {
          return NextResponse.json({ error: 'file_url host not allowed' }, { status: 400 })
        }

        const fileRes = await fetch(parsed.file_url)
        if (!fileRes.ok) {
          return NextResponse.json(
            { error: `Failed to fetch uploaded file: ${fileRes.status}` },
            { status: 502 }
          )
        }
        const fileBlob = await fileRes.blob()
        const fileName = typeof parsed.file_name === 'string' ? parsed.file_name : 'upload.pdf'
        const loanContext: Record<string, unknown> = {}
        for (const [k, v] of Object.entries(parsed)) {
          if (k !== 'file_url' && k !== 'file_name') loanContext[k] = v
        }

        const fd = new FormData()
        fd.append('file', fileBlob, fileName)
        fd.append('loan_context', JSON.stringify(loanContext))
        upstream = await fetch(target, { method: 'POST', body: fd })
      } else {
        upstream = await fetch(target, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: text,
        })
      }
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
