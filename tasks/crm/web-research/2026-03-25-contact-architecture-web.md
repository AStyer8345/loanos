# Web Research — Contact Data Architecture
**Date:** 2026-03-25 PM
**Topic:** Contact Data Architecture Review — mortgage LO CRM best practices
**Queries run:** 3

---

## Query 1: "mortgage CRM contact record best practices 2025 2026"

**Top sources:**
- https://www.bankingbridge.com/post/2026s-top-8-mortgage-crms
- https://www.zeitro.com/blog/best-crm-for-loan-officers
- https://monday.com/blog/crm-and-sales/mortgage-crm/
- https://www.mortgageadvisortools.com/blog/best-crm-for-mortgage-lenders-in-2025/

**Key findings:**
- Contact timelines should consolidate emails, calls, and notes in one record — full interaction history before outreach
- Dynamic customer profiles should capture behavioral, demographic, and financial data for personalized content
- Mortgage CRMs that are strongest in 2026 automate follow-ups, appointment reminders, status updates, doc requests
- AI-powered income calculation and guideline checking is the defining trend for 2026
- Enhanced compliance logging (TCPA, RESPA) is now a baseline expectation, not a differentiator
- Contact segmentation by lead/loan status, source, and star rating is table stakes

**Relevance to LoanOS:** The 49-column contacts schema today lacks `lead_source`, `star_rating`, and `last_touch_at` — all of which are standard contact record fields across every major mortgage CRM reviewed.

---

## Query 2: "BNTouch Jungo Total Expert contact fields mortgage broker CRM"

**Top sources:**
- https://bntouch.com/pricing-and-features/
- https://www.mortgageadvisortools.com/blog/best-crm-for-mortgage-lenders-in-2025/
- https://leadheed.com/blog/best-mortgage-crm-software/

**Key findings:**

**BNTouch:**
- Organizes contacts by: borrower vs. partner, lead/loan status, custom groupings, star ratings, source
- Fully integrated with marketing automation and POS
- Custom groupings map directly to LoanOS's need for `contact_type` and `production_tier` segmentation

**Jungo (Salesforce-based):**
- Pre-built pipelines for purchase vs. refi
- Custom fields tailored to mortgage workflows
- Direct LOS integrations (Encompass, Calyx Point)
- Salesforce foundation means full contact field history, activity timeline, and relationship mapping are standard
- Jungo's "realtor stage" concept (prospect → active → closed) mirrors the open question in LoanOS about realtor lifecycle stages

**Total Expert:**
- Enterprise-grade, 2–8 week setup
- Known for deep loan data integrations and compliance-ready contact records
- Less relevant to a solo broker operation

**Relevance to LoanOS:** BNTouch's star rating + source segmentation and Jungo's realtor stage model both validate the field recommendations in today's architecture research.

---

## Query 3: "TCPA do not call compliance mortgage CRM 2026"

**Top sources:**
- https://activeprospect.com/blog/mortgage-tcpa-compliance-checklist/ (ADDED TO NOTEBOOK)
- https://www.pacificeast.com/blog/tcpa-in-2026-whats-changed-and-whats-still-keeping-compliance-officers-up-at-night/ (ADDED TO NOTEBOOK)
- https://www.tratta.io/blog/tcpa-consent-rule-changes
- https://tavant.com/blog/attention-mortgage-servicers-are-you-aware-new-tcpa-rules/

**Key findings:**

**TCPA 2026 consent changes (critical):**
- As of April 11, 2025: consumers can revoke consent in ANY reasonable manner (not just "STOP" keyword)
- CRM systems must automatically log consent records, store opt-in details, and flag revoked consent in real time
- Consent documentation must be stored for up to 5 years
- Mortgage servicers must obtain consent when consumers provide phone on loan application

**FCC ruling — no exemption for mortgage:**
- FCC denied exemption request — auto-dialed mortgage servicing calls to wireless numbers require prior express consent
- This means LoanOS contacts need explicit `sms_opt_in` and `email_opt_in` flags, not assumed consent

**Do-not-call practical issues:**
- "Reasonable reliance" standard for DNC compliance is narrowing — must have and actively USE a scrub system
- Phone numbers recycle faster than most databases refresh — lists 6+ months old may have meaningful % of changed numbers
- Courts are split on whether text messages = "calls" under TCPA (post-Chevron)

**CRM compliance requirements:**
- Store: consent source, consent date, opt-out date, opt-out method
- Flag revoked consent in real time (not batch)
- Scrub against DNC registry regularly — not just at acquisition

**Relevance to LoanOS architecture decisions:**
- The open question about `do_not_call` field is settled: YES, it must exist as a boolean with `do_not_call_date` and `do_not_call_reason`
- `email_opt_out` alone is insufficient — need `sms_opt_in` (positive consent) and `email_opt_in` (positive consent)
- Consent records may warrant a separate `contact_consent_log` table, not just flags on the contact record

---

## Web Sources Added to NotebookLM

| Source | Domain | Added |
|--------|--------|-------|
| Mortgage TCPA compliance checklist | activeprospect.com | YES |
| 2026's Top 8 Mortgage CRMs | bankingbridge.com | YES |
| TCPA in 2026: What's Changed | pacificeast.com | YES |

**Sources NOT added (lower authority or generic):**
- zeitro.com — affiliate-style comparison blog
- monday.com/blog — generic CRM vendor blog
- mortgageadvisortools.com — useful but less authoritative than the 3 selected
