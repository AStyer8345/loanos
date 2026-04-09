# NotebookLM Pull Report — 2026-04-05 AM
Active Topic: Week 5 — Refi Watch Funnel Architecture

## What We Already Know

**Lead source baseline:**
- ~2,441 contacts in LoanOS; 77% untagged or "Other" — no clean source attribution
- Website has captured only ~8 total leads historically (broken form issue now resolved)
- Realtor referrals remain primary lead source (466 cleanly tagged contacts)

**Funnels built and deployed (confirmed live):**
- FTB Guide Funnel ✅ (live, n8n welcome email active)
- Pre-Approval Funnel ✅ (live, Mailchimp journey PENDING Adam)
- Rate Alert Funnel ✅ (live, Mailchimp journey PENDING Adam)
- FTB DPA Guide Funnel ✅ (deployed 2026-04-03, Mailchimp journey PENDING Adam)

**Resolved blockers:** BLOCKER-002, 003, 004, 005 — all confirmed resolved and deployed.
**Active blocker:** BLOCKER-001 (TCPA on homepage Quick Quote/Quick Contact forms) — LOW, no SMS live.

**Refi Watch research complete (2026-04-04):**
- 644 past clients with closing_date in LoanOS — confirmed real audience
- 4-segment strategy designed: Segment A (rate refi, 11 immediate candidates), Segment B (anniversary check-in, ~54/month), Segment C (equity milestone, deferred — needs AVM data), Segment D (pre-rate-drop warm-up, entire database)
- Current 30yr rate: ~6.11%; 11 of 17 recently tracked loans at ≥6.75% = prime refi candidates at rate 6.0%
- Competitive gap: no local LO is systematizing personalized "your rate vs. today's rate" emails
- Architecture constraints: email-only (no SMS), n8n scheduled trigger not webhook, Regulation Z no rate promises

## Open Questions

1. **Mailchimp Customer Journeys** — 3 journeys still not created by Adam (PA, Rate Watch, FTB DPA). All 3 are `[ ]` in ADAM-TODO. Funnel nurture is not functioning until these are created.
2. **DPA Guide PDF hosting** — PDF exists at `tasks/lead-gen/assets/Austin-FTB-DPA-Guide-2026.pdf`. Needs hosting URL before DPA funnel can be promoted.
3. **TSAHC income/purchase price limit verification** — spec uses 2025 figures; must verify current at tsahc.org before promoting DPA funnel.
4. **Rate source for Segment A trigger** — manual weekly input vs. paid API (Optimal Blue, FRED). Decision needed before Refi Watch n8n can be built.
5. **Email platform for reactivation sends** — Mailchimp (unsubscribe compliance) vs. Outlook (personal feel). Architect to make recommendation.
6. **noindex decision for `/get-preapproved`** — still unresolved from prior sessions.

## Prior Decisions

- All new leads → LoanOS (Supabase), not Salesforce
- Mailchimp handles nurture sequences; n8n handles real-time LO notification
- Rate Alert is email-only; FTB DPA Guide is email-only
- Refi Watch Funnel is email-only (no SMS until TCPA consent confirmed for past clients)
- Week 5 = Refi Watch Funnel — architect is next step (research complete)

## Lead Gen Program Priorities

1. ⚠️ **Adam's Mailchimp tasks** (3 journeys + 1 recurring campaign) — blocking nurture for 3/4 live funnels
2. ⚠️ **DPA Guide PDF hosting** — funnel built but unpromotable without the PDF URL
3. **Refi Watch Funnel Architect** — design spec based on 2026-04-04 research — TODAY'S FOCUS
4. **Homepage Quick Quote / Quick Contact wiring** — BLOCKER-001, low urgency
5. **Week 6: Realtor Referral System** — next in queue after Refi Watch spec

## Briefing for Architect Subagent

Do NOT re-design:
- Any of the 4 live funnels (FTB Guide, PA Funnel, Rate Alert, DPA Guide)
- subscribe-lead.js (stable — no changes needed for Refi Watch which is outbound, not inbound)
- Mailchimp welcome sequence structure (established pattern)

Focus architecture on:
- How n8n reads LoanOS loans table and sends outbound reactivation emails
- Segment B (Anniversary) execution in n8n — monthly scheduled trigger, date-based query
- Segment D (Pre-Rate-Drop Warm-Up) — one-time sequence to full 644-person database
- Segment A (Rate Refi) — conditional trigger when market rate threshold is met
- Email copy strategy: personal, not promotional; no rate-specific promises (Reg Z); conversational tone matching Adam's brand
- Recommendation on Mailchimp vs. Outlook for reactivation sends
- What Adam must do manually vs. what n8n can automate
