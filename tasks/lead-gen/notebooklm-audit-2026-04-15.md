# NotebookLM Staleness Audit — 2026-04-15

## Count Correction
AM session reported 65 sources but actual notebook count was 50/50 (AM session miscount).
PM session target: maintain 50/50 with standard 3-for-3 swap.

## Sources Flagged as Stale
| Source | Age | Reason | Action |
|--------|-----|--------|--------|
| notebooklm-audit-2026-04-14.md | 1 day | Superseded by today's audit (Apr 15) | REMOVED |
| CONTEXT.md (Apr 14) | 1 day | LoanOS CONTEXT.md modified today: email-automation shadow mode shipped, Resend/Outlook swap (commits cbd5b87, 1a7bd75, e2a0af6) | REMOVED + REPLACED |
| session-log.md (Apr 14 snapshot) | 1 day | Rolling daily log — outdated snapshot, replaced by fresh session-log.md | REMOVED + REPLACED |

## Sources Confirmed Current
| Source | Age | Status |
|--------|-----|--------|
| CONTEXT.md (Apr 15 — refreshed) | 0 days | CURRENT — added this PM |
| 2026-04-15-lead-scoring-spec.md | 0 days | CURRENT — AM session spec, adding (was missing from notebook despite AM report) |
| notebooklm-audit-2026-04-15.md | 0 days | CURRENT — this file |
| 2026-04-14-calendly-workflow-update.md | 1 day | CURRENT |
| 2026-04-14-homepage-form-wiring.md | 1 day | CURRENT |
| 2026-04-13-rate-email-template.md | 2 days | CURRENT |
| 2026-04-13-calendly-workflow-build.md | 2 days | CURRENT |
| 2026-04-12-mailchimp-execution-pack.md | 3 days | CURRENT |
| domain-queue.md | 21 days | CURRENT (foundational — permanent) |
| lessons.md | 21 days | CURRENT (foundational — permanent) |
| All Mailchimp docs, CFPB, Scotsman Guide web sources | various | CURRENT — within 90-day review |

## Recommended Replacements
- CONTEXT.md (Apr 14) → CONTEXT.md (Apr 15) ✅ DONE
- session-log.md (Apr 14) → fresh session-log.md ✅ DONE

## New Sources Added
- CONTEXT.md (Apr 15) — email-automation shadow mode shipped, Resend swap, per-LO drafts UI
- notebooklm-audit-2026-04-15.md — this audit file
- 2026-04-15-lead-scoring-spec.md — lead scoring spec from AM session (catch-up add)

## Final Count After Cleanup
- Removed: 3 (audit-2026-04-14.md, CONTEXT.md Apr 14, session-log.md Apr 14)
- Added: 3 (refreshed CONTEXT.md Apr 15, this audit, lead-scoring-spec.md)
- Final notebook count: 50/50
- AM session count discrepancy: 65 was incorrect — actual was 50/50

## Today's Lead Gen Work Summary
- AM session: Lead scoring spec built (spec at tasks/lead-gen/specs/2026-04-15-lead-scoring-spec.md)
- Homepage forms verified live: Quick Quote + Quick Contact → subscribe-lead.js
- Set Rate: RESOLVED (6.37%, first ever, called 2026-04-14 18:09 UTC)
- Seq A: Functional (market 6.37% > threshold 6.00% → exits cleanly)
- Seq C: Still INACTIVE (Outlook credential — Adam-owned)
- Calendly: Still INACTIVE (no webhook configured — Adam-owned)
- LoanOS: email-automation shadow mode SHIPPED — Resend sends now land in activity_log
