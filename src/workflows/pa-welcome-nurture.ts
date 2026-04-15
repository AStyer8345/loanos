// src/workflows/pa-welcome-nurture.ts
"use workflow"

import { createHook, sleep } from 'workflow'
import { createServiceClient } from '@/lib/supabase/service'
import { sendViaResend } from '@/lib/resend/send'
import { shouldExitDrip, buildDripScheduleDays } from '@/lib/workflows/drip-helpers'

export async function paWelcomeNurture(contactId: string): Promise<void> {
  const schedule = buildDripScheduleDays('pa-welcome')
  // 6 email subjects — one per step, plain tone per spec
  const subjects = [
    'Welcome — your next steps toward pre-approval',
    'A quick tip that saves most buyers $2,000+',
    'What your credit score actually means for your rate',
    'Avoiding the biggest mistake buyers make in a competitive market',
    'Checking in — any questions since we last talked?',
    'Ready when you are — your pre-approval path',
  ]

  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  "use step"
  const supabase = createServiceClient()

  // Fetch contact
  const { data: contact, error: contactErr } = await supabase
    .from('contacts')
    .select('id, first_name, email, email_opt_out, organization_id')
    .eq('id', contactId)
    .single()

  if (contactErr || !contact?.email) return

  // Find active enrollment
  const { data: enrollment } = await supabase
    .from('drip_enrollments')
    .select('id, status, org_id, campaign_id')
    .eq('contact_id', contactId)
    .eq('status', 'active')
    .order('enrolled_at', { ascending: false })
    .limit(1)
    .single()

  if (!enrollment) return

  for (let i = 0; i < schedule.length; i++) {
    if (i > 0) {
      const delayDays = schedule[i] - schedule[i - 1]
      await sleep(`${delayDays}d`)
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    "use step"
    // Re-fetch exit-rule signals after each sleep
    const { data: fresh } = await supabase
      .from('contacts')
      .select('email_opt_out')
      .eq('id', contactId)
      .single()

    const { data: freshEnrollment } = await supabase
      .from('drip_enrollments')
      .select('status')
      .eq('id', enrollment.id)
      .single()

    // Check for recent hard bounce or complaint in activity_log
    const { count: bounceCount } = await supabase
      .from('activity_log')
      .select('*', { count: 'exact', head: true })
      .eq('contact_id', contactId)
      .in('event_type', ['email.bounced', 'email.complained'])

    const shouldExit = shouldExitDrip({
      email_opt_out: fresh?.email_opt_out ?? false,
      status: freshEnrollment?.status ?? 'removed',
      recentBounce: (bounceCount ?? 0) > 0,
      recentComplaint: false, // complaint covered by event_type check above
    })

    if (shouldExit) {
      await supabase
        .from('drip_enrollments')
        .update({ status: 'completed', removed_reason: 'exit-rule' })
        .eq('id', enrollment.id)
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    "use step"
    const sendId = await sendViaResend({
      to: contact.email,
      subject: subjects[i],
      body: `<p>Hi ${contact.first_name},</p><p>${subjects[i]}</p><p>— Adam, NMLS #513013</p>`,
      tags: { enrollment_id: enrollment.id, step_order: String(i) },
    })

    await supabase.from('activity_log').insert({
      organization_id: contact.organization_id,
      contact_id: contact.id,
      action: 'email.sent',
      event_type: 'email.sent',
      summary: `PA Welcome step ${i + 1}/${schedule.length}: ${subjects[i]} [${sendId}]`,
    })

    // Wait for delivery confirmation (up to 24h); proceed anyway if hook not received
    const hook = createHook({ token: `drip-${enrollment.id}-step-${i}` })
    await Promise.race([hook, sleep('24h')])
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  "use step"
  await supabase
    .from('drip_enrollments')
    .update({ status: 'completed' })
    .eq('id', enrollment.id)
}
