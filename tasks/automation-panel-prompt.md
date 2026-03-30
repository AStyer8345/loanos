# LoanOS — Email Automation Panel

## What This Is

An email automation system on contact and loan records — modeled after the social media dashboard pattern:
1. See a list of available email automations for this contact/loan
2. Click one → Claude generates a draft → stored in `email_drafts` table
3. See full email preview (subject + body) in a detail panel
4. Edit inline or refine via chat prompt (same as social media draft editing)
5. Hit "Send" → creates draft in Outlook via n8n webhook
6. Shows "Sent" badge — persists on reload via `activity_log`

This is the email equivalent of what the Social Media Dashboard does for social posts.

## Execution Mode

PLAN FIRST. Read the codebase, write a plan to `tasks/todo-automation-panel.md`, then build.

---

## Phase 0 — Audit (Read Before Writing)

Read these files completely before writing any code:

**Pattern to replicate:**
- `src/app/dashboard/marketing/_components/SocialComposePanel.tsx` — compose flow
- `src/app/dashboard/marketing/_components/SocialDraftDetail.tsx` — detail panel with chat editing
- `src/app/api/chat/social/route.ts` — Claude chat API with compose + edit modes

**Where the panel will live:**
- `src/app/dashboard/contacts/[id]/page.tsx` — contact record (client component)
- `src/app/dashboard/contacts/[id]/ContactRecordView.tsx` — contact record view
- `src/app/dashboard/loans/[id]/page.tsx` — loan record (client component)

**Existing utilities you MUST use (do not reinvent):**
- `src/lib/getOrganization.ts` — `getOrganization(): Promise<{ organizationId, role, userId }>` — throws if no session
- `src/lib/updateLastTouch.ts` — `updateLastTouch(supabase, contactId, eventType, description, loanId?, metadata?)` — updates `contacts.last_touch_at` + inserts `activity_log`
- `src/lib/supabase/logEmailDraft.ts` — `logEmailDraft(payload): Promise<row | null>` — inserts to `email_drafts` table with status `'pending'`
- `src/lib/anthropic/model.ts` — `CLAUDE_MODEL` = `'claude-sonnet-4-5'` (NEVER use a date suffix)
- `src/lib/anthropic/client.ts` — `getAnthropicClient()` — returns configured Anthropic client
- `src/lib/rateLimit.ts` — `checkRateLimit(key, max, windowMs)` — rate limiter
- `src/lib/constants/loan-stages.ts` — `normalizeToStageKey(raw)`, `STAGE_LABELS`, `StageKey` type — ALL stage logic lives here

**Existing API routes (do not duplicate):**
- `src/app/api/email-drafts/route.ts` — full CRUD: POST (create), GET (list by status), PATCH (update status)
  - Already org-scoped via `getOrganization()`
  - Already has `body_preview` generation from HTML

**Existing tables:**
- `email_drafts` — `id, automation_name, recipient_name, recipient_email, subject, body_html, body_preview, status ('pending'|'sent'|'failed'), contact_id, loan_id, outlook_draft_id, organization_id, created_at, updated_at`
- `activity_log` — `contact_id, loan_id, action, type, summary, entity_type, occurred_at, user_id, organization_id, metadata`

Report what you find, then write the plan. Do not start coding.

---

## Phase 1 — Plan

Write the plan to `tasks/todo-automation-panel.md`. The plan must cover:

1. Files to create (paths + purpose)
2. Files to modify (exact sections being changed)
3. Build order
4. How sent-state is queried on mount (from `email_drafts` table, not `activity_log`)
5. How regression is prevented (no existing components removed or changed)

---

## Phase 2 — Build

### Architecture Overview

```
Contact/Loan Record
  └─ AutomationPanel (list of available automations)
       └─ AutomationCard (one per automation)
            ├─ idle state: label + description + "Generate" button
            ├─ generating: loading indicator
            ├─ draft state: EmailDraftDetail (full preview + chat editing)
            ├─ sending: loading
            └─ sent state: collapsed "Sent" badge
```

### What to Build

#### 1. Automation Definitions — `src/lib/automations/definitions.ts`

A pure data file. No Supabase queries, no API calls. Just config.

```typescript
export interface AutomationDef {
  id: string                    // unique key, stored in email_drafts.automation_name
  label: string                 // display name
  description: string           // one-line description shown in idle state
  surface: 'contact' | 'loan'  // where it appears
  stageKey?: StageKey           // loan stage this is relevant for (undefined = always show)
  recipient: 'borrower' | 'agent'
}
```

**Contact-level automations (4):**

| id | label | recipient | description |
|----|-------|-----------|-------------|
| `referral-thank-you` | Referral Thank You | agent | Thank the referring agent |
| `referral-intro` | Referral Intro | borrower | Welcome email to referred borrower |
| `application-link` | Application Link | borrower | Send the loan application link |
| `nurture-followup` | Nurture Follow-Up | borrower | Casual check-in on a cold lead |

**Loan-level automations (10):**

| id | label | stageKey | recipient | description |
|----|-------|----------|-----------|-------------|
| `app-received` | Application Received | `new_application` | borrower | Confirm we got their app |
| `doc-request` | Document Request | `pre_approval` | borrower | List of docs we need |
| `pre-approval-email` | Pre-Approval Letter | `pre_approval` | borrower | Congrats, you're pre-approved |
| `pre-approval-agent` | Pre-Approval to Agent | `pre_approval` | agent | Notify agent of PA |
| `processing-update` | Processing Update | `processing` | borrower | Your loan is moving through |
| `conditional-approval` | Conditional Approval | `approved` | borrower | Approved with conditions |
| `cd-email` | Closing Disclosure | `clear_to_close` | borrower | Final CD numbers email |
| `closing-prep` | Closing Prep | `clear_to_close` | borrower | What to bring to closing |
| `thank-you` | Thank You | `funded` | borrower | Post-close thank you |
| `review-request` | Review Request | `funded` | borrower | Ask for Google/Zillow review |

**Stage filtering logic for loan panel:** Show automations where `stageKey` matches the current loan's normalized stage, PLUS one stage before and one stage after in the pipeline. This way the LO can see what's coming next.

#### 2. Prompt Builder — `src/lib/automations/prompts.ts`

A function that takes an `automationId` + record data and returns a Claude system prompt + user message.

```typescript
export interface AutomationRecord {
  contact?: { first_name, last_name, email, phone_mobile }
  loan?: { loan_amount, interest_rate, closing_date, property_address, property_city, property_state, loan_type, loan_purpose, status }
  agentContact?: { first_name, last_name, email }   // buyer/listing agent
  referralContact?: { first_name, last_name, email } // who referred
  orgName: string
  loName: string    // LO's display name (from profiles)
}

export function buildAutomationPrompt(
  automationId: string,
  record: AutomationRecord
): { system: string; userMessage: string }
```

**Voice rules for ALL prompts (inject into system prompt):**
- You are a mortgage loan officer writing a personal email
- Tone: trusted advisor, not salesperson. Direct. Warm but not sappy.
- Write like a real person — short sentences, conversational
- Never "I hope this email finds you well"
- No bullet points in email body — flowing paragraphs
- Plain text only — no HTML, no markdown formatting
- Sign off as the LO's first name only — NMLS is in the email signature, NOT in the body
- Return ONLY valid JSON: `{ "subject": "...", "body": "..." }`
- Max 6 sentences in body unless the automation specifically needs more
- Use record data naturally — don't force every field into the email
- Safe fallbacks: use "there" if no first name, "your loan" if no amount, etc.

**Per-automation prompt customization:**
Each automation gets specific instructions added to the user message. For example:
- `referral-thank-you`: "Write a quick thank-you to the referring agent. Mention the borrower's name if available. Keep it to 3-4 sentences."
- `cd-email`: "Walk the borrower through what the Closing Disclosure means. Mention the closing date if available. Remind them to review and reach out with questions."
- `review-request`: "Personal ask for a Google or Zillow review. Not pushy. Mention how much their experience meant. 3-4 sentences max."

**Multi-tenant:** The system prompt injects `orgName` and `loName` from the record data — never hardcoded. Each org's LO name comes from their `profiles` table row.

#### 3. API Route — `src/app/api/automations/generate/route.ts`

```
POST { automationId, recordType: 'contact' | 'loan', recordId }
→ getOrganization() — 401 if fails
→ checkRateLimit(`automation-gen:${userId}`, 20, 60_000)
→ Fetch the record from Supabase (org-scoped)
  → If loan: also fetch linked contact, buyer_agent_contact, listing_agent_contact, referral contact
  → Fetch LO profile (name) from profiles table using userId
  → Fetch org name from organizations table using organizationId
→ buildAutomationPrompt(automationId, record)
→ getAnthropicClient() → messages.create({ model: CLAUDE_MODEL, max_tokens: 1000, ... })
→ Parse JSON response (strip markdown fences if present)
→ logEmailDraft({ automation_name: automationId, recipient_email, recipient_name, subject, body_html: body, contact_id, loan_id, organization_id })
→ Return { subject, body, draftId }
→ On error: { error: string } with correct HTTP status
```

#### 4. API Route — `src/app/api/automations/refine/route.ts`

Same pattern as the social media chat refinement.

```
POST { draftId, instruction, currentSubject, currentBody }
→ getOrganization() — 401 if fails
→ checkRateLimit(`automation-refine:${userId}`, 30, 60_000)
→ Claude: "Refine this email draft based on the instruction. Keep the same voice and tone. Return JSON: { subject, body }. Plain text only."
→ Parse JSON response
→ Update email_drafts row: subject, body_html, body_preview, updated_at
→ Return { subject, body }
```

#### 5. API Route — `src/app/api/automations/send/route.ts`

```
POST { draftId }
→ getOrganization() — 401 if fails
→ Fetch the email_draft row (org-scoped)
→ Validate: draft exists, status is 'pending', has recipient_email
→ POST to n8n webhook to create Outlook draft:
  → URL from process.env.N8N_OUTLOOK_DRAFT_WEBHOOK_URL
  → Payload: { to: recipient_email, subject, body: body_html, recipientName }
→ On success:
  → Update email_drafts status to 'sent'
  → updateLastTouch(supabase, contactId, 'email_sent', `${automationLabel} sent to ${recipientName}`, loanId, { automation_id, subject })
→ Return { success: true }
→ On n8n failure: { error: 'Failed to create Outlook draft' }, 502
→ If no webhook URL configured: { error: 'Email dispatch not configured — set N8N_OUTLOOK_DRAFT_WEBHOOK_URL' }, 503
```

#### 6. Components

**`src/components/automations/AutomationPanel.tsx`**

The container. Shows on contact and loan records.

Props:
```typescript
interface AutomationPanelProps {
  recordType: 'contact' | 'loan'
  recordId: string
  contactId: string
  loanId?: string
  currentStage?: string          // raw loan status string — panel normalizes internally
  recipientEmail: string
  recipientName: string
  contact?: { first_name, last_name, email }  // for display
}
```

On mount:
- Get available automations for this record type (and stage if loan)
- Query `email_drafts` table for this contact (and loan if applicable) to find already-sent automations
- Mark automations as `sent` if a matching `automation_name` exists with status `'sent'`

Layout:
- Two-column on desktop (list left, detail right) — same as social media dashboard
- Or collapsible cards if space is tight on the record page — your call based on what fits
- Header: "EMAIL AUTOMATIONS" — IBM Plex Mono, gold, uppercase tracking-widest
- Each automation is a row/card showing: label, description, status badge (idle/sent), Generate button

**`src/components/automations/AutomationCard.tsx`**

One card per automation. Handles the full lifecycle.

States: `idle → generating → draft → sending → sent`
Also: `draft → refining → draft` (for chat refinement)

**idle:** Label + description + gold outline "Generate" button. If already sent: show "Sent" badge (emerald) instead of button.

**generating:** Pulsing gold dot + "Drafting..."

**draft:** Full email preview panel:
- Subject line (editable input)
- Body (editable textarea, min 140px height)
- Refine bar: text input "Refine this draft..." + "Refine" button (sends to `/api/automations/refine`)
- Action row: "Discard" (ghost, resets to idle) + "Send" (gold bg, black text)

**refining:** Refine input disabled + spinner

**sending:** Send button disabled + spinner

**sent:** Collapsed. Checkmark + "Sent" + timestamp. Cannot re-open.

**error:** Red text below action row. Returns to draft state so user can retry.

**Design tokens (match existing LoanOS dark theme):**
- Card: `bg-[#0f172a] border border-[#1e293b] rounded-lg p-4`
- Gold: `#C9A84C`
- Sent: `text-emerald-400`
- Error: `text-red-400`
- Font: IBM Plex Mono for labels/badges, system font for body text

#### 7. Integration — Surgical Changes

**Contact record:**
Add `AutomationPanel` inside `ContactRecordView.tsx` — either as a new section below overview, or as a new tab. Do NOT remove any existing tabs, components, or imports.

```tsx
<AutomationPanel
  recordType="contact"
  recordId={contact.id}
  contactId={contact.id}
  recipientEmail={contact.email ?? ''}
  recipientName={`${contact.first_name ?? ''} ${contact.last_name ?? ''}`.trim()}
  contact={contact}
/>
```

**Loan record:**
Add `AutomationPanel` inside the loan record page. Do NOT remove any existing components, trigger modals, or tab structure.

```tsx
<AutomationPanel
  recordType="loan"
  recordId={loan.id}
  contactId={loan.contact_id ?? ''}
  loanId={loan.id}
  currentStage={loan.status ?? ''}
  recipientEmail={borrowerContact?.email ?? loan.borrower_email ?? ''}
  recipientName={`${loan.borrower_first_name ?? ''} ${loan.borrower_last_name ?? ''}`.trim()}
/>
```

---

## Phase 3 — QA

After all builds complete:

1. `npx tsc --noEmit` — fix all errors
2. `npm run build` — must be clean
3. Read the final versions of contact and loan record pages — verify no existing imports/components were removed
4. Read all 3 new API routes — verify `getOrganization()` at top, org-scoped queries, no hardcoded values
5. Read `prompts.ts` — verify all 14 automations have prompts with safe fallbacks, JSON return format, no hardcoded LO identity

---

## Constraints

- `getOrganization()` on every API route — 401 if fails
- `organization_id` on every DB insert — never null
- All stage logic via `normalizeToStageKey()` from `lib/constants/loan-stages.ts` — no raw stage string comparisons
- Model: `CLAUDE_MODEL` from `@/lib/anthropic/model` — NEVER hardcode a model string
- No new npm packages
- Do not modify any existing API route
- Do not delete any existing component or tab
- Do not change existing Automations tab behavior
- `npm run build` clean before pushing
- Update `CONTEXT.md` and `CHANGELOG.md` when done
- `git add`, `git commit`, `git push origin main`

---

## N8N Webhook Note

The send route needs an n8n workflow that receives `{ to, subject, body, recipientName }` and creates an Outlook draft. This may already exist or may need to be built separately. If the env var `N8N_OUTLOOK_DRAFT_WEBHOOK_URL` is not set, the send button should show a clear error message: "Email dispatch not configured" — not a silent failure.

If no n8n webhook exists yet, the automation panel still works end-to-end for generating and editing drafts. The send step just won't work until the webhook is configured. This is acceptable for v1.
