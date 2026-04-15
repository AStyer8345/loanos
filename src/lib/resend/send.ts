// src/lib/resend/send.ts
import { Resend } from 'resend'

// Lazy initialization — avoid throwing at module load when RESEND_API_KEY is absent
let _resend: Resend | null = null
function getResendClient(): Resend {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY)
  return _resend
}

export interface ResendSendParams {
  to: string
  subject: string
  body: string          // HTML
  tags?: Record<string, string>
}

export async function sendViaResend(params: ResendSendParams): Promise<string> {
  const resend = getResendClient()
  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM_ADDRESS ?? 'adam@styermortgage.com',
    to: params.to,
    subject: params.subject,
    html: params.body,
    tags: params.tags
      ? Object.entries(params.tags).map(([name, value]) => ({ name, value }))
      : undefined,
  })

  if (error) throw new Error(`Resend send failed: ${error.message}`)
  return data?.id ?? ''
}
