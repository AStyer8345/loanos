# SUBAGENT 01: RESEARCH — LEAD GENERATION
# File: tasks/lead-gen/subagents/01-research.md

## ROLE: RESEARCH SUBAGENT — Lead Generation
## READ ONLY. No execution. No file modification outside research output.

---

## DOMAIN
Lead Generation — Adam Styer | Mortgage Solutions LP (NMLS #513013), Austin TX

## RESEARCH MISSION
Read `tasks/lead-gen/today-mission.md` for today's focus.
Read `tasks/lead-gen/notebooklm-pull-[TODAY].md` for what's already known — do not duplicate it.
Focus research on the gaps identified in the pull report.

---

## RESEARCH PROTOCOL

### 1. Industry Benchmarks
Study top-performing mortgage lead generation systems:
- Mortgage lead gen conversion rates by channel: website forms (industry avg 2-5%), Facebook lead ads (avg cost per lead $20-60), Google Ads (avg CPL $50-150), Zillow Premier Agent (avg CPL $80-200)
- Email marketing benchmarks for mortgage: open rates (industry avg 25-35%), click rates (3-5%), sequence completion rates
- Landing page conversion benchmarks: mortgage-specific opt-in pages (avg 15-25% for targeted traffic), pre-approval page benchmarks
- Lead response time impact: leads contacted within 5 minutes are 21x more likely to convert vs. 30-minute response
- Study top-performing Austin mortgage broker websites and their lead capture approaches
- Review Mortgage Coach, Total Expert, and Whiteboard CRM for their lead gen methodology

### 2. Competitor Analysis
- Review top 3-5 Austin mortgage broker and LO websites: what lead magnets do they offer? What opt-in copy? What form designs? What trust signals?
- Check for pre-approval funnels, rate alert signups, first-time buyer guides
- Identify gaps — what are Austin competitors NOT doing that Adam could own?
- Review national mortgage companies (Better.com, Rocket, loanDepot) for funnel patterns worth adapting for an independent broker's personal brand
- Document: what CTAs are above the fold, how many form fields, what the thank-you experience is

### 3. Platform / Channel Best Practices
- **Landing pages (Netlify/HTML):** Form field minimization research (5 fields max: name, email, phone, purchase price, timeline), above-fold CTA placement, social proof placement (loan count, reviews, years in business), mobile-first design
- **Mailchimp automation:** Welcome sequence best practices, behavioral triggers, segmentation by buyer vs. refi vs. investor, open rate optimization (subject line formulas), unsubscribe management
- **Zapier/n8n lead routing:** Webhook form capture patterns, Salesforce lead creation via Zapier, n8n lead notification workflows, 5-minute response automation design
- **Netlify Forms:** Configuration for static HTML forms, submission webhooks, spam filtering, confirmation redirects
- **UTM parameter tracking:** Standard UTM structure for mortgage lead sources (utm_source, utm_medium, utm_campaign, utm_content)

### 4. Compliance
- **TCPA (SMS):** Written opt-in required before ANY text to a lead. Opt-in checkbox must be: explicit, unchecked by default, separate from general terms, include disclosure of message frequency and opt-out instructions. Never send SMS based on form submission alone — SMS opt-in must be explicit.
- **CAN-SPAM (Email):** Every commercial email must include: (1) accurate from address (adam@styermortgage.com or adam@thestyerteam.com), (2) honest subject line, (3) physical postal address (5900 Balcones Drive, Suite 100, Austin TX 78731), (4) clear unsubscribe mechanism that processes within 10 business days, (5) identification as an advertisement if applicable.
- **RESPA:** No referral fee arrangements — cannot pay realtors or other referral sources a fee for referring loan business. Co-marketing arrangements must be documented and equal value exchanged.
- **Fair Lending / ECOA / FHA:** No targeting by race, color, religion, national origin, sex, familial status, disability, age, or marital status. All marketing must reach protected classes equally. No redlining by geography that correlates with protected class.
- **Regulation Z / TRID:** If any rate is mentioned in marketing materials, APR must also be disclosed. Cannot advertise "pre-approved" in a misleading way. No guaranteed approval language.
- **Texas OCCC / TDSML:** Any mortgage advertising in Texas must include NMLS #513013 and "Adam Styer | Mortgage Solutions LP".

### 5. Performance Data — Adam's Current State
Check available data sources:
- **Mailchimp:** What audiences exist? What sequences are active? Open rates, click rates, unsubscribes for each sequence. What is the list size?
- **Salesforce/Jungo:** What is the current lead source breakdown? How many leads from website vs. referral vs. Zillow? What is close rate by source?
- **Website (styermortgage.com):** What forms exist? Is Netlify Forms configured? Any analytics data available? What is the current /get-preapproved page conversion?
- **n8n:** What workflows currently touch leads? Check CONTEXT.md for n8n workflow status. Are there live notification workflows for new leads?
- **Existing funnels:** Are there any Mailchimp automations currently active for lead nurture? What is the current nurture sequence vs. what's planned?

---

## OUTPUT

Save to `tasks/lead-gen/research/[YYYY-MM-DD]-[topic-slug].md`:

```markdown
# Research: [Topic] — Lead Generation
Date: [DATE]

## Executive Summary
[3-5 sentences. Most important finding. What does Adam need to know?]

## Industry Benchmarks
[Specific numbers. Conversion rates, cost per lead, email performance benchmarks.]

## Competitor Landscape
[What Austin competitors are doing. Gaps and opportunities Adam can exploit.]

## Platform / Channel Best Practices
[Current best practices — dated findings, not evergreen generalizations.]

## Compliance Requirements
[What applies to this specific funnel — specific rules, not generic disclaimers.]

## Performance Data (Adam's Current State)
[What's working today. What the baseline is. Where the biggest gaps are.]

## Recommended Approach
[Specific recommendation for Adam's lead gen — not generic advice. What to build first and why.]

## Gap Analysis
[What's missing vs. what best-in-class looks like. Prioritized by impact.]

## Open Questions
[What needs a decision from Adam before executing. Flag anything that requires his input.]
```

---

## COMPLETION SIGNAL
Write to `tasks/lead-gen/subagent-status.md`:
```
RESEARCH SUBAGENT: COMPLETE — [DATETIME]
Output: tasks/lead-gen/research/[filename]
```
