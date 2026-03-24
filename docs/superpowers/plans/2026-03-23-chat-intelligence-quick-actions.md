# Chat Intelligence & Quick Actions — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Three features — AI-powered contact extraction with notes + smart stage, dashboard Hot Leads widget, and four new quick action chips.

**Architecture:** Minimal — no new routes, no schema changes, no new dependencies. Reuse existing `getAnthropicClient()`, Supabase queries, and UI patterns.

**Spec:** `docs/superpowers/specs/2026-03-23-chat-intelligence-quick-actions-design.md`

**Tech Stack:** Next.js App Router, Supabase, Anthropic SDK (`@anthropic-ai/sdk`), React

---

## Task 1: AI-Powered Contact Extraction

**Files:**
- Modify: `src/app/api/contacts/quick-add/route.ts`

### Context
Currently, `extractContactInfo(body.raw)` in the quick-add route uses regex-only parsing — it never captures free-text notes and only detects stage if the user says "stage: X" explicitly. We're replacing this with a Claude call using `claude-haiku-4-5` (fast, cheap), with the regex as fallback.

The Anthropic client is available via `getAnthropicClient()` from `@/lib/anthropic/client`. The model for extraction is `claude-haiku-4-5` (NOT the main `CLAUDE_MODEL` constant — we use haiku for speed and cost on this task).

- [ ] **Step 1: Add `extractContactInfoWithAI` helper function**

Add this function to `src/app/api/contacts/quick-add/route.ts` BEFORE the `POST` function:

```ts
import { getAnthropicClient } from '@/lib/anthropic/client'

async function extractContactInfoWithAI(raw: string): Promise<ExtractedContact> {
  const anthropic = await getAnthropicClient()
  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 300,
    temperature: 0,
    messages: [{
      role: 'user',
      content: `Extract contact info from the following natural language input and return ONLY valid JSON with these exact fields (null if not present):
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

Stage inference rules (use exact string from list above):
- "just met", "new lead", "open house", "reached out", no purchase context → "Lead"
- "wants to apply", "ready to start", "filling out app" → "Application"
- "pre-approved", "got approval", "has approval" → "Pre-Approved"
- "in process", "submitted to lender" → "In Process"
- "closing soon", "clear to close" → "Closing"
- "funded", "closed" → "Closed"
- If unclear → null

Notes: capture any free-form context not represented by other fields — personality, situation, timeline, follow-up reminders. Put it here verbatim or lightly paraphrased.

Return ONLY the JSON object, no markdown, no explanation.

Input: ${raw}`,
    }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text.trim() : ''
  const parsed = JSON.parse(text) as ExtractedContact
  return parsed
}
```

- [ ] **Step 2: Use AI extraction with regex fallback in the POST handler**

In the `POST` function, find this block:
```ts
} else if (body.raw) {
  // Parse natural language input
  extracted = extractContactInfo(body.raw)
}
```

Replace with:
```ts
} else if (body.raw) {
  // Try AI extraction first, fall back to regex on error
  try {
    extracted = await extractContactInfoWithAI(body.raw)
  } catch (err) {
    console.warn('[quick-add] AI extraction failed, using regex fallback:', err)
    extracted = extractContactInfo(body.raw)
  }
}
```

- [ ] **Step 3: Verify the change manually**

Read the file back to confirm the function was inserted correctly and the fallback logic is in place. Check that `getAnthropicClient` import is present.

- [ ] **Step 4: Commit**

```bash
cd /Users/adamstyer/Documents/loanos-clone
git add src/app/api/contacts/quick-add/route.ts
git commit -m "feat: AI-powered contact extraction with notes and stage inference

- Replace regex-only extraction with claude-haiku-4-5 call
- Captures free-text notes from conversational input
- Infers stage from context (not just explicit 'stage: X')
- Falls back to regex extractor if Anthropic call fails"
```

---

## Task 2: Dashboard Hot Leads Widget

**Files:**
- Modify: `src/app/dashboard/page.tsx`
- Modify: `src/components/dashboard/DashboardClient.tsx`
- Create: `src/components/dashboard/HotLeadsWidget.tsx`

### Context
The dashboard currently shows loan-based urgent flags only. We need to add a "Hot Leads" section showing contacts whose notes contain follow-up language. The scoring is keyword-based (no AI call needed — keep the dashboard fast).

`DashboardClient` uses a pattern of typed props. The existing `NewLead` and `UrgentFlag` types in `DashboardClient.tsx` show the pattern. We add a `HotLead` type following the same pattern.

The dashboard page uses `organizationId` from `getOrganization()` and `createClient()` from `@/lib/supabase/server`.

- [ ] **Step 1: Create `HotLeadsWidget.tsx`**

Create `src/components/dashboard/HotLeadsWidget.tsx`:

```tsx
'use client'

import Link from 'next/link'

export type HotLead = {
  id: string
  first_name: string
  last_name: string | null
  notes: string
  daysAgo: number
  score: number
}

interface HotLeadsWidgetProps {
  hotLeads: HotLead[]
}

export default function HotLeadsWidget({ hotLeads }: HotLeadsWidgetProps) {
  if (hotLeads.length === 0) return null

  return (
    <div style={{
      background: '#111',
      border: '1px solid #2a2a2a',
      borderRadius: 8,
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '10px 14px',
        borderBottom: '1px solid #2a2a2a',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}>
        <span style={{ fontSize: 14 }}>🔥</span>
        <span style={{
          fontFamily: '"IBM Plex Mono", monospace',
          fontSize: 11,
          color: '#C9A84C',
          fontWeight: 600,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}>
          Hot Leads
        </span>
      </div>
      <div>
        {hotLeads.map((lead, i) => {
          const name = [lead.first_name, lead.last_name].filter(Boolean).join(' ')
          const snippet = lead.notes.length > 60
            ? lead.notes.slice(0, 57) + '…'
            : lead.notes
          const daysLabel = lead.daysAgo === 0
            ? 'today'
            : lead.daysAgo === 1
              ? '1d ago'
              : `${lead.daysAgo}d ago`

          return (
            <Link
              key={lead.id}
              href={`/dashboard/contacts/${lead.id}`}
              style={{
                display: 'block',
                padding: '10px 14px',
                borderBottom: i < hotLeads.length - 1 ? '1px solid #1e1e1e' : 'none',
                textDecoration: 'none',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#1a1a1a')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: 3,
              }}>
                <span style={{
                  fontFamily: '"IBM Plex Mono", monospace',
                  fontSize: 11,
                  color: '#e0e0e0',
                  fontWeight: 500,
                }}>
                  {name}
                </span>
                <span style={{
                  fontFamily: '"IBM Plex Mono", monospace',
                  fontSize: 10,
                  color: '#555',
                }}>
                  {daysLabel}
                </span>
              </div>
              <div style={{
                fontFamily: '"IBM Plex Mono", monospace',
                fontSize: 10,
                color: '#666',
                fontStyle: 'italic',
              }}>
                "{snippet}"
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Add hot leads query to `src/app/dashboard/page.tsx`**

After the existing `staleLoans` declarations (around line 39), add the `HotLead` type and scoring constant:

```ts
import type { HotLead } from '@/components/dashboard/HotLeadsWidget'

const HOT_KEYWORDS = [
  'follow up', 'call back', 'interested', 'ready', 'wants to',
  'motivated', 'urgent', 'asap', 'soon', 'this week', 'next week',
  'remind', 'reach out', 'needs to', 'looking to', 'actively',
]

function scoreNotes(notes: string): number {
  const lower = notes.toLowerCase()
  return HOT_KEYWORDS.reduce((score, kw) => score + (lower.includes(kw) ? 1 : 0), 0)
}
```

Then add a Supabase query inside `DashboardPage` after the loans query (near where urgentFlags and staleLoans are built):

```ts
// Hot leads query
const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
const { data: recentContacts = [] } = await supabase
  .from('contacts')
  .select('id, first_name, last_name, notes, updated_at')
  .eq('organization_id', organizationId)
  .not('notes', 'is', null)
  .gte('updated_at', thirtyDaysAgo)
  .limit(20)

const hotLeads: HotLead[] = (recentContacts ?? [])
  .map(c => ({
    id: c.id,
    first_name: c.first_name ?? 'Unknown',
    last_name: c.last_name ?? null,
    notes: c.notes as string,
    daysAgo: Math.floor((now.getTime() - new Date(c.updated_at).getTime()) / (1000 * 60 * 60 * 24)),
    score: scoreNotes(c.notes as string),
  }))
  .filter(h => h.score > 0)
  .sort((a, b) => b.score - a.score || a.daysAgo - b.daysAgo)
  .slice(0, 5)
```

- [ ] **Step 3: Pass `hotLeads` prop to `DashboardClient`**

Find the `<DashboardClient` JSX in `page.tsx` and add `hotLeads={hotLeads}` to the props.

- [ ] **Step 4: Add `HotLead` type and `hotLeads` prop to `DashboardClient.tsx`**

In `src/components/dashboard/DashboardClient.tsx`:

1. Add import at the top:
```ts
import HotLeadsWidget, { type HotLead } from '@/components/dashboard/HotLeadsWidget'
```

2. Add to the `DashboardClientProps` interface:
```ts
hotLeads: HotLead[]
```

3. Destructure `hotLeads` from props in the component function.

4. Render `<HotLeadsWidget hotLeads={hotLeads} />` in a suitable location — add it after the "Urgent Flags" section (search for the urgentFlags rendering section) and before or after "Stale Loans".

- [ ] **Step 5: Verify by reading back all three files**

Read the changed sections to confirm types match, import paths are correct, and no TypeScript errors are obvious.

- [ ] **Step 6: Commit**

```bash
cd /Users/adamstyer/Documents/loanos-clone
git add src/components/dashboard/HotLeadsWidget.tsx src/app/dashboard/page.tsx src/components/dashboard/DashboardClient.tsx
git commit -m "feat: Dashboard Hot Leads widget

- Query contacts with notes updated in last 30 days
- Keyword scoring surfaces follow-up-intent contacts
- Top 5 shown in new HotLeadsWidget component
- Links directly to contact record"
```

---

## Task 3: New Quick Action Chips + System Prompt Routing Hint

**Files:**
- Modify: `src/components/crm/LoanOSChat.tsx`
- Modify: `src/app/api/chat/route.ts`

### Context
`GENERAL_QUICK_ACTIONS` in `LoanOSChat.tsx` currently has 2 chips. We're adding 4 more. For Sales/Underwriting questions, we also need a one-line addition to the system prompt in `buildSystemPrompt()` in the chat route — appended after the existing `generateType` block (around line 258), before the `return prompt`.

- [ ] **Step 1: Extend `GENERAL_QUICK_ACTIONS` in `LoanOSChat.tsx`**

Find:
```ts
const GENERAL_QUICK_ACTIONS = [
  { label: 'Add contact', prompt: 'Add ' },
  { label: 'Draft email', prompt: 'Draft an email to ' },
]
```

Replace with:
```ts
const GENERAL_QUICK_ACTIONS = [
  { label: 'Add contact',        prompt: 'Add ' },
  { label: 'Draft email',        prompt: 'Draft an email to ' },
  { label: 'Mass update',        prompt: 'Update all ' },
  { label: 'Scenario',           prompt: 'Mortgage scenario: ' },
  { label: 'Sales Q',            prompt: 'Sales question: ' },
  { label: 'Underwriting Q',     prompt: 'Underwriting question: ' },
]
```

- [ ] **Step 2: Add routing hint to `buildSystemPrompt` in `route.ts`**

Find the last two lines of `buildSystemPrompt` (right before `return prompt`):
```ts
  return prompt
}
```

Insert a routing instruction before the return:
```ts
  // Routing hint for knowledge-base chips
  prompt += `\n\nWhen the user's message begins with "Sales question:" or "Underwriting question:", call the query_mortgage_knowledge_base tool before answering.`

  return prompt
}
```

- [ ] **Step 3: Verify both files**

Read the changed sections back to confirm the edit landed in the right place and didn't break surrounding code.

- [ ] **Step 4: Commit**

```bash
cd /Users/adamstyer/Documents/loanos-clone
git add src/components/crm/LoanOSChat.tsx src/app/api/chat/route.ts
git commit -m "feat: New quick action chips (Mass update, Scenario, Sales Q, Underwriting Q)

- Extend GENERAL_QUICK_ACTIONS with 4 new chips
- Sales Q and Underwriting Q route to NotebookLM knowledge base
- System prompt routing hint added to buildSystemPrompt"
```

---

## Final Steps

- [ ] **Run build to confirm no TypeScript errors**

```bash
cd /Users/adamstyer/Documents/loanos-clone
npx tsc --noEmit 2>&1 | head -40
```

If there are errors, fix them before pushing.

- [ ] **Push to GitHub**

```bash
cd /Users/adamstyer/Documents/loanos-clone
git push origin main
```

- [ ] **Update CHANGELOG / CONTEXT docs**

Update `CHANGELOG.md` (or `docs/CHANGELOG.md` if it exists) with a new entry summarizing these features. Also check if `CONTEXT.md` exists and update the chat capabilities section.

- [ ] **Deploy to Vercel production**

```bash
vercel --prod
```
