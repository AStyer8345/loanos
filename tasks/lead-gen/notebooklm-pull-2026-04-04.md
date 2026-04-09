# NotebookLM Pull Report — 2026-04-04 AM
Active Topic: Week 4 QA Check + Week 5 Refi Watch Funnel Research

## What We Already Know

**Lead source baseline:** ~2,331 contacts in LoanOS. 77% untagged ("Other"/null). Only realtor referrals cleanly tracked (466 contacts). Website has captured only 8 leads total since launch — historical due to a broken submit handler that's now fixed and deployed.

**Funnels built (code-complete):**
- FTB Guide Funnel ✅ (live, n8n welcome email active)
- Pre-Approval Funnel ✅ (live, Mailchimp journey PENDING Adam)
- Rate Alert Funnel ✅ (live, Mailchimp journey PENDING Adam)
- FTB DPA Guide Funnel ✅ (deployed — CONFIRMED LIVE as of 2026-04-04 session check)

**n8n automations touching leads:**
- `J9Pe24vUi6fpZtdZ` — Pre-Approval Lead Notify (fires on PA + DPA leads) ✅
- `utMvZpkdRwIRZ51u` — Pre-Approval Email ✅
- `PiuIsQpBuydtFM4m` — Web Lead Automation ✅
- `yTkiV6pf2eZaJw82` — FTB Guide Welcome Email ✅

**Resolved blockers:** BLOCKER-002 (prequal form fix), BLOCKER-003 (deploy), BLOCKER-004 (LOANOS_URL env var), BLOCKER-005 (fire-and-forget await bug) — all confirmed resolved.

**Active blocker:** BLOCKER-001 (TCPA on homepage Quick Quote/Quick Contact forms) — LOW, no SMS live.

## Open Questions

1. Have Mailchimp Customer Journeys been created for: Pre-Approval Welcome Series (tag: `pre-approval-funnel`), Rate Watch Welcome Series (tag: `rate-alert`), FTB DPA Guide Welcome Series (tag: `ftb-dpa-guide`)? All 3 are still `[ ]` in ADAM-TODO.
2. Has the Austin DPA Guide PDF been hosted? PDF exists at `tasks/lead-gen/assets/Austin-FTB-DPA-Guide-2026.pdf` — needs Google Drive or Netlify URL before funnel promotion.
3. Has TSAHC income/purchase price limit been verified at tsahc.org? (Spec uses 2025 effective figures.)

## Prior Decisions

- All new leads → LoanOS (Supabase) via subscribe-lead.js + n8n. Not Salesforce.
- Mailchimp handles nurture email sequences; n8n handles real-time LO notification.
- DPA leads excluded from LoanOS drip; routed to Mailchimp Journey instead.
- Week 1 rule satisfied — no new funnels built before audit complete.
- FTB DPA Guide funnel is email-only (no SMS), no TCPA checkbox required.
- Refi Watch Funnel is Week 5 — research-only until spec is approved.

## Lead Gen Program Priorities

1. ⚠️ Adam's Mailchimp tasks (3 journeys + 1 recurring campaign) — blocking lead nurture for 3 of 4 live funnels
2. ⚠️ PDF hosting + funnel promotion for FTB DPA Guide
3. Homepage Quick Quote / Quick Contact form wiring (BLOCKER-001)
4. Week 5 research: Refi Watch Funnel (past client reactivation)
5. Week 6: Realtor Referral System

## Briefing for Research Subagent

Do NOT re-research:
- Austin DPA programs (TSAHC, TDHCA, City of Austin) — fully documented in 2026-04-02 research
- PA funnel design or TCPA consent logic — complete
- Rate alert funnel mechanics — complete
- subscribe-lead.js architecture — complete and stable

Focus NEW research on:
- Past client reactivation strategies for mortgage (Refi Watch Funnel mechanics)
- Rate drop trigger automation patterns (n8n + Mailchimp, not SMS-based)
- Home equity milestone alerts — what data is needed and where to get it
- Anniversary/birthday touch sequences — mortgage industry best practices
- Austin refinance market 2026 — current conditions, rate environment, HELOC vs. cash-out refi demand
- Segmentation strategy: how to identify refinanceable past clients from LoanOS loans table
