# LoanOS Changelog

## [5.3.0] — 2026-04-01 — UI Renovation (shadcn/ui + Visual Polish)

### Added
- **shadcn/ui foundation**: CSS variable theme tokens, cn() utility, Radix UI primitives
- **21st.dev Navbar1**: Replaced TopNav with polished navigation component
- **Card primitive** (`src/components/ui/card.tsx`): Hover glow effect (gold box-shadow + border highlight)
- **Badge primitive** (`src/components/ui/badge.tsx`): 7 variants with colored borders + inset shadow (default, secondary, destructive, outline, success, warning, info)
- **Table primitive** (`src/components/ui/table.tsx`): 7 sub-components with gold-tinted row hover, sticky headers, subtle borders
- **Input, Textarea, Dialog** primitives for future use
- **CSS classes**: `.card-glow` (gold hover shadow), `.lo-table` (table styling) in globals.css

### Changed
- **Dashboard**: DashboardClient, HotLeadsWidget, DailyScheduleWidget, DailyBriefingPanel — swapped hardcoded `#0f172a`/`#1e293b` to Card + semantic tokens (`bg-card`, `border-input`, `bg-input`)
- **Dashboard monthly breakdown**: Replaced `<table>` with Table primitive components
- **Reports** (volume + commission): Wrapped in Card, replaced tables with Table primitives, `text-[#C9A84C]` → `text-primary`
- **Automations**: AutomationCard + InlineDraftEditor — `bg-card`/`border-input` tokens
- **Contacts**: Gold-tinted row hover (`rgba(201,168,76,0.04)`)
- **Pipeline control bar**: `border-input`/`bg-card` tokens (sidebar palette intentionally untouched)

## [5.2.1] — 2026-04-02 — Shared-Email Co-Borrower Fix

### Fixed
- **Shared-email co-borrower bug** (`processWebhook.ts`): When borrower and co-borrower share the same email (married couples), the co-borrower upsert was overwriting the borrower's name on the contact record. Now detects shared email and populates `co_borrower_*` fields on the existing borrower contact instead of creating/overwriting a separate record.

### Data Fixes (manual, Szpitalak loan)
- Restored contact `7257de4c` to Vijayta Szpitalak (primary borrower) with Anton as co-borrower fields
- Created Scot Peterson (`scot@dutkoragen.com`) as buyer agent contact, linked to loan
- Set `buyer_agent_contact_id` and `co_borrower_contact_id` on loan record
- Fixed contact stage from "Pre-Approved" back to "Lead"

### Known Issue
- **n8n "Arive New Loan → Supabase" workflow bypasses `processWebhook.ts`** — does direct Supabase inserts, so party contacts (buyer agent, co-borrower, listing agent, TC, title, escrow) are never auto-created. Workflow needs to be updated to call `/api/arive-webhook/[slug]` instead.

## [5.2.0] — 2026-04-01 — Multi-Tenant LO Onboarding

### Added
- **`getLoIdentity()` helper** (`src/lib/getLoIdentity.ts`): Central identity resolver for all LO-specific data (name, email, phone, NMLS, branding, links). Queries profiles → organizations → org_settings in parallel, with sensible fallbacks.
- **Per-org Arive webhook route** (`src/app/api/arive-webhook/[slug]/route.ts`): Dynamic routing by org slug — each LO gets their own webhook URL.
- **Shared `processAriveWebhook()`** (`src/lib/arive/processWebhook.ts`): Extracted 660+ lines of Arive webhook logic into reusable module.
- **`org_settings` columns**: `application_link` and `calendly_link` (migration 067)
- **`buildOutreachPrompt()`** in `defaultOutreachPrompt.ts` for dynamic outreach system prompts

### Changed
- **7 API routes updated to dynamic identity**: outreach, chat, chat/social, scenarios/send-email, agents/daily-briefing, automations/prompts — all now use `getLoIdentity()` instead of hardcoded Adam references
- **3 n8n workflows updated for multi-tenancy**: Referral Intro, Pre-Approval, Refi Intake — code nodes fetch LO identity from Supabase when `organization_id` present, fall back to Adam's values otherwise
- **`activity_log.organization_id`** hardened to NOT NULL (migration 068, verified 830 rows clean)
- **`database.types.ts`** updated with new org_settings columns

### Notes
- Backward compatible: all changes fall back to Adam's current values when organization_id absent
- Architecture: Option B (separate orgs per LO, not shared org)
- Remaining workflows (Final CD, New App, Contract) need same pattern applied

## [5.1.2] — 2026-04-01 — Send Tab Audit + Fix

### Fixed
- **Race condition causing 404 emails**: Added `waitForPageLive()` deploy gate in shared.js — polls URL up to 90s before triggering Mailchimp sends (rate update + newsletter)
- **Link corruption in teaser emails**: `forceAbsoluteLinks()` was replacing all relative .html links with the current pageUrl — fixed to resolve against `https://styermortgage.com/` base
- **Newsletter temp URL bug**: Custom prompt mode returned `temp-placeholder` slug in response instead of final derived URL — now uses `finalPageUrl`/`finalFilename`
- **Weak voice rules in newsletter custom prompt**: Expanded from 2-line minimal block to full 16-buzzword ban list matching rate-prompt-builder.js

### Added
- **Social publish → History tab**: `/api/social/publish/route.ts` now logs to `mcc_state.log` after successful Publer publish, with platform label and channel mapping
- **Mailchimp error isolation**: Individual campaign sends wrapped in try-catch so one audience failure doesn't block others (both rate update + newsletter)

### Notes
- Deferred: Voice guide Supabase ↔ Netlify disconnect (requires arch change), same-day rate update file overwrites (rare edge case)
- Netlify changes deployed in `styerteam-mortgage-site` repo (commits `abda751`, `87d7c8a`)

## [5.1.1] — 2026-04-01 — Marketing Dashboard Audit + Codex Review

### Fixed
- **`created_by` inconsistency**: SocialComposePanel, CarouselBuilder, and chat/social route used `'user'` — normalized to `'human'` to match draft list filter expectations
- **Publish route action mislabel**: Activity logged `'scheduled'` when publishing — corrected to `'posted'`
- **Missing activity logging**: Draft creation (POST), status changes (PATCH), publishing, and chat/social creation path now all log to `social_activity` — feed was mostly empty before
- **Settings API error handling**: GET query errors, append mode errors, and upsert errors now properly captured and returned
- **Fire-and-forget activity inserts**: All `social_activity` inserts now capture errors with `console.error`

### Added
- **Platform filters in draft list**: ALL / LI / IG / FB — platform="all" drafts appear under any specific filter
- **Source filters in draft list**: ALL / AGENT / MANUAL — distinguishes agent vs manually created drafts
- **Expanded status filters**: Added POSTED and REJECTED pills
- **Draft count display**: `{filtered.length} of {drafts.length} posts` below filters
- **Filter normalization helpers**: `normalizePlatform()` and `normalizeCreatedBy()` in SocialDraftList
- **`updated_by` column** on `social_settings` table (uuid FK to auth.users)
- **Builder subagent activity logging**: 03-builder.md now includes mandatory curl to log social_activity after each draft insert

### Changed
- **TopNav label**: "Voice Guide" → "Marketing" with 📣 icon (desktop + mobile)
- **CALLS tab removed** from marketing page (kept SOCIAL, SEND, HISTORY, VOICE GUIDE)
- **Drafts POST**: `pillar` and `created_by` added to allowedKeys

### Removed
- 2 junk draft records from database (malformed test data)

## [5.1.0] — 2026-03-31 — Carousel Builder + Voice Guide Everywhere

### Added
- **Carousel Builder**: Visual slide editor for creating Instagram/social carousel posts — 2-10 slides, black or image background, Canvas-rendered 1080x1080 PNGs, auto-labeled HOOK/CTA, uploads to Supabase storage
- **POST `/api/social/drafts`**: New endpoint for direct draft creation (carousel builder, future integrations)
- **Shared `fetchVoiceGuide` helper** (`src/lib/voice/fetchVoiceGuide.ts`): Parallel fetch of voice_guide + voice_feedback from social_settings
- **Voice guide in email automations**: `buildAutomationPrompt()` accepts voice guide, generate + refine routes fetch it automatically
- **Voice guide in scheduled tasks**: Both `gbp-weekly-optimization` and `styer-content-weekly` SKILL.md files now fetch voice guide from Supabase before writing content

### Changed
- **`SocialComposePanel`**: Shows "BUILD CAROUSEL VISUALLY" button when Carousel format selected
- **`SocialTab`**: Added carousel mode routing to CarouselBuilder component
- **All 22 draft-status posts regenerated** with updated voice guide

## [5.0.9] — 2026-03-31 — Social Dashboard Bug Fixes + UX Improvements

### Fixed
- **PATCH body missing fields**: `SocialTab.handleUpdate` now sends `media_urls` and `rejection_reason` to the API — both were silently dropped on server round-trip
- **Activity feed blank entries**: `SocialActivityFeed` was mapping `type`/`message` but DB uses `action`/`detail` — feed has been rendering blank entries since launch
- **APPLY TO POST stale edit buffer**: Clicking EDIT after applying a Claude chat response now shows the applied content instead of stale original

### Added
- **DELETE draft**: Muted delete button with confirm dialog + new `DELETE` handler in `/api/social/drafts`
- **APPROVE & PUBLISH**: One-click gold button that approves then immediately publishes to Publer — reduces draft→posted to a single action
- **Platform badges**: IG/LI/FB/ALL badges next to status in draft list sidebar

## [5.0.8] — 2026-03-31 — Social Media Dashboard Fixes + Voice Feedback Loop

### Fixed
- **media_urls silently dropped on edit/approve**: `media_urls` was missing from PATCH allowlist in `/api/social/drafts/route.ts` — added alongside `rejection_reason`
- **Publer credentials hardcoded**: Moved API key + workspace ID to env vars (`PUBLER_API_KEY`, `PUBLER_WORKSPACE`) with pre-flight validation

### Added
- **Voice guide connection to scheduled agent**: `03-builder.md` now fetches `voice_guide`, `voice_feedback`, and rejected drafts from Supabase before writing content
- **Edit diff capture**: Manual edits in SocialDraftDetail log before/after content to `voice_feedback` setting
- **Rejection reason modal**: Reject button now opens a modal requiring an explanation — reason stored on draft + appended to `voice_feedback`
- **Settings API append mode**: POST `/api/social/settings` accepts `appendEntry` to accumulate feedback entries without overwriting
- **`rejection_reason` column** on `social_drafts` table
- **Voice feedback in system prompts**: Both dashboard Claude (`/api/chat/social`) and scheduled agent read accumulated feedback to avoid repeating mistakes

### Changed
- `eslint-disable` comments in chat/social, publish, and settings routes converted from `next-line` to inline format (pre-commit hook compatibility)

## [5.0.7] — 2026-03-31 — Dashboard Redesign: Command Center

### Changed
- **KPI cards reordered**: Commission Earned (YTD), Pipeline Commission, Closed This Month, Pipeline Loans — each shows loan count + volume
- **Needs Attention merged**: Urgent flags (rate lock, closing date, pre-approval) and stale loans (7+ days idle) combined into one panel with status badges and closing dates
- **Hot Leads upgraded**: Inline call/text/email action icons, notes shown below each lead, dismiss on hover
- **Today's Priorities section**: Daily Marketing Schedule + To-Do list side-by-side (2/3 + 1/3 grid)

### Removed
- Active Loans table from dashboard (redundant with Pipeline page)
- Activity feed widget (7-day log)
- New Applications list
- New Leads list (merged into Hot Leads)
- Stage pipeline cards from Pipeline tab (still on Performance tab)
- ~60 lines of unused server queries

## [5.0.6] — 2026-03-31 — Loan Detail Layout + Build Fixes

### Fixed
- **Pre-existing TypeScript strict-mode errors** in `import-salesforce-referrals/route.ts` and `backfill-party-links/route.ts` — function declarations inside `try` blocks converted to arrow functions; `.insert()` cast changed to `as unknown as TablesInsert<'contacts'>`
- **Pre-commit hook `any` check** — `eslint-disable-next-line` comments moved inline across automations and contacts routes so hook's `grep -v` check passes

### Changed
- **Loan detail milestones**: now renders directly below the vitals bar, no gap
- **Property address**: moved to bottom-right corner of the milestones row — styled blue gradient card linked to Zillow
- **Vitals bar**: reduced padding/gap, removed `overflow-x-auto` + `ml-auto` — all stats wrap inline without horizontal scroll

## [5.0.5] — 2026-03-31 — Party Contact Links + Salesforce Referral Import

### Added
- **Party card clickable links**: All party cards (buyer agent, listing agent, referring agent, title, co-borrower) on loan detail page are now clickable when a matching contact record exists
- **`title_contact_id` FK** on `loans` table — links title contacts to their contact record
- **Backfill API route** (`/api/admin/backfill-party-links`) — re-runnable route that matches agent name strings on loans to contact records by case-insensitive name match
- **Salesforce import API route** (`/api/admin/import-salesforce-referrals`) — imports contacts from Salesforce HTML export with dedup and `referred_by_contact_id` linking

### Changed
- **Loan detail party cards** now use direct FK columns (`referral_contact_id`, `title_contact_id`, `co_borrower_contact_id`) instead of client-side email/name lookups — faster rendering, no extra Supabase queries
- **Removed ~40 lines** of client-side referring agent resolution code (email match + name match useEffect) — replaced by server-side FK

### Data
- **525 party-to-contact links** backfilled across all loans (376 buyer agent, 115 listing agent, 30 referring agent, 4 title)
- **148 Salesforce contacts** processed — 144 `referred_by_contact_id` links set to 39 unique realtors

### DB Migration
- `add_title_contact_id_to_loans` — adds `title_contact_id UUID REFERENCES contacts(id)` + index

## [5.0.4] — 2026-03-31 — Co-Borrower Sync Fix + Contact Records

### Fixed
- **Co-borrower data not syncing**: Arive sends `loanBorrower2_*` keys, not `coBorrower*` — all co-borrower fields were being silently dropped
- **DOB showing "Aug 5, 1900"**: Arive only sends `dayOfBirth` + `monthOfBirth` (no year); bad 1900-08-05 cleared from DB, DOB no longer stored from partial data

### Added
- **Co-borrower contact records**: webhook now upserts a separate Supabase contact for the co-borrower (deduped on email, `contact_type: 'borrower'`) on every sync
- **`co_borrower_contact_id` FK** on `loans` table — links to the co-borrower's contact record
- **Co-borrower chip on LoanCard** — each loan card on a borrower's contact page shows a light-blue "Co-borrower: [Name] →" link when a co-borrower contact is linked
- **"CO-BORROWER ON" section** on co-borrower's contact page — lists all loans they're co-borrower on with primary borrower name, loan amount, and status

### DB Migration
- `add_co_borrower_contact_id_and_fix_bad_dob` — adds FK column, clears bad DOB, adds index

## [5.0.3] — 2026-03-31 — Loan Record Redesign

### Removed
- **729 lines of dead code**: LoanTodoList, PropertyDetailsToggle, InfoCard, PartiesCard, SortableCardWrapper, LoanInfoGrid, CollapsibleDetails and associated constants/interfaces
- DnD imports (@dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities) — no longer needed

### Added
- **KeyDatesGrid**: 9 primary dates + 24 secondary dates from Arive `raw_payload.keyDates_*` (expandable, only shows populated)
- **Employment display** in BorrowerProfileCard (employer, position, self-employed badge)
- **Descriptive activity summaries** in n8n WF1 + WF2 (e.g. "Status: Processing → Underwriting | Rate: 6.5%")
- **contacts.last_activity_date** updated by both Arive sync workflows on every sync

### Changed
- Loan detail uses unified EditableSectionCard layout — no more duplicate card + edit views

## [5.0.2] — 2026-03-31 — Contact Record Cleanup (Phase 4)

### Added
- **Merged activity timeline** — `activity_log` (system events) and `contact_activity` (user outreach) now display in a single chronological feed with All/Outreach/System filter toggles
- **Realtor Performance card** — referral count, closed count, conversion rate %, total volume for realtor contacts
- **Notes card** on contact overview — existing notes display + textarea to add new notes
- **DOB field** for borrower contacts (inline-editable)
- **SystemActivityItem component** for rendering system activity entries
- **UnifiedFeedItem type** — discriminated union for merged feed
- **LinkedContactCard component** on loan detail page

### Changed
- Contact loan cards now show `loan_program`, `employer_name`, `monthly_income` when available
- Loans query includes `estimated_closing_date`, `loan_program`, `employer_name`, `monthly_income`
- Referred loans query includes `interest_rate`, `property_address`, `property_city`, `property_state`, `loan_purpose`, `loan_type`

### Fixed
- **Loan detail build errors** — restored DnD + icon imports removed in prior session, fixed `KeyDatesGrid` → `KeyDatesPanel` reference, added type casts for extended loan fields
- Removed dead `activeTab`/`setActiveTab` props from ContactRecordView

## [5.0.1] — 2026-03-30 — Arive Sync Overhaul

### Added
- **Co-borrower support** in Arive sync — co-borrower data now flows to both contacts table (co_borrower_first/last/email/mobile/birthdate) and loans table (co_borrower_name/email/phone/home_phone/work_phone/birthdate/marital_status)
- **Employment data** from Arive: employer_name, monthly_income, position_description, self_employed
- **Compensation data**: commission_amount, gross_loan_revenue, net_loan_revenue
- **Loan program** mapped from Arive's `lenderProductName`
- **Borrower DOB** (partial — month/day only, Arive doesn't send year)
- **Agent contact auto-upsert**: buyer's agent and listing agent from Arive are upserted as `type='realtor'` contacts with IDs linked to the loan record
- 9 new Supabase columns via migrations: borrower_birthdate, co_borrower_home_phone, co_borrower_work_phone, co_borrower_birthdate, co_borrower_marital_status, position_description, self_employed, gross_loan_revenue, net_loan_revenue

### Changed
- **WF1** (Arive New Loan → Supabase): 13 → 16 nodes, added Upsert Agent Contacts node, expanded Extract Loan Fields and all upsert bodies
- **WF2** (Arive Status Update → Supabase): updated Extract Status Fields, Update Loan Status, and Sync Contact nodes with all new fields

## [5.0.0] — 2026-03-30 — Automation Command Center

### Added
- **Automation Command Center** (`/dashboard/automations`) — unified control for all 37 automations (17 Claude Code, 18 n8n, 2 chatbot prompts)
- `automation_registry` + `automation_runs` tables (migrations 064-066) with RLS policies and 37 seed rows
- 6 registry API routes: list, get/patch, run history, run-now, ask-claude, bulk pause/resume
- 4 email API routes: generate via n8n, update draft, send via n8n, refine via Claude
- 12 new UI components: StatusBar, AutomationRow, AutomationGroup, GuidedControls, AskClaudePanel, RunHistoryList, SendHistoryList, AgentDetailPanel, EmailDetailPanel, EmailTemplateEditor, AssistantDetailPanel, InlineDraftEditor
- "Ask Claude" panel: natural language → config changes with diff preview
- Source-specific detail panels: Agent (3 tabs), Email (4 tabs), Assistant (2 tabs)

### Changed
- `AutomationPanel` now queries `automation_registry` instead of hardcoded `definitions.ts`
- `AutomationCard` calls new email API routes, accepts `AutomationRegistryRow`
- Regenerated `database.types.ts` with new tables

### Removed
- `src/lib/automations/definitions.ts` — replaced by `automation_registry` table
- `src/lib/automations/prompts.ts` — replaced by registry config + prompt_snapshot
- `src/app/api/automations/generate/route.ts` — replaced by `email/generate`
- `src/app/api/automations/refine/route.ts` — replaced by `email/[draftId]/refine`
- `src/app/api/automations/send/route.ts` — replaced by `email/[draftId]/send`

## [4.9.5] — 2026-03-29 — Build Unblock + Missing Source Files

### Fixed
- **Local build failure**: `npm ci` resolved corrupted `node_modules` causing `pages-manifest.json` ENOENT on every local build
- **Vercel build failure**: Committed 5 source files that existed locally but were never pushed to git — `src/lib/automations/definitions.ts`, `src/lib/automations/prompts.ts`, `src/app/api/automations/refine/route.ts`, `src/app/api/automations/send/route.ts`, `src/lib/stageNormalization.ts`
- **ESLint error**: Removed unused `contactId` variable in `api/automations/generate/route.ts`

### Added
- `scripts/imessage-sync.py` — iMessage sync utility
- `LOANOS_SYSTEM_KNOWLEDGE_BASE.md` — system knowledge base
- 100+ task files committed (enterprise, lead-gen, seo-sem, social-media sessions)

## [4.9.4] — 2026-03-29 — Email Automation Panel

### Added
- **Email Automation Panel** on contact and loan records — 14 automations (4 contact-level, 10 loan-level with stage filtering)
- `AutomationPanel` component — lists available automations, queries sent state from `email_drafts` on mount
- `AutomationCard` component — full lifecycle: idle → generating → draft (editable subject/body + refine via Claude) → sending → sent
- `POST /api/automations/generate` — fetches record data, builds prompt, calls Claude, saves draft
- `POST /api/automations/refine` — refines existing draft via Claude instruction
- `POST /api/automations/send` — sends draft to n8n webhook for Outlook draft creation, logs activity
- Automation definitions (`src/lib/automations/definitions.ts`) — pure data, stage-aware filtering
- Prompt builder (`src/lib/automations/prompts.ts`) — 14 per-automation prompts with safe fallbacks, multi-tenant LO identity

### Changed
- Contact record Overview tab — added Email Automations section at bottom
- Loan record Automations tab — added Email Automations section below existing PDF-upload workflow cards

## [4.9.3] — 2026-03-29 — Social Dashboard Bug Fixes + Enterprise Spec

### Fixed
- **Broken image thumbnails** in SocialComposePanel: replaced `getPublicUrl()` with `createSignedUrl()` for authenticated Supabase Storage
- **Silent generate failure**: empty `catch {}` replaced with proper error state + red banner display
- **Broken media display** in SocialDraftDetail: added `useEffect` to resolve signed URLs from stored paths
- **DB constraint violation**: added `FORMAT_TO_DB` mapping (display names → snake_case DB values) and `VALID_FORMATS`/`VALID_PLATFORMS` validation in chat/social API

### Added
- Enterprise Social Media multi-tenant spec (`tasks/enterprise/specs/2026-03-29-enterprise-social-media-spec.md`)
- Email Automation Panel build prompt (`tasks/automation-panel-prompt.md`) — 14 automations, generate/refine/send workflow

## [4.9.2] — 2026-03-29 — Loan Record View Color Coding

### Changed
- Pipeline progress bar: each stage uses its own color (blue/amber/purple/green/gold) instead of all-gold
- Milestone timeline: colored circles and labels per stage (was white)
- Communication hub: colored left border + role labels per party type
- Vital stats: color-coded (Amount=blue, Rate=green, LTV=purple, DTI=amber)
- Key dates: colored dot + label for filled dates, dim for empty
- Tab bar: active tab underline matches loan status color via `statusHex()`

### Fixed
- Pre-push git hook: added retry on failure for intermittent Next.js 14.2.35 manifest race condition

## [4.9.1] — 2026-03-29 — Loan Record View Redesign

### Added
- CommunicationHub: full-width contact cards with one-click Phone/SMS/Email + "Last Contacted" timestamps from activity log
- Actionable milestones: shows agent notification status (✓ Notified / ⚠ Not sent) per completed stage
- PropertyDetailsToggle: primary fields always visible, secondary data behind More/Less toggle
- VitalStat + VitalStatEditable components for slim header vital signs

### Changed
- Header: consolidated from scrollable chip boxes to slim 3-row layout (breadcrumb + name + inline vital stats)
- DashboardTab layout: linear flow with thin dividers instead of nested bordered containers

### Removed
- LoanEssentialsPanel, PropertySummaryCard, PartnerContactsPanel (replaced by new components)

## [4.9.0] — 2026-03-29 — Social Media Dashboard

### Added
- **SOCIAL tab** in Marketing: email-client-style layout with draft list + detail panel for reviewing agent-generated posts
- **Compose mode**: prompt input, platform picker (IG/LI/FB/All), format picker (single/carousel/video/reel/text/Claude decides), media upload zone
- **Scoped Claude chat** (`/api/chat/social`): Claude sees selected draft + voice guide automatically; supports compose, edit, and general chat modes
- **Activity feed**: horizontal scrolling strip showing recent agent actions
- **Voice Guide editor** (full tab): edit voice/workflow markdown directly in UI
- **Voice Guide drawer**: slide-out panel from draft detail for quick voice guide reference
- 3 new Supabase tables: `social_drafts`, `social_activity`, `social_settings` (all with RLS)
- 4 new API routes: `/api/chat/social`, `/api/social/drafts`, `/api/social/activity`, `/api/social/settings`
- Design spec: `docs/superpowers/specs/2026-03-29-social-media-dashboard-design.md`
- **Real media upload** in compose panel: drag-and-drop + click to upload to Supabase Storage, thumbnails with remove buttons
- **Media preview** in draft detail: single image full-width, carousel with arrows + index indicator, video with controls
- **APPLY TO POST** button on Claude chat responses (replaces auto-overwrite behavior)
- **PUBLISH TO PUBLER** button on approved drafts — pushes to Publer API as draft, updates status to `posted`
- `/api/social/publish` route: maps platform to Publer account IDs, logs activity

### Changed
- Marketing page default tab changed from SEND to SOCIAL
- TopNav Marketing dropdown: added "Social Media" as first item
- Agent builder subagent (`03-builder.md`) now writes to `social_drafts` table instead of Publer/PRs
- Agent reporter subagent (`06-reporter.md`) logs to `social_activity` table
- Master agent (`master-agent.md`) references Supabase dashboard workflow

### Fixed
- Storage RLS violation on media upload: changed path from `social/{userId}/...` to `{userId}/social/...`
- Voice guide missing: seeded `social_settings` with full voice + workflow guide content

## [4.8.0] — 2026-03-29 — Realtor Relationship System

### Added
- Migration 061: 9 new contacts columns (referral counts, dates, stage, tier, notes), loans.referral_contact_id, activity_log last_touch_at trigger
- Migration 062: Dropped top_realtor and target_realtor boolean columns
- 4 new smart lists in contacts page: Active Deal Partners, Top Producers YTD ≥ 2, Due for Outreach (60d), Tier A — Not This Month
- WF-R1 referral thank-you branch in n8n workflow J9Pe24vUi6fpZtdZ (6 new nodes)

### Changed
- database.types.ts regenerated with new columns; booleans removed
- import/contacts/route.ts: removed boolean fields, added production_tier mapping from legacy CSV
- Contacts page Contact type + ALL_COLUMNS updated

### Data
- 123 referred_by_contact_id links backfilled; 120 realtors tiered; 117 staged Active Partner

## [4.7.0] — 2026-03-27 — Arive/LoanOS Separation + Dead Code Cleanup

### Changed
- **n8n Inbound Email Log (#4)** updated: added `organization_id` to all activity_log inserts, added "Find Active Loan" step to link emails to borrower's active loan, added `loan_name` to metadata
- **Settings page**: replaced Outlook OAuth UI with simple "Email Sync — managed by n8n" status card

### Removed
- **6 dead API routes**: `outlook-auth`, `outlook-callback`, `outlook-disconnect`, `outlook-refresh`, `outlook-status`, `outlook-sync`
- **Milestone agent route**: `/api/agents/milestone` (Arive handles milestone emails)
- **Outlook lib**: `src/lib/outlook/refresh.ts`
- **Outlook state/handlers** from settings page + unused imports

### n8n Workflows
- Archived: Milestone Communication Agent (#3), Outlook Email Sync (#5), TEMP Mailchimp Journeys (#18)

---

## [4.6.0] — 2026-03-23 — Chat Intelligence + Attachments + Voice + Quick Actions

### New
- **AI-powered contact extraction** (`/api/contacts/quick-add`): Claude Haiku replaces regex-only parsing — captures free-text notes and infers stage from conversational context (e.g., "just met them at an open house" → Lead). Regex fallback preserved on error
- **Dashboard "Hot Leads" widget** (`src/components/dashboard/HotLeadsWidget.tsx`): Surfaces contacts with follow-up-intent notes updated in last 30 days. Keyword scoring ranks by urgency. Top 5 shown with note snippet + days ago, linking to contact record
- **4 new AI chat quick action chips**: Mass update (`Update all …`), Scenario (`Mortgage scenario: …`), Sales Q (`Sales question: …`), Underwriting Q (`Underwriting question: …`)
- **Chat file/image attachments**: Paperclip button in chat input — supports PDF and images (JPEG, PNG, WebP), 1 MB per file, max 3 files. Chips appear above input; cleared after send
- **Clipboard paste for screenshots**: Paste images directly into chat (Ctrl/Cmd+V) — routes through same FileReader pipeline as file picker
- **Voice dictation**: Mic button in chat — tap to start/stop, interim transcript shown live, final text appended to textarea (Web Speech API, hidden when unsupported)
- **Full-screen expand mode**: ⤢ button in chat header expands to `position: fixed; inset: 0; z-index: 9000`; Esc or ⤡ collapses back
- **NotebookLM routing hint**: System prompt instructs Claude to call `query_mortgage_knowledge_base` tool when message begins with "Sales question:" or "Underwriting question:"

### Changed
- **`DashboardClient`**: accepts `hotLeads: HotLead[]` prop; renders Hot Leads widget between Urgent Attention and Needs Attention sections
- **`buildSystemPrompt`** in `/api/chat/route.ts`: routing hint appended for knowledge-base chip prefixes

### Files Changed (session 2026-03-23)
- `src/app/api/contacts/quick-add/route.ts` — AI extraction with fallback
- `src/components/dashboard/HotLeadsWidget.tsx` — new component
- `src/app/dashboard/page.tsx` — hot leads query + scoring
- `src/components/dashboard/DashboardClient.tsx` — hot leads prop + render
- `src/components/crm/LoanOSChat.tsx` — 4 new chips, attachments, voice, expand
- `src/app/api/chat/route.ts` — multimodal support, routing hint
- `package.json` — `@types/dom-speech-recognition` devDependency

---

## [4.5.0] — 2026-03-20 — Loan Detail Redesign + Auto Loan Names

### New
- **`supabase/migrations/041_loan_name_and_missing_arive_fields.sql`**: Adds `aus_result` and `originator_comp` columns; backfills `loan_name` for all existing loans using `{last_name}-{street_address}` formula
- **`LoanInfoGrid`** (in loan detail page): 6-card 2-column responsive grid — Borrower, Loan Terms, Property, Key Dates, Origination, Parties. Replaces the previous `KeyDetailsCard` + dense EditableSectionCard stack
- **`CollapsibleDetails`** (in loan detail page): Collapsible panel containing all EditableSectionCards (preserved for editing), including new Origination card with aus_result + originator_comp
- **Referred Borrowers section** on realtor contact pages: queries `buyer_agent_contact_id` and `listing_agent_contact_id` on loans table, shows table with borrower name / loan amount / status / close date, count badge, empty state

### Changed
- **Arive webhook** (`/api/arive-webhook`): auto-generates `loan_name` from last name + property address when Arive doesn't send it; maps `aus_result` + `originator_comp` from multiple possible Arive key names; logs raw payload for field auditing
- **Loan detail header**: `loan_name` shown as primary title (h1, large), borrower name demoted to subtitle; commission removed from header meta strip
- **Loan interface**: added `aus_result: string | null`, `originator_comp: number | null`
- **Contact page**: added `fetchReferredLoans` callback, passes `referredLoans` to ContactRecordView
- **ContactRecordView**: accepts optional `referredLoans` prop, renders Referred Borrowers section for realtor contacts

## [4.4.0] — 2026-03-19 — Marketing Tab Redesign (3-Tab Command Center)

### New
- **`src/lib/marketing/types.ts`**: MCCContact, LogEntry, MCCState, BLANK_STATE, APR_OFFSETS, RateRow, DEFAULT_RATE_ROWS, LOG_CHANNELS, LogChannel types and constants
- **`src/lib/marketing/utils.ts`**: aprForProduct, cadenceColor, channelToType, buildRatesString, currentWeekBoundaries, formatDaysAgo, formatWeekLabel, todayString utilities (34 Vitest tests)
- **`src/app/dashboard/marketing/_components/shared.tsx`**: Card, SectionLabel, FieldLabel, Input, Textarea, Btn (4 variants), CadenceBadge, Banner, Spinner, TypeBadge UI atoms
- **`src/app/dashboard/marketing/_components/useMCCState.ts`**: Supabase mcc_state read/write hook + mergedState helper; PGRST116 handled as first-time user
- **`src/app/dashboard/marketing/_components/RateUpdateForm.tsx`**: 6-row rates table with APR auto-calc, preview/publish/schedule flow wired to `generate-rate-update` Netlify function, auto-logs to HISTORY
- **`src/app/dashboard/marketing/_components/NewsletterForm.tsx`**: Structured fields + custom prompt modes, wired to `generate-newsletter` Netlify function, auto-logs to HISTORY
- **`src/app/dashboard/marketing/_components/SendTab.tsx`**: Inner toggle (Rate Update / Newsletter), cadence badges
- **`src/app/dashboard/marketing/_components/ContactCard.tsx`**: Mark Called inline flow; calledToday computed at render from lastTouch vs todayString(); tracker updates for realtors/preapprovals lists; timezone-safe date math
- **`src/app/dashboard/marketing/_components/CallsTab.tsx`**: 4 contact lists (Realtors, Pre-Approvals, Active Files, Hot Leads), add form, CSV import with deduplication, delete confirm
- **`src/app/dashboard/marketing/_components/HistoryTab.tsx`**: Week navigation (Monday–Sunday), 6-chip cadence health strip with showDaysAgo, log table (DATE/ACTIVITY/TYPE/CHANNEL), manual log entry with social tracker update

### Changed
- **`src/app/dashboard/marketing/page.tsx`**: Full rewrite — 2440-line monolith → 83-line 3-tab shell (SEND / CALLS / HISTORY). IBM Plex Mono font, gold header, loading/error states
- **`src/lib/marketing/schedule.ts`**: Stripped to 6-entry TRACKERS constant only (removed DAYS, TCOLS, DayTask, DayDef exports)
- **`src/components/dashboard/DailyScheduleWidget.tsx`**: Inlined DAYS/TCOLS constants (no longer imports from schedule.ts)

### Deleted
- `src/app/dashboard/marketing/content/page.tsx`
- `src/app/dashboard/marketing/social/page.tsx`
- `src/app/dashboard/marketing/rate-updates/page.tsx`
- `src/app/api/marketing/generate-newsletter/route.ts`
- `src/app/api/marketing/publish-newsletter/route.ts`
- `src/app/api/marketing/run-testimonials/route.ts`
- `src/app/api/marketing/send-mailchimp/route.ts`
- `src/app/api/marketing/log-social-post/route.ts`

### Notes
- All marketing state in existing `mcc_state` Supabase table (no schema changes)
- TYPE badge derived from channel at render — never stored
- `calledToday` computed at render — never stored
- `todayString()` uses local date components (not UTC toISOString) to avoid timezone off-by-one
- Cadence health uses `cadenceColor()` with Math.floor for integer-day boundary stability
- Log entry dates use noon-UTC anchor (`T12:00:00`) for correct week-filter behavior in all US timezones

---

## [4.3.0] — 2026-03-19 — Scenario Output Layout Restructure

### Changed
- **`src/app/dashboard/scenarios/new/ScenarioBuilder.tsx`**: Removed `max-w-[1100px] mx-auto` container — page now uses `w-full` (left-aligned, fills available width). Step 2 results section restructured into 4 rows: (1) `ScenarioSummaryTable` (left, `overflow-x-auto`) + `KeyMetricsGrid` (right, fixed `w-72` sidebar) side-by-side in a flex row; (2) `BreakEvenTable` full-width; (3) `TotalInterestChart` full-width; (4) `MonthlyPaymentChart` + `CumulativeSavingsChart` in a 2-col grid.
- **`src/app/dashboard/scenarios/new/ScenarioCharts.tsx`**: Added named exports `MonthlyPaymentChart`, `TotalInterestChart`, `CumulativeSavingsChart` so `ScenarioBuilder` can place individual charts at precise layout positions. Default `ScenarioCharts` export retained.

### Notes
- AI Analysis (`generate-narrative`) will fail with a billing error if `ANTHROPIC_API_KEY` has no credits. Add credits at console.anthropic.com → Billing to resolve.

---

## [4.2.0] — 2026-03-19 — Audit Quick Wins

### New
- **`tasks/audit-reports/AUDIT-2026-03-19.md`**: Full audit report — architecture, UI/UX, feature gaps, simplification opportunities, quick wins.

### Changed
- **`src/components/dashboard/DashboardClient.tsx`**: Wire `TodoList` into Queue tab (side-by-side with SmartActionQueue). Replace local `timeAgo()` with `fmtRelative` from `formatters.ts`. Replace local `fmtDate()` with `fmtDateShort` (compact Mon DD format).
- **`src/app/dashboard/contacts/page.tsx`**: Replace inline `fmtCurrency`, `fmtDate`, `fmtDateOnly` with imports from `@/lib/formatters`. Removes ~30 lines of duplicate code.
- **`src/app/dashboard/page.tsx`**: Raise stale-loan threshold from 3 days to 7 days. Reduces "Needs Attention" section noise significantly.

### Deleted
- `src/components/dashboard/PipelineCharts.tsx` — orphaned, never imported
- `src/components/dashboard/PipelineKPIs.tsx` — orphaned, never imported
- `src/components/dashboard/PipelineSummary.tsx` — orphaned, never imported
- `src/components/dashboard/RecentActivity.tsx` — orphaned, never imported
- `src/components/dashboard/RecentLoans.tsx` — orphaned, never imported
- `src/components/dashboard/UrgentFlags.tsx` — orphaned, never imported

---

## [4.1.0] — 2026-03-18 — Scenario Builder Output Rebuild

### New
- **`src/lib/scenarios/displayData.ts`**: Shared `DisplayData` utility — single source of truth for all scenario output values. Exports `buildPurchaseDisplayData()` and `buildRefiDisplayData()`. Used by in-app output, PDF, and share page.
- **`src/app/dashboard/scenarios/new/ScenarioSummaryTable.tsx`**: Comparison table component. Recommended column gets navy bg + gold border + "★ Recommended" badge. Accepts `{ data: DisplayData }`.
- **`src/app/dashboard/scenarios/new/KeyMetricsGrid.tsx`**: 4 stat cards — Monthly Savings, 5yr, 15yr, Total Interest. Green highlight when positive.
- **`src/app/dashboard/scenarios/new/BreakEvenTable.tsx`**: Break-even analysis table. Gold break-even months column. Returns null when no rows.

### Changed
- **`src/app/api/scenarios/generate-narrative/route.ts`**: Prompt changed to 4-paragraph plain English (no bullets). Auth errors return sanitized message. Server-side logging of `isAuthError` + `hasApiKey` for diagnostics.
- **`src/app/dashboard/scenarios/new/NarrativeSection.tsx`**: Client error handling shows sanitized text in red. Removed dead ternary.
- **`src/app/dashboard/scenarios/new/ScenarioCharts.tsx`**: Completely rebuilt — 3 charts driven by `{ data: DisplayData }`. Bar charts use `Cell` (gold for recommended) + `LabelList` with custom `BarTopLabel` SVG renderer. Cumulative savings `LineChart` with `ReferenceDot` break-even annotations.
- **`src/app/dashboard/scenarios/new/ScenarioBuilder.tsx`**: Step 2 renders 7-section output via shared `DisplayData`. `ScenarioSummaryTable → KeyMetricsGrid → BreakEvenTable → ScenarioCharts`. Removed old `ResultsTable` reference.
- **`src/app/api/scenarios/generate-pdf/route.ts`**: 7-section HTML layout. Inline SVG bar charts (print-perfect). Sections: summary table, key metrics, break-even table, monthly payment chart, total interest chart, AI analysis, closing costs appendix.
- **`src/app/share/[token]/page.tsx`**: 7-section layout using shared display components. CSS variables injected via dark-theme wrapper. Calculations re-run from raw `scenarios_data` on every load.

---

## [4.0.0] — 2026-03-18 — Multi-Tenancy Completion

### New
- **`supabase/migrations/032`**: `organization_id` column + index on `documents`, `email_drafts`, `scenarios`
- **`supabase/migrations/033`**: Org-scoped RLS (4 policies per table) on `documents`, `email_drafts`, `scenarios`
- **`supabase/migrations/033b`**: Drop legacy user-scoped policies on `email_drafts` + `scenarios`
- **`supabase/migrations/033c`**: Fix `scenarios` SELECT policy (removed `OR share_token IS NOT NULL` cross-org hole; share route uses service client bypassing RLS)
- **`supabase/migrations/034`**: Drop legacy `org_id` column from `scenarios` (all 14 rows were NULL; superseded by `organization_id`)
- **`src/app/api/me/route.ts`**: Returns `{ organizationId, role, userId }` — used by client components for org context
- **`src/components/OrgProvider.tsx`**: React context provider; fetches `/api/me` on dashboard mount; exposes `{ organizationId, role, userId, loading }`
- **`src/hooks/useOrg.ts`**: Re-exports `useOrg` from OrgProvider for clean imports
- **`src/app/onboarding/page.tsx`**: Org creation form — captures org name + full name, POSTs to `/api/org/create`
- **`src/app/api/org/create/route.ts`**: Creates `organizations` row + upserts profile as `owner`
- **`src/app/api/org/members/route.ts`**: GET lists org members; PATCH changes role (owner/admin only)
- **`src/app/api/org/invite/route.ts`**: Sends Supabase auth invite + pre-creates profile with org + role

### Changed
- **`src/middleware.ts`**: Guards `/dashboard` routes — redirects to `/onboarding` if `profiles.organization_id` is null. Fixed `setAll()` to write cookies to response object (was empty — session rotation wasn't persisting)
- **`src/app/dashboard/layout.tsx`**: Wraps children in `<OrgProvider>`
- **All 20 API routes**: `getOrganization()` replaces `getUser()`; `organization_id` added to all INSERTs; queries scoped to org
- **`src/app/api/arive-webhook/route.ts`**: Org lookup from payload `user_id` → profiles (no more `LOANOS_SYSTEM_USER_ID` env dependency)
- **`src/app/api/agents/milestone/route.ts`**: Org lookup moved before first INSERT; `organization_id` stamped on `milestone_communications`
- **`src/app/api/agents/daily-briefing/route.ts`**: Agent-secret path now resolves org from profiles before running queries
- **All server pages** (`/dashboard`, `/dashboard/scenarios`, reports): `getOrganization()` replaces `getUser()`
- **`/dashboard/loans/page.tsx`**: Removed `.eq('user_id', userId)` from SELECT queries — RLS handles org scoping
- **`/dashboard/contacts/page.tsx`**: `useOrg()` for userId; contact INSERT includes `organization_id`
- **`/dashboard/marketing/page.tsx`**, **`rate-updates`**, **`social`**, **`content`**: `useOrg().userId` replaces `supabase.auth.getUser()`
- **`/dashboard/settings/page.tsx`**: Organization Members section added (member list, inline role selects, invite form); `handleRoleChange` now checks `res.ok` before updating UI
- **n8n WF1** (`1tagvoU0UXtdDiMY`): Added `Get Org ID` node → stamps `organization_id` on contacts, loans, activity_log writes
- **n8n WF2** (`9JyzzwKac8v3uQ7d`): Added `Get Org ID` node → stamps `organization_id` on loans, activity_log, loan_status_history writes
- **`ARCHITECTURE.md`**: Created comprehensive architecture reference (stack, DB schema, data flow, n8n inventory, API route map, multi-tenancy status)

---

## [3.5.5] — 2026-03-17 — Dashboard Daily Schedule Widget

### New
- **`src/lib/marketing/schedule.ts`**: Shared module exporting `DAYS`, `TCOLS`, `DayTask`, `DayDef` — extracted from `marketing/page.tsx` to a plain TS module (no `'use client'`) so it's importable by both server components and client widgets without circular imports.
- **`src/components/dashboard/DailyScheduleWidget.tsx`**: Self-contained client widget showing today's marketing task checklist on the main dashboard. Fetches `mcc_state` from Supabase on mount. Checking a task writes to `marketing_activity_log` + updates `mcc_state` log. Gold checkbox + progress bar + day/focus badge. "Full hub →" link to `/dashboard/marketing`. Returns `null` on weekends for a clean dashboard.

### Changed
- **`DashboardClient.tsx`**: `<DailyScheduleWidget />` inserted between Needs Attention panel and the Recent Loans + Activity grid in the Pipeline tab.
- **`marketing/page.tsx`**: Refactored to import `DAYS`/`TCOLS`/`DayTask`/`DayDef` from `@/lib/marketing/schedule` (removed duplicate inline definitions).

---

## [3.5.4] — 2026-03-17 — Loan Record Sprint: 2-Col Layout, Inline Details, Notes/Docs Sidebar

### Changed
- **Loan record layout**: Removed Details and Notes tabs. New tab order: Dashboard | Automations | Activity (N) | Emails (N).
- **Dashboard tab — 2-column layout**: flex layout with scrollable main column (left) + fixed 320px right sidebar. Left col: MilestoneTimeline → KeyDetailsCard → Recent Activity → all 7 detail sections (Loan Terms, Property, Borrower, Key Dates, Financials, Parties, Attribution + Linked Contact). Right sidebar: Notes panel (auto-save) + Documents panel (upload/download).
- **Key Dates section**: now displays all 9 dates — Loan Created (read-only), Application, Submission, Approval, Est. Closing, Closing, Funding, Rate Lock Date, Lock Expiry.
- **Days Locked header field**: changed from manually-stored integer to dynamic calculation `rate_lock_expiration - today`. Displays "N days" remaining, or "N days ago" in red if expired.

### Fixed
- **Webhook**: added `rate_lock_date: nDate(body.rateLockDate)` mapping — was the only key date field missing from the Arive webhook handler.

### Removed
- `DetailsTab`, `ActivityNotesPanel`, `DocumentsPreview`, `LoanNotesTab` components (functionality absorbed into DashboardTab).

---

## [3.5.3] — 2026-03-17 — Marketing Sprint: Checkbox Logging, Content Dashboard, Social/Rate Nav

### New
- **`marketing_activity_log` Supabase table**: Stores completed daily schedule task rows (`user_id`, `task_name`, `day_of_week`, `logged_at`, `source`). RLS enabled — users see only their own rows. Indexed on `user_id` and `logged_at`.
- **`/dashboard/marketing/social`**: Standalone Social Media Posts page — platform filter tabs (LinkedIn/Facebook/Instagram/etc.), stats bar (total posts, this week, LinkedIn count, last post date), add form, post history table. Reads/writes `mcc_state`.
- **`/dashboard/marketing/rate-updates`**: Standalone Rate Updates page — rate log with 30yr/15yr/ARM fields, audience, channel. Cadence health indicator (red/gold/green based on days since last send). Syncs `last['rate-update']` to `mcc_state`.

### Changed
- **Daily Schedule Widget** (`/dashboard/marketing`): Checking a task now (a) writes a row to `marketing_activity_log` and (b) appends an entry to `mcc_state` activity log so it appears in the LOG tab. Progress bar added under the done/total count — animates gold → green when all tasks complete.
- **Content Dashboard** (`/dashboard/marketing/content`): Replaced kanban ideas board with the Newsletter Generator (AI draft → Mailchimp → publish to website) + newsletter history log. Label stays "Content Dashboard", content is now the generator. Data merges into the `mcc_state` blob.
- **TopNav Marketing dropdown**: "Social Media Posts" → `/marketing/social`, "Rate Updates" → `/marketing/rate-updates` (dedicated pages fix the "does nothing" bug — the previous `?tab=` query param approach didn't re-trigger tab state since marketing/page.tsx reads searchParams only at mount). Removed duplicate "Newsletter Generator" item. Added "Marketing Hub" to reach the full daily schedule view.

---

## [3.5.2] — 2026-03-17 — Scenario Builder Server Component Crash Fix

### Fixed
- **Scenario "Create" crash** (`/dashboard/scenarios/new?loan_id=X`): Server component was importing `DEFAULT_CLOSING_COSTS` and `sumClosingCosts` from `ScenarioBuilder.tsx` which has `'use client'` — violates Next.js module boundary rules, causing a server render crash with "Something went wrong / An error occurred in the Server Components render".
- **Scenario view crash** (`/dashboard/scenarios/[id]`): Same root cause — `ensureClosingCosts`, `sumClosingCosts`, `DEFAULT_CLOSING_COSTS` imported from the `'use client'` ScenarioBuilder module. No `error.tsx` existed for this route, causing Next.js to show a raw "An application error" page instead of a handled error UI.

### New
- **`src/lib/scenarios/utils.ts`**: Extracted `DEFAULT_CLOSING_COSTS`, `ensureClosingCosts`, and `sumClosingCosts` into a plain module with no `'use client'` directive. Both server pages now import from here directly.
- **`src/app/dashboard/scenarios/[id]/error.tsx`**: Added missing error boundary — graceful "Something went wrong" UI with Try Again + Back to Scenarios buttons.

### Changed
- `ScenarioBuilder.tsx`: Now imports utilities from `@/lib/scenarios/utils` and re-exports them (backwards compat).
- `scenarios/[id]/page.tsx`: Data reconstruction wrapped in try-catch with redirect fallback on corrupt scenario data.

---

## [3.5.1] — 2026-03-17 — Morning Audit: Arive Status Update Fix

### Fixed
- **Arive Status Update n8n workflow** (`9JyzzwKac8v3uQ7d`): `Log Status History` node was failing with NOT NULL constraint violation when Arive sent `currentLoanStatus_status: null` (happens when only non-status fields like dates/rates changed). Body expression now uses `status || oldStatus || 'unknown'` fallback — prevents crash and records a no-op history entry.

### Audit Findings
- Contract Received workflow (`UfNcdpoVKQZqy0fj`) `Upsert Contacts` node failing with `fetch is not defined` — added to todo.md as 🔴 High Priority.
- Multiple 🔴 todo items confirmed already resolved: pipeline/stats, agent auth, STAGE_MAP, netlify removal, createServiceClient, briefing dark theme. Cleared from backlog.

## [3.5.0] — 2026-03-17 — Daily Audit Fixes + Design System Cleanup

### Fixed
- **`/api/pipeline/stats`**: Dead column names `est_closing_date` and `borrower_name` replaced with `estimated_closing_date` and `borrower_first_name`/`borrower_last_name` — matches Arive-expanded schema
- **Login page redesigned**: Brought fully onto LoanOS design system — `var(--bg)`, `var(--surface)`, `var(--gold)` accent, IBM Plex Mono font. Was using generic gray/blue Next.js starter styles.

### Improved
- **Scenario Builder fonts**: All 18 hardcoded `'Inter', sans-serif` inline style declarations replaced with `'IBM Plex Mono', monospace`. Inter was never loaded; text was silently falling back to OS default.
- **`src/lib/formatters.ts` created**: Shared module with `fmtCurrency`, `fmtK`, `fmtDate`, `fmtDateOnly`, `fmtPct`, `fmtRelative`. Updated `DashboardClient`, `ContactRecordView`, `referral/[referrerName]`, `reports/commission`, `reports/volume` to import from shared module.

### Removed
- **`netlify/functions/`**: Deleted 5 dead JS files (`arive-webhook.js`, `outlook-auth.js`, `outlook-callback.js`, `outlook-refresh.js`, `outlook-sync.js`) — pre-Vercel era dead code. All functionality lives in `src/app/api/`.

## [3.4.0] — 2026-03-16 — Inbound Email Sync

### New
- **Inbound email sync workflow**: n8n workflow (`qgb99Eh2ziy0INMk`) polls Outlook inbox every 5 min, matches senders to contacts, logs to `activity_log`
- **Migration 025**: `subject`, `body_snippet`, `from_address`, `to_address`, `occurred_at` columns on `activity_log`; `last_touch_at` on `contacts`; partial index on `needs_review`
- **Contact Emails tab**: inbound emails now appear above outbound drafts with gold INBOUND badge, collapsible body snippet
- **Unmatched email review** (`/dashboard/emails/unmatched`): table of unmatched transactional emails with "Link to Contact" search modal and dismiss
- **Emails nav item**: added to TopNav (desktop + mobile)
- **Noise filter**: blocks bulk mail (noreply, mailchimp, fanniemae.com, etc.) before processing
- **Transactional detection**: unmatched emails only logged if subject/body contains mortgage keywords, dollar amounts, or street addresses

### Technical
- n8n workflow deployed inactive — needs Microsoft Outlook credential connected to activate
- Contact `last_touch_at` updated on every matched inbound email
- Deduplication via `external_id` (internetMessageId) + unique partial index from migration 008

## [3.3.0] — 2026-03-16 — Loan Detail Page Fixes + Activity Log

### New
- **Header row 2**: Est. Close Date, Rate Lock Date, Lock Expiry, Days Locked — all inline-editable
- **Rate lock expiry warnings**: automatic yellow badge within 5 days, red badge when expired
- **Milestone: Approved w/ Conditions** added to milestone timeline (was missing)
- **Key Loan Details expanded**: Est. Close Date, Rate Lock Expiry, Commission added to dashboard card
- Schema: `rate_lock_date` (DATE) and `rate_lock_days` (INTEGER) columns added to loans table

### Fixed
- **Activity log root cause**: ActivityRow interface was missing `type` and `summary` — notes saved but never displayed. Fixed interface, select query, and insert (now includes `user_id`). Optimistic update with rollback on failure.
- **Activity feed display**: type-specific icons (phone/email/text), full timestamps, notes shown in full
- **Commission bug**: bad test data (Priya Nair $1M, Derek Cho $10K, Maria Gutierrez $100K) corrected to 1% of loan amount
- **Milestones**: replaced hardcoded string matching with `normalizeToStageKey()` from canonical constants. `hasReachedStage()` helper uses ordered STAGE_ORDER array.

### Changed
- Test data: 8 in-process loans now have estimated close dates + rate lock data. Scott Tillman and Travis Coleman locks trigger warning badges.

## [3.2.0] — 2026-03-16 — Loans + Contacts Sync Fix + UI Fixes

### New
- **Stage constants file** (`lib/constants/loan-stages.ts`): single source of truth for all stage definitions, labels, groups, raw status mappings, and helper functions. Replaces 6+ scattered hardcoded stage lists.
- **Contact ↔ Loan sync trigger**: Supabase trigger `sync_contact_stage_from_loan()` auto-updates `contacts.stage` when `loans.status` changes. Fires on both INSERT and UPDATE.
- **Filterable loan lists**: preset dropdown (8 presets including monthly closed, YTD, needs attention), advanced filters (Purpose, Loan Type, Date range), active filter chips with × clear.

### Fixed
- **Loan row click routing**: clicking any loan row now routes to `/dashboard/loans/[id]` — previously no row click handler existed.
- **User scoping on loans list**: `user_id` filter added to ALL Supabase queries (counts + data). Previously showed all users' loans.
- **Stage filter accuracy**: In Process and Closed filters now use constants, automatically including all Arive raw status variants.
- **Borrower name → contact link**: borrower name in loans list links to `/dashboard/contacts/[contact_id]` instead of nowhere.

### Changed
- **Commission field**: now editable inline in loan detail header (click to edit). Added to Financials section in Details tab. Shows em dash when null.
- **Dashboard page**: imports stage logic from constants instead of local STAGE_MAP.
- **Contact backfill**: one-time sync of all existing contacts from their linked loan statuses (855 Closed, 18 In Process, 36 Pre-Approved, 1425 Leads).

## [3.1.1] — 2026-03-16 — Morning Audit Bugfixes

### Fixed
- **Daily briefing always 401** — `/api/agents/daily-briefing` used `validateAgentSecret` exclusively, blocking all browser calls from `/dashboard/briefing`. Now accepts Supabase session auth (browser) OR agent secret (server-to-server).
- **Daily briefing wrong column** — same route queried `est_closing_date` (non-existent). Fixed to `estimated_closing_date`.
- **Review Request Email n8n crashing every 30 min** — workflow `AK1fBcaX1cPcdlGx` queried `close_date` column (doesn't exist). Supabase returned 400 on every trigger. Fixed to `closing_date`. Pushed to n8n.

### Audit Findings (no code change needed)
- n8n: 11 of 13 workflows active. Outlook Email Sync (`JMmstRl2C5ylmuIY`) and duplicate Contract Received (`w7hZLmIcQ4izmndb`) correctly inactive.
- Dashboard: all KPI cards, pipeline charts, stage cards, activity log pulling live Supabase data — no issues.
- `/api/pipeline/stats` uses old column names but is not referenced anywhere in the UI — flagged in todo.md.

## [3.1.0] — 2026-03-16 — Dashboard Links + Automations + Filters

### Dashboard
- All 4 KPI cards (Pipeline Loans, Gross Commission, Commission YTD, This Month) now hyperlinked to /dashboard/loans with appropriate query params
- Today's Focus section links to /dashboard/marketing with arrow indicator
- Needs Attention section has "View all" link to /dashboard/loans?filter=no_activity_3days

### Automations
- Loan detail Automations tab expanded from 4 to 8 workflows: added Refi Intake, Refi Analysis, Website Lead Follow-up, Contract Received
- Standalone /dashboard/automations page expanded from 5 to 8 workflows (same additions)
- Actions dropdown buttons now pre-select automation: clicking "Send PA Email" auto-opens the PA Email modal in the Automations tab

### Loans List
- URL filter support: reads `stage`, `filter`, `period` query params from URL
- Dashboard stage cards link to `?stage=StageName` — client-side filters loaded loans
- Active filter badges (gold/blue/orange chips) with × clear buttons and "Clear all" link
- Header stats (Total Loans, Volume, Commission) now recalculate for filtered loan set

### Reports
- New `/dashboard/reports/volume` page — server-rendered table of YTD funded loans with volume totals
- New `/dashboard/reports/commission` page — server-rendered table of YTD funded loans with commission breakdown

### Audit
- Activity log verified working — `activity_log` table correct, insert/refresh/display all functional
- MCC already fully migrated (v1.16.0–v1.18.0) — newsletter, Mailchimp, testimonials all in LoanOS
- Full audit report: `tasks/audit-reports/dashboard-audit.md`

## [3.0.0] — 2026-03-16 — Dashboard Rebuild + Scenario Wizard + Branded PDF

### Theme
- Dark monochromatic theme (`bg-[#060b18]`, `bg-[#0f172a]` cards) with gold accent `#C9A84C`
- IBM Plex Mono for data, Inter for UI labels
- Updated `--gold` CSS variable from blue to actual gold `#C9A84C`
- TopNav restyled: dark background, gold "OS" text, zinc profile section

### Dashboard
- **New `DashboardClient.tsx`**: Pipeline tab with KPI cards (Pipeline Loans, Gross Commission, Commission YTD, This Month), clickable stage pipeline cards, urgent flags
- **Today's Focus panel**: day-of-week marketing schedule (Mon=Realtor Outreach, Tue=Borrower Follow-up, etc.)
- **Needs Attention panel**: loans with 3+ days no activity
- **Performance tab**: Volume YTD, Commission YTD, Projected, Avg Per Loan KPIs + 3 Recharts (volume bar, commission line, pipeline bar) + monthly breakdown table
- `dashboard/page.tsx` server component computes pipeline stats, commission aggregates, stale loans, monthly chart data

### Loans List
- Header stats: Total Volume, Total Loans, Gross Commission
- `commission_amount` field in Supabase select + Loan interface

### Loan Detail
- Expanded actions dropdown: 8 n8n automations (PA Email, CD Email, Refi Intake, Refi Analysis, Referral Intro, Website Lead Follow-up, New App, Contract Received)
- Activity logging: Log Call/Email/Text buttons with modal, writes to `activity_log` table
- Borrower name clickable link to `/dashboard/contacts/${loan.contact_id}`
- Commission display in meta strip

### Scenario Builder
- **Wizard flow**: 3-step (Setup → Loan Options → Results) replacing side-by-side layout
- Step indicator with completed checkmarks, back/next navigation
- Auto-calculates when advancing from step 2→3
- Purchase scenarios displayed in 2-column grid on step 2
- `PercentField` rate input fix: local string state during focus for decimal typing (6.25, 6.875)

### PDF Output
- Branded layout matching refi-analysis skill: NAVY `#0A1628` header/footer bars, gold `#C9A84C` accents
- Per-scenario cards with hero metric, charcoal headers, light-bg bodies
- Closing cost breakdown section (Lender Fees / Third Party / Prepaids) with totals
- Markdown → HTML rendering for bullet-format AI analysis (bold headers, gold bullet markers)
- CTA footer bar with contact info

### AI Narrative
- Prompt updated: bullet format with bold section headers (**Bottom Line**, **Monthly Impact**, **Long-Term View**, **Trade-Offs**)
- 8-14 crisp bullets instead of flowing paragraphs

### Database
- Migration 024: `commission_amount DECIMAL(10,2)` on loans table

## [2.1.0] — 2026-03-15 — Scenario Builder UX Fixes + Loan Integration + Statement Upload

### Fixed
- **White input backgrounds** — `PercentField` had no `background` set; `CurrencyField` used `transparent` which failed in some browsers. All inputs now use explicit `background: 'var(--sc-bg)'`
- **PDF generation completely broken** — `ActionsBar.generatePdf()` called `res.json()` on an HTML response, then looked for `data.url` — both failed silently. Fixed to use `res.text()` + `window.open()` + `document.write(html)`
- **PDF/share scenarioId race condition** — `save()` updated React state async; by the time PDF request fired, `scenarioId` was still null. Fixed by having `save()` return `{ id, share_token }` directly

### Added
- **Closing costs templates** — purchase mode: 2% / 2.5% / 3% of loan amount; refi mode: 1.5% / 2% / 2.5%. Auto-fills `totalClosingCosts` based on loan amount × percentage
- **"Copy A →" / "Copy 1 →" buttons** — purchase cards B/C/D can copy all fields from Option A; refi options 2/3 can copy from Option 1. Preserves label and id
- **PDF route upgraded** — imports calculation functions server-side (`calculatePurchaseScenario`, `calculateCurrentLoan`, `calculateRefiScenario`), recalculates from saved inputs, renders full comparison table with 14–17 metrics
- **Share page upgraded** — full comparison table with gold checkmarks (✦) on best values per metric, summary cards (monthly payment, rate, term), reinvestment analysis display, narrative section, disclaimer + LoanOS branding
- **Loan record → Scenario Builder** — "Create Scenario" link in loan detail Actions dropdown routes to `/dashboard/scenarios/new?loan_id=xxx`. Server component fetches loan data, maps Arive fields (loan_type, term months→years, addresses) to scenario builder initial state. Purchase mode fills Option A; refi mode fills CurrentLoanInput
- **Mortgage statement PDF upload** — "Upload Statement" button in refi mode above CurrentLoanCard. Uploads PDF → `/api/scenarios/parse-statement` → Claude extracts: original amount, current balance, rate, term, start date, monthly P&I, escrow breakdown, PMI, property address, borrower name. Preview extracted fields before applying
- **`results_data` column** — migration 023 adds `results_data jsonb` to scenarios table. Save endpoint stores calculated results (amortization schedules stripped for size). Share page reads saved results instead of recalculating

### New Files
- `src/app/api/scenarios/parse-statement/route.ts` — Claude API PDF extraction endpoint
- `src/app/dashboard/scenarios/new/StatementUpload.tsx` — upload button + modal + preview + apply component
- `supabase/migrations/023_scenarios_results_data.sql` — results_data column

### Technical Details
- 12 files modified, 3 new files
- Migration 023 applied to Supabase via MCP
- Deployed to Vercel: `dpl_9M1VqMSBT68p5tN2nTAqxJnHpaHb`, state: READY
- `npm run build` passes clean

---

## [2.0.0] — 2026-03-15 — Sprint 2: AI Scenario Builder (Mortgage Coach Killer)

### Added
- **AI Scenario Builder** — complete Mortgage Coach replacement at `/dashboard/scenarios/new`
  - **Purchase mode**: 2-4 scenario columns, all loan fields, buydown (2-1, 3-2-1, 1-0), extra payment simulator, collapsible sections for closing costs/monthly costs
  - **Refinance mode**: current loan card with auto-calculated payoff balance + remaining term from start date, 1-3 new loan options, debt consolidation with cash-out toggle
  - **Results table**: comparison with gold checkmarks on best values, green/red savings, IBM Plex Mono numbers, tooltips on complex metrics
  - **4 Charts** (Recharts): monthly payment stacked bar, equity build-up area, cumulative savings/break-even line, principal vs interest stacked area — all with time horizon toggles
  - **Reinvestment analysis**: FV of annuity calculation with line chart
  - **AI narrative**: Claude API streaming via SSE, editable after generation, auto-appended disclaimer
  - **PDF generation**: HTML-based V1 (window.print()), includes branding from user_settings
  - **MISMO 3.4 import**: regex-based XML extraction, SSN masked to last 4, field confirmation view
  - **Shareable links**: `/share/[token]` — no auth required, 90-day expiration, view count tracking
- **Scenario history dashboard** at `/dashboard/scenarios` — list, search, duplicate, delete saved scenarios
- **View/edit saved scenarios** at `/dashboard/scenarios/[id]` — loads into ScenarioBuilder with pre-populated state
- **Calculation engine** (`src/lib/scenarios/calculations.ts`) — amortization, APR (Newton-Raphson), buydown schedules, PMI removal, equity projections, refi break-even, reinvestment FV
- **Type system** (`src/lib/scenarios/types.ts`) — ScenarioMode, PurchaseScenarioInput, RefiScenarioInput, CurrentLoanInput, DebtItem, all calculated result types
- **7 API routes**: `/api/scenarios/calculate` (POST), `/api/scenarios/generate-narrative` (POST, SSE streaming), `/api/scenarios/save` (POST + DELETE), `/api/scenarios/generate-pdf` (POST), `/api/mismo/parse` (POST), `/api/share/[token]` (GET)
- **Database migration** `018_scenarios.sql` — scenarios table with all fields, indexes, RLS policies, auto-update trigger
- **Design system** — `--sc-*` CSS variables for scenario palette, IBM Plex Sans font loading
- **TopNav** — Scenarios nav item added (📐 icon)

### Compliance
- AI disclaimer auto-appended to every narrative
- Claude system prompt prohibits protected class references
- SSN from MISMO masked to last 4 — never stored in full
- Activity log captures every AI generation
- Human review enforced — LO edits narrative before PDF/share
- Shared links expose only borrower-facing data

### Technical Details
- 32 files created, 3 files modified
- `npm run build` passes clean
- All 20 acceptance criteria met
- No new dependencies required (recharts, @anthropic-ai/sdk already in package.json)

---

## [1.23.0] — 2026-03-15 — Daily Audit: Chat Route Column Names, Briefing max_tokens

### Fixed
- **`src/app/api/chat/route.ts`** — Corrected stale column names introduced by migration 011. When fetching loan context for the AI chat widget, the route was selecting `est_closing_date` (migration 007, old) and `borrower_name` (migration 005, old) — but Arive webhook writes to `estimated_closing_date` and `borrower_first_name`/`borrower_last_name` (migration 011, current). Result: every Arive-synced loan showed "N/A" for both Borrower and Close Date in chat context. Fixed by: (1) replacing `est_closing_date` → `estimated_closing_date` in both loan selects; (2) replacing `borrower_name` in the loan-type select with `borrower_name, borrower_first_name, borrower_last_name`; (3) updating the `borrowerName` resolution to check `borrower_name` → `borrower_first_name + borrower_last_name` → contact fallback; (4) updating `closeDate` to use `estimated_closing_date`.
- **`src/app/api/agents/daily-briefing/route.ts`** — `max_tokens` bumped from `1024` → `2048`. Chat route was fixed in v1.22.0 but briefing was missed; 1024 tokens is tight when generating 7 prioritized action items + summary.

---

## [1.22.0] — 2026-03-15 — Daily Audit: Nav, Actions Button, Dark Theme, CSS Vars, max_tokens

### Fixed
- **`src/components/TopNav.tsx`** — Removed duplicate "Pipeline" nav item (was a second link to `/dashboard/loans`, identical to "Loans" nav item below it; also never highlighted because `sectionFromPath` doesn't return `'pipeline'`). Replaced with "Briefing" nav item pointing to `/dashboard/briefing`. Removed `'pipeline'` from the `Section` type. Added "Daily Briefing" to mobile menu. Daily Briefing agent page is now reachable from the nav.
- **`src/app/dashboard/loans/[id]/page.tsx`** — Wired up the "Actions" button. Was a non-functional stub that rendered a `<button>` with no `onClick`. Now opens a click-outside-aware dropdown with two sections: (1) Automations — PA Email, CD Email, Referral Intro (each switches to the Automations tab); (2) View — Activity Log, Email History, Documents (each switches to the corresponding tab). Uses `actionsRef` + `useEffect` for click-outside close. `actionsOpen` state added.
- **`src/app/dashboard/automations/page.tsx`** — Fully converted from light slate theme to dark zinc. Changed: page bg (`bg-slate-50` → `bg-zinc-950`), stat row (`bg-white border-slate-200` → `bg-zinc-900 border-zinc-700`), infra status badge (`bg-emerald-50 border-emerald-200 text-emerald-700` → `bg-emerald-900/30 border-emerald-700 text-emerald-400`), workflow cards (`bg-white border-slate-200` → `bg-zinc-900 border-zinc-700`), heading text (`text-slate-900` → `text-zinc-100`), muted text (`text-slate-400/500` → `text-zinc-400/500`), pipeline step nodes (inactive: `border-slate-200 bg-slate-50 text-slate-400` → `border-zinc-700 bg-zinc-800 text-zinc-500`), connectors (`bg-slate-200` → `bg-zinc-700`), modal (`bg-white border-slate-200` → `bg-zinc-900 border-zinc-700`), form inputs (`bg-slate-50 border-slate-200 text-slate-900` → `bg-zinc-800 border-zinc-600 text-zinc-100`), cancel/back buttons (`text-slate-500 border-slate-200` → `text-zinc-400 border-zinc-700`), footer note (`bg-white border-slate-200 text-slate-400` → `bg-zinc-900 border-zinc-700 text-zinc-500`). Functional logic 100% unchanged.
- **`src/app/dashboard/referral/[referrerName]/page.tsx`** — Replaced all inline `var(--)` CSS custom property references with hardcoded dark zinc hex values: `var(--bg)` → `#09090b`, `var(--surface)` → `#18181b`, `var(--border)` → `#3f3f46`, `var(--muted)` → `#71717a`, `var(--fg)` → `#e4e4e7`, `var(--font-mono)` → `'IBM Plex Mono', monospace`, `var(--font-display)` → `'IBM Plex Mono', monospace`. Visual output identical to before.
- **`src/app/api/chat/route.ts`** — `max_tokens` bumped from `1024` → `2048` on the main LoanOS AI chat endpoint. Prevents truncation when Claude is drafting full emails or longer analytical responses.

### Added
- **`tasks/audit-reports/AUDIT-2026-03-15.md`** — Full codebase audit report: Architecture, Supabase Schema, UI/UX, Feature Completeness, Claude API Usage, Simplification, Quick Wins across 7 categories. Includes complete findings on pending migrations, tech debt, and feature gaps.

---

## [1.21.0] — 2026-03-14 — Loan Detail Dashboard Layout

### Changed
- **`loans/[id]/page.tsx`** — complete layout overhaul. Replaced single-column tab-based overview with 2-column dashboard layout:
  - **Header**: breadcrumb → borrower name + address line → status badge + Actions button → 6-field meta strip (Loan Amount, Product, Rate, Close Date, Loan Officer, Realtor) → pipeline progress bar (Application → Processing → Underwriting → CTC → Funding)
  - **Dashboard tab** (new default): left col (3/5) = KeyDetailsCard (3×4 grid: Purchase Price, Down Payment, Loan Amount, Rate/APR, Monthly P&I, Term, LTV, CLTV, DTI, Loan Type, AUS Result, MI Required) + DocumentsPreview (inline doc list with upload); right col (2/5) = MilestoneTimeline (7-step timeline with completion status from loan dates + stage inference) + ActivityNotesPanel (notes textarea + recent activity feed)
  - **Tabs**: Dashboard (new) | Details (all editable field cards, was "Overview") | Automations | Activity | Emails
  - All existing functionality preserved: inline editing, document upload/download, automation triggers, activity log, email draft history, LoanOSChat widget

---

## [1.20.0] — 2026-03-14 — Backlog Cleanup: Migrations, Activity Log, Extraction Routes, Marketing Theme

### Added
- **Migration 017 applied** — `user_settings` table live in Supabase (Settings page now functional)
- **`RUN_ALL_PENDING.sql` updated** — now covers all migrations 006-017; idempotent, safe to re-run on any fresh environment
- **`POST /api/agents/cd-extraction`** — n8n calls this after extracting Closing Disclosure fields via Claude; updates `loans` record with CD dates + financial fields + logs `loan.cd_received` to `activity_log`
- **`POST /api/agents/pa-extraction`** — same pattern for Pre-Approval letters; updates loan fields + sets status to `Pre-Approved` + logs `loan.pa_received`
- **`docs/n8n-credentials-setup.md`** — step-by-step setup guides for Review Request + Weekly Testimonial Social Post workflows (SMTP, Gemini API, Google Sheets OAuth2, Publer) + CD/PA extraction payload reference

### Changed
- **`contacts/page.tsx` — `handleStageChange()`**: fire-and-forget `activity_log` insert after stage update (`contact.stage_changed`, includes `from`/`to`/`name`)
- **`loans/page.tsx` — `handleStatusChange()`**: fire-and-forget `activity_log` insert after inline status change (`loan.status_changed`)
- **`loans/page.tsx` — `handleBulkStatusUpdate()`**: bulk `activity_log` insert (one row per loan) after bulk status update
- **`marketing/page.tsx`** — all CSS vars (`var(--gold)`, `var(--muted)`, `var(--text)`, `var(--surface)`, `var(--border)`, `var(--bg)`, `var(--bg-deep)`) replaced with hardcoded dark zinc hex values (`#C9A84C`, `#71717a`, `#f4f4f5`, `#18181b`, `#3f3f46`, `#09090b`, `#000000`); visual output unchanged, no Bloomberg CSS dependency

### Manual steps still needed
- n8n credentials (see `docs/n8n-credentials-setup.md`): SMTP for Review Request, Gemini + Google Sheets OAuth2 for Social Post
- Outlook: Azure App Registration + 6x env vars (see `docs/outlook-azure-setup.md`)

---

## [1.19.0] — 2026-03-14 — Email Draft Preview: Full Integration

### Added
- **`POST /api/email-drafts`** — new endpoint for external callers (n8n, webhooks); validates required fields, generates `body_preview`, inserts with `status: 'pending'`. Internal code still uses `logEmailDraft()` directly.
- **Loan detail → Emails tab** — 5th tab on every loan record. Queries `email_drafts` where `loan_id = id` (all statuses, chronological desc). Each card: type badge + status badge + relative timestamp; expands to iframe HTML preview; pending drafts get Mark Sent / Discard buttons that PATCH `/api/email-drafts`. Fetched in parallel with existing loan data.
- **Contact detail → Emails tab** — new tab on every contact record. Same pattern, queries by `contact_id`. `ContactEmailHistory` component uses contact page's inline style convention.
- **`EmailDraftRow` type** — exported from `ContactRecordView.tsx`, imported by `page.tsx` for type-safe state.

### Architecture note
Every automation that generates email should call `logEmailDraft()` from `src/lib/supabase/logEmailDraft.ts` (non-blocking, fire-and-forget pattern). The milestone agent (`/api/agents/milestone`) already does this. The dashboard `<EmailDraftPreview />` panel was already wired in v1.18.0.

---

## [1.18.0] — 2026-03-14 — Marketing: Newsletter Generator + Testimonials + Nav Deep Links

### Added
- **Newsletter Generator panel** in NEWSLETTERS tab — AI drafts via `/api/marketing/generate-newsletter` (Claude). Inputs: audience + optional rate context. Outputs: teaser email HTML + full web page HTML + slug. Actions: SEND MAILCHIMP (creates + sends campaign), PUBLISH TO WEBSITE (dispatch webhook), LOG THIS (saves to mcc_state).
- **Testimonials Automation card** in SOCIAL tab — RUN NOW triggers n8n Weekly Social Post workflow (`eJG4wckrj6SmSpm1`) via n8n REST API. Requires `N8N_API_KEY` env var on Vercel.
- **4 new API routes:** `/api/marketing/generate-newsletter`, `/api/marketing/send-mailchimp`, `/api/marketing/publish-newsletter`, `/api/marketing/run-testimonials`

### Changed
- **TopNav** — Marketing dropdown deep links: Newsletter Generator → `?tab=NEWSLETTERS`, Social → `?tab=SOCIAL`, Rate Updates → `?tab=TRACKER`
- **MarketingPage** — reads `?tab` URL param via `useSearchParams` to set initial tab

### Config required
- Vercel: `N8N_API_KEY` env var (testimonials trigger)
- Settings → Integrations: Mailchimp API key + server prefix + list IDs
- Settings → Website: Dispatch webhook URL + secret

---

## [1.17.0] — 2026-03-14 — Dashboard + Search + CRM Overhaul

### Fixed
- **Closing Volume Last 90 Days** (`dashboard/page.tsx`, `api/pipeline/stats/route.ts`): query used lowercase `['closed', 'funded']` status values — Postgres `IN` is case-sensitive and 740 loans have status `'Closed'` (capital C), so the chart returned 0 results. Fixed to `.in('status', ['Closed', 'Funded', 'Closed/Funded', 'closed', 'funded'])`. Also switched date filter to `YYYY-MM-DD` format instead of ISO timestamp.

### Added
- **90-day totals in chart header** (`PipelineCharts.tsx`): "Closing Volume — Last 90 Days" header now shows aggregate count + dollar volume (computed from `weeklyTrend` data client-side).
- **Global Search formatting overhaul** (`GlobalSearch.tsx`): replaced all `var(--card)`, `var(--border)`, `var(--foreground)`, `var(--muted)` CSS vars with hardcoded zinc palette values matching the dark theme. Added type pills (contact/loan), proper text truncation with `overflow: hidden` + `textOverflow: ellipsis`, active highlight with left border accent, and `min-width: 0` for flex overflow. Results now show: type pill | name | detail (email/amount) | status badge.

### Changed — Contacts Page
- **Default view changed** from `'all'` → `'active'` (Hot List / Pre-Approved). Navigating to Contacts now shows Pre-Approved borrowers by default.
- **`active` smart list renamed** to "Hot List / Pre-Approved" in the sidebar and dropdown.
- **New `all-borrowers` smart list** added: filters `contact_type = 'borrower'`, shows all borrowers regardless of stage. Added to `applySmartList`, `fetchCounts`, and sidebar.
- **Quick filter dropdown** added to contacts filter bar (gold border, monospace). Options: Hot List / Pre-Approved, All Contacts, Borrowers, Realtors, Others. Syncs with sidebar active list.

### Changed — Loans Page
- **Default view changed** from `'all'` → `'inprocess'`. Navigating to Loans now shows active pipeline.
- **Default sort changed** from `closing_date DESC` → `closing_date ASC` (soonest closing first).
- **Smart list restructured**: In Process, Closed, Pre-Approval (renamed from Started), Other (renamed from Cancelled). Pre-Approval now includes Pre-Approved + Started + Application statuses.
- **Quick filter dropdown** added to loans header (gold border, monospace). Options: In Process, All Loans, Closed, Pre-Approval, Other. Syncs with sidebar.
- **Closing urgency highlighting**: In Process view now colors rows and closing date text. ≤7 days: red background + red text + "Xd" indicator. ≤14 days: amber background + amber text. Logic in new `closingUrgencyStyle()` and `daysUntilClose()` helpers.

### Changed — AI Chat
- **System prompt replaced** (`api/chat/route.ts`): comprehensive LoanOS AI identity with Adam's revenue framework, today's date injection, explicit capability list, and communication rules (direct, punchy, always draft full emails not outlines).

---

## [1.16.0] — 2026-03-14 — Marketing Command Center — Full HTML Parity

### Changed
- **`src/app/dashboard/marketing/page.tsx`** — Full upgrade to match `marketing-command-center.html` (styermortgage.com). File grew from ~920 → 1,592 lines. All Supabase persistence (`mcc_state` table) preserved intact.

### Added components (new in this session)
- **`StatRow`** — Always-visible 4-KPI strip above tabs: Today's Focus, Tasks Complete, Loans in Process, Overdue Items
- **`OverdueBanner`** — Red alert strip with clickable tracker chips. Only renders when ≥1 tracker is overdue (days > freq × 1.5). Clicking a chip opens `LogModal`.
- **`LogModal`** — Shared modal for logging tracker activities. Accepts `trackerId`, writes `LogEntry` to `s.log` and updates `s.last[trackerId]`. Triggered from: Overdue Banner chips, Tracker LOG NOW button, Today quick-Log ↗ buttons.
- **`overdueTrackers()`** — Helper; returns TRACKERS array filtered to entries where `daysSince(s.last[id])` is null or > `freq × 1.5`.
- **Brain Dump sidebar in TodayTab** — 2-column layout: tasks on left, Brain Dump todos on right (first 12 inline, overflow count). Mirrors HTML `renderTodos()` sidebar.
- **Log ↗ quick buttons on TodayTab tasks** — Each task with a `tracker` prop shows a small gold "Log ↗" button to open LogModal directly from the TODAY view.

### Enhanced tabs
- **TrackerTab**: 2-col card grid, progress bars (green/amber/red fill based on `days/freq`), LOG NOW button (triggers page-level `openLogModal()`).
- **ContactsTab**: Search input + CSV import modal (Salesforce column parsing) + 2-column contact card grid + Mark Called button (green, disabled if already called today).
- **SocialTab**: Platform filter buttons (All / LinkedIn / Facebook / Instagram) above post grid.
- **NewslettersTab**: Audience filter buttons (ALL / REALTORS / BORROWERS / BOTH) + table layout (`DATE | SUBJECT | AUDIENCE | OPEN % | ACTIONS`).
- **LogTab**: Calendar / List view toggle (`📅 Calendar / 📋 List`) with ← PREV / NEXT → week navigation.

### Page-level changes
- `logModal` state: `{ open: boolean; trackerId: string | null }` lifted to page level.
- `openLogModal(trackerId)` + `handleLogSave(activity, channel, notes, date)` — unified log handler.
- `StatRow`, `OverdueBanner`, `LogModal` all rendered at page level (outside tab content area).

---

## [1.15.1] — 2026-03-14 — Daily Audit: 5 Bug Fixes

### Fixed
- **`src/app/api/automations/refi-intake/route.ts`** — Wrong Claude model string `claude-sonnet-4-20250514` → `claude-sonnet-4-5`. Invalid model was causing every refi intake automation to 502.
- **`src/app/dashboard/layout.tsx`** — Layout wrapper background changed from `bg-slate-50` (light) → `bg-zinc-950` (dark). Prevents light flash under dark dashboard pages on load.
- **`src/app/api/arive-webhook/route.ts`** — Removed `console.log` success log on every webhook hit.
- **`src/app/api/outlook-callback/route.ts`** — Removed `console.log` and `console.warn` debug logs.
- **`src/app/api/outlook-sync/route.ts`** — Removed 3 `console.log` statements; removed unused `myEmail` destructure.

### Removed
- **`src/app/dashboard/SidebarNav.tsx`** — Dead code. Component was never imported after switching to `TopNav` horizontal layout. Deleted.

### Added
- **`tasks/audit-reports/AUDIT-2026-03-14.md`** — Full codebase audit report covering all 7 categories: Architecture, Supabase Schema, UI/UX, Feature Completeness, Claude API Usage, Simplification, Quick Wins.

---

## [1.15.0] — 2026-03-14 — Marketing Fix + Content Board + Settings Expansion

### Fixed
- **`src/app/dashboard/marketing/page.tsx`** — Marketing tab crash. Root cause: bare `@supabase/supabase-js` client didn't share auth session; upsert sent `{ key, value }` with no `user_id`, failing RLS `WITH CHECK (auth.uid() = user_id)`. Fix: switched to `@/lib/supabase/client` (SSR-aware), added `userId` state from `supabase.auth.getUser()`, added `user_id` to upsert payload and `user_id` filter to select.

### Added
- **`src/app/dashboard/marketing/content/page.tsx`** — Content Board — 3-column kanban (Ideas / In Progress / Published). Migrated from `marketing-content.html` on styer-mortgage-site (localStorage → Supabase). Cards: title, type badge (Blog/Video/Social/Email/Guide), notes, date. Add/edit modal. Move left/right arrows. Delete with confirm. Persisted to `mcc_state` table under `key = 'content_board'`. Dark zinc theme.
- **`src/app/dashboard/settings/page.tsx`** — Full rewrite. Four new credential sections backed by `user_settings` Supabase table (migration 0017): (1) Identity (name, company, NMLS, email, phone), (2) Integrations (Anthropic API key + test, Mailchimp API key + server prefix + list IDs + test), (3) Website (base URL, dispatch webhook URL, dispatch secret), (4) Social (LinkedIn token, Facebook page token + ID). Each section saves independently. Last-saved timestamp per section. All token/key fields masked by default with show/hide toggle.
- **`src/app/api/settings/test-anthropic/route.ts`** — POST; validates Anthropic key by calling `/v1/models`; returns `{ ok, error }`.
- **`src/app/api/settings/test-mailchimp/route.ts`** — POST; validates Mailchimp key by calling `/3.0/ping`; returns `{ ok, error }`.
- **`supabase/migrations/0017_user_settings.sql`** — `user_settings` table: `(user_id, key)` PK, JSONB value, `updated_at` auto-trigger, RLS (user reads/writes own rows). **⚠️ NOT YET APPLIED — run in Supabase SQL Editor.**
- **`src/components/TopNav.tsx`** — Content Dashboard nav link updated from `/dashboard/marketing` → `/dashboard/marketing/content`.

### Notes
- Migration 0017 must be applied before settings page can save/load credentials.
- styer-mortgage-site files untouched — Content Board is a copy, not a move.

---

## [1.14.1] — 2026-03-14 — Email Draft Preview Wired to Dashboard

### Added
- **Morning audit system** — `tasks/todo.md` and `tasks/lessons.md` created with full backlog and pattern library.

### Fixed
- **`src/app/dashboard/page.tsx`** — imported and rendered `<EmailDraftPreview />` at bottom of dashboard (after RecentActivity). Component was fully built in v1.13.0 but never added to the dashboard page. Now visible on every dashboard load.

### Notes
- `email_drafts` table (migration 013) must be applied in Supabase for EmailDraftPreview to show data (not error).
- `todo_items` table (migration 0016) must be applied for TodoList to persist tasks.
- Migration 015 (Arive full field expansion) must be applied before WF1 can upsert new-loan webhooks.

---

## [1.14.0] — 2026-03-13 — Pipeline Dashboard Redesign

### Added

- **`src/app/dashboard/page.tsx` — full rewrite** — replaced 5-stat card landing page with production pipeline dashboard. Async server component fetches pipeline data, activity log, and urgent flags inline; passes typed props to client components. Layout: header → urgent flags → KPI row → charts → briefing+todo → activity.
- **`src/components/dashboard/PipelineKPIs.tsx`** — 4 KPI cards: Active Pipeline (count + total volume), Closed MTD (with +/- delta vs last month, trending arrow), Est. Close 30d (projected count + volume), Needs Attention (urgent flag count with amber border when non-zero).
- **`src/components/dashboard/PipelineCharts.tsx`** — Two recharts visualizations: (1) Bar chart — loan count per pipeline stage, gold bars for closing-side stages; (2) Line chart — 90-day closing volume trend in weekly buckets with count overlay. Both have empty states with helpful copy.
- **`src/components/dashboard/UrgentFlags.tsx`** — Dismissable flag strip (amber border). Auto-detects: pre-approvals expiring within 7 days, loans past estimated closing date (not yet closed/funded). Dismissed client-side per session. Links to loan detail page.
- **`src/components/dashboard/DailyBriefingPanel.tsx`** — Embedded briefing panel with Run Briefing button, AI summary display, top 3 action items with inline checkboxes, link to full `/dashboard/briefing` page. Loading skeleton (3 pulse bars). Empty state with Brain icon.
- **`src/components/dashboard/TodoList.tsx`** — Persistent to-do list backed by Supabase `todo_items` table. Add task (inline form + urgent toggle button). Complete task (click circle → removed from list). Delete (hover to reveal Trash2). Flag/unflag urgent (hover AlertTriangle). Urgent tasks render first with amber background. Fetches open todos on mount.
- **`src/components/dashboard/RecentActivity.tsx`** — 7-day activity feed from `activity_log`. Type filter pills: all / email / call / automation / document / note / task. Icon + color per type. Relative timestamps (`timeAgo`). Empty state per filter. Max 25 rows.
- **`src/app/api/todos/route.ts`** — `GET` (open todos, sorted urgent-first), `POST` (create todo with user_id from session).
- **`src/app/api/todos/[id]/route.ts`** — `PATCH` (complete, urgent toggle, text update), `DELETE`. Both scoped to authenticated user.
- **`src/app/api/pipeline/stats/route.ts`** — Pipeline stats API endpoint (for external use). Returns totalCount, totalVolume, stageCounts, MTD closed, next-30 projections, weekly trend, urgent flags.
- **`supabase/migrations/0016_create_todo_items.sql`** — `todo_items` table: id, created_at, updated_at, user_id (FK auth.users), text, is_complete, is_urgent, completed_at, related_loan_id (FK), related_contact_id (FK). RLS: user_id match. Indexes on user_id and (user_id, is_complete). Auto-update trigger on updated_at. **⚠️ NOT YET APPLIED — run in Supabase SQL Editor.**
- **recharts ^3.8.0** added to dependencies (`npm install recharts`).

### Changed

- **`src/app/dashboard/page.tsx`** — fully replaced. Previous version (stat cards + email drafts) is gone. All existing routes/layout unaffected.

### Notes

- Migration 0016 must be applied before TodoList component can persist tasks.
- All pipeline data pulls from `loans` table (existing data). Charts populate immediately for any user with loan records.
- Dashboard data is fetched server-side on page load — no client-side API calls except briefing (on demand) and todos.
- Design: dark zinc (zinc-950/900/800), gold accents (yellow-500/amber-500), IBM Plex Mono. Zero white backgrounds.

---

## [1.13.0] — 2026-03-13 — Refi Intake Email Automation

### Added

- **Refi Intake Email automation** — full 4-phase pipeline: (1) Next.js API route `/api/automations/refi-intake/route.ts` accepts IFW PDF via multipart/form-data, base64-encodes, calls Claude API with `anthropic-beta: pdfs-2024-09-25` to extract 9 fields; (2) `RefiIntakeModal` in `automations/page.tsx` — 5-phase state machine (upload → extracting → review → sending → success); (3) n8n workflow `n8n-workflows/refi-intake-email.json` — Webhook → Build Email (Code) → Outlook Draft → Supabase Log; (4) Workflow imported to n8n ID `yCTydQ7RfZK4DyUg`, webhook path `loanos-refi-intake`.
- **`/api/automations/refi-intake`** API route — PDF extraction via Claude. Returns `{ fields }` JSON with borrower name, loan amount, rate, P&I, total monthly, cash to close, lock period, escrow.
- **n8n workflow `yCTydQ7RfZK4DyUg`** — 4 nodes: Webhook (loanos-refi-intake) → Code (HTML email builder with 7-row loan summary table, cash back/cash to close logic, escrow waived/active row) → Outlook Draft (credential RkXvebinnei87gz4) → Supabase activity_log POST.

---

## [1.12.0] — 2026-03-13 — Arive Full Field Expansion + n8n Pipeline Rebuild

### Added

- **Migration 015** (`supabase/migrations/015_arive_full_field_expansion.sql`) — ~55 new columns across 8 sections + `loan_status_history` table. Sections: financial fields (hcltv, base_loan_amount, broker_fee, financed_fees, pi_payment, flood_insurance_monthly, hoa_dues, buydown, impound_waiver, prepay_penalty), loan product/structure (amortization_type, mortgage_type, refinance_type, cashout_purpose, documentation_type, lien_position, lock_status, compensation_type, interest_only, interest_only_term_months, arm_adjustment_period, arm_initial_fixed_months), admin/pipeline (status_date, adverse_reason, lender_nmls, lender_loan_number, crm_reference_id, deep_link_url, archive_indicator, processor_email, tbd_address), borrower extended (borrower_home_phone, borrower_work_phone, borrower_mailing_address, borrower_marital_status, borrower_preferred_language, first_time_homebuyer, borrower_applicant_type), property extended (property_units, property_unit_number, property_attachment_type), key dates TRID + appraisal + credit + HOI + title + timeline/closing (22 DATE columns), milestone dates+statuses (14 columns), agent FK references (buyer_agent_contact_id + listing_agent_contact_id → contacts.id). **NOT YET APPLIED to production Supabase — apply via SQL Editor.**
- **`loan_status_history` table** — `(id UUID PK, loan_id UUID FK→loans, arive_loan_id TEXT, old_status TEXT, new_status TEXT NOT NULL, changed_at TIMESTAMPTZ DEFAULT now(), source TEXT DEFAULT 'arive')`. Three indexes (loan_id, arive_loan_id, changed_at DESC). RLS enabled: authenticated users SELECT their own rows; service_role bypasses (no explicit INSERT policy needed for n8n).
- **`zapier_webhook_fields.md`** — 295-line canonical reference mapping every Arive webhook payload field to its Supabase `loans` column. Covers all sections of the payload. SSN exclusion rule documented. `_(not stored)_` fields documented with reasons.
- **WF1 rebuilt** (`1tagvoU0UXtdDiMY` — Arive New Loan → Supabase) — `specifyBody: "string"` bug fixed; migrated to `contentType: "raw"` + `rawContentType: "application/json"`. All ~90 Arive payload fields now mapped in the loan upsert body including all 55 new columns from migration 015.
- **WF2 rebuilt** (`9JyzzwKac8v3uQ7d` — Arive Status Update → Supabase) — All fields included. New `Log Status History` node: POSTs `{ loan_id, arive_loan_id, old_status, new_status }` to `loan_status_history` table after every status update. Node deduplication: 15→13 nodes (removed 2 duplicate `arl-w2-013` copies from prior test runs).

### Notes

- **Migration 015 NOT applied** — all new columns missing from production until applied. WF1 upserts will HTTP 400 on any new-loan webhook until then.
- E2E test sequence: (1) Apply migration 015 in Supabase SQL Editor, (2) trigger WF1 test → verify new fields in `loans`, (3) trigger WF2 test → verify `loan_status_history` row inserted.

---

## [1.11.0] — 2026-03-13 — Sprint 4+5: Global Search + Activity Feed + Kanban + Smart List Actions

### Added

- **GlobalSearch palette** (`src/components/GlobalSearch.tsx`) — ⌘K / Ctrl+K command palette. Fixed-position overlay (z-index 1000). 300ms debounced search with parallel Supabase `ilike` queries across `contacts` (name, email, phone) and `loans` (loan_name, borrower_name, status). Flat `allResults` array for unified ↑↓ keyboard navigation. Enter navigates to record. Esc closes. Empty state + "No results" state.
- **⌘K hint button** (`src/components/TopNav.tsx`) — Small ⌘K label in nav bar fires `document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))` to reuse GlobalSearch's existing listener — no duplicated open/close logic.
- **ActivityFeed bell** (`src/components/ActivityFeed.tsx`, `src/components/TopNav.tsx`) — 🔔 bell button inline in nav bar (position: relative). Gold unread badge shows count vs. `localStorage` key `loanos_activity_last_read`. Fetches last 50 `activity_log` rows on mount (badge populates immediately). Click opens 380px fixed slide-out panel from right edge. Panel open marks all read (updates localStorage timestamp). Backdrop click closes. `lastRead` initialized to `new Date(0).toISOString()` in state — real value loaded in `useEffect` (SSR safe).
- **Kanban pipeline view** (`src/app/dashboard/contacts/page.tsx`) — LIST | KANBAN toggle in contacts toolbar. `@hello-pangea/dnd` drag-and-drop board with 5 columns: Lead, Pre-App, Pre-Approved, In Process, Closed. Column headers show live contact counts. Drag fires Supabase PATCH to update contact `stage`. Board reads from same filtered/sorted contacts state as list view.
- **Smart list delete** (`src/app/dashboard/contacts/page.tsx`) — Trash2 icon visible on row hover. Confirmation modal ("Delete [Name]? This cannot be undone."). Confirmed delete removes from Supabase and local state.
- **Smart list edit** (`src/app/dashboard/contacts/page.tsx`) — Pencil icon visible on row hover. Opens slide-out edit panel pre-populated with contact fields. Save PATCHes Supabase and updates local state in-place.

### Notes

- No new Supabase migrations required.
- No new n8n workflow changes.
- `@hello-pangea/dnd` added as dependency for kanban board.

---

## [1.10.2] — 2026-03-13 — Sprint 3: Activity Log Data Integrity

### Improved

- **ActivityTab filter — Loans** (`src/app/dashboard/loans/[id]/page.tsx`) — Replaced static activity list with interactive All / System / Manual pill filter. System entries = actions containing a `.` (n8n dot-notation); manual = everything else. Live counts shown on each pill. Color-coded timeline dots: emerald for system, blue for manual. Empty state rendered when filter returns no results.
- **Metadata display — Loans ActivityTab** — Removed `.slice(0, 3)` hard cap; all metadata fields now shown. Expanded `INTERNAL_KEYS` Set to exclude `id` and `created_at` in addition to existing FK fields. Metadata displayed as `flex-wrap` tag row.
- **Cross-entity activity merge — Contacts** (`src/app/dashboard/contacts/[id]/page.tsx`) — `fetchActivity` now runs 3 Supabase queries: (1) activity rows where `contact_id = id`; (2) loans linked to this contact; (3) activity rows where `loan_id IN (linked loan IDs)`. Deduplicates by `row.id` via `Set<string>`. Net-new loan rows tagged with `_source: 'Loan: {loan_name}'`. Final array sorted by `created_at` descending.
- **Source badge — ActivityTimeline** (`src/components/ActivityTimeline.tsx`) — `ActivityLogRow` and `NormalizedEntry` types extended with `loan_id?` and `_source?`. `normalize()` passes `_source` through as `source` on `NormalizedEntry`. `TimelineEntry` renders `entry.source` as a slate-100 pill badge between the type label and the details toggle.
- **Type extension — ContactRecordView** (`src/app/dashboard/contacts/[id]/ContactRecordView.tsx`) — `ActivityEntry` type extended with `loan_id?: string | null` and `_source?: string`. Zero DB schema changes — both fields are client-side synthetic.

### Notes

- No new Supabase migrations required.
- No new build errors introduced (pre-existing errors in unrelated files remain unchanged).

---

## [1.10.1] — 2026-03-13 — Sprint 1 Audit Fixes (Bugs + UX)

### Fixed

- **Bug #1 — Closed Borrowers filter** (`contacts/page.tsx`) — Smart List filter changed from `'Closed Client'` to `'Closed'` to match actual DB stage values after Arive import.
- **Bug #2 — Last Touch timestamps** (`contacts/page.tsx`) — Raw ISO timestamps now formatted with `toLocaleDateString` for human-readable display.
- **Bug #3 — Lead status color** (`loans/page.tsx`) — Replaced Bloomberg gold `#C9A84C` styling with slate (`bg-slate-100 text-slate-700`) to match light theme.
- **Bug #4 — Duplicate phone columns** — Migration `014_consolidate_phone_columns.sql` copies `mobile_phone` → `phone_mobile` where null, then drops `mobile_phone`. Updated `contacts/page.tsx` and `ContactRecordView.tsx` to use only `phone_mobile`. Fixed resulting TS2300 duplicate identifier in Contact type.

### Added

- **UX #5 — Bulk actions bar** (`loans/page.tsx`) — Checkbox selection column, select-all toggle, floating emerald action bar with UPDATE STATUS dropdown and DELETE button. Matches contacts page pattern.
- **UX #6 — Inline file upload** (`loans/[id]/page.tsx`) — DocumentsTab now has inline upload button (hidden `<input type="file">` + `useRef`). Uploads to Supabase Storage `documents` bucket at `loans/{loanId}/{filename}` with `upsert: true`, inserts `documents` row, and calls `onRefresh`.

### Notes

- TypeScript compiles clean (`npx tsc --noEmit` — 0 errors).
- Migration 014 must be run in Supabase SQL Editor before deploying.

---

## [1.10.0] — 2026-03-13 — AI Outreach & Contact Management System

### Added

- **Floating Outreach Chat Widget** (`src/components/outreach/OutreachChat.tsx`) — bottom-left chat panel on every page, dark theme with gold (#C9A84C) accent. Handles 5 command types: Quick Add, Bulk Email, Bulk Text, Bulk Admin, General Chat.
- **Chat Command Parser** (`src/lib/chat-command-parser.ts`) — regex-based classifier routes natural language into `CommandType` enum. Extracts contact fields (name, email, phone, stage, contact_type, referred_by, company, source) from freeform text.
- **Quick Add Contact API** (`src/app/api/contacts/quick-add/route.ts`) — creates contacts in Supabase with confirmation flow, duplicate detection by email/phone, referrer lookup, and activity logging. Uses Adam's Salesforce defaults.
- **Bulk Action API** (`src/app/api/contacts/bulk-action/route.ts`) — handles `update_stage`, `update_type`, and `delete` for selected contacts with activity logging.
- **Outreach API** (`src/app/api/outreach/route.ts`) — Claude-powered (`claude-sonnet-4-5`) general chat + email/text content generation with Adam's business context as system prompt.
- **Outreach Chat Context** (`src/components/outreach/OutreachChatContext.tsx`) — React context sharing selected contacts between contacts page and chat widget via `openWithContacts()`.
- **Native App Links** (`src/lib/native-app-links.ts`) — deep link helpers for iMessage (`sms:`) and Outlook (`mailto:`).
- **OUTREACH button** on contacts page bulk action bar — maps selected contacts to lean `SelectedContact` type and opens chat widget.
- **Root layout wired** — `OutreachChatProvider` + `<OutreachChat />` added to `src/app/layout.tsx`.

### Fixed

- **TopNav.tsx** — removed unused `Link` import from `next/link` (pre-existing lint error).

### Notes

- Requires `ANTHROPIC_API_KEY` in Vercel env vars before outreach API will work in production.
- Build passes clean. All ESLint errors resolved.

---

## [1.9.3] — 2026-03-12 — Arive → LoanOS Live Sync via Zapier

### Fixed

- **`contacts.email` UNIQUE constraint added** — required for PostgREST upsert `ON CONFLICT (email)`. Previously missing, causing all Arive → n8n → Supabase upserts to fail with `there is no unique or exclusion constraint matching the ON CONFLICT specification`.
  - Duplicate contacts cleaned up first (`DELETE ... WHERE id NOT IN (SELECT DISTINCT ON (email) id ...)`)
  - Constraint applied: `ALTER TABLE contacts ADD CONSTRAINT contacts_email_unique UNIQUE (email)`

### Added

- **Zapier Zap 1 — Arive New Loan → LoanOS**: Arive native OAuth trigger (New Loan) → Webhooks by Zapier POST → `https://styer.app.n8n.cloud/webhook/arive-new-loan`. Posts all Arive loan fields as JSON. Published and live.
- **n8n webhook auth removed**: Webhook node on workflow `1tagvoU0UXtdDiMY` changed from "Arive Webhook Secret" to None — required for Zapier to POST without auth header. Curl test confirms 200 response.

### Notes

- Direct Arive Hooks API registration was not viable — Arive's API subdomains all returned 403/404 for auth endpoints; API Integrations page is Zapier-OAuth-only. Zapier bridge is the correct long-term approach.
- Zap 2 (Arive Milestone Updated → update loan record) not yet built — needs new n8n workflow at path `arive-milestone-update`.

---

## [1.9.2] — 2026-03-12 — Salesforce CSV → Supabase Loan Backfill

### Data

- **Salesforce backfill script** (`/tmp/backfill_salesforce_loans.py`) — UPDATE-only, Python stdlib, no pip installs
  - Source CSV: `/Users/adamstyer/Downloads/report1773324509305.csv` (817 rows, Salesforce export)
  - Match strategy: (1) `arive_loan_id` = "Loan # (1st TD)"; (2) fallback: `borrower_name` + `closing_date`
  - 31 CSV columns mapped; schema discovery via `select=*&limit=1` preflight (handles missing columns gracefully)
  - Only fills NULL/empty Supabase fields — never overwrites existing values
  - **Results**: 817 rows → 532 loans updated, 9 errors (all `409 Conflict` on `arive_loan_id` unique constraint)
    - 8 errors: Salesforce/Excel exported large loan numbers as `2E+11` scientific notation
    - 1 error: true duplicate `arive_loan_id = 13013` already in DB
  - Primary impact: `arive_loan_id` now populated on ~532 previously-null loan records

## [1.9.1] — 2026-03-12 — Arive Webhook Next.js Route + Email Draft Logging

### Added

- `src/app/api/arive-webhook/route.ts` — Next.js App Router port of `netlify/functions/arive-webhook.js`; validates `X-Webhook-Secret`, upserts contact (on email) and loan (on `arive_loan_id`/`loan_number`) via Supabase REST, inserts `activity_log`, returns `{ success, contact_id, loan_id, arive_loan_id, loan_number }`. n8n `arive-to-supabase` workflow can now target `/api/arive-webhook` instead of the Netlify function.
- Email drafts infrastructure:
  - `supabase/migrations/013_email_drafts.sql` — creates `email_drafts` table (`automation_name`, recipient fields, subject, `body_html`, `body_preview`, `status` enum pending/sent/discarded, optional `contact_id`/`loan_id`/`outlook_draft_id`, timestamps + trigger, indexes, RLS service-role only).
  - `src/lib/supabase/logEmailDraft.ts` — helper to log an automation-created Outlook draft to `email_drafts` (plain-text preview derived from HTML).
  - `src/app/api/email-drafts/route.ts` — GET (recent drafts by status) + PATCH (update status) API for dashboard/preview UI.
- Supabase client hardening:
  - `src/lib/supabase/client.ts` and `src/lib/supabase/server.ts` — both now read `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` into locals and throw a clear error if either is missing; avoids opaque runtime failures during build/prerender.

### Fixed

- `src/components/ActivityTimeline.tsx` — TypeScript clean-up: `ActivityLogRow` allows nullable DB-backed fields (`entity_type`, `metadata`, `type`, `summary`, `raw_payload`, `external_id`); `metadata` narrowed to `Record<string, unknown>` and `meta.subject`/`note`/`description` only used when `typeof === 'string'`; resolves Netlify TS errors while preserving normalize logic.
- Outlook/Settings lint issues: `src/app/api/outlook-disconnect/route.ts` and `src/app/dashboard/settings/page.tsx` now use typed, parameterless `catch` branches (no `any`, no unused vars); `ContactRecordView.tsx` removed unused `fmtDateTime` helper. ESLint passes cleanly in CI.

---

## [1.9.0] — 2026-03-12 — ARIVE Webhook Integration + DB Expansion + Contact Detail Improvements

### Added

**Supabase DB Migrations**
- `supabase/migrations/011_loans_expansion.sql` — expands `loans` table with ~50 ARIVE fields: borrower/co-borrower, loan terms (rate, APR, points, LTV/CLTV, down payment), property details, milestone dates (application/submission/approval/closing/funding/rate-lock/estimated-closing), financials (PITI, cash-to-close, closing costs, MI), qualifying (credit score, DTI, monthly income), parties (referring agent, listing/buyer agent, title, escrow, processor, UW, lender), lead source, notes, ARIVE timestamps; adds UNIQUE constraint on `arive_loan_id`
- `supabase/migrations/012_contacts_expansion.sql` — adds to `contacts`: `created_date`, `last_activity_date`, `notes`, `phone_mobile`, `mailing_street`, `mailing_city`, `mailing_state`, `mailing_zip`, `mailing_country`, `title`

**Arive Webhook**
- `netlify/functions/arive-webhook.js` — Netlify serverless function; validates `X-Webhook-Secret`; upserts contact (on `email`) with borrower name/phone/group/stage/source/type; upserts loan (on `arive_loan_id` or `loan_number`) with full camelCase ARIVE payload mapped to all expansion columns; inserts `activity_log` row with `action: 'arive_sync'`; raw fetch to Supabase REST (no SDK)

**Jungo CSV Backfill Script**
- `scripts/backfill-jungo-contacts.js` — one-time Node.js script; reads Jungo/Salesforce CSV export; matches contacts by email (case-insensitive); only fills NULL/empty DB fields — never overwrites existing data; supports `--headers` flag to inspect CSV columns before running; env vars from `.env.local`

**Contact Detail View**
- `ContactRecordView.tsx` — extended `Contact` type with 5 new fields (`mailing_country`, `phone_mobile`, `title`, `created_date`, `last_activity_date`); added `phone_mobile` display row in CONTACT INFO card labeled "Mobile"; added `onSaveNotes` prop; replaced static notes preview card with inline editable textarea — save-on-blur, shows "Saving…"/"Saved" status, no button
- `contacts/[id]/page.tsx` — added `handleSaveNotes` function (updates DB + local state); wired `onSaveNotes={handleSaveNotes}` into `<ContactRecordView />`

### Go-Live Steps
- [ ] Run `011_loans_expansion.sql` in Supabase SQL Editor
- [ ] Run `012_contacts_expansion.sql` in Supabase SQL Editor
- [ ] Set Netlify env vars: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ARIVE_WEBHOOK_SECRET`, `LOANOS_SYSTEM_USER_ID`
- [ ] Configure ARIVE webhook to POST to `https://<site>.netlify.app/.netlify/functions/arive-webhook` with `X-Webhook-Secret` header

---

## [1.8.0] — 2026-03-11 — Loan Milestone Agent + Daily Briefing Agent

### Added

**Agent 5 — Loan Milestone Communication Agent**
- `supabase/migrations/010_milestone_agents.sql` — `loan_milestone_events` table (id, loan_id, milestone, triggered_at, raw_payload), `milestone_communications` table (id, event_id FK, recipient_type, draft_pushed, pushed_at, subject, body_preview), `last_touch TIMESTAMPTZ` on contacts; CHECK constraint on 7 milestone values; partial index on `draft_pushed = false`
- `src/app/api/agents/milestone/route.ts` — POST handler; validates loan_id + milestone; two Claude calls (`claude-sonnet-4-5`, max_tokens: 512) — borrower warm tone + realtor professional, both return `{subject, body}` JSON; pushes Outlook drafts via `ZAPIER_DISPATCH_WEBHOOK_URL`; logs to both new tables
- `docs/agents-n8n-setup.md` — full setup guide for both agents; required env vars table; DB table reference

**Agent 1 — Daily Command Center**
- `src/app/api/agents/daily-briefing/route.ts` — GET handler; 5 parallel Supabase queries via `Promise.allSettled` (overdue_leads, closing_this_week, recently_uploaded_docs, recent_milestones, unread_messages); single Claude call (`claude-sonnet-4-5`, max_tokens: 1024) → `top7` prioritized actions + `summary`; strips markdown fences before JSON.parse
- `src/app/dashboard/briefing/page.tsx` — `'use client'` checklist page; stat row (4 cards), progress bar, priority checklist with toggle, loading skeleton; light theme (slate-50, emerald-600 accent)
- `src/app/dashboard/SidebarNav.tsx` — added `Brain` import from lucide-react; added Daily Briefing as first nav entry

### Environment Variables to Add (Vercel — loanos repo)
- `ZAPIER_DISPATCH_WEBHOOK_URL` — Zapier → Outlook draft creation webhook (Agent 5)
- `MILESTONE_WEBHOOK_SECRET` — shared secret validating n8n → /api/agents/milestone calls

### Go-Live Steps
- [ ] Run `010_milestone_agents.sql` in Supabase SQL Editor
- [ ] Add `ZAPIER_DISPATCH_WEBHOOK_URL` + `MILESTONE_WEBHOOK_SECRET` to Vercel env vars
- [ ] Configure n8n webhook to POST to `/api/agents/milestone` on Arive milestone events

---

## [1.7.3] — 2026-03-11 — AI Chat Contact Context + Clear Button Fixes

### Fixed
- `src/app/api/chat/route.ts` — contact SELECT was querying 7 non-existent columns (`mobile_phone`, `lead_source`, `referred_by`, `company_name`, `last_touch`, `top_realtor`, `target_realtor`), causing Supabase to return an error and the system prompt to fall back to generic with no contact data. Removed all 7 columns and cleaned up the prompt template to match actual schema.
- `src/components/crm/LoanOSChat.tsx` — clear button called `setHistoryLoaded(false)`, which recreated the `loadHistory` useCallback (it's in its dependency array), triggering the `useEffect([isOpen, loadHistory])` to re-fetch from Supabase. Removed the call — `setSessionId(null)` is sufficient to ensure the next message creates a fresh session.

## [1.7.2] — 2026-03-11 — AI Chat System Prompt Schema Expansion

### Changed
- `src/app/api/chat/route.ts` — `buildSystemPrompt` expanded for both record types to include all available schema columns

**Contact prompt** — added 6 fields: `realtor_email`, `realtor_phone`, `mailing_street/city/state/zip` (assembled into mailing address), `group_tag`, `source`; associated loan block now also fetches `interest_rate`, `closing_date`, `est_closing_date`, `sales_price`, `buyer_agent_name`

**Loan prompt** — added 14 fields: `sales_price` (purchase price), `interest_rate`, `down_payment_pct`, `estimated_ltv`, `seller_concessions`, `county`, `closing_date`, `est_closing_date` (fallback), `effective_date`, `title_company`, `buyer_agent_name/email/brokerage`, `listing_agent_name/email`; `borrowerName` now prefers `data.borrower_name` (loans table) over contact join

**Omitted (confirmed not in schema)**: `processor`, `days_in_stage`, `last_activity`, `notes` (spec desired but no migration added these columns)

## [1.7.1] — 2026-03-11 — AI Chat Bug Fixes

### Fixed
- `src/app/api/chat/route.ts` — corrected model ID from `claude-sonnet-4-20250514` to `claude-sonnet-4-5` (date suffix was causing API failures)
- `src/components/crm/LoanOSChat.tsx` — fixed silent failure: API error responses (non-2xx or `data.error`) now show "Error: assistant unavailable. Try again." in chat instead of silently dropping; previously `if (data.message)` would pass when API returned `{error: '...'}` with no visible feedback
- `src/components/crm/LoanOSChat.tsx` — updated quick action text to match spec (contact: check-in email, next action, text message, summarize; loan: what needs attention, realtor update email, days until close, borrower status update)
- `src/components/crm/LoanOSChat.tsx` — header now shows both `recordName` and `recordType` (was showing one or the other)

## [1.7.0] — 2026-03-11 — AI Chat Integration

### Added

**Supabase Migration**
- `supabase/migrations/009_chat_sessions.sql` — creates `chat_sessions` table (`id uuid`, `record_id text`, `record_type text check in ('contact','loan')`, `messages jsonb`, `created_at`, `updated_at`); index on `(record_id, record_type)`; RLS enabled; auto-update trigger on `updated_at`

**API Route**
- `src/app/api/chat/route.ts` — POST + GET handlers for AI chat assistant
  - POST: builds system prompt from live Supabase record (contact joins loans, loan joins contacts), calls Claude API (`claude-sonnet-4-5`, `max_tokens: 1024`), upserts `chat_sessions` (update if sessionId exists, insert otherwise)
  - GET: returns most recent `chat_sessions` row for a given record (`recordId` + `recordType` query params)
  - Uses inline service role client (`getServiceClient()`) — bypasses RLS, never exposed to browser
  - System prompt identity: LoanOS Assistant for Adam Styer, direct and record-specific

**Component**
- `src/components/crm/LoanOSChat.tsx` — self-contained floating chat UI
  - Props: `{ recordId, recordType: 'contact'|'loan', recordName }`
  - Fixed 52×52 gold `◈` trigger button (bottom-right corner)
  - 380×560px dark panel (IBM Plex Mono, `#C9A84C` accent, `#0f0f0f`/`#1a1a1a` surface)
  - Quick actions per record type (4 each), history loads on first open, clear chat button
  - Enter sends / Shift+Enter newline, auto-resize textarea, `historyLoaded` guard prevents duplicate fetches

### Dependencies
- `@anthropic-ai/sdk ^0.78.0` — added to package.json

### Wired Into Record Views
- `src/app/dashboard/contacts/[id]/ContactRecordView.tsx` — `LoanOSChat` imported and rendered with `recordId={contact.id}`, `recordType="contact"`, `recordName={fullName(contact)}`
- `src/app/dashboard/loans/[id]/page.tsx` — `LoanOSChat` imported and rendered with `recordId={loanId}`, `recordType="loan"`, `recordName={displayName}`

### Environment Variables
- `ANTHROPIC_API_KEY` — add to Vercel env vars for loanos repo

---

## [1.6.1] — 2026-03-11 — Deploy Platform Switch

### Changed
- Deployment moved from Netlify to Vercel

---

## [1.6.0] — 2026-03-10 — Outlook Email Integration

### Added

**Netlify Functions**
- `netlify/functions/outlook-auth.js` — initiates Microsoft OAuth2 flow; generates CSRF state, redirects to Azure authorize endpoint
- `netlify/functions/outlook-callback.js` — handles OAuth callback; exchanges code for tokens, stores in `outlook_tokens` table
- `netlify/functions/outlook-refresh.js` — exports `getValidAccessToken(email)` with 5-minute buffer refresh logic; standalone HTTP handler for status checks
- `netlify/functions/outlook-sync.js` — fetches inbox + sent items from Graph API (`@odata.nextLink` pagination), matches emails to contacts by address, deduplicates via `external_id`, logs to `activity_log`

**Supabase Migration**
- `supabase/migrations/008_outlook_integration.sql` — creates `outlook_tokens` table; extends `activity_log` with `type`, `summary`, `raw_payload`, `external_id` columns; adds `external_id` unique index for deduplication

**UI**
- `src/components/ActivityTimeline.tsx` — dual-schema normalize (legacy `action`/`metadata` + new `type`/`summary`/`raw_payload`); icon by type (email/doc/call/note/activity); relative timestamps; expandable JSON detail; 20/page pagination
- `src/app/dashboard/settings/page.tsx` — Outlook integration card: Connect, manual Sync Now, Disconnect; shows token status + expiry
- `src/app/dashboard/SidebarNav.tsx` — added Settings nav entry with Settings icon

**API Routes**
- `src/app/api/outlook-status/route.ts` — GET; queries `outlook_tokens`; returns `{connected, email, expires_at, token_valid}`
- `src/app/api/outlook-disconnect/route.ts` — POST; deletes all rows from `outlook_tokens`

**n8n**
- `n8n/outlook-sync-workflow.json` — 15-minute schedule → POST to `outlook-sync` Netlify function with `x-sync-secret` header → IF node → log stats or log error

**Docs & Scripts**
- `docs/outlook-azure-setup.md` — step-by-step Azure app registration guide
- `scripts/test-outlook-sync.js` — CLI test runner: env check, token status, refresh check, sync trigger, recent activity query; supports `--status`, `--sync`, `--refresh` flags

### Changed

- `src/app/dashboard/contacts/[id]/ContactRecordView.tsx` — imports `ActivityTimeline`; extended `ActivityEntry` type with new columns; replaced inline activity rendering with `<ActivityTimeline rows={activity} />`
- `src/app/dashboard/contacts/[id]/page.tsx` — `fetchActivity` selects new columns (`type`, `summary`, `raw_payload`, `external_id`); limit increased 100→200
- `.env.local` — added Microsoft/Outlook env var placeholder block (7 vars)

### Architecture

```
Outlook 365 inbox + sent
        ↓ Graph API (15-min poll)
netlify/functions/outlook-sync.js
        ↓ match contact by email address
supabase: activity_log (external_id deduplication)
        ↓ render
ActivityTimeline component (contact profile → Activity tab)
```

---

## [1.5.0] — 2026-03-10 — Arive Direct Webhook (Netlify Function + n8n Orchestrator)

### Added

**Netlify Function: `netlify/functions/arive-webhook.js`**
- Receives Arive loan events, validates `X-Webhook-Secret` header
- Upserts contact (on `email`) and loan (on `arive_loan_id`) via Supabase REST API
- Inserts `activity_log` row per event
- Returns `{ success, contact_id, loan_id, arive_loan_id }` on 200
- No SDK dependency — raw `fetch` only

**n8n Workflow: `n8n/workflows/arive-to-supabase.json`**
- 7-node orchestrator: Arive Webhook → Forward to Netlify Function → IF 200 → Respond OK / (else) Build Error Context → Send Outlook Alert (Zapier) → Respond 500
- `neverError: true` on HTTP node enables proper branching on non-2xx
- Error branch sends Outlook alert via Zapier webhook and responds 500 so Arive retries
- Webhook path: `arive-sync`

### Changed

- `netlify.toml` — added `[functions]` block: `directory = "netlify/functions"`, `node_bundler = "nft"`
- `scripts/test-webhooks.js` — full rewrite with real Arive field names (`ariveLoanId`, `loanBorrower1_emailAddressText`, `keyDates_*`, etc.); supports `--netlify` and `--n8n` flags
- `.env.local.example` — fully documented (7 required vars with explanations)
- `README.md` — replaced Next.js boilerplate with project README including 6-step Arive Webhook Setup guide, env vars table, n8n workflow table, Netlify function table, migration table

### Architecture

```
Arive (loan event)
  └─► n8n: arive-to-supabase workflow (path: arive-sync)
        └─► POST /.netlify/functions/arive-webhook
              ├─► upsert contacts (on email)
              ├─► upsert loans (on arive_loan_id)
              ├─► insert activity_log
              └─► 200 { success, contact_id, loan_id }
        └─► IF not 200 → Outlook alert via Zapier + respond 500 (Arive retries)
```

---

## [1.4.0] — 2026-03-10 — Two New n8n Automations: Review Request + Social Post

### Added

**Workflow 1 — Closed Loan Review Request Email** (`automations/workflow-1-closed-loan-review-request.json`)
- n8n ID: `AK1fBcaX1cPcdlGx`
- Trigger: every 30 minutes (scheduled)
- Logic: fetches loans where `closing_date <= now() - 2 days` and no prior `review_request` log entry; sends branded HTML email with Google + Zillow review links; logs to `automation_logs`
- 5 nodes: scheduleTrigger → code (fetch loans + contacts) → code (build HTML email) → emailSend → httpRequest (log)
- Hardcoded: `supabaseUrl`, `fromEmail: adam@styermortgage.com`
- Remaining placeholders: `YOUR_SUPABASE_SERVICE_ROLE_KEY`, `YOUR_GOOGLE_REVIEW_URL`, `YOUR_ZILLOW_REVIEW_URL`, `REPLACE_WITH_SMTP_CRED_ID`

**Workflow 2 — Weekly Testimonial Social Post** (`automations/workflow-2-weekly-testimonial-post.json`)
- n8n ID: `eJG4wckrj6SmSpm1`
- Trigger: Mondays at 9am CT (cron: `0 9 * * 1`, timezone: `America/Chicago`)
- Logic: reads random unused testimonial from Google Sheet → Gemini 1.5 Flash generates caption → Imagen 3 generates quote card image (base64) → uploads to Supabase Storage `social-assets` bucket → Publer posts to Instagram + LinkedIn + Facebook → marks sheet row used → logs to `automation_logs`
- 10 nodes: scheduleTrigger → googleSheets (read) → code (random select) → httpRequest (Gemini caption) → code (extract + build prompt) → httpRequest (Imagen) → code (upload to Supabase Storage) → httpRequest (Publer post) → googleSheets (mark used) → httpRequest (log)
- Hardcoded: Sheet ID `1W9NRB2H8u0cjctCueXh7VYgL27m5vLLFJfONepNWixk`, `supabaseUrl`, `supabaseStorageBucket: social-assets`, Publer API key + 3 account IDs (Instagram, LinkedIn, Facebook)
- Remaining placeholders: `YOUR_GEMINI_API_KEY`, `YOUR_SUPABASE_SERVICE_ROLE_KEY`, `REPLACE_WITH_GOOGLE_SHEETS_CRED_ID` (both sheets nodes)

**Supabase Infrastructure**
- `automation_logs` table created (SQL Editor): `id uuid PK`, `type text`, `loan_id uuid`, `testimonial_id text`, `platform text`, `sent_at timestamptz`, `posted_at timestamptz`, `created_at timestamptz`. RLS disabled. Indexes on `type` and `loan_id`.
- `social-assets` Supabase Storage bucket created as **PUBLIC** — images must be publicly accessible for Publer to fetch them

### Notes
- n8n Variables feature NOT available on Adam's plan (403 `feat:variables`) — all credentials hardcoded directly in workflow JSON
- Both JSONs validated with `node -e "JSON.parse(...)"` — no `$env` refs remain
- Both workflows imported to n8n via `POST /api/v1/workflows` API
- Both workflows are **inactive** until credentials are filled in and Adam activates them

### Pending Manual Steps to Activate
1. Get `SUPABASE_SERVICE_ROLE_KEY` from Supabase → Settings → API → service_role
2. Get `GEMINI_API_KEY` from aistudio.google.com
3. Get Google Review URL + Zillow Review URL
4. Set up SMTP credential in n8n (for workflow 1 emailSend node)
5. Set up Google Sheets OAuth2 credential in n8n (for workflow 2 both sheets nodes)
6. Update both workflow JSONs with real values, re-import via PUT `/api/v1/workflows/{id}`
7. Activate both workflows in n8n dashboard

---

## [1.3.0] — 2026-03-10 — 816 Arive Loans Imported + Backfilled

### Added
- 816 loans imported from full Arive CSV export (`report1773124619094.csv`, 31 columns) via Python import script
- Contact matching: 98% match rate (806/816 loans linked to existing contacts by borrower name)
- Raw payload stored in `raw_payload` JSONB for future re-extraction
- Backfill script parsed double-encoded raw_payload → 24 typed columns: status, loan_name, property_city, property_state, loan_program, occupancy, lender, investor, term_months, ltv, monthly_payment, purchase_price, property_type, property_zip, lock_date, commissions, hazard_insurance, mortgage_insurance, property_tax, escrow_agent, closing_date, title_company, buyer_agent_name, listing_agent_name

### Fixed
- **Auth client bug** in `loans/page.tsx` and `loans/[id]/page.tsx` — was using bare `createClient` from `@supabase/supabase-js` (no auth session → RLS blocked all rows). Switched to `createClient` from `@/lib/supabase/client` (SSR-aware `createBrowserClient` from `@supabase/ssr`)
- **Smart list status coverage** — added all Arive status values to `SMART_LISTS` constant: `Loan in Process`, `processing`, `Pre-Approved`, `QUALIFICATION`, `DISCLOSURE_SENT` → In Process; `lead`, `APPLICATION_INTAKE` → Started; `Suspended` → Cancelled
- **StatusBadge color mapping** — added Arive-specific status values to color matching: `pre-approved`, `qualification`, `disclosure_sent` → blue; `lead`, `application_intake` → amber; `suspended` → red
- Removed unused imports (`FileText`, `Activity`, `StickyNote`) from `ContactRecordView.tsx` (lint auto-fix)

### Manual Steps Completed (Supabase)
- ✅ Combined migration 003 + 006 applied — adds 30+ columns to loans table, activity_log FK columns, 7 indexes
- ✅ 816 loans backfilled from raw_payload via REST API with service_role_key

---

## [1.2.0] — 2026-03-09 — Arive → Supabase n8n Integration

### Added
- `supabase/migrations/007_arive_integration.sql` — idempotent migration. Adds to contacts: `mailing_street`, `mailing_city`, `mailing_state`, `mailing_zip`, `group_tag`, `stage` (idempotent — already exists), `source`. Attempts `contacts_email_unique` UNIQUE CONSTRAINT (warns but doesn't fail if duplicate emails block it). Adds to loans: `arive_loan_id TEXT UNIQUE`, `first_payment_date DATE`, `est_closing_date DATE`, `funding_date DATE`, `sales_contract_date DATE`, `raw_payload JSONB`. Creates indexes: `idx_loans_arive_loan_id`, `idx_contacts_email`, `idx_contacts_source`.
- `n8n/workflows/workflow-1-new-loan.json` — importable n8n workflow (10 nodes). Receives Arive POST on new loan creation. Upserts contact by email, upserts loan by `arive_loan_id`, logs `action: 'loan_created'` to activity_log. Returns 200. Error Trigger catches failures and logs `action: 'arive.webhook.error'`.
- `n8n/workflows/workflow-2-status-update.json` — importable n8n workflow (12 nodes). Receives Arive POST on loan status change. Finds loan by `arive_loan_id`. If found: PATCHes status + date fields, logs `action: 'loan_status_updated'`, returns 200. If not found: logs `action: 'error_loan_not_found'`, returns 404.
- `n8n/README.md` — 9-step setup guide: run migration, find system user UUID, configure n8n credentials (Header Auth for Arive secret, Header Auth for Supabase service key), set `LOANOS_SYSTEM_USER_ID` env var, import both workflows, configure Error Trigger workflow ID, get webhook URLs, configure Arive, test with script. Includes Arive field mapping table and troubleshooting section for 5 failure modes.
- `scripts/test-webhooks.js` — Node.js test runner (no external dependencies, uses native fetch). Sends POST to `arive-new-loan` with realistic fake payload, waits 2s, sends POST to `arive-status-update` using same `arive_loan_id`. Logs responses. Prints pass/fail summary. Exits 0 on all-pass, 1 on any failure. Reads `N8N_WEBHOOK_BASE_URL` + `ARIVE_WEBHOOK_SECRET` from env.
- `.env.example` — documents all required env vars: `SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`, `N8N_WEBHOOK_BASE_URL`, `ARIVE_WEBHOOK_SECRET`, `LOANOS_SYSTEM_USER_ID` (n8n internal), `NEXT_PUBLIC_SUPABASE_URL`.

### Notes
- Runs **parallel to existing Zapier/Salesforce flows** — zero overlap
- All existing n8n workflows untouched
- Pattern matches established codebase convention: `httpRequest` nodes (not `n8n-nodes-base.supabase`), `apikey` Header Auth credential name, `action` column in activity_log, Supabase URL `https://uuqedsvjlkeszrbwzizl.supabase.co`
- Migration 007 is next after existing 006 — migrations 001-006 were already live
- `loans_arive_loan_id_unique` UNIQUE constraint is safe to add — all existing loans have NULL `arive_loan_id` (PostgreSQL UNIQUE allows multiple NULLs)
- Manual step required: run migration 007 in Supabase SQL editor before importing workflows

---

## [1.1.1] — 2026-03-09 — Automations: Loan-picker + webhook loan_id passthrough

### Changed
- `src/app/dashboard/automations/page.tsx` — five-edit update:
  - **Edit 1**: Added `useEffect` to imports; `supabase = createClient()` module-level singleton
  - **Edit 2**: Added `LoanOption` interface (`{ id: string; label: string }`)
  - **Edit 3**: `TriggerModal` — accepts `loanId: string | null`; appends to PDF `FormData` and JSON body before n8n POST
  - **Edit 4**: `AutoCard` — added `loans: LoanOption[]` + `onTrigger: (loanId: string | null) => void` props; renders "Run for loan…" `<select>` dropdown above Trigger button
  - **Edit 5**: `AutomationsPage` — added `activeLoanId` + `loans` state; `useEffect` fetches top 200 loans on mount (ordered by `closing_date desc`); plumbed `loans` + `onTrigger` into `AutoCard`, `loanId` + reset into `TriggerModal`

---

## [1.1.0] — 2026-03-10 — Contacts: Inline Stage Edit + Smart Lists v2 + Bulk Actions

### Changed
- `src/app/dashboard/contacts/page.tsx` — full rewrite (879 lines). Three major feature additions:

**Feature 1 — Inline Stage Editing**
- Every Stage cell is now clickable → opens `<select>` dropdown with 8 canonical stages in-place
- `handleStageChange()` — optimistic UI: removes contact from current list if new stage maps to a different Smart List, otherwise updates local state immediately. Supabase write + count refresh follow.
- `autoFocus` + `onBlur` pattern on select — no extra editing state needed beyond `editingStageId`
- `e.stopPropagation()` on stage badge click + select prevents row-click from opening slide-out panel
- Stage dropdown in slide-out edit panel updated to use same canonical STAGES list

**Feature 2 — Smart List Restructure**
- `STAGES` canonical array: Lead, Pre-App, Application, Pre-Approved, In Process, Closing, Closed, Other
- `STAGE_TO_LIST` record + `stageToList(stage, contactType)` as single source of truth
- Smart List mapping: Lead/Pre-App/Application → new-apps, Pre-Approved → active, In Process/Closing → in-process, Closed → closed, Other → unassigned
- "Everyone Else" replaced by **"Unassigned / Other"** — query: `.or('contact_type.eq.other,contact_type.is.null,and(contact_type.eq.borrower,stage.is.null)')` — catches type=other, null type, and borrowers with null stage without including realtors
- `fetchCounts` updated to use same Supabase OR pattern for unassigned count; all keys updated to match new list IDs
- `setSelectedIds(new Set())` called on list switch + every `fetchContacts()` to clear stale selection

**Feature 3 — Bulk Actions**
- Checkbox `<th>` + `<td>` added as first column in table. Select All in header toggles all visible contacts.
- `selectedIds: Set<string>` state for O(1) membership checks
- `toggleSelect(id, e)` + `toggleSelectAll()` handlers
- Floating action bar (position:fixed, bottom:24px) renders when `someSelected` — buttons: UPDATE STAGE, UPDATE TYPE, ASSIGN REFERRED BY, DELETE, ✕ (clear)
- Bulk action modal: stage dropdown / type dropdown / referred_by text input; `handleBulkUpdate()` patches all selected IDs in one Supabase `.in()` call
- Delete confirmation modal with irreversibility warning; `handleBulkDelete()` deletes + refreshes
- Row background highlighted when selected

---

## [1.0.9] — 2026-03-09 — UI Redesign: Bloomberg Dark → Linear/Attio Light Mode

### Changed
- `src/app/globals.css` — full palette swap: `--bg: #F9FAFB`, `--surface: #FFFFFF`, `--border: #E2E8F0`, `--text: #0F172A`, `--muted: #64748B`, `--accent: #059669`. Legacy `--gold` and `--green` remapped to `#059669` for backward compat. Google Fonts changed from Bebas Neue + IBM Plex Mono/Sans to Inter only.
- `src/app/dashboard/layout.tsx` — sidebar: `bg-white border-r border-slate-200`, `"OS"` logo accent `text-emerald-600`, clean `text-slate-900` wordmark.
- `src/app/dashboard/SidebarNav.tsx` — full rewrite: lucide-react icons per nav item (LayoutDashboard, Users, Upload, Zap, BarChart2, CheckSquare, GitBranch); active state `bg-emerald-50 text-emerald-600 border-l-2 border-emerald-600`; sentence-case labels; no uppercase/monospace.
- `src/app/dashboard/SignOutButton.tsx` — light-mode styles: `text-slate-500 hover:text-slate-900 border-slate-200 hover:border-slate-300`; `w-full` to fill sidebar footer.
- `src/app/dashboard/page.tsx` — full rewrite: white card-on-canvas stat grid (`bg-white rounded-lg border border-slate-200 shadow-sm`), `text-4xl font-bold text-slate-900` numbers, pill status bar (`bg-emerald-50 border-emerald-200` with `animate-pulse` dot), emerald primary CTA button.
- `src/app/dashboard/automations/page.tsx` — full rewrite: all `rgba(201,168,76,...)` gold replaced with emerald equivalents; `TriggerModal` converted to Tailwind (`bg-black/50` overlay, `border-l-4 border-l-emerald-500`); `AutoCard` left accent `bg-emerald-500`, status badge `bg-emerald-50 border-emerald-200 text-emerald-700`; pipeline step nodes `border-emerald-300 bg-emerald-50 text-emerald-600`; `flow-dot` keyframe `background: #059669`; card hover `hover:shadow-md hover:border-slate-300` (no gold glow); Bebas Neue headers replaced with `text-2xl font-semibold tracking-tight`.

### Added
- `lucide-react@^0.577.0` — installed as dependency for sidebar icons

---

## [1.0.8] — 2026-03-09 — Build Tracker Update + Session Rules

### Changed
- `public/docs/loanos.html` — Phase 2 roadmap updated: added 5 new completed items (Referral Intro Email, Automations Dashboard, Marketing Command Center, Contacts Module rewrite, Salesforce Import). `taskChecks` marks items 1-0 through 1-9 done. Items 1-10 (Rate update publisher) and 1-11 (Activity auto-log) remain unchecked.
- `CONTEXT.md` — added rule: always update build tracker at end of every session (mark completed tasks + add new items not on roadmap).

## [1.0.7] — 2026-03-09 — Closed Clients + Import Feature

### Added
- `supabase/migrations/005_closed_clients_columns.sql` — idempotent migration: adds `salesforce_id TEXT UNIQUE`, `closing_date DATE`, `realtor_email TEXT`, `realtor_phone TEXT` to contacts; adds `interest_rate NUMERIC(6,4)`, `borrower_name TEXT` to loans; creates `idx_contacts_salesforce_id` and `idx_contacts_email_lower` indexes. Run manually in Supabase SQL editor.
- `scripts/import-closed-clients.py` — one-time import script for 868 Closed Client records from Salesforce XLS export. Reads HTML-formatted XLS via pandas + lxml, applies three-tier dedup, POSTs to Supabase REST. Idempotent.
- `src/app/api/import/parse/route.ts` — POST endpoint, accepts `multipart/form-data` file. Auto-detects CSV vs Salesforce HTML-XLS. Returns `{ columns, rows (5 preview), count, fileType }`. `full=true` form field returns all rows.
- `src/app/api/import/contacts/route.ts` — POST endpoint accepts `{ rows }` JSON. Three-tier dedup: salesforce_id → email (case-insensitive) → first_name+last_name. Never overwrites. Row-level error handling. Returns `{ imported, skipped, errors }`.
- `src/app/api/import/loans/route.ts` — POST endpoint accepts `{ rows }` JSON. Requires authenticated session (user_id NOT NULL). Two-tier dedup: loan_number → borrower_name+closing_date. Row-level error handling. Returns `{ imported, skipped, errors }`.
- `src/app/dashboard/contacts/ImportModal.tsx` — two-tab modal (Contacts / Loans). Drag-drop or browse file upload. Calls parse route for preview (5 rows + count). Confirm re-parses with `full=true` and POSTs to appropriate import route. Shows imported/skipped/error results.
- Import button (gold outline) added to Contacts page header next to `+ NEW CONTACT`.

### Changed
- `contacts/page.tsx` — removed `viewMode` state and Active/All toggle. Removed standalone `viewMode` conditional in `fetchContacts`. Fixed `fetchCounts` for all/closed. Fixed `applySmartList` closed case to include `'Closed Client'`. Added `salesforce_id`, `closing_date`, `realtor_email`, `realtor_phone` to `Contact` type and `ALL_COLUMNS`. Wired `ImportModal`.
- `src/app/api/import/parse/route.ts` — added `full` form field support to return all rows for import confirmation step.

### Removed
- `src/app/dashboard/closed-clients/` — entire directory deleted. Replaced by "Closed Borrowers" Smart List filter in `/dashboard/contacts`.
- `SidebarNav.tsx` — removed CLOSED CLIENTS nav entry.

---

## [1.0.6] — 2026-03-09 — Automations Trigger Buttons Live

### Changed
- `/dashboard/automations/page.tsx` — full rewrite to wire up trigger buttons
  - Added `TriggerModal` component: Bloomberg-styled overlay with drag/drop PDF zone (3 workflows) or form fields (Referral Intro)
  - PDF workflows (`final-cd`, `pre-approval`, `new-application`): FormData POST with `file`, `triggered_by`, `workflow_id`
  - Form workflow (`referral-intro`): JSON POST with `lead_name`, `agent`, `details`
  - All POST to `https://styer.app.n8n.cloud/webhook/{webhookPath}`
  - Loading/success/error states in modal; success message: "Workflow triggered — check Outlook for the draft."
  - Modal opens from `AutomationsPage` state (`activeWf`) — avoids z-index stacking issues
  - `AutoCard` now accepts `onTrigger: () => void`; TRIGGER button is gold + active (was disabled gray)
  - Removed "Coming soon" tooltip; footer note updated to reflect live infra
  - `'use client'` with `useState`, `useRef`, `ChangeEvent` imports added

---

## [1.0.5] — 2026-03-09 — Automations Dashboard

### Added
- `/dashboard/automations/page.tsx` — visual dashboard for all 4 active n8n workflows
  - Cards for: Final CD Email, Pre-Approval Email, Referral Intro Email, New Application Received
  - Each card: workflow icon, trigger label, description, Active status badge, animated pipeline flow (Trigger → Claude AI → Outlook → Review), hover meta-reveal showing n8n ID + webhook path, disabled Trigger button with tooltip
  - Animated flow dot traveling along connector lines between pipeline steps (staggered per connector)
  - Staggered card entrance animation on page load (cardIn keyframe, 0.12s delay per card)
  - Stat row: 4 Active / 0 Errors / Last Updated: 2026-03-09 / Engine: n8n + Claude API
  - Infra status bar with pulsing green dot
- `SidebarNav.tsx` — added ⚡ AUTOMATIONS link after UPLOAD DOC
- `CONTEXT.md` — added `## Active Automations` table as living document for all workflows

---

## [1.0.4] — 2026-03-09 — Closed Clients Section

### Added
- `/dashboard/closed-clients/page.tsx` — new page querying `contacts WHERE stage = 'Closed Client'` joined with `loans` via PostgREST nested select. Columns: Name, Loan Amount, Close Date, Loan Type, Referring Agent. Client-side search by name + sort by close date (default: most recent first). Bloomberg terminal UI.
- `SidebarNav.tsx` — added CLOSED CLIENTS nav link after CONTACTS
- `dashboard/page.tsx` — added 5th parallel HEAD count for Closed Clients; added CLOSED CLIENTS stat card; changed grid to `lg:grid-cols-5`
- `contacts/page.tsx` — added `viewMode` state (`'active' | 'all'`). Default `'active'` excludes `stage = 'Closed Client'` from All Contacts list + count. Active/All toggle buttons in filter bar.

---

## [1.0.3] — 2026-03-09 — MCC Live (Netlify Build Fixed)

### Fixed
- `marketing/page.tsx`: missing `export default function MarketingPage()` was blocking Netlify build and causing 12 cascading ESLint `no-unused-vars` errors — all tab components, hooks, and constants were defined but unreachable
- `marketing/page.tsx`: removed unused `s` prop from `TodayTab` signature
- `contacts/page.tsx`: added `eslint-disable-next-line` for `no-explicit-any` on `applySmartList`

### Added
- `MarketingPage` component: tab nav (TODAY → BRAIN DUMP), Supabase load on mount, `save()` + `toggle()` wired to all 8 tab sub-components

---

## [1.0.2] — 2026-03-09 — Contract Automation Live

### Completed
- n8n workflow `loanos-contract-received` published and tested end-to-end with real contract PDF
- Migration 003 (`003_contract_fields.sql`) applied — 14 contract columns + `contract_data JSONB` live in `loans` table
- Full pipeline confirmed: PDF upload → Supabase trigger → n8n webhook → Claude extraction → loan update → two Outlook drafts

---

## [1.0.1] — 2026-03-09 — MCC Migration Applied + Dev Server Fixed

### Fixed
- `supabase/migrations/004_mcc_state.sql` — migration applied in Supabase; `mcc_state` table + RLS now live
- `.claude/launch.json` (project-level, not in repo) — corrected `runtimeArgs` from `loanos` → `loanos-clone`; ran `npm install` in `loanos-clone` to restore `node_modules`

---

## [1.0.0] — 2026-03-09 — Marketing Command Center (MCC) Native Integration

### Added
- `supabase/migrations/004_mcc_state.sql` — new `mcc_state` table: `(user_id UUID, key TEXT, value JSONB, updated_at TIMESTAMPTZ)`, PRIMARY KEY `(user_id, key)`, RLS (SELECT/INSERT/UPDATE per user)
- `src/app/dashboard/marketing/page.tsx` — full MCC port as native LoanOS dashboard page (`'use client'`)
  - **8 tabs**: TODAY, WEEK, CONTACTS, SOCIAL, NEWSLETTERS, TRACKER, LOG, BRAIN DUMP
  - **State pattern**: single JSONB blob (`mcc_state` table, key = `'mcc'`) — mirrors Netlify Blobs shape
  - **DAYS**: Mon–Fri × task arrays (type: email/call/social/text/video/admin, optional tracker ref)
  - **TRACKERS**: 9 trackers (Realtor Email, Borrower Email, LinkedIn, Facebook, Rate Update, Newsletter, DB Call, Lender Email, Agent Social) — shows days-since-last + traffic-light color
  - **CONTACTS**: 4 call lists (Realtors, Pre-Approvals, Active Files, Hot Leads) — add/edit/delete, log calls with history + last touch, call notes
  - **calledToday**: ephemeral — reset to false on page load, never persisted
  - Tracker auto-update: checking a task with `tracker` property writes `s.last[trackerId]` = now
  - `upsert` with `onConflict: 'user_id,key'` for both first-save and update paths
  - `useMemo(() => createClient(), [])` — stable Supabase client
  - Shared UI atoms: `Card`, `SectionLabel`, `Input`, `Btn` (default/gold/danger variants)
  - Bloomberg terminal UI: CSS vars, Bebas Neue, IBM Plex Mono, gold `#c9a84c`
- `src/app/dashboard/SidebarNav.tsx` — added MARKETING nav link (before BUILD TRACKER)

### Manual Steps Completed (Supabase)
- ✅ Migration `004_mcc_state.sql` applied — `mcc_state` table + RLS live

---

## [0.9.0] — 2026-03-09 — Contacts: Smart List Fixes + Create Contact + Customizable Columns

### Changed
- `src/app/dashboard/contacts/page.tsx` — full rewrite (544 lines, TypeScript clean)
  - **In Process smart list** — new 8th list: `contact_type = 'borrower'` AND `stage IN ['In Process','Processing','Submitted','Conditional Approval','Clear to Close']`
  - **All stage filters** updated to `.in('stage', [...])` arrays covering all Salesforce-imported variants (was single `.eq()`)
  - **Everyone Else** fixed: now `.neq('contact_type','borrower').neq('contact_type','realtor')` — catches null + 'other' + any future types (was `.eq('contact_type','other')`)
  - **+ NEW CONTACT modal** — gold button in header → form (First/Last Name, Email, Phone, Mobile, Type, Stage, Lead Source, Referred By, Company, Notes) → Supabase insert → list + count refresh
  - **Customizable columns** — COLUMNS ▾ dropdown checklist (15 columns available), persisted to `localStorage` key `loanos_contacts_columns_v1`, default: Name, Type, Phone, Email, Stage, Referred By
  - **Slide-out edit** — EDIT → inline inputs → SAVE patches Supabase + updates local state; stage change moves contact to correct Smart List on next fetch
  - `ColumnDef[] = { id, label, render }` config array outside component; `BLANK_CONTACT` const outside component
  - `Promise.all()` expanded to 8 parallel HEAD count queries (added in-process)

---

## [0.8.0] — 2026-03-09 — Smart List Contacts Rebuild

### Changed
- `src/app/dashboard/contacts/page.tsx` — full rewrite with Smart List sidebar (557 lines, TypeScript clean)
  - **Smart List sidebar** (w-56): 7 lists — All Contacts, New Applications, Active Borrowers, Closed Borrowers, All Realtors, Top/Target Realtors, Everyone Else
  - Live count badges: 7 parallel Supabase `{ count: 'exact', head: true }` queries via `Promise.all()`
  - `applySmartList(query, listId)` — switch-based Supabase filter chaining (`.eq()`, `.in()`, `.or()`)
  - Switching active list resets page, search, filters, selected contact, and edit state
  - Gold `#c9a84c` active list highlight; section headers (BORROWERS, REALTORS, OTHER) in muted text
  - Main content: dynamic header shows active list label + contact count
  - Filters: 300ms debounced search (name/email/phone), stage select, lead_source select, CLEAR button
  - Table: 6 columns (Name, Type badge, Email, Phone, Stage, Lead Source), sticky header, 50/page pagination
  - `useMemo(() => createClient(), [])` — stabilized Supabase client to prevent infinite fetch loops
  - Row hover + selected state via direct `.style.background` mutation (no re-render cost)
  - Main content shifts right (`paddingRight: 400px`, `transition: 0.2s`) when slide-out panel is open
  - Slide-out panel (400px fixed, `top: 56px`): contact name in Bebas Neue, type badge, EDIT/CANCEL/SAVE
  - Edit mode: `orderedFields()` — priority fields first, then alpha, skips id/timestamps
  - Save patches Supabase in-place, updates local state; cancel discards; saving spinner state
  - Bloomberg terminal UI: `var(--muted)` for secondary text, `var(--font-mono)`, gold `#c9a84c` accents

---

## [0.7.0] — 2026-03-08 — Contacts Module

### Added
- `src/app/dashboard/contacts/page.tsx` — full Contacts module (Client Component)
  - Paginated table: 50/page, ordered by last_name, total count displayed
  - Real-time search (300ms debounce): searches first_name, last_name, email, phone via Supabase `.or()` ilike
  - Filters: contact_type (borrower/realtor/other), stage, lead_source (options auto-populated from live data)
  - Clear filters button appears when any filter is active
  - Table columns: Name, Type (color-coded badge), Phone, Email, Stage, Lead Source, Referred By, Created
  - Click row → 400px fixed slide-out panel with all contact fields (priority fields first, then alphabetical)
  - Edit mode in slide-out: inline inputs/selects/textarea per field type, readonly for created_at/updated_at
  - Save updates Supabase and refreshes row in-place (no full reload), cancel discards changes
  - Bloomberg terminal UI: Bebas Neue header, IBM Plex Mono labels + data, gold #c9a84c accents
  - Row hover and selected states; main content shifts right (paddingRight: 400px) when panel open
- `src/app/dashboard/SidebarNav.tsx` — added CONTACTS nav link (after DASHBOARD, before UPLOAD DOC)

---

## [0.6.0] — 2026-03-08 — Phase 2: Contract Automation

### Added
- `supabase/migrations/003_contract_fields.sql` — adds 14 contract-extracted columns to `loans` table (`sales_price`, `closing_date`, `effective_date`, `option_expiration`, `earnest_money`, `option_fee`, `seller_concessions`, `down_payment_pct`, `estimated_ltv`, `county`, `title_company`, agent/brokerage fields, `contract_data JSONB`); enables `pg_net`; creates `on_contract_document_inserted` trigger that fires n8n webhook only on `doc_type = 'contract'` inserts
- `n8n/prompts/contract-extraction.txt` — Claude system prompt for Texas TREC contract PDF extraction; returns strict JSON schema with 35 fields; field-by-field location guide by page/paragraph
- `n8n/contract-received.workflow.json` — 13-node importable n8n workflow:
  - Webhook trigger → IF filter → Download PDF from Supabase Storage
  - Build + Call Claude API (`claude-opus-4-6`, document content type)
  - Parse Contract Fields (strips markdown fences, calculates derived fields)
  - Update loan record + Log contract.received in parallel
  - Build + Draft party reply email (Outlook draft to adam@thestyerteam.com)
  - Build + Draft borrower welcome email (Outlook draft to adam@thestyerteam.com)
  - Log emails.drafted
- `docs/contract-automation-setup.md` — step-by-step setup guide (migration, n8n import, credential config, placeholder replacements, test instructions, troubleshooting)

---

## [0.5.0] — 2026-03-08

### Added
- `src/app/dashboard/layout.tsx` — fixed 220px sidebar shell (server component); wraps all dashboard routes
- `src/app/dashboard/SidebarNav.tsx` — client component; active route highlighting via `usePathname`
- `src/app/dashboard/build-tracker/page.tsx` — auth-gated iframe → `/docs/loanos.html`
- `src/app/dashboard/system-map/page.tsx` — auth-gated iframe → `/docs/loanos-system-map.html`
- `public/docs/loanos.html` — moved from `docs/`; Phase 1 all 7 items statically green (`'0-6':true`)
- `public/docs/loanos-system-map.html` — moved from `docs/`

### Changed
- `src/app/globals.css` — Bloomberg design tokens (CSS vars: `--bg`, `--surface`, `--surface2`, `--border`, `--gold`, `--text`, `--muted`, `--green`, `--red`); Google Fonts (Bebas Neue + IBM Plex Mono + IBM Plex Sans); `.action-btn:hover` rule
- `tailwind.config.ts` — extended with gold/surface color tokens + display/mono/sans font families
- `src/app/dashboard/page.tsx` — Bloomberg redesign: 4 stat cards (large Bebas Neue numbers), green infra status bar, terminal-style action buttons; removed stale Session panel
- `src/app/dashboard/upload/page.tsx` — Bloomberg aesthetic wrapper (visual only)
- `src/app/dashboard/upload/UploadForm.tsx` — visual redesign (dark inputs, gold dropzone, monospaced labels); all Supabase upload logic preserved exactly

---

## [0.4.0] — 2026-03-08

### Changed
- `src/app/page.tsx` — switched auth from magic link (`signInWithOtp`) to email/password (`signInWithPassword`)
- `netlify.toml` — added `mkdir -p public/docs &&` prefix to prevent cp failure when directory missing

### Fixed
- `src/app/dashboard/upload/page.tsx` — `contacts` type corrected to array (`[]`) — Supabase joins always return arrays
- `src/app/dashboard/upload/UploadForm.tsx` — `loanLabel()` now reads `loan.contacts?.[0]` instead of treating contacts as a single object (TypeScript build error on Netlify)
- Supabase Storage bucket renamed from `DOCUMENTS` to `documents` (bucket names are case-sensitive)

### Manual Steps Completed
- Migration 002 applied in Supabase SQL Editor
- Storage bucket `documents` created with RLS upload + read policies
- Password set via `auth.users` SQL update (bypassed email rate limit)
- Test loan seeded: `INSERT INTO loans (user_id, loan_number, property_address)`

---

## [0.3.0] — 2026-03-08

### Added
- `supabase/migrations/002_documents_metadata.sql` — adds `doc_type` and `uploaded_by` columns to `documents` table
- `src/app/dashboard/upload/page.tsx` — server component: auth-gated, fetches loans, renders UploadForm
- `src/app/dashboard/upload/UploadForm.tsx` — client component: full PDF upload flow
  - Doc type select (Purchase Contract, CD, Pre-Approval Letter, Income, Bank Statements, ID, Other)
  - Existing loan dropdown OR new contact+loan inline creation (first name, last name, loan number)
  - Dashed PDF file picker with name + size preview
  - Uploads to Supabase Storage at `{userId}/{loanId}/{timestamp}_{safeFilename}`
  - Inserts `documents` row + `activity_log` entry
  - Green/red result banner, form resets on success
- Dashboard "Actions" section with Upload Document link

### Manual Steps Required
- Run `002_documents_metadata.sql` in Supabase SQL Editor
- Add Supabase Storage policy: allow authenticated uploads to `{userId}/` prefix in `documents` bucket

---

## [0.2.0] — 2026-03-08

### Added
- `CONTEXT.md` — AI session context file (stack, phase roadmap, env vars, rules, next steps)
- `skills/user/` — 10 user-defined Claude skills cloned from `AStyer8345/adam-styer-skills`
  - content-creator, contract-received, email-best-practices, final-cd-email
  - frontend-design, referral-intro-email, send-rate-update, strategy-advisor
  - weekly-newsletter, weekly-rate-update (+ APR calculations reference)
- `CHANGELOG.md` — this file

### Fixed
- `claude-sonnet-4-6` → `claude-sonnet-4-5-20251022` in `docs/README.md` (×2) and `docs/loanos-system-map.html` (×1)
- devDependencies (`postcss`, etc.) now install correctly — fixed `NODE_ENV=production` blocking dev installs

---

## [0.1.0] — 2026-03-08

### Added
- Next.js 14 app shell (App Router, TypeScript, Tailwind CSS)
- Supabase auth — magic link login
- Protected `/dashboard` route with session middleware
- Supabase Postgres schema — 4 tables: `contacts`, `loans`, `documents`, `activity_log`
- Supabase Storage bucket: `documents`
- Netlify deployment with `@netlify/plugin-nextjs` v5
- `docs/` — `loanos.html` (build tracker) + `loanos-system-map.html` (architecture diagram)
- GitHub repo: `AStyer8345/loanos` on `main`
