# NotebookLM Pull Report — 2026-03-29 AM
Active Topic: Week 3 — Rate Alert Funnel Builder

## What We Already Know

**Lead sources:** Adam's business is overwhelmingly referral-driven (466 Realtor Referral contacts vs. only 8 from the website). Organic web leads close at 5–15%; Zillow/marketplace leads close at 1–3% with poor ROI for Austin. 77% of the database (1,794 contacts) has null/Other lead source — close-rate-by-source not yet computable.

**Funnels built:**
- FTB Guide Funnel: Only fully wired funnel live (subscribe-lead.js → Mailchimp → LoanOS → n8n guide email)
- Pre-Approval Funnel: Code complete (get-preapproved.html, thank-you.html, subscribe-lead.js updated), n8n workflow J9Pe24vUi6fpZtdZ ACTIVE, QA PASSED WITH CAVEATS — blocked on Adam's git push + Mailchimp Journey creation
- prequal.html: BLOCKER-002 resolved in code (fetch() handler present) — pending deploy only

**Rate Alert Funnel:** Research complete (2026-03-28-rate-alert-funnel-research.md) and spec complete (2026-03-28-rate-alert-funnel-spec.md). Key architecture decisions locked:
- Landing page: rate-alert.html — 2 fields only (first name + email), "Austin Rate Watch" offer
- Zero backend changes: subscribe-lead.js handles tag='rate-alert' + lead_source='Rate Alert Funnel' with no code changes
- thank-you.html: minor mod for ?type=rate-alert query param
- austin-mortgage-rates.html: secondary CTA added
- 4-email Mailchimp welcome sequence with full copy written (Days 0, 3, 7, 14)
- No SMS TCPA checkbox needed (email-only funnel)

## Open Questions

- BLOCKER-003: PA Funnel still not deployed (Adam has not run git push)
- Mailchimp "Pre-Approval Welcome Series" Customer Journey: not yet created (Adam action, Mailchimp UI)
- Rate Watch Weekly Friday Mailchimp campaign: Adam must create recurring campaign
- Homepage Quick Quote + Quick Contact TCPA/wiring: still pending (low urgency — no SMS wired)

## Prior Decisions

- Frictionless opt-in pattern established: 2-field forms (email + first name) for early-funnel pages; phone only when higher intent shown (PA funnel, prequal)
- subscribe-lead.js is the universal lead handler — no new backend functions needed for Rate Alert
- All new leads route to LoanOS (not Salesforce)
- Sequence C (Execute) applies today — spec is complete and approved

## Lead Gen Program Priorities

1. **NOW**: Build Rate Alert Funnel (rate-alert.html + thank-you.html mod + austin-mortgage-rates.html CTA) — spec ready
2. **Adam action pending**: git push styerteam-mortgage-site to deploy PA funnel + prequal fix
3. **Adam action pending**: Create Mailchimp Journeys (PA Welcome Series + Rate Watch Welcome Series)
4. **Week 4 next**: First-Time Buyer Funnel expansion
5. **Ongoing**: Homepage form wiring (BLOCKER-001 remaining)

## Briefing for Builder Subagent

Do NOT re-research — execute the spec directly:
- Spec file: tasks/lead-gen/specs/2026-03-28-rate-alert-funnel-spec.md
- Reference existing patterns: subscribe-lead.js (no changes needed), thank-you.html (minor mod only)
- Site repo: /Users/adamstyer/Documents/Claude/styerteam-mortgage-site
- Zero backend changes — this is HTML/JS only
- BLOCKER-003 gates deployment but NOT code write — build the files, Adam deploys
