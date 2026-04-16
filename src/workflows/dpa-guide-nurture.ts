// src/workflows/dpa-guide-nurture.ts
"use workflow"

import { createHook, sleep } from 'workflow'
import { createServiceClient } from '@/lib/supabase/service'
import { sendViaResend } from '@/lib/resend/send'
import { shouldExitDrip, buildDripScheduleDays } from '@/lib/workflows/drip-helpers'
import { renderDripHtml } from '@/lib/workflows/drip-render'

// 8-step DPA Guide nurture. Subjects + bodies edited in-file.
// Schedule lives in buildDripScheduleDays('dpa-guide'): [0,2,5,10,17,25,38,52].
// NOTE: brief proposed day 7 at index 2; kept shipped [0,2,5,10,17,25,38,52]
// to avoid rescheduling in-flight enrollments.
const EMAILS: Array<{ subject: string; plain: string }> = [
  {
    subject: 'Your Austin DPA guide is here (read this first)',
    plain: `Hi {{first_name}},

Your guide: https://styermortgage.com/austin-dpa-guide.pdf

Read page 1 before anything else — it covers the 3 mistakes most buyers make with DPA programs.

Quick context: Austin has more down payment assistance programs than almost any Texas city. Most buyers miss them because their loan officer doesn't know the programs or won't take the time to layer them.

I've been doing DPA loans in Austin since 2017. I know which programs actually work, which ones are paperwork for nothing, and how to stack them for max benefit.

Questions as you read? Reply to this email — goes straight to me.

Adam`,
  },
  {
    subject: 'The 4 Austin DPA programs you should actually care about',
    plain: `Hi {{first_name}},

Quick breakdown of what's worth your time:

1. TSAHC (Texas State Affordable Housing Corp) — grants 3-5% of loan amount, no repayment required. Best for buyers at or below 80% AMI.

2. TDHCA My First Texas Home — 5% second lien, forgivable after 3 years. Pairs well with TSAHC for maximum assistance.

3. Travis County HOME Program — up to $40K for Travis County homes, forgivable after 10 years. Income caps apply.

4. City of Austin SMART Housing — waives fees and offers DPA for homes in approved developments.

These stack. I've closed buyers who got $55K in combined assistance. Not hypothetical — actual closings.

Want to know which you qualify for? Reply with your income range and target area.

Adam`,
  },
  {
    subject: '"But won\'t DPA hurt my offer?" (the short answer: no, if done right)',
    plain: `Hi {{first_name}},

Biggest myth about DPA: that it makes your offer weaker.

Here's the truth. Listing agents don't care where your down payment comes from — they care whether you'll close on time.

The problems happen when:
- The buyer's lender doesn't know the DPA program mechanics
- DPA funds take 30+ days to approve, missing the close date
- The second-lien structure trips up title

I've closed 100+ DPA loans. I know the timelines for each program, which title companies handle the second liens cleanly, and how to structure offers so the seller doesn't flinch.

If your offer is clean and the close date is realistic, DPA is invisible to the seller.

Adam`,
  },
  {
    subject: 'A real DPA buyer story (name changed, numbers real)',
    plain: `Hi {{first_name}},

Meet "Jessica." Single mom, RN, target price $320K in Manor.

She thought she needed 3-5% down — roughly $10-16K saved. She had $4K.

We stacked TSAHC (4% grant = $12,800) with TDHCA second lien (5% = $16,000 forgivable). Total assistance: $28,800.

She closed in 28 days. Out-of-pocket costs: $3,200 — earnest money + inspections.

Her monthly payment: $2,340 all-in (principal, interest, taxes, insurance, PMI). She was paying $2,100 rent.

$240/month more gets her a house she owns, building equity, with a fixed payment she can control.

This is what DPA done right looks like.

Adam`,
  },
  {
    subject: "Income limits: here's the Austin DPA math",
    plain: `Hi {{first_name}},

Most DPA programs have income caps. In Austin, the 2026 numbers:

TSAHC (Home Sweet Texas): household income up to 115% of Travis County AMI = $112K single-earner, $128K two-earner (rough).

TDHCA My First Texas Home: same structure, 115% AMI.

Travis County HOME: 80% AMI — stricter. Roughly $78K single.

City of Austin programs: vary by program.

If you're over these numbers, the conventional layered options (HomeReady, Home Possible) may still work with smaller DPA amounts.

Not sure where you fall? Send me a rough income and I'll tell you which programs are open to you.

Adam`,
  },
  {
    subject: 'The application order matters (most loan officers get this wrong)',
    plain: `Hi {{first_name}},

Here's a mistake I see constantly: DPA applied LAST, after the mortgage is locked.

Doesn't work. Most DPA programs need to be factored into the loan structure upfront — they affect debt-to-income calculations, second-lien positioning, and sometimes the loan program itself.

Correct order:
1. Pre-qualify with full income/credit data
2. Identify DPA programs you qualify for
3. Structure loan with DPA factored in (affects DTI, CLTV, program)
4. Get pre-approval letter showing DPA layered
5. Shop for homes within that pre-approval

If you've been pre-approved without DPA factored in, it may need to be re-underwritten. Worth the hassle.

Reply if you've already been pre-approved elsewhere — I can review whether DPA would improve your position.

Adam`,
  },
  {
    subject: 'One thing that disqualifies most DPA applicants (and how to avoid it)',
    plain: `Hi {{first_name}},

The silent DPA killer: recent large deposits.

Most DPA programs require source documentation for every deposit over $1,000 in the last 60 days. Gifts. Sold car. Tax refund. Paycheck from a side gig.

If you can't source it with a paper trail, underwriters treat it as unauthorized funds and it can disqualify you from the DPA entirely.

What to do RIGHT NOW if you're considering DPA:
- Start a separate savings account for down payment funds
- Document every deposit with a clear source (screenshot, letter, receipt)
- Avoid moving money between accounts without explanation
- If receiving a gift, get a gift letter BEFORE the funds hit your account

This is one of the most fixable problems if you know about it early. Most buyers learn about it during underwriting when it's too late.

Adam`,
  },
  {
    subject: 'Last note: should you do DPA or skip it?',
    plain: `Hi {{first_name}},

Honest answer: not everyone should do DPA.

DPA makes sense when:
- Down payment is your ONLY barrier to buying
- You can afford the monthly payment comfortably
- You'll stay in the home long enough to hit the forgiveness horizon (usually 3-10 years)
- The paperwork delay fits your timeline

DPA does NOT make sense when:
- You have the savings and just want to preserve them (conventional with low down may be better)
- Your timeline is urgent (<30 days)
- You're buying with plans to move within 2-3 years (you'll hit the non-forgiveness window)
- The income limits force you into a lower price bracket than you need

If you've read all 8 of these and you're still not sure if DPA is your path, 15 minutes tells us: https://calendly.com/adamstyer/15minutes

Either way — your guide is yours to keep. Share with friends who might need it.

Adam`,
  },
]

export async function dpaGuideNurture(contactId: string): Promise<void> {
  const schedule = buildDripScheduleDays('dpa-guide')

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
        template: `dpa_guide_step_${i + 1}`,
      },
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
