DOMAIN: Lead Generation
NOTEBOOK: LoanOS Lead Gen Intelligence
FUNNELS: Pre-approval funnel, Rate alert funnel, First-time buyer funnel, Refi watch funnel
GOAL: 20 qualified leads/month from owned channels (not paid referrals) by Week 8

ACTIVE: Week 1 — Current State Audit
  Map all existing lead sources: website forms, Zillow, referrals, social, paid.
  Calculate cost per lead and close rate per source. Identify highest ROI source.
  Identify the biggest gap in the funnel (traffic? conversion? follow-up speed?).
  Document what funnels exist today vs. what is planned. What n8n automations are
  already live and touching leads? What Mailchimp sequences exist and what are their
  open/click rates? DO NOT build anything until this audit is complete.

QUEUE:
- Week 2: Pre-Approval Funnel
    Landing page copy + design. Form fields (name, email, phone, purchase price,
    timeline). Thank you page. Immediate email + SMS follow-up sequence.
    n8n → LoanOS contact creation (Supabase). Lead Source tag: Web Lead.
- Week 3: Rate Alert Funnel
    Rate alert signup page. Weekly automated rate email via Mailchimp.
    Segmentation: buyer vs. refi. Nurture sequence: 6 emails over 90 days.
- Week 4: First-Time Buyer Funnel
    Resource guide lead magnet (PDF). Opt-in page. Download delivery email.
    Drip sequence: 8 emails over 60 days. Realtor co-marketing version.
- Week 5: Refi Watch Funnel
    Past client reactivation sequence. Rate drop trigger automation.
    Home equity milestone alerts. Birthday/anniversary touches.
- Week 6: Realtor Referral System
    Referral tracking in LoanOS. Referral acknowledgment automation.
    Monthly realtor value report. Co-branded marketing materials.
- Week 7: Paid Lead Sources
    Zillow Premier Agent ROI analysis. Google Ads lead funnel.
    Facebook/Instagram lead ad setup. Lead response time automation (<5 min).
- Week 8: Lead Scoring + Routing
    Score leads by: timeline, loan amount, credit range, source.
    Auto-route hot leads to Adam immediately. Warm leads to nurture.
    Cold leads to long-term drip. Dashboard: leads by stage, source, close rate.

COMPLIANCE:
- TCPA: SMS opt-in required before texting — opt-in checkbox must be explicit and unchecked by default
- CAN-SPAM: unsubscribe link on all emails, physical address in footer (5900 Balcones Drive, Suite 100, Austin TX 78731)
- RESPA: no referral fee arrangements in writing
- Fair lending: no targeting by protected class
- NMLS #513013 required on all landing pages and rate-related emails
- Equal Housing Lender disclosure on all landing pages and email footers
- No guaranteed approval language anywhere
