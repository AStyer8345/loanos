# LoanOS — Multi-Tenancy Checklist

_Last updated: 2026-03-22 (daily prep — migration 046 applied, updateLastTouch + outlook-sync + generate-narrative fixed)_

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
| `chat_sessions` has `organization_id` | ✅ | Migration 039 — 10/10 rows backfilled |
| `mcc_state` has `organization_id` | ✅ | Migration 039 — backfilled |
| `user_settings` has `organization_id` | ✅ | Migration 039 — backfilled |
| `marketing_activity_log` has `organization_id` | ✅ | Migration 039 — backfilled |
| `marketing_activity_log` RLS enabled | ✅ | Migration 039 — 4 policies; redundant ALL policy dropped in 040 |
| 0 loans with null `organization_id` | ✅ | Verified 2026-03-21 (0 null rows) |
| 0 contacts with null `organization_id` | ✅ | 2 legacy nulls backfilled — migration 043 |
| 0 activity_log with null `organization_id` | ✅ | 78 legacy nulls backfilled — migration 043; 3 new nulls from n8n/code bugs — migration 046 + code fixes 2026-03-22 |
| 0 chat_sessions with null `organization_id` | ✅ | 2 legacy nulls backfilled — migration 043 |
| `updateLastTouch.ts` stamps org_id | ✅ | Fixed 2026-03-22 — was inserting without org_id |
| `outlook-sync logEmailActivity` stamps org_id | ✅ | Fixed 2026-03-22 — uses contact.organization_id |
| `generate-narrative` no unscoped activity_log | ✅ | Fixed 2026-03-22 — insert removed (no auth context) |
| n8n `9JyzzwKac8v3uQ7d` stamps org_id | ❌ | Arive Status Update workflow inserts without org_id |
| n8n `JMmstRl2C5ylmuIY` stamps org_id | ❌ | Outlook Email Sync workflow inserts without org_id |

---

## Priority 1 — RLS Policies

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `loans` | ✅ | ✅ | ✅ | ✅ |
| `contacts` | ✅ | ✅ | ✅ | ✅ (stale user_id policies dropped in 040) |
| `activity_log` | ✅ | ✅ | n/a (immutable — UPDATE policy dropped in 040) | n/a (immutable) |
| `todo_items` | ✅ | ✅ | ✅ | ✅ |
| `documents` | ✅ | ✅ | ✅ | ✅ |
| `email_drafts` | ✅ | ✅ | ✅ | ✅ |
| `scenarios` | ✅ | ✅ | ✅ | ✅ |
| `contact_emails` | ✅ | ✅ | ✅ | ✅ |
| `profiles` | ✅ | ✅ | ✅ | n/a |
| `organizations` | ✅ | — | — | — |
| `chat_sessions` | ✅ (org-scoped) | ✅ (org-scoped) | ✅ (org-scoped) | ✅ (org-scoped) |
| `mcc_state` | ✅ (user_id) | ✅ (user_id) | ✅ (user_id) | — |
| `user_settings` | ✅ (user_id) | ✅ (user_id) | ✅ (user_id) | — |
| `marketing_activity_log` | ✅ | ✅ | ✅ | ✅ (redundant ALL policy dropped in 040) |
| `org_settings` | ✅ | ✅ | ✅ | — |
| `security_audit_log` | ✅ | service only | — | — |

---

## Priority 2 — Organization Setup

| Item | Status | Notes |
|------|--------|-------|
| `organizations` table exists | ✅ | Migration 029 |
| `organizations.nmls` column | ✅ | Migration 039 |
| `organizations.logo_url` column | ✅ | Migration 039 |
| `organizations.brand_color` column | ✅ | Migration 039 |
| `organizations.plan` column | ✅ | Migration 039 |
| `organizations.slug` column | ✅ | Migration 029 |
| `profiles.nmls_individual` column | ✅ | Migration 039 |
| `profiles.phone` column | ✅ | Migration 039 |
| `profiles.states_licensed` column | ✅ | Migration 039 |
| `profiles.email_signature` column | ✅ | Migration 039 |
| `org_settings` table exists | ✅ | Migration 039 — 2 rows seeded (one per org) |

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
| Isolation test script | ⚠️ | Built — `scripts/verify-tenant-isolation.ts`. Tests data-layer isolation via service role. Full RLS enforcement test requires real auth sessions (service role bypasses RLS). |

---

## Priority 5 — Adam's Data Integrity

| Item | Status | Notes |
|------|--------|-------|
| Adam's org ID | ✅ | `18613f82-fdd9-42dd-a09e-f3c577328258` |
| 0 loans with null org_id | ✅ | Verified 2026-03-21 |
| 0 contacts with null org_id | ✅ | Backfilled 2026-03-21 (migration 043) |
| 0 activity_log with null org_id | ✅ | Backfilled 2026-03-21 (migration 043, 78 rows) |
| 0 chat_sessions with null org_id | ✅ | Backfilled 2026-03-21 (migration 043, 2 rows) |
| No unscoped API fallbacks | ✅ | daily-briefing `withOrg` fallback removed 2026-03-21 |

---

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
