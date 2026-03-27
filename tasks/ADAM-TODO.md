# Adam's Action Items
# Agents append [ ] items here after every session.
# Adam: change [ ] to [x] when done. Leave [x] items in place — agents will ignore them.
# Agents: only act on [ ] items. [x] items are complete — do not re-surface them.

---

## PENDING

<!-- Agents append new items below this line -->
- [ ] [CRM] 2026-03-27 — WARNING: WF2 will overwrite closing_date with Arive's estimated date on next webhook. 5 loans currently have closing_date ≠ est_closing_date — if any were manually set to an intentional actual closing date, check them before a new Arive webhook fires. To prevent this long-term, investigate whether Arive exposes `keyDates_actualFundingDate` in the webhook payload.
- [ ] [LEAD-GEN] 2026-03-27 — Pre-Approval Funnel spec is ready to build. Confirm 3 Netlify env vars are set (MAILCHIMP_API_KEY, MAILCHIMP_BORROWER_LIST_ID, LOANOS_AGENT_SECRET) on styermortgage.com in Netlify dashboard → Builder can execute immediately after confirmation. Spec: tasks/lead-gen/specs/2026-03-27-pre-approval-funnel-spec.md
- [ ] [CRM] 2026-03-26 — Answer 8 contact schema questions in `tasks/crm/research/2026-03-25-contact-data-architecture.md` — these gate the Contact Data Architecture spec and all smart list / schema improvements
- [x] [CRM] 2026-03-26 — Confirm email_opt_out is enforced in n8n milestone email workflows — FIXED 2026-03-26 AM session: enforcement now in milestone route.ts
- [x] [CRM] 2026-03-26 — Answer 5 loan pipeline questions — ANSWERED 2026-03-27: sort=closing date, active=app_received→closing_scheduled, rate lock=yes in Arive+add closing_date to webhook, Janie=Arive only, Kanban=yes build it
- [ ] [CRM] 2026-03-27 — Answer 4 automation coverage questions before builder sequence can start: (1) Drip enrollment trigger — auto on Pre-Approval Lead Notify webhook or manual stage change? (2) WF2 architecture — add outbound emails to WF2 or build separate milestone-triggered workflows? (3) Review Request trigger — is it manual, Arive fund event, or scheduled? (4) Rate watch source — Adam enters rate weekly, pull from rate API, or compare to rate update email? See: tasks/crm/research/2026-03-27-automation-coverage-audit.md#open-questions

