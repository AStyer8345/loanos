# Research: Week 1 Current State Audit — Lead Generation
Date: 2026-03-25

---

## Executive Summary

Adam has a solid owned-channel foundation that most LOs lack: a professional website with 136+ reviews, a clean pre-approval form, and a full n8n automation stack for active pipeline communications. The critical gap is **top-of-funnel lead capture** — there is no email list nurture system, no lead magnet, and no Mailchimp sequences confirmed as active. The website converts visitors who are already ready to apply but does nothing to capture and warm the "not ready yet" majority. The highest-priority build for Week 2 is not a new landing page — it's connecting what already exists (the web form) to a real automated nurture sequence. The TCPA compliance issue with bundled SMS consent must be fixed before any SMS follow-up is wired.

---

## Industry Benchmarks

### Cost Per Lead by Channel (2026)
| Channel | CPL Range | Notes |
|---------|-----------|-------|
| Referral (realtor/sphere) | ~$0 (time cost only) | Highest close rate (20–30%+) |
| Organic web (SEO + form) | $5–20 (time/hosting) | Close rate 5–15% for warm organic |
| Google Ads | $50–150 | Requires active management; exclusive leads |
| Facebook/Instagram Lead Ads | $20–60 | Shared or exclusive depending on setup |
| Zillow Premier Agent (Austin) | $150–250+ per lead | 1–3% close rate; major metro = extremely expensive |
| LendingTree/Bankrate | $30–100 | Shared with 5+ lenders; very low close rate |
| Aged purchased leads | $0.25–1.25 | Often <1% close rate |

### Close Rate by Source
| Source | Close Rate |
|--------|-----------|
| Referral (trusted) | 20–30%+ |
| Organic web leads | 5–15% |
| Google Ads leads | 3–8% |
| Paid marketplace (Zillow/LT) | 1–3% |
| Cold purchased | <1% |

### Response Time Impact (critical)
- Leads contacted within **5 minutes**: **21x** more likely to convert vs. 30-minute response
- Leads contacted within 1 hour: 7x more likely than 24-hour response
- This is the single highest-leverage variable Adam already has automated (Pre-Approval Email n8n workflow fires immediately)

### Email Marketing Benchmarks (Business + Finance — Mailchimp 2023)
| Metric | Industry Average |
|--------|----------------|
| Open Rate | 31.35% |
| Click Rate | 2.78% |
| Unsubscribe Rate | 0.15% |

### Landing Page Conversion Benchmarks (Mortgage)
- Dedicated mortgage opt-in pages with targeted traffic: **15–25%** conversion rate
- Generic homepage form: **2–5%** (most traffic doesn't convert on first visit)
- Above-fold CTA placement: 3–5x higher conversion than below-fold

---

## Competitor Landscape

### What Austin Competitors Are Doing (observed patterns)
- Most Austin mortgage LO websites follow the same playbook: hero + "Get Pre-Approved" button, testimonials, loan programs list, contact form.
- Fairway Independent Mortgage, LoanPeople, and large bank branches dominate Zillow in Austin — independent brokers have low ROI on Zillow here.
- Very few Austin independent brokers have dedicated lead magnet funnels (first-time buyer guides, rate alert signups) — this is an **unclaimed opportunity**.
- Most do NOT have automated email nurture sequences from web form submissions — the standard is: form submits → LO gets an email → LO calls manually.

### What Adam Has That Competitors Don't
- **136+ Google/Zillow reviews at 5.0 stars** — significant trust signal, rare for independents
- **Live automation infrastructure** (n8n, Supabase) — most LOs have nothing automated
- **21-day average close prominently displayed** — strong differentiator

### Competitor Gaps Adam Can Own
1. **First-time buyer email course** — no Austin independent broker appears to have a lead magnet targeting FTBs with ongoing nurture
2. **Rate alert subscription** — very few local LOs have a public rate alert signup; most email rate updates only to existing database
3. **"Am I ready to buy?" quiz/tool** — no competitor offers a self-qualification tool that captures email before showing results

---

## Platform / Channel Best Practices

### Landing Pages (HTML/Netlify)
- **Form fields**: 5-field maximum for top-of-funnel (Name, Email, Phone, Purchase Price, Timeline). More fields = lower conversion. Save detailed qualification for the consultation call.
- **Above-fold rule**: Primary CTA must be visible without scrolling on both desktop and mobile. Currently met on homepage.
- **Trust signals above fold**: Review count + star rating, NMLS number, years in business. Currently met on homepage.
- **Thank-you page**: Must redirect to a confirmation page (not just a form clear). Confirmation page should: (1) set expectations for next steps, (2) offer Calendly scheduling, (3) reinforce trust. `/get-preapproved` form status unknown — check if Netlify Forms is configured with redirect.
- **Mobile-first**: The majority of mortgage web traffic is now mobile. Forms must be tap-friendly (large input fields, large submit button).

### Mailchimp Automation (Best Practices 2026)
- Welcome sequence: Send within 5 minutes of opt-in. Email 1 should be personal, not promotional.
- Sequence cadence for mortgage: Email 1 (immediate) → Email 2 (day 3) → Email 3 (day 7) → Email 4 (day 14) → Email 5 (day 30) → Monthly nurture
- Segmentation: Minimum two segments — **buyers** (purchase intent) vs. **refis** (existing homeowner). Content and frequency differ significantly.
- Subject line formula for mortgage: personalization + specificity + curiosity → "[First Name], here's why Austin buyers are locking rates today"
- **Open rate target**: 31%+ (Business/Finance benchmark). Below 20% = deliverability or subject line problem.
- CAN-SPAM footer required: physical address (5900 Balcones Drive, Suite 100, Austin TX 78731) + unsubscribe link on every send.

### n8n Lead Routing (Best Practice)
- 5-minute notification rule: any new web form submission should trigger an immediate SMS or push notification to Adam's phone
- Salesforce contact creation should happen automatically from web form (via Zapier or n8n webhook)
- Lead source tagging in Salesforce is essential for close rate tracking — every lead must have a source field populated at creation

### UTM Tracking
- Every external link to styermortgage.com should carry UTM parameters: `utm_source`, `utm_medium`, `utm_campaign`
- Without UTMs, Salesforce/Mailchimp cannot report which channel is converting
- Priority: add UTMs to all social profiles, email signatures, and Mailchimp links before any paid spend

---

## Compliance Requirements

### TCPA (SMS) — BLOCKER ACTIVE
- **Current state**: /get-preapproved bundles SMS consent with general contact agreement — NOT best practice
- **Required fix**: Separate unchecked SMS opt-in checkbox before any SMS workflow is wired
- See BLOCKERS.md → BLOCKER-001
- **Rule**: NEVER connect any n8n SMS workflow to web form leads until BLOCKER-001 is resolved

### CAN-SPAM (Email)
- Status: APPEARS COMPLIANT — footer has Equal Housing Lender language + NMLS #513013
- Verify: Mailchimp templates (when created) must include physical address and unsubscribe link
- Required footer: "5900 Balcones Drive, Suite 100, Austin TX 78731 | NMLS #513013 | Adam Styer | Mortgage Solutions LP | Equal Housing Lender | [Unsubscribe]"

### NMLS + Texas Disclosure
- styermortgage.com: NMLS #513013 present on homepage and /get-preapproved ✅
- Equal Housing Lender: present in footer ✅
- All new landing pages must carry same disclosures before going live

### Rate Advertising (Reg Z)
- If any email or landing page mentions a specific rate, APR must also be displayed
- Cannot use "pre-approved" language in marketing in a way that implies certainty
- No guaranteed approval language anywhere

---

## Performance Data — Adam's Current State

### Website (styermortgage.com) — Observed
| Element | Status |
|---------|--------|
| Homepage form | Live — Name, Email, Phone, Loan Goal |
| /get-preapproved form | Live — 5 fields, TCPA bundled (see BLOCKER-001) |
| /products page | Live — all loan types with individual CTAs |
| NMLS disclosure | Present on all pages checked ✅ |
| Equal Housing | Footer on all pages ✅ |
| Thank-you page | Not verified — unknown if Netlify Forms sends to confirmation URL |
| UTM tracking | Not visible — no UTM parameters observed on form destination links |
| Current traffic/conversion | No data available — no analytics access |
| Rate alert signup | Not present |
| Lead magnet | Not present |
| Email list opt-in | Not present (forms go directly to pre-approval, no nurture capture) |

### Mailchimp — Current State
| Element | Status |
|---------|--------|
| Active audiences | UNKNOWN — no Mailchimp API access |
| Active sequences | UNKNOWN — referenced as tool in use but no sequences documented |
| List size | UNKNOWN |
| Open/click rates | UNKNOWN |
| **Action required** | Adam must provide Mailchimp audience + automation status before Week 3 build |

### Salesforce/Jungo — Lead Source Distribution
| Element | Status |
|---------|--------|
| Total contacts | 2,441 imported |
| Total loans | 816 imported (≈90.5% closed) |
| Lead source breakdown | UNKNOWN — no query run |
| Close rate by source | UNKNOWN |
| **Action required** | Run Salesforce report: Closed Loans by Lead Source (last 24 months) |

### n8n Automations Touching Leads (Live)
| Workflow | ID | Status | Trigger |
|----------|----|---------|----|
| Arive New Loan → Supabase | 1tagvoU0UXtdDiMY | ✅ Tested (WF1 push pending) | Zapier → Arive new loan |
| Arive Status Update → Supabase | 9JyzzwKac8v3uQ7d | ✅ Tested (WF2 push pending) | Zapier → Arive status change |
| Milestone Communication Agent | 1hjOmS7inZcxEJQr | ✅ Tested | Arive milestone events |
| Pre-Approval Email | utMvZpkdRwIRZ51u | ✅ Tested | PA PDF upload to Supabase |
| Referral Intro Email | YbgDnTpPdefcazKy | ✅ Tested | Manual paste trigger |
| New Application Received | cWESnXXy9UOLB13q | Untested | 1003 PDF upload to Supabase |
| Refi Intake Email | yCTydQ7RfZK4DyUg | Untested | IFW PDF upload |
| Final CD Email | SkzrWeR0bHZs8kWX | Untested | CD PDF upload |
| Contract Automation | — | ✅ Live | Contract PDF upload |
| **Web Lead → n8n notification** | None | ❌ NOT BUILT | styermortgage.com form submit |
| **Web Lead → Salesforce** | None | ❌ NOT BUILT | styermortgage.com form submit |

**Critical gap**: Web form submissions from styermortgage.com have NO automation. No Salesforce contact creation, no LO notification, no Mailchimp add. Form data goes to... unknown destination.

---

## Recommended Approach

**The biggest gap is not a missing funnel — it's a missing connection between the existing web form and the automation stack.**

Priority order:
1. **Before Week 2 build**: Confirm where styermortgage.com form submissions currently go. Is Netlify Forms receiving them? Is Adam getting an email notification? Are they appearing in Salesforce?
2. **Week 2 primary goal**: Wire the existing /get-preapproved form to: (a) immediate Salesforce contact creation via Zapier, (b) immediate email notification to Adam, (c) Mailchimp "Web Lead Buyer" audience add
3. **Fix BLOCKER-001** before adding any SMS follow-up to web leads
4. **Week 3**: Build Mailchimp rate alert sequence (buyer + refi segments) — this is the highest-ROI owned channel not yet built
5. **Do NOT invest in Zillow** — Austin market CPL is $150–250+ with 1–3% close rate. First-party owned leads at $5–20 CPL with 5–15% close rate will have 10–30x better ROI.

---

## Gap Analysis

| Gap | Current State | Best-in-Class | Priority |
|-----|--------------|--------------|----------|
| Web form → automation | No connection | Immediate Salesforce + notify + Mailchimp add | 🔴 HIGH |
| TCPA SMS consent | Bundled opt-in | Separate unchecked checkbox | 🔴 HIGH (BLOCKER-001) |
| Email nurture sequences | None confirmed | 5–8 email welcome + nurture per segment | 🔴 HIGH |
| Lead source tracking (UTM) | None visible | UTMs on all external links | 🟡 MEDIUM |
| Lead magnet / content offer | None | First-time buyer guide, rate alert signup | 🟡 MEDIUM |
| Mailchimp audience setup | Unknown | Buyer + Refi + Past Client segments | 🟡 MEDIUM |
| Salesforce close rate by source | Unknown | Monthly tracking report | 🟡 MEDIUM |
| Thank-you page confirmation | Unknown | Redirects to confirmation with Calendly | 🟡 MEDIUM |
| Rate alert signup page | None | Dedicated opt-in + weekly Mailchimp email | 🟡 MEDIUM |
| Lead scoring | None | Score by timeline + loan amount + source | 🟢 LOW (Week 8) |

---

## Open Questions

1. **Where do styermortgage.com form submissions currently go?** — Is Netlify Forms active? Does Adam receive an email notification? This must be answered before Week 2 build.
2. **Is Mailchimp active at all?** — What audiences exist, what sequences (if any) are live, what is the current list size and engagement rate?
3. **What is Adam's Zillow Premier Agent monthly spend?** — Need dollar figure + leads per month to calculate actual CPL and determine ROI.
4. **What is the Salesforce lead source breakdown?** — Run a "Closed Loans by Lead Source (last 24 months)" report to establish the real baseline.
5. **Does styermortgage.com have Google Analytics or Plausible configured?** — Without traffic data, conversion rate improvements cannot be measured.
6. **BLOCKER-001 resolution timeline**: When can Adam update the /get-preapproved form TCPA language? This gates any SMS automation build.
