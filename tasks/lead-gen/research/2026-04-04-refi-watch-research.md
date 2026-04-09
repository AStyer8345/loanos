# Research: Refi Watch Funnel — Lead Generation
Date: 2026-04-04

## Executive Summary

The Refi Watch Funnel targets Adam's past clients (borrowers with closed loans) to generate reactivation business: refinances, cash-out refis, and HELOCs. LoanOS has 644 loans with a closing_date — this is the real audience size, not the 17 "funded" status records which reflect only recent Arive-tracked loans. With Austin's 2026 refinance market at ~6.11% (30yr) and 11 of 17 recently tracked loans originated at rates ≥ 6.75%, there's an immediate refinanceable cohort when rates dip another 25–50bps. The funnel architecture must be email-only (not SMS), driven by scheduled n8n queries rather than inbound webhooks, and must avoid rate-specific promises per Regulation Z.

---

## Industry Benchmarks

**Past client reactivation:**
- Past clients are the cheapest, highest-converting lead source available — 0 acquisition cost
- Reactivation email sequences from databases 12–36 months old produce deals costing "almost nothing" (Octavius.ai, 2026)
- Quarterly "check-in" sequences to clients from the past 1–3 years outperform cold outbound by 3–5x in response rate
- Brokers who maintain consistent post-close contact retain 70%+ of their database for future business vs. 23% for those who don't

**Rate drop response rate:**
- Personalized "your rate vs. today's rate" emails see 3–5x higher click-through than generic market update emails
- Including the borrower's actual loan number and original rate in the subject line lifts open rates by 40–60%
- Leads contacted within 5 minutes of showing intent are 21x more likely to convert — applies here to click-through on a rate comparison CTA

**Austin equity position (2026):**
- Homeowners who bought before 2021 may have seen equity double (Neuhaus Realty Group)
- Austin prices dropped ~2.1% YOY but remain significantly above 2019–2020 baselines
- Equity-rich homeowners (LTV < 60%) are prime HELOC or cash-out refi candidates despite current rate environment

**Current rate environment (April 2026):**
- 30yr fixed: ~6.11% (Texas average, March 2026, Bankrate)
- 15yr fixed: ~5.95%
- HELOC: 7.85–9.50% (variable, tied to prime at 7.50%)
- Cash-out refi: typically 0.25–0.50% above rate-and-term rate
- Rate forecast: market pricing in 1–2 additional Fed cuts in 2026; refinance activity expected to pick up if 30yr drops below 6.0%

---

## LoanOS Data Audit — Past Client Audience

### What's in the database
- **854 total loan records**
- **644 with closing_date** — this is the maximum past client audience for Refi Watch
- **17 with status = "funded" or funding_date** — recently tracked Arive-synced loans
  - All 17 have borrower_email ✅
  - All 17 have interest_rate ✅
  - Avg rate: 6.676% | Min: 5.625% | Max: 7.125%
  - 11 of 17 have rate ≥ 6.75% → prime refi candidates if market drops to 6.0–6.25%
  - 3 of 17 have rate < 6.5% → not rate-refi candidates; equity/HELOC angle instead
  - Only 1 of 17 has appraised_value populated — equity calculation requires external data or borrower input
- **contacts table** — borrower_email tied to contact_id in loans; this is the outreach channel

### Segmentation strategy

**Segment A — Rate Refi Candidates (immediate)**
Query: `funding_date IS NOT NULL AND interest_rate >= 6.75`
Current count: 11 loans
Trigger: When current market 30yr rate drops to ≤ 6.0% (≥0.75% spread from their rate)
Message: "Your rate is X.XX%. Austin's 30-year rate is now Y.YY%. Here's what your new payment could look like."
n8n: Scheduled workflow checks market rate daily (via API or manual input). When threshold hit → query LoanOS for Segment A → send Outlook/n8n email to each.

**Segment B — Anniversary Check-in (evergreen)**
Query: `closing_date IS NOT NULL AND EXTRACT(MONTH FROM closing_date) = EXTRACT(MONTH FROM NOW())`
Current count: ~54 loans/month average (644 / 12)
Trigger: Closing anniversary month
Message: "It's been [X] year(s) since we closed your loan. Here's how the Austin market has shifted — and whether it makes sense to review your mortgage."
n8n: Schedule trigger monthly → query loans where closing_date month = current month → send email.

**Segment C — Equity Milestone (deferred — requires enrichment)**
Query: Would need current property value estimate (AVM). Not available in LoanOS today.
Data source needed: Automated Valuation Model API (e.g., Attom, CoreLogic) or manual entry.
Deferred: This segment requires data enrichment. Flag for Week 5 Architect spec.

**Segment D — Pre-Rate-Drop Warm-Up (new)**
Query: All past clients not already in active sequence.
Timing: Send NOW before rates drop to position Adam as the advisor to call when the time is right.
Message: "Rates haven't dropped yet. But here's how to know when refinancing makes sense for you."
This builds the "top of mind" relationship so Adam gets the call first when rates move.

---

## Austin Refinance Market Conditions (2026)

- **Rate environment:** 30yr fixed at ~6.11% (April 2026). Has been range-bound 5.99–6.63% YTD.
- **The "lock-in effect":** Homeowners who locked at sub-4% (2020–2022) have no rate incentive to move — but equity-based products (HELOC, cash-out refi for home improvement or debt consolidation) are gaining traction.
- **The 2023–2024 cohort:** Buyers who bought at 7.0–8.0% (the peak) are now 2–3 years in. Every 50bps rate drop makes them a refinance candidate. 11 of Adam's 17 LoanOS-tracked loans are in this cohort.
- **HELOC note:** Texas HELOC rates (7.85–9.50%) are currently higher than cash-out refi rates (~6.4–6.6%). The market is shifting toward cash-out refi for lump-sum needs.
- **Trigger lead ban (effective March 4, 2026):** The Homebuyers Privacy Protection Act limits the sale of mortgage trigger leads tied to credit inquiries. This makes past-client reactivation MORE valuable — Adam's own database is immune to this regulation.

---

## Competitor Landscape

Austin competitors (independent LOs and broker shops) are not systematically running past-client reactivation sequences based on rate triggers. Most rely on:
- Generic monthly market newsletters (low engagement, not personalized)
- Birthday/holiday texts (personal touch, no financial hook)
- Annual CMA emails (real estate focused, not rate focused)

**Gap Adam can own:** A personalized, data-driven "your rate vs. today's rate" email that includes the borrower's actual original rate and a quick monthly payment comparison. This requires the LoanOS data Adam already has. No competitor has this asset.

---

## Compliance Requirements

**CAN-SPAM (email):** All emails must include:
1. Accurate from address (adam@thestyerteam.com or adam@styermortgage.com)
2. Honest subject line — no "Your rate just dropped" if the borrower's rate did not technically drop (it's the market rate that dropped)
3. Physical address: 5900 Balcones Drive, Suite 100, Austin TX 78731
4. Clear unsubscribe mechanism (Mailchimp handles this automatically)
Past clients are NOT unsolicited — this is an existing business relationship. CAN-SPAM compliance is straightforward here.

**TCPA (SMS):** DO NOT send SMS to past clients without explicit opt-in confirmation. Past client SMS opt-in status is unknown in LoanOS. Email-only for this funnel.

**Regulation Z / advertising:** Any specific rate mentioned in email marketing must be accompanied by APR disclosure. The safest approach: do NOT quote specific current rates in email copy — instead use directional language ("rates have moved meaningfully lower") and send them to a landing page where full disclosures appear.

**Fair Lending:** Past-client reactivation targeting all borrowers in the database equally. No protected class filtering. ✅

**NMLS disclosure:** NMLS #513013 and "Adam Styer | Mortgage Solutions LP" required on the landing page the email links to. Not required in every email body, but best practice to include in footer.

---

## Recommended Approach

### Phase 1 — Anniversary Sequence (build first, highest volume)
- Monthly automated email to every past client on their closing anniversary month
- No rate data required — works on all 644 loans with closing_date
- Content: market update + equity check-in + CTA to book a free mortgage review
- Built via: n8n Schedule Trigger → Supabase query → Outlook send (or Mailchimp for unsubscribe compliance)
- Build complexity: LOW

### Phase 2 — Rate Drop Alert (build second, highest intent)
- Triggered when market 30yr rate drops to threshold below borrower's original rate
- Targets Segment A: 11 current LoanOS-tracked loans at ≥6.75%
- Personalized with borrower's actual rate and a payment comparison
- Built via: n8n Schedule Trigger daily → check market rate (manual input or API) → IF threshold hit → query Segment A → send personalized emails
- Build complexity: MEDIUM (requires rate comparison logic in n8n)

### Phase 3 — Pre-Drop Warm-Up Email (send once, immediately)
- Single email blast to all past clients: "Rates haven't dropped yet. Here's when to refinance."
- Positions Adam as the expert before rates move
- Builds opt-in for rate alert list (link to rate-alert.html signup)
- Can be sent via Mailchimp to full past-client segment today
- Build complexity: LOW

### Phase 4 — Equity Milestone Alerts (deferred)
- Requires AVM data or manual property value entry
- Deferred until data enrichment strategy decided
- Flag: Attom API (~$0.20/record/month) could automate this at scale

---

## Gap Analysis

| Gap | Impact | Priority |
|-----|--------|----------|
| appraised_value missing on 643 of 644 loans | Can't auto-calculate equity for Segment C | LOW (deferred) |
| TCPA opt-in status unknown for past clients | Can't use SMS for reactivation | MEDIUM (email-only workaround) |
| Market rate input for trigger | n8n rate-drop workflow needs a rate source | MEDIUM — weekly manual input or API |
| 627 of 644 loans have null status/milestone | Audience segmentation falls back to closing_date | LOW — closing_date is sufficient |
| No AVM integration | Equity milestone alerts not possible without it | MEDIUM — defer to Phase 4 |
| Mailchimp past-client segment doesn't exist yet | Anniversary + warm-up emails need a Mailchimp audience segment for "past client" tag | MEDIUM — n8n can tag contacts on anniversary query |

---

## Open Questions (for Architect to resolve)

1. **Rate source for trigger:** How should n8n determine "current 30yr rate"? Options: (a) Adam inputs rate manually each week, (b) scrape Mortgage News Daily or Bankrate, (c) use a rate API. Manual is safest, cheapest. Which does Adam prefer?

2. **Mailchimp vs. Outlook for reactivation emails:** Past-client emails are CAN-SPAM regulated (need unsubscribe). Should these go through Mailchimp (unsubscribe handled automatically) or Outlook via n8n (requires manual unsubscribe list management)? Mailchimp is cleaner for compliance.

3. **Rate drop threshold:** What spread triggers a Segment A outreach? 0.5%? 0.75%? 1.0%? Smaller spread = more outreach, smaller savings. Recommended: 0.75% (e.g., if borrower is at 7.0%, trigger when market hits 6.25%).

4. **Equity strategy decision:** Is Attom AVM API worth the cost to enable equity milestone alerts? At 644 past clients × $0.20/month = ~$128/month. One refi referral pays for 5+ years. Decision needed before Architect designs Phase 4.

5. **Opt-out handling:** Do any past clients need to be manually excluded? (Withdrawn, declined, angry past clients.) Should there be a "do not contact" flag in the LoanOS contacts table before launching reactivation sequence?
