# NotebookLM Staleness Audit — 2026-04-27

Notebook: LoanOS Lead Gen Intelligence
ID: 4213513c-22ac-45af-96c1-3365ba3477eb
Pre-audit count: 50 / 50
Agent: Nightly NotebookLM Sync (Scheduled Task)

## Sources Flagged as Stale

| Source ID | Title | Reason | Action |
|-----------|-------|--------|--------|
| 7b5ce21c | CONTEXT.md | Apr 26 version — superseded by 2026-04-27 commits (a4e8f54 drip dashboard widgets, 3315102 drip cron secret middleware fix, 318348e Supabase Storage automation PDF route, 4f7586d contract-received JSON body fix, bc6af8a tracker wrap-up) | REPLACE |
| 5ad031f2 | notebooklm-audit-2026-04-26.md | Yesterday's audit, superseded by today's | REMOVE |
| 9ec2d41e | 2026-04-12-mailchimp-execution-pack.md | 15 days old. Mailchimp-as-drip approach was retired in favor of in-product LoanOS drip pipeline (5 campaigns shipped via authored-emails.ts + /api/drip/run cron + DB enrollments). Topic coverage retained via 5 newer sources still in notebook (Mailchimp drip-campaigns guide, drip examples, marketing automation flow, email sequence, MPA mortgage drip eMarketing) | REMOVE |

## Sources Confirmed Current

Foundational docs (permanent):
- domain-queue.md
- lessons.md
- CONTEXT.md (refreshed)

Active spec sources (all kept):
- 2026-04-02 FTB DPA funnel spec
- 2026-04-05 Refi Watch funnel spec
- 2026-04-13 rate email template
- 2026-04-14 calendly workflow update
- 2026-04-14 homepage form wiring
- 2026-04-15 lead scoring spec
- 2026-04-20 hot lead notification gap + spec
- 2026-04-20 realtor referral system research + spec
- 2026-04-24 iMessage speed-to-lead research
- 2026-04-25 TCPA SMS one-to-one consent (effective Apr 11 2026)
- 2026-04-26 realtor relationship drip spec

Recent web sources (kept; all under 30 days):
- TCPA one-to-one consent — Scotsman Guide
- Mortgage drip automation — MPA
- Realtor relationship-building x3 — Scotsman Guide
- AI/automation industry trends x3 — Scotsman Guide
- FTB market intelligence x3 — Realtor.com / Scotsman Guide
- Trigger leads law — Scotsman Guide
- Mailchimp authoritative content x6 (drip campaigns, sequences, landing pages, lead generation, automation flow, nurture campaigns)
- Reg Z (CFPB), CAN-SPAM (FTC), HUD, TDHCA — compliance & DPA foundational
- Conversion rate benchmarks (Unbounce + email marketing) x2
- Closing ratios (Scotsman Guide)
- Mortgage applications + refi-wave + lock-in effects x3 (current market state)
- Mortgage leads cost benchmarks 2026

## Recommended Removals (this session)

1. CONTEXT.md (Apr 26) → REPLACE with refreshed CONTEXT.md (Apr 27 22:00)
2. notebooklm-audit-2026-04-26.md → REMOVE (superseded by this file)
3. 2026-04-12-mailchimp-execution-pack.md → REMOVE (Mailchimp drip approach retired; in-product drip shipped)

## Replacements / Additions

| Source | Type | Reason |
|--------|------|--------|
| CONTEXT.md (refreshed) | Foundational | Captures Apr 27 state — drip dashboard widgets fully shipped (`a4e8f54` completion rate per campaign), CRON_SECRET middleware fix `3315102`, Supabase Storage automation PDF route `318348e`, contract-received JSON body fix `4f7586d`, tracker wrap-up `bc6af8a` |
| notebooklm-audit-2026-04-27.md | Audit trail | This file — required by curator playbook |
| 2026-04-27-drip-data-integrity-audit.md | Session output | AM session output. Documents 2 RPC fixes (contact_status column, loan_rate column → ct.stage / l.interest_rate), audit findings (drip_sends total = 0, 8 active campaigns / only 5 with content, 2,606 mailable contacts, 28 referring realtors), and 4 NEW Adam action items (CRON_SECRET load-bearing post-fix; Realtor Relationships activation criteria; Long-Term Nurture + Past Client Retention archive vs author decision; investigate zero `lead_source='Pre-Approval Funnel'` contacts) |

## Web Research Sweep

Skipped this session. The notebook holds 25+ web sources, most under 30 days old, covering compliance (TCPA / Reg Z / CAN-SPAM), drip automation best practices, realtor referrals, market state (refi wave, FTB markets, lock-in), and Mailchimp authoritative content. Adding more would crowd the budget without filling a gap. Will reconsider when domain-queue advances or when a specific gap surfaces (e.g., Sendblue / iMessage send infrastructure once Adam signs up).

## Web Sources Added: 0

Final notebook count target: 50 / 50.
