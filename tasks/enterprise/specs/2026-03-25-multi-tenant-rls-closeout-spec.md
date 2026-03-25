# Architecture Spec: Multi-Tenant RLS Closeout + Immediate Security Fixes
Date: 2026-03-25
Session: AM
Status: READY FOR BUILD

---

## Scope

### In Scope
- Fix `performance_data` INSERT RLS policy (missing WITH CHECK — security gap)
- Anonymize SEED_LOANS hardcoded PII in performance page
- Consolidate `stageNormalization.ts` → `loan-stages.ts` across 4 files
- Document as-built multi-tenant architecture in NotebookLM

### Out of Scope
- No changes to the onboarding page (already functional)
- No Stripe billing integration (Week 5)
- No white-label features (Week 6)
- No performance page UI redesign
- No n8n workflow changes (WF1/WF2 push is Adam's action item)
- Do NOT add `NOT NULL` to `activity_log.organization_id` (blocked on WF1/WF2)

---

## Data Model Changes

### Modified Tables

**`performance_data` — Fix INSERT RLS policy**

Current state (bug):
```sql
-- INSERT policy has no WITH CHECK — allows any org_id on insert
"org members can insert performance_data" | INSERT | qual: null
```

Required fix:
```sql
DROP POLICY IF EXISTS "org members can insert performance_data" ON performance_data;
CREATE POLICY "org members can insert performance_data" ON performance_data
  FOR INSERT
  WITH CHECK (organization_id = get_my_organization_id());
```

No table schema changes needed — `performance_data` structure is correct:
- `id` uuid NOT NULL (default gen_random_uuid())
- `organization_id` uuid NOT NULL → organizations(id)
- `year` integer NOT NULL
- `data` jsonb NOT NULL
- `updated_at` timestamptz NOT NULL

### Migration File

**Filename:** `supabase/migrations/055_fix_performance_data_rls.sql`

```sql
-- Fix: performance_data INSERT policy was missing WITH CHECK
-- This allowed any authenticated user to insert rows with any organization_id
-- References: Enterprise session 2026-03-25 research, security audit

DROP POLICY IF EXISTS "org members can insert performance_data" ON performance_data;

CREATE POLICY "org members can insert performance_data" ON performance_data
  FOR INSERT
  WITH CHECK (organization_id = get_my_organization_id());

-- Verify all three policies are now properly scoped
-- SELECT: organization_id = get_my_organization_id() ✓ (existing)
-- INSERT: WITH CHECK organization_id = get_my_organization_id() ✓ (this migration)
-- UPDATE: organization_id = get_my_organization_id() ✓ (existing)
```

---

## Component Changes

### 1. Anonymize SEED_LOANS — `src/app/dashboard/performance/page.tsx`

**File:** `src/app/dashboard/performance/page.tsx`

**Change:** Replace real borrower last names in `SEED_LOANS` constant with fictional names.

Current (PII exposure):
```ts
const SEED_LOANS: Loan[] = [
  {id:1,month:'January',name:'Voelkel',...},
  {id:2,month:'January',name:'Aguilar',...},
  {id:3,month:'January',name:'Stackhouse',...},
  {id:4,month:'January',name:'Stevenson',...},
  {id:5,month:'January',name:'Patel',...},
  {id:6,month:'February',name:'Garcia',...},
  {id:7,month:'February',name:'Preble',...},
  {id:8,month:'February',name:'Humphrey',...},
  {id:9,month:'February',name:'Rademacher',...},
  {id:10,month:'February',name:'Cunningham',...},
  {id:11,month:'February',name:'Cunningham',...},
]
```

Required (anonymized):
```ts
const SEED_LOANS: Loan[] = [
  {id:1,month:'January',name:'Anderson',...},
  {id:2,month:'January',name:'Martinez',...},
  {id:3,month:'January',name:'Thompson',...},
  {id:4,month:'January',name:'Jackson',...},
  {id:5,month:'January',name:'Williams',...},
  {id:6,month:'February',name:'Davis',...},
  {id:7,month:'February',name:'Miller',...},
  {id:8,month:'February',name:'Wilson',...},
  {id:9,month:'February',name:'Moore',...},
  {id:10,month:'February',name:'Taylor',...},
  {id:11,month:'February',name:'Brown',...},
]
```

Keep all numeric values identical — only the `name` field changes. The SEED_LOANS comment should be updated to: `// Seed data — shown only when no Supabase data exists (new user first login)`.

**Risk:** NONE — SEED_LOANS is display-only fallback data. No database, RLS, or API changes.

---

### 2. Stage Normalization Consolidation

**Files to modify:**
1. `src/app/dashboard/contacts/page.tsx`
2. `src/app/api/import/contacts/route.ts`
3. `src/app/api/contacts/quick-add/route.ts`
4. `src/app/api/contacts/bulk-action/route.ts`

**File to delete:**
- `src/lib/stageNormalization.ts`

**Change pattern for each of the 4 files:**

Step 1 — Find the import:
```ts
import { normalizeStage } from '@/lib/stageNormalization'
```

Step 2 — Replace with:
```ts
import { getStageLabel } from '@/lib/constants/loan-stages'
```

Step 3 — Find each call site:
```ts
normalizeStage(someValue)
```

Step 4 — Replace with:
```ts
getStageLabel(someValue)
```

**Why this is safe:**
- `normalizeStage(raw)` → returns display string like 'Lead', 'In Process', 'Closed'
- `getStageLabel(raw)` → calls `normalizeToStageKey(raw)` → then `STAGE_LABELS[key]` → also returns display string
- Output format is compatible. `stageNormalization.ts` had 8 canonical outputs. `loan-stages.ts` has 12 `StageKey` values that map to display labels — it handles all 8 of the old canonical outputs plus more granularity.
- The one behavioral difference: old system collapsed everything unknown to 'Other'. New system collapses unknown to `STAGE_LABELS.lead` = 'Lead'. Verify this is acceptable for the contacts use case (it is — unknown contacts should default to Lead, not Other).

**After all 4 files updated:** `git grep stageNormalization` should return zero results. Then delete the file.

---

## Multi-Tenant Architecture — As-Built Documentation

This spec also serves as the authoritative reference for what was built in Week 1.

### Architecture Decision: Shared Database, Shared Schema

**Chosen:** All tenants in the same Postgres database and same set of tables, isolated via RLS.

**Rejected alternatives:**
- Per-tenant database: Cost-prohibitive at early stage, over-engineered for 1–50 tenants
- Per-tenant schema: Harder to query cross-tenant (admin dashboard), more migration complexity

**Rationale:** Supabase RLS at this scale is the industry-standard approach. Revisit at 500+ tenants.

### Tables and Isolation Status (as of 2026-03-25)

| Table | org_id col | NOT NULL | RLS | Notes |
|-------|-----------|----------|-----|-------|
| loans | organization_id | ✅ | ✅ | Primary pipeline table |
| contacts | organization_id | ✅ | ✅ | |
| documents | organization_id | ✅ | ✅ | |
| email_drafts | organization_id | ✅ | ✅ | |
| scenarios | organization_id | ✅ | ✅ | |
| todo_items | organization_id | ✅ | ✅ | |
| contact_activity | organization_id | ✅ | ✅ | Added migration 048 |
| chat_sessions | organization_id | ✅ | ✅ | |
| activity_log | organization_id | nullable | ✅ | NOT NULL blocked on WF1/WF2 |
| contact_emails | via contacts join | N/A | ✅ | Scoped via join |
| marketing_activity_log | organization_id | nullable | ✅ | User-scoped by design |
| mcc_state | organization_id | nullable | ✅ | User-scoped by design |
| user_settings | organization_id | nullable | ✅ | User-scoped by design |
| org_settings | org_id | N/A | ✅ | Org-level settings |
| system_prompts | org_id | N/A | ✅ | Per-org AI configuration |
| performance_data | organization_id | ✅ | ⚠️ | INSERT policy missing WITH CHECK — fix in migration 055 |

### Core RLS Pattern

```sql
-- get_my_organization_id() function (already deployed)
CREATE OR REPLACE FUNCTION get_my_organization_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid()
$$;

-- Standard policy pattern (example: loans)
CREATE POLICY "org members can read loans" ON loans
  FOR SELECT USING (organization_id = get_my_organization_id());

CREATE POLICY "org members can insert loans" ON loans
  FOR INSERT WITH CHECK (organization_id = get_my_organization_id());

CREATE POLICY "org members can update loans" ON loans
  FOR UPDATE USING (organization_id = get_my_organization_id())
  WITH CHECK (organization_id = get_my_organization_id());
```

### Server-Side Scoping Rule

Service role (bypasses RLS) routes MUST explicitly filter by org_id:
```ts
const { data: profile } = await supabase.from('profiles')
  .select('organization_id').eq('id', user.id).single()

// Then scope every query:
await adminSupabase.from('loans')
  .select('*').eq('organization_id', profile.organization_id)
```

This was audited and confirmed correct across all API routes as of 2026-03-25.

---

## Implementation Order

1. **Apply migration 055** — fix `performance_data` INSERT RLS (5 min, highest priority, zero risk)
2. **Anonymize SEED_LOANS** — replace 11 real last names with fictional ones (10 min, zero risk)
3. **Consolidate stageNormalization** — update 4 files, delete old file (30 min, low risk)
4. **Verify in Supabase** — query `pg_policies` to confirm all performance_data policies have correct qual/with_check (5 min)
5. **Push to Vercel** — after build passes (follow CLAUDE.md deploy workflow)

**Total estimated build time:** ~50 minutes

---

## Risk Register

| Change | Risk Level | What Could Break | Mitigation |
|--------|-----------|-----------------|------------|
| Migration 055 (INSERT RLS) | LOW | Nothing — this only adds a constraint that was missing | Test with Supabase `pg_policies` query after apply |
| Anonymize SEED_LOANS | NONE | SEED_LOANS is fallback display data only | No tests needed |
| stageNormalization consolidation | LOW | Contacts page stage display could show different string if unknown status | Check that 'Other' vs 'Lead' default behavior is acceptable; grep for any 'Other' comparisons |

**No HIGH RISK items this session.**

---

## Test Requirements

1. After migration 055: `SELECT policyname, cmd, qual, with_check FROM pg_policies WHERE tablename = 'performance_data'` — all 3 policies should show non-null qual or with_check
2. After stageNormalization removal: `npm run build` must pass with zero TypeScript errors
3. After SEED_LOANS anonymization: Navigate to Performance page while logged in — should show Supabase data (not seed data), so no visual change for existing users

---

## Files to Touch

**Builder is ONLY allowed to touch these files:**

- `supabase/migrations/055_fix_performance_data_rls.sql` — CREATE (new)
- `src/app/dashboard/performance/page.tsx` — MODIFY (SEED_LOANS names only)
- `src/app/dashboard/contacts/page.tsx` — MODIFY (import + call sites)
- `src/app/api/import/contacts/route.ts` — MODIFY (import + call sites)
- `src/app/api/contacts/quick-add/route.ts` — MODIFY (import + call sites)
- `src/app/api/contacts/bulk-action/route.ts` — MODIFY (import + call sites)
- `src/lib/stageNormalization.ts` — DELETE

**Everything else is off limits.**

---

## Week 2 Readiness Verdict

**Week 2 can begin next session.** The multi-tenant foundation is complete. The 3 items in this spec are small fixes, not blockers for moving the queue forward. Week 2 focus: Onboarding Flow — post-signup wizard, email confirmation, setup checklist, and verifying plan enforcement.
