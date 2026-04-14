# NotebookLM Pull Report — 2026-04-12 AM
Active Topic: Mailchimp Customer Journeys — Nurture Gap Closure

## What We Already Know
- 4 funnels live and capturing leads: Pre-Approval, Rate Alert, FTB Guide, FTB DPA Guide
- All leads are tagged in Mailchimp on submission — but receive ZERO automated follow-up
- 3 Customer Journeys are designed and copy-ready (specs in tasks/lead-gen/specs/) but never built in Mailchimp UI
- Refi Watch outbound system: Set Rate, Seq A, Seq B active — but Set Rate never called (no rate in activity_log)
- Seq C (Quarterly Rate Review) INACTIVE — Adam hasn't connected Outlook credential + activated
- Seq D (Pre-Drop Warm-Up) fixed (2026-04-11 AM) but awaiting Adam's copy approval + manual trigger
- 644 past client records with closing dates — zero outbound reactivation has fired yet

## Open Questions
1. When will Adam call the Set Rate webhook to initialize Refi Watch Seq A? (zero `refi_rate_update` entries confirmed via Supabase)
2. Has Adam reviewed the Seq D warm-up email copy in tasks/lead-gen/specs/2026-04-05-refi-watch-funnel-spec.md?
3. Does the DPA Guide PDF have a hosted URL? (Needed for FTB DPA Journey Email 1)
4. Should the 3 Mailchimp journeys be turned on immediately, or does Adam want to review before activating?

## Prior Decisions
- Single Mailchimp audience + tag-based segmentation (not multiple lists) — confirmed correct
- Refi Watch rate source: Set Rate webhook (manual weekly update by Adam) — FRED API abandoned 2026-04-11
- All lead contacts route to LoanOS (Supabase), NOT Salesforce
- No SMS automation until TCPA opt-in confirmed on all forms

## Lead Gen Program Priorities
1. **Mailchimp Customer Journeys** — all 3 journeys needed; Execution Pack built today (2026-04-12)
2. **Set Rate webhook** — Adam must POST current rate to unblock Refi Watch Seq A
3. **Seq D warm-up** — irreversible, 644 contacts; Adam must approve email copy
4. **Seq C activation** — Adam must connect Outlook credential + activate
5. **DPA Guide PDF hosting** — needed for FTB DPA Journey Email 1
6. **LO Waitlist deployment** — built, pending Adam copy review + git push

## Briefing for Research Subagent
Do NOT re-research: Mailchimp Customer Journey setup (guide exists), Refi Watch workflows (all built), funnel copy (all 3 specs are done), TCPA compliance (checked and documented).

Focus new research here instead:
- Weekly rate email template — what should Adam's Friday rate email look like going forward?
- Lead scoring thresholds — when should a Rate Watch subscriber get a personal follow-up vs. just continuing the sequence?
- Post-Calendly-booking workflow — what happens after a lead books a 15-min call? Is there a confirmation/reminder n8n workflow?
