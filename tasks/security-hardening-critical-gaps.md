# Security Hardening — Critical Gaps Tracker

**Created:** 2026-04-05
**Context:** Pre-rollout security audit before onboarding LO #2 to LoanOS.
**Owner:** Adam Styer

This file tracks the critical and medium-priority security gaps identified
during the multi-tenant readiness audit. The **Arive webhook fix** is being
handled in its own PR (migration 075 + `src/lib/los/*` + new route). The
remaining items below are follow-up PRs that should ship before paid
onboarding of additional LOs.

---

## 🔴 Critical — must ship before LO #2 signs up

### 1. ~~Arive webhook multi-tenant routing~~ ✅ SCAFFOLDED (Option B — Zapier middleman)
- **Status:** Scaffolded 2026-04-05. Arive does NOT offer direct API access
  to third-party SaaS integrators — Zapier is the only supported path. Each
  LO runs their own Zapier account ($20/mo) with their own Arive credentials;
  Zapier enriches Arive's thin webhook ping into a full loan payload and
  POSTs to LoanOS with a per-org shared secret header. Defense in depth:
  slug + hashed secret + payload identity allowlist. Awaiting Adam's
  contribution to `src/lib/los/verifyLosPayload.ts` (1 field-name lookup).
- **Files:**
  - `supabase/migrations/075_los_integrations.sql` — hashed secret + allowlist columns
  - `src/lib/los/hashSecret.ts` — SHA-256 + salt + timing-safe verify
  - `src/lib/los/resolveOrgFromSlug.ts` — slug → org + integrations
  - `src/lib/los/verifyLosPayload.ts` ← Adam's 5-line contribution pending
  - `src/app/api/webhooks/los/arive/[org_slug]/route.ts` — 3-layer verification route
  - `src/app/api/arive-webhook/route.ts` — legacy, deprecated (30-day grace)
- **Adam's contribution:** Open a recent Zap run in Zapier and identify which
  field in the webhook body contains the loan officer's email / Arive user ID.
  Fill in the `extractPayloadIdentity()` stub in `verifyLosPayload.ts` so
  layer 3 can match against the org's allowlist rows.
- **Rollout plan:**
  1. Adam fills in `extractPayloadIdentity()` with the real field name
  2. Apply migration 075 to Supabase
  3. Build onboarding UI: LO clicks "Connect Arive" → LoanOS generates slug +
     webhook secret → shows the URL + secret + Zap setup instructions
  4. Seed `los_integrations` row for Adam's org (slug, secret, allowlist email)
  5. Update Adam's Zap to POST to the new URL with the new secret header
  6. Shadow mode for 14 days, monitor logs for layer-3 mismatches
  7. Flip `org_settings.los_verification_mode` to `'enforce'`
  8. After 30 days of zero traffic on `/api/arive-webhook`, delete it
  9. Document Zap setup runbook for onboarding new LOs (screenshots of the
     Zap config with field mapping)
  10. Pricing note: each LO must pay for their own Zapier Starter plan ($20/mo)
     — include in LoanOS pricing page as a required add-on

### 2. ~~Rate limiting on public endpoints~~ ✅ PARTIAL (2026-04-05)
- **Done:** `POST /api/contacts/web-lead` throttled at 30 req/min by client IP via `checkRateLimit`. `GET /api/share/[token]` throttled at 60/min by IP + 30/min by token (two-key defense). Both return 429 on exceed.
- **Still pending:**
  - hCaptcha on `styermortgage.com` side before webhook fires
  - Idempotency key support (same key in 5min → no-op)
  - Audit remaining unauthenticated form-submit routes for same treatment

### 3. ~~PII masking in activity logs~~ ✅ DONE — Phase 1 (2026-04-05)
- **Completed:** Option C (split table + app-layer AES-256-GCM encryption).
  - `supabase/migrations/079_activity_log_pii.sql` — companion table with
    `pii_ciphertext`/`pii_iv`/`pii_tag`/`key_version`, deny-all RLS except
    owner/admin select, service-role insert
  - `src/lib/activity/pii.ts` — encrypt/decrypt helpers, `writeActivityWithPii`
    dual-write helper (inline + encrypted companion), `decryptActivityPii` for
    future server-side reads
  - `POST /api/activity` — server-side endpoint for client components
  - 5 high-PII write sites converted: automations/send, email/draft/send,
    contacts/quick-add, contacts/web-lead, processWebhook.ts (Arive)
  - `scripts/backfill-activity-pii.ts` — re-runnable backfill for existing rows
  - Encryption key in `PII_ENCRYPTION_KEY` env var (Vercel), never in DB
- **Phase 2 DONE (2026-04-05):** Server-side `GET /api/activity` read endpoint
  with PII decryption. All 6 client-side read sites converted from direct
  `supabase.from('activity_log')` to `fetch('/api/activity?...')`:
  - `ActivityFeed.tsx` (bell notification panel)
  - `SendHistoryList.tsx` (automation send history)
  - `contacts/[id]/page.tsx` (contact detail — two queries: by contact + by linked loans)
  - `loans/[id]/page.tsx` (loan detail — activity + inbound emails, 3 queries)
  - `emails/unmatched/page.tsx` (unmatched inbound emails)
  - `admin/tenants/[id]/route.ts` (server-side — joins + decrypts directly)
  - Dashboard page NOT changed (only reads non-PII: action, loan_id, occurred_at)
- **Remaining phases:**
  - Phase 3: Run backfill script against production (1,089 rows)
  - Phase 4: Migration 080 — DROP plaintext columns from activity_log
- **Effort:** Phase 1-2 complete. ~1 hour for remaining phases.

### 4. ~~Admin-route authorization audit~~ ✅ DONE (2026-04-05)
- Audited all 5 existing `/api/admin/*` routes — every handler calls `requireAdmin()` on line 1. Clean.
- Added middleware-level enforcement in `src/middleware.ts`: every `/api/admin/*` request hits a `system_admins` membership check via an inline service-role client before reaching the route. 401 if no session, 403 if not an admin. Defense-in-depth so a future dev forgetting `requireAdmin()` still can't leak.
- **Still deferred:** lint rule / unit test that flags admin routes missing the import (nice-to-have).

---

## 🟡 Medium — ship before LO #10

### 5. SSN / DOB / income encryption at rest
- Use application-layer encryption (pgsodium or encrypt-before-insert) for the
  top sensitive fields. GLBA attorney conversation needed to finalize scope.

### 6. ~~CORS + CSP headers~~ ✅ DONE (2026-04-05)
- **CSP** added to `next.config.mjs`: default-src self, connect-src scoped to Supabase + Vercel analytics, frame-ancestors self, object-src none, upgrade-insecure-requests. Script-src still includes `'unsafe-inline'` + `'unsafe-eval'` because Next.js 14 ships inline scripts without nonces — future nonce rollout would let us drop both.
- **HSTS** (`max-age=2y; includeSubDomains; preload`) added alongside CSP.
- **CORS audit — no action needed.** Zero `Access-Control-Allow-Origin` in `src/`; Next.js SOP already covers browser cross-site calls, and server-to-server callers (n8n, Zapier, Arive) are CORS-exempt.

### 7. ~~Secret rotation runbook~~ ✅ DONE (2026-04-05)
- **`docs/security/secret-rotation-runbook.md`** — executable runbook covering every LoanOS secret: Supabase service role key, anon key, `LOANOS_AGENT_SECRET`, `ANTHROPIC_API_KEY`, per-org Arive webhook secrets, `PUBLER_API_KEY`. Each section has When / Steps / Verify / Rollback and names the exact n8n workflow IDs, Vercel env vars, and `los_integrations` rows to touch.
- **Constraint documented honestly:** `validateAgentSecret()` holds a single secret, so `LOANOS_AGENT_SECRET` rotation has a ~30s switch-over window. Runbook flags this and proposes a dual-secret overlap enhancement as future work.
- **Per-org Arive rotation is clean** — `los_integrations` allows multiple `active = TRUE` rows per (org, provider), and the webhook handler iterates on layer 2. Insert new row, shift traffic, deactivate old row. No downtime.
- **KB cross-linked:** `LOANOS_SYSTEM_KNOWLEDGE_BASE.md` § Security Posture has a full secret inventory table with pointers back to the runbook sections.

### 8. ~~Webhook idempotency~~ ✅ DONE (2026-04-05)
- **Migration 078** — new `webhook_deliveries` table with `UNIQUE (organization_id, source, idempotency_key)`, deny-all RLS, partial index on `loan_id`.
- **`src/lib/webhooks/idempotency.ts`** — shared helpers. Key derivation prefers `X-Idempotency-Key` header, falls back to SHA-256 of `[arive_loan_id, arive_updated_at]`.
- **Arive route** now claims a delivery row before processing. Postgres `23505` unique-violation short-circuits to `200 {success: true, deduped: true}` without re-running party contact upserts, date derivation, or activity log inserts. Failed deliveries keep the row (no retry storm on broken payloads; bump the key upstream to retry).
- The existing `(arive_loan_id, organization_id)` unique on `loans` from migration 070 already handled loan-record merging; this closes the gap on *surrounding* work (5 party upserts + activity_log rows per retry).

### 9. Admin action audit log
- Separate from borrower `activity_log` — logs org creation, role changes,
  admin API access, billing changes, etc.
- Immutable, retained 7 years for compliance

### 10. System admin vs org admin separation
- `system_admins` table is currently global. Plan clear separation between
  Adam/engineering (cross-tenant) and org owners/admins (within-tenant only)
- Update `requireAdmin()` to distinguish the two contexts

---

## 🟢 Low — polish, post-launch

### 11. File upload size limits at API level (currently only Supabase Storage limits)
### 12. IP allowlisting for LOS webhooks as defense-in-depth (Arive IP ranges)
### 13. SOC 2 Type 1 kickoff (Vanta/Drata) — before enterprise LO onboarding

---

## ✅ Completed in 2026-04-05 hardening session

Audit findings from `audits/SECURITY-AUDIT-2026-04-05.md` resolved:

- **A-1 Arive webhook multi-tenant** — scaffolded via Zapier middleman (`/api/webhooks/los/arive/[org_slug]`), legacy route deprecated with 30-day grace
- **A-2 Daily-briefing first-org fallback** — agent-secret path now requires explicit `org_slug` query param
- **A-3 Web-lead route** — `org_slug` is now a required body field; removed `LOANOS_SYSTEM_USER_ID` ambient resolution; attribution now goes to org owner/admin profile
- **A-4 Marketing/log first-org fallback** — agent-secret path now requires `org_slug` (query or `X-Org-Slug` header), resolves to owner/admin profile
- **S-1 Hardcoded n8n/loanos.vercel.app URLs** — removed from `scenarios/generate-pdf`, `scenarios/send-email`, `automations/email/generate`, `automations/registry/*`, `getting-started` wizard, `loans/[id]` trigger UI. All now require env vars (`N8N_API_BASE`, `N8N_WEBHOOK_BASE`, `NEXT_PUBLIC_APP_URL`, etc.) and fail closed.
- **S-2 Hardcoded Publer account IDs** — `/api/social/publish` now loads `publer_config` from `social_settings` per-org; fails 400 if unconfigured. No more posting customer content to Adam's personal IG/LI/FB.
- **S-3 Hardcoded NMLS 513013 / Adam Styer identity** — stripped from share pages, carousel renderer, carousel builder, social post preview, scenarios PDF generator, default outreach prompt. All now load per-org branding from `organizations` + `user_settings`.
- **S-4 Waitlist page direct service-role + hardcoded email admin** — moved to `createServiceClient()` helper; admin gate now reads `system_admins` table by user_id.
- **F-1 Plan gating** — `src/lib/billing/requirePlan.ts` + middleware enforcement for professional-tier routes.
- **Migration 076** — RLS + policy + storage fixes applied to Supabase.
- **A-5 Public share endpoint column whitelist** — `/api/share/[token]` replaced `.select('*')` with explicit column list so future scenarios columns don't leak to borrowers.
- **A-7 Drip steps cross-tenant enumeration** — `getSteps()` now requires `orgId` and filters `drip_steps` by `org_id`. (A-8 POST insert verified — already sets `org_id: organizationId` explicitly.)
- **A-10 Unauthenticated admin routes** — `requireAdmin()` gate added to `/api/admin/backfill-party-links` and `/api/admin/import-salesforce-referrals`. Both were previously accessible to any authenticated user.
- **A-9 Chat lender tool tenant discipline** — queries extracted into `src/lib/chat/lenderQueries.ts`. All entry points require `organizationId` as first arg, throw on blank ids, log mismatches. Adds second layer of safety on top of the existing `.eq()` filter.
- **A-12 Onboarding step user-scoped** — `/api/onboarding/step` swapped from `createServiceClient()` to `createClient()`. RLS backstop applies.
- **Rate limit web-lead + share** — `/api/contacts/web-lead` (30/min per IP) and `/api/share/[token]` (60/min per IP + 30/min per token) now throttled via `checkRateLimit`.
- **Atomic scenarios view_count** — migration 077 adds `increment_scenario_view_count(uuid)` RPC (SECURITY DEFINER). Share route no longer does lossy read-then-write.
- **Middleware admin gate** — `/api/admin/*` now enforced at `src/middleware.ts` via inline service-role `system_admins` lookup. All 5 existing admin handlers still call `requireAdmin()` on line 1 (verified) — middleware is the resilience floor for future routes.
- **Webhook delivery idempotency** — migration 078 `webhook_deliveries` table + `src/lib/webhooks/idempotency.ts` helpers + Arive route dedupe check. Duplicate Zapier retries no longer double-process party contact upserts or activity log inserts.
- **Secret rotation runbook** — `docs/security/secret-rotation-runbook.md` ships with procedures for every secret LoanOS holds. `LOANOS_SYSTEM_KNOWLEDGE_BASE.md` § Security Posture added as the AI-session reference entry point.

---

## Non-code items (business / legal)

- [ ] GLBA-aware attorney consultation before taking first LO payment
- [ ] Cyber liability insurance quote
- [ ] Written Information Security Program (ISP) document
- [ ] Data Processing Addendum (DPA) template for LOs
- [ ] Incident response plan (who to notify, timelines, breach disclosure)
- [ ] Terms of Service + Privacy Policy review for multi-tenant
