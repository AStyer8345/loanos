// src/lib/drip/authored-emails.ts
//
// Authored email content for drip campaigns with relative_days triggers.
// Keyed by campaign ID (Supabase drip_campaigns.id) → step_order (1-based) → {subject, plain}.
// The `plain` field uses {{var}} merge tags resolved by renderDripHtml().
//
// PA Welcome and DPA Guide content mirrors the WDK workflow files.
// Lead nurture emails (Ghost Referral, Incomplete App, Went Quiet) are authored here only.

export interface DripEmailContent {
  subject: string
  plain: string   // plain text with {{first_name}} merge tags
}

// Campaign IDs from prod Supabase (drip_campaigns table)
export const DRIP_CAMPAIGN_IDS = {
  PA_WELCOME:      '8b540726-0143-4d96-b1fe-deb65450705d',
  DPA_GUIDE:       '46ea4f7b-2f78-444b-b712-fed6ec52da70',
  GHOST_REFERRAL:  'dc370748-8ffc-49a5-b5d3-218473c09574',
  INCOMPLETE_APP:  'cd488533-8156-41b2-9fa7-dc8aa9cf53bf',
  WENT_QUIET:      '2c0382a5-0196-461f-8310-4b61acfe557c',
} as const

type CampaignId = typeof DRIP_CAMPAIGN_IDS[keyof typeof DRIP_CAMPAIGN_IDS]

export const AUTHORED_EMAILS: Record<CampaignId, Record<number, DripEmailContent>> = {

  // ── PA Welcome Nurture — 6 steps, days 0/3/7/14/30/60 ──────────────────────
  [DRIP_CAMPAIGN_IDS.PA_WELCOME]: {
    1: {
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
    2: {
      subject: 'What "pre-approved" actually means (most buyers get this wrong)',
      plain: `Hi {{first_name}},

Quick thing worth understanding before you start making offers.

Pre-qualification is a guess. You tell a lender what you make. No documents verified. Worth almost nothing to a seller.

Pre-approval is a commitment. I've verified your income, confirmed your assets, pulled credit, run it through real underwriting. In Austin's market, that difference decides who wins the house.

If you haven't finished your application, now's the time: https://mslp.my1003app.com/513013/register

Adam`,
    },
    3: {
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
    4: {
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
    5: {
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
    6: {
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
  },

  // ── DPA Guide Nurture — 8 steps, days 0/2/5/10/17/25/38/52 ────────────────
  [DRIP_CAMPAIGN_IDS.DPA_GUIDE]: {
    1: {
      subject: 'Your Austin DPA guide is here (read this first)',
      plain: `Hi {{first_name}},

Your guide: https://styermortgage.com/austin-dpa-guide.pdf

Read page 1 before anything else — it covers the 3 mistakes most buyers make with DPA programs.

Quick context: Austin has more down payment assistance programs than almost any Texas city. Most buyers miss them because their loan officer doesn't know the programs or won't take the time to layer them.

I've been doing DPA loans in Austin since 2017. I know which programs actually work, which ones are paperwork for nothing, and how to stack them for max benefit.

Questions as you read? Reply to this email — goes straight to me.

Adam`,
    },
    2: {
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
    3: {
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
    4: {
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
    5: {
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
    6: {
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
    7: {
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
    8: {
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
  },

  // ── Lead — Ghost Referral — 4 steps, days 3/7/21/45 ───────────────────────
  [DRIP_CAMPAIGN_IDS.GHOST_REFERRAL]: {
    1: {
      subject: 'Quick note — got your name from {{referred_by}}',
      plain: `Hi {{first_name}},

{{referred_by}} passed your name along. Wanted to reach out.

No pitch here. Just wanted you to know I'm available if you have questions about buying, what you can afford, or how the process works in Austin right now.

When you're ready — or even just curious — reply or book 15 minutes: https://calendly.com/adamstyer/15minutes

Adam`,
    },
    2: {
      subject: "One thing worth knowing about Austin's market right now",
      plain: `Hi {{first_name}},

Worth passing along whether you're buying soon or still deciding:

Austin has more inventory than this time last year. Sellers are negotiating more. The window for buyers who know what they want is better than it's been in a while.

That doesn't mean you should rush. It means when your timing is right, the market is less of a fight than people think.

I'm around if you want a real picture of what you can buy at your numbers.

Adam`,
    },
    3: {
      subject: 'Still thinking it over?',
      plain: `Hi {{first_name}},

No pressure — just a quick check-in. Timing for buying is personal, and it's fine if it's not right yet.

If anything's changed in your situation — job, income, timeline — sometimes that changes what you qualify for more than people expect.

Happy to run your numbers if you want a fresh look.

Adam`,
    },
    4: {
      subject: 'Last one from me (for now)',
      plain: `Hi {{first_name}},

Last email in my queue for you. Not going away — just not going to keep showing up uninvited.

If and when buying makes sense, I'm easy to reach: https://calendly.com/adamstyer/15minutes

I'll keep sending occasional market updates so you're not starting from scratch when the time comes.

Adam`,
    },
  },

  // ── Lead — Incomplete App — 3 steps, days 2/5/14 ──────────────────────────
  [DRIP_CAMPAIGN_IDS.INCOMPLETE_APP]: {
    1: {
      subject: "Your application is waiting — here's what to expect",
      plain: `Hi {{first_name}},

Noticed you started an application. Wanted to make it easier to finish.

What it takes:
- 2 years of W-2s or tax returns
- 30-day pay stubs
- 2-3 months of bank statements
- A valid ID

That's most of it. The form walks you through the rest.

If you got stuck or had a question, reply and I'll walk you through it directly.

Finish here: https://mslp.my1003app.com/513013/register

Adam`,
    },
    2: {
      subject: '3 things that stop people from applying (and why they shouldn\'t)',
      plain: `Hi {{first_name}},

The three things I hear most often when someone stalls on an application:

"My credit score isn't good enough." Most buyers worry about this too early. I can tell you exactly where you stand with a soft pull — no hit to your score.

"I don't have enough saved." Down payment is often less than people think. There are programs that cover 3-5% for qualified buyers.

"I don't want to be locked into anything." A pre-approval isn't a contract. It's information. You can apply, know your numbers, and decide to wait. No obligation.

Any of these hit home? Reply and I'll clear it up.

Adam`,
    },
    3: {
      subject: 'Quick question',
      plain: `Hi {{first_name}},

Direct question: is there something I can help with to get your application finished?

I do 15-minute calls specifically for this — answer your questions, walk through anything confusing, help you figure out what you actually qualify for.

Book one here: https://calendly.com/adamstyer/15minutes

If the timing just isn't right, no problem at all — just reply and I'll stop reaching out.

Adam`,
    },
  },

  // ── Lead — Went Quiet — 4 steps, days 30/60/90/180 ───────────────────────
  [DRIP_CAMPAIGN_IDS.WENT_QUIET]: {
    1: {
      subject: 'Quick Austin market update',
      plain: `Hi {{first_name}},

Been a while. Wanted to send a quick snapshot in case it's useful.

Austin right now: inventory is up, sellers are negotiating more than last year, and rates are moving. Depending on your situation, the math may look different than when we last talked.

If you want a fresh read on what you'd qualify for today, happy to run it. No pressure, just an updated picture.

Reply or book 15 minutes: https://calendly.com/adamstyer/15minutes

Adam`,
    },
    2: {
      subject: "What's changed in 2 months (and what it means for your payment)",
      plain: `Hi {{first_name}},

Two months is long enough for the mortgage math to shift.

If rates moved even a quarter-point from where they were when we talked, your monthly payment on the same house changes by $50-100. That's not nothing.

I can give you an updated payment estimate for your target price in about 2 minutes. Just reply with a ballpark number if you still have one in mind.

Adam`,
    },
    3: {
      subject: 'Still thinking about buying?',
      plain: `Hi {{first_name}},

Quick check-in. Has anything changed on your end — timeline, situation, what you're looking for?

No need to overthink this. If buying is still on your radar, even loosely, it's worth a quick conversation to know where you stand.

If the timing has shifted or it's just not the right move anymore, that's fine too — just let me know and I'll stop cluttering your inbox.

Adam`,
    },
    4: {
      subject: '6-month market check-in — Austin',
      plain: `Hi {{first_name}},

Six months since we first talked. Sending one more market update in case anything has changed on your end.

Austin inventory is still higher than 2022-2023 levels. Sellers are offering concessions more often. Rates have been in flux — what matters for you is where they land relative to your target payment.

If you're still thinking about buying — this year, next year, whenever — I'm here.

Book 15 minutes when it makes sense: https://calendly.com/adamstyer/15minutes

Adam`,
    },
  },
}

/** Returns true if this campaign has authored email content for the given step_order. */
export function hasAuthoredEmail(campaignId: string, stepOrder: number): boolean {
  const campaign = AUTHORED_EMAILS[campaignId as CampaignId]
  if (!campaign) return false
  return Boolean(campaign[stepOrder])
}

/** Returns the authored email content for a campaign step, or null if none. */
export function getAuthoredEmail(
  campaignId: string,
  stepOrder: number
): DripEmailContent | null {
  const campaign = AUTHORED_EMAILS[campaignId as CampaignId]
  if (!campaign) return null
  return campaign[stepOrder] ?? null
}
