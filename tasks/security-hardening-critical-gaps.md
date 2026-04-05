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

### 2. Rate limiting on public endpoints
- **Endpoint:** `POST /api/contacts/web-lead` (and any other unauthenticated form submit)
- **Risk:** No throttle, no CAPTCHA. Script kiddie → activity log + Supabase row explosion + junk contacts.
- **Fix:**
  - Add IP-based rate limit (10/min per IP) using `@upstash/ratelimit` or
    equivalent — the `src/lib/rateLimit.ts` helper already exists, check if reusable
  - Add hCaptcha on `styermortgage.com` side before webhook fires
  - Add idempotency key support (if same key seen twice in 5min → no-op)
- **Effort:** ~2 hours
- **Blocker for:** public launch

### 3. PII masking in activity logs
- **Risk:** `activity_log` stores borrower names, emails, full loan details in
  plaintext. RLS protects cross-tenant, but support-impersonation, backups, and
  exports would expose NPI. GLBA violation risk if breached.
- **Fix:**
  - Create a new `activity_log_pii` table for sensitive values, protected by
    stricter RLS (owner role only, no cross-tenant support access)
  - Reference from `activity_log` by UUID
  - Migrate existing rows with a backfill migration
  - OR simpler: add a `pg_sodium` encrypted column for the sensitive payload
- **Effort:** ~4-6 hours
- **Blocker for:** first paying LO

### 4. Admin-route authorization audit
- **Risk:** Not every `/api/admin/*` route consistently calls `requireAdmin()`.
  Missing a check → cross-tenant data leak via one forgotten endpoint.
- **Fix:**
  - Grep all files under `src/app/api/admin/` and verify each calls `requireAdmin()`
  - Create a middleware matcher for `/api/admin/*` that enforces automatically
  - Add a lint rule or test that fails if an admin route doesn't import `requireAdmin`
- **Effort:** ~1 hour

---

## 🟡 Medium — ship before LO #10

### 5. SSN / DOB / income encryption at rest
- Use application-layer encryption (pgsodium or encrypt-before-insert) for the
  top sensitive fields. GLBA attorney conversation needed to finalize scope.

### 6. CORS + CSP headers
- Verify `next.config.js` has strict CORS (allow styermortgage.com + Arive only)
- Add CSP header in middleware to prevent XSS / third-party script injection

### 7. Secret rotation runbook
- Document how to rotate `LOANOS_AGENT_SECRET`, Arive per-org secrets, service
  role key without downtime
- `los_integrations` table already supports rotation via `secret_last_rotated`
  column + multiple active rows during overlap window

### 8. Webhook idempotency
- Add unique constraint on `(arive_loan_id, organization_id, arive_event_id)` if
  Arive sends event IDs, so duplicate deliveries can't double-process
- Already have `(arive_loan_id, organization_id)` unique from migration 070

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

---

## Non-code items (business / legal)

- [ ] GLBA-aware attorney consultation before taking first LO payment
- [ ] Cyber liability insurance quote
- [ ] Written Information Security Program (ISP) document
- [ ] Data Processing Addendum (DPA) template for LOs
- [ ] Incident response plan (who to notify, timelines, breach disclosure)
- [ ] Terms of Service + Privacy Policy review for multi-tenant
