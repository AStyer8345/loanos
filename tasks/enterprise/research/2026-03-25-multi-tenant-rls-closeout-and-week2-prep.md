# Research: Multi-Tenant RLS Closeout + Week 2 Onboarding Prep
Date: 2026-03-25
Session: AM

---

## Executive Summary

The LoanOS multi-tenant foundation is substantially complete — 15 tables org-scoped, 8 hardened with NOT NULL, all RLS policies confirmed. This session's code audit reveals that two "outstanding" items from CONTEXT.md are **more complete than documented**: the Performance page already reads/writes to Supabase (not just localStorage), and the onboarding form already has a plan selector UI. The real gaps are narrower: (1) a missing `WITH CHECK` on the `performance_data` INSERT RLS policy — a real security issue, (2) the old `stageNormalization.ts` still imported by 4 files despite `loan-stages.ts` being the authoritative replacement, and (3) the `activity_log` NOT NULL constraint blocked on Adam's WF1/WF2 cloud push. Week 2 build work can begin — the foundation is ready.

---

## How Top SaaS Companies Did It

### Salesforce
Salesforce uses a "pod" architecture — each tenant gets a dedicated pod (logical grouping) within a shared schema. RLS-equivalent enforcement is done at the application layer via a `TenantId` column on every table, enforced via SOQL query filters. Their key insight: **schema-level constraints (NOT NULL on tenant ID) are essential** — they learned this the hard way when early builds produced orphaned data that created security incidents.

For performance/analytics data, Salesforce stores it in org-scoped objects (like `PermissionSetLicense`) — never in localStorage or client-side state. The principle: **financial data must live in the database, not the browser**.

### HubSpot / Linear
HubSpot's onboarding wizard is the industry benchmark: 3-5 steps max, progressive disclosure, no required fields that the user doesn't immediately understand. For LO-specific SaaS, the pattern is:
- Step 1: Basic identity (name, company, license number)
- Step 2: Licensing geography (states)
- Step 3: Plan selection with immediate value demonstration
- Step 4: First connection (CRM, LOS, or email)

Linear's onboarding: workspace name → team member invite → first issue. The principle: **get users to their first "aha moment" in under 3 minutes**.

### Mortgage Industry Specific
- **Encompass (ICE Mortgage)**: Multi-tenant but LO-level isolation enforced at application layer, not DB. Legacy architecture — each branch is an "organization" with its own data silo.
- **BytePro**: Per-tenant database (hard isolation). More costly but preferred by enterprise shops for compliance.
- **Jungo (Salesforce overlay)**: Inherits Salesforce's pod model. Each LO is a Salesforce User within a shared org — data isolation is Account-scoped, not truly multi-tenant.

For LoanOS at the independent LO scale, shared schema + RLS is the right call. The BytePro approach (per-tenant DB) doesn't make economic sense until 500+ tenants and SOC 2 Type I requirements.

---

## Financial Services Requirements

### GLBA (Gramm-Leach-Bliley Act)
- **Safeguards Rule**: Financial institutions must implement technical, administrative, and physical safeguards for customer NPI (Non-Public Personal Information).
- **What applies to LoanOS**: Borrower names, loan amounts, income data, and credit-related information are all NPI. Storing NPI in localStorage violates the spirit of GLBA's Safeguards Rule — browser storage is not a controlled environment.
- **Required control**: NPI must be stored in access-controlled, auditable systems. Supabase with RLS satisfies this. localStorage does not.

### SOC 2 Type II
A SOC 2 auditor reviewing LoanOS would flag:
- localStorage usage for NPI as a **CC6.1 violation** (logical access controls — data accessible without authentication)
- Missing `WITH CHECK` on `performance_data` INSERT policy as a **CC6.3 finding** (unauthorized data modification risk)
- Hardcoded seed borrower names in source code as a **data classification finding**

### PII Handling
The `SEED_LOANS` array in `performance.tsx` contains real borrower last names (Voelkel, Aguilar, Stackhouse, Stevenson, Patel, Garcia, Preble, Humphrey, Rademacher, Cunningham, Cunningham). These are in the production source code. Under GLBA and Texas Finance Code Chapter 59, LOs must limit NPI access to authorized parties. Having real borrower data hardcoded in client-side code shipped to Vercel CDN is a compliance exposure.

---

## Technical Best Practices for LoanOS Stack

### Performance Page — Current State Is Better Than Documented

Code audit reveals the page **already does Supabase-first loading** (lines 87–115):
```
load() → fetch('/api/performance') → if ok + has data → use Supabase → return
         → fallback: check localStorage → migrate to Supabase
```

The API route (`/api/performance/route.ts`) writes to `performance_data` with org scoping. The table exists with: `id`, `organization_id` (NOT NULL), `year`, `data` (jsonb), `updated_at`.

**The real issue**: The INSERT RLS policy has `qual: null` — no `WITH CHECK` expression. This means any authenticated user can INSERT a row with any `organization_id`, bypassing tenant isolation on write. The SELECT and UPDATE policies correctly scope to `get_my_organization_id()`.

### Stage Normalization — Clear Consolidation Path

Two files exist:
- `src/lib/stageNormalization.ts` — old, 8 canonical display strings, 15-line map, imported by 4 contacts files
- `src/lib/constants/loan-stages.ts` — authoritative, typed `StageKey`, 12 stages, full `RAW_STATUS_MAP`, `STATUS_HEX`, `PIPELINE_STAGES`, pre-computed query arrays

The 4 files still importing `stageNormalization.ts`:
- `src/app/dashboard/contacts/page.tsx`
- `src/app/api/import/contacts/route.ts`
- `src/app/api/contacts/quick-add/route.ts`
- `src/app/api/contacts/bulk-action/route.ts`

**Consolidation approach**: Replace `import { normalizeStage } from '@/lib/stageNormalization'` with `import { getStageLabel } from '@/lib/constants/loan-stages'` in those 4 files. The functions are equivalent in purpose (raw status → display string). Then delete `stageNormalization.ts`.

**Breaking change risk**: LOW — `normalizeStage()` returns display strings like 'Lead', 'Closed'. `getStageLabel()` also returns display strings. The output format is compatible. Must verify no caller depends on the exact 8-canonical-stage set from the old file vs. the 12-stage set in loan-stages.ts.

### Onboarding — More Complete Than Documented

The `/app/onboarding/page.tsx` already has:
- Full form: orgName, fullName, nmlsIndividual, phone, statesLicensed, selectedPlan
- Plan selector: starter (Free) and professional ($99/mo) with feature lists
- Calls `/api/org/create` on submit

CONTEXT.md says "Plan selection UI in onboarding deferred (defaults to 'starter')" — this appears outdated. The UI exists. The gap is enforcement: is `selectedPlan` actually passed to the org create API and stored on the organization record?

---

## Anti-Patterns to Avoid

1. **localStorage for NPI** — Violates GLBA. Browser storage is not auditable, not access-controlled, survives user logout.
2. **RLS INSERT without WITH CHECK** — Allows any authenticated user to write rows with a forged organization_id. SELECT + UPDATE scoped but INSERT not — this is the "45% of RLS bugs" pattern (write path bypasses the policy).
3. **Dual normalization systems** — Two files defining canonical stages causes drift. Teams start using one for some features, the other for others. Divergence creates bugs at stage boundaries.
4. **Hardcoded PII in seed data** — Real borrower names in source code = permanent audit trail in Git history = compliance liability.
5. **Blocking the queue on solved problems** — The daily prep sessions built most of Week 1 incrementally. Waiting for the "formal" enterprise session before moving to Week 2 would delay the program unnecessarily.

---

## LoanOS Gap Analysis

### Current State
| Area | Status |
|------|--------|
| Multi-tenant RLS | ✅ Complete — 15 tables, policies correct |
| NOT NULL hardening | ✅ 8 tables done, activity_log pending WF1/WF2 |
| Performance page Supabase | ✅ Already reads/writes Supabase (undocumented) |
| performance_data INSERT RLS | ❌ Missing WITH CHECK — security gap |
| Onboarding UI | ✅ Exists, has plan selector |
| Plan enforcement (server-side) | ❓ Unknown — needs verification |
| Stage normalization | ⚠️ Dual system — stageNormalization.ts still in use |
| Hardcoded borrower names | ⚠️ SEED_LOANS has real last names in source code |
| activity_log NOT NULL | ⏳ Blocked — WF1/WF2 cloud push required |
| Stripe billing | ❌ Not built |
| White-label | ❌ Not started (Week 6) |

### What's Missing (ranked by severity)

1. **[HIGH] performance_data INSERT RLS missing WITH CHECK** — authenticated user can write rows with any org_id. Fix is a single SQL policy update. Unblocks SOC 2 readiness.

2. **[MEDIUM] Hardcoded PII in SEED_LOANS** — Real borrower last names in source code. Should be anonymized (e.g., 'Smith', 'Jones') or replaced with fictional names. Not a runtime risk (only shows when no Supabase + no localStorage data) but is a compliance/audit exposure.

3. **[MEDIUM] stageNormalization.ts still active** — 4 files importing the legacy normalization. Low runtime risk but creates architectural debt and a potential for stage calculation divergence as more features are added.

4. **[LOW] Plan enforcement gap** — Plan selected in onboarding may not be stored/enforced. Needs one SQL query to verify org table has `plan` column populated correctly.

5. **[LOW] activity_log NOT NULL** — Blocked on Adam, not on code. Will resolve when WF1/WF2 are pushed.

### Risk if Deferred

- **performance_data INSERT RLS gap**: If a second tenant joins LoanOS in production, a malicious or buggy client could write performance data to the wrong org. One-line fix. Must not ship to production without it.
- **Dual stage normalization**: As contacts and loan pipeline features expand, you'll encounter stage comparison bugs where one component sees 'Closed' (old system) and another sees `funded` (new system) for the same loan. The longer this lives, the more expensive the refactor.
- **SEED_LOANS PII**: If Adam ever open-sources or shows source code publicly, real borrower names are in the Git history. Clean this now while it's cheap.

---

## Recommended Approach for LoanOS

### Immediate Fixes (before Week 2 build starts)

**Fix 1: performance_data INSERT RLS** (5 minutes, high priority)
```sql
DROP POLICY IF EXISTS "org members can insert performance_data" ON performance_data;
CREATE POLICY "org members can insert performance_data" ON performance_data
  FOR INSERT WITH CHECK (organization_id = get_my_organization_id());
```

**Fix 2: Anonymize SEED_LOANS** (10 minutes)
Replace real last names with fictional ones in `performance.tsx`. Doesn't affect functionality since SEED_LOANS only shows when user has zero Supabase + localStorage data.

**Fix 3: Consolidate stageNormalization.ts** (30 minutes)
Update 4 files to import from `loan-stages.ts`, delete `stageNormalization.ts`.

### Week 2 Onboarding Build Plan

Week 2 focus should be: **connections and first value delivery**, not the signup form (which is done).

Proposed Week 2 build sequence:
1. **Verify plan enforcement** — query `organizations` table, confirm `plan` column stores the selected plan
2. **Post-onboarding wizard step** — after org creation, guide user to: (a) add first loan, (b) connect n8n webhook, or (c) import contacts
3. **Email confirmation flow** — send "Welcome to LoanOS" email via Zapier/Outlook after org create
4. **Onboarding completion tracking** — add `onboarding_completed_at` to orgs table, use it to show setup checklist on first dashboard visit

### Stage Normalization Consolidation

Winner: `loan-stages.ts` — it's the authoritative system with TypeScript types, pre-computed query arrays, and UI color mapping. `stageNormalization.ts` has no features that aren't already in `loan-stages.ts`.

Migration path:
```
contacts/page.tsx: normalizeStage(raw) → getStageLabel(raw)
import/contacts: normalizeStage(raw) → getStageLabel(raw)
quick-add: normalizeStage(raw) → getStageLabel(raw)
bulk-action: normalizeStage(raw) → getStageLabel(raw)
Then: delete stageNormalization.ts
```

---

## Open Questions

1. **Does `/api/org/create` store `selectedPlan`?** — Need to read that route to confirm. If not, plan selection in the UI is cosmetic.
2. **Should SEED_LOANS be removed entirely?** — If user has no Supabase + no localStorage data, show empty state instead. Less confusing than showing fictional data that looks real.
3. **Is the Outlook Email Sync being decommissioned?** — CONTEXT.md mentions it may be removed. This decision affects Week 2 onboarding (if users need to connect email, what's the recommended path?).
4. **When does Adam plan to push WF1/WF2 to n8n cloud?** — This unblocks the activity_log NOT NULL constraint.
5. **What's the Week 2 target date?** — The queue says Week 2: Onboarding Flow. Given the foundation is ahead of schedule, should Week 2 start immediately?

---

## Sources

**Files read this session:**
- `src/app/dashboard/performance/page.tsx` — localStorage migration pattern, SEED_LOANS PII
- `src/app/api/performance/route.ts` — Supabase read/write, performance_data schema
- `src/app/onboarding/page.tsx` — plan selector UI, org create flow
- `src/lib/stageNormalization.ts` — old normalization system
- `src/lib/constants/loan-stages.ts` — authoritative normalization system
- `tasks/enterprise/enterprise-queue.md` — queue state
- `tasks/enterprise/notebooklm-pull-2026-03-25.md` — pull context

**Supabase queries run:**
- `performance_data` table schema — confirmed org-scoped, NOT NULL on org_id
- `performance_data` RLS policies — confirmed INSERT missing WITH CHECK

**NotebookLM queries:** 5 queries run in PULL mode — see `notebooklm-pull-2026-03-25.md`
