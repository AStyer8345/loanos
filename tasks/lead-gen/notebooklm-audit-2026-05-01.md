# NotebookLM Staleness Audit — 2026-05-01 (PM)

Notebook: LoanOS Lead Gen Intelligence
Notebook ID: 4213513c-22ac-45af-96c1-3365ba3477eb
Pre-audit source count: 50 / 50

## Sources Flagged as Stale

| Source | Source ID | Age | Reason | Action |
|--------|-----------|-----|--------|--------|
| CONTEXT.md (loanos-clone) | 29d6da50-afbd-4c66-a7dd-be31236b23f4 | added Apr 30 | Superseded by today's commits c4fee70 (PM autonomous wrap-up — May 1 launch day, tracker hygiene) + ec9659a (per-org UI feature flags for Scott Pilot) + d6fb6e7 + others | REPLACE |
| notebooklm-audit-2026-04-30.md | c4000254-a4d2-4954-9536-fd9fa994d21e | 1 day | Superseded by this audit; daily audits churn | REMOVE |
| 2026-04-23-mortgage-drip-automation-web.md | b9c77187-9595-4134-a10d-dcdc2bc66a50 | 8 days | Drip topic over-covered: 5 Mailchimp authoritative sources (Marketing Automation Flow, Drip Campaign Examples, Email Sequence, Build Relationships Nurture, Drip Marketing Campaign) + 1 Mortgage Pro + 1 Scotsman = 7 better sources on this exact topic | REMOVE |

## Sources Confirmed Current

| Source | Status |
|--------|--------|
| domain-queue.md (83d563e9) | CURRENT — foundational, never remove |
| lessons.md (3a6b24a1) | CURRENT — foundational, never remove |
| 2026-04-30-realtor-relationships-email-bodies.md (afdbe2fe) | CURRENT — yesterday's drafts, active work |
| 2026-04-29-funnel-and-drip-status-snapshot.md (1d89f594) | CURRENT — still the most recent funnel/drip status snapshot pre-today |
| 2026-04-27-drip-data-integrity-audit.md (30670c61) | CURRENT — referenced by today's research re: 0 enrollments / 0 sends |
| 2026-04-26-realtor-relationship-drip-spec.md (6c190f22) | CURRENT — spec referenced by 04-30 drafts |
| 2026-04-25-tcpa-sms-one-to-one-consent-web.md (49f3233c) | CURRENT — TCPA topic, only authoritative source |
| 2026-04-24-imessage-speed-to-lead.md (c8807dde) | CURRENT — outbound iMessage exploration, GOALS.md priority |
| 2026-04-20 / 2026-04-15 / 2026-04-14 / 2026-04-13 / 2026-04-05 / 2026-04-02 specs | CURRENT — all unique funnel/feature specs, no duplicates |
| All Scotsman Guide + Mailchimp + CFPB + HUD + TDHCA + FTC web sources | CURRENT — authoritative coverage retained |

## Recommended Removals

1. CONTEXT.md (29d6da50) — replace with refreshed version. Local file at `/Users/adamstyer/Documents/loanos-clone/CONTEXT.md` reflects today's commits.
2. notebooklm-audit-2026-04-30.md (c4000254) — yesterday's audit, superseded.
3. 2026-04-23-mortgage-drip-automation-web.md (b9c77187) — duplicated by 7 better authoritative sources on drip automation.

## Recommended Replacements

- Old CONTEXT.md (29d6da50) → refreshed CONTEXT.md @ HEAD (commit c4fee70 + ec9659a + d6fb6e7)
- Old audit (c4000254) → notebooklm-audit-2026-05-01.md (this file)
- Old web duplicate (b9c77187) → today's `2026-05-01-get-preapproved-conversion-audit.md` (Sequence A research file with 20 prioritized findings)

## Web Research Sweep

Skipped — notebook holds 28 authoritative web sources covering Mailchimp drip / Scotsman Guide industry / TCPA / CFPB Reg Z / FTC CAN-SPAM / TDHCA / HUD / Unbounce conversion. Coverage strong; no targeted gap surfaced for today's active topic (`/get-preapproved.html` on-page conversion). Defer until a real gap emerges.

## Post-Audit Plan

- Remove: 3 (CONTEXT.md, notebooklm-audit-2026-04-30.md, 2026-04-23-mortgage-drip-automation-web.md)
- Add: 3 (refreshed CONTEXT.md, this audit file, today's research file `2026-05-01-get-preapproved-conversion-audit.md`)
- Final count target: 50 / 50

## Carryover Adam Action Items (no new this session)

- BLOCKER-003 partial: PA + Rate Alert funnels code-complete — verify deploy status
- BLOCKER-001 partial: Homepage Quick Quote + Quick Contact TCPA audit + subscribe-lead.js wiring (bundle with next deploy)
- Drip pipeline: 0 sends / 0 enrollments since 5 weeks (per-org From: address shipped 2026-04-29 commit 4ac0812) — pipeline plumbed, awaiting first enrollment
- Realtor Relationships drip cadence + activation criterion (4 email bodies drafted 2026-04-30, only remaining blockers)
- Outbound iMessage solution path decision (BlueBubbles / Sendblue / AppleScript / n8n)
- 5 HIGH-tier `/get-preapproved.html` conversion findings ready to ship (H1 headline + form purchase-price qualifier + testimonial author specificity + clickable review chip + hero rate/time anchor)
