# LoanOS Multi-Tenancy Daily Prep — Claude Code Prompt
# Run: cd ~/Documents/loanos-clone && cat tasks/multitenancy-daily-prep.md | claude --dangerously-skip-permissions

## Context

LoanOS is being prepared for multi-tenant SaaS licensing to mortgage loan officers nationally.
The foundation has been started (migrations 029–038 exist), but the work is incomplete and unverified.
This prompt runs daily. Each session picks up where the last left off.
Do NOT rebuild what's already done. Audit first, act second.

---

## Session Start: Read These Files First

```
CONTEXT.md
ARCHITECTURE.md
tasks/lessons.md
tasks/todo.md
supabase/migrations/029_add_multitenancy.sql
supabase/migrations/030_add_org_id_to_existing_tables.sql
supabase/migrations/031_multitenancy_rls.sql
supabase/migrations/032_org_rls_documents_drafts_scenarios.sql
supabase/migrations/033_org_rls_documents_drafts_scenarios.sql
supabase/migrations/033b_drop_legacy_user_policies.sql
supabase/migrations/033c_fix_scenarios_select_policy.sql
supabase/migrations/034_drop_legacy_scenarios_org_id.sql
supabase/migrations/035_fix_profiles_rls_self_read.sql
supabase/migrations/036_fix_profiles_rls_circular.sql
supabase/migrations/037_fix_contact_emails_rls.sql
supabase/migrations/038_security_audit_log.sql
src/lib/getOrganization.ts
src/components/OrgProvider.tsx
src/hooks/useOrg.ts
src/middleware.ts
src/app/onboarding/
```

After reading, output a status summary:
- What multi-tenancy work is confirmed complete
- What is partially done or missing
- What the highest-risk gaps are today
- What this session will focus on

---

## Core Multi-Tenancy Architecture for LoanOS

### The Model

Every tenant is an **organization** (`organizations` table).
Every user belongs to one organization (`profiles.org_id`).
All data tables have `org_id` column.
Supabase RLS enforces that users can only read/write rows where `org_id` matches their org.

### Required Data from Every New Tenant (Onboarding)

When a new LO signs up, collect and store:

**Tier 1 — Required at signup:**
- Full name
- Email address (becomes auth email)
- NMLS number (individual)
- Company/team name (becomes `organizations.name`)
- State(s) licensed
- Phone number
- Subscription plan (Starter / Pro / Team)

**Tier 2 — Required before going live:**
- Brokerage/company NMLS
- Logo URL or upload
- Brand color (hex) — defaults to `#C9A84C` if not set
- LOS preference (Arive, Encompass, BytePro, etc.)
- Arive webhook URL (if applicable)
- Microsoft 365 / Outlook email for email sync (optional)
- n8n webhook endpoint (auto-provisioned or self-hosted)

**Tier 3 — Collected progressively:**
- Referral partner list (realtors, financial advisors)
- Email signature
- Mailchimp list IDs
- Social media handles

Store all of this in:
- `organizations` table — company-level data
- `profiles` table — user-level data
- `org_settings` table (create if not exists) — integration config per org

---

## Daily Audit Checklist

Run through each of these every session. Check what's done, flag what's missing.

### 1. Schema Audit

For each of these tables, verify `org_id` column exists AND has a non-null constraint AND is indexed:
- `loans`
- `contacts`
- `activity_log`
- `documents`
- `email_drafts`
- `scenarios`
- `chat_sessions`
- `contact_emails`
- `todo_items`
- `mcc_state`
- `inbound_emails` (if exists)
- `user_settings` (if exists)

**Query to run against Supabase:**
```sql
SELECT table_name, column_name, is_nullable, data_type
FROM information_schema.columns
WHERE column_name = 'org_id'
AND table_schema = 'public'
ORDER BY table_name;
```

Flag any table missing `org_id`. Create a migration to add it if missing.

### 2. RLS Policy Audit

For every table with `org_id`, verify these 4 policies exist:
- SELECT: `org_id = get_user_org_id()`
- INSERT: `org_id = get_user_org_id()`
- UPDATE: `org_id = get_user_org_id()`
- DELETE: `org_id = get_user_org_id()`

**Query to run:**
```sql
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;
```

Flag any table with `org_id` that is missing any of the 4 policies.

### 3. API Route Audit

Search all files in `src/app/api/` for any Supabase queries that:
- Do NOT filter by `org_id`
- Use service role key in a way that bypasses RLS without explicitly scoping to org

Pattern to search for:
```
grep -r "from('loans')\|from('contacts')\|from('activity_log')" src/app/api/ | grep -v "org_id"
```

Flag any route that queries data without org scoping.

### 4. Organization Resolution Audit

Check `src/lib/getOrganization.ts` and `src/hooks/useOrg.ts`:
- Is `org_id` being resolved correctly from the auth session?
- Is it being passed to all data fetching hooks?
- Is there a fallback if `org_id` is null (should block access, not default to all data)?

### 5. Onboarding Flow Audit

Check `src/app/onboarding/`:
- Does an onboarding flow exist?
- Does it collect the Tier 1 fields listed above?
- Does it create an `organizations` record?
- Does it set `profiles.org_id` for the new user?
- Is there a redirect after onboarding to the dashboard?

If onboarding flow is incomplete or missing, add to the build queue below.

### 6. New User Setup Checklist

After auditing, generate a markdown checklist of what happens when a new LO signs up:
```
[ ] Auth account created (Supabase Auth)
[ ] Profile record created with org_id
[ ] Organization record created
[ ] Default org_settings record created
[ ] Onboarding flow shown
[ ] Tier 1 data collected
[ ] Subscription plan assigned
[ ] Dashboard accessible with scoped data only
[ ] No cross-tenant data visible
```

Mark each item as: complete, partial, or missing.

---

## Build Queue (Work on in Priority Order)

Each session, after the audit, work through this list top-to-bottom. Only work on items the audit confirms are incomplete.

### Priority 1 — Data Isolation (Non-negotiable before any SaaS launch)
- [ ] Confirm all tables have `org_id` — create migrations for any missing
- [ ] Confirm all RLS policies are in place — create migrations for any gaps
- [ ] Confirm no API route leaks cross-tenant data
- [ ] Confirm `get_user_org_id()` function exists and is stable in Supabase

### Priority 2 — Organization Setup
- [ ] `organizations` table has: `id`, `name`, `nmls`, `logo_url`, `brand_color`, `plan`, `slug`, `created_at`
- [ ] `org_settings` table exists with: `org_id`, `los_type`, `arive_webhook_url`, `outlook_email`, `n8n_webhook_url`, `mailchimp_list_ids`
- [ ] `profiles` table has: `org_id`, `nmls_individual`, `phone`, `states_licensed`, `email_signature`

### Priority 3 — Onboarding Flow
- [ ] `/onboarding` route exists and is protected (redirect here if org not set up)
- [ ] Step 1: Collect name, email, NMLS, company name, phone, state(s)
- [ ] Step 2: Create `organizations` record and link to profile
- [ ] Step 3: Plan selection (Starter / Pro / Team) — placeholder OK for now
- [ ] Step 4: Integration setup (Arive webhook, Outlook email) — skippable
- [ ] Step 5: Redirect to dashboard

Onboarding UI must match LoanOS design system:
- Background: dark (`#0A0A0A`)
- Font: IBM Plex Mono / IBM Plex Sans
- Accent: `#C9A84C`
- Progress indicator showing steps

### Priority 4 — Tenant Isolation Verification
- [ ] Create `scripts/verify-tenant-isolation.ts` that:
  - Creates two test org records
  - Inserts one loan per org
  - Verifies org 1 cannot query org 2's loan
  - Verifies org 2 cannot query org 1's loan
  - Cleans up test data
  - Outputs PASS or FAIL

### Priority 5 — Adam's Data Integrity
- [ ] Confirm all 819 loans have correct `org_id` set (not null)
- [ ] Confirm all 2,314 contacts have correct `org_id` set (not null)
- [ ] Query: `SELECT COUNT(*) FROM loans WHERE org_id IS NULL` — must be 0
- [ ] Query: `SELECT COUNT(*) FROM contacts WHERE org_id IS NULL` — must be 0

### Priority 6 — Documentation
- [ ] After each session, update `CONTEXT.md` with multi-tenancy status
- [ ] Maintain `docs/multitenancy-checklist.md` — running status of all items above
- [ ] Document new user setup flow in `docs/new-tenant-setup.md`

---

## Architecture Decisions (Non-Negotiable)

- **One org per LO** by default. Team plan allows multiple users per org.
- **n8n stays per-tenant** — each org gets their own webhook endpoints.
- **No shared data between orgs** — ever. No cross-tenant queries.
- **Stripe** is Phase 4 — store `plan` as string for now.
- **Org slug** — add `slug` column to `organizations` now even if not used yet. Will power future white-label URLs.
- **Service role key** in API routes must always scope queries by `org_id` explicitly.
- **RLS is the last line of defense** — app-layer `org_id` filtering is also required in every query.

---

## Session End Requirements

Before ending each session:

1. Update `CONTEXT.md` — add/update `## Multi-Tenancy Status` section with today's date
2. Update `tasks/todo.md` — mark completed items, add newly discovered items
3. Update `docs/multitenancy-checklist.md` — create if not exists
4. Write a 3-bullet summary:
   - What was audited
   - What was built or fixed
   - What is next

---

## What NOT to Do in This Prompt

- Do not touch marketing tab, loans tab, or contact pages
- Do not change existing UI components
- Do not modify n8n workflows
- Do not change auth logic beyond org resolution
- Do not add Stripe or billing UI
- Infrastructure only: data isolation, org setup, onboarding flow
