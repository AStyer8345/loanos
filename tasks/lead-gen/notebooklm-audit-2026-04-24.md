# NotebookLM Staleness Audit — 2026-04-24

Active Topic: Drip campaigns + speed-to-lead (GOALS.md priority for week of 2026-04-20)
Notebook: LoanOS Lead Gen Intelligence
Total sources before audit: 50/50 (cap)

## Sources Flagged as Stale

| Source | Age | Reason | Action |
|--------|-----|--------|--------|
| notebooklm-audit-2026-04-23.md | 1 day | Superseded by today's audit | REMOVE |
| CONTEXT.md (Apr 22 version) | 2 days | loanos-clone CONTEXT.md modified 2026-04-24 21:32 — drip Hold List UI + iMessage research + mobile swipe scenarios + standup | REPLACE |
| 2026-03-27-pre-approval-funnel-spec.md | 28 days | Oldest spec, superseded by deployed PA drip workflow + Mailchimp execution pack | REMOVE |

## Sources Confirmed Current

| Source | Age | Status |
|--------|-----|--------|
| domain-queue.md | foundational | CURRENT (never remove) |
| lessons.md | foundational | CURRENT (never remove) |
| 2026-04-23-mortgage-drip-automation-web.md | 1 day | CURRENT (drip work active) |
| 2026-04-20-realtor-referral-spec.md | 4 days | CURRENT |
| 2026-04-20-hot-lead-notification-gap.md | 4 days | CURRENT |
| 2026-04-20-hot-lead-notification-spec.md | 4 days | CURRENT |
| 2026-04-15-lead-scoring-spec.md | 9 days | CURRENT |
| 2026-04-14-homepage-form-wiring.md | 10 days | CURRENT |
| 2026-04-13-rate-email-template.md | 11 days | CURRENT |
| 2026-04-12-mailchimp-execution-pack.md | 12 days | CURRENT |

## Recommended Removals

1. notebooklm-audit-2026-04-23.md — daily audit churn; only most recent kept
2. CONTEXT.md (Apr 22) — replaced by Apr 24 CONTEXT.md (drip Hold List UI shipped, iMessage research added, suppressions API live, scenarios Tier 8 complete)
3. 2026-03-27-pre-approval-funnel-spec.md — first-draft PA funnel spec; the live PA drip is now the source of truth (see lessons.md + Mailchimp execution pack + drip-shipping changelog)

## Recommended Replacements

- CONTEXT.md (old) → CONTEXT.md (Apr 24 — drip Hold List + suppressions API + iMessage research + mobile swipe cards)

## Notes

- Notebook at cap (50/50). Net change: -3 + 3 = 50 (still at cap).
- Active sprint: drip campaign reliability + speed-to-lead (per GOALS.md, week of 2026-04-20)
- Today's new research file: 2026-04-24-imessage-speed-to-lead.md (Sendblue recommended over BlueBubbles/Twilio)
- Foundational docs kept: domain-queue.md, lessons.md, CONTEXT.md
