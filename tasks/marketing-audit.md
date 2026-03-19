# Marketing Tab — Audit Report
Generated: 2026-03-18

---

## Route Structure

| Route | File | Current Label in Nav | What It Is |
|-------|------|---------------------|------------|
| `/dashboard/marketing` | `page.tsx` | "Marketing Hub" | Giant 8-tab page — the actual marketing command center |
| `/dashboard/marketing/rate-updates` | `rate-updates/page.tsx` | "Rate Updates" | Standalone rate update logger with Supabase persistence |
| `/dashboard/marketing/content` | `content/page.tsx` | "Content Dashboard" | Newsletter generator + log (standalone duplicate of NEWSLETTERS tab) |
| `/dashboard/marketing/social` | `social/page.tsx` | "Social Media Posts" | Standalone social post logger (duplicate of SOCIAL tab) |

---

## Nav Dropdown Order (current)
1. Content Dashboard → `/marketing/content`
2. Social Media Posts → `/marketing/social`
3. Rate Updates → `/marketing/rate-updates`
4. Marketing Hub → `/marketing`

Rate Update is **position #3** in nav. Content Dashboard is **position #1** despite being the least-used tool.

---

## Marketing Hub (`/dashboard/marketing/page.tsx`)

The main hub is a full-featured 8-tab page with state stored in `mcc_state` Supabase table (key: `mcc`).

### Tabs (current order)

| Tab Label | What It Does | Backend | Usage Frequency |
|-----------|-------------|---------|-----------------|
| TODAY | Daily task checklist, brain dump sidebar | `mcc_state`, `marketing_activity_log` table | Daily |
| WEEK | Week-at-a-glance view of all 5 daily task lists | `mcc_state` (read-only) | Daily |
| CONTACTS | Call list manager — Realtors, Pre-Approvals, Active Files, Hot Leads. CSV import, mark-called | `mcc_state` | Multiple times/week |
| SOCIAL | Social post log + Testimonials Automation trigger (n8n workflow `eJG4wckrj6SmSpm1`) | `mcc_state`, n8n API | 2–3x/week |
| NEWSLETTERS | Newsletter generator (AI → Mailchimp → website) + log | `mcc_state`, `/api/marketing/generate-newsletter`, `/api/marketing/send-mailchimp`, `/api/marketing/publish-newsletter` | Weekly |
| TRACKER | Cadence tracker — 9 items showing days since last completion with health color | `mcc_state` (reads `last` map) | Daily check |
| LOG | Activity log — calendar + list view, manual entry | `mcc_state` | Daily |
| BRAIN DUMP | Todo list — active + completed | `mcc_state` | Daily |

### TRACKERS defined (from code)
- Realtor Newsletter (every 7d)
- Borrower Newsletter (every 7d)
- **Rate Update (every 7d)** ← most critical business activity
- Social Post (every 2d)
- Realtor Calls (every 7d)
- Past Client Calls (every 7d)
- Pre-Approval Calls (every 7d)
- In-Process Calls (every 7d)
- Short Video (every 14d)

---

## Standalone Sub-Pages

### `/marketing/rate-updates` (rate-updates/page.tsx)
- **Current label**: "Rate Updates"
- **What it does**: Logs rate communications (30yr, 15yr, ARM, audience, channel, notes). Persists to `localStorage` + updates `mcc_state.last['rate-update']` in Supabase. Shows 4 stat tiles (Last Sent, Days Ago, Total Logged, This Month). Has cadence health banner.
- **Backend**: localStorage (rate log array) + Supabase `mcc_state` for last-sent timestamp
- **Backend connection**: Does NOT trigger any n8n workflow. Pure logging.
- **Position in nav**: #3 (should be #1)
- **Problem**: Buried. Disconnected from rate update n8n workflow.

### `/marketing/content` (content/page.tsx)
- **Current label**: "Content Dashboard"
- **What it does**: Exact duplicate of the NEWSLETTERS tab inside the Marketing Hub. AI newsletter generator + Mailchimp send + website publish + log.
- **Backend**: Supabase `mcc_state`, `/api/marketing/generate-newsletter`, `/api/marketing/send-mailchimp`, `/api/marketing/publish-newsletter`
- **Verdict**: REDUNDANT. The Marketing Hub NEWSLETTERS tab does everything this page does. "Content Dashboard" is a misleading name — it sounds like it shows all content analytics, but it's just a newsletter generator. Should be folded into the Hub or removed.

### `/marketing/social` (social/page.tsx)
- **Current label**: "Social Media Posts"
- **What it does**: Social post logger. Duplicate of the SOCIAL tab in the Hub but without the Testimonials Automation button.
- **Verdict**: REDUNDANT. Missing the testimonials automation feature that the Hub version has.

---

## API Routes

| Route | Backend | Purpose |
|-------|---------|---------|
| `/api/marketing/generate-newsletter` | Anthropic Claude (`claude-sonnet-4-5`) | AI newsletter generation |
| `/api/marketing/send-mailchimp` | Mailchimp API | Create + send Mailchimp campaign |
| `/api/marketing/publish-newsletter` | `dispatch_webhook_url` (styermortgage.com Netlify dispatch) | Publish newsletter page to website |
| `/api/marketing/log-social-post` | Supabase (service role) | Webhook from n8n to log auto-posted social content |
| `/api/marketing/run-testimonials` | n8n API (`eJG4wckrj6SmSpm1`) | Trigger weekly social post workflow |

---

## Backend Connection Status

| Feature | Connected | Details |
|---------|-----------|---------|
| Newsletter Generator | Requires Anthropic key in `user_settings.integrations` | Configurable in Settings |
| Mailchimp Send | Requires Mailchimp API key + list IDs in `user_settings.integrations` | Configurable in Settings |
| Website Publish | Requires `dispatch_webhook_url` in `user_settings.website` | `/.netlify/functions/dispatch` on styermortgage.com |
| Rate Update Tracking | Live — `mcc_state` Supabase write on log | No n8n workflow |
| Testimonials Automation | n8n `eJG4wckrj6SmSpm1` (inactive, needs N8N_API_KEY env var) | Fixed but inactive |
| Outlook Email Sync | n8n `JMmstRl2C5ylmuIY` | Deployed inactive, needs Outlook credential |
| Mailchimp n8n | No dedicated workflow | Send happens via direct API call |

---

## Problems Found

1. **"Content Dashboard"** — misleading name, redundant page (exact duplicate of NEWSLETTERS tab in Hub minus a few settings)
2. **Rate Update at position #3** — the most business-critical weekly action is buried
3. **Sub-pages are orphaned duplicates** — `content/page.tsx` and `social/page.tsx` duplicate hub tabs with less functionality
4. **No "This Week" grouping** — Rate Update and Newsletter are both weekly actions but are in separate unrelated locations
5. **Tab ordering in Hub** — TODAY/WEEK/CONTACTS are prominent but Rate Update visibility depends on going to Tracker tab
6. **No backend status indicators** — user has no idea if Mailchimp is configured without clicking Generate and seeing an error
7. **Last Sent timestamp exists in Tracker tab only** — not visible from the main page or nav

---

## Redesign Plan

### What to keep
- The entire Marketing Hub page — all 8 tabs preserved, all state logic preserved
- The Rate Updates standalone page — move to position #1 in nav with better visibility
- All API routes — no changes needed

### What to change
- **Rename "Content Dashboard" → "Newsletter Generator"** (or fold into Hub)
- **Reorder nav**: Rate Update → Newsletter Generator → Social Media Posts → Marketing Hub
- **Marketing Hub main page**: Reorder tabs — put TRACKER first (shows "This Week" cadence for Rate Update + Newsletter), then TODAY, etc.
- **Add "Last Sent" badges** to Rate Update and Newsletter entries in the nav dropdown
- **Add backend status** to Newsletter Generator page

### Section mapping for redesign
- **Section A: "This Week"** → Rate Update (#1) + Newsletter Generator (#2)
- **Section B: "Email Tools"** → Newsletter Generator (already exists as AI → Mailchimp → website)
- **Section C: "Reach"** → Contacts tab (call lists) + Social
- **Section D: "Analytics"** → Tracker tab + Log tab
