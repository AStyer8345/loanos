# Drip System Data-Integrity Audit — 2026-04-27 AM

**Author:** Lead Gen Master Orchestrator (autonomous AM session)
**Scope:** Verify the 2026-04-26 AM terminate-guard, audit existing enrollments, confirm cron-firing readiness end-to-end.
**Outcome:** Headline finding outweighs the original audit scope. The drip cron has never run successfully in prod — the Supabase RPC it depends on referenced two non-existent columns and was returning 500 on every tick. Fixed this session.

---

## Headline Findings

### 🔴 CRITICAL — `get_due_drip_enrollments()` RPC was broken (FIXED)

The cron handler at `src/app/api/drip/run/route.ts:36` calls `supabase.rpc('get_due_drip_enrollments')`. That RPC's SELECT referenced two non-existent columns:

| Bad reference | Real column |
|---|---|
| `ct.status` (contacts) | `ct.stage` |
| `l.rate` (loans) | `l.interest_rate` |

Effect: Every call returned PostgREST error 42703. The route at line 38 catches `rpcErr` and returns 500. The Vercel cron would have failed silently every hour. The whole drip pipeline could not function — even if `CRON_SECRET` were set, no email would ever be sent.

**Fix applied this session via two migrations:**
- `fix_get_due_drip_enrollments_contact_status_column` — `ct.status` → `ct.stage AS contact_status`
- `fix_get_due_drip_enrollments_loan_rate_column` — `l.rate` → `l.interest_rate AS loan_rate`

Return-type signature preserved (`contact_status text`, `loan_rate numeric`) so generated `database.types.ts` continues to validate. No application code reads `contact_status` (verified via grep), so the source-column swap is invisible downstream.

**Verification:** `SELECT COUNT(*) FROM get_due_drip_enrollments()` now returns `{due_count: 0}` (no error). Pipeline is plumbing-clean.

### 🟡 The drip pipeline has never sent a single email

| Metric | Count |
|---|---|
| `drip_sends` total ever | **0** |
| `drip_enrollments` total | **0** |
| Active campaigns in DB | 8 |
| Mailable contacts | 2,606 |

Adam's mental model in CONTEXT.md was that drip was "shipped, blocked on `CRON_SECRET`". Reality: even with `CRON_SECRET` set, the drip would have 500'd on the broken RPC. With both fixes (this session's RPC fix + Adam's `CRON_SECRET`), the cron will return cleanly — but still won't fire emails because **zero contacts are enrolled**. Manual enrollment UI shipped 2026-04-22 (`+ ENROLL` on contact detail) but has not been used.

### 🟠 Three active campaigns have NO authored email content

| Campaign | DB id | DB step count | Registered in `authored-emails.ts`? |
|---|---|---|---|
| PA Welcome Nurture | `8b540726…0705d` | 6 | ✅ 6/6 |
| DPA Guide Nurture | `46ea4f7b…2da70` | 8 | ✅ 8/8 |
| Lead — Ghost Referral | `dc370748…c09574` | 4 | ✅ 4/4 |
| Lead — Incomplete App | `cd488533…f53bf` | 3 | ✅ 3/3 |
| Lead — Went Quiet | `2c0382a5…e557c` | 4 | ✅ 4/4 |
| **Long-Term Nurture** | `7fd91187…de109` | 2 | ❌ 0/2 |
| **Past Client Retention** | `92706ea7…ddab7a` | 6 | ❌ 0/6 |
| **Realtor Relationships** | `ef52ed56…cf17b6` | 4 | ❌ 0/4 |

Any contact enrolled in those three campaigns will be silently terminated by the 2026-04-26 AM terminate-guard with `removed_reason='no_authored_content'`. The guard works correctly — but it means three campaigns the user thinks are "active" can't actually fire.

**Important: "Realtor Relationships" already exists in Supabase as an active campaign.** The 2026-04-26 spec at `tasks/lead-gen/specs/2026-04-26-realtor-relationship-drip-spec.md` proposed creating it from scratch. Re-using the existing campaign is preferable to the spec's "INSERT new campaign" path. This changes the Realtor Relationship build scope significantly — see Recommendations.

### 🟠 Realtor Relationship spec SQL was wrong about the schema

Spec lines 38–51 propose `INSERT INTO drip_campaigns (id, org_id, name, slug, status, trigger_type, audience)`. Real schema has no `slug` column and `trigger_type` is on `drip_steps`, not `drip_campaigns`. If the spec had been built as-written it would have failed on first SQL apply. With the existing-campaign discovery above, this is moot for Realtor Relationships specifically, but flag it for any future spec that touches this schema.

---

## Eligibility Sizing (informational)

| Audience proxy | Count |
|---|---|
| Total contacts | 2,938 |
| Mailable email | 2,606 |
| `contact_type='realtor'` | 1,173 |
| `lead_source='Realtor Referral'` | 481 |
| `referral_ytd_count > 0` (immediate Realtor Relationship candidates) | **28** |
| `lead_source='Pre-Approval Funnel'` | 0 |

The 28 realtors with active YTD referrals are the ready audience for Realtor Relationships once the campaign has authored content. The PA funnel zero is striking — leads from get-preapproved.html may be using a different `lead_source` value (or the column isn't being populated). Worth a separate investigation.

---

## What's Now Unblocked

1. **`CRON_SECRET` once set will produce a clean 200 response** rather than a 500. The hourly cron will no-op until enrollments exist, but the plumbing is verified.
2. **Manual enrollments (UI + POST `/api/drip/campaigns/{id}/enrollments`)** can now actually flow through the cron path for the 5 fully-registered campaigns (PA, DPA, Ghost Referral, Incomplete App, Went Quiet).
3. **Realtor Relationships build** is now a content-only task — the campaign + 4 steps already exist in Supabase. Builder needs only: `DRIP_CAMPAIGN_IDS.REALTOR_RELATIONSHIPS = 'ef52ed56-8a22-4d15-9f12-a1796ccf17b6'`, four authored emails in `authored-emails.ts`, and the n8n trigger wire (after Adam's activation-criteria call).

---

## Recommendations

### For Adam
1. Set `CRON_SECRET` in Vercel (was already on TODO; it's now actually load-bearing).
2. Decide Realtor Relationships activation criteria + cadence (open call from CONTEXT.md). The 4 DB steps exist — Adam's input lets the builder write content matched to whatever cadence he wants.
3. Decide whether Long-Term Nurture (2 steps, annual_date) and Past Client Retention (6 steps, mixed) are real plans or test rows. If real, content needs to be authored. If test, set `status='archived'` to remove from the cron's eligible set.
4. Investigate why `lead_source='Pre-Approval Funnel'` returns zero contacts despite get-preapproved.html being live with a `lead_source: 'Pre-Approval Funnel'` field. Either the form isn't writing it, or it's normalized elsewhere.

### For Builder (next lead-gen session)
1. Pivot the "Realtor Relationships build" from "create campaign + steps" → "author 4 emails + register UUID". Spec at `tasks/lead-gen/specs/2026-04-26-realtor-relationship-drip-spec.md` is partly invalidated — only the email copy and n8n-wire steps remain.
2. Consider archiving Long-Term Nurture and Past Client Retention until content exists, or backfill content for them.
3. After `CRON_SECRET` is set, manually enroll one test contact (e.g., Adam's own contact record) in PA Welcome to verify the full loop end-to-end.

---

## Audit Queries Run

```sql
-- Active campaigns + step counts
SELECT c.id, c.name, c.status, c.audience, COUNT(s.id) AS step_count, ...
FROM drip_campaigns c LEFT JOIN drip_steps s ON s.campaign_id = c.id
WHERE c.status='active' GROUP BY ... ;

-- Enrollment audit (returned [] → zero enrollments)
SELECT c.name, e.status, COUNT(*), ... FROM drip_enrollments e JOIN drip_campaigns c ... ;

-- drip_sends history (returned 0 across all windows)
SELECT COUNT(*), COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours'), ... FROM drip_sends;

-- Contact eligibility scope
SELECT 'mailable_email', COUNT(*) FROM contacts WHERE email IS NOT NULL AND email <> '' AND (email_opt_out = FALSE OR email_opt_out IS NULL);

-- RPC verification (post-fix)
SELECT COUNT(*) FROM get_due_drip_enrollments();   -- → 0, no error
```

## Migrations Applied

- `fix_get_due_drip_enrollments_contact_status_column` (2026-04-27 ~03:30 CT)
- `fix_get_due_drip_enrollments_loan_rate_column`     (2026-04-27 ~03:35 CT)

Both are `CREATE OR REPLACE FUNCTION` calls — pure DDL on a single SECURITY DEFINER function. Reversible. No data mutated.

## What This Session Did Not Do

- Did not enroll any contacts (would have changed prod data state).
- Did not build the Realtor Relationships content (Adam's activation criteria still open).
- Did not modify n8n workflows.
- Did not regenerate `database.types.ts` — the return-type signature was preserved deliberately so the generated types still validate without a regenerate.
- Did not push code (no application code changed; only DB function definitions via Supabase MCP).
