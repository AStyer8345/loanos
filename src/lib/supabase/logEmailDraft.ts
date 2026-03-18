import { createClient } from '@supabase/supabase-js'

interface EmailDraftPayload {
  automation_name: string
  recipient_name?: string
  recipient_email: string
  subject: string
  body_html: string
  contact_id?: string
  loan_id?: string
  outlook_draft_id?: string
  organization_id?: string
}

export async function logEmailDraft(payload: EmailDraftPayload) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Generate plain text preview from HTML
  const body_preview = payload.body_html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 200)

  const { data, error } = await supabase
    .from('email_drafts')
    .insert({
      ...payload,
      body_preview,
      status: 'pending'
    })
    .select()
    .single()

  if (error) {
    console.error('[logEmailDraft] Failed to log email draft:', error)
    return null
  }

  return data
}
