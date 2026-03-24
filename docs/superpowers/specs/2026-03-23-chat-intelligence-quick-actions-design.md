# LoanOS Chat — Intelligence Upgrades & Quick Actions
**Date:** 2026-03-23
**Status:** Approved

---

## Overview

Three related improvements to the LoanOS AI chat:

1. **Smarter contact creation** — AI-powered extraction replaces regex, capturing notes and inferring stage from conversational context
2. **Dashboard "Hot Leads" widget** — surfaces contacts whose notes suggest follow-up is needed
3. **New quick action chips** — Mass update (natural language), Scenario question, Sales question, Underwriting question

No new routes. No schema changes. No new runtime dependencies beyond reusing the existing Anthropic client.

---

## 1. Smarter Contact Creation

### Problem

`extractContactInfo()` in `src/lib/chat-command-parser.ts` is regex-based. It extracts name/phone/email reliably but:
- Never extracts notes from conversational input (e.g., "great guy, works in tech, ready to buy in spring")
- Only assigns stage when user explicitly says "stage: X" — misses implied stages
- Default is `null` → DB normalizes to `"lead"` silently

### Solution: Claude-powered extraction in the quick-add route

**File:** `src/app/api/contacts/quick-add/route.ts`

When `body.raw` is provided (not `body.confirmed`), call Claude via the Anthropic SDK to extract structured contact data. Regex (`extractContactInfo`) becomes the fallback only if the Anthropic call throws.

**Claude prompt contract:**
```
Extract contact info from the following natural language input and return ONLY valid JSON
with these fields (null if not present):
{
  "first_name": string | null,
  "last_name": string | null,
  "email": string | null,
  "phone": string | null,
  "stage": one of exactly ["Lead","Pre-App","Application","Pre-Approved","In Process","Closing","Closed","Other"] | null,
  "contact_type": "borrower" | "realtor" | "referral partner" | "vendor" | null,
  "referred_by": string | null,
  "notes": string | null,
  "source": string | null,
  "company_name": string | null
}

Stage inference rules (use exact string from the list above):
- "just met", "new lead", "open house", "reached out", no purchase context → "Lead"
- "wants to apply", "ready to start", "filling out app", "new application" → "Application"
- "pre-approved", "got approval", "has approval" → "Pre-Approved"
- "in process", "submitted to lender" → "In Process"
- "closing soon", "clear to close" → "Closing"
- "funded", "closed" → "Closed"
- If unclear → null (route will default to "Lead")

Notes: capture any free-form context not represented by other fields.
If the user mentioned anything qualitative (personality, situation, timeline,
follow-up reminders), put it here verbatim or lightly paraphrased.

Input: <raw>
```

These stage strings pass directly through `normalizeStage()` (canonical values — no mapping needed).

**Model:** `claude-haiku-4-5` (fast, cheap — parsing only)
**Temperature:** 0 (deterministic extraction)
**Max tokens:** 300

**Fallback:** If Anthropic throws, call `extractContactInfo(body.raw)` as before.

**Stage normalization:** The returned stage string must be passed through `normalizeStage()` before insertion (already called in route, no change needed).

### Files changed

| File | Change |
|------|--------|
| `src/app/api/contacts/quick-add/route.ts` | Add `extractContactInfoWithAI()` async helper; call it before regex fallback |

No changes to `chat-command-parser.ts` (regex extractor preserved as fallback).

---

## 2. Dashboard "Hot Leads" Widget

### Problem

The dashboard's "Urgent Flags" section is loan-only. Contacts that have notes suggesting follow-up ("called back, very interested", "wants to move fast", "follow up next week") are invisible.

### Solution

**Data query (server):** In `src/app/dashboard/page.tsx`, fetch up to 20 contacts where:
- `organization_id = organizationId` (scoped to org)
- `notes IS NOT NULL`
- `updated_at >= now - 30 days`

Score them by keyword density (see below). Pass top 5 to the client. No soft-delete column exists on contacts — no additional filter needed.

**Keyword scoring (server-side, zero API cost):**
```ts
const HOT_KEYWORDS = [
  'follow up', 'call back', 'interested', 'ready', 'wants to',
  'motivated', 'urgent', 'asap', 'soon', 'this week', 'next week',
  'remind', 'reach out', 'needs to', 'looking to', 'actively'
]
// Score = count of keyword matches in notes (case-insensitive)
// Contacts with score > 0, sorted descending, top 5
```

**Display:** New `HotLeadsWidget` component in `src/components/dashboard/HotLeadsWidget.tsx`.

```
┌─────────────────────────────────┐
│ 🔥 Hot Leads                    │
├─────────────────────────────────┤
│ Jane Smith                  2d  │
│ "interested, wants to move..."  │
│ ─────────────────────────────   │
│ Bob Jones                   5d  │
│ "follow up this week"           │
└─────────────────────────────────┘
```

- Each row links to `/dashboard/contacts/[id]`
- "days ago" = days since `updated_at`
- Note snippet truncated to ~60 chars
- If no hot leads → widget hidden (don't show empty state)

**Type:**
```ts
type HotLead = {
  id: string
  first_name: string
  last_name: string | null
  notes: string
  daysAgo: number
  score: number
}
```

### Files changed

| File | Change |
|------|--------|
| `src/app/dashboard/page.tsx` | Add contacts query + scoring; pass `hotLeads` prop |
| `src/components/dashboard/DashboardClient.tsx` | Accept + render `HotLeadsWidget` |
| `src/components/dashboard/HotLeadsWidget.tsx` | New component |

---

## 3. New Quick Action Chips

### Current state

```ts
const GENERAL_QUICK_ACTIONS = [
  { label: 'Add contact', prompt: 'Add ' },
  { label: 'Draft email', prompt: 'Draft an email to ' },
]
```

### New chips (added after existing ones)

```ts
const GENERAL_QUICK_ACTIONS = [
  { label: 'Add contact',          prompt: 'Add ' },
  { label: 'Draft email',          prompt: 'Draft an email to ' },
  { label: 'Mass update',          prompt: 'Update all ' },
  { label: 'Scenario',             prompt: 'Mortgage scenario: ' },
  { label: 'Sales Q',              prompt: 'Sales question: ' },
  { label: 'Underwriting Q',       prompt: 'Underwriting question: ' },
]
```

### Routing behavior

**Mass update** (`prompt: 'Update all '`):
- User completes: "Update all leads from last 30 days to stage new_application"
- Routed to `GENERAL_CHAT` — Claude handles it with the existing Supabase context
- Claude is already given the organization's contacts/loans context in the system prompt
- No new tool needed for phase 1; Claude drafts the action and asks for confirmation
- Follow-on: if/when a `bulk_update_contacts` tool is added, it plugs in naturally

**Scenario** (`prompt: 'Mortgage scenario: '`):
- User types the scenario; routes to `GENERAL_CHAT`
- Claude has full mortgage knowledge and reasoning capability
- No NotebookLM needed — scenario reasoning is general knowledge

**Sales question / Underwriting question**:
- Pre-fills textarea with the prefix
- Routes to `GENERAL_CHAT` — all existing record context (contacts, loans, pipeline) is still included in the system prompt unchanged
- **System prompt addition** (appended after existing context, not a replacement): a single sentence instructing Claude to prefer the knowledge base for these question types:
  > "When the user's message begins with 'Sales question:' or 'Underwriting question:', call the query_mortgage_knowledge_base tool before answering."
- The `query_mortgage_knowledge_base` tool already exists in `/api/chat/route.ts`; no new tool needed

### Files changed

| File | Change |
|------|--------|
| `src/components/crm/LoanOSChat.tsx` | Extend `GENERAL_QUICK_ACTIONS` array |
| `src/app/api/chat/route.ts` | Add routing instruction to system prompt |

---

## 4. Files Summary

| File | Change Type |
|------|-------------|
| `src/app/api/contacts/quick-add/route.ts` | Modify — add AI extraction |
| `src/lib/chat-command-parser.ts` | No change |
| `src/app/dashboard/page.tsx` | Modify — hot leads query |
| `src/components/dashboard/DashboardClient.tsx` | Modify — pass hotLeads prop |
| `src/components/dashboard/HotLeadsWidget.tsx` | Create |
| `src/components/crm/LoanOSChat.tsx` | Modify — 4 new quick action chips |
| `src/app/api/chat/route.ts` | Modify — system prompt routing hint |

---

## 5. Out of Scope

- `bulk_update_contacts` Supabase tool (mass update confirmation UI)
- AI-powered hot leads scoring (keyword scoring is sufficient)
- Persistent notes history / versioning
- NotebookLM source management from chat
