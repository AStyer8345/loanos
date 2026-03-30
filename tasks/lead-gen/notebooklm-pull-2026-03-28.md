# NotebookLM Pull Report — 2026-03-28 AM
Active Topic: Pre-Approval Funnel Review/QA + prequal.html Bug Fix + Rate Alert Funnel Research

## What We Already Know

**Pre-Approval Funnel (built 2026-03-27 PM)**
The full technical build is complete: `get-preapproved.html` updated with two-checkbox TCPA split, `subscribe-lead.js` updated with `lead_source`/`sms_opt_in`/`loan_type_tag` fields, `thank-you.html` complete with Calendly inline widget, and n8n workflow "LoanOS — Pre-Approval Lead Notify" (J9Pe24vUi6fpZtdZ) created with Webhook → Code → Mailchimp tag → Outlook notification chain. HTML files exist in the site repo; n8n workflow exists but is INACTIVE (missing Mailchimp credential config + needs activation toggle).

**BLOCKER-001: TCPA**
Status: PARTIALLY RESOLVED. The `get-preapproved.html` now has two separate unchecked TCPA checkboxes. But homepage Quick Quote / Quick Contact forms still have bundled SMS consent. Not yet deployed to production (git push pending).

**BLOCKER-002: prequal.html**
Status: ACTIVE. The highest-intent form on the site still has no `fetch()` call in its submit handler. Every lead who submits it is permanently lost. This was marked "out of scope" for the PM Builder session but CAN be fixed without Netlify env vars — only requires modifying the local JS.

**Funnel Queue Progress**
- Pre-Approval Funnel: Built, awaiting Adam to configure Mailchimp credential + activate n8n + create Mailchimp Journey in UI + git push
- Rate Alert Funnel: Next (Week 3)
- First-Time Buyer Funnel: Week 4
- Refi Watch Funnel: Week 5

## Open Questions

1. **Netlify env vars**: MAILCHIMP_API_KEY, MAILCHIMP_BORROWER_LIST_ID, LOANOS_AGENT_SECRET — confirmed in Netlify dashboard? (Adam TODO, still pending)
2. **n8n workflow J9Pe24vUi6fpZtdZ**: Does the Mailchimp HTTP Request node have the correct list ID? The build report shows `${MAILCHIMP_LIST_ID}` placeholder — needs real value.
3. **noindex meta tag**: Should it be removed from get-preapproved.html to allow Google indexing?
4. **Salesforce lead source baseline**: Still pending — closed loans by source, 24 months.
5. **Mailchimp audience size**: Unknown — still pending Adam confirmation.

## Prior Decisions

- `subscribe-lead.js` is the canonical integration pattern for all web forms.
- FTB Guide funnel is the template for all subsequent funnels.
- Single Mailchimp audience with tag segmentation (not separate audiences).
- All new contacts route to LoanOS (Supabase) only — not Salesforce.
- Pre-Approval Funnel landing page URL stays `/get-preapproved` (indexed, has backlinks).
- NEVER target by protected class; NEVER bundle SMS consent with general terms.
- Session log pattern: Reviewer + QA must sign off before any funnel is declared live.

## Lead Gen Program Priorities

1. **BLOCKER-002 fix** (prequal.html) — highest urgency, does not need env vars, can execute today
2. **Reviewer sign-off** on pre-approval funnel build (HTML + JS + n8n workflow)
3. **QA verification** that n8n workflow J9Pe24vUi6fpZtdZ exists and has correct structure
4. **Rate Alert Funnel research** — next queue item, productive while Adam action items pend
5. **Salesforce baseline** — still unblocked by Adam running closed loans report
6. **Homepage form wiring** — Quick Quote + Quick Contact to subscribe-lead.js (after BLOCKER-002 fix pattern established)

## Briefing for Research Subagent

Do NOT re-research the following — already established:
- Referral vs. web vs. paid lead close rate benchmarks
- Speed-to-contact impact (5-minute rule)
- TCPA 2026 FCC one-to-one consent rules
- Pre-approval funnel architecture (spec complete, built)
- subscribe-lead.js integration pattern
- Mailchimp single-audience tag segmentation strategy
- Short form vs. long form conversion rates

Focus new research here if running Research subagent today:
- Rate Alert Funnel architecture: what does a high-converting mortgage rate alert opt-in page look like? What's the optimal lead magnet offer? (weekly rate updates, rate drop alerts, rate lock timing guide?)
- Weekly rate email automation: best practice for frequency, content mix, subject line patterns for mortgage rate newsletters
- Refi Watch Funnel triggers: what home equity milestones + market conditions convert past borrowers best?
