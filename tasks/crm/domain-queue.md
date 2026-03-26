# LoanOS CRM Program
# Schedule: 6:00 AM daily
# Notebook: LoanOS CRM Intelligence

DOMAIN: LoanOS CRM
NOTEBOOK: LoanOS CRM Intelligence
CURRENT STACK: LoanOS (Supabase) — primary and active. LoanOS IS the CRM.
GOAL: Make LoanOS the most effective CRM a mortgage LO could use — better organized, better data, better automations than anything Adam's used before.

---

WHAT THIS PROGRAM IS:

NOT: data migration (done — 2,377 contacts and 817+ loans live in LoanOS)
YES: continuously improving LoanOS as a CRM product using best practices

Each session reviews one area of the CRM through this lens:
  → What information is actually important for a mortgage LO to have?
  → What's noise, clutter, or just taking up space?
  → What's the best way to organize this?
  → What are top-performing LOs doing in their CRMs that Adam isn't?
  → What automations, views, or workflows would make Adam's daily use faster/better?

This is a product excellence program, not a build-from-scratch program.
LoanOS exists. We're making it great.

---

CURRENT STATE (as of 2026-03-25):
  Contacts: 2,377 records in LoanOS ✅
  Loans: 817+ historical + Arive webhook for new ✅
  n8n automations: mostly live (see CLAUDE.md for full list)
  UI gaps: pagination cap (1,877 contacts unreachable past page ~120), "Closed Borrowers" smart list bug
  Data gaps: phone normalization raw, some contacts missing key fields

---

ACTIVE: Contact Data Architecture Review

  The question: what information actually matters for a mortgage LO contact record?
  What should every contact have? What's optional? What's irrelevant?

  Review LoanOS contact schema against:
  1. What top-performing LOs track in their CRMs (research best practices)
  2. What Adam actually uses day-to-day (read contacts table, look at populated vs. empty fields)
  3. What triggers automations (what fields does n8n read to decide who gets what communication?)
  4. What's missing that would make LoanOS more useful (e.g., last_rate_shopped, home_anniversary, pre_approval_expiry)

  Output: concrete recommendations for:
  - Fields to add (with data type + why)
  - Fields to remove or archive (never populated, never used)
  - Smart list definitions that actually matter (hot buyers, past clients due for refi review, realtors not referred in 90 days)
  - UI organization improvements (what should be above the fold on a contact record?)

---

QUEUE (review each area in sequence):
- Loan Pipeline Organization
    What stages make sense? Are there too many or too few?
    What information should be visible at a glance per loan?
    What's buried that should surface?
    Compare to best-in-class LOS CRM views (Encompass, Byte, SimpleNexus pipeline views)

- Automation Coverage Audit
    Map every meaningful event in a borrower's life (pre-approval, rate lock, CTC, funding, 1yr anniversary)
    For each: does an n8n automation exist? Is it working? Is the timing right? Is the message good?
    Identify gaps — what should be automated that isn't?

- Realtor Relationship System
    Realtors are a primary lead source. What does a great realtor CRM look like?
    Referral volume tracking, last deal together, co-marketing materials sent, GBP reviews requested.
    What smart lists and automations would help Adam stay top of mind with top referring realtors?

- Smart Lists + Segmentation
    Build the definitive set of smart lists Adam should use daily:
    Hot Buyers (pre-approved, searching), Watch List (rate-sensitive refis), Past Client (1yr+ since closing),
    Realtor (top 20 by referral volume), Cold Lead (12+ months no activity)
    Each list needs: query logic + automation trigger + recommended outreach frequency

- Data Quality Program
    Which contacts are missing critical fields? (email, phone, contact type, source)
    What's the right way to normalize phone formats in the existing data?
    Build a "contact completeness score" and surface incomplete records

- Reporting + Insights
    What reports would tell Adam if his business is healthy?
    Pipeline velocity (avg days from lead to funded), lead source ROI, realtor production rankings,
    close rate by source, avg loan amount trend. What's buildable in LoanOS now?

---

COMPLETED:
- Data migration (contacts + loans in LoanOS) ✅
- Core n8n automations built ✅
- Multi-tenancy foundation ✅

---

COMPLIANCE:
- GLBA: no financial data written to non-encrypted destinations
- Janie access scope: active files only, never full contact database
- Data retention: loan records 7 years minimum
- All data modifications logged in activity_log
