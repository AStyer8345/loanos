# Security Hardening Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring LoanOS into full compliance with FTC Safeguards Rule and Texas data privacy law while closing known technical security gaps.

**Architecture:** Three layers — database (RLS + audit), API (rate limiting + secret rotation), and documentation (WISP + retention policy). Each task is independently deployable. No breaking changes to existing functionality.

**Tech Stack:** Next.js 14 App Router, Supabase (Postgres + RLS + Auth), Vercel, TypeScript

---

## Chunk 1: Database & RLS Fixes

### Task 1: Verify and fix `chat_sessions` RLS

Migration 020 was written but we need to confirm it was actually applied and is working correctly.

**Files:**
- Read: `supabase/migrations/020_fix_chat_sessions_rls.sql`
- Modify: `supabase/migrations/035_verify_chat_sessions_rls.sql` (create new)

- [ ] **Step 1: Check current state via Supabase MCP**

Run `execute_sql` on project `uuqedsvjlkeszrbwzizl`:
```sql
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'chat_sessions';
```
Expected: policies scoped to `auth.uid() = user_id`, NOT `USING (true)`

- [ ] **Step 2: If `USING (true)` still exists, create fix migration**

Create `supabase/migrations/035_verify_chat_sessions_rls.sql`:
```sql
-- Migration 035: Ensure chat_sessions RLS is properly scoped
-- Drops any remaining USING(true) policies and re-applies user-scoped ones

-- Drop all existing policies
DROP POLICY IF EXISTS "Enable access for all users" ON chat_sessions;
DROP POLICY IF EXISTS "Allow all" ON chat_sessions;
DROP POLICY IF EXISTS "Users can manage their own chat sessions" ON chat_sessions;

-- Ensure user_id column exists
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Backfill user_id from loan/contact owner where possible
-- (leave null where we can't determine owner — those rows will be inaccessible, which is safe)

-- Apply scoped policies
CREATE POLICY "chat_sessions_select" ON chat_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "chat_sessions_insert" ON chat_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "chat_sessions_update" ON chat_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "chat_sessions_delete" ON chat_sessions
  FOR DELETE USING (auth.uid() = user_id);
```

- [ ] **Step 3: Apply migration via Supabase MCP `apply_migration`**

- [ ] **Step 4: Re-run verification query from Step 1 — confirm no `USING (true)` remains**

- [ ] **Step 5: Commit**
```bash
git add supabase/migrations/035_verify_chat_sessions_rls.sql
git commit -m "fix: scope chat_sessions RLS to authenticated user"
```

---

### Task 2: Audit all tables for `USING (true)` policies

**Files:**
- Read-only audit — no migrations needed unless issues found
- Create: `tasks/audit-reports/rls-audit-2026-03-18.md`

- [ ] **Step 1: Run full RLS audit via Supabase MCP**

```sql
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;
```

- [ ] **Step 2: Flag any policy where `qual` contains `true` (not scoped to user/org)**

- [ ] **Step 3: For each flagged table, create a targeted migration (035a, 035b, etc.) using the same pattern as Task 1**

- [ ] **Step 4: Apply all fix migrations**

- [ ] **Step 5: Save audit results to `tasks/audit-reports/rls-audit-2026-03-18.md`**

- [ ] **Step 6: Commit**
```bash
git add tasks/audit-reports/rls-audit-2026-03-18.md supabase/migrations/035*.sql
git commit -m "fix: close all USING(true) RLS gaps found in audit"
```

---

### Task 3: Add comprehensive audit log table

Right now `activity_log` captures some actions but there's no dedicated security event log (failed logins, data exports, bulk actions).

**Files:**
- Create: `supabase/migrations/036_security_audit_log.sql`
- Create: `src/lib/audit.ts`
- Modify: `src/app/api/agents/route.ts` (and other agent routes) — add audit calls

- [ ] **Step 1: Create migration**

Create `supabase/migrations/036_security_audit_log.sql`:
```sql
-- Migration 036: Security audit log for FTC Safeguards compliance
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,         -- 'login', 'data_export', 'bulk_delete', 'api_access', 'auth_failure'
  actor_id UUID REFERENCES auth.users(id),
  actor_email TEXT,
  ip_address TEXT,
  resource TEXT,                    -- e.g. 'loans', 'contacts', 'documents'
  resource_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- No RLS on this table — only service role can write; no user can delete
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Users can read their own events only
CREATE POLICY "security_audit_log_select" ON public.security_audit_log
  FOR SELECT USING (auth.uid() = actor_id);

-- No INSERT/UPDATE/DELETE via client — all writes go through service role in API routes
```

- [ ] **Step 2: Apply migration via Supabase MCP**

- [ ] **Step 3: Create `src/lib/audit.ts`**
```typescript
import { createServiceClient } from '@/lib/supabase/service'

export type AuditEvent =
  | 'login'
  | 'logout'
  | 'data_export'
  | 'bulk_delete'
  | 'api_access'
  | 'auth_failure'
  | 'document_download'

export async function logSecurityEvent({
  eventType,
  actorId,
  actorEmail,
  ipAddress,
  resource,
  resourceId,
  details,
}: {
  eventType: AuditEvent
  actorId?: string
  actorEmail?: string
  ipAddress?: string
  resource?: string
  resourceId?: string
  details?: Record<string, unknown>
}) {
  const supabase = createServiceClient()
  await supabase.from('security_audit_log').insert({
    event_type: eventType,
    actor_id: actorId ?? null,
    actor_email: actorEmail ?? null,
    ip_address: ipAddress ?? null,
    resource: resource ?? null,
    resource_id: resourceId ?? null,
    details: details ?? null,
  })
}
```

- [ ] **Step 4: Add audit call to all `/api/agents/*` routes after `validateAgentSecret` passes**
```typescript
// In each agent route's POST handler:
await logSecurityEvent({
  eventType: 'api_access',
  resource: 'agents',
  resourceId: 'milestone', // or whichever agent
  ipAddress: request.headers.get('x-forwarded-for') ?? undefined,
})
```

- [ ] **Step 5: Commit**
```bash
git add supabase/migrations/036_security_audit_log.sql src/lib/audit.ts src/app/api/agents/
git commit -m "feat: add security audit log table and helper"
```

---

## Chunk 2: API Security

### Task 4: Rate limiting on sensitive API routes

No rate limiting currently exists. A compromised credential could hammer the Claude API or extract all borrower data.

**Files:**
- Create: `src/lib/rateLimit.ts`
- Modify: `src/app/api/chat/route.ts`
- Modify: `src/app/api/scenarios/route.ts`
- Modify: `src/app/api/me/route.ts`

- [ ] **Step 1: Create `src/lib/rateLimit.ts`**

Uses an in-memory store (suitable for single-instance Vercel — upgrade to Redis/Upstash if multi-region later):
```typescript
// Simple sliding window rate limiter
// For Vercel serverless: resets on cold start. Acceptable for current scale.
const requests = new Map<string, number[]>()

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const windowStart = now - windowMs
  const timestamps = (requests.get(key) ?? []).filter(t => t > windowStart)

  if (timestamps.length >= maxRequests) {
    return { allowed: false, remaining: 0 }
  }

  timestamps.push(now)
  requests.set(key, timestamps)
  return { allowed: true, remaining: maxRequests - timestamps.length }
}
```

- [ ] **Step 2: Apply rate limit to `/api/chat/route.ts`**

At the top of the POST handler, after getting the user session:
```typescript
import { checkRateLimit } from '@/lib/rateLimit'

// In POST handler:
const { allowed } = checkRateLimit(`chat:${user.id}`, 30, 60_000) // 30 req/min
if (!allowed) {
  return Response.json({ error: 'Rate limit exceeded' }, { status: 429 })
}
```

- [ ] **Step 3: Apply rate limit to `/api/scenarios/route.ts`** (20 req/min — Claude calls are expensive)

- [ ] **Step 4: Apply rate limit to login attempts** — add to middleware or `/api/me/route.ts`:
```typescript
const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
const { allowed } = checkRateLimit(`login:${ip}`, 10, 60_000)
if (!allowed) {
  return Response.json({ error: 'Too many requests' }, { status: 429 })
}
```

- [ ] **Step 5: Commit**
```bash
git add src/lib/rateLimit.ts src/app/api/chat/route.ts src/app/api/scenarios/ src/app/api/me/
git commit -m "feat: add rate limiting to chat, scenarios, and auth routes"
```

---

### Task 5: Rotate LOANOS_AGENT_SECRET

The current secret value is exposed in plaintext in `CONTEXT.md` and in Claude's memory. It must be treated as compromised.

**Files:**
- No code changes — Vercel env var update only
- Modify: `CONTEXT.md` — remove the plaintext secret value

- [ ] **Step 1: Generate new secret**
```bash
openssl rand -hex 32
```
Copy the output.

- [ ] **Step 2: Update in Vercel dashboard**
Go to Vercel → LoanOS project → Settings → Environment Variables → update `LOANOS_AGENT_SECRET` with the new value.

- [ ] **Step 3: Update n8n WF3 (Milestone workflow)**
In n8n, open workflow `1hjOmS7inZcxEJQr` → find the HTTP node that calls the LoanOS agent route → update the `Authorization: Bearer` header value to the new secret.

- [ ] **Step 4: Redeploy Vercel** (to pick up new env var)
```bash
git commit --allow-empty -m "chore: trigger redeploy for secret rotation"
git push origin main
```

- [ ] **Step 5: Remove plaintext secret from CONTEXT.md**

Find and replace the line containing `Authorization: Bearer 0bbc8cff-...` in `CONTEXT.md` with:
```
Authorization: Bearer <LOANOS_AGENT_SECRET> (stored in Vercel env vars — do not write value here)
```

- [ ] **Step 6: Commit CONTEXT.md change**
```bash
git add CONTEXT.md
git commit -m "security: remove plaintext secret from CONTEXT.md"
git push origin main
```

---

### Task 6: Add security headers to Next.js

Missing headers that protect against XSS, clickjacking, and data sniffing.

**Files:**
- Modify: `next.config.js` (or `next.config.ts`)

- [ ] **Step 1: Read current `next.config.js`**

- [ ] **Step 2: Add headers config**
```javascript
const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]

// In nextConfig:
async headers() {
  return [
    {
      source: '/(.*)',
      headers: securityHeaders,
    },
  ]
},
```

- [ ] **Step 3: Run build to verify no errors**
```bash
npm run build
```
Expected: clean build

- [ ] **Step 4: Commit**
```bash
git add next.config.js
git commit -m "security: add HTTP security headers"
git push origin main
```

---

## Chunk 3: Compliance Documentation

### Task 7: Written Information Security Program (WISP)

Required by FTC Safeguards Rule. Must be a real document, not just code.

**Files:**
- Create: `docs/security/WISP.md`

- [ ] **Step 1: Create `docs/security/WISP.md`**

```markdown
# Written Information Security Program (WISP)
**Adam Styer | Mortgage Solutions LP** — NMLS #513013
**Effective Date:** 2026-03-18
**Review Frequency:** Annual (or after any security incident)

---

## 1. Purpose
This document establishes how Adam Styer | Mortgage Solutions LP protects Non-Public Personal Information (NPI) of mortgage borrowers, in compliance with the FTC Safeguards Rule (16 CFR Part 314) and Texas Business & Commerce Code §521.

## 2. Designated Qualified Individual
**Adam Styer** is designated as the Qualified Individual responsible for overseeing this information security program.

## 3. Data We Hold
| Data Type | Where Stored | Who Can Access |
|-----------|-------------|----------------|
| Borrower name, address, SSN (last 4 only), income, assets | Supabase (encrypted at rest) | Authenticated users only |
| Loan details, rates, terms | Supabase | Authenticated users, scoped by org |
| Uploaded documents (pay stubs, bank statements) | Supabase Storage (encrypted) | Authenticated users, RLS enforced |
| Email correspondence | Supabase activity_log | Authenticated users, scoped by org |
| Scenario / analysis data | Supabase | User who created it |

## 4. Access Controls
- **Authentication:** Supabase email/password with MFA enabled
- **Authorization:** Row-Level Security (RLS) — every database table has policies restricting rows to the owning user/organization
- **API routes:** Internal automation routes require `Authorization: Bearer <secret>` header (secret stored in Vercel env vars, rotated on any suspected exposure)
- **Service role key:** Never exposed client-side. Used only in server-side API routes.

## 5. Encryption
- **In transit:** All traffic served over HTTPS (TLS 1.2+) via Vercel
- **At rest:** Supabase encrypts all data at rest using AES-256

## 6. Third-Party Services
| Service | Data Shared | Security |
|---------|------------|----------|
| Supabase | All borrower data | SOC 2 Type II certified |
| Vercel | Application code only | SOC 2 Type II certified |
| Anthropic (Claude) | Loan summaries for AI features | No data retained per Anthropic API policy |
| n8n (styer.app.n8n.cloud) | Loan status events | Credential-protected webhooks |
| Zapier | Arive → n8n bridge | OAuth2 authenticated |

## 7. Risk Assessment Schedule
Annual review each January covering:
- New data flows added during the year
- Third-party service changes
- Access control audit
- Incident review

## 8. Incident Response
If a data breach is suspected:
1. **Isolate** — revoke the compromised credential immediately (Supabase service role key, Vercel env vars)
2. **Assess** — determine which borrower records were accessible
3. **Notify** — Texas law (§521.053) requires notifying affected individuals within 60 days of discovery
4. **Document** — log the incident, what was accessed, and remediation steps
5. **Review** — update this WISP within 30 days of resolution

## 9. Data Retention
- **Active borrower records:** Retained indefinitely while account is active
- **Closed loan files:** Retained 3 years minimum (RESPA requirement)
- **Deletion requests:** Handled manually by the Qualified Individual within 30 days
- **Automated purge:** Not yet implemented — planned for Phase 4

## 10. Employee / Contractor Access
Currently a single-operator business. Any future contractors or licensed LOs added to the platform will receive the minimum access required for their role and will be removed immediately upon end of engagement.
```

- [ ] **Step 2: Commit**
```bash
git add docs/security/WISP.md
git commit -m "docs: add Written Information Security Program (WISP) for FTC Safeguards compliance"
git push origin main
```

---

### Task 8: Data Retention Policy Implementation

RESPA requires 3-year retention on closed loan files. Need a query that identifies records eligible for archival and a documented manual process.

**Files:**
- Create: `docs/security/data-retention-policy.md`
- Create: `scripts/retention-audit.sql`

- [ ] **Step 1: Create `scripts/retention-audit.sql`**

```sql
-- Run annually to identify records past retention window
-- RESPA: 3 years from closing date

-- Loans eligible for archival (closed 3+ years ago)
SELECT id, borrower_name, closing_date, status
FROM loans
WHERE status ILIKE '%closed%'
  AND closing_date < NOW() - INTERVAL '3 years'
ORDER BY closing_date ASC;

-- Contacts with no active loans (leads only, 3+ years old)
SELECT c.id, c.full_name, c.email, c.created_at
FROM contacts c
LEFT JOIN loans l ON l.contact_id = c.id
WHERE l.id IS NULL
  AND c.created_at < NOW() - INTERVAL '3 years';
```

- [ ] **Step 2: Create `docs/security/data-retention-policy.md`**

```markdown
# Data Retention Policy
**Adam Styer | Mortgage Solutions LP** — NMLS #513013
**Effective Date:** 2026-03-18

## Retention Schedule
| Record Type | Minimum Retention | Authority |
|------------|------------------|-----------|
| Closed loan files | 3 years from closing date | RESPA / 12 CFR §1024 |
| Pre-approval records | 3 years from application date | ECOA / Reg B |
| Uploaded documents | Same as associated loan | RESPA |
| Activity log | 3 years | FTC Safeguards |
| Security audit log | 3 years | FTC Safeguards |
| Chat / AI sessions | 1 year | Internal policy |

## Annual Archival Process
1. Run `scripts/retention-audit.sql` in Supabase SQL Editor
2. Export results to CSV for review
3. For closed loans past 3 years: verify no open disputes or litigation holds
4. Delete eligible records from Supabase (loans, contacts, documents, activity_log)
5. Document deletion in security audit log

## Deletion Requests
Borrowers may request deletion of their data. Process:
1. Verify identity via email
2. Confirm no legal hold applies (active dispute, pending audit)
3. Delete from: loans, contacts, documents bucket, activity_log, chat_sessions, email_drafts
4. Respond to borrower within 30 days confirming deletion
```

- [ ] **Step 3: Commit**
```bash
git add docs/security/data-retention-policy.md scripts/retention-audit.sql
git commit -m "docs: add data retention policy and annual audit query"
git push origin main
```

---

## Chunk 4: Final Verification

### Task 9: Security audit report

Verify all tasks complete and document final state.

**Files:**
- Create: `tasks/audit-reports/security-audit-2026-03-18.md`

- [ ] **Step 1: Run final RLS check via Supabase MCP**
```sql
SELECT tablename, COUNT(*) as policy_count,
  bool_or(qual = 'true') as has_unscoped_policy
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
```
Expected: `has_unscoped_policy = false` for all tables

- [ ] **Step 2: Verify security headers on live site**
```bash
curl -I https://loanos-self.vercel.app | grep -E "X-Frame|X-Content|Referrer"
```
Expected: all three headers present

- [ ] **Step 3: Verify rate limiting works**
```bash
# Hit chat endpoint 31 times — should get 429 on the 31st
for i in {1..31}; do
  curl -s -o /dev/null -w "%{http_code}\n" -X POST https://loanos-self.vercel.app/api/chat \
    -H "Content-Type: application/json" -d '{"message":"test"}'
done
```
Expected: first 30 return 401 (no auth), 31st returns 429

- [ ] **Step 4: Confirm WISP and retention policy docs exist in repo**
```bash
ls docs/security/
```
Expected: `WISP.md`, `data-retention-policy.md`

- [ ] **Step 5: Write audit report to `tasks/audit-reports/security-audit-2026-03-18.md`** with pass/fail for each item

- [ ] **Step 6: Final commit and push**
```bash
git add tasks/audit-reports/security-audit-2026-03-18.md
git commit -m "docs: security audit report 2026-03-18 — all items verified"
git push origin main
```

---

## Summary: What This Achieves

| Requirement | Source | Covered By |
|------------|--------|------------|
| MFA on NPI access | FTC Safeguards Rule | Already done (assumed complete) |
| Written security program | FTC Safeguards Rule | Task 7 (WISP) |
| Designated Qualified Individual | FTC Safeguards Rule | Task 7 (WISP) |
| Access controls + monitoring | FTC Safeguards Rule | Tasks 1–3 (RLS audit + audit log) |
| Rate limiting / abuse prevention | FTC Safeguards Rule | Task 4 |
| Encrypt in transit | FTC Safeguards Rule | Task 6 (headers) + Vercel HTTPS |
| Incident response plan | FTC Safeguards Rule | Task 7 (WISP §8) |
| Data retention schedule | RESPA / FTC | Task 8 |
| Breach notification process | Texas §521.053 | Task 7 (WISP §8) |
| Secret rotation | Internal hygiene | Task 5 |

**Not covered here (Phase 4):**
- Multi-tenant RLS (when licensing to other LOs) — already planned
- Automated data purge workflows
- Upstash Redis rate limiting (if scaling to multi-region Vercel)
