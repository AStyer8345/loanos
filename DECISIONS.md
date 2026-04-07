# LoanOS — Architecture Decisions

## [2026-04-05] — Arive Integration: Zapier Middleman

**Chose:** Each LO runs their own Zapier ($20/mo) that enriches Arive's thin webhook ping and POSTs to LoanOS with a per-org shared secret.
**Over:** Direct Arive API integration (not available — Arive only supports Zapier as an integration path).
**Why:** Zapier is the only supported integration path; direct API access not offered to third-party SaaS.
**Context:** Option A (direct API) was explored and abandoned after reading Arive's full API docs.

## [2026-04-05] — PII Encryption: Split Table + AES-256-GCM

**Chose:** Companion table (`activity_log_pii`) with app-layer AES-256-GCM encryption, key in Vercel env var.
**Over:** Column-level Postgres encryption (no key rotation story) or mask-on-read (plaintext still in DB).
**Why:** DB backups are useless without the key. GLBA compliance for borrower PII.

## [2026-04-05] — Webhook Security: 3-Layer Verification

**Chose:** Path slug routing + per-org hashed secret + payload identity allowlist, with shadow/enforce mode.
**Over:** Single shared secret for all tenants (no isolation) or IP allowlisting (Zapier IPs change).
**Why:** Defense in depth — any single layer failing doesn't expose cross-tenant data.

## [2026-04-05] — CORS/CSP Headers

**Chose:** CSP in `next.config.mjs` tuned to actual runtime deps (Supabase, Vercel, Calendly). HSTS with preload.
**Over:** No headers (status quo) or strict CSP with nonces (Next.js 14 doesn't support nonces out of the box).
**Why:** `unsafe-inline` still required for Next.js scripts, but CSP blocks XSS from unknown origins. Nonce rollout deferred.

## [2026-04-01] — UI Framework: shadcn/ui + next-themes

**Chose:** shadcn/ui component primitives + next-themes for light/dark mode. Light mode default.
**Over:** Radix UI directly (more work) or full MUI/Chakra migration (wrong aesthetic).
**Why:** Copy-paste components (no runtime dependency), consistent API, SSR-safe theme switching.

## [2026-03-30] — Renovation: Hide, Don't Delete

**Chose:** Hidden features stay in the repo and DB. UI stripped to 7 tabs, data untouched.
**Over:** Hard delete (irreversible) or feature flags (over-engineered for single-user renovation).
**Why:** Everything may return in Phase 4 (multi-tenant licensing). Hiding is cheap and reversible.

## [2026-03-18] — Multi-Tenancy: Org-Based RLS

**Chose:** `org_id` on every table + Supabase RLS policies + SECURITY DEFINER helpers.
**Over:** App-layer filtering only (fragile) or schema-per-tenant (Supabase doesn't support well).
**Why:** Defense in depth — even buggy app code can't expose cross-tenant data.
