# Marketing Tab Redesign — Design Spec
**Date:** 2026-03-19
**Status:** Approved by Adam
**Scope:** Full rebuild of `/dashboard/marketing` — UI, data layer, API wiring

---

## Problem Statement

The existing marketing tab has 9 sub-tabs, data siloed in a `mcc_state` JSON blob, duplicate newsletter logic that bypasses the live Netlify backend, and a rate update page that is purely a manual log with no send capability. It is not usable as a weekly command center.

---

## Solution Overview

Rebuild `/dashboard/marketing` as a 3-tab command center:

| Tab | Purpose |
|-----|---------|
| **SEND** | Rate Update + Newsletter forms wired to live Netlify functions |
| **CALLS** | Per-contact call tracking across 4 lists; auto-logs on Mark Called |
| **HISTORY** | Weekly activity log; cadence health strip; browses backward by week |

---

## Design System

- **Background:** `#09090b` (page), `#18181b` (cards)
- **Borders:** `#3f3f46` (default), `#52525b` (inputs)
- **Text:** `#f4f4f5` (primary), `#a1a1aa` (secondary), `#71717a` (hint)
- **Accent:** `#C9A84C` (gold) — active tabs, labels, primary CTA border
- **Status:** `#4CAF82` green · `#C9A84C` gold · `#E05252` red
- **Font:** IBM Plex Mono throughout
- **Labels:** `font-weight: 700`, `font-size: 11px`, `color: #f4f4f5`
- **Section titles:** `font-weight: 800`, `font-size: 10px`, `color: #C9A84C`, `letter-spacing: 0.2em`
- **Inputs:** `background: #09090b`, `border: 1px solid #52525b`, gold focus ring, `border-radius: 2px`
- **Buttons:** Bold text, `border-radius: 2px`; primary CTA = gold fill + black text

---

## Tab 1: SEND

### Layout
- Inner toggle at top: `📈 RATE UPDATE` | `✉ NEWSLETTER`
- Cadence badge below toggle — shows days since last send, color-coded
- Form sections below

### Rate Update Form

**Calls:** `POST https://styermortgage.com/.netlify/functions/generate-rate-update`

**Fields:**
| Field | Type | Notes |
|-------|------|-------|
| Current Rates table | Table | 6 rows: 30-Yr Fixed, 15-Yr Fixed, 30-Yr Jumbo, VA 30-Yr, FHA 30-Yr, FHA 5-Yr ARM |
| Rate (per row) | Text input | Gold text, bold |
| APR (per row) | Text input | Auto-calculated on rate input; dashed border = auto-filled; editable override |
| Audience | Chip toggles | Borrowers / Realtors — both on by default |
| Rate Direction | Select | Rates dropped / went up / flat / volatile |
| Content Depth | Select | Short & Sweet / Standard / In-Depth |
| Blurb / Talking Points | Textarea | Context for AI |
| Anything Else | Textarea | Optional |

**APR Auto-Calculation (client-side, per row):**
```
30-Yr Fixed:  rate + 0.07%
15-Yr Fixed:  rate + 0.10%
30-Yr Jumbo:  rate + 0.06%
VA 30-Yr:     rate + 0.18%  (VA funding fee)
FHA 30-Yr:    rate + 0.58%  (FHA MIP)
FHA 5-Yr ARM: rate + 0.12%
```
APR field is always editable — auto-fill is an estimate only.

**Netlify request payload (Rate Update):**
```json
{
  "rates": "30-Year Fixed: 6.875% | APR: 6.95%\n15-Year Fixed: 6.25% | APR: 6.35%\n30-Yr Jumbo: 6.875%\nVA 30-Yr: 6.25% | APR: 6.43%\nFHA 30-Yr: 6.375% | APR: 6.94%\nFHA 5-Yr ARM: 5.875% | APR: 5.99%",
  "direction": "Rates dropped",
  "blurb": "<talking points>",
  "notes": "<anything else>",
  "depth": "standard",
  "audiences": ["borrower", "realtor"],
  "mode": "preview"
}
```
The `rates` field is built client-side by formatting the table rows as `ProductName: Rate% | APR: APR%` (omit `| APR:` portion if APR is blank). The `depth` field maps from Content Depth select: `"Short & Sweet"` → `"short"`, `"Standard"` → `"standard"`, `"In-Depth"` → `"in-depth"`.

**Netlify preview response (`result.preview`):**
```ts
{
  pageTitle:         string,
  pageUrl:           string,   // e.g. https://styermortgage.com/rates/2026-03-19.html
  borrowerSubject:   string,
  borrowerPreheader: string,
  realtorSubject:    string,
  realtorPreheader:  string,
}
```

**Netlify live response:**
```ts
{
  pageUrl:     string,
  campaigns:   { audience: string, campaignId: string, status: string }[],
}
```

**Actions:** `👁 Preview` · `▶ Publish + Send Emails` · `📅 Schedule`

**Flow:**
1. **Preview** → POST with `mode: "preview"` → on success, inline preview panel appears **below the form** (not a modal). Panel shows: page URL, borrower subject line, realtor subject line. Loading spinner while request is in flight. On Netlify error, shows red error banner with error message; does NOT log anything.
2. **Publish + Send** → POST with `mode: "live"` → on success, shows green success banner with published URL + campaign IDs → **auto-logs to HISTORY** and **updates `mcc_state.last['rate-update']`** to current ISO timestamp. On error, shows red banner; does NOT log.
3. **Schedule** → Preview must be run first (button is disabled until preview succeeds). Shows a date+time picker inline below preview panel. On confirm, POSTs same payload with `mode: "live"` and `scheduleTime: "<ISO 8601 UTC string>"`. Must be at least 15 minutes in the future (validate client-side).
4. **Error state:** Red banner below action row: `"Netlify error: <message from response>"`. Retry is re-clicking Preview or Publish.

---

### Newsletter Form

**Calls:** `POST https://styermortgage.com/.netlify/functions/generate-newsletter`

**Content Mode toggle:** `STRUCTURED FIELDS` | `CUSTOM PROMPT`

**Structured Fields mode:**
| Field | Type | Notes |
|-------|------|-------|
| Audience | Chip toggles | Borrowers / Past Clients · Realtors / Partners |
| This Week's Topic / Theme | Text input | Required |
| Articles / Links to Reference | Textarea | Optional |
| Personal Story / Anecdote | Textarea | Optional, large |
| AI Tool Tip for Realtors | Textarea | Optional — for "AI Edge" section in realtor version |
| Anything Else | Textarea | Optional |

Maps to Netlify payload:
```json
{
  "topic": "<topic>",
  "audiences": ["borrower", "realtor"],
  "mode": "preview|live",
  "story": "<story>",
  "articles": "<articles>",
  "aiTool": "<aiTool>",
  "notes": "<anything else>"
}
```

**Custom Prompt mode:**
| Field | Type | Notes |
|-------|------|-------|
| Audience | Chip toggles | Same as above |
| Full Prompt | Large textarea | Maps to `customPrompt` in Netlify payload |

**Netlify request payload (Newsletter — structured fields):**
```json
{
  "topic":     "<topic>",
  "audiences": ["borrower", "realtor"],
  "mode":      "preview",
  "story":     "<story>",
  "articles":  "<articles>",
  "aiTool":    "<AI tool tip>",
  "notes":     "<anything else>"
}
```

**Netlify request payload (Newsletter — custom prompt):**
```json
{
  "customPrompt": "<full prompt text>",
  "audiences":    ["borrower", "realtor"],
  "mode":         "preview"
}
```

**Netlify preview response (`result.preview`):**
```ts
{
  pageTitle:          string,
  pageUrl:            string,   // e.g. https://styermortgage.com/blog/2026-03-19.html
  borrowerSubject:    string,
  borrowerPreheader:  string,
  borrowerEmailHtml:  string,
  realtorSubject:     string,
  realtorPreheader:   string,
  realtorEmailHtml:   string,
  webContent:         string,   // full article body HTML
  linkedinPost:       string,
  facebookPost:       string,
}
```

**Netlify live response:**
```ts
{
  pageUrl:     string,
  campaigns:   { audience: string, campaignId: string, status: string }[],
  socialPosts: { linkedin: string, facebook: string },
}
```

**Actions:** `👁 Preview` · `▶ Publish + Send Emails` · `📅 Schedule`

**Flow:**
1. **Preview** → POST with `mode: "preview"` → inline preview panel appears **below the form**: page URL, borrower subject + preheader, realtor subject + preheader. Loading spinner while in flight. On error, red banner; no log.
2. **Publish + Send** → POST with `mode: "live"` → green success banner with blog URL + campaign IDs → **auto-logs to HISTORY** and **updates `mcc_state.last`**: `realtor-nl` and/or `borrower-nl` depending on selected audiences. On error, red banner; no log.
3. **Schedule** → Preview must succeed first (button disabled until preview resolves). Shows date+time picker inline. On confirm, POSTs same payload with `mode: "live"` and `scheduleTime: "<ISO 8601 UTC>"` (must be ≥15 min in future — validate client-side, show inline error if not). Expected response shape for scheduled send:
```ts
{
  pageUrl:   string,                                          // page published immediately
  campaigns: { audience: string, campaignId: string, status: 'scheduled' | string }[],
}
```
   The page publishes immediately. `mcc_state.last` and HISTORY log are updated immediately (at schedule time, not send time) since the page is live. Log entry `notes` field includes `"(email scheduled for HH:MM)"`. Confirmation banner: green, shows page URL + "Email scheduled for [time]".
4. **Error state:** Red banner: `"Netlify error: <message>"`. No log written on error.

---

### Cadence Badges (both forms)
- Read `last` timestamps from `mcc_state` Supabase record
- Colors: green (≤ freq), gold (≤ freq × 1.5), red (> freq × 1.5 or never)

**Tracker key → label → freq mapping (used in both SEND badges and HISTORY health strip):**
| Key | Label | Freq | Written by |
|-----|-------|------|------------|
| `rate-update` | Rate Update | 7d | Rate Update publish |
| `realtor-nl` | Newsletter (Realtor) | 7d | Newsletter publish (realtor audience) |
| `borrower-nl` | Newsletter (Borrower) | 7d | Newsletter publish (borrower audience) |
| `realtor-calls` | Realtor Calls | 7d | Mark Called on REALTORS list |
| `preapproval` | Pre-Approval Calls | 7d | Mark Called on PRE-APPROVALS list |
| `social-post` | Social Posts | 2d | Manual log entry with Channel = 'LinkedIn' or 'Facebook' |

**Note:** `past-client` tracker removed — no CALLS list writes to it. HISTORY health strip shows 6 chips.

SEND tab shows only `rate-update` (Rate Update form) or `realtor-nl` + `borrower-nl` (Newsletter form).
HISTORY health strip shows all 6 chips.

**`mcc_state.last` key written on successful publish or Mark Called:**
- Rate Update publish → `last['rate-update'] = now`
- Newsletter publish, Realtors audience → `last['realtor-nl'] = now`
- Newsletter publish, Borrowers audience → `last['borrower-nl'] = now`
- Both audiences selected → both keys updated
- Mark Called on REALTORS list → `last['realtor-calls'] = now`
- Mark Called on PRE-APPROVALS list → `last['preapproval'] = now`
- Manual log entry with Channel 'LinkedIn' or 'Facebook' → `last['social-post'] = now`

---

## Tab 2: CALLS

### Layout
- List selector pills: `REALTORS (n)` · `PRE-APPROVALS (n)` · `ACTIVE FILES (n)` · `HOT LEADS (n)`
- Search input + ADD button + CSV import button
- Contact card grid (2 columns desktop, 1 column mobile)

### Contact Card
Each card shows:
- Name (bold, white)
- Company
- Phone (tel: link) + Email (mailto: link)
- Last Touch timestamp — color-coded (green ≤ 14d, gold 15–21d, red > 21d or never)
- Call history (last 2 dates shown)
- `📞 Mark Called` button → opens inline note input → Save logs to HISTORY → card dims to 55% opacity + shows `✓ CALLED TODAY` badge
- `✕` delete button

### Contact Add Form (inline, not modal)
Toggled by `+ ADD` button. Fields: First Name*, Last Name*, Company, Phone, Email, Note. Appears above the contact grid when open. On save, prepends contact to list, persists to `mcc_state`.

### Contact Delete
`✕` button shows a browser `confirm()` dialog: `"Delete [First Last]? This cannot be undone."` — delete only on confirmation.

### Contact Data
- Stored in `mcc_state` Supabase JSON blob (existing), keyed by list: `realtors`, `preapprovals`, `inprocess`, `hotleads`
- `calledToday` flag: compare stored `lastTouch` date string (`YYYY-MM-DD`) to `new Date().toISOString().slice(0,10)` on each render. If equal, treat as called today. No server-side reset needed.
- CSV import: columns `FirstName, LastName, Company, Phone, Email, LastTouch` — deduplicates on `first|last` lowercase. Missing Phone/Email columns silently skipped (import still proceeds). Duplicate rows skipped with count shown in alert.

### Empty State (CALLS)
When a list has no contacts: centered message — `"No [Realtors] yet. Add manually or import a CSV."` with an `+ ADD` button inline.

### Auto-log on Mark Called
Clicking `📞 Mark Called` opens an inline note input on the card. On "Save Call":
1. Each call creates one `LogEntry` written to `mcc_state.log`:
```ts
// uid() = crypto.randomUUID() — see LogEntry type definition in HISTORY section
LogEntry {
  id:       crypto.randomUUID(),
  date:     new Date().toISOString(),
  activity: `Called ${contact.first} ${contact.last}`,
  channel:  'Phone Call',
  notes:    callNote,  // empty string if no note entered
}
```
2. Contact's `lastTouch` updates to today's date string, `calledToday` sets to `true`, call appended to `callHistory`.
3. `mcc_state` saved to Supabase.

**HISTORY display aggregation** happens at render time: log entries with `channel === 'Phone Call'` on the same date are grouped visually. The first entry shows full name; subsequent same-date/same-list entries show as "+ N others". This is display-only — the underlying log stores individual entries.

---

## Tab 3: HISTORY

### Layout
- Week navigation: `← PREV` · `Mar 17 – Mar 23, 2026 · This Week` · `NEXT →` (disabled at current week)
- Cadence health strip (horizontal chips, color-coded):
  - Rate Update, Newsletter (Realtor), Newsletter (Borrower), Realtor Calls, Pre-Approval Calls, Social Posts
- Activity log table below (grouped by week)
- `+ LOG ACTIVITY` button for manual entries

### Log Table Columns
`DATE` · `ACTIVITY` · `TYPE` (badge) · `CHANNEL`

### Activity Types + Badge Colors
| Type | Color |
|------|-------|
| Rate Update | Gold `#C9A84C` |
| Newsletter | Blue `#5B8FD4` |
| Call | Green `#4CAF82` |
| Social | Purple `#9B72CF` |
| Task | Gray `#71717a` |

**Channel → TYPE badge mapping** (derived at render time from `LogEntry.channel`; `type` is NOT stored):
| `channel` value | TYPE badge |
|-----------------|-----------|
| `'Rate Update'` | Rate Update |
| `'Email'` | Newsletter |
| `'Phone Call'` | Call |
| `'LinkedIn'` | Social |
| `'Facebook'` | Social |
| `'Task'` | Task |
| `'Other'` | Task |

### Log Entry Shape (all sources)
```ts
// uid() = crypto.randomUUID() — available in all modern browsers and Node 14.17+; no import needed
type LogEntry = {
  id:       string   // crypto.randomUUID()
  date:     string   // ISO timestamp — new Date().toISOString()
  activity: string   // human-readable label
  channel:  string   // 'Email' | 'Phone Call' | 'LinkedIn' | 'Facebook' | 'Rate Update' | 'Task' | 'Other'
  notes:    string   // empty string if none
}
```

**Auto-log on Rate Update publish:**
```ts
// rate_30yr = the value from the "30-Yr Fixed" rate input in the rates table form state
// (e.g. "6.875%"). If the row is empty, omit the suffix entirely.
{ activity: `Rate Update sent — 30yr ${rate_30yr}`, channel: 'Rate Update', notes: blurb }
```

**Auto-log on Newsletter publish:**
```ts
// audience = comma-joined selected audience labels, e.g. "Borrowers", "Realtors", or "Borrowers + Realtors"
{ activity: `Newsletter sent — ${preview.borrowerSubject || preview.realtorSubject}`, channel: 'Email', notes: `${audience} · Mailchimp` }
```

### Manual Log Entry (`+ LOG ACTIVITY`)
Inline form (not modal) appended below the log table when button is clicked:
- Fields: Activity (text, required), Channel (select — same options as `LogEntry.channel`), Date (date input, default today), Notes (text, optional)
- On save: prepends to `mcc_state.log`, saves to Supabase, collapses form.

### Empty State (HISTORY)
When no log entries exist for the selected week: `"Nothing logged this week."` centered in the log table area. If `mcc_state` does not exist yet for this user, treat as empty — page creates it on first save.

### Week Boundaries
- Week = Monday–Sunday (ISO week standard)
- Calculated in local time using `new Date()`
- "This Week" = current Monday 00:00:00 local → current Sunday 23:59:59 local
- `NEXT →` disabled when `weekOffset === 0`

### First-Time User Initialization
If `mcc_state` record does not exist in Supabase for this `user_id`:
- Page renders normally with all empty states
- On first save (any action — Mark Called, Log Activity, etc.), upsert creates the record with the full `BLANK_STATE` shape

### Cadence Health Calculation
Reads `mcc_state.last` timestamps, computes days since each, applies thresholds:
- Green: `days <= freq`
- Gold: `days <= freq * 1.5`
- Red: `days > freq * 1.5` or `last` is null/missing

HISTORY chip shows days-ago label: "3d ago", "Never", "Today".

---

## Data Layer

### Existing: `mcc_state` Supabase table

**Table columns:**
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Foreign key → auth.users.id |
| `state` | jsonb | The full MCCState JSON blob |
| `updated_at` | timestamptz | Auto-updated on write |

**Read query:** `SELECT state FROM mcc_state WHERE user_id = <auth.uid> LIMIT 1`
**Write query:** Upsert on `(user_id)` conflict — update `state` + `updated_at`.

The existing `page.tsx` already handles this pattern. Keep it identical in the rewrite.

**Shape (already in production):**
```ts
type MCCContact = {
  id:          string
  first:       string
  last:        string
  company:     string
  phone:       string
  email:       string
  lastTouch:   string | null   // YYYY-MM-DD date string, or null
  note:        string
  callHistory: { date: string; note: string }[]
  // NOTE: calledToday is NOT stored — computed at render by comparing lastTouch to today's date string
}

type LogEntry = {
  id:       string
  date:     string   // ISO timestamp
  activity: string
  channel:  string
  notes:    string
}

type MCCState = {
  tasks:       Record<string, Record<string, boolean>>,  // keyed by YYYY-MM-DD date
  log:         LogEntry[],
  last:        Record<string, string>,                   // tracker key → ISO timestamp
  contacts:    { realtors: MCCContact[], preapprovals: MCCContact[], inprocess: MCCContact[], hotleads: MCCContact[] },
  socialPosts: unknown[],   // not used in this rebuild; preserve as-is
  newsletters: unknown[],   // not used in this rebuild; preserve as-is
  todos:       unknown[],   // not used in this rebuild; preserve as-is
  doneTodos:   unknown[],   // not used in this rebuild; preserve as-is
}
```

**BLANK_STATE** (used when initializing a first-time user record):
```ts
const BLANK_STATE: MCCState = {
  tasks:       {},
  log:         [],
  last:        {},
  contacts:    { realtors: [], preapprovals: [], inprocess: [], hotleads: [] },
  socialPosts: [],
  newsletters: [],
  todos:       [],
  doneTodos:   [],
}
```

**No schema changes needed.** The redesign reads/writes the same `mcc_state` structure.

### Netlify Error Response Shape
Both `generate-rate-update` and `generate-newsletter` return on failure:
```ts
// HTTP 4xx/5xx
{ error: string }
```
Extract with: `const { error } = await res.json()` after checking `!res.ok`. Display as: `"Netlify error: ${error}"` in the red banner. If the response body cannot be parsed as JSON, fall back to: `"Netlify error: HTTP ${res.status}"`.


### Settings (read-only in marketing tab)
Marketing tab reads from `user_settings` (existing):
- `integrations.anthropic_api_key` — passed to Netlify if needed (Netlify uses its own key server-side; this is fallback only)
- `website.dispatch_webhook_url` — not needed for new flow (Netlify handles publish)
- No Mailchimp credentials needed in UI — Netlify handles all sending

---

## Files to Create / Modify

### Delete (dead code)
- `src/app/dashboard/marketing/content/page.tsx` — duplicate newsletter UI
- `src/app/dashboard/marketing/social/page.tsx` — orphaned social tab
- `src/app/dashboard/marketing/rate-updates/page.tsx` — replaced by SEND tab
- `src/app/api/marketing/generate-newsletter/route.ts` — replaced by direct Netlify call
- `src/app/api/marketing/publish-newsletter/route.ts` — replaced by direct Netlify call
- `src/app/api/marketing/run-testimonials/route.ts` — orphaned

### Modify
- `src/app/dashboard/marketing/page.tsx` — **full rewrite** — 3-tab shell + imports sub-components
- `src/lib/marketing/schedule.ts` — delete `DAYS`, `TCOLS`, `DayTask`, `DayDef` exports. **Replace the existing `TRACKERS` array entirely** with exactly these 6 entries (matching the tracker table above):
```ts
export const TRACKERS = [
  { key: 'rate-update',   label: 'Rate Update',          freq: 7  },
  { key: 'realtor-nl',    label: 'Newsletter (Realtor)',  freq: 7  },
  { key: 'borrower-nl',   label: 'Newsletter (Borrower)', freq: 7  },
  { key: 'realtor-calls', label: 'Realtor Calls',         freq: 7  },
  { key: 'preapproval',   label: 'Pre-Approval Calls',    freq: 7  },
  { key: 'social-post',   label: 'Social Posts',          freq: 2  },
] as const
```
Remove the existing `in-process` and `video` tracker entries — no new UI writes to them.

### New Component Files
All co-located in `src/app/dashboard/marketing/`:
- `_components/SendTab.tsx` — inner toggle + cadence badges; imports RateUpdateForm + NewsletterForm
- `_components/RateUpdateForm.tsx` — rates table, APR auto-calc, context fields, preview panel, action buttons
- `_components/NewsletterForm.tsx` — mode toggle, structured fields or prompt textarea, preview panel, action buttons
- `_components/CallsTab.tsx` — list pills, search, add form, contact grid
- `_components/ContactCard.tsx` — individual contact card with Mark Called inline flow
- `_components/HistoryTab.tsx` — week nav, health strip, log table, manual log entry form
- `_components/shared.tsx` — shared atoms: `Card`, `Btn`, `Input`, `SectionLabel`, `CadenceBadge`

### Delete (API routes — dead code)
- `src/app/api/marketing/generate-newsletter/route.ts`
- `src/app/api/marketing/publish-newsletter/route.ts`
- `src/app/api/marketing/run-testimonials/route.ts`
- `src/app/api/marketing/send-mailchimp/route.ts` — delete (Netlify handles Mailchimp; no future use case)
- `src/app/api/marketing/log-social-post/route.ts` — delete (n8n workflow inactive; out of scope)

### Delete (sub-pages)
- `src/app/dashboard/marketing/content/page.tsx`
- `src/app/dashboard/marketing/social/page.tsx`
- `src/app/dashboard/marketing/rate-updates/page.tsx`

---

## What Gets Cut

| Removed | Reason |
|---------|--------|
| 9-tab structure | Replaced by 3 focused tabs |
| TODAY task checklist | Belongs in Dashboard, not Marketing |
| WEEK at a glance | Read-only, no action value |
| BRAIN DUMP tab | Inline widget elsewhere; not a marketing feature |
| SOCIAL tab | Social logging moves to HISTORY manual entry |
| NEWSLETTERS tab | Replaced by SEND tab newsletter form |
| TRACKER tab | Cadence health strip in HISTORY replaces it |
| THIS WEEK tab | Replaced by SEND tab cadence badges |
| Duplicate newsletter API routes | Netlify is the backend |

---

## Non-Goals (out of scope)
- Salesforce contact sync — Arive → Zapier → n8n → LoanOS pipeline handles this separately
- Social post automation — n8n workflow `eJG4wckrj6SmSpm1` exists but inactive; out of scope
- Outlook email sync — separate n8n workflow; out of scope
- New Supabase tables — reuse `mcc_state` blob

---

## Definition of Done
- [ ] `mcc_state` data persists across sessions (no regression)
- [ ] Rate Update form calls Netlify `generate-rate-update`, previews correctly, publishes + sends on confirm
- [ ] APR auto-calculates on rate input, remains editable
- [ ] Newsletter form (structured + prompt modes) calls Netlify `generate-newsletter`
- [ ] Successful send auto-logs to HISTORY
- [ ] CALLS tab: all 4 lists load, Mark Called logs entry with contact names, calledToday resets daily
- [ ] HISTORY: week navigation works, cadence health strip accurate, manual log entry works
- [ ] Old sub-pages (`/content`, `/social`, `/rate-updates`) removed or redirected
- [ ] No TypeScript errors
- [ ] Renders correctly at `localhost:3000/dashboard/marketing`
- [ ] Mobile responsive (single column below 640px)
- [ ] Design system: dark theme, IBM Plex Mono, gold `#C9A84C` accent, bold labels
