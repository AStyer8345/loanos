/**
 * src/lib/email/sendEmail.ts
 *
 * Provider-aware send. Looks up org_settings.email_provider, dispatches to
 * the right adapter. Falls back to Resend if no provider set or if Microsoft
 * Graph fails (e.g. token revoked, 401 mid-cron).
 *
 * Drip cron + transactional senders should call this instead of sendViaResend
 * directly. Existing direct sendViaResend call sites still work — this is
 * additive.
 */

import { createServiceClient } from '@/lib/supabase/service'
import { sendViaResend, type ResendLogContext } from '@/lib/resend/send'
import { sendViaMicrosoftGraph } from '@/lib/microsoft/graph'

export interface SendEmailParams {
  orgId: string
  to: string
  subject: string
  body: string             // HTML
  tags?: Record<string, string>
  log?: ResendLogContext   // currently only used by Resend; Graph logs separately
}

interface OrgSendingPrefs {
  email_provider: 'resend' | 'microsoft' | 'google' | null
  from_email: string | null
  from_name: string | null
  custom_email_reply_to: string | null
  ms_graph_email: string | null
}

async function getOrgSendingPrefs(orgId: string): Promise<OrgSendingPrefs> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('org_settings')
    .select('email_provider, from_email, from_name, custom_email_reply_to, ms_graph_email')
    .eq('organization_id', orgId)
    .maybeSingle()
  return (data ?? {
    email_provider: null,
    from_email: null,
    from_name: null,
    custom_email_reply_to: null,
    ms_graph_email: null,
  }) as OrgSendingPrefs
}

/**
 * Per-org cache for the duration of a single cron tick / API request.
 * Mirrors the pattern in /api/drip/run. Caller-supplied to avoid a
 * fresh Supabase round-trip on every send within a batch.
 */
export type OrgPrefsCache = Map<string, OrgSendingPrefs>

export async function sendEmail(
  params: SendEmailParams,
  cache?: OrgPrefsCache
): Promise<string> {
  let prefs = cache?.get(params.orgId)
  if (!prefs) {
    prefs = await getOrgSendingPrefs(params.orgId)
    cache?.set(params.orgId, prefs)
  }

  const replyTo = prefs.custom_email_reply_to ?? undefined

  if (prefs.email_provider === 'microsoft' && prefs.ms_graph_email) {
    try {
      return await sendViaMicrosoftGraph({
        orgId: params.orgId,
        to: params.to,
        subject: params.subject,
        body: params.body,
        fromName: prefs.from_name ?? undefined,
        replyTo,
      })
    } catch (err) {
      // Graph send blew up — log and fall back to Resend so the drip
      // doesn't silently drop the message. Common causes: token revoked,
      // mailbox suspended, Graph rate-limited.
      console.error(`[sendEmail] Microsoft Graph failed for org ${params.orgId}, falling back to Resend:`, err)
    }
  }

  // Resend fallback / default path
  const fromHeader = prefs.from_email
    ? (prefs.from_name ? `${prefs.from_name} <${prefs.from_email}>` : prefs.from_email)
    : undefined

  return sendViaResend({
    to: params.to,
    subject: params.subject,
    body: params.body,
    from: fromHeader,
    replyTo,
    tags: params.tags,
    log: params.log,
  })
}
