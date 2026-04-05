DOMAIN: Lead Generation
NOTEBOOK: LoanOS Lead Gen Intelligence
FUNNELS: Pre-approval funnel, Rate alert funnel, First-time buyer funnel, Refi watch funnel
GOAL: 20 qualified leads/month from owned channels (not paid referrals)

---

CURRENT STATE (as of 2026-03-25):

n8n AUTOMATIONS ALREADY BUILT (check CLAUDE.md for full list + IDs):
  ✅ Pre-Approval Email (utMvZpkdRwIRZ51u) — tested
  ✅ Referral Intro Email (YbgDnTpPdefcazKy) — tested
  ⚡ Website Lead Follow-up (AK1fBcaX1cPcdlGx) — fixed, needs activation
  ⚡ New Application Received (cWESnXXy9UOLB13q) — built, untested
  ⚡ Refi Intake Email (yCTydQ7RfZK4DyUg) — built, untested
  ⚡ Final CD Email (SkzrWeR0bHZs8kWX) — built, untested
  ✅ Arive → LoanOS webhook (WF1, WF2) — live (need cloud push from Adam)

WEBSITE: styermortgage.com — existing forms and landing pages need audit
CRM: LoanOS (Supabase) — contacts + loans already populated. All new leads → LoanOS via n8n.

---

ACTIVE: Lead Flow Audit + Activation
  The infrastructure exists. The question is: are the flows connected end-to-end?
  1. [ ] Test website form submission → confirm n8n fires → confirm LoanOS contact created
  2. [ ] Activate Website Lead Follow-up workflow (AK1fBcaX1cPcdlGx) — fixed but inactive
  3. [ ] Test New Application Received (cWESnXXy9UOLB13q) end-to-end with fake data
  4. [ ] Test Refi Intake Email (yCTydQ7RfZK4DyUg) end-to-end
  5. [ ] Inventory what Mailchimp sequences exist and their current open/click rates
  6. [ ] Identify which funnels have landing pages vs. which are missing pages entirely

---

QUEUE (build what doesn't exist yet):
- Rate Alert Funnel
    Rate alert signup page on styermortgage.com. Weekly automated rate email via Mailchimp.
    Segmentation: buyer vs. refi. Nurture sequence: 6 emails over 90 days.
    n8n → LoanOS contact creation. Lead Source tag: Rate Alert.
- First-Time Buyer Funnel
    Resource guide lead magnet (PDF). Opt-in page. Download delivery email.
    Drip sequence: 8 emails over 60 days. Realtor co-marketing version.
- Refi Watch Funnel
    Past client reactivation sequence. Rate drop trigger automation.
    Home equity milestone alerts. Birthday/anniversary touches.
- Realtor Referral System
    Referral tracking in LoanOS. Referral acknowledgment automation.
    Monthly realtor value report. Co-branded marketing materials.
- Lead Scoring + Routing
    Score leads by: timeline, loan amount, credit range, source.
    Auto-route hot leads to Adam immediately. Warm leads to nurture.
    Cold leads to long-term drip. Dashboard: leads by stage, source, close rate.

---

COMPLETED:
- Core automation infrastructure (n8n → LoanOS webhook flow)
- Pre-Approval Email workflow ✅
- Referral Intro Email workflow ✅
- LoanOS CRM receiving all new leads via Arive webhook (WF1/WF2)

---

COMPLIANCE:
- TCPA: SMS opt-in required before texting — opt-in checkbox must be explicit and unchecked by default
- CAN-SPAM: unsubscribe link on all emails, physical address in footer (5900 Balcones Drive, Suite 100, Austin TX 78731)
- RESPA: no referral fee arrangements in writing
- Fair lending: no targeting by protected class
- NMLS #513013 required on all landing pages and rate-related emails
- Equal Housing Lender disclosure on all landing pages and email footers
- No guaranteed approval language anywhere

---

## 2026-04-05 — LO Waitlist Capture (LoanOS stream dependency)

**Priority:** HIGH — blocks first-run gate for LoanOS content stream
**Spec reference:** `tasks/social-media/specs/2026-04-05-pillar-framework-v2.md` Section 9.2 + Section 13
**Goal:** Build a minimum-viable LO waitlist capture page + Mailchimp list + n8n intake workflow

**Deliverables:**
1. Simple landing page on styermortgage.com (path: `/loanos-waitlist` or similar) with:
   - Headline: "Building software loan officers actually want. Get on the waitlist."
   - Form fields: first name, last name, email, NMLS# (optional), company
   - Single CTA button: "Join the waitlist"
   - No fluff. No pricing. No feature list. Raw.
2. New Mailchimp list: "LoanOS Waitlist"
3. n8n workflow: form submit → Mailchimp add → Supabase log → notification to Adam
4. Form URL gets added to the Audience: LO pool entries in `loanos-pool.md` as the CTA target

**Copy approval required from Adam before deploy.** Draft the copy, commit to repo, request Adam review.

**Blocks:** LoanOS first-run gate in `tasks/social-media/plans/2026-04-05-pillar-framework-v2-plan.md` Task 14
