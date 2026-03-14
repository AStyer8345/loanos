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
`EmailDraftPreview` was built with light Tailwind colors (bg-emerald-100, text-slate-900) while the dashboard uses a dark zinc-950 theme. Visual inconsistency goes undetected without live preview. When building new components, check the theme of the target page before writing Tailwind classes.

---

## Claude API in n8n

- Model string: `claude-sonnet-4-5` — NO date suffix, never `claude-sonnet-4-5-20251022`
- Credential: Header Auth account `SlNsEedAOCoo6NwH` — sends `x-api-key` automatically
- Claude response in downstream code: `$json.content[0].text`

## Claude API in Next.js routes

- Model string for new routes: `claude-sonnet-4-20250514` (used in refi-intake route.ts)
- Note: MEMORY.md says use `claude-sonnet-4-5` — verify which is authoritative before changing existing routes
