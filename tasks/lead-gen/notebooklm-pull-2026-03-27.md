# NotebookLM Pull Report — 2026-03-27 AM
Active Topic: Lead Flow Audit + Pre-Approval Funnel Architecture Prep

## What We Already Know

**Lead Source Benchmarks (established)**
Referral leads (realtor + personal sphere) close at 20–30%+ — the highest-performing source by far, with industry top performers reaching 35–50%. Organic web leads close at 5–15%. Google Ads at 3–8%. Paid marketplaces like Zillow average 1–3% and cost $150–$250/lead in Austin — low ROI for independent brokers competing against large firms. Cold purchased leads are under 1%. Short landing pages convert ~33% better than long-form. Speed to contact matters: calling within 5 minutes makes a lead 21x more likely to convert. Automated nurture (6–8 touches over 90 days) outperforms non-automated by 2–3x.

**Adam's Database**
2,441 imported contacts and 816 imported loans, ~90.5% closed. Lead source distribution and close rate by source for Adam's history are not yet known — a Salesforce report is needed to establish this baseline.

**What's Live and Working**
- First-Time Buyer (FTB) Guide Funnel — the only fully wired funnel. Calls `subscribe-lead.js`, adds to Mailchimp, creates LoanOS contact, triggers guide delivery via n8n webhook `/webhook/ftb-guide-email`.
- Pipeline automation stack: Arive → Supabase sync (via Zapier bridge), Milestone Communication Agent, Contract Automation, Pre-Approval Email, Refi Intake Email, Final CD Email, New Application Received — all active.
- LoanOS Scenario Comparator and Refi Analyzer are live as proprietary Mortgage Coach replacements.
- Weekly Testimonial Social Post and Closed Loan Review Request automations active for social proof / sphere awareness.

**What's Broken or Missing**
- `/prequal.html` (highest-intent form) has a P0 bug: JavaScript submit handler never calls `fetch()`, so every lead who has completed it since launch was silently lost. Conversion = 0%.
- Homepage Quick Quote and Quick Contact forms route only to Netlify dashboard — no Salesforce contact creation, no Mailchimp add, no n8n notification.
- No real-time notification when any general web lead submits. Adam must check Netlify manually.
- TCPA violation on `/get-preapproved` form: SMS consent is bundled with general terms, violating 2026 FCC one-to-one consent rules. This legally blocks automated SMS follow-up until a separate unchecked checkbox is added.

**Prior Session Work (2026-03-26)**
- Completed a Web Form Destination Audit confirming form routing gaps.
- Identified the prequal.html P0 bug.
- Validated `subscribe-lead.js` as the correct integration pattern for all future form wiring.
- Added Unbounce + Scotsman Guide research confirming short forms + nurture sequences as 2026 best practice.
- Created a TCPA-compliant HTML snippet (separate unchecked SMS opt-in) as the fix for BLOCKER-001.

## Open Questions

1. **Mailchimp status** — current list size, what audiences exist, any engagement metrics available?
2. **Salesforce lead source baseline** — closed loans by source for last 24 months; not yet run.
3. **Zillow ROI** — exact monthly spend and lead volume to calculate true CPL; unknown.
4. **Historical web form submissions** — how many leads actually submitted forms before the audit; any manual tracking?
5. **Netlify env vars** — are `MAILCHIMP_API_KEY` and `LOANOS_AGENT_SECRET` live in production? Silent failures possible if not.
6. **n8n WF1/WF2 cloud deployment** — workflows not pushed to n8n cloud; causing null org rows in database.
7. **Azure App Registration** — Outlook Email Sync (workflow `JMmstRl2C5ylmuIY`) remains blocked; no inbound lead activity logging.
8. **UTM tracking** — no UTM parameters on external links or social profiles; attribution is currently blind.

## Prior Decisions

- `subscribe-lead.js` is the canonical pattern for all web form integrations (Mailchimp upsert + LoanOS contact create + n8n notification hook).
- FTB Guide funnel is the template for all future funnels.
- Zillow is deprioritized — low ROI for Austin independent brokers confirmed by research.
- Paid channels (Google Ads, Facebook Lead Ads) are deferred to Week 7 of the 8-week roadmap.
- SMS automation is blocked until TCPA fix is deployed (BLOCKER-001 snippet is built but not yet applied to live forms).
- All web assets are HTML/CSS/JS — no WordPress, no Webflow.

## Lead Gen Program Priorities

1. **Fix prequal.html P0 bug** (BLOCKER-002) — add `fetch()` call to submit handler; highest urgency.
2. **Wire homepage forms** (Quick Quote, Quick Contact) to `subscribe-lead.js` — currently a Week 2 build item.
3. **Deploy TCPA fix** — apply unchecked SMS opt-in checkbox to all live forms (snippet exists, not yet deployed).
4. **Establish Salesforce baseline** — run Closed Loans by Lead Source report for last 24 months.
5. **Verify Netlify env vars** — confirm `MAILCHIMP_API_KEY` and `LOANOS_AGENT_SECRET` are live.
6. **Build Pre-Approval Funnel** (Week 2) — connect web leads to Salesforce + Mailchimp "Web Lead Buyer" audience.
7. **Push n8n WF1/WF2 to cloud** — resolve null org row technical debt in activity_log.
8. **Unblock Azure App Registration** — required to activate Outlook Email Sync workflow.

## Briefing for Research Subagent

Do NOT re-research the following — already established:
- Referral vs. web vs. paid lead close rate benchmarks
- Speed-to-contact conversion impact (5-minute rule)
- Austin Zillow ROI for independent brokers
- Short form vs. long form conversion rates
- 6–8 touch nurture sequence effectiveness
- TCPA 2026 FCC one-to-one consent rules

Focus new research here instead:
- Best practices for **pre-approval funnel architecture** — what specifically should the landing page, form fields, and immediate follow-up sequence look like for a mortgage pre-approval offer?
- **Mailchimp audience segmentation** for mortgage leads — buyer vs. refinancer audience structure, tagging strategy, and drip sequence timing benchmarks for 2026.
- **Real-time lead notification patterns** — how do top LOs structure n8n/webhook alerts for web form submissions (SMS to LO, email to LO, CRM auto-create — what's the winning stack)?
- **Google Ads mortgage lead quality** — what specific campaign types (Performance Max vs. Search vs. LSA) produce the best CPL for independent mortgage brokers in 2026 Austin market?
