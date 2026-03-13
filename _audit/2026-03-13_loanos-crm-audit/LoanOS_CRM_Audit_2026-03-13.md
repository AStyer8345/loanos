# LoanOS Pipeline CRM — Audit & Redesign Document
**Prepared:** March 13, 2026  
**Scope:** contacts/page.tsx · contacts/[id]/page.tsx · ContactRecordView.tsx · loans/page.tsx · loans/[id]/page.tsx · migrations 011 & 012  
**Goal:** Salesforce power at 50% the complexity. Notion simplicity meets Airtable power.

---

## Table of Contents

1. [Current State Audit](#section-1--current-state-audit)
2. [Gaps & Problems](#section-2--gaps--problems)
3. [Detailed UX Recommendations](#section-3--detailed-ux-recommendations)
4. [Answers to Specific Questions](#section-4--answers-to-specific-questions)
5. [Priority Implementation Plan](#section-5--priority-implementation-plan)

---

## Section 1 — Current State Audit

### 1A. Contacts List Page (`contacts/page.tsx`)

**What's working well:**
- Smart list sidebar with 8 pre-built filters + custom list support
- Inline stage/type editing via badge click → immediate Supabase update
- Bulk actions (Update Stage, Update Type, Assign Referred By, Outreach, Delete)
- Column visibility toggle (17 columns available)
- Slide-out edit panel (10 fields without leaving the list)
- Search + filter combination
- Contact type distinction (Borrower vs. Realtor)

**What's broken:**
- **CRITICAL:** "Closed Borrowers" smart list returns 0 records — queries `stage IN ('Closed Client')` but canonical stage value is `'Closed'`
- **CSV Import is dead** — file input exists, button is wired, zero processing logic behind it
- **`last_touch` shows raw ISO timestamp** — "2026-03-10T14:23:11.000Z" instead of "3 days ago"
- **500-record hard cap with no pagination** — 2,441 contacts imported; 1,941 are unreachable
- **Slide-out covers only 10 fields** — skips group_tag, mailing address, title, created_date, last_activity_date

**What's confusing:**
- Bloomberg dark theme on contacts page vs. Linear light on loans page — looks like two different products
- DEFAULT_COLUMNS only shows 6 fields (name, type, phone, email, stage, referred_by) — table looks sparse on first load
- Three phone-related columns with no labeling hierarchy: `phone`, `mobile_phone` (Salesforce import), `phone_mobile` (migration 012)
- "Referred By" column shows raw text, not linked to the referrer's contact record
- No visible count on smart list items (how many contacts are in each list?)

---

### 1B. Contact Detail (`contacts/[id]/page.tsx` + `ContactRecordView.tsx`)

**What's working well:**
- Hero section: 56px initials avatar (gold), name, Stage badge, Type badge, Group Tag badge, Call/Text/Email quick actions
- 4-tab structure (Overview, Loans, Activity, Notes) — good information architecture
- ActivityTimeline with up to 200 entries
- Linked loans table showing borrower's active/historical loans ordered by closing_date
- Note adding with dual-write: appends to `contact.notes` AND inserts `activity_log` entry
- Referrer resolution: splits referred_by → queries first/last name → linked contact card
- LoanOSChat widget for AI-assisted context

**What's broken / incomplete:**
- **Stage badge still uses Bloomberg gold palette** — not migrated to light mode like loans page
- **Same field template for Borrower and Realtor** — Realtor-specific fields (top_realtor, target_realtor, realtor_email, realtor_phone, company_name) are buried in the same "Contact Info" card as borrower personal data
- **`phone_mobile` and `mobile_phone` are both in ContactRecordView** — two separate DB columns, no display logic to prefer one over the other
- **No referral network display** — for Realtor contacts, can't see who they've referred
- **Notes tab AND Overview > Notes section** — redundant; notes exist in two places on the same record
- **Birthday field not displayed** — `birthday` and `coborrower_birthday` are in schema, not visible in UI
- **`group_tag` in ContactRecordView but absent from list page** — can't filter by group_tag from the list

---

### 1C. Loans List Page (`loans/page.tsx`)

**What's working well:**
- Clean light mode design (emerald-600, slate palette, Inter font) — the right direction
- Inline status editing via badge click → immediate Supabase update
- Smart list sidebar with 5 pre-built filters
- Column visibility toggle
- StatusBadge with Arive fuzzy `includes()` matching — handles raw Arive status strings correctly
- Shows `contact_email` and `contact_phone` via join on `contacts!contact_id`

**What's broken / missing:**
- **No bulk actions** — can't mass-update status, assign processor, export selection
- **No slide-out edit panel** — must navigate to loan detail to change any field
- **`STATUS_STYLES` uses Bloomberg gold (`#C9A84C`) for Lead status** — residual dark theme artifact
- **DEFAULT_LOAN_COLUMNS = all 9 columns** — table is crowded on first load; no thoughtful default
- **500-record hard cap with no pagination** — 816 loans imported; 316 are unreachable
- **No closing urgency indicator** — no visual signal for loans closing this week
- **No pipeline value aggregate** — header doesn't show total $ in filtered view

**What's confusing:**
- "Started" smart list matches 6+ Arive variant strings ("Started", "Set Up", "App Received", etc.) — it's an Arive data artifact, not a business-meaningful state name
- `status` vs `milestone`: both exist on the loans schema, only Status is shown on list page
- Default sort is not explicitly defined — order is unpredictable on first load

---

### 1D. Loan Detail (`loans/[id]/page.tsx`)

**What's working well:**
- Comprehensive SectionCard layout — 7 cards covering all loan data logically grouped
  - Loan Terms (15 fields) · Property (6) · Borrower (12) · Key Dates (8) · Financials (11) · Parties (12) · Attribution (3)
- Linked Contact card with name → contacts nav, referred_by → referral page link
- Notes textarea with auto-save on blur + visual "Saving… / Saved ✓" indicator
- DocumentsTab: signed URL downloads, file metadata (name, type, date, size)
- AutomationsTab: 4 n8n workflow cards with pre-filled loan context in LoanTriggerModal
- ActivityTab: emerald timeline with metadata preview (max 3 KV pairs per entry)
- LoanOSChat widget for in-context AI assistance

**What's broken / missing:**
- **DocumentsTab has no inline upload** — "Upload Documents" link navigates away to `/dashboard/upload`, breaking context
- **Document signed URLs expire in 2 minutes** — edge case but real friction on slow connections
- **No document category filtering** — all documents in one flat list regardless of type
- **AutomationsTab UX is overloaded** — LoanTriggerModal handles both PDF upload and form-fill workflows in one modal
- **Linked Contact uses `?id=` query param** — list page expects path param `/contacts/[id]`; inconsistent routing
- **No breadcrumb / back navigation** — no path back to filtered list while preserving scroll position
- **Activity log does not capture note auto-saves** — onBlur save writes to DB but no activity_log entry

---

## Section 2 — Gaps & Problems (Prioritized)

### 🔴 Critical — Data Loss / Broken Features

| # | Problem | Root Cause | Impact |
|---|---------|-----------|--------|
| 1 | **Closed Borrowers smart list broken** | Queries `'Closed Client'` but canonical = `'Closed'` | Adam's post-close database is invisible — 0 records returned |
| 2 | **500-record hard cap, no pagination** | Hard-coded `limit(500)` on both list queries | 1,941 contacts + 316 loans are completely unreachable via UI |
| 3 | **CSV import non-functional** | File input wired, no processing handler | Dead feature button; creates false expectation |
| 4 | **`phone_mobile` vs `mobile_phone` schema split** | Salesforce import created `mobile_phone`; migration 012 added `phone_mobile` — two separate TEXT columns | Mobile data split across two columns; neither consistently populated |

---

### 🟠 High — UX Friction / Missing Features

| # | Problem | Impact |
|---|---------|--------|
| 5 | No inline document upload on loan detail | Context switch to /dashboard/upload interrupts loan processing flow |
| 6 | No bulk actions on loans page | Can't mass-update status, assign processor, or export filtered set |
| 7 | Dual theme (Bloomberg dark + Linear light) | Looks like two products; disorienting as user moves between contacts and loans |
| 8 | Same contact template for Borrower and Realtor | Realtor-specific fields buried; missing referral network visibility |
| 9 | No Last Activity column on contacts list | `last_activity_date` exists in schema, not shown — key follow-up signal missing |
| 10 | No closing urgency signal on loans list | Loans closing this week not surfaced without manual scanning |

---

### 🟡 Medium — Missing Context / Quality of Life

| # | Problem | Impact |
|---|---------|--------|
| 11 | No pipeline value aggregate header | Can't see "In Process — 47 loans · $18.2M" at a glance |
| 12 | Linked Contact routing inconsistency | `?id=` query param vs. `/[id]` path param for same contact record |
| 13 | Notes tab redundancy on contact detail | Overview tab has notes section AND a separate Notes tab |
| 14 | No referral network on Realtor contact detail | Can't see who a realtor has referred without manual search |
| 15 | Activity log on loans doesn't log note saves | Auto-save onBlur is silent — no audit trail for note changes |
| 16 | `group_tag` field not on list page | Can't filter/sort by group_tag from contacts list |
| 17 | StatusBadge uses `includes()` fuzzy match | Works now but fragile — could false-match unexpected Arive strings |

---

### 🔵 Low — Polish / Cleanup

| # | Problem |
|---|---------|
| 18 | `STATUS_STYLES` uses Bloomberg gold (`#C9A84C`) for Lead on loans list — mixed theme artifact |
| 19 | `last_touch` shows raw ISO timestamp — needs `fmtRelative` |
| 20 | Document signed URL 2-minute expiry — edge case friction |
| 21 | Stage badge on contact detail is Bloomberg gold — missed in light mode migration |
| 22 | `milestone` field visible on loan detail, absent from loans list |
| 23 | No breadcrumb on loan detail — no back-to-list with preserved scroll |

---

## Section 3 — Detailed UX Recommendations

### 3A. Contacts List Page

**Default view on load:**  
"All Contacts" smart list, sorted `last_touch DESC` (most recently touched first). If `last_touch` is null, fall back to `created_at DESC`. This surfaces who needs follow-up — not an alphabetical dead list.

**Recommended Default Columns (8):**

| # | Column | Notes |
|---|--------|-------|
| 1 | Name | First + Last, linked to detail page |
| 2 | Type | Borrower / Realtor badge |
| 3 | Stage | Inline-editable badge |
| 4 | Phone | Display `phone_mobile ?? mobile_phone ?? phone` — first non-null |
| 5 | Email | `mailto:` linked |
| 6 | Referred By | Text → linked contact on hover/click |
| 7 | Last Activity | `fmtRelative(last_activity_date)` — "3 days ago" |
| 8 | Closing Date | Borrower-relevant; blank for Realtors |

**Smart Lists — Fixes + Additions:**

| List | Status | Change |
|------|--------|--------|
| All Contacts | ✅ Keep | — |
| New Applications | ✅ Keep | — |
| Active Borrowers | ✅ Keep | — |
| In Process | ✅ Keep | — |
| Closed Borrowers | 🔴 Fix | Change filter to `stage = 'Closed'` |
| All Realtors | ✅ Keep | Add contact count badge |
| Top Realtors | ✅ Keep | `top_realtor = true` |
| Target Realtors | ✅ Keep | `target_realtor = true` |
| ➕ Birthday This Month | New | `EXTRACT(MONTH FROM birthday) = EXTRACT(MONTH FROM NOW())` |
| ➕ No Activity 30+ Days | New | `last_activity_date < NOW() - INTERVAL '30 days'` OR `last_activity_date IS NULL` |
| ➕ Closed (All Time) | New | `stage = 'Closed'` (alias — clearer label than "Closed Borrowers") |

**Table UX improvements:**
- Replace 500 hard cap with 100/page pagination (prev/next controls)
- Show total count in header: "2,441 contacts · Page 1 of 25"
- Row hover: show quick-action icons (Call, Email, View) inline
- Bulk action bar: keep existing 5 + add "Export Selected as CSV"
- Fix CSV Import: wire file input → parse CSV → validate required fields → upsert by email with conflict handling

---

### 3B. Borrower Contact Detail

**Hero section:**
- 56px initials avatar, full name (large), Stage badge (light mode — emerald/slate), Type badge
- Quick actions: Call (mobile), Text, Email, Edit
- Key stats bar (below name): `[Loan Count] loans · [$X total] · Closing [next date] · Last touch [relative]`

**Overview Tab — Two separate cards:**

*Card 1 — Personal Info (Borrower):*
- Name, Email, Phone (prefer `phone_mobile ?? mobile_phone ?? phone`)
- Birthday (formatted as month/day, age if desired)
- Mailing Address (street, city, state, zip)
- Co-Borrower: Name, Email, Phone, Birthday

*Card 2 — Relationship:*
- Referred By (linked to referrer's contact record)
- Lead Source, Stage, Group Tag
- Closing Date (next active loan)
- ➕ **Referred Contacts** — inline table of contacts where `referred_by ILIKE this_contact_name`, showing: Name, Stage, Last Touch

**Loans Tab:**
- Table: Loan # · Status badge · Loan Amount · Property Address · Closing Date · Stage
- Active loans first; Closed below fold with collapse toggle
- "Open" button → `/dashboard/loans/[id]`

**Activity Tab:**
- Keep existing ActivityTimeline
- Raise limit from 200 → 500 entries
- Add action type filter chips (All · Note · Call · Email · Status Change · Loan Event)

**Notes Tab:**
- Remove redundant notes section from Overview tab
- Keep dedicated Notes tab only
- Each note shows: content + timestamp + author (user)
- Refactor from appended text string → individual activity_log entries with `action = 'note.added'`

---

### 3C. Realtor Contact Detail

Different template from Borrower. Rendered conditionally based on `contact_type = 'Realtor'`.

**Hero:**
- Same structure as Borrower but add `company_name` below name
- Replace loan stats bar with: `[N] Referrals · [$X] Active Pipeline · [$X] Closed (All Time from referrals)`

**Overview Tab — Two separate cards:**

*Card 1 — Realtor Info:*
- Name, Email (`realtor_email`), Phone (`realtor_phone`)
- Company Name, Title, BRE/License #
- Top Realtor toggle (bool), Target Realtor toggle (bool)

*Card 2 — Relationship & Referral Network:*
- Referred By, Lead Source, Group Tag
- ➕ **Referral Network table** — all contacts where `referred_by ILIKE realtor_name`, showing:
  - Borrower Name · Stage · Loan Status · Loan Amount · Closing Date · Last Touch
- Aggregate footer: Total Referrals · Active Pipeline $ · Closed Loans

**Loans Tab:**
- Show all loans where `referring_agent ILIKE realtor_name`
- Aggregate header: Total Referrals | Active $ | YTD Closed $
- Same columns as borrower Loans tab

---

### 3D. Loans List Page

**Default view on load:**  
"All Loans" smart list, sorted `closing_date ASC` (soonest closing first — urgency-forward). Null dates sort to bottom.

**Recommended Default Columns (8, trimmed from 9):**

| # | Column | Notes |
|---|--------|-------|
| 1 | Loan Name | Borrower name |
| 2 | Status | Inline-editable badge (light mode colors throughout) |
| 3 | Loan Amount | Formatted `$XXX,XXX` |
| 4 | Property Address | City, State abbreviated |
| 5 | Closing Date | Formatted; **bold red** if ≤ 7 days |
| 6 | Loan Program | FHA / Conv / VA / USDA / Jumbo |
| 7 | Referring Agent | Text → linked Realtor contact record |
| 8 | Processor | From `processor_name` in parties |

**Smart Lists — Fixes + Additions:**

| List | Status | Change |
|------|--------|--------|
| All Loans | ✅ Keep | Show total pipeline $ in header |
| In Process | ✅ Keep | Show count + total $ |
| Closed | ✅ Keep | — |
| Started | ⚠️ Rename | → "New Leads" (less Arive-specific) |
| Cancelled | ✅ Keep | — |
| ➕ Closing This Week | New | `closing_date BETWEEN NOW() AND NOW() + INTERVAL '7 days'` |
| ➕ Closing This Month | New | `closing_date BETWEEN NOW() AND NOW() + INTERVAL '30 days'` |
| ➕ Rate Lock Expiring | New | `rate_lock_expiration BETWEEN NOW() AND NOW() + INTERVAL '7 days'` |
| ➕ Missing Processor | New | `processor_name IS NULL AND status NOT IN ('Closed','Funded','Dead','Cancelled')` |

**Pipeline Value Banner:**
- Below page header, above table: `"In Process — 47 loans · $18.2M pipeline"`
- Updates dynamically with active smart list / filter

**Bulk Actions (add, matching contacts page pattern):**
- Update Status
- Assign Processor
- Export Selected CSV
- Add Tag / Campaign

---

### 3E. Loan Detail Page

**Navigation:**
- Add breadcrumb: `Loans > [Borrower Name] > Loan #XXXX`
- Back button preserves scroll position on loans list

**Layout adjustment:**
- Move "Linked Contact" card to top of the right column (currently it sits below all 7 SectionCards — needs to be immediately visible)
- Collapse empty SectionCards by default — expand on click
- Show SectionCard completion indicator (e.g., "5/12 fields filled" for Financials card)

**DocumentsTab upgrade:**
- Add inline drag-drop file upload directly in tab (Supabase storage multipart, no redirect to /dashboard/upload)
- Category filter tabs: All · Application · Appraisal · Title · Insurance · Closing · Other
- Extend signed URL expiry: 2 min → 10 min
- Add "Upload" button in empty state (not just a link)

**AutomationsTab improvements:**
- Add "Last Triggered" timestamp per workflow card (store in activity_log on trigger)
- Add confirmation dialog with pre-send checklist before firing n8n webhook
- Consider splitting "New Application (1003)" into its own distinct card if workflow expands

**Activity log:**
- Wire auto-save notes to `activity_log` entry (`action = 'note.updated'`, `metadata.preview = first_100_chars`)
- Add "Related Activity" collapse section pulling last 5 entries from linked contact's activity_log

**Milestone field:**
- Surface Milestone as inline-editable badge on the loan detail header (alongside Status)
- Add Milestone as an optional column on the loans list page

---

## Section 4 — Answers to Specific Questions

**Q1 — What should the default view be on load for contacts?**  
"All Contacts," sorted `last_touch DESC`. Don't default to alphabetical — it destroys the urgency signal that drives follow-up. The people at the top should be the ones you just touched or need to touch. If `last_touch` is null, fall back to `created_at DESC`.

---

**Q2 — Should phone and email be visible in the table without clicking into the record?**  
Yes. Non-negotiable. The list is a dialer and outreach tool. With 2,441 contacts, opening every record to get a phone number kills efficiency. Phone (mobile preferred, using null-coalesce chain) and email should be in default columns. Add hover quick-action icons (Call, Text, Email) that appear on row hover — one click to initiate contact without opening the record at all.

---

**Q3 — Should Last Activity exist as a column on contacts list?**  
Yes. It's the single most valuable signal in the list — more important than phone number. `last_activity_date` is already in the schema (migration 012). Display as `fmtRelative`: "3 days ago," "2 weeks ago," "Never." Sort default descending. This alone turns the contacts list from a static database into a follow-up queue.

---

**Q4 — Kanban vs. tabular bulk-update?**  
Keep tabular. Kanban is a trap at 2,441 contacts — columns overflow, drag-drop breaks, and it creates no efficiency over a table with inline editing. The right answer is tabular list + inline badge editing + bulk action bar. If you want pipeline visualization, the sidebar smart list counts (e.g., "In Process: 47") give you the stage distribution without a Kanban board. Kanban makes sense only for loans (pipeline stages with < 50 active files) and even then it's optional, not primary.

---

**Q5 — Should loan info be inline on contact detail, or in a tab?**  
Tab. The contact detail is a relationship view. Loan data belongs in the Loans tab — a clean table showing loan #, status, amount, closing date, and a "View" link. Don't bloat the Overview tab with loan financials. The separation keeps the contact record focused on the person, not the transaction.

---

**Q6 — How deep should the activity log be on contact detail?**  
500 entries is the right ceiling (up from current 200). More importantly, add action type filtering — note, call, email, status change, loan event — so deep histories are navigable rather than just scrollable. Keep infinite scroll or "Load More" rather than a hard page break. For most contacts, 200 is fine. For power users (high-volume realtors, repeat borrowers), 500 is the right upper bound.

---

**Q7 — Should Borrower and Realtor have different detail page templates?**  
Yes, 100%. The current single template creates noise on both sides. Borrower detail needs: personal info, co-borrower, financial snapshot, loan history, activity. Realtor detail needs: company/license info, top_realtor/target_realtor toggles, referral network table, pipeline aggregate, co-marketing fields. The `contact_type` field is already in the schema — use it to conditionally render the appropriate card set in ContactRecordView. This is a medium-complexity build (3–4 hours) with high impact.

---

**Q8 — How many smart lists on loans? Which should be defaults?**  
8 smart lists (up from 5). Recommended active defaults: All Loans, Closing This Week, Closing This Month, In Process, Rate Lock Expiring, Closed, New Leads, Missing Processor. Show loan count AND pipeline $ next to each smart list name. "Closing This Week" should be bold/highlighted — it's the urgency queue.

---

**Q9 — Loans detail — should the borrower card be inline or linked contact?**  
Linked — compact card only. Show: name, phone, email, Stage badge, "View Contact →" button. Don't duplicate the full contact record inline on the loan detail. The loan detail is for loan data; the contact detail is for relationship data. The compact card gives the link without blurring the boundary. Current implementation is correct in spirit — just needs the routing fix (use `/contacts/[id]` path, not `?id=` query param).

---

**Q10 — What should the scope of the activity log be on loan detail?**  
Loan-specific entries only as the primary log. But add a collapsed "Related Contact Activity" section that pulls the last 5 entries from the linked contact's `activity_log` with a "View Full Contact History →" link. This gives context without merging the two logs. Keep the two scopes clearly separated — loan events and relationship events are different categories of information.

---

## Section 5 — Priority Implementation Plan

### Sprint 1 — Quick Wins (This Week)
No schema changes. All isolated file edits. Do these first — they're fast and some are actively wrong.

| # | Fix | File(s) | Est. Time |
|---|-----|---------|----------|
| 1 | Fix "Closed Borrowers" smart list: `'Closed Client'` → `'Closed'` | contacts/page.tsx | 5 min |
| 2 | Format `last_touch` with `fmtRelative` | contacts/page.tsx | 10 min |
| 3 | Fix Lead status color in `STATUS_STYLES`: Bloomberg gold → slate | loans/page.tsx | 10 min |
| 4 | Add `last_activity_date` as default column on contacts list | contacts/page.tsx | 30 min |
| 5 | Fix stage badge on contact detail: Bloomberg gold → light mode | ContactRecordView.tsx | 20 min |
| 6 | Phone column null-coalesce: `phone_mobile ?? mobile_phone ?? phone` | contacts/page.tsx + ContactRecordView.tsx | 45 min |
| 7 | Collapse empty SectionCards by default on loan detail | loans/[id]/page.tsx | 30 min |
| 8 | Add "Closing This Week" and "Rate Lock Expiring" smart lists | loans/page.tsx | 30 min |
| 9 | Add pipeline $ aggregate banner to loans list header | loans/page.tsx | 45 min |
| 10 | Add breadcrumb to loan detail page | loans/[id]/page.tsx | 20 min |
| 11 | Fix Linked Contact routing: `?id=` → `/contacts/[id]` | loans/[id]/page.tsx | 15 min |

**Sprint 1 total: ~4 hours. Zero schema migrations. All safe.**

---

### Sprint 2 — UX Foundations (Next Week)

| # | Feature | File(s) | Est. Time |
|---|---------|---------|----------|
| 12 | Pagination (replace 500 hard cap with 100/page + controls) | contacts/page.tsx + loans/page.tsx | 3–4 hours |
| 13 | Borrower vs. Realtor contact templates (conditional card rendering) | ContactRecordView.tsx | 3–4 hours |
| 14 | Inline document upload on loan detail (Supabase storage, no redirect) | loans/[id]/page.tsx | 3–4 hours |
| 15 | Bulk actions on loans page (Update Status, Assign Processor, Export CSV) | loans/page.tsx | 3–4 hours |
| 16 | Referral network card on Realtor contact detail | ContactRecordView.tsx | 2–3 hours |
| 17 | Smart list counts + pipeline $ in sidebar | contacts/page.tsx + loans/page.tsx | 2–3 hours |

**Sprint 2 total: ~16–22 hours. No schema migrations. Pure UI/logic changes.**

---

### Sprint 3 — Data Integrity (Following Week)

| # | Feature | Notes | Est. Time |
|---|---------|-------|----------|
| 18 | Schema migration: merge `phone_mobile` + `mobile_phone` into single column | Supabase migration + data backfill (COALESCE both columns → `phone_mobile`, drop `mobile_phone`) | 2 hours |
| 19 | Fix CSV import (parse → validate → upsert by email) | Wire existing file input; add Papa Parse or native CSV parsing; conflict = update | 4–6 hours |
| 20 | Refactor notes to individual activity_log entries (timestamps per note) | Schema: notes become `action = 'note.added'` entries; display: timeline view | 4–6 hours |
| 21 | Log auto-save note updates to activity_log | Wire onBlur save → `activity_log` insert | 1 hour |

---

### Sprint 4 — Scale Features (After Core Is Solid)

| # | Feature | Notes | Est. Time |
|---|---------|-------|----------|
| 22 | Full theme unification | Contacts page Bloomberg → Linear light; single Tailwind config | 6–8 hours |
| 23 | Birthday smart list + birthday email n8n trigger | Smart list + trigger card in contacts/page.tsx automations | 3–4 hours |
| 24 | "No Activity 30+ Days" list with action prompt | Smart list + inline action prompt ("Send check-in?") | 2–3 hours |
| 25 | Loan Milestone column + inline editing on list page | Add column option; badge click → dropdown update | 2 hours |
| 26 | Document category filter tabs on loan detail | Category enum + filter UI | 2–3 hours |

---

## Summary Table — Build Order

| Sprint | Focus | Hours | Risk |
|--------|-------|-------|------|
| 1 — Quick Wins | Bug fixes, formatting, routing | ~4 hrs | Zero — no schema changes |
| 2 — UX Foundations | Pagination, templates, bulk actions, docs | ~18 hrs | Low — UI/logic only |
| 3 — Data Integrity | Schema cleanup, CSV import, notes refactor | ~13 hrs | Medium — migrations + data backfill |
| 4 — Scale Features | Theme unification, automations, polish | ~17 hrs | Low |

**Total estimated: ~52 hours to full implementation.**

Start Sprint 1 today. Items 1–3 are 5–10 minutes each and fix actively broken / visually wrong things.
