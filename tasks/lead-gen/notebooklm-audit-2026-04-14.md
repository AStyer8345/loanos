# NotebookLM Staleness Audit — 2026-04-14 PM

## Sources Flagged as Stale
| Source | Age | Reason | Action |
|--------|-----|--------|--------|
| CONTEXT.md (Apr 14 AM) | ~18 hrs | loanos-clone CONTEXT.md modified at 21:32 today — AM version (03:57) is stale | REMOVED + REPLACED |
| notebooklm-pull-2026-04-14.md | ~18 hrs | AM pull report — superseded by PM audit + digest | REMOVED |

## Sources Confirmed Current
| Source | Age | Status |
|--------|-----|--------|
| CONTEXT.md (Apr 14 PM — refreshed) | 0 days | CURRENT — added this PM |
| 2026-04-14-calendly-workflow-update.md | 0 days | CURRENT — added by AM session |
| 2026-04-14-homepage-form-wiring.md | 0 days | CURRENT — added by AM session |
| 2026-04-13-calendly-workflow-build.md | 1 day | CURRENT |
| 2026-04-13-rate-email-template.md | 1 day | CURRENT |
| 2026-04-12-mailchimp-execution-pack.md | 2 days | CURRENT — 18-email Mailchimp execution pack |
| session-log.md | 0 days | CURRENT |
| domain-queue.md | foundational | PERMANENT |
| lessons.md | foundational | PERMANENT |
| All funnel specs (pre-approval, rate-alert, ftb-dpa, refi-watch) | 9-18 days | CURRENT |
| All Scotsman Guide + Mailchimp + CFPB web sources | various | CURRENT — within 90-day window |

## Recommended Removals (future)
- `2026-04-07-refi-watch-unblocking.md` — 7 days, initial unblocking research. Seq C still blocked (Adam). Keep for context but re-evaluate at Day 21.

## Final Count After Cleanup
- Removed: 2 (stale CONTEXT.md AM + AM pull report)
- Added: 2 (refreshed CONTEXT.md + this audit file)
- Final notebook count: 50/50

## Today's Lead Gen Work Summary (AM session)
- Homepage Quick Quote + Quick Contact forms wired to subscribe-lead.js → CRM (commit 1bb1ef1)
- Calendly workflow updated: n8n ID `PBu2Zt0YpiLHeqbL` — 8→11 nodes, added cancel branch + contact lookup (INACTIVE — Adam activates)
- All 5 Adam-owned blockers still unresolved (6th consecutive session on Set Rate)
- Refi Watch: Set Rate ⏳ (0 entries), Seq A ✅, Seq B ✅, Seq C ⏳, Seq D ⏳
- Lead gen metrics: 2 homepage forms now routed to CRM (previously Netlify-only)
