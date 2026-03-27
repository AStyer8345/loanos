# Web Research — Automation Coverage Audit
**Date:** 2026-03-27
**Topic:** Mortgage CRM Automation Best Practices — Post-Close, Drip, Compliance
**Queries run:** 3

---

## Query 1: "mortgage CRM borrower communication automation 2026"

**Source:** [The Complete Guide to Mortgage Marketing in 2026 | Empower LO](https://empowerlo.com/blog/mortgage-marketing-guide-2026)

### Key Findings

**AI + CRM Integration Trends (2026):**
- Lenders are investing heavily in agentic AI and automation to reduce origination costs
- When CRM + AI are combined, pre-application LO work can be largely automated
- Modern mortgage CRMs manage texts, emails, calls, and social messages from one inbox

**Top CRM Automation Capabilities Cited:**
- Total Expert: automation that pings leads if they haven't completed their application (enrollment trigger pattern — directly relevant to LoanOS drip gap)
- HighLevel: lead nurture tools + automated follow-up campaigns
- Relcu: consistent communication across all channels (email + SMS)
- Salesforce: AI-powered lead routing and contact management

**Relevance to LoanOS:**
The enrollment trigger gap identified in today's audit (0 contacts enrolled in pre-approval drip) matches an industry-known failure mode. Total Expert specifically automates this via status change events. LoanOS equivalent: trigger enrollment webhook on `stage` field change to `pre_approved`.

**Source URL:** https://empowerlo.com/blog/mortgage-marketing-guide-2026

---

## Query 2: "mortgage loan officer post close follow up automation best practices"

**Source:** [Mortgage Marketing Automation: The Complete Guide for Loan Officers | Empower LO](https://empowerlo.com/blog/mortgage-marketing-automation-guide)

### Key Findings

**Post-Close Automation Best Practices:**

1. **Review request — 7-day trigger**: Fire review request exactly 7 days after closing. Reviews compound over time and become best organic lead source. (LoanOS gap: review request has no automatic trigger — confirmed in today's audit.)

2. **Past client touchpoints — automated series:**
   - Home anniversary automation (1-year mark)
   - Quarterly check-in email/SMS
   - Equity milestone alerts
   - Birthday messages
   - Monthly rate/market update relevant to their loan profile

3. **Communication channel split:**
   - Email: longer content, relationship nurture, monthly updates
   - SMS: high-visibility, time-sensitive alerts (rate watch triggers, equity alerts)

4. **Core execution principle:** Build one system at a time. Get it running. Add the next. Loan officers building durable businesses in 2026 do five things consistently — not ten things sporadically.

**Relevance to LoanOS:**
Directly validates Gap #3 (post-close 30-day check-in) and Gap for review request automation. The 741 closed borrowers with zero touchpoints is an industry-acknowledged risk. Best practice is to start with the review request (Effort 1) + 30-day check-in (Effort 2) before building out the full anniversary/equity sequence.

**Secondary source:** [SMS vs. Email for Mortgage Lead Follow-Up | BankingBridge](https://www.bankingbridge.com/post/sms-vs-email-for-mortgage-lead-follow-up-what-converts-better-in-2025)

Key data point: Email for nurture sequences; SMS for triggered alerts. Suggests LoanOS post-close automation should lead with email but add SMS for rate watch alerts once current_rate sync is live (just shipped in today's AM session).

---

## Query 3: "n8n drip campaign enrollment trigger webhook 2026"

**Source:** [Webhook node documentation | n8n Docs](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/)

### Key Findings

**Webhook as Enrollment Trigger Pattern:**
- Webhook node is a trigger node — starts workflow when external event fires
- URL path can be customized (e.g., `/drip-enroll`) for clean integration
- Supports authentication (Header Auth, Basic Auth) — important for Supabase → n8n calls
- Response options: return immediately ("Workflow got started") or wait for last node output

**Pattern for LoanOS Drip Enrollment:**
The recommended pattern for fixing the 0-enrollment drip gap:
1. Create a dedicated n8n webhook: `POST /webhook/drip-enroll`
2. Payload: `{ contact_id, email, stage, loan_id }`
3. Webhook fires when Supabase contact `stage` changes to `pre_approved`
4. n8n receives → checks email_opt_out → calls Mailchimp API to add to pre-approval journey
5. Logs enrollment to `activity_log`

Trigger options for Step 3:
- **Option A (Supabase trigger):** Supabase Database Webhook on `contacts` table, `stage` field update
- **Option B (n8n webhook from Next.js):** POST from the loan application received workflow when stage = pre_approved
- **Option C (manual stage change):** Next.js UI posts to webhook when LO manually advances stage

Adam's decision needed: which option (maps to Open Question #1 in automation coverage audit).

**Source URL:** https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/

---

## Summary — Sources Worth Adding to NotebookLM

| URL | Reason |
|-----|--------|
| https://empowerlo.com/blog/mortgage-marketing-automation-guide | Post-close automation best practices — directly relevant to Gap #3 + review request |
| https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/ | Webhook trigger patterns — directly relevant to drip enrollment fix |

*(BankingBridge SMS/email article is secondary — skipping to stay within 3-source budget. Already have bankingbridge.com CRM article in notebook.)*
