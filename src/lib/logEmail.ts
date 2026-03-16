import { createClient } from '@supabase/supabase-js'

export interface LogEmailParams {
  contact_id?: string | null
  loan_id?: string | null
  subject: string
  body_html?: string | null
  body_text?: string | null
  automation_source: string
}

/**
 * Logs an automation-generated email to the contact_emails audit table.
 * Uses the service role client — server-only, never call from the browser.
 * Call this from every automation API route after creating an Outlook draft.
 */
export async function logEmail(params: LogEmailParams): Promise<void> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await supabase.from('contact_emails').insert({
    contact_id:       params.contact_id       ?? null,
    loan_id:          params.loan_id           ?? null,
    subject:          params.subject,
    body_html:        params.body_html         ?? null,
    body_text:        params.body_text         ?? null,
    automation_source: params.automation_source,
    direction:        'outbound',
    sent_at:          new Date().toISOString(),
  })

  if (error) {
    console.error('[logEmail] Failed to log email:', error)
  }
}
