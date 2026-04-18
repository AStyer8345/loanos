# LoanOS — Architecture Decisions

## [2026-04-16] — Arive Contact-Field Sync: DB Trigger, Not n8n Workflow Edits

**Chose:** A Postgres `AFTER INSERT OR UPDATE` trigger on `public.loans` that COALESCEs phone/birthdate/co-borrower fields onto the linked contact. Contact value always wins; trigger only writes when the contact column is null.

**Over:** Editing the Arive New Loan + Arive Status Update n8n workflows to (a) skip null fields in the upsert body and (b) add a "fill blanks" PATCH step.

**Why:**
- Both n8n workflows have 17+ nodes with custom Code expressions and HTTP raw-JSON bodies. n8n MCP `update_workflow` requires regenerating the full SDK code — high blast radius, easy to regress unrelated logic in nodes the change shouldn't touch.
- A trigger catches BOTH webhook paths automatically (insert = new app, update = status update) — one mechanism instead of two duplicate edits.
- Atomic with the loan write: no race window where the loan has data but the contact patch hasn't run yet.
- Future-proof: any other workflow or admin tool that writes `loans.contact_id` gets the contact fill for free.
- Source of truth is the contact form (where Adam hand-edits). Trigger NEVER overwrites a non-null value, so manual edits survive every Arive webhook forever.

**Trade-off accepted:** Contact-fill logic now lives in the database, not the workflow. Less visible to a non-DBA reading n8n. Mitigated by the function comment + this DECISIONS entry + the migration name `add_loans_fill_contact_blanks_trigger`.

**Context:** Surfaced 2026-04-16 when Jung Lee's contact card was missing phone + DOB despite his Arive new-app webhook firing. Arive's webhook had sent both fields, but the n8n upsert wrote `null` for any field Arive omitted, blanking earlier Web Lead data. 13 contacts retroactively backfilled in the same session. Sync Contact Rate+Balance node in Status Update workflow `9JyzzwKac8v3uQ7d` cleaned up to remove `birthdate`/`co_borrower_birthdate` from its PATCH body so the funding-day node can never null-out a DOB the trigger would otherwise have to refill on the next status webhook.

## [2026-04-16] — Nurture Content: In-File in Workflow DevKit, Not drip_steps

**Chose:** PA Welcome + DPA Guide bodies + subjects live as literal arrays inside `src/workflows/pa-welcome-nurture.ts` and `dpa-guide-nurture.ts`. A small helper (`renderDripHtml`) converts plain text + `{{var}}` tags to HTML at send time.

**Over:** Migrating content into Supabase `drip_steps` rows with a scheduler that reads them at runtime (the pre-2026-04-15 architecture, and what an incoming session brief on 2026-04-16 proposed).

**Why:** PA + DPA moved off `drip_steps` on 2026-04-15 PM when the Workflow DevKit cut-over landed. Moving them back into `drip_steps` would (a) duplicate content against live Workflow DevKit workflows and risk double-sends, (b) require building a new scheduler around `drip_steps` for just these two flows while the existing scheduler serves 6 unrelated campaigns, and (c) undo 24 hours of shipped work whose main value is step-level durability (`"use step"` checkpoints, `createHook` for webhook-driven resumes, exit-rule re-evaluation on every wake). Plain-text in-file authoring preserves that durability while giving Adam full editability via the normal code path.

**Trade-off accepted:** Non-developer LOs in Phase 4 can't edit body copy without opening TypeScript. Acceptable because (a) only Adam is in production through May 1, and (b) the `/dashboard/automations` editor (reads `automation_registry`) remains the long-term surface for Phase 4 — we'll route Workflow DevKit through it then, not now.

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
