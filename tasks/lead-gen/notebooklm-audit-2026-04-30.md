# NotebookLM Staleness Audit — 2026-04-30 PM

Active Topic: Realtor Relationships drip email body drafts (Sequence B — Strategy/Architect, copy-only, AM session). PM: notebook curation only. Drip pipeline plumbed but 0 sends / 0 enrollments since per-org From: address shipped commit `4ac0812` 2026-04-29 PM.
Notebook count entering audit: 50 / 50 (at cap)

## Sources Flagged as Stale

| Source ID | Source | Reason | Action |
|-----------|--------|--------|--------|
| d9063a25 | CONTEXT.md (older version) | Local CONTEXT.md updated 2026-04-30 21:26 with org-feature-flags shipped, MISMO importer follow-ups, Recent Activity timeline, Drip widgets, Hot Lead system shipped, Manual Enrollment UI, Hold List UI, Tenant scoping hardening | REMOVE → re-add fresh Apr 30 |
| 4ad520f9 | notebooklm-audit-2026-04-29.md | Superseded by today's audit (this file) | REMOVE |
| dd2b6cdf | 2026-04-20-hot-lead-notification-gap.md | Gap analysis from before hot-lead system was built; superseded by spec (`c119d3a0`) AND the actual shipped system (commit `358d3f5` + n8n workflow `nOCDV73m4M0jyL1B`) | REMOVE — historical, now redundant |

## Sources Confirmed Current (foundational + recent + active workstreams)

| Source | Status |
|--------|--------|
| domain-queue.md | CURRENT — foundational, never remove |
| lessons.md | CURRENT — foundational, never remove |
| 2026-04-02-ftb-dpa-funnel-spec.md | CURRENT — active DPA drip workstream |
| 2026-04-05-refi-watch-funnel-spec.md | CURRENT — refi nurture spec |
| 2026-04-13-rate-email-template.md | CURRENT — single source on rate email pattern |
| 2026-04-14-calendly-workflow-update.md | CURRENT — Calendly funnel reference |
| 2026-04-14-homepage-form-wiring.md | CURRENT — funnel architecture reference |
| 2026-04-15-lead-scoring-spec.md | CURRENT — lead scoring foundation |
| 2026-04-20-hot-lead-notification-spec.md | CURRENT — build doc for shipped system |
| 2026-04-20-realtor-referral-spec.md | CURRENT — single source on realtor referral funnel |
| 2026-04-20-realtor-referral-system-research.md | CURRENT — research input to spec |
| 2026-04-23-mortgage-drip-automation-web.md | CURRENT — web research, drip automation patterns |
| 2026-04-24-imessage-speed-to-lead.md | CURRENT — open Adam-decision, single source on iMessage path |
| 2026-04-25-tcpa-sms-one-to-one-consent-web.md | CURRENT — TCPA reference for SMS speed-to-lead |
| 2026-04-26-realtor-relationship-drip-spec.md | CURRENT — spec being executed via today's drafts |
| 2026-04-27-drip-data-integrity-audit.md | CURRENT — drip pipeline audit reference |
| 2026-04-29-funnel-and-drip-status-snapshot.md | CURRENT — most recent program-wide snapshot |

## Web Research Sweep — Result

Notebook holds strong web coverage: TCPA (4/25), drip automation (4/23), nurture/drip Mailchimp guides (5+ sources), CAN-SPAM, lead-cost benchmarks, Reg Z, Scotsman Guide industry articles (~15), conversion benchmarks. No coverage gap on today's active topic (realtor relationship drip email copy). Skipped — no new web source added this session.

## Recommended Removals

3 confirmed stale (above): CONTEXT.md (older), notebooklm-audit-2026-04-29.md, 2026-04-20-hot-lead-notification-gap.md.

## Recommended Replacements

| Old | New |
|-----|-----|
| CONTEXT.md (older in-notebook) | CONTEXT.md (Apr 30 local — org-feature-flags + MISMO + drip dashboard widgets + Hold List UI + Hot Lead shipped) |
| notebooklm-audit-2026-04-29.md | notebooklm-audit-2026-04-30.md |
| 2026-04-20-hot-lead-notification-gap.md (historical) | 2026-04-30-realtor-relationships-email-bodies.md (today's drafts — Sequence B copy) |

## Final Notebook State (target)

50 - 3 removed + 3 added = 50 / 50. At cap, headroom flat.
