/**
 * /api/marketing/newsletter
 *
 * Same-origin proxy to https://styermortgage.com/.netlify/functions/generate-newsletter.
 *
 * Why: calling the Netlify function directly from the browser requires a CSP
 * connect-src exception (cross-origin) and is fragile when CSP changes.
 * Proxying through this route means:
 *   - Browser fetch stays same-origin → no CSP allowance, no CORS.
 *   - Server-to-server call has no browser-imposed latency tolerance issues.
 *   - We can add auth/rate-limiting/logging here without touching the client.
 *
 * Body is forwarded untouched to the Netlify function. Response is forwarded
 * untouched back to the caller. Auth: session cookie (anyone who can see
 * the Marketing tab can trigger this).
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const NETLIFY_URL = 'https://styermortgage.com/.netlify/functions/generate-newsletter'

export const runtime = 'nodejs'
// Vercel Pro plans allow up to 300s; default is 10s. Preview ~22s,
// publish ~40-60s, so we need to raise this. Value is capped by plan.
export const maxDuration = 60

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  try {
    const upstream = await fetch(NETLIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const text = await upstream.text()
    return new NextResponse(text, {
      status: upstream.status,
      headers: { 'Content-Type': upstream.headers.get('Content-Type') ?? 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Upstream fetch failed: ${message}` }, { status: 502 })
  }
}
