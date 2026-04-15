// src/workflows/dpa-guide-nurture.ts
"use workflow"

import { createHook, sleep } from 'workflow'
import { createServiceClient } from '@/lib/supabase/service'
import { sendViaResend } from '@/lib/resend/send'
import { shouldExitDrip, buildDripScheduleDays } from '@/lib/workflows/drip-helpers'

export async function dpaGuideNurture(contactId: string): Promise<void> {
  const schedule = buildDripScheduleDays('dpa-guide')
  const subjects = [
    'Your DPA guide is here — what Texas buyers need to know',
    'The #1 reason DPA programs get denied (and how to avoid it)',
    'TSAHC vs. TDHCA — which program fits your situation?',
    'Income limits, credit minimums, and what "first-time" actually means',
    'How combining DPA with a seller concession works',
    'A real example: $0 down, $3,200 in closing help (2025 deal)',
    'Is your income too high for DPA? (It might be lower than you think)',
    "Ready to apply? Here's the exact next step.",
  ]

  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  "use step"
  const supabase = createServiceClient()

  const { data: contact, error: contactErr } = await supabase
    .from('contacts')
    .select('id, first_name, email, email_opt_out, organization_id')
    .eq('id', contactId)
    .single()

  if (contactErr || !contact?.email) return

  const { data: enrollment } = await supabase
    .from('drip_enrollments')
    .select('id, status, org_id')
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

    const { count: bounceCount } = await supabase
      .from('activity_log')
      .select('*', { count: 'exact', head: true })
      .eq('contact_id', contactId)
      .in('event_type', ['email.bounced', 'email.complained'])

    if (shouldExitDrip({
      email_opt_out: fresh?.email_opt_out ?? false,
      status: freshEnrollment?.status ?? 'removed',
      recentBounce: (bounceCount ?? 0) > 0,
      recentComplaint: false,
    })) {
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
      summary: `DPA Guide step ${i + 1}/${schedule.length}: ${subjects[i]} [${sendId}]`,
    })

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
