/**
 * src/lib/los/subscribeLosEvents.ts
 *
 * Registers a webhook subscription with Arive for a given org. Called
 * during LO onboarding (after the LO saves their Arive credentials in
 * LoanOS settings).
 *
 * Arive endpoint: POST /api/hooks/subscribe
 *   Body: { url, events: [...] }
 *   Auth: Bearer token (same OAuth flow as fetchLoanById) + X-API-KEY
 *
 * Event list (all except LEAD_* per Adam's 2026-04-05 decision):
 *   LOAN_CREATED, LOAN_ARCHIVED, LOAN_STAGE_CHANGED, LOAN_DATE_CHANGED,
 *   LOAN_TRACKERS_UPDATED, LOAN_APP_SUBMITTED
 *
 * LEAD_CREATED and LEAD_UPDATED are intentionally excluded — LoanOS treats
 * leads as its own domain (web-lead form → contacts) and doesn't want
 * Arive's lead model bleeding in.
 */

import type { AriveCredentials } from './encryptCredentials'

const ARIVE_BASE_URL = process.env.ARIVE_API_BASE_URL ?? 'https://api.arive.com'

export const DEFAULT_ARIVE_EVENTS = [
  'LOAN_CREATED',
  'LOAN_ARCHIVED',
  'LOAN_STAGE_CHANGED',
  'LOAN_DATE_CHANGED',
  'LOAN_TRACKERS_UPDATED',
  'LOAN_APP_SUBMITTED',
] as const

export type AriveEvent = (typeof DEFAULT_ARIVE_EVENTS)[number]

/**
 * Subscribes Arive to fire webhooks at the given LoanOS URL for the given
 * events. Safe to call multiple times — Arive dedupes by url+event.
 *
 * @param creds     Decrypted Arive credentials for this org
 * @param token     Pre-fetched Arive bearer token (reuse from ariveClient)
 * @param webhookUrl  Fully-qualified LoanOS URL: https://loanos.com/api/webhooks/los/arive/[slug]
 * @param events    Which events to subscribe to (defaults to all non-LEAD)
 */
export async function subscribeAriveWebhook(
  creds: AriveCredentials,
  token: string,
  webhookUrl: string,
  events: readonly AriveEvent[] = DEFAULT_ARIVE_EVENTS
): Promise<void> {
  const res = await fetch(`${ARIVE_BASE_URL}/api/hooks/subscribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'X-API-KEY': creds.apiKey,
    },
    body: JSON.stringify({
      url: webhookUrl,
      events,
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Arive webhook subscribe failed: ${res.status} ${text.slice(0, 200)}`)
  }
}
