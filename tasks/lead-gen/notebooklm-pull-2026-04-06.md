# NotebookLM Pull Report — 2026-04-06 AM
Active Topic: LO Waitlist Capture + Refi Watch Builder (if unblocked)

## What We Already Know

**Lead source baseline:**
- ~2,331 contacts in LoanOS; 77% untagged or "Other" — no clean source attribution
- Website has captured only ~8 total leads historically (broken form issue now resolved/deployed)
- Realtor referrals remain primary lead source (466 cleanly tagged contacts)
- 741 closed loans in system; lead_source field almost entirely null on historical records

**Funnels built and deployed (confirmed live):**
- FTB Guide Funnel ✅ (live, n8n welcome email active)
- Pre-Approval Funnel ✅ (live, Mailchimp journey PENDING Adam)
- Rate Alert Funnel ✅ (live, Mailchimp journey PENDING Adam)
- FTB DPA Guide Funnel ✅ (deployed 2026-04-03, Mailchimp journey PENDING Adam)

**Resolved blockers:** BLOCKER-002, 003, 004, 005 — all confirmed resolved and deployed.

**Refi Watch spec complete (2026-04-05):**
- 3 n8n sequences designed: Sequence A (Rate Drop Alert), B (Anniversary Check-In), D (Pre-Drop Warm-Up)
- Platform decision: n8n → Outlook (personal feel, past clients only)
- 644 past clients in database; 11 immediate candidates (rate ≥6.75%)
- Full email copy written; Reg Z compliant
- BLOCKED: Pending Adam's rate source decision (Option A/B/C) + email copy approval

**New HIGH priority item added 2026-04-05:**
- LO Waitlist Capture page for styermortgage.com — blocks LoanOS content stream launch
- Spec: domain-queue.md Section "2026-04-05 LO Waitlist Capture"
- Deliverables: landing page (/loanos-waitlist), Mailchimp list "LoanOS Waitlist", n8n workflow

## Open Questions

1. **Refi Watch rate source** — Adam has not responded to [ ] in ADAM-TODO.md. Options A (manual webhook), B (FRED API), C (paid API). Builder cannot wire Sequence A without this decision.
2. **Refi Watch email copy approval** — Sequence D goes to 644 past clients. Irreversible. Adam must approve before Builder activates.
3. **Mailchimp Customer Journeys** — 3 journeys still not created (PA, Rate Watch, DPA). All funnel nurture is dead without these. Flagged as BLOCKER-006.
4. **DPA Guide PDF hosting** — PDF exists locally, needs hosted URL before DPA funnel can be promoted.
5. **BLOCKER-001** — Homepage Quick Quote/Contact TCPA forms still need fix (LOW risk, no SMS live).
6. **LO Waitlist copy approval** — New landing page needs Adam review before deploy (per domain-queue.md spec).

## Prior Decisions

- n8n → Outlook (not Mailchimp) for Refi Watch past-client sequences — personal feel appropriate
- Email-only for Refi Watch (no SMS) — TCPA constraint
- LO Waitlist: Mailchimp list + Supabase log + Outlook notification to Adam
- All web assets in HTML/CSS/JS (not WordPress/Webflow)
- Funnel copy must include NMLS #513013 + Equal Housing Lender disclosure
- Supabase (LoanOS) is the CRM destination for all leads — not Salesforce

## Lead Gen Program Priorities

1. **LO Waitlist page** — HIGH, not blocked, can build today (Sequence C)
2. **Refi Watch Builder** — blocked on Adam decisions; resume once decisions made
3. **Mailchimp Customer Journeys** — Adam action, cannot be automated
4. **Homepage TCPA forms** — LOW risk, can bundle with next homepage build session
5. **Week 6 (Realtor Referral System)** — do not advance until Refi Watch B+D deployed

## Briefing for Today's Session

**Do NOT re-research:**
- Refi Watch audience segmentation (644 past clients, 4 segments, all designed)
- PA / Rate Alert / DPA / FTB funnels (all live, no changes needed)
- TCPA/CAN-SPAM compliance framework (established and applied to all funnels)
- n8n → Outlook architecture for past-client reactivation (decided)

**Focus for today's build (LO Waitlist):**
- What Mailchimp list setup is needed (single list "LoanOS Waitlist", fields: fname, lname, email, NMLS#, company)
- What n8n workflow connects form submit → Mailchimp add → Supabase log → Outlook notify
- Landing page copy per domain-queue.md spec (draft for Adam approval, commit, request review)
- Verify no existing LO Waitlist page exists on styermortgage.com before building
