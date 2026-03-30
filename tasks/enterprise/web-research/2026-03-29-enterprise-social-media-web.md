# Web Research — Enterprise Social Media + White-Label (PM Session)
Date: 2026-03-29
Session: loanos-enterprise-pm (20:48 CDT)
Topic: Enterprise Social Media for mortgage LOs + White-Label domain management

---

## Source 1
**Title:** Four Keys To A Successful, Compliant Social Media Strategy
**URL:** https://mortgageorb.com/four-keys-to-a-successful-compliant-social-media-strategy
**Relevance:** High — directly addresses LO social compliance requirements
**Summary:**
A compliant LO social strategy requires: (1) a written policy aligned with Reg Z, CAN-SPAM, TCPA; (2) NMLS number published on every post; (3) designated compliance oversight with monitoring; (4) training so no LO can claim ignorance. The LoanOS Enterprise Social Media module needs a Compliance Profile component that stores the LO's NMLS number, disclaimer language, and auto-appends it to generated posts.

---

## Source 2
**Title:** Implementing Social Media Policies for Loan Officers
**URL:** https://www.housingwire.com/articles/how-los-can-capitalize-on-social-media-channels-while-remaining-compliant/
**Relevance:** High — policy framework for per-tenant compliance profiles
**Summary:**
LOs hesitant to post due to compliance risk need structure, not silence. A defined strategy with a compliance policy prevents both regulatory violations and reputational risk. Key disclosure requirements: NMLS number on all posts, no misleading rate claims, RESPA anti-kickback vigilance in referral partner content. The LoanOS compliance profile wizard should pre-fill NMLS from the org record and surface required disclosures in the post generator.

---

## Source 3
**Title:** 16 Mortgage Marketing Strategies Loan Officers Need in 2026
**URL:** https://www.housingwire.com/articles/mortgage-marketing-ideas/
**Relevance:** Medium — defines content types LOs actually post
**Summary:**
In 2026, video is the primary format (batch-record 3 x 60-second clips per week on TikTok/LinkedIn/Reels). Monthly themes drive consistency: first-time buyer tips, refinance insights, local market news. The content pillar picker in the Enterprise Social module should include these specific pillar types as defaults — don't make LOs invent them from scratch.

---

## Source 4
**Title:** Domain Management for Multi-Tenant — Vercel Docs
**URL:** https://vercel.com/docs/multi-tenant/domain-management
**Relevance:** High — directly needed for White-Label Session 2 (subdomain routing)
**Summary:**
Vercel requires nameserver method (ns1/ns2.vercel-dns.com) for wildcard *.domain.com coverage — CNAME alone cannot provision wildcard SSL certs. Custom domains per tenant are provisioned programmatically via the Vercel REST API (`POST /v1/projects/{id}/domains`). SSL is auto-issued per subdomain. For loanos.app wildcard routing: Adam must confirm NS records point to Vercel nameservers before Session 2 can be built.

---

## Source 5
**Title:** SaaS Onboarding Flow: 10 Best Practices That Reduce Churn (2026)
**URL:** https://designrevision.com/blog/saas-onboarding-best-practices
**Relevance:** Medium — Voice Guide Wizard UX patterns
**Summary:**
Highest-converting onboarding wizards ask a single routing question that reshapes the downstream experience (HubSpot model). Natural language input outperforms click-through for complex preference capture. The LoanOS Voice Guide Wizard (first step of Enterprise Social Media module) should ask 2-3 natural language questions ("Describe your ideal client in 1-2 sentences") and use Claude to synthesize the voice guide — not a 10-step form.

---

## Key Takeaways for Enterprise Social Media Build

1. **Compliance auto-append is non-negotiable** — NMLS number + disclaimer must auto-attach to every generated post. Store in compliance_profile table per org.
2. **Default content pillars ship with the product** — Don't blank-slate it. Pre-seed: First-Time Buyer Education, Refinance Awareness, Market Conditions, Personal Story, Client Wins.
3. **Voice Guide Wizard = 2-3 NL questions + Claude synthesis** — Not a long form. Faster = more completions.
4. **White-Label Session 2 DNS prerequisite** — Confirm loanos.app uses Vercel nameservers before building subdomain middleware. Block builds on this.
