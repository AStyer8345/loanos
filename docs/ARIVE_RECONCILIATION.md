# ARIVE to Lead Desk reconciliation

ARIVE supplies the loan amount, stage and product. Lead Desk supplies operational notes, acquisition reporting, outbound referral name, priority and next action. Existing source text and retired overrides remain in provenance. The 2% planning estimate follows the filtered view.

`arive_loan_facts` stores only source timestamps, status, amount components, product/purpose and matching identity. Browser roles can only read their own organization. The service-only reconciliation function atomically accepts equal/newer facts and refreshes loan copies by organization and ARIVE ID. Since September 6, accepted active facts also enroll missing Lead Desk rows and recover missing local loan copies. They do not create contacts, ARIVE applications or messages. A guard rejects stale loan payloads; the existing n8n status relay also stops old events before its contact/history/funded branches. The shared database normalizes explicit totals or base plus known financed fees before the loan and Lead Desk fact are written. See `ARIVE_DESK_PARITY.md`.

`POST /api/agents/arive-reconcile` uses `X-Webhook-Secret` with the dedicated `ARIVE_RECONCILIATION_SECRET` credential. Submit `{rows, count}` from Get Loan List after collecting every page. Complete count, unique numeric IDs, full source timestamps and owner/explicit working-loan scope are validated. Never put the credential in a URL or browser. The response contains aggregate counts only. Source failure preserves previously verified values and is shown in Lead Desk; a completed check older than 45 minutes is flagged overdue.

Match order: retain reviewed ARIVE IDs; otherwise verify a saved loan ID against household identity, or unique email/phone plus name. A matching email plus surname handles nicknames. Multiple scenarios and recorded identity conflicts require review. Never replace an absent reviewed loan with a different scenario. Leads without a verified current loan remain manual.

## Initial recovery, September 5

73 relevant records checked, 64 stored loan copies corrected. Of the 35 saved working leads, 26 matched, two require scenario/identity review, seven had no verified current loan match. Incoming website inquiries continue to appear without pulling historical loans into the working list. Borrower-level evidence is kept in the private operational handoff.

## Remaining scheduled recovery activation

ARIVE's available Zapier events cover new loans, status, dates, trackers, archives and leads; no general amount-change event was exposed in versions 1.0.25 or 1.0.27. The existing n8n account has a webhook credential, not direct ARIVE API credentials. A cloud recovery path therefore needs the existing Zapier ARIVE Get Loan List action followed by the private receiver, triggered by an n8n schedule every 15 minutes. Two paid actions per check use about 5,760 tasks per 30 days, before pagination or retries. The observed Zapier account has 750 included tasks and a 1,500 pay-per-task ceiling. No billing limits have been changed and this recovery schedule is not activated yet.

Live status relay: `9JyzzwKac8v3uQ7d`, active version `81b67138-771b-47d4-ac54-21cedd0cc2bc`.

Prepared cloud schedule: `qRgCMJbeYpJv6NE9`, unpublished. Prepared Zapier receiver draft: `379154326`, not enabled. Chrome locked during configuration; no attempts to bypass the lock. Resume that draft after Adam unlocks the Mac. Do not enable or increase billing limits without resolving actual task capacity.
