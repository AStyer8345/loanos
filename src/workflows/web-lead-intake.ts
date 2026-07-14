// src/workflows/web-lead-intake.ts
"use workflow"

import { createServiceClient } from '@/lib/supabase/service'
import { sendViaResend } from '@/lib/resend/send'
import { classifyLeadFallback } from '@/lib/workflows/drip-helpers'
import { paWelcomeNurture } from './pa-welcome-nurture'
import { dpaGuideNurture } from './dpa-guide-nurture'
import type { WebLeadPayload } from '@/lib/workflows/types'
import type { Database } from '@/lib/database.types'

type ContactInsert = Database['public']['Tables']['contacts']['Insert']

interface WebLeadAcknowledgmentPayload {
  org_id: string
  contact_id: string
  first_name: string | null
  email: string | null
  loan_goal?: string | null
  source_page?: string | null
  form_name?: string | null
}

/**
 * Transactional receipt only. This intentionally does not make a marketing
 * enrollment decision and is safe to call independently from lead intake.
 */
export async function webLeadAcknowledgmentWorkflow(payload: WebLeadAcknowledgmentPayload): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  "use step"
  if (!payload.email) return

  const firstName = payload.first_name?.trim() || 'there'
  await sendViaResend({
    to: payload.email,
    subject: `Got your message, ${firstName} - Adam Styer`,
    replyTo: 'adam@thestyerteam.com',
    body: `
      <p>Hi ${firstName},</p>
      <p>I got your message and will be in touch within one business day.</p>
      <p>You can <a href="https://calendly.com/adamstyer/15minutes">schedule a quick call</a>,
      call <a href="tel:5129566010">(512) 956-6010</a>, or reply to
      <a href="mailto:adam@thestyerteam.com">adam@thestyerteam.com</a>.</p>
      <p>— Adam Styer | NMLS #513013<br>Kyber Mortgage Corporation dba HyperSmart Home Loans</p>
      <p><small>This is an automated confirmation that your request was received. It is not a loan approval or commitment.</small></p>
    `,
    tags: { kind: 'lead_confirmation', source: 'web-lead-ack' },
    log: { organizationId: payload.org_id, contactId: payload.contact_id, template: 'lead_confirmation' },
  })
}

export async function webLeadIntakeWorkflow(payload: WebLeadPayload): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  "use step"
  const supabase = createServiceClient()

  // Upsert contact — dedup on email + organization_id
  // contacts table uses organization_id (not org_id)
  const { data: contacts, error: upsertErr } = await supabase
    .from('contacts')
    .upsert(
      {
        organization_id: payload.org_id,
        first_name: payload.first_name,
        last_name: payload.last_name,
        email: payload.email,
        phone: payload.phone,
        source_page: payload.source_page,
        form_name: payload.form_name,
        // utm_params is Json in DB — cast via unknown per project convention
        utm_params: (payload.utm_params ?? null) as unknown as ContactInsert['utm_params'],
        referrer: payload.referrer,
      } as unknown as ContactInsert,
      { onConflict: 'organization_id,email', ignoreDuplicates: false }
    )
    .select('id, first_name, email, organization_id')

  const contact = contacts?.[0]
  if (upsertErr || !contact) {
    throw new Error(`webLeadIntakeWorkflow: upsert failed — ${upsertErr?.message}`)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  "use step"
  // Write activity — activity_log uses organization_id and summary (not body)
  await supabase.from('activity_log').insert({
    organization_id: payload.org_id,
    contact_id: contact.id,
    action: 'lead.received',
    event_type: 'lead.received',
    summary: `Web lead via ${payload.form_name ?? 'unknown form'} on ${payload.source_page ?? 'unknown page'}`,
  })

  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  "use step"
  // Alert Adam (internal notification — uses Resend, same as all other sends)
  await sendViaResend({
    to: process.env.LOANOS_ADMIN_EMAIL ?? 'adam@thestyerteam.com',
    subject: `New lead: ${contact.first_name} — ${payload.loan_goal ?? 'unknown goal'}`,
    body: `
      <p><strong>New web lead received</strong></p>
      <ul>
        <li>Name: ${contact.first_name}</li>
        <li>Email: ${contact.email}</li>
        <li>Goal: ${payload.loan_goal}</li>
        <li>Source: ${payload.source_page}</li>
        <li>UTM: ${JSON.stringify(payload.utm_params)}</li>
      </ul>
    `,
    tags: { kind: 'lead_alert', source: 'web-lead-intake' },
    log: { organizationId: payload.org_id, contactId: contact.id, template: 'lead_alert' },
  })

  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  "use step"
  // Send a transactional acknowledgment (if email present).
  await webLeadAcknowledgmentWorkflow({
    org_id: payload.org_id,
    contact_id: contact.id,
    first_name: contact.first_name,
    email: contact.email,
    loan_goal: payload.loan_goal,
    source_page: payload.source_page,
    form_name: payload.form_name,
  })

  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  "use step"
  // Classify lead (fallback — no AI dependency for reliability)
  const classification = classifyLeadFallback({
    loan_goal: payload.loan_goal ?? null,
    situation: payload.situation ?? null,
  })

  // Enroll in drip — drip_enrollments uses org_id
  if (classification === 'pa') {
    await supabase.from('drip_enrollments').insert({
      org_id: payload.org_id,
      contact_id: contact.id,
      campaign_id: process.env.PA_WELCOME_CAMPAIGN_ID ?? '',
      status: 'active',
      enrolled_by: 'auto',
      current_step: 0,
    })
    await paWelcomeNurture(contact.id)
  } else if (classification === 'dpa') {
    await supabase.from('drip_enrollments').insert({
      org_id: payload.org_id,
      contact_id: contact.id,
      campaign_id: process.env.DPA_GUIDE_CAMPAIGN_ID ?? '',
      status: 'active',
      enrolled_by: 'auto',
      current_step: 0,
    })
    await dpaGuideNurture(contact.id)
  }
  // generic → no drip enrollment
}
