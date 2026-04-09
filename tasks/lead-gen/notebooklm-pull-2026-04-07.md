# NotebookLM Pull Report — 2026-04-07 AM
Active Topic: Refi Watch Builder (blocked) + LO Waitlist verification

## What We Already Know

**Infrastructure baseline:** 4 funnels are live — FTB Guide, Pre-Approval, Rate Alert (Austin Rate Watch), FTB DPA Guide. LO Waitlist is built and committed but NOT deployed (pending Adam copy review + git push). All core lead routing is wired: web form submissions → Netlify function → Mailchimp tag + LoanOS contact creation + n8n speed-to-lead notification.

**Database audience:** 2,441 contacts. 644 past client loan records (Refi Watch target audience). 77% of contacts have no lead source tag. Web lead volume remains very low (7–8 total since site launch).

**Blockers:** Refi Watch Builder execution is blocked on Adam's decisions: (1) rate source for Sequence A (FRED API vs manual webhook vs Optimal Blue), (2) email copy approval for Sequences A and D before firing to 644 past clients.

**LO Waitlist status:** Code built (commit 300c019 in styerteam-mortgage-site). n8n workflow Rn6rtlKeoQ0CrUkb created but INACTIVE. Netlify function subscribe-lo.js ready. Awaiting: Adam copy review → git push → n8n activation → Mailchimp LO audience creation.

**Nurture gap:** Mailchimp Customer Journeys (cannot be created via API) are not built for any live funnel. PA Welcome Series, Rate Watch Welcome Series, and FTB DPA Guide Welcome Series are all pending Adam manual configuration in Mailchimp.

## Open Questions

1. What rate source will Adam use for Refi Watch Sequence A (Rate Drop Alert)? Manual webhook (recommended), FRED API (free/automated), or paid API?
2. Has Adam reviewed and approved the LO Waitlist landing page copy? Has he pushed to production?
3. When will Adam create Mailchimp Customer Journeys for the 3 live funnels (PA, Rate Watch, DPA)?
4. Has Adam activated the n8n LO Waitlist Intake workflow (Rn6rtlKeoQ0CrUkb)?
5. What is the current Mailchimp list size and any engagement data from existing subscribers?

## Prior Decisions

- Email platform for Refi Watch: n8n → Outlook (not Mailchimp) — personal feel, past clients, small volume (644 contacts)
- Refi Watch rate spread threshold: 0.75% recommended (market 6.00% vs borrower avg 6.75%)
- LO Waitlist: separate subscriber list from borrower leads, separate Netlify function (subscribe-lo.js), separate n8n workflow
- LO Waitlist landing page: copy committed, awaiting Adam review before deploy
- TCPA: SMS opt-in must be separate checkbox, unchecked by default, not required for form submission

## Lead Gen Program Priorities

1. **Refi Watch execution** — highest ROI available (644 pre-qualified past clients, zero CAC), blocked on Adam
2. **LO Waitlist deploy** — built, pending Adam copy review + git push
3. **Mailchimp nurture sequences** — 3 live funnels with no email follow-up; leads go cold after capture
4. **Homepage form wiring** — Quick Quote + Quick Contact forms still Netlify-only (no LoanOS sync)
5. **Lead source attribution** — 77% of 2,441 contacts untagged; data blind spots in current ROI reporting

## Briefing for Research Subagent

Do NOT re-research: TCPA compliance basics, CAN-SPAM requirements, Reg Z disclosure rules, basic form design, Mailchimp/n8n integration patterns (all covered in prior sessions).

Focus new research here:
- FRED API mortgage rate data — how to pull 30-yr fixed rate data programmatically, rate of update, data quality vs paid APIs
- Email re-engagement best practices for past mortgage clients — subject line patterns, timing, warm-up sequence design for cold/lapsed audiences
- Mailchimp Customer Journey builder — step-by-step setup guide to prepare instructions Adam can follow without needing to figure it out himself
