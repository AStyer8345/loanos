/**
 * Initiates Microsoft OAuth.
 *
 * Logged-in user clicks "Connect Microsoft" in Settings -> hits this route
 * -> we generate a CSRF-safe state token bound to their org -> redirect to
 * Microsoft's authorize endpoint -> they consent -> Microsoft redirects to
 * /api/auth/microsoft/callback with the code + state.
 *
 * State binding: HMAC-signed payload of {orgId, userId, nonce, ts}. We
 * verify the signature in the callback so a leaked state value can't be
 * replayed against a different org.
 */

import { NextResponse } from 'next/server'
import { createHmac, randomBytes } from 'crypto'
import { getOrganization } from '@/lib/getOrganization'
import { MS_OAUTH_SCOPES } from '@/lib/microsoft/graph'

const AUTHORIZE_ENDPOINT = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize'

function getRedirectUri(): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://loanos.vercel.app'
  return `${base}/api/auth/microsoft/callback`
}

function signState(payload: object): string {
  const secret = process.env.MICROSOFT_CLIENT_SECRET
  if (!secret) throw new Error('MICROSOFT_CLIENT_SECRET not set')
  const json = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = createHmac('sha256', secret).update(json).digest('base64url')
  return `${json}.${sig}`
}

export async function GET(): Promise<NextResponse> {
  let ctx
  try {
    ctx = await getOrganization()
  } catch {
    return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL ?? 'https://loanos.vercel.app'))
  }

  const clientId = process.env.MICROSOFT_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: 'MICROSOFT_CLIENT_ID not set' }, { status: 500 })
  }

  const state = signState({
    o: ctx.organizationId,
    u: ctx.userId,
    n: randomBytes(8).toString('hex'),
    t: Date.now(),
  })

  const url = new URL(AUTHORIZE_ENDPOINT)
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('redirect_uri', getRedirectUri())
  url.searchParams.set('response_mode', 'query')
  url.searchParams.set('scope', MS_OAUTH_SCOPES.join(' '))
  url.searchParams.set('state', state)
  url.searchParams.set('prompt', 'select_account')

  return NextResponse.redirect(url.toString())
}
