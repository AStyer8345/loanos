# LoanOS UX Audit — March 16, 2026

> Methodology: Full codebase review of all five sections (TopNav, Dashboard, Loans, Contacts, Scenarios, Reports/Performance, Briefing, Emails). Screenshots were blocked by auth in local dev; findings are code-based. Every claim maps to a specific file and line.

---

## Executive Summary

LoanOS has grown into a capable system but it's starting to accumulate complexity debt. The core pipeline tools — Loans and Contacts — are genuinely powerful, but the nav has 8 top-level items when it needs 5. The biggest structural problem: **two separate "performance" views exist simultaneously** — one on the Dashboard (real Supabase data) and one under Reports (localStorage with hardcoded seed data). They show different numbers. One of them needs to die. Secondary problems: Dashboard and Briefing are distinct nav items that belong together; "Emails" in the nav actually means "unmatched email review queue" which is not what that label implies; and the Scenarios page uses an entirely different design system than the rest of the app. The bones are solid. The overhead is fixable.

---

## Section-by-Section Findings

---

### 1. Dashboard (`/dashboard`)

**Primary job:** Surface the state of the pipeline and flag what needs attention today.

**What's working:**
- The 4 KPI cards (Pipeline Loans, Gross Commission, Commission YTD, This Month) are well-prioritized and link directly to filtered loan views — this is the right pattern.
- Urgent Flags (pre-approval expiring, past est. closing date) are prominent and amber-coded. Correct.
- Stale Loans ("3+ days no activity") is a genuinely useful signal.
- The Pipeline tab / Performance tab split is clean and keeps the page from being overwhelming.

**What's broken:**

A. **"Today's Focus" is hardcoded noise.** The widget at `DashboardClient.tsx:48-56` maps day-of-week integers to static strings ("Realtor Outreach", "Content Creation", etc.). This is not real data. It will say "Realtor Outreach" every Monday regardless of whether you have 3 closings or 0 pipeline loans. It takes up ~1/4 of the mid-page row and surfaces no actionable information. Users will stop reading it within a week.

B. **The Performance tab duplicates the Reports page.** Dashboard has a full Performance tab with volume charts, commission trend, active pipeline by stage, and monthly breakdown table. The `/dashboard/performance` page has all of this AND more (P&L, comp rate, expenses). Both exist. Neither is obviously the "real" one. The Dashboard Performance tab pulls from Supabase. The Reports page pulls from `localStorage`. This is a data integrity problem, not just a UX problem.

C. **"Briefing" is a separate nav item** even though it's the same class of content as the Dashboard — a morning orientation screen. A user landing on Dashboard for the first time has no reason to know Briefing exists or why it's separate.

D. **Activity feed (right column) is underlinked.** Activity entries show a summary string but don't link to the associated loan or contact. Clicking an activity item does nothing.

**#1 fix:** Remove "Today's Focus" widget entirely. Reclaim that space for the Stale Loans list (expand it to full width). Move Briefing into the Dashboard as a tab alongside Pipeline and Performance, eliminating it as a standalone nav item.

---

### 2. Loans (`/dashboard/loans`)

**Primary job:** View and manage the active pipeline. Change statuses. Find loans fast.

**What's working:**
- Smart Lists (In Process, Pre-Approval, Closed) are the right abstraction for a mortgage pipeline. Most users will live in "Loans in Process" 90% of the time.
- Inline status editing is fast and correct.
- Closing urgency color-coding (red ≤7 days, amber ≤14 days) is a legitimate signal directly visible in the table — this is well done.
- The pipeline stage progress bar (visible in the "Loans in Process" view) gives a visual summary of where loans sit.

**What's broken:**

A. **The page is 1,324 lines of a single client component.** It handles: data fetching, pagination, smart lists, custom filter builder, column toggle/reorder (localStorage-persisted), bulk actions, inline editing, delete confirmation, and URL-driven state sync. This is not a UX problem per se, but it creates a maintenance surface where adding one feature means touching everything.

B. **Column toggle + custom filter builder are power features that obscure the primary job.** A solo LO doesn't need to build rules-based custom filters. The filter builder (`CustomListRule`, `FILTER_OPERATORS`) adds 5+ UI elements to the page header area. The column toggle adds another dropdown. These are features that would matter to a team of 10 loan officers, not one.

C. **"Other" in the smart list sidebar** (Cancelled, Denied, Withdrawn, Suspended, On Hold, Dead) uses the label "Other" — this is ambiguous. It should be labeled "Inactive" or "Dead Leads."

D. **The Loans page and Contacts page both have a custom filter builder** using identical rule/operator structures. This is duplicated code with duplicated UI at `contacts/page.tsx:208-243` and `loans/page.tsx:133-165`.

**#1 fix:** Remove the custom filter builder from both Loans and Contacts. The Smart Lists already cover every meaningful segment. Replace the column toggle with a fixed sensible default. These two removals alone cut ~30% of the UI complexity on each page.

---

### 3. Contacts (`/dashboard/contacts`)

**Primary job:** Manage the CRM — find borrowers and realtors, track last touch, update stage.

**What's working:**
- The Smart List sidebar with sections (Borrowers / Realtors / Other) is clean and correctly segments the two main contact types.
- Last Touch color coding (green ≤3 days, yellow ≤7 days, red >7 days) is immediately readable and creates urgency without explanation.
- The page is the visual reference for the design system — dark table, monochromatic, gold accent on names — this is the standard everything else should match.
- Drag-to-reorder columns is a nice power feature that doesn't clutter the default view.

**What's broken:**

A. **1,972 lines in a single client component.** Largest file in the app. Same critique as Loans — too much responsibility in one place.

B. **"Hot List / Pre-Approved" as the default smart list** is correct positioning but the label is confusing. "Hot List" and "Pre-Approved" are two different things in mortgage — one is a sales priority, one is a loan status. The label should pick one or clarify: "Pre-Approved (Active)."

C. **Bulk actions surface only on multi-select**, which means users don't know they exist until they accidentally select two rows. The bulk action capability (update stage, type, referred_by) is useful but invisible.

D. **The custom filter builder exists here too** (same critique as Loans).

E. **17 column definitions** are available (`ALL_COLUMNS` in the code). Default shows 7. Having 17 possible columns for a solo operator is over-engineered — a team product feature in a solo tool.

**#1 fix:** Remove the custom filter builder. Audit the 17 columns to the 8–9 that actually matter for daily use. The default 7 (`name, type, phone, email, stage, referred_by, last_touch`) is already correct — the issue is the noise of having 10 more columns available that no one needs.

---

### 4. Scenarios (`/dashboard/scenarios`)

**Primary job:** Create and share mortgage rate scenarios (purchase/refi) with borrowers.

**What's working:**
- The list page is clean and simple. Name, type badge, property, date, view count, 3 actions. That's exactly right.
- "+ New Scenario" CTA is prominent and immediately actionable.
- View count per scenario is a useful signal (did the borrower actually open this?).

**What's broken:**

A. **Design system mismatch.** The Scenarios page uses CSS custom properties (`--sc-bg`, `--sc-gold`, `--sc-card`, `--sc-muted`, etc.) while every other page uses Tailwind utility classes with hardcoded zinc/slate colors. The result: Scenarios looks noticeably different from Loans and Contacts — lighter background, different border treatment, slightly different typography feel. A new user would wonder if they accidentally left the app.

B. **No "last opened by borrower" date.** View count is good, but "last viewed" is more useful — "borrower viewed 2 days ago" tells you whether to follow up. View count alone doesn't.

C. **No link from a Scenario back to the associated Contact or Loan.** If you're looking at a scenario for "Johnson," there's no one-click path to Johnson's contact record.

**#1 fix:** Migrate Scenarios styling from CSS variables to the same Tailwind/zinc design system used by Loans and Contacts. This is the only section that breaks visual consistency.

---

### 5. Reports (`/dashboard/performance`)

**Primary job:** (Intended) Track annual loan production and P&L.

**What's working:**
- The Income & Expenses tab with editable monthly fields is genuinely useful for a self-employed LO who needs to track net P&L against business expenses.
- The Trust Account tracker (starting balance + net P&L) is a niche but legitimate feature for a broker tracking their own trust account.
- The monthly breakdown table (Gross, Comp, P&L, Other Income, Expenses, Net P&L) is the most complete financial view in the app.

**What's broken — this section has a critical data integrity problem:**

A. **All data is stored in `localStorage` with hardcoded seed loans.** `performance/page.tsx:87-104` loads from `localStorage` and falls back to `SEED_LOANS` — real Voelkel, Aguilar, Stackhouse, Stevenson, Patel, etc. with hardcoded amounts. This data is **not** sourced from the `loans` table in Supabase. The Dashboard's Performance tab shows different numbers pulled from real Supabase data. **Two different performance dashboards showing two different numbers. Neither is labeled as the authoritative one.**

B. **"Reset Data" button** is a nuclear option in the header with no protection beyond a `window.confirm`. Clicking it wipes everything back to seed data. This is one accidental click away from losing all manually entered loan records.

C. **The Reports page duplicates functionality already on the Dashboard** (Volume by Month, Commission Trend, Active Pipeline by Stage, Monthly Breakdown Table). The Dashboard version is better — it reads from Supabase. The Reports version is worse — it reads from localStorage.

D. **The nav item is labeled "Reports" but routes to `/dashboard/performance`.** The URL and label don't match, which creates confusion when sharing links or debugging.

**#1 fix:** Decide which performance view is authoritative and eliminate the other. The right answer: **delete the `localStorage`-based Reports page** and migrate the Income & Expenses / Trust Account features into the Dashboard's Performance tab, backed by Supabase. The Reports nav item goes away entirely.

---

## Navigation Findings

**Current nav structure (8 items):**

```
LoanOS | Dashboard | Briefing | Loans | Contacts | Emails | Scenarios | Reports | Marketing ▾ | [⌘K] [🔔] [⚙] [AS] [sign out]
```

**Problems:**

1. **Dashboard + Briefing = two items for one mental model.** Both are "start-of-day orientation" tools. Users shouldn't have to decide which one to open. They serve the same purpose and should be one page with tabs.

2. **8 flat nav items is too many** for a single-user tool. Benchmark: Notion's sidebar, Linear's nav — both keep the primary items to 5–6 max, with everything else nested or in settings.

3. **"Emails" is mislabeled.** The Emails nav item routes to `/dashboard/emails/unmatched` — a review queue for inbound emails that couldn't be auto-matched to a contact. This is not an inbox. A user clicking "Emails" expecting to see sent/received emails will be confused. Rename to "Inbox Review" or merge with the Activity feed.

4. **Marketing is a dropdown while everything else is flat.** This creates visual inconsistency in the nav. The Marketing dropdown has 5 sub-items (Content Dashboard, Newsletter Generator, Social Media Posts, Rate Updates, Automations). These are weekly-or-less features, not daily tools. They belong in Settings or a separate secondary nav, not the primary top bar.

5. **Reports is a top-level nav item** for a page that shows duplicated, localStorage-backed data. It shouldn't be a top-level item even if the data problem is fixed — financial P&L is a weekly check, not a daily tool.

6. **The ⌘K search hint occupies nav real estate** as a button that dispatches a keyboard event. Clean, but takes up horizontal space that could go to breathing room between nav items.

**Recommended nav (5 items):**

```
LoanOS | Pipeline | Contacts | Scenarios | Marketing ▾ | [⌘K] [🔔] [⚙] [AS]
```

- `Pipeline` — consolidates Dashboard + Briefing + Loans into one section with tabs (Briefing | Pipeline | Performance)
- `Contacts` — unchanged
- `Scenarios` — unchanged
- `Marketing` — dropdown, unchanged (weekly tools)
- Emails → merge into Activity feed or remove until the email sync workflow is complete
- Reports → eliminated (merge into Pipeline > Performance tab)
- Briefing → moved into Pipeline as the default tab

**2-click test (critical actions):**
| Action | Current clicks | Proposed clicks |
|---|---|---|
| View active pipeline | 1 (Dashboard) | 1 (Pipeline) |
| Open a contact | 2 (Contacts → click) | 2 ✓ |
| Run a scenario | 2 (Scenarios → New) | 2 ✓ |
| Check morning briefing | 1 (Briefing → run) | 1 (Pipeline, default tab) |
| See commission YTD | 2 (Dashboard → Performance tab) | 2 ✓ |

---

## Information Hierarchy Review

| Page | What's above the fold | Should be above fold | Score |
|---|---|---|---|
| **Dashboard** | KPI cards + stage breakdown | ✓ Urgent Flags should be HIGHER — it's below the fold if there are many KPI cards | 7/10 |
| **Loans** | Smart list sidebar + loan table | ✓ But column toggle + filter builder add header clutter | 7/10 |
| **Contacts** | Smart list + table | ✓ Same header clutter as Loans | 7/10 |
| **Scenarios** | Scenario count + "+ New" + search | ✓ Clean. Nothing to promote or demote. | 9/10 |
| **Reports** | Header + tab selector + 8 KPI cards | KPI cards are correct; "Reset Data" button in header is dangerous prominence | 5/10 |
| **Briefing** | Empty state with "Run Briefing" button | The page requires a manual API call to populate. Should auto-load on visit. | 4/10 |

**Biggest above-the-fold miss:** The Briefing page is blank until you click a button. A daily orientation tool that requires a manual trigger to show data will eventually stop being used. It should auto-fetch on mount (or at minimum on mount if data is stale >4 hours).

---

## Priority Fix List

Ranked by impact-to-effort ratio. Low = <2 hours. Med = 2–8 hours. High = 1–2 days.

| # | Problem | Recommended Fix | Complexity |
|---|---|---|---|
| 1 | **Reports page uses localStorage / seed data — completely disconnected from Supabase** | Delete `/dashboard/performance`. Migrate Income & Expenses + Trust Account into Dashboard Performance tab, backed by a new `income_expenses` Supabase table. Remove "Reports" from nav. | High |
| 2 | **Dashboard and Briefing are separate nav items** | Move Briefing into Dashboard as the first tab ("Briefing \| Pipeline \| Performance"). Remove "Briefing" from nav. | Med |
| 3 | **"Today's Focus" hardcoded marketing schedule** | Remove the widget entirely. Expand "Stale Loans" to full width. | Low |
| 4 | **Custom filter builder on both Loans AND Contacts** | Remove both. The smart lists cover every meaningful segment. This removes ~150 lines of UI per page and eliminates a duplicate UX pattern. | Med |
| 5 | **Briefing requires manual trigger** | Auto-fetch on mount if `data === null && !loading`. Add a lightweight "last generated X hours ago" timestamp so the auto-fetch doesn't happen on every page load. | Low |
| 6 | **"Emails" nav label is wrong** | Rename to "Inbox Review" OR remove from primary nav until email sync is complete. Route the existing unmatched-email UI to a sub-page under Contacts. | Low |
| 7 | **Scenarios design system mismatch** | Replace all `--sc-*` CSS variables with the zinc/Tailwind tokens used by Loans and Contacts. No behavior changes — visual only. | Med |
| 8 | **Marketing in the nav should be secondary** | Move Marketing dropdown to a secondary position (rightmost before settings) or into Settings. It's a weekly tool in a daily-use nav. | Low |
| 9 | **Activity feed items are not clickable** | Each activity entry has a `loan_id` and `contact_id` in the data. Wrap entries in a `<Link>` to the associated loan or contact. 5-line change. | Low |
| 10 | **"Reset Data" button in Reports header** | Until Reports is rebuilt, add a confirmation phrase ("type RESET to confirm") rather than `window.confirm`. This is a data-destructive action with no undo. | Low |

---

## What NOT to Build Next

Based on this audit, the following planned or implied features would add complexity without daily value. **Do not build these until the simplification items above are complete.**

**1. More column options in Contacts or Loans.**
You already have 17 column options in Contacts and 9 in Loans. The column picker is a power feature for a team product. A solo operator doesn't need more columns — they need the 7 right columns shown by default with no picker at all.

**2. A full email inbox inside LoanOS.**
The "Emails" nav item points to a review queue for unmatched inbound emails. Building this out into a full inbox would duplicate Outlook and add a communication channel that doesn't connect to where you actually communicate. The current scope (link inbound emails to contacts) is the right scope — don't expand it.

**3. More marketing automation tabs.**
The Marketing dropdown already has 5 sub-items (Content Dashboard, Newsletter Generator, Social Media, Rate Updates, Automations). Adding more here increases a dropdown that's already at the edge of usability. Any new marketing feature should replace an existing one, not add to the list.

**4. A "Tasks" or "To-Do" feature.**
The Briefing page already generates a prioritized 7-item action list. The Dashboard already shows Stale Loans and Urgent Flags. Adding a manual task system on top of this would create three overlapping places to track work, none of which would be trusted.

**5. Board/Kanban view for Loans.**
The pipeline stage bar on the Loans page and the stage breakdown on the Dashboard already give visual pipeline progression. A full Kanban board would add significant rendering complexity for a view that's less useful than a sortable table when you're managing 20–40 loans solo.

---

*Audit completed: March 16, 2026. All findings based on source code review of `/Users/adamstyer/Documents/loanos-clone/src/`.*
