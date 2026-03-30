# NotebookLM Pull Report — 2026-03-26 AM
Active Topic: Lead Flow Audit + Activation

## What We Already Know

**Lead source performance (established baselines):**
- Realtor referrals: 20–30% close rate (industry benchmark 35–50%). Adam's highest-value source.
- Organic web: 5–15% close rate. Lowest cost, best long-term ROI.
- Google Ads: 3–8% close rate. CPL $50–150.
- Paid marketplaces (Zillow): 1–3% close rate. CPL $80–200.
- Adam's actual lead source distribution from Salesforce: STILL UNKNOWN — needs Salesforce report.

**Infrastructure confirmed live (as of 2026-03-25 AM audit):**
- styermortgage.com — live website with multiple forms
- n8n automation stack — 10+ workflows, primarily pipeline automation (not lead acquisition)
- LoanOS CRM (Supabase) — 2,441 contacts, 816 loans
- Pre-Approval Email workflow (n8n) — fires when PA letter uploaded ✅
- Milestone Communication Agent (n8n) — fires on Arive status changes ✅
- No confirmed live Mailchimp nurture sequences

**Critical gap established in prior session:**
- Web forms are NOT connected to the automation stack — form destination was UNKNOWN as of prior session. This session will investigate.

## Open Questions

1. Where do styermortgage.com form submissions actually go today? (Investigating this AM)
2. Is Mailchimp active? What audiences, sequences, list size? (Requires Adam to share or grant access)
3. What is Salesforce lead source breakdown for closed loans last 24 months? (Requires Adam to run report)
4. Is the n8n FTB Guide welcome email webhook (`/webhook/ftb-guide-email`) live and tested?
5. Are MAILCHIMP_API_KEY and MAILCHIMP_BORROWER_LIST_ID set in Netlify env vars for subscribe-lead.js?

## Prior Decisions

- Week 1 = Sequence A only. No funnel builds until current-state audit is complete.
- All new leads route to LoanOS (Supabase) via n8n — not Salesforce.
- Pre-Approval Funnel is Week 2 priority.
- TCPA fix is a prerequisite for any SMS automation.
- Lead response time goal: 5 minutes from web form submission.

## Lead Gen Program Priorities

1. **IMMEDIATE**: Complete web form destination audit (in-session today)
2. **WEEK 1 REMAINING**: Get Adam's answers on Mailchimp status + Salesforce lead source data
3. **BEFORE WEEK 2 BUILD**: Fix prequal.html form submission (suspected broken — verify today)
4. **BEFORE ANY SMS**: Resolve BLOCKER-001 (TCPA bundled consent on prequal.html)
5. **WEEK 2**: Wire Pre-Approval Funnel to automation stack (subscribe-lead.js → Mailchimp → LoanOS)

## Briefing for Research Subagent

**Do NOT re-research** (already established):
- Industry close rates by source
- TCPA compliance requirements
- CAN-SPAM rules
- n8n workflow status (mapped in prior session)
- Response time statistics (21x at 5 min)

**Focus new research here:**
1. Investigate prequal.html JavaScript — does it actually transmit form data or is it a dead end?
2. Investigate index.html forms — are Netlify Form webhook notifications configured for n8n?
3. Audit subscribe-lead.js Netlify function — what is it currently wired to? Does it work?
4. Identify any existing Mailchimp audience by checking Netlify env var references
5. Document the First-Time Buyer Guide funnel (/resources/first-time-buyer-guide) — is it functional?
