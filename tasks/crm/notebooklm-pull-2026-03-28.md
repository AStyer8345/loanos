# NotebookLM Pull Report — CRM — 2026-03-28 AM
Active Topic: email_opt_out Enforcement (4 n8n workflows) + Realtor Relationship System Research

## What We Already Know
- LoanOS has 2,376 contacts, 854 loans (841 active)
- email_opt_out: 321 contacts (13.5%) opted out — enforced in milestone route.ts but NOT in 4 standalone n8n workflows
- Drip enrollment: built but 0 contacts enrolled (enrollment trigger never wired)
- 741 closed borrowers with no post-close automation coverage
- Contact schema (migration 060) added: do_not_call, production_tier, realtor_stage, current_rate, current_loan_balance
- WF2 now syncs closing_date + auto-syncs current_rate/balance to contacts on loan_funded status

## Realtor Relationship System (current state)
- 1,043 realtor contacts (contact_type = 'realtor')
- Realtor fields: production_tier (A/B/C replacing top_realtor/target_realtor), realtor_stage, company_name, license_number
- referred_by field links borrowers to realtors
- Smart lists: All Realtors, Top Realtors (tier NOT NULL), Target Realtors
- Automation gap: no referral volume tracking, no last-deal-together tracking, no co-marketing sent log
- 1,043 realtors with 0 automated top-of-mind touchpoints currently

## email_opt_out Compliance Gap
- Enforced: milestone route.ts (Next.js) ✓
- NOT enforced: Referral Intro (YbgDnTpPdefcazKy), Pre-Approval Email (utMvZpkdRwIRZ51u), CD Email (SkzrWeR0bHZs8kWX), Review Request (AK1fBcaX1cPcdlGx)
- Pattern to add: HTTP GET to Supabase contacts → filter by email → check email_opt_out → IF gate

## Open Questions (from prior session)
- Adam's 4 automation questions still unanswered (drip trigger, WF2 outbound architecture, review request trigger, rate watch source)

## Briefing for Builder Subagent
Do NOT re-research existing compliance gaps — they are confirmed and documented.
Focus:
1. Add email_opt_out enforcement node to 4 n8n workflows (Supabase HTTP GET → IF gate)
2. Research Realtor Relationship System — what best-in-class looks like for LO realtor management
