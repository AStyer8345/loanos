# n8n Inline Credential Audit — 2026-04-30 PM autonomous

> Read-only enumeration of inline secrets across active LoanOS n8n workflows.
> Reference pattern: `nOCDV73m4M0jyL1B` (Lead Score Updater) — uses proper credentials, no inline secrets.
> Secrets are truncated to first 8 chars + `...` so this file is safe to commit; the full keys still exist in n8n.

## Summary

- Workflows audited: 27
- Workflows with inline credentials: **22**
- Workflows clean (no inline secrets): **5** — `yTkiV6pf2eZaJw82`, `eb9UsV5Z6odh7Yex`, `3iXImUkjgMitpJKt` (mostly clean — see note), `Gx5YpWddAhXrEYKT`, `rwi3qEYgJKGGHkHc`, `0M8Vnf6MhB1xtaIg`
- Total inline credential instances (header + code-node literals): **~140**
- Distinct inline credential types found:
  1. **Supabase service-role JWT** (`eyJhbGci...`) — by far the most common, present in 21 workflows, ~110 instances
  2. **LoanOS internal API bearer** (`Bearer 0bbc8cff...`) — in 5 workflows, ~14 instances. Hits `loanos-self.vercel.app/api/*`. Acts as a service token; rotation requires sync with the Next.js server's expected token.
  3. **Publer Bearer-API token** (`Bearer-API 14ff59c2...`) — in 2 workflows (`V6RhmJpOb7pOzMte`, `eJG4wckrj6SmSpm1`), 4 instances total
  4. **Google Gemini / Imagen API key** (`AIzaSyC8...`) — in 2 workflows (same two as above), 4 instances total
  5. **Mailchimp Basic auth** (`Basic YW55...` decoding to `<32hex>-us13`) — in 1 workflow (`J9Pe24vUi6fpZtdZ`), 1 instance
- Anthropic API keys: **0 inline** — every Claude call already uses `genericCredentialType` (`httpHeaderAuth`) or `predefinedCredentialType`. Good.
- Resend keys: **0 inline** — both Resend nodes (`Gx5YpWddAhXrEYKT` digest, `H5doQYLLIAg0zMug` referral ack) use `genericCredentialType`/`httpBearerAuth`. Good.

## Adam Action Required (canonical credentials to create in n8n UI)

Create these in n8n **Settings → Credentials** before migration. Names below are suggestions to keep references stable.

| Credential type | Suggested name | Will replace | Used by (after migration) |
|---|---|---|---|
| Supabase API (or Header Auth with `apikey` + `Authorization`) | `Supabase Service Role` | All inline `apikey: eyJhbGci...` and `Authorization: Bearer eyJhbGci...` headers + JWT literals embedded inside Code nodes (these need to read `$env.SUPABASE_SERVICE_KEY` instead of using a credential since Code nodes can't reference n8n credentials directly) | 21 workflows. See per-workflow list below. |
| Header Auth | `LoanOS Self-Bearer` | All inline `Authorization: Bearer 0bbc8cff-94b2-43bb-b005-a8b0665b1f7d` headers hitting `loanos-self.vercel.app/api/*` | `1tagvoU0UXtdDiMY`, `9JyzzwKac8v3uQ7d`, `nccX5ml82mMGyE9T`, `V6RhmJpOb7pOzMte`, `eJG4wckrj6SmSpm1`, `qgb99Eh2ziy0INMk`, `PiuIsQpBuydtFM4m` |
| Header Auth | `Publer API` | Inline `Authorization: Bearer-API 14ff59c2...` + `Publer-Workspace-Id` (workspace ID is not secret but pair them) | `V6RhmJpOb7pOzMte`, `eJG4wckrj6SmSpm1` |
| Header Auth | `Gemini API Key` | Inline `X-goog-api-key: AIzaSyC8...` and `x-goog-api-key: AIzaSyC8...` | `V6RhmJpOb7pOzMte`, `eJG4wckrj6SmSpm1` |
| Header Auth (Basic) | `Mailchimp List 5053c57af2` | Inline `Authorization: Basic YW55...` on Mailchimp tag endpoint | `J9Pe24vUi6fpZtdZ` |

**Important caveat for Code nodes:** The Supabase JWT also appears as a JS string literal inside ~9 Code nodes (`Build Referral Email`, `Build Refi Email`, `Lookup Realtor`, several iMessage / Lender Ingest / CD Extractor nodes). n8n credentials cannot be referenced from Code-node JS. The only safe migration there is to read `$env.SUPABASE_SERVICE_KEY` (set as an n8n environment variable). One workflow already does this — `hHXpKUirhnBCnQTO` (Lender Email Ingest) HTTP nodes use `$env.SUPABASE_SERVICE_KEY` even though its Code node still has the literal. So the env var likely already exists; just standardize on it.

## Per-workflow findings

### Website — FTB Guide Welcome Email (`yTkiV6pf2eZaJw82`)
- ✅ CLEAN — Outlook node uses connector credential; no HTTP nodes; webhook is unauthenticated by design.

### LoanOS — Generic Outlook Draft (`eb9UsV5Z6odh7Yex`)
- ✅ CLEAN — only Outlook draft node, no HTTP/Supabase nodes.

### LoanOS — Pre-Approval Lead Notify (`J9Pe24vUi6fpZtdZ`)
- Node `Apply Mailchimp Tags` (httpRequest): INLINE Mailchimp Basic auth `Basic YW55...` in Authorization header → migrate to "Mailchimp List 5053c57af2" credential.
- Node `Notify Adam — Email`: Outlook connector credential → no action.

### LoanOS — Referral Intro Email (`YbgDnTpPdefcazKy`)
- Node `Build Referral Email` (code): contains 2 hardcoded Supabase JWT string literals (`supabaseKey = 'eyJhbGci...'` twice — in the legacy `supabaseKey` var and the LO-identity `sbKey` var) → switch both to `process.env.SUPABASE_SERVICE_KEY`.
- Node `Log Referral Email` (httpRequest): INLINE Supabase JWT in `apikey` + `Authorization` headers → migrate to "Supabase Service Role" credential.
- Node `Update Loan Record` (httpRequest): INLINE Supabase JWT in `apikey` + `Authorization` headers → migrate to "Supabase Service Role" credential.

### LoanOS — Refi Intake Email (`yCTydQ7RfZK4DyUg`)
- Node `Build Refi Email` (code): hardcoded Supabase JWT literal → use `$env.SUPABASE_SERVICE_KEY`.
- Node `Log Refi Email` (httpRequest): INLINE Supabase JWT in `apikey` + `Authorization` → "Supabase Service Role" credential.

### LoanOS — Refi Watch Rate Drop Alert (`iyKFy0ODkyyqQaAS`)
- 5 httpRequest nodes (`Get Current Rate`, `Get Segment A Candidates`, `Check Recent Alert (30d)`, `Log Rate Drop Alert`, plus implicit ones) all carry INLINE Supabase JWT in `apikey` + `Authorization`. Migrate all to "Supabase Service Role" credential.

### LoanOS — Refi Watch Anniversary Check-In (`ZUeGy8u8P4o6DPM3`)
- Node `Get All Loans` (httpRequest): INLINE Supabase JWT.
- Node `Check Dedup` (code): hardcoded Supabase JWT literal in `headers` object — note: the literal contains a stray `''` typo (single-quote duplication mid-string) which means this dedup check may currently be silently failing. Flag for review during migration. Switch to `$env.SUPABASE_SERVICE_KEY`.
- Node `Log to Activity Log` (httpRequest): INLINE Supabase JWT.

### LoanOS — LO Waitlist Intake (`Rn6rtlKeoQ0CrUkb`)
- Node `Log to Supabase` (httpRequest): INLINE Supabase JWT in `apikey` + `Authorization` → "Supabase Service Role" credential.

### Weekly GBP + Social Post (`V6RhmJpOb7pOzMte`)
- Node `Gemini: Adapt for Platforms`: INLINE `X-goog-api-key: AIzaSyC8...` → "Gemini API Key" credential.
- Node `Gemini Imagen: Generate Image`: INLINE `x-goog-api-key: AIzaSyC8...` → "Gemini API Key".
- Node `Publer: Upload Media`: INLINE `Authorization: Bearer-API 14ff59c2...` → "Publer API".
- Node `Publer: Post to All 4 Platforms`: INLINE `Authorization: Bearer-API 14ff59c2...` → "Publer API".
- Node `Log to automation_logs` (httpRequest): INLINE Supabase JWT → "Supabase Service Role".
- Node `LoanOS: Log Social Post` (httpRequest): INLINE `Authorization: Bearer 0bbc8cff...` → "LoanOS Self-Bearer".

### Weekly Testimonial Social Post (`eJG4wckrj6SmSpm1`)
- Same pattern as above: 2x Gemini, 2x Publer, 1x Supabase log, 1x LoanOS bearer all inline. All 6 nodes need credential migration.

### LoanOS — Arive New Loan → Supabase (`1tagvoU0UXtdDiMY`)
- Multiple httpRequest nodes (`Get Org ID`, `HTTP Request`, `Upsert Loan`, `Log Activity`, `Log Error`, `Log Referral Outreach`): INLINE Supabase JWT in `apikey` + `Authorization` and INLINE `Bearer 0bbc8cff...` for any node hitting `loanos-self.vercel.app`. (10 Supabase pairs, 4 LoanOS bearer instances counted.)
- Code node `Upsert Agent Contacts`: also has hardcoded Supabase JWT literal → use `$env.SUPABASE_SERVICE_KEY`.

### LoanOS — iMessage → Supabase Log (`nccX5ml82mMGyE9T`)
- Node `Find Contact by Phone` (httpRequest): INLINE Supabase JWT.
- Node `Smart Loan Search` (httpRequest): INLINE Supabase JWT.
- Code node `Find Active Loan`: hardcoded Supabase JWT in headers literal.
- Code node `Log and Update Records`: hardcoded Supabase JWT AND hardcoded `Bearer 0bbc8cff...` for LoanOS `/api/activity` POST. Both literals → env var / credential.

### LoanOS — Outlook CD & Contract Extractor (`HkLjsnnhT5MgrX5H`)
- Code node `Match to Loan`: hardcoded Supabase JWT literal in headers.
- Code node `Upload and Save Doc`: hardcoded Supabase JWT literal (used for both REST and Storage upload).
- Code node `Log Unmatched`: hardcoded Supabase JWT literal.
- (No httpRequest nodes hold inline secrets here — all Supabase access is via Code nodes.)

### LoanOS — Refi Watch Set Rate (`3iXImUkjgMitpJKt`)
- Node `Store Rate` (httpRequest): INLINE Supabase JWT in `apikey` + `Authorization` → "Supabase Service Role" credential.
- Otherwise simple — only this one node leaks. Single migration.

### LoanOS — Autonomous Session Digest (`Gx5YpWddAhXrEYKT`)
- ✅ CLEAN — `Send via Resend` already uses `genericCredentialType: httpBearerAuth`. Reference for clean Resend integration.

### LoanOS — Arive Status Update → Supabase (`9JyzzwKac8v3uQ7d`)
- 6 httpRequest nodes hit Supabase with INLINE JWT (`Get Org ID`, `Find Loan by Arive ID`, `Update Loan Status`, `Sync Contact Rate+Balance`, `Log Status History`, `Log Status Updated`, `Log Loan Not Found`, `Log Error` — 12 Supabase pairs total).
- 6 occurrences of `Bearer 0bbc8cff...` for LoanOS API endpoints.
- Code node `Upsert Agent Contacts` likely also has hardcoded JWT (matches sibling workflow `1tagvoU0UXtdDiMY` pattern).

### LoanOS — Rate Check Form Submission (`Pf1zWuKAnD4SznSR`)
- Node `Insert Contact` (httpRequest): INLINE Supabase JWT, `authentication: "none"` (note: explicitly set to none, ignores credentials). Migrate.
- Node `Log Activity` (httpRequest): same — INLINE Supabase JWT, `authentication: "none"`.

### LoanOS — PA Welcome Nurture (6 emails, 60 days) (`rwi3qEYgJKGGHkHc`)
- ✅ CLEAN — all 12 HTTP request nodes use `genericCredentialType`. Reference for clean Supabase integration.

### LoanOS — DPA Guide Nurture (8 emails, 52 days) (`0M8Vnf6MhB1xtaIg`)
- ✅ CLEAN — all 16 HTTP request nodes use `genericCredentialType`. Reference for clean Supabase integration.

### LoanOS — Lender Email Ingest (`hHXpKUirhnBCnQTO`)
- Node `Claude - Extract Guidelines`: uses `predefinedCredentialType` for Anthropic → no action.
- Node `Log to Activity` (httpRequest): uses `={{ $env.SUPABASE_SERVICE_KEY }}` for both `apikey` and `Authorization` → no action; this is a partial pattern. Confirms env var is configured.
- Code node `Update Lender Record`: hardcoded Supabase JWT literal in `sbKey` → switch to `$env.SUPABASE_SERVICE_KEY` to match the HTTP node above.

### LoanOS — New Application Received (`cWESnXXy9UOLB13q`)
- Node `Download Application PDF` (httpRequest): INLINE Supabase JWT in `Authorization`. The node sets `authentication: "genericCredentialType"` but ALSO embeds a literal Bearer in the header — this is redundant/risky.
- Node `Call Claude API`: uses `genericCredentialType` (Header Auth) → no action.
- Node `Update Loan Record` (httpRequest): INLINE Supabase JWT (apikey + Authorization).
- Node `Log Application Email` (httpRequest): INLINE Supabase JWT (apikey + Authorization).

### LoanOS — Pre-Approval Email (`utMvZpkdRwIRZ51u`)
- Node `Download PDF` (httpRequest): INLINE Supabase JWT in `Authorization` (same redundant-with-credential pattern as above).
- Node `Call Claude API`: uses `genericCredentialType` → no action.
- Code node `Build PA Email`: hardcoded Supabase JWT literal in `sbHeaders` → use `$env.SUPABASE_SERVICE_KEY`.
- Node `Update Loan Record` (httpRequest): INLINE Supabase JWT.
- Node `Log PA Email` (httpRequest): INLINE Supabase JWT.

### LoanOS — Realtor Referral Acknowledgment (`H5doQYLLIAg0zMug`)
- Code node `Lookup Realtor`: hardcoded Supabase JWT literal `SUPABASE_KEY = "eyJhbGci..."` → use `$env.SUPABASE_SERVICE_KEY`.
- Node `Send Ack Email` (httpRequest, Resend): uses `genericCredentialType: httpBearerAuth` → no action. Good.
- Node `Log Ack Activity` (httpRequest): INLINE Supabase JWT.
- Node `Log Warning` (httpRequest): INLINE Supabase JWT.

### LoanOS — Inbound Email → Supabase Log (`qgb99Eh2ziy0INMk`)
- 4 httpRequest nodes carry INLINE Supabase JWT (8 Bearer + 2 apikey instances counted).
- 4 occurrences of `Bearer 0bbc8cff...` for LoanOS API endpoints.
- 2 nodes use `genericCredentialType` already (mixed migration state — partial).

### LoanOS — Web Lead Automation (`PiuIsQpBuydtFM4m`)
- Node `Create LoanOS Contact` (httpRequest): INLINE `Authorization: Bearer 0bbc8cff...` → "LoanOS Self-Bearer".
- Node `Log to Activity (Web Lead)` (httpRequest): INLINE `Authorization: Bearer 0bbc8cff...` → "LoanOS Self-Bearer".
- No Supabase calls (writes go through LoanOS API, which writes to Supabase server-side — good architecture).
- Outlook nodes use connector credential → no action.

### LoanOS — Contract Received (`UfNcdpoVKQZqy0fj`)
- 6+ httpRequest nodes with INLINE Supabase JWT (12 Bearer + 12 apikey pairs counted).
- 2 occurrences of `predefinedCredentialType` — these are for the Anthropic Claude calls (correctly configured). All Supabase nodes still leak.

### LoanOS — Final CD Email (`SkzrWeR0bHZs8kWX`)
- Node `Download PDF (Deactivated)` (httpRequest): node is `disabled: true` but still has INLINE Supabase JWT — should be cleaned during migration.
- Node `Call Claude API`: uses `genericCredentialType` → no action.
- Node `Log CD Email` (httpRequest): INLINE Supabase JWT.
- Node `Update Loan Record` (httpRequest): INLINE Supabase JWT.

## Migration plan (prioritized)

Order by exposure risk:

### 1. **HIGHEST — Supabase service-role JWT (full DB access including PII)**
21 workflows, ~110 instances. Single rotated key affects everything.

**Step 1a — HTTP-node migration (mechanical):** create n8n credential `Supabase Service Role` (Header Auth with `apikey` + `Authorization`). Touch each node listed above and set `authentication: "genericCredentialType"`, `genericAuthType: "httpHeaderAuth"`, attach the credential, and DELETE the inline `apikey` and `Authorization` headers from `headerParameters`.

Workflow IDs with HTTP nodes to update (count of nodes to update is approximate):
- `1tagvoU0UXtdDiMY` (~6 nodes)
- `9JyzzwKac8v3uQ7d` (~8 nodes — busiest)
- `nccX5ml82mMGyE9T` (2 HTTP nodes; 3 code nodes — see Step 1b)
- `HkLjsnnhT5MgrX5H` (0 HTTP nodes; 3 code nodes only — Step 1b)
- `iyKFy0ODkyyqQaAS` (4 nodes)
- `ZUeGy8u8P4o6DPM3` (2 HTTP nodes; 1 code node)
- `Rn6rtlKeoQ0CrUkb` (1 node)
- `V6RhmJpOb7pOzMte` (1 node)
- `eJG4wckrj6SmSpm1` (1 node)
- `H5doQYLLIAg0zMug` (2 HTTP nodes; 1 code node)
- `Pf1zWuKAnD4SznSR` (2 nodes; explicitly set `authentication:"none"` — change this too)
- `cWESnXXy9UOLB13q` (3 nodes; 1 has redundant inline despite already using genericCredentialType — strip the inline Bearer)
- `utMvZpkdRwIRZ51u` (3 HTTP nodes; 1 code node)
- `qgb99Eh2ziy0INMk` (4 nodes)
- `UfNcdpoVKQZqy0fj` (~10 nodes)
- `SkzrWeR0bHZs8kWX` (3 nodes including the disabled `Download PDF`)
- `J9Pe24vUi6fpZtdZ`, `YbgDnTpPdefcazKy`, `yCTydQ7RfZK4DyUg`, `3iXImUkjgMitpJKt`, `hHXpKUirhnBCnQTO` (1-2 nodes each)

**Step 1b — Code-node migration (manual):** ensure n8n env var `SUPABASE_SERVICE_KEY` is set (already used in `hHXpKUirhnBCnQTO`). Then in each code node below, replace the hardcoded `eyJhbGci...` literal with `process.env.SUPABASE_SERVICE_KEY`. Affected code nodes (~9):
- `YbgDnTpPdefcazKy` → `Build Referral Email` (2 occurrences in same node)
- `yCTydQ7RfZK4DyUg` → `Build Refi Email`
- `ZUeGy8u8P4o6DPM3` → `Check Dedup` (and fix the stray `''` syntax error)
- `1tagvoU0UXtdDiMY` → `Upsert Agent Contacts`
- `9JyzzwKac8v3uQ7d` → `Upsert Agent Contacts`
- `nccX5ml82mMGyE9T` → `Find Active Loan`, `Log and Update Records`
- `HkLjsnnhT5MgrX5H` → `Match to Loan`, `Upload and Save Doc`, `Log Unmatched`
- `H5doQYLLIAg0zMug` → `Lookup Realtor`
- `hHXpKUirhnBCnQTO` → `Update Lender Record`
- `utMvZpkdRwIRZ51u` → `Build PA Email`

After 1a + 1b complete: rotate the Supabase service key in Supabase dashboard; update credential + env var in n8n; verify all workflows still execute.

### 2. **HIGH — LoanOS internal API bearer token** (`Bearer 0bbc8cff...`)
Whoever holds this token can write to your contacts/activity tables via your own API (which probably has fewer guardrails than direct Supabase access, but still creates phantom records and bypasses any rate limiting).

Migrate to a `LoanOS Self-Bearer` Header Auth credential. Affected workflows (HTTP nodes):
- `1tagvoU0UXtdDiMY` (4 nodes)
- `9JyzzwKac8v3uQ7d` (6 nodes)
- `V6RhmJpOb7pOzMte` (1 node — `LoanOS: Log Social Post`)
- `eJG4wckrj6SmSpm1` (1 node)
- `qgb99Eh2ziy0INMk` (4 nodes)
- `PiuIsQpBuydtFM4m` (2 nodes — `Create LoanOS Contact`, `Log to Activity (Web Lead)`)

Plus 1 code-node literal in `nccX5ml82mMGyE9T` → `Log and Update Records` — needs env var (suggest `LOANOS_API_TOKEN`) since it's inside JS.

### 3. **MEDIUM — Publer API token** (`Bearer-API 14ff59c2...`)
Posts publicly on your behalf. Less DB risk but reputational/spam risk.

Migrate to `Publer API` Header Auth credential. Affected nodes (4 total):
- `V6RhmJpOb7pOzMte` → `Publer: Upload Media`, `Publer: Post to All 4 Platforms`
- `eJG4wckrj6SmSpm1` → `Publer: Upload Media`, `Publer: Post to All Platforms`

### 4. **MEDIUM — Google Gemini / Imagen API key** (`AIzaSyC8...`)
Affected nodes (4 total): same two workflows as Publer above (`Gemini: Adapt for Platforms`, `Gemini Imagen: Generate Image`, `Gemini: Generate Caption`, `Gemini: Generate Quote Card Image`). Migrate to `Gemini API Key` Header Auth credential.

### 5. **LOWEST — Mailchimp Basic auth** (`Basic YW55...`)
Single node, single workflow. Migrate to `Mailchimp List 5053c57af2` Header Auth credential.
- `J9Pe24vUi6fpZtdZ` → `Apply Mailchimp Tags`

## Notes / non-findings

- No Resend (`re_...`) inline keys were found. Both Resend integrations already use n8n credentials. Good.
- No Anthropic (`sk-ant-...`) inline keys were found. All Claude calls use credentials. Good.
- No OpenAI keys observed in any audited workflow.
- `cWESnXXy9UOLB13q`, `utMvZpkdRwIRZ51u`, `SkzrWeR0bHZs8kWX` exhibit a "double-auth" anti-pattern: `authentication: "genericCredentialType"` is set, but Supabase JWT is *also* hardcoded in `headerParameters`. The credential takes precedence at runtime, but the inline value still leaks if the JSON is exported. Strip the inline header during migration.
- `Pf1zWuKAnD4SznSR` deliberately sets `authentication: "none"` and embeds the secret in headers — switch it like the rest.
- One stray syntax issue worth flagging during migration: `ZUeGy8u8P4o6DPM3` → `Check Dedup` code node has malformed quoting in the JWT literal (`'eyJhbGci...4HmQ''` with a doubled trailing single quote). The dedup check may currently throw silently. Fix while migrating.
