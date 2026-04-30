/**
 * src/lib/microsoft/graph.ts
 *
 * Microsoft Graph send adapter — replaces sendViaResend for orgs that have
 * connected their M365 mailbox via OAuth. Tokens are stored encrypted in
 * org_settings. Access tokens last 1 hour; we proactively refresh when the
 * stored token is within 60 seconds of expiry.
 *
 * The Graph /me/sendMail endpoint sends from the authenticated user's
 * mailbox and lands the message in their real Sent folder. From: is fixed
 * to the mailbox owner — display name override is honored, address is not.
 */

import { createServiceClient } from '@/lib/supabase/service'
import {
  encryptTokens,
  decryptTokens,
  type MicrosoftTokens,
  type EncryptedTokenBlob,
} from './encryptToken'

const TOKEN_ENDPOINT = 'https://login.microsoftonline.com/common/oauth2/v2.0/token'
const GRAPH_BASE = 'https://graph.microsoft.com/v1.0'
const REFRESH_BUFFER_MS = 60_000

export const MS_OAUTH_SCOPES = [
  'offline_access',
  'https://graph.microsoft.com/Mail.Send',
  'https://graph.microsoft.com/User.Read',
]

interface OrgTokenRow {
  ms_graph_email: string | null
  ms_graph_token_ciphertext: string | null
  ms_graph_token_iv: string | null
  ms_graph_token_auth_tag: string | null
  ms_graph_token_expires_at: string | null
}

/**
 * Returns a fresh, valid access token for the given org. Refreshes
 * transparently if the stored token is expired or near expiry.
 * Throws if the org isn't connected to Microsoft.
 */
export async function getValidAccessToken(orgId: string): Promise<{
  accessToken: string
  email: string
}> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('org_settings')
    .select('ms_graph_email, ms_graph_token_ciphertext, ms_graph_token_iv, ms_graph_token_auth_tag, ms_graph_token_expires_at')
    .eq('organization_id', orgId)
    .maybeSingle()

  if (error) throw new Error(`org_settings lookup failed: ${error.message}`)
  const row = data as OrgTokenRow | null
  if (!row?.ms_graph_token_ciphertext || !row.ms_graph_token_iv || !row.ms_graph_token_auth_tag || !row.ms_graph_email) {
    throw new Error(`org ${orgId} has no Microsoft Graph tokens stored`)
  }

  const tokens = decryptTokens({
    ciphertext: row.ms_graph_token_ciphertext,
    iv: row.ms_graph_token_iv,
    auth_tag: row.ms_graph_token_auth_tag,
  })

  const expiresAt = row.ms_graph_token_expires_at ? new Date(row.ms_graph_token_expires_at).getTime() : 0
  const now = Date.now()
  if (expiresAt - now > REFRESH_BUFFER_MS) {
    return { accessToken: tokens.access_token, email: row.ms_graph_email }
  }

  const refreshed = await refreshAccessToken(tokens.refresh_token)
  await persistTokens(orgId, refreshed)
  return { accessToken: refreshed.access_token, email: row.ms_graph_email }
}

interface TokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  scope: string
  token_type: string
}

export async function exchangeCodeForTokens(code: string, redirectUri: string): Promise<TokenResponse> {
  const clientId = requireEnv('MICROSOFT_CLIENT_ID')
  const clientSecret = requireEnv('MICROSOFT_CLIENT_SECRET')

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
    scope: MS_OAUTH_SCOPES.join(' '),
  })

  const res = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Token exchange failed (${res.status}): ${text}`)
  }
  return (await res.json()) as TokenResponse
}

async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const clientId = requireEnv('MICROSOFT_CLIENT_ID')
  const clientSecret = requireEnv('MICROSOFT_CLIENT_SECRET')

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
    scope: MS_OAUTH_SCOPES.join(' '),
  })

  const res = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Token refresh failed (${res.status}): ${text}`)
  }
  return (await res.json()) as TokenResponse
}

export async function persistTokens(orgId: string, tokens: TokenResponse): Promise<void> {
  const supabase = createServiceClient()
  const blob: EncryptedTokenBlob = encryptTokens({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    scope: tokens.scope,
  } as MicrosoftTokens)
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()
  const { error } = await supabase
    .from('org_settings')
    .update({
      ms_graph_token_ciphertext: blob.ciphertext,
      ms_graph_token_iv: blob.iv,
      ms_graph_token_auth_tag: blob.auth_tag,
      ms_graph_token_expires_at: expiresAt,
    })
    .eq('organization_id', orgId)
  if (error) throw new Error(`token persist failed: ${error.message}`)
}

export async function fetchUserEmail(accessToken: string): Promise<string> {
  const res = await fetch(`${GRAPH_BASE}/me`, {
    headers: { authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Graph /me failed (${res.status}): ${text}`)
  }
  const me = (await res.json()) as { mail?: string; userPrincipalName?: string }
  return me.mail || me.userPrincipalName || ''
}

interface GraphSendParams {
  orgId: string
  to: string
  subject: string
  body: string
  fromName?: string
  replyTo?: string
}

/**
 * Sends an email via Microsoft Graph /me/sendMail using the org's stored
 * OAuth tokens. The mail lands in the user's real Sent folder. Returns
 * 'graph:<orgId>:<timestamp>' as a synthetic id since Graph doesn't return
 * a message ID for sendMail (it's fire-and-forget at the API level).
 */
export async function sendViaMicrosoftGraph(params: GraphSendParams): Promise<string> {
  const { accessToken } = await getValidAccessToken(params.orgId)

  const message: Record<string, unknown> = {
    subject: params.subject,
    body: { contentType: 'HTML', content: params.body },
    toRecipients: [{ emailAddress: { address: params.to } }],
  }
  if (params.replyTo) {
    message.replyTo = [{ emailAddress: { address: params.replyTo } }]
  }
  if (params.fromName) {
    // Graph honors the displayName on the from field IF it matches the
    // mailbox owner. Setting a different address is rejected.
    message.from = { emailAddress: { name: params.fromName } }
  }

  const res = await fetch(`${GRAPH_BASE}/me/sendMail`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ message, saveToSentItems: true }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Graph sendMail failed (${res.status}): ${text}`)
  }
  return `graph:${params.orgId}:${Date.now()}`
}

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`${name} env var not set`)
  return v
}
