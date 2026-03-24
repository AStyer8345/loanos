# Daily Health Audit — 2026-03-24

_First automated run. No prior baseline._

---

## Pipeline Health

| Metric | Value |
|--------|-------|
| Total loans | 853 |
| Total contacts | 2,375 |
| Total activity_log rows | 345 |
| Email drafts | 0 (table empty) |
| Activity gaps (last 14d) | None — all days have entries |
| Weekend dip | Mar 21: 5, Mar 22: 7 (normal) |
| Peak activity | Mar 24: 41 (today) |

### Stale Loans
Query returned 20 loans with `updated_at` 7+ days ago and non-terminal status. However, most are status `Closed` or `Dead` — these are functionally terminal but not in the exclusion list. The `status` column has **22 distinct non-terminal values** including case/format variants (`Closed` vs `closed`, `APPLICATION_INTAKE` vs `application`, `CLEAR_TO_CLOSE` vs `clear_to_close`). Status normalization remains a known tech debt item.

### Null Org ID (Recurring Issue — 4th occurrence)
| Table | Null rows (before fix) | Null rows (after fix) |
|-------|----------------------|----------------------|
| activity_log | **11** | **0** |
| contacts | 0 | 0 |
| loans | 0 | 0 |
| chat_sessions | 0 | 0 |

**Root cause breakdown (11 rows):**
- 8x `email_inbound` from Outlook Email Sync (n8n `JMmstRl2C5ylmuIY` — blocked on Azure App Registration)
- 3x `status_updated` from WF2 Arive Status Update (n8n `9JyzzwKac8v3uQ7d` — local fix exists but Adam hasn't pushed to n8n cloud)

---

## Build & Type Check

| Check | Result |
|-------|--------|
| `tsc --noEmit` | **PASS** (0 errors) |
| `npm run build` | **SKIP** — Google Fonts unreachable in this environment (network restriction). Not a code issue; Vercel deploys fine. |

---

## Code Quality Metrics

| Metric | Count | Baseline |
|--------|-------|----------|
| console.log statements | **2** | (first run) |
| Files with bg-white | **6** | (first run) |
| Files with bg-slate/bg-gray | **2** | (first run) |
| Orphaned components | **0** | (first run) |
| Unscoped Supabase queries | **1** (share endpoint — by design) | (first run) |

**console.log locations:**
- `src/lib/outlook/refresh.ts:106,118` — debug logging for token refresh (low priority, useful for debugging)

**Dark theme violations (bg-white):**
- `src/components/NavDropdown.tsx`
- `src/components/NavItem.tsx`
- `src/components/TopNav.tsx`
- `src/app/dashboard/scenarios/new/ScenarioCard.tsx`
- `src/app/dashboard/scenarios/new/StatementUpload.tsx`
- `src/app/dashboard/scenarios/ScenarioList.tsx`

---

## n8n Workflows

n8n MCP returned **0 workflows** on search — all 6 workflow IDs returned "not found." Likely a credentials/instance mismatch on the MCP server, not actual workflow deletion. **Adam should verify n8n MCP configuration.**

---

## Fix Applied (Structural)

### Migration 050: `activity_log` auto-org trigger

**Problem:** Null `organization_id` rows in `activity_log` have recurred 4 times (migrations 043, 046, 048, now). Each time we backfill, n8n workflows create new nulls.

**Fix:** Postgres `BEFORE INSERT` trigger (`trg_activity_log_stamp_org`) that auto-resolves `organization_id` from `profiles.organization_id` using the inserting `user_id`. If `user_id` is NULL or has no profile, org_id stays NULL (edge case).

**Impact:** All future inserts from any source (n8n, API routes, service role) will auto-stamp org_id as long as `user_id` is provided. This eliminates the recurring backfill pattern permanently.

**Applied to production:** Yes. Backfilled 11 rows. Verified 0 null org rows.

---

## Outstanding Items (Unchanged)

1. **Adam must push WF1 + WF2 to n8n cloud** — local JSON files are fixed but not live
2. **n8n Outlook Email Sync** — blocked on Azure App Registration
3. **n8n MCP configuration** — MCP server can't find any workflows; needs credential check
4. **Performance page on localStorage** — should move to Supabase before licensing
5. **`chat_sessions.organization_id` nullable** — safe to add NOT NULL after confirming 0 null rows persist
6. **Status normalization** — 22 distinct non-terminal status values with case/format variants
7. **Dark theme violations** — 6 files use `bg-white`, 2 use `bg-slate/bg-gray`

---

## TOMORROW_PRIORITY

**Dark theme violations in nav components** — `TopNav.tsx`, `NavDropdown.tsx`, `NavItem.tsx` use `bg-white`/`bg-slate-*` which breaks visual consistency with the dark zinc theme used everywhere else. These are visible on every page. Fix these 3 shared components first, then tackle the 3 scenario page files.
