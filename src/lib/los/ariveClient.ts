/**
 * src/lib/los/ariveClient.ts
 *
 * Thin wrapper around Arive's REST API. Handles:
 *   1. OAuth login (POST /api/auth/login) → short-lived bearer token
 *   2. fetchLoanById (GET /api/loans/{id}) with the bearer + X-API-KEY header
 *
 * Arive's OAuth is a client-credentials flow that requires FIVE things:
 *   - clientId     (per-LO, from Arive admin → API Integrations)
 *   - secretKey    (per-LO, from Arive admin → API Integrations)
 *   - apiKey       (per-LO, sent as X-API-KEY header on every call)
 *   - appId        (per-INTEGRATION, issued by Arive to LoanOS as a partner)
 *   - appSecretHash(per-INTEGRATION, issued by Arive to LoanOS as a partner)
 *
 * The appId / appSecretHash are SHARED across all LoanOS tenants — they
 * identify LoanOS itself to Arive, not any individual LO. They go in env
 * vars. The per-LO values live encrypted in los_integrations.
 *
 * ⚠️ BLOCKER: As of 2026-04-05 we don't know if Arive issues appId /
 * appSecretHash to third-party integrators. If they don't, we'll need to
 * ask Adam to contact Arive support for integration-partner onboarding
 * before this code can run in production. For now it throws a loud error
 * at first use so nothing silently half-works.
 *
 * Token caching:
 *   In-memory LRU keyed on clientId. Arive tokens typically live 1 hour.
 *   We refresh at 50-min mark. Cache is per-process (Vercel lambdas share
 *   memory across invocations within the same warm container).
 */

import type { AriveCredentials } from './encryptCredentials'

const ARIVE_BASE_URL = process.env.ARIVE_API_BASE_URL ?? 'https://api.arive.com'
const TOKEN_TTL_MS = 50 * 60 * 1000 // refresh 10min before expiry

interface CachedToken {
  token: string
  expiresAt: number
}

// Keyed on clientId. Lives for the container lifetime.
const tokenCache = new Map<string, CachedToken>()

function getAppCreds(): { appId: string; appSecretHash: string } {
  const appId = process.env.ARIVE_APP_ID
  const appSecretHash = process.env.ARIVE_APP_SECRET_HASH
  if (!appId || !appSecretHash) {
    throw new Error(
      'ARIVE_APP_ID and ARIVE_APP_SECRET_HASH env vars are required for Arive OAuth. ' +
        'These are issued by Arive to LoanOS as an integration partner. ' +
        'Contact Arive support if not yet provisioned.'
    )
  }
  return { appId, appSecretHash }
}

/**
 * Exchanges per-LO credentials for an Arive bearer token.
 * Caches by clientId to avoid hammering the login endpoint.
 */
async function getAccessToken(creds: AriveCredentials): Promise<string> {
  const cached = tokenCache.get(creds.clientId)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.token
  }

  const { appId, appSecretHash } = getAppCreds()

  const res = await fetch(`${ARIVE_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': creds.apiKey,
    },
    body: JSON.stringify({
      clientId: creds.clientId,
      secretKey: creds.secretKey,
      appId,
      appSecretHash,
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Arive OAuth login failed: ${res.status} ${text.slice(0, 200)}`)
  }

  const data = (await res.json()) as { accessToken?: string; token?: string }
  const token = data.accessToken ?? data.token
  if (!token) {
    throw new Error('Arive OAuth response missing accessToken/token field')
  }

  tokenCache.set(creds.clientId, { token, expiresAt: Date.now() + TOKEN_TTL_MS })
  return token
}

/**
 * Fetches a full loan object from Arive by its loanId.
 * Shape matches what processAriveWebhook() already expects (same fields
 * Arive was previously sending via Zapier).
 */
export async function fetchLoanById(
  creds: AriveCredentials,
  loanId: string
): Promise<Record<string, unknown>> {
  const token = await getAccessToken(creds)

  const res = await fetch(`${ARIVE_BASE_URL}/api/loans/${encodeURIComponent(loanId)}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'X-API-KEY': creds.apiKey,
      Accept: 'application/json',
    },
  })

  if (res.status === 401) {
    // Token may have expired mid-request. Bust cache and retry once.
    tokenCache.delete(creds.clientId)
    const retryToken = await getAccessToken(creds)
    const retry = await fetch(`${ARIVE_BASE_URL}/api/loans/${encodeURIComponent(loanId)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${retryToken}`,
        'X-API-KEY': creds.apiKey,
        Accept: 'application/json',
      },
    })
    if (!retry.ok) {
      const text = await retry.text().catch(() => '')
      throw new Error(`Arive fetchLoanById failed after retry: ${retry.status} ${text.slice(0, 200)}`)
    }
    return (await retry.json()) as Record<string, unknown>
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Arive fetchLoanById failed: ${res.status} ${text.slice(0, 200)}`)
  }

  return (await res.json()) as Record<string, unknown>
}
