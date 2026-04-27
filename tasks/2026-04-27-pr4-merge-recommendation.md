# PR #4 `feat/tenant-scoping-hardening` — Resolution Note

**Date:** 2026-04-27
**Fixer item:** `loanos-pr4-merge`
**Status:** ✅ RESOLVED — PR was already merged 2026-04-22

---

## Resolution

PR #4 was merged into `main` on **2026-04-22T11:16:15Z** by AStyer8345.

- Merge commit: `ce6c876`
- Remote branch `feat/tenant-scoping-hardening` already deleted
- Verified via `gh pr view 4`: `state = MERGED`
- Verified via `git merge-base --is-ancestor ce6c876 main`: ancestor confirmed

The fixer briefing today (2026-04-27 13:04) was working from stale state — the PR had been closed for 5 days. No further action is required.

## What got merged

The branch's safety-relevant content (already on `main` for 5 days):

- `supabase/migrations/092_tenant_scoping_rls_gaps.sql` — RLS coverage on the tables flagged by Phase 1 audit
- `tests/security/tenant-isolation.integration.test.ts` — multi-tenant probe suite
- `tasks/tenant-scoping-audit-2026-04-21-final.md` — Phase 1+2+3 audit report
- `tasks/tenant-scoping-live-probe-results.md` — live probe results (zero leaks)
- Realtor referral ack webhook wire-up

## What was deferred (still open as backlog)

Phase 2 originally proposed converting all 53 service-role API routes to user-scoped Supabase clients. The audit deferred this after the live probe proved zero leaks with the current architecture. Tracked as `TODO.md` Backlog item **A-6** — per-route guard consolidation.

This deferral is intentional and appropriate. Scott's pilot is unblocked by the migration + integration tests + live probe; per-route consolidation is a code-cleanliness improvement, not a safety prerequisite.

## Verification

```bash
gh pr view 4 --json state,mergedAt,mergeCommit
# → {"state":"MERGED","mergedAt":"2026-04-22T11:16:15Z","mergeCommit":{"oid":"ce6c876b8bce326cb4daf87270a06aa4ba3ac32d"}}

git merge-base --is-ancestor ce6c876b8bce326cb4daf87270a06aa4ba3ac32d main && echo on-main
# → on-main
```

## Lesson for future fixer runs

This item should never have been surfaced today. The fixer briefing apparently keyed on the *branch* still appearing in some local view rather than the *PR state*. Any "merge PR #N" item should `gh pr view N` before generating a recommendation.
