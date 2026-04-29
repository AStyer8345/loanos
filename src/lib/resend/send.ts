// src/lib/resend/send.ts
import { Resend } from 'resend'
import { createServiceClient } from '@/lib/supabase/service'

// Lazy initialization — avoid throwing at module load when RESEND_API_KEY is absent
let _resend: Resend | null = null
function getResendClient(): Resend {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY)
  return _resend
}

export interface ResendLogContext {
  organizationId: string
  contactId?: string | null
  template: string          // e.g. 'lead_alert', 'lead_confirmation', 'pa_welcome_step_1', 'pre_approval'
}

export interface ResendSendParams {
  to: string
  subject: string
  body: string          // HTML
  from?: string         // override From: header (already-formatted, e.g. '"Adam" <adam@x.com>')
  replyTo?: string      // override Reply-To
  tags?: Record<string, string>
  log?: ResendLogContext
}

export async function sendViaResend(params: ResendSendParams): Promise<string> {
  const resend = getResendClient()
  const { data, error } = await resend.emails.send({
    from: params.from ?? process.env.RESEND_FROM_ADDRESS ?? 'adam@styermortgage.com',
    to: params.to,
    subject: params.subject,
    html: params.body,
    replyTo: params.replyTo,
    tags: params.tags
      ? Object.entries(params.tags).map(([name, value]) => ({ name, value }))
      : undefined,
  })

  if (error) throw new Error(`Resend send failed: ${error.message}`)
  const resendId = data?.id ?? ''

  // Best-effort send log — a row in activity_log every time we send.
  // Never throw from logging failures; sending the email is the primary job.
  if (params.log) {
    try {
      const supabase = createServiceClient()
      await supabase.from('activity_log').insert({
        organization_id: params.log.organizationId,
        contact_id: params.log.contactId ?? null,
        action: 'email.sent',
        event_type: 'email.sent',
        type: params.log.template,
        to_address: params.to,
        external_id: resendId || null,
        summary: params.subject,
      })
    } catch (logErr) {
      console.error('sendViaResend: activity_log insert failed', logErr)
    }
  }

  return resendId
}
