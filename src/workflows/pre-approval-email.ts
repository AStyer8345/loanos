// src/workflows/pre-approval-email.ts
"use workflow"

import { createClient as createServiceClient } from '@/lib/supabase/server'
import { sendViaResend } from '@/lib/resend/send'

interface PreApprovalPayload {
  contact_id: string
  loan_id: string
  org_id: string
}

export async function preApprovalEmailWorkflow(payload: PreApprovalPayload): Promise<void> {
  "use step"
  const supabase = createServiceClient()

  // Fetch contact (email address + name) — needed for send
  const { data: contact, error } = await supabase
    .from('contacts')
    .select('id, first_name, last_name, email')
    .eq('id', payload.contact_id)
    .single()

  if (error || !contact?.email) {
    throw new Error(`preApprovalEmailWorkflow: contact ${payload.contact_id} not found or has no email`)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  "use step"
  await sendViaResend({
    to: contact.email,
    subject: `Your Pre-Approval is Ready, ${contact.first_name}`,
    body: `
      <p>Hi ${contact.first_name},</p>
      <p>Great news — your pre-approval is ready. I've reviewed your file and you're in strong shape.</p>
      <p>Reply to this email or call me directly and we'll walk through next steps together.</p>
      <p>— Adam<br>NMLS #513013</p>
    `,
    tags: { kind: 'pre_approval', source: 'pre-approval-email' },
    log: { organizationId: payload.org_id, contactId: contact.id, template: 'pre_approval' },
  })
}
