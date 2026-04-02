# NotebookLM Pull Report — 2026-04-01 AM
Active Topic: BLOCKER-004/005 Resolution Verification + Week 4 FTB Planning

## What We Already Know

**Funnels live:** FTB Guide, Pre-Approval (get-preapproved.html), Rate Alert (rate-alert.html) — all 3 deployed 2026-03-29.

**BLOCKER-004 (LOANOS_URL hardcoded):** Env var `LOANOS_URL` added by Adam in Netlify dashboard on 2026-03-31. Code change (line 42 of subscribe-lead.js) committed 2026-03-30 in commit `1a4f90c`.

**BLOCKER-005 (fire-and-forget):** `notifyPreApprovalLead()` now called inside `await Promise.allSettled()` — committed in same fix commit `1a4f90c`.

**Both fixes are deployed** — commit `1a4f90c` is an ancestor of the latest origin/main commit (`ede505e`, 2026-03-31).

**Mailchimp:** Tags applying correctly for both funnels. Customer Journey creation (PA Welcome Series + Rate Watch Welcome Series) still pending Adam action in Mailchimp UI.

**Week 4 plan:** First-Time Buyer expansion — down payment assistance/myths as lead magnet, 8-email sequence, 60 days. Research identified as next research priority once blockers close.

## Open Questions

1. Are the BLOCKER-004/005 fixes actually functioning end-to-end in production (LoanOS contact creation + PA notify)? Need live test to confirm.
2. Is Mailchimp `BORROWER_LIST_ID` matching the correct audience that n8n uses?
3. Has Adam created the Mailchimp Customer Journeys yet? (PA Welcome Series + Rate Watch Welcome Series)

## Prior Decisions

- All lead routing goes to LoanOS (Supabase), not Salesforce
- Subscribe-lead.js is the sole integration layer — handles Mailchimp + LoanOS + n8n in one function
- Rate Alert Funnel: zero changes to subscribe-lead.js required (tag-based)
- Pre-Approval Funnel: PA lead notify goes to n8n workflow `J9Pe24vUi6fpZtdZ`

## Lead Gen Program Priorities

1. **Confirm blockers are fully resolved** — verify with live QA test (code confirms fix; execution test still outstanding)
2. **Mailchimp Customer Journey creation** — gates full funnel completion for PA + Rate Alert
3. **Week 4 FTB funnel** — research phase; down payment myths/DPA lead magnet
4. **Homepage form wiring** — Quick Quote + Quick Contact → subscribe-lead.js (BLOCKER-001 partial)

## Briefing for Research Subagent

Do NOT re-research:
- subscribe-lead.js fix patterns (already in code, deployed)
- Rate Alert Funnel architecture (spec complete, built, live)
- Pre-Approval Funnel architecture (spec complete, built, live)
- n8n patterns for lead notify (using existing workflow J9Pe24vUi6fpZtdZ)

Focus new research on:
- Texas Down Payment Assistance programs (2026 limits, TDHCA, Travis County)
- "Down payment myths" content angle — what resonates with Austin FTB buyers
- 8-email nurture sequence structure for FTB segment
