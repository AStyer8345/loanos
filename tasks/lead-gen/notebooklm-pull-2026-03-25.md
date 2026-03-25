# NotebookLM Pull Report — 2026-03-25 AM
Active Topic: Week 1 — Current State Audit (Map existing lead sources, cost per lead, close rate per source)

## What We Already Know

**Notebook was just created this session** — this is the first pull from a freshly seeded notebook. All context comes from domain-queue.md, lessons.md, and CONTEXT.md.

### Existing Lead Sources (Identified from System Context)
- **styermortgage.com web form** — live API route in LoanOS accepting structured form data with deduplication. Tagged as "Web Lead" source in Salesforce.
- **Referral partners** — realtors and financial planners. LinkedIn identified as highest ROI B2B referral channel.
- **Legacy database** — 2,441 contacts imported from Salesforce, 816 loans imported from Arive LOS (~90.5% closed).
- **Social media** — LinkedIn, TikTok, Instagram, Facebook. No direct lead capture tracked from social yet.
- **Paid/Third-party** — Zillow Premier Agent (referenced but ROI not yet calculated), Google/Facebook ads planned but not built.

### Social Engagement Benchmarks (from existing context)
- TikTok: 3.7% avg engagement rate
- Facebook organic reach: 1–2% of followers ("effectively dead")
- Instagram Reels with strong 3-sec hook: 5–10x reach multiplier
- LinkedIn headshot: 21x visibility increase

### Built Automation Infrastructure (touches leads/prospects)
- **Web Lead API route** — live, ingests styermortgage.com form submissions
- **Arive → Supabase sync** (n8n `1tagvoU0UXtdDiMY`) — new loans auto-ingested from Arive via Zapier
- **Arive Status Update** (n8n `9JyzzwKac8v3uQ7d`) — milestone sync
- **Loan Milestone Communication** (n8n `1hjOmS7inZcxEJQr`) — Claude-generated emails on Arive milestone events
- **Pre-Approval Email** (n8n `utMvZpkdRwIRZ51u`) — triggered on PA PDF upload
- **Referral Intro Email** (n8n `YbgDnTpPdefcazKy`) — paste-triggered
- **New Application Received** (n8n `cWESnXXy9UOLB13q`) — triggered on 1003 PDF upload
- **Refi Intake Email** (n8n `yCTydQ7RfZK4DyUg`) — IFW PDF extraction → email draft
- **Contract Automation Pipeline** — live, extracts contract data, generates borrower welcome emails
- **Final CD Email** (n8n `SkzrWeR0bHZs8kWX`) — triggered on CD upload

### Planned Funnels (Not Yet Built)
- Week 2: Pre-approval landing page + form + immediate follow-up sequence
- Week 3: Rate alert signup + Mailchimp weekly rate email (buyer/refi segmentation)
- Week 4: First-time buyer resource guide lead magnet + drip
- Week 5: Refi watch / past client reactivation
- Week 6: Realtor referral system
- Week 7: Paid lead source ROI analysis + Google/Facebook ad funnels
- Week 8: Lead scoring + routing dashboard

## Open Questions

1. **What is the actual close rate per lead source?** — No tracking exists yet. Need Salesforce query or manual review.
2. **What is the cost per lead for Zillow Premier Agent?** — Referenced but no dollar figure in context.
3. **Are any Mailchimp sequences currently live?** — Mailchimp referenced as tool but no active sequences documented.
4. **What landing pages exist today on styermortgage.com?** — No audit done yet.
5. **What is the current monthly lead volume from the web form?** — No data in context.
6. **Is there TCPA opt-in language on styermortgage.com?** — Not documented. High risk if SMS follow-up is ever wired.
7. **What does the current Salesforce lead source breakdown look like?** — 2,441 contacts exist but source distribution unknown.
8. **What Google Analytics / Plausible data exists for styermortgage.com?** — Traffic volume unknown.

## Prior Decisions

- Week 1 is research-only. NO funnels to be built until audit is complete.
- Salesforce/Jungo is the current CRM routing target for leads (until LoanOS is primary).
- NMLS #513013 + Equal Housing Lender required on all landing pages and rate emails.
- SMS requires explicit TCPA opt-in checkbox, unchecked by default.
- CAN-SPAM footer: 5900 Balcones Drive, Suite 100, Austin TX 78731.
- Business name: Adam Styer | Mortgage Solutions LP (never "The Styer Team").

## Lead Gen Program Priorities

1. **Complete the current-state audit** before building anything — Week 1 blocker.
2. **Map cost per lead and close rate per source** — required to prioritize build queue.
3. **Audit styermortgage.com** — count forms, check TCPA language, document existing pages.
4. **Audit Mailchimp** — what lists exist, what sequences are live, open/click rates.
5. **Audit Salesforce lead source distribution** — understand where closed deals actually came from.
6. **Identify the highest-friction point in the funnel** — traffic, conversion, or follow-up speed.

## Briefing for Research Subagent

Do NOT re-research:
- The weekly funnel build sequence (already defined in domain-queue.md)
- n8n workflow IDs and statuses (already mapped in MEMORY.md)
- Compliance rules (TCPA, CAN-SPAM, NMLS) — already defined in domain-queue.md
- Social media engagement benchmarks — already in context

Focus new research on:
- **Gap 1**: Current styermortgage.com lead capture — what forms exist, where traffic goes, current conversion rate estimate
- **Gap 2**: Mailchimp current state — what audiences exist, what automations are live, what open/click rates look like
- **Gap 3**: Salesforce/Jungo lead source distribution — where are the closed deals actually coming from
- **Gap 4**: Zillow Premier Agent spend vs. leads generated — what is the true cost-per-lead and close rate
- **Gap 5**: Existing referral pipeline — how many active realtor relationships, how many referrals per month on average
