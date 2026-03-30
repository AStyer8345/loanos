# NotebookLM Pull Report — 2026-03-30 AM
Active Topic: Week 3 Post-Deploy QA — Rate Alert Funnel + PA Funnel

## What We Already Know

- **Pre-Approval Funnel**: Built week of 2026-03-27. Landing page (get-preapproved.html) with 5-field form, TCPA two-checkbox pattern, n8n workflow J9Pe24vUi6fpZtdZ (ACTIVE). Deployed on 2026-03-29 (commit 1b3f0be). Pending: Mailchimp "Pre-Approval Welcome Series" Customer Journey (Adam must create in UI).
- **Rate Alert Funnel**: Built 2026-03-29. rate-alert.html (NEW), thank-you.html (modified), austin-mortgage-rates.html (modified). Deployed 2026-03-29 in same commit. Pending: Mailchimp "Rate Watch Welcome Series" Customer Journey + recurring Friday campaign (Adam must create in UI).
- **BLOCKER-003**: CONFIRMED RESOLVED — git push from styerteam-mortgage-site repo completed by Adam on 2026-03-29 at 10:00 AM CT (commit 1b3f0be). Both funnels are live on Netlify.
- **subscribe-lead.js**: Bug-001 (lead_source to createLoanosContact) was fixed in commit 46fa8fc (2026-03-28). Deployed prior to today.
- **Database**: 2,331 contacts in Supabase; 77% untagged. 741 "Closed" loans. Lead source tracking is poor historically.
- **Speed-to-lead**: 5-minute contact window critical; n8n notification workflow for PA funnel is ACTIVE and will fire on first live submission.

## Open Questions

1. Did live end-to-end test submissions work? (rate-alert + PA funnel form submissions → Supabase contact created → correct n8n routing)
2. Are Netlify env vars set? (MAILCHIMP_API_KEY, MAILCHIMP_BORROWER_LIST_ID=5053c57af2, LOANOS_AGENT_SECRET) — unconfirmed by Adam as of last session
3. Has Adam created the "Pre-Approval Welcome Series" Customer Journey in Mailchimp?
4. Has Adam created the "Rate Watch Welcome Series" Customer Journey + weekly Friday campaign?
5. Did the PA funnel n8n notify workflow fire or NOT fire during rate-alert test submissions? (regression test)

## Prior Decisions

- Rate Alert = email-only, 2-field form (fname + email). No phone collected until higher intent shown.
- subscribe-lead.js is READ-ONLY — new funnels extend via tag parameter, no code changes.
- FTB Guide funnel is already wired and working (subscribe-lead.js pattern confirmed).
- All PA funnel leads get "Pre-Approval Funnel" lead_source in LoanOS.
- Rate Alert funnel leads get "Rate Alert Funnel" lead_source in LoanOS.
- n8n PA notify workflow (J9Pe24vUi6fpZtdZ) should NOT fire for rate-alert leads — gated on lead_source === "Pre-Approval Funnel".

## Lead Gen Program Priorities

1. Post-deploy QA: run live form submissions and verify full chain (Supabase → n8n → Mailchimp tagging)
2. Week 4 planning: First-Time Buyer Guide enhancement or homepage form wiring
3. BLOCKER-001 (partial): Homepage Quick Quote + Quick Contact TCPA audit + subscribe-lead.js wiring (low urgency — no SMS live)

## Briefing for QA Subagent (Post-Deploy Focus)

Do NOT re-run: code-level checks (all passed 2026-03-28/29). Do NOT re-audit spec compliance (Reviewer approved 2026-03-29).

Focus NEW work on:
- Live end-to-end rate-alert.html form submission: submit test form → confirm Supabase contact created → confirm n8n PA workflow did NOT fire → confirm Mailchimp tag `rate-alert` applied
- Live end-to-end get-preapproved.html: submit test → confirm Supabase contact + lead_source="Pre-Approval Funnel" → confirm n8n J9Pe24vUi6fpZtdZ DID fire → confirm Outlook notification sent
- Thank-you page branching: confirm rate-alert thank-you copy shows (not PA copy) on ?type=rate-alert
- austin-mortgage-rates.html CTA: verify "Never Miss a Rate Move" section is visible and links correctly to /rate-alert
- If Netlify env vars NOT confirmed → code-path QA only; document which checks passed and which are blocked
