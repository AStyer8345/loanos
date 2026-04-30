/**
 * Microsoft OAuth callback. Validates the signed state, exchanges the code
 * for tokens, fetches the user's mailbox address, and stores everything
 * encrypted in org_settings. Flips email_provider to 'microsoft' so future
 * sendEmail() calls route through Graph instead of Resend.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { createServiceClient } from '@/lib/supabase/service'
import {
  exchangeCodeForTokens,
  fetchUserEmail,
  persistTokens,
} from '@/lib/microsoft/graph'

const STATE_TTL_MS = 10 * 60 * 1000 // 10 minutes

function getRedirectUri(): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://loanos.vercel.app'
  return `${base}/api/auth/microsoft/callback`
}

function settingsUrl(qs: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://loanos.vercel.app'
  return `${base}/dashboard/settings?${qs}`
}

interface StatePayload {
  o: string  // orgId
  u: string  // userId
  n: string  // nonce
  t: number  // ts
}

function verifyState(state: string): StatePayload | null {
  const secret = process.env.MICROSOFT_CLIENT_SECRET
  if (!secret) return null
  const [json, sig] = state.split('.')
  if (!json || !sig) return null
  const expected = createHmac('sha256', secret).update(json).digest('base64url')
  const sigBuf = Buffer.from(sig)
  const expBuf = Buffer.from(expected)
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) return null
  try {
    const payload = JSON.parse(Buffer.from(json, 'base64url').toString('utf8')) as StatePayload
    if (Date.now() - payload.t > STATE_TTL_MS) return null
    return payload
  } catch {
    return null
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const errorParam = url.searchParams.get('error')

  if (errorParam) {
    const desc = url.searchParams.get('error_description') ?? errorParam
    console.error('[ms-callback] OAuth error:', errorParam, desc)
    return NextResponse.redirect(settingsUrl(`ms_error=${encodeURIComponent(errorParam)}`))
  }

  if (!code || !state) {
    return NextResponse.redirect(settingsUrl('ms_error=missing_params'))
  }

  const payload = verifyState(state)
  if (!payload) {
    console.error('[ms-callback] state verification failed')
    return NextResponse.redirect(settingsUrl('ms_error=invalid_state'))
  }

  try {
    const tokens = await exchangeCodeForTokens(code, getRedirectUri())
    const email = await fetchUserEmail(tokens.access_token)

    const supabase = createServiceClient()
    const { error: upsertErr } = await supabase
      .from('org_settings')
      .upsert(
        {
          organization_id: payload.o,
          email_provider: 'microsoft',
          ms_graph_email: email,
          ms_graph_connected_at: new Date().toISOString(),
        },
        { onConflict: 'organization_id' }
      )
    if (upsertErr) throw new Error(`org_settings upsert failed: ${upsertErr.message}`)

    await persistTokens(payload.o, tokens)

    console.log(`[ms-callback] connected org=${payload.o} email=${email}`)
    return NextResponse.redirect(settingsUrl(`ms_connected=1&email=${encodeURIComponent(email)}`))
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown'
    console.error('[ms-callback] exchange/persist failed:', message)
    return NextResponse.redirect(settingsUrl(`ms_error=${encodeURIComponent('exchange_failed')}`))
  }
}
