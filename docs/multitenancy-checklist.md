# LoanOS — Multi-Tenancy Checklist

_Last updated: 2026-03-19 (session 9 — daily audit)_

---

## Priority 1 — Data Isolation

| Item | Status | Notes |
|------|--------|-------|
| `loans` has `organization_id` | ✅ | Migration 030 |
| `contacts` has `organization_id` | ✅ | Migration 030 |
| `activity_log` has `organization_id` | ✅ | Migration 030 |
| `todo_items` has `organization_id` | ✅ | Migration 030 |
| `documents` has `organization_id` | ✅ | Migration 032/033 |
| `email_drafts` has `organization_id` | ✅ | Migration 032/033 |
| `scenarios` has `organization_id` | ✅ | Migration 032/033 |
| `contact_emails` org scoping | ✅ | Join-based RLS via loan_id/contact_id → 037 |
| `chat_sessions` has `organization_id` | ⚠️ | Migration 039 written, **needs apply** |
| `mcc_state` has `organization_id` | ⚠️ | Migration 039 written, **needs apply** |
| `user_settings` has `organization_id` | ⚠️ | Migration 039 written, **needs apply** |
| `marketing_activity_log` has `organization_id` | ⚠️ | Migration 039 written, **needs apply** |
| `marketing_activity_log` RLS enabled | ⚠️ | No prior migration — 039 enables RLS, **needs apply** |
| 0 loans with null `organization_id` | ✅ | Verified 2026-03-19 |
| 0 contacts with null `organization_id` | ✅ | Verified 2026-03-19 |

---

## Priority 1 — RLS Policies

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `loans` | ✅ | ✅ | ✅ | ✅ |
| `contacts` | ✅ | ✅ | ✅ | ✅ |
| `activity_log` | ✅ | ✅ | n/a (immutable) | n/a (immutable) |
| `todo_items` | ✅ | ✅ | ✅ | ✅ |
| `documents` | ✅ | ✅ | ✅ | ✅ |
| `email_drafts` | ✅ | ✅ | ✅ | ✅ |
| `scenarios` | ✅ | ✅ | ✅ | ✅ |
| `contact_emails` | ✅ | ✅ | ✅ | ✅ |
| `profiles` | ✅ | ✅ | ✅ | n/a |
| `organizations` | ✅ | — | — | — |
| `chat_sessions` | ✅ (user_id) | ✅ (user_id) | ✅ (user_id) | — |
| `mcc_state` | ✅ (user_id) | ✅ (user_id) | ✅ (user_id) | — |
| `user_settings` | ✅ (user_id) | ✅ (user_id) | ✅ (user_id) | — |
| `marketing_activity_log` | ⚠️ | ⚠️ | ⚠️ | ⚠️ | Migration 039 adds RLS, **needs apply** |
| `org_settings` | ⚠️ | ⚠️ | ⚠️ | — | Migration 039 creates table + RLS, **needs apply** |
| `security_audit_log` | ✅ | service only | — | — |

---

## Priority 2 — Organization Setup

| Item | Status | Notes |
|------|--------|-------|
| `organizations` table exists | ✅ | Migration 029 |
| `organizations.nmls` column | ⚠️ | Migration 039 adds it, **needs apply** |
| `organizations.logo_url` column | ⚠️ | Migration 039 adds it, **needs apply** |
| `organizations.brand_color` column | ⚠️ | Migration 039 adds it, **needs apply** |
| `organizations.plan` column | ⚠️ | Migration 039 adds it, **needs apply** |
| `organizations.slug` column | ✅ | Migration 029 |
| `profiles.nmls_individual` column | ⚠️ | Migration 039 adds it, **needs apply** |
| `profiles.phone` column | ⚠️ | Migration 039 adds it, **needs apply** |
| `profiles.states_licensed` column | ⚠️ | Migration 039 adds it, **needs apply** |
| `profiles.email_signature` column | ⚠️ | Migration 039 adds it, **needs apply** |
| `org_settings` table exists | ⚠️ | Migration 039 creates it, **needs apply** |

---

## Priority 3 — Onboarding Flow

| Item | Status | Notes |
|------|--------|-------|
| `/onboarding` route exists | ✅ | |
| Middleware redirects to /onboarding if no org | ✅ | `src/middleware.ts` |
| Collects full name | ✅ | Updated 2026-03-19 |
| Collects org name | ✅ | |
| Collects individual NMLS | ✅ | Updated 2026-03-19 |
| Collects phone | ✅ | Updated 2026-03-19 |
| Collects states licensed | ✅ | Updated 2026-03-19 |
| Creates `organizations` record | ✅ | `/api/org/create` |
| Creates `profiles` record with org_id | ✅ | `/api/org/create` |
| Creates `org_settings` record | ✅ | `/api/org/create` (best-effort after 039) |
| Redirects to dashboard after setup | ✅ | |
| Plan selection UI | ❌ | Deferred — defaults to 'starter' |
| Integration setup step (Arive, Outlook) | ❌ | Deferred to Tier 2 onboarding |

---

## Priority 4 — Tenant Isolation Verification

| Item | Status | Notes |
|------|--------|-------|
| Isolation test script | ❌ | Not yet built — `scripts/verify-tenant-isolation.ts` |

---

## Priority 5 — Adam's Data Integrity

| Item | Status | Notes |
|------|--------|-------|
| Adam's org ID | ✅ | `18613f82-fdd9-42dd-a09e-f3c577328258` |
| 0 loans with null org_id | ✅ | Verified 2026-03-19 |
| 0 contacts with null org_id | ✅ | Verified 2026-03-19 |

---

## Pending: Apply Migration 039

Migration `039_expand_org_schema.sql` is written and idempotent. Paste into Supabase SQL Editor to apply:

```
supabase/migrations/039_expand_org_schema.sql
```

This migration:
1. Adds `organization_id` to `chat_sessions`, `mcc_state`, `user_settings`, `marketing_activity_log`
2. Backfills existing rows from `profiles.organization_id`
3. Enables RLS on `marketing_activity_log` (was unprotected)
4. Adds `nmls`, `logo_url`, `brand_color`, `plan` to `organizations`
5. Adds `nmls_individual`, `phone`, `states_licensed`, `email_signature` to `profiles`
6. Creates `org_settings` table with RLS
7. Seeds `org_settings` rows for existing orgs

---

## New User Setup Checklist

| Step | Status |
|------|--------|
| Auth account created (Supabase Auth) | ✅ |
| Shown `/onboarding` flow | ✅ |
| Tier 1 data collected (name, NMLS, phone, state, org name) | ✅ |
| Organization record created | ✅ |
| Profile linked to org_id with role='owner' | ✅ |
| org_settings record created | ✅ (after 039) |
| Subscription plan assigned | ⚠️ Defaults to 'starter' — no UI yet |
| Dashboard accessible with scoped data only | ✅ |
| No cross-tenant data visible | ✅ (all main tables org-scoped) |
