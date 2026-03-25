# Multi-Tenancy Session — 2026-03-25 (session 3)

## COMPLETED_THIS_SESSION

- [Vercel deployment] — Triggered `vercel deploy --prod` for commit `f805607` (session 2 work was pushed but Vercel webhook hadn't fired). Deploy `dpl_GrVYvkZVDX2TFWx5WJdYT15ec19F` confirmed READY.

- [activity_log null check] — Verified 0 null org_id rows in activity_log (24h after WF1/WF2 fix). Safe to apply NOT NULL.

- [migration 055] — `ALTER TABLE activity_log ALTER COLUMN organization_id SET NOT NULL`. Applied successfully. All 15 tables now have NOT NULL on organization_id.

- [isolation test] — `scripts/verify-tenant-isolation.ts` ran clean after fixing script bug (test inserts were missing `user_id` after migration 053 added NOT NULL). Fixed script to fetch a real user ID from profiles. **7/7 checks passed.**

- [scripts/verify-tenant-isolation.ts] — Added `user_id: TEST_USER_ID` to test loan and contact inserts. Added dynamic fetch of `TEST_USER_ID` from profiles (required by FK constraint). No logic change — same isolation checks.

## CHECKLIST_STATUS

- Tables with org_id: 15/15
- Tables with full RLS: 15/15
- Tables with NOT NULL org_id: **15/15** ✅ (migration 055 completed activity_log)
- API routes scoped: all known routes ✅
- Onboarding steps built: 6/6 ✅
- Isolation test: **7/7 PASSED** ✅
- Null org rows: All 0 ✅
- n8n WF1 org_id: ✅ Fixed
- n8n WF2 org_id: ✅ Fixed
- Performance page PII: ✅ Fixed (localStorage → Supabase)
- Plan selection UI: ✅ Added to onboarding

## BLOCKED_ITEMS

None. All multi-tenancy hardening tasks are complete.

## NEXT_SESSION_PRIORITY

Multi-tenancy is done. Next priorities (from multitenancy-checklist.md):
1. Stripe billing integration — gate features by plan (starter vs professional)
2. Tenant onboarding flow end-to-end test with a second real account
3. Admin/ops tooling — view all organizations, usage stats

## LESSONS_LEARNED

- n8n HTTP Request nodes unwrap single-element JSON arrays from Supabase. If Supabase returns `[{organization_id: "..."}]`, n8n gives you `$json = {organization_id: "..."}`. Always use `.json?.organization_id`, NEVER `.json[0]?.organization_id`.
- Regenerating database.types.ts after adding NOT NULL columns will break TypeScript builds for any insert that omits the newly-required field. Treat type regen as a "compile pass" that reveals hidden bugs — this is good.
- The `as const` pattern on PLANS array requires specifying `id` type as `'starter' | 'professional'` on state to avoid widening.
- Test scripts that insert rows must provide all NOT NULL FK columns — after schema hardening, test scripts need updating too.
- `vercel deploy --prod` from CLI manually triggers production deploy when GitHub webhook doesn't fire.
