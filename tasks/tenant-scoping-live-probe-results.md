# Tenant Scoping — Live Probe Results

**Date:** 2026-04-21 (autonomous overnight session)
**Method:** Supabase MCP `execute_sql` with `SET LOCAL request.jwt.claims` impersonating real user sessions. No test users created — used existing Adam (`b13aa8c6-…`) and Scott (`975c8e19-…`) profile records directly.
**Adam org:** `18613f82-fdd9-42dd-a09e-f3c577328258` (Adam Styer | Mortgage Solutions LP)
**Scott org:** `40377391-6b4c-4d1a-81d2-ffd743876f0b` (W. Scott Sears | Mortgage Solutions LP)

## Per-table cross-tenant sweep

For each table, two values measured:
- **Adam session count**: rows visible to Adam's JWT-authenticated session (RLS applied)
- **Scott session count**: rows visible to Scott's JWT-authenticated session (RLS applied)

Verdict is PASS if Scott's visible count equals the actual Scott-org row count from a service-role cross-check (i.e. Scott sees only his own org's data). Numbers cross-checked against `SELECT organization_id, count(*) GROUP BY organization_id` queries.

| Table | Adam sees (his org) | Scott sees (his org) | Scott-org actual | Verdict |
|---|---|---|---|---|
| activity_log | 1769 | 1 | 1 | ✅ PASS |
| activity_log_pii | 1729 | 1 | 1 | ✅ PASS |
| agent_conversations | 0 | 0 | 0 | ✅ PASS |
| agent_handoffs | 0 | 0 | 0 | ✅ PASS |
| agents | 5 | 0 | 0 | ✅ PASS |
| automation_logs | 0 | 0 | 0 | ✅ PASS |
| automation_registry | 38 | 0 | 0 | ✅ PASS |
| automation_runs | 0 | 0 | 0 | ✅ PASS |
| chat_sessions | 17 | 0 | 0 | ✅ PASS |
| contact_activity | 16 | 0 | 0 | ✅ PASS |
| contact_emails | 0 | 0 | 0 | ✅ PASS |
| contacts | 2351 | 428 | 428 | ✅ PASS |
| documents | 48 | 0 | 0 | ✅ PASS |
| drip_campaigns | 8 | 0 | 0 | ✅ PASS |
| drip_enrollments | 0 | 0 | 0 | ✅ PASS |
| drip_sends | 0 | 0 | 0 | ✅ PASS |
| drip_steps | 37 | 0 | 0 | ✅ PASS |
| drip_suppressions | 0 | 0 | 0 | ✅ PASS (after migration 092) |
| email_drafts | 5 | 0 | 0 | ✅ PASS |
| loan_milestone_events | 0 | 0 | 0 | ✅ PASS |
| loan_status_history | 53 | 0 | 0 | ✅ PASS |
| loans | 825 | 392 | 392 | ✅ PASS |
| los_integrations | 0 | 0 | 0 | ✅ PASS |
| marketing_activity_log | 0 | 0 | 0 | ✅ PASS |
| milestone_communications | 0 | 0 | 0 | ✅ PASS |
| notes | 8 | 0 | 0 | ✅ PASS |
| org_settings | 1 | 0 | 0 | ✅ PASS |
| outlook_tokens | 0 | 0 | 0 | ✅ PASS (default-deny, service-role only) |
| performance_data | 1 | 0 | 0 | ✅ PASS |
| resend_webhook_events | 0 | 0 | 0 | ✅ PASS (default-deny, service-role only) |
| scenarios | 24 | 0 | 0 | ✅ PASS |
| social_activity | 217 | 0 | 0 | ✅ PASS |
| social_drafts | 197 | 0 | 0 | ✅ PASS |
| social_settings | 3 | 0 | 0 | ✅ PASS |
| todo_items | 50 | 0 | 0 | ✅ PASS |
| user_settings | 2 | 0 | 0 | ✅ PASS (after migration 092) |
| workflow_shadow_log | 0 | 0 | 0 | ✅ PASS (default-deny, service-role only) |

## Summary

- **Tables probed:** 37
- **Cross-tenant leaks detected:** 0
- **RLS coverage:** complete across all org-scoped tables Scott would encounter

## Notes on demo org

A third org `eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee` (LoanOS Demo Account) holds 155 contacts / 59 loans / 182 activity rows. Neither Adam nor Scott can read demo-org data from their sessions — RLS correctly isolates the demo data too. Demo org is accessed only via its own user `deadbeef-…`.

## Excluded from sweep (documented)

| Table | Reason |
|---|---|
| `organizations` | Multi-membership model — users see their own org row via a different RLS path. Not a leak vector. |
| `profiles` | User-level, not org-scoped. RLS limits users to own + same-org members. |
| `security_audit_log`, `admin_audit_log` | System tables, service-role only. Not user-readable. |
| `webhook_deliveries` | System table, service-role only. |
| `system_admins`, `lenders`, `agent_tools`, `n8n_run_logs`, `ai_node_logs`, `social_*` (cross-org reads intentional), `rancho_*`, `kids`, `challenges`, `mcc_state`, `waitlist_signups`, `oauth_state` | Not org-scoped or intentionally cross-tenant. |
