// src/workflows/pa-welcome-nurture.ts
"use workflow"

import { createHook, sleep } from 'workflow'
import { createServiceClient } from '@/lib/supabase/service'
import { sendViaResend } from '@/lib/resend/send'
import { shouldExitDrip, buildDripScheduleDays } from '@/lib/workflows/drip-helpers'
import { renderDripHtml } from '@/lib/workflows/drip-render'

// 6-step PA Welcome nurture. Subjects + bodies edited in-file (authored prose,
// not AI-generated). Schedule lives in buildDripScheduleDays('pa-welcome').
const EMAILS: Array<{ subject: string; plain: string }> = [
  {
    subject: "Your pre-approval request is in — here's what happens next",
    plain: `Hi {{first_name}},

Got it. Your request is in front of me right now.

I'll personally review your info today — no call center, no handoff. If everything looks good, you'll have a pre-approval letter in 24-48 hours.

A few things worth knowing:

I work for you, not a bank. I'm an independent broker with access to 40+ wholesale lenders — I shop your loan across all of them.

Your credit isn't getting hammered. Multiple mortgage inquiries inside a 45-day window count as one hit.

Reply to this email or book 15 minutes: https://calendly.com/adamstyer/15minutes

Adam`,
  },
  {
    subject: 'What "pre-approved" actually means (most buyers get this wrong)',
    plain: `Hi {{first_name}},

Quick thing worth understanding before you start making offers.

Pre-qualification is a guess. You tell a lender what you make. No documents verified. Worth almost nothing to a seller.

Pre-approval is a commitment. I've verified your income, confirmed your assets, pulled credit, run it through real underwriting. In Austin's market, that difference decides who wins the house.

If you haven't finished your application, now's the time: https://mslp.my1003app.com/513013/register

Adam`,
  },
  {
    subject: 'The 3 things that kill a mortgage approval',
    plain: `Hi {{first_name}},

Every deal I've ever lost came from one of these three things.

1. Credit score drops mid-process. Don't open new credit cards. Don't finance furniture. Don't close old accounts.

2. New debt before closing. Financing a car or using a new card heavily changes your DTI. Your loan is priced around your DTI at application.

3. Job changes. Even a promotion can trigger re-verification. If a job change is coming, tell me now.

Pay bills on time. Keep accounts open. Keep employment steady. Send documents fast.

Questions? https://calendly.com/adamstyer/15minutes

Adam`,
  },
  {
    subject: 'Austin market update: what rates look like right now',
    plain: `Hi {{first_name}},

The question I get constantly: should I lock now or wait?

Three questions I ask every client:

1. How close is your closing date? Within 30 days — lock.
2. Can you absorb a quarter-point move up? If not, lock early.
3. What's your "good enough" rate? If today's payment works, that's the rate.

Most loan programs offer float-down options if rates drop significantly after your lock.

Want today's actual rates for your scenario? Just reply.

Adam`,
  },
  {
    subject: 'A buyer just like you closed last month',
    plain: `Hi {{first_name}},

Want to tell you about a client who closed last month.

First-time buyers. Couple in early 30s. $165K combined income. Credit in the 720s. Got pre-approved on Tuesday. Wednesday they put an offer on a house in Pflugerville against 3 other buyers.

Why they won: real pre-approval letter the listing agent recognized. 21-day fast close. Pre-planned appraisal gap strategy so no panic when it came in $8K short.

Got keys 21 days after that Tuesday pre-approval.

The playbook is repeatable: real pre-approval, clean offer, fast close, no surprises.

Ready to finish your application? https://mslp.my1003app.com/513013/register

Adam`,
  },
  {
    subject: "Still thinking about it? Here's what's changed",
    plain: `Hi {{first_name}},

It's been two months. No judgment — life happens.

Quick reset on what's changed:

Rates have moved. What your payment looked like two months ago may not match today.

First-time buyer programs (TSAHC, TDHCA, Travis County) refund on a rolling basis. What wasn't available then may be now.

Austin has more inventory than last year. Sellers are negotiating more.

If buying isn't in the cards anymore, reply and tell me to quit bothering you.

If you're on the fence, 15 minutes re-baselines everything: https://calendly.com/adamstyer/15minutes

Adam`,
  },
]

export async function paWelcomeNurture(contactId: string): Promise<void> {
  const schedule = buildDripScheduleDays('pa-welcome')

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
    const { subject, plain } = EMAILS[i]
    const body = renderDripHtml(plain, { first_name: contact.first_name ?? 'there' })

    await sendViaResend({
      to: contact.email,
      subject,
      body,
      tags: { enrollment_id: enrollment.id, step_order: String(i) },
      log: {
        organizationId: contact.organization_id,
        contactId: contact.id,
        template: `pa_welcome_step_${i + 1}`,
      },
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
