# Workflow DevKit — Manual Smoke Checklist

Run this checklist before flipping `WORKFLOW_DEVKIT_LEAD_INTAKE` to `live`.

All tests in this file are **manual** — there's no automated runner because the
goal is end-to-end validation against real providers (Resend, Graph, Supabase,
Vercel). Run in order; later steps assume earlier ones passed.

## Pre-Approval Email (single-send)

- [ ] POST to `/api/workflows/pre-approval-email/start` with valid `contact_id` + `loan_id` + `org_id`
- [ ] Confirm email appears in Resend dashboard within 60 seconds
- [ ] Confirm `activity_log` row with `event_type='email.sent'` was created
- [ ] Confirm workflow run appears in Vercel dashboard

## Web Lead Intake (purchase lead)

- [ ] Submit test lead via `/get-preapproved` with `loan_goal=purchase`
- [ ] Confirm contact upserted in Supabase with `source_page`, `utm_*`, `referrer` populated
- [ ] Confirm `activity_log` row `event_type='contact_created'`
- [ ] Confirm alert email received at adam@styermortgage.com via Outlook
- [ ] Confirm confirmation email sent to test address via Outlook
- [ ] Confirm `drip_enrollments` row created for `pa-welcome` campaign
- [ ] If `WORKFLOW_DEVKIT_LEAD_INTAKE=live`: confirm `paWelcomeNurture` workflow started in Vercel

## PA Welcome Nurture (drip)

- [ ] Enroll test contact manually in `pa-welcome` campaign
- [ ] Trigger workflow with `contact_id`
- [ ] Confirm step 0 (day-0) email sent via Resend
- [ ] Confirm Resend webhook delivers `email.delivered` event within 5 min
- [ ] Confirm `activity_log` row `event_type='email.delivered'`
- [ ] Confirm workflow is sleeping (visible in Vercel Workflow dashboard)
- [ ] Set `email_opt_out=true` on test contact
- [ ] Advance clock via Vercel devtools (or wait for next natural wake) — confirm exit-rule fires and `enrollment.status='completed'`

## DPA Guide Nurture (drip)

- [ ] Same as PA Welcome steps above with `dpa-guide` campaign

## Resend Webhook (all events)

- [ ] Send test email via Resend
- [ ] Confirm webhook fires and appears in `resend_webhook_events` table
- [ ] Confirm idempotency: re-deliver same `event_id` — second insert silently ignored (no duplicate row)
- [ ] Confirm invalid Svix signature returns 401

## Parity comparison (shadow mode, 7-day minimum)

- [ ] Pull n8n execution log for same 7-day window
- [ ] Pull `workflow_shadow_log` for same window
- [ ] Verify classification match = 100% (no misclassified leads — PA→PA, DPA→DPA, generic→generic)
- [ ] Verify enrollment decision match = 100% (same campaign chosen)
- [ ] Verify zero exit-rule discrepancies
- [ ] Confirm zero emails sent during shadow mode (n8n still owns sends)
- [ ] Sign off: **Adam approves cutover**

## Rollback plan

If any check fails during cutover:
1. Flip `WORKFLOW_DEVKIT_LEAD_INTAKE` back to `shadow` in Vercel and redeploy
2. Re-enable Mailchimp PA/DPA journeys if they were paused
3. Investigate the failing check — usually a payload-shape drift between n8n and Workflow DevKit
4. Do NOT flip to `live` again without re-running the full parity window
