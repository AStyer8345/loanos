# NotebookLM Pull Report — 2026-04-02 AM
Active Topic: Week 4 — First-Time Buyer Expansion (FTB DPA Funnel)

## What We Already Know

**Funnels Live (3 total):**
- FTB Guide Funnel — wired to Mailchimp + LoanOS + n8n guide delivery
- Pre-Approval Funnel (get-preapproved.html) — TCPA-compliant, n8n PA notify live, Calendly thank-you
- Rate Alert Funnel (rate-alert.html) — 2-field opt-in, weekly rate update concept

**All 3 funnels are technically operational as of 2026-04-01.** BLOCKER-004 (LOANOS_URL env var) and BLOCKER-005 (fire-and-forget async bug) both confirmed resolved and deployed.

**Infrastructure working:**
- subscribe-lead.js captures name, email, phone, tag, lead_source, UTM params
- Creates LoanOS contact via POST to /api/contacts/web-lead
- Tags subscriber in Mailchimp (main borrower audience)
- PA funnel triggers n8n workflow J9Pe24vUi6fpZtdZ for speed-to-lead notify
- Drip enrollment via enrollInDrip() for FTB leads (campaign_id seeded)

**Current lead volume:** ~5–10 leads/month estimated (infrastructure now operational; Mailchimp Journeys still Adam's TODO)

**Database:** 466 realtor-referred contacts tracked; ~1,794 untagged; 8 total organic web leads since site launch (pre-fix era, effectively 0 conversion before fixes)

## Open Questions

1. Has Adam created the "Pre-Approval Welcome Series" Customer Journey in Mailchimp yet? (Deferred from Week 3, still in ADAM-TODO)
2. Has Adam created the "Rate Watch Welcome Series" Customer Journey in Mailchimp yet? (Same)
3. Does the FTB Expansion use a separate landing page from the existing ftb-guide page, or replace it?
4. What file is the existing FTB guide hosted on? (Likely `ftb-guide.html` or similar — needs verification before building expansion page)

## Prior Decisions

- All funnels use `subscribe-lead.js` Netlify function (single entry point, tagged by funnel)
- Lead Source tags: `pre-approval-funnel`, `rate-alert`, `ftb-guide` (existing)
- New FTB Expansion lead source tag: `ftb-dpa-guide` (DPA-specific angle)
- LoanOS contact stage: `Lead` on all web captures
- TCPA: separate unchecked checkbox required for SMS (currently no SMS active)
- All landing pages must have NMLS #513013 + Equal Housing Lender
- Adam's physical address for CAN-SPAM: 5900 Balcones Drive, Suite 100, Austin TX 78731
- Email from: adam@styermortgage.com or adam@thestyerteam.com
- Netlify site: styermortgage.com — all files go to `/Users/adamstyer/Documents/Claude/styerteam-mortgage-site`

## Lead Gen Program Priorities

1. **Week 4 (NOW):** FTB Expansion — Texas DPA programs as primary hook ("You may qualify for $15,000+ in down payment assistance")
2. **Week 5:** Refi Watch — past client reactivation (rate-drop trigger)
3. **Week 6:** Realtor Referral System
4. **Week 7:** Paid lead sources (Google Ads → funnel traffic)
5. **Week 8:** Lead scoring + routing
6. **Ongoing Adam TODO:** Mailchimp Customer Journeys (PA + Rate Watch) — blocks full funnel activation

## Briefing for Research Subagent

**Do NOT re-research:**
- Basic TCPA/CAN-SPAM compliance rules (established)
- subscribe-lead.js architecture (established)
- Pre-Approval funnel design (built)
- Rate Alert funnel design (built)
- General mortgage email benchmarks (established: 25–35% open, 3–5% CTR)

**Focus NEW research here instead:**
1. **Texas DPA programs available in 2026:** TDHCA My First Texas Home (up to 5% down payment), Travis County DPA programs, Austin Homebuyer Assistance, Southeast Texas Housing Finance Corp — which are currently funded/open?
2. **Down payment myth content angles:** What are the top 3 myths Austin FTB buyers have about down payments that cause them to delay? ("20% required", "can't combine DPA with FHA", "DPA has high income limits")
3. **FTB lead magnet best practices 2026:** PDF guide vs. video series vs. checklist — what converts best for mortgage FTB leads? Optimal page design for a DPA-focused guide download
4. **8-email nurture sequence structure for FTB DPA leads:** What topics convert? What cadence? Which emails should have strong CTAs vs. pure education?
5. **Austin FTB buyer profile:** Median income, typical down payment gap, what triggers them to take action
