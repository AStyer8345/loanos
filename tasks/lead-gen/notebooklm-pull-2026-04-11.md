# NotebookLM Pull Report — 2026-04-11 AM
Active Topic: Refi Watch — Seq D bug fix + verification + system health

## What We Already Know
- All 5 Refi Watch workflows are built. 3 are ACTIVE (Set Rate, Seq A, Seq B). 2 are INACTIVE (Seq C — pending Outlook verification by Adam; Seq D — has org_id bug blocking trigger).
- Seq A runs daily at 7am CT and checks activity_log for a refi_rate_update entry. If current rate ≤ 6.00% AND borrower rate ≥ 6.75%, it sends a personalized rate drop alert via Outlook.
- Set Rate webhook is ACTIVE — Adam needs to POST current rate to initialize it (or it may already have been called).
- Pre-Approval, Rate Alert, and FTB DPA funnels are all live on styermortgage.com. Backend capture works (Mailchimp + LoanOS). Mailchimp Customer Journey nurture sequences not yet created (manual task for Adam).
- TCPA BLOCKER-001 partially resolved — get-preapproved and prequal.html fixed, pending git push by Adam. Homepage forms not yet audited.

## Open Questions
- Has Adam called the Set Rate webhook with a real rate? (Seq A is active but fires no emails if no rate is in activity_log)
- Has Seq A actually sent any emails since being activated 2026-04-09?
- Did Adam activate Seq C (Quarterly Rate Review) after connecting Outlook?
- Seq D bug: org_id `45a5b7e8-...` needs to be corrected to `18613f82-...` — agent-actionable today

## Prior Decisions
- Rate source: Set Rate webhook (manual, weekly) — not FRED API. FRED was deprioritized since Option A works.
- Rate trigger: 0.75% spread (borrower ≥ 6.75%, market ≤ 6.00%) — confirmed in Seq A build
- 90-day dedup: covers all 4 refi actions (rate_drop_alert, anniversary_checkin, refi_warmup, quarterly_rate_review)
- CAN-SPAM footer: 5900 Balcones Drive Suite 100, Austin TX 78731 on all refi emails

## Lead Gen Program Priorities
1. Fix Seq D org_id bug (agent — 5 min)
2. Verify Seq A has run (check n8n execution history)
3. Verify Set Rate webhook has been called (check activity_log for refi_rate_update)
4. Flag Seq D as ready-to-trigger once bug is fixed
5. Mailchimp Customer Journeys still pending (Adam manual task — surfaced 5+ sessions)

## Briefing for Research Subagent
Not running research this session — this is a pure maintenance/verification session. Do NOT re-research:
- Refi Watch funnel design (fully specced and built)
- Rate trigger logic (decided and implemented)
- Mailchimp Customer Journey setup (guide already written in research files)
Focus new research only if: unexpected blockers arise requiring external tool documentation
