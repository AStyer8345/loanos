# LoanOS — Multi-Tenancy Checklist

_Last updated: 2026-03-25 (daily prep — NOT NULL hardening [migration 053], daily-briefing milestone scoping fixed)_

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
| `contact_activity` has `organization_id` | ✅ | Migration 048 applied 2026-03-24 — backfilled from contacts |
| `chat_sessions` has `organization_id` | ✅ | Migration 039 — 10/10 rows backfilled |
| `mcc_state` has `organization_id` | ✅ | Migration 039 — backfilled |
| `user_settings` has `organization_id` | ✅ | Migration 039 — backfilled |
| `marketing_activity_log` has `organization_id` | ✅ | Migration 039 — backfilled |
| `marketing_activity_log` RLS enabled | ✅ | Migration 039 — 4 policies; redundant ALL policy dropped in 040 |
| 0 loans with null `organization_id` | ✅ | Verified 2026-03-23 (0 null rows) |
| 0 contacts with null `organization_id` | ✅ | Last null: Aaron Treptow backfilled 2026-03-23 |
| 0 activity_log with null `organization_id` | ✅ | 18 new nulls (15 Outlook Sync + 2 WF2 + 1 WF1) backfilled — migration 050 2026-03-24. Recurring until Azure unblocked + n8n workflows pushed. |
| 0 chat_sessions with null `organization_id` | ✅ | 2 nulls backfilled — migration 050 2026-03-24 |
| 0 contact_activity with null `organization_id` | ✅ | Backfilled from contacts — migration 048 2026-03-24 |
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
| `activity_log` | ✅ (org-only, tightened 048 — dropped user_id OR clause) | ✅ | n/a (immutable — UPDATE policy dropped in 040) | n/a (immutable) |
| `todo_items` | ✅ | ✅ | ✅ | ✅ |
| `documents` | ✅ | ✅ | ✅ | ✅ |
| `email_drafts` | ✅ | ✅ | ✅ | ✅ |
| `scenarios` | ✅ | ✅ | ✅ | ✅ |
| `contact_emails` | ✅ | ✅ | ✅ | ✅ |
| `contact_activity` | ✅ (org-scoped, added 2026-03-24) | ✅ (org-scoped, added 2026-03-24) | — | — |
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

## Priority 1 — Schema Hardening (NOT NULL)

| Table | organization_id NOT NULL | Notes |
|-------|--------------------------|-------|
| `loans` | ✅ NOT NULL | Migration 053, 2026-03-25 |
| `contacts` | ✅ NOT NULL | Migration 053, 2026-03-25 |
| `documents` | ✅ NOT NULL | Migration 053, 2026-03-25 |
| `email_drafts` | ✅ NOT NULL | Migration 053, 2026-03-25 |
| `scenarios` | ✅ NOT NULL | Migration 053, 2026-03-25 |
| `todo_items` | ✅ NOT NULL | Migration 053, 2026-03-25 |
| `contact_activity` | ✅ NOT NULL | Migration 053, 2026-03-25 |
| `chat_sessions` | ✅ NOT NULL | Migration 053, 2026-03-25 |
| `activity_log` | ⚠️ Still nullable | Trigger in place. Add NOT NULL once WF1/WF2 confirmed pushed to n8n cloud |

---

## Priority 3 — Pre-Launch Gaps

| Item | Status | Notes |
|------|--------|-------|
| `daily-briefing` milestone queries scoped | ✅ Fixed 2026-03-25 | `loan_milestone_events` + `milestone_communications` now scoped via loans join |
| Performance page uses localStorage | ❌ | Move to Supabase before licensing |
| Plan selection UI in onboarding | ❌ | Defaults to 'starter' — no selection step |

---

## Priority 5 — Adam's Data Integrity

| Item | Status | Notes |
|------|--------|-------|
| Adam's org ID | ✅ | `18613f82-fdd9-42dd-a09e-f3c577328258` |
| 0 loans with null org_id | ✅ | Verified 2026-03-24 |
| 0 contacts with null org_id | ✅ | Verified 2026-03-24 |
| 0 activity_log with null org_id | ✅ | Backfilled 2026-03-24 (migration 050) — recurring until Azure + n8n fixed |
| 0 chat_sessions with null org_id | ✅ | Backfilled 2026-03-24 (migration 050) |
| 0 contact_activity with null org_id | ✅ | Backfilled 2026-03-24 (migration 048) |
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
