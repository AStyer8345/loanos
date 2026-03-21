# LoanOS — Lessons Log

_Patterns, gotchas, and hard-won fixes. Read before starting any new session._

---

## n8n Patterns

### Webhook body access
In n8n Webhook nodes, the body is at `$json.body`. In ALL downstream Code nodes, reference WITHOUT `.body`:
```js
// Correct in downstream nodes:
const webhook = $('Webhook').first().json       // NOT .json.body
const body = $input.first().json                // NOT .json.body
```
**Why it bites you:** The Webhook node wraps the payload under `.body`, but downstream nodes re-flatten it. Adding `.body` in a downstream node results in `undefined` for every field.

### HTTP Request body format (CRITICAL)
Never use `specifyBody: "string"` for JSON POST/PATCH to Supabase. It sends JSON as a URL-encoded form key and breaks Supabase with a 400.
```json
{
  "sendBody": true,
  "contentType": "raw",
  "rawContentType": "application/json",
  "body": "={{ JSON.stringify({ field: value }) }}"
}
```

### Supabase authenticated storage URLs
Always include `/authenticated/documents/` in the path:
```
https://<project>.supabase.co/storage/v1/object/authenticated/documents/{{ $json.file_path }}
```
Missing `/authenticated/` → 400. Missing `/documents/` → "Bucket not found".

### Supabase HTTP headers (both required)
```
apikey: <service_role_key>
Authorization: Bearer <service_role_key>
```
`apikey` alone returns 400.

---

## Next.js / Supabase Patterns

### Server components can render client components
The dashboard `page.tsx` is a server component that imports `EmailDraftPreview` (a `'use client'` component). This is valid Next.js App Router pattern — server renders the shell, client component hydrates independently.

### Service role vs. anon key
- API routes that write to Supabase: use `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS)
- Browser client components: use `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` with RLS
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser

### Migration tracking
Supabase migrations in `/supabase/migrations/` are local files only. They must be manually applied in the Supabase SQL Editor. Check CHANGELOG "Notes" sections for applied vs. pending status.

---

## Bug Patterns Found

### Incomplete feature (2026-03-14)
`EmailDraftPreview` component was fully built (migration, helper, API route, component) but Step 5 (adding to dashboard) was never completed. Component sat dormant in `/src/components/`. Always verify that built components are actually imported and rendered somewhere.

### Light/dark theme mismatch
`EmailDraftPreview` was built with light Tailwind colors (bg-emerald-100, text-slate-900) while the dashboard uses a dark zinc-950 theme. Fixed 2026-03-14: all `slate-*`/`white` → `zinc-900`/`zinc-800`; AUTOMATION_COLORS → dark variants (`bg-*-900/40`, `text-*-400`, `border-*-800`). Visual inconsistency goes undetected without live preview — always check target page theme before writing Tailwind classes.

**Briefing page** (`/dashboard/briefing/page.tsx`) — dark theme confirmed as of 2026-03-17. Uses `bg-[#050505]` and `zinc-900`. This note is resolved.

### Column name drift between migrations (2026-03-15)
`loans` table has TWO generations of column names that both exist in production:
- **Old (migrations 005/007):** `borrower_name`, `est_closing_date`
- **New (migration 011):** `borrower_first_name`, `borrower_last_name`, `estimated_closing_date`

The Arive webhook (`/api/arive-webhook/route.ts`) writes to the NEW columns. Any route that reads the old columns gets null for Arive-synced loans. Always check which migration introduced a column before using it in a new route.

---

## Claude API in n8n

- Model string: `claude-sonnet-4-5` — NO date suffix, never `claude-sonnet-4-5-20251022`
- Credential: Header Auth account `SlNsEedAOCoo6NwH` — sends `x-api-key` automatically
- Claude response in downstream code: `$json.content[0].text`

## Claude API in Next.js routes

- Model string for new routes: `claude-sonnet-4-20250514` (used in refi-intake route.ts)
- Note: MEMORY.md says use `claude-sonnet-4-5` — verify which is authoritative before changing existing routes

---

## 2026-03-16 Sprint Lessons

### Table name: `activity_log` not `loan_activity`
The activity logging table is `activity_log`, NOT `loan_activity`. Always verify table names against Supabase before creating migrations.

### MCC already migrated
The Marketing Command Center was already migrated to LoanOS in v1.16.0–v1.18.0. All 4 API routes exist (generate-newsletter, publish-newsletter, send-mailchimp, run-testimonials). Don't duplicate migration effort — read CONTEXT.md thoroughly.

### Automation pre-selection pattern
Actions dropdown buttons set both `activeTab` and `selectedAutomationId` state. AutomationsTab receives `highlightId` prop, auto-opens the modal for that workflow, and scrolls to the highlighted card. Keeps trigger logic in one place.

### Dashboard links use stage names
Stage cards in the dashboard use `/dashboard/loans?stage=StageName`. The loans page client component reads URL params with `useSearchParams()` and applies post-fetch filters.

### validateAgentSecret blocks browser-facing routes (2026-03-16)
`validateAgentSecret` is for server-to-server calls only. Any route called from the browser must use Supabase session auth (`createClient().auth.getUser()`). Mixing them breaks browser-facing pages — they return 401 because the browser never sends the secret header. Pattern for routes that need to support both: check agent secret first, fall back to session auth.

### `fetch` is not available in n8n Code nodes (2026-03-17)
n8n's JavaScript sandbox does not have access to the native `fetch()` API. Code nodes that call `fetch()` will fail with `ReferenceError: fetch is not defined`. Use HTTP Request nodes instead of `fetch` for all external calls from n8n Code nodes.

### Arive sends null `currentLoanStatus_status` (2026-03-17)
Arive webhooks sometimes fire with `currentLoanStatus_status: null` — this happens when only non-status fields changed (dates, rates, etc.). Any Supabase table with a NOT NULL constraint on `new_status` will fail. Pattern: always use a null fallback in the body expression: `status || oldStatus || 'unknown'`.

### Loans page borrower_name column drift (2026-03-18)
`/dashboard/loans/page.tsx` `buildLoansQuery` selected only `borrower_name` (old schema column). Arive webhook writes to `borrower_first_name`/`borrower_last_name` (new columns, introduced in migration 011). Result: all Arive-synced loans showed `(unnamed)` in the table. Fix: add both new columns to select, add a `borrowerDisplayName()` helper with the fallback chain `first+last → borrower_name → loan_name → '(unnamed)'`, use it for display, search, and sort. **Pattern:** always include both old + new column names in any query that touches borrower names until the old column is formally retired.

### Service role bypasses RLS but doesn't set required columns (2026-03-19)
`createServiceClient()` in API routes bypasses Row Level Security entirely — so a missing `user_id` on a chat session insert won't cause a 400 error or visible failure. The session is created and the user experiences no problem. But any future query using `auth.uid() = user_id` RLS (browser client, or a service-role query with an explicit filter) will silently return 0 rows. Pattern: when adding a `user_id` RLS policy via migration, immediately audit every API route that INSERTs into that table and confirm it sets `user_id`. The service role masks the bug.

### n8n contact upsert null NOT NULL crash (2026-03-20)
Arive sometimes sends webhook payloads with null `firstName` or `lastName` (happens when borrower profile is incomplete in Arive). In n8n, `JSON.stringify({ first_name: $json.firstName })` with a null value produces `{"first_name":null}`. Supabase treats this as an explicit NULL assignment and rejects it if the column has a NOT NULL constraint. Pattern: always add `|| ''` fallback for any NOT NULL varchar column in contact/loan upsert bodies: `first_name: $json.firstName || ''`. This applies to every n8n HTTP Request node that upserts into `contacts` or `loans`.

### n8n status enum mismatch crashes silently (2026-03-21)
Final CD Email workflow (`SkzrWeR0bHZs8kWX`) was failing with `violates check constraint "email_drafts_status_check"`. Root cause: `Log CD Email` node sent `status: 'draft'` but the `email_drafts` table only allows `'pending' | 'sent' | 'discarded'`. Fix: change to `status: 'pending'`. **Pattern:** whenever adding a Supabase INSERT node to n8n, verify the exact allowed values on any check-constrained column (status, type, etc.) before writing the body expression. `'draft'` is a common intuitive guess that's often wrong.

### n8n column name drift causes silent 400s every 30 minutes (2026-03-16)
The Review Request Email workflow (`AK1fBcaX1cPcdlGx`) used `close_date` in its Supabase REST query. Column doesn't exist — correct name is `closing_date`. The workflow was active and running on a 30-minute schedule, failing silently in n8n logs. Always verify column names against Supabase schema before writing n8n Supabase queries. The `est_closing_date` column also does not exist — use `estimated_closing_date` for Arive-synced loans.
