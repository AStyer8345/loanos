# LoanOS — Email Draft Preview Feature
# Build this autonomously. Do not stop for input.

---

## WHAT WE'RE BUILDING

Every time an automation creates an Outlook draft, LoanOS should also:
1. Write the email payload to a Supabase `email_drafts` table
2. Display a preview panel in the LoanOS dashboard showing recent drafts

Outlook draft creation is NOT touched. This is additive only.

---

## CONTEXT

- Repo: ~/loanos
- Stack: Next.js 14, Supabase, Tailwind CSS
- Supabase project ref: uuqedsvjlkeszrbwzizl
- Supabase URL and service role key are in .env.local
- Existing automations fire via Zapier → Netlify dispatch webhook
- All existing automation code stays untouched

---

## STEP 1 — SUPABASE MIGRATION

Create this table in Supabase. Write and execute the migration file.

File: `supabase/migrations/[timestamp]_create_email_drafts.sql`

```sql
CREATE TABLE IF NOT EXISTS email_drafts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  loan_id UUID REFERENCES loans(id) ON DELETE SET NULL,
  automation_name TEXT NOT NULL, -- 'pre_approval', 'contract_received', 'final_cd', 'review_request', 'referral_intro', 'morning_report'
  recipient_name TEXT,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_preview TEXT, -- first 200 chars, plain text, auto-generated
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'discarded')),
  outlook_draft_id TEXT, -- store Outlook draft ID if available from Zapier response
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE TRIGGER update_email_drafts_updated_at
  BEFORE UPDATE ON email_drafts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Index for dashboard queries
CREATE INDEX idx_email_drafts_created_at ON email_drafts(created_at DESC);
CREATE INDEX idx_email_drafts_status ON email_drafts(status);
CREATE INDEX idx_email_drafts_contact_id ON email_drafts(contact_id);

-- RLS
ALTER TABLE email_drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON email_drafts
  USING (true) WITH CHECK (true);
```

---

## STEP 2 — SUPABASE HELPER FUNCTION

Create a reusable server-side helper that any automation can call to log a draft.

File: `lib/supabase/logEmailDraft.ts`

```typescript
import { createClient } from '@supabase/supabase-js'

interface EmailDraftPayload {
  automation_name: string
  recipient_name?: string
  recipient_email: string
  subject: string
  body_html: string
  contact_id?: string
  loan_id?: string
  outlook_draft_id?: string
}

export async function logEmailDraft(payload: EmailDraftPayload) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Generate plain text preview from HTML
  const body_preview = payload.body_html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 200)

  const { data, error } = await supabase
    .from('email_drafts')
    .insert({
      ...payload,
      body_preview,
      status: 'pending'
    })
    .select()
    .single()

  if (error) {
    console.error('[logEmailDraft] Failed to log email draft:', error)
    return null
  }

  return data
}
```

---

## STEP 3 — API ROUTE

Create an API route the frontend uses to fetch drafts and update status.

File: `app/api/email-drafts/route.ts`

```typescript
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET — fetch recent drafts
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || 'pending'
  const limit = parseInt(searchParams.get('limit') || '20')

  const { data, error } = await supabase
    .from('email_drafts')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ drafts: data })
}

// PATCH — update status (sent / discarded)
export async function PATCH(req: NextRequest) {
  const { id, status } = await req.json()

  if (!id || !status) {
    return NextResponse.json({ error: 'Missing id or status' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('email_drafts')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ draft: data })
}
```

---

## STEP 4 — FRONTEND PREVIEW COMPONENT

File: `components/EmailDraftPreview.tsx`

Build a preview panel that:
- Fetches pending drafts on mount and refreshes every 60 seconds
- Shows each draft as a card with: automation badge, recipient, subject, body preview, timestamp
- Clicking a card expands it to show full HTML body in a rendered iframe
- Each card has two action buttons: "Mark Sent" and "Discard"
- Pending count shown as a badge on the panel header
- Empty state: "No pending drafts" with a checkmark icon
- Loading state: skeleton cards
- Color-coded automation badges:
  - pre_approval → green
  - contract_received → blue
  - final_cd → gold
  - review_request → purple
  - referral_intro → orange
  - morning_report → gray

Use Tailwind CSS only. Match the dark theme of LoanOS (dark backgrounds, gold accents).

The component should look like a real email client preview — not a generic list.

```typescript
'use client'

import { useState, useEffect } from 'react'

interface EmailDraft {
  id: string
  automation_name: string
  recipient_name: string | null
  recipient_email: string
  subject: string
  body_html: string
  body_preview: string | null
  status: string
  created_at: string
}

const AUTOMATION_COLORS: Record<string, string> = {
  pre_approval: 'bg-green-900 text-green-300',
  contract_received: 'bg-blue-900 text-blue-300',
  final_cd: 'bg-yellow-900 text-yellow-300',
  review_request: 'bg-purple-900 text-purple-300',
  referral_intro: 'bg-orange-900 text-orange-300',
  morning_report: 'bg-gray-800 text-gray-300',
}

const AUTOMATION_LABELS: Record<string, string> = {
  pre_approval: 'Pre-Approval',
  contract_received: 'Contract',
  final_cd: 'Final CD',
  review_request: 'Review Request',
  referral_intro: 'Referral Intro',
  morning_report: 'Morning Report',
}

export default function EmailDraftPreview() {
  const [drafts, setDrafts] = useState<EmailDraft[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  const fetchDrafts = async () => {
    try {
      const res = await fetch('/api/email-drafts?status=pending&limit=20')
      const data = await res.json()
      setDrafts(data.drafts || [])
    } catch (err) {
      console.error('Failed to fetch drafts:', err)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id: string, status: 'sent' | 'discarded') => {
    await fetch('/api/email-drafts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status })
    })
    setDrafts(prev => prev.filter(d => d.id !== id))
    if (expanded === id) setExpanded(null)
  }

  useEffect(() => {
    fetchDrafts()
    const interval = setInterval(fetchDrafts, 60000)
    return () => clearInterval(interval)
  }, [])

  // Build full component UI here with Tailwind
  // Include: header with pending count badge, draft cards, expanded view with iframe, action buttons
  // Skeleton loading state, empty state
  // See design requirements above
}
```

Complete the full component implementation. Do not leave it as a skeleton.

---

## STEP 5 — ADD TO DASHBOARD

Find the main LoanOS dashboard page (likely `app/dashboard/page.tsx` or `app/page.tsx`).

Import and add `<EmailDraftPreview />` to the dashboard layout.
Place it in a logical position — right sidebar or below the pipeline summary.
Do not break existing dashboard layout.

---

## STEP 6 — WIRE UP ONE AUTOMATION AS PROOF OF CONCEPT

Find the pre-approval email automation (likely in `app/api/` or `lib/automations/`).

After the Outlook draft is created, add:

```typescript
await logEmailDraft({
  automation_name: 'pre_approval',
  recipient_name: borrowerName,
  recipient_email: borrowerEmail,
  subject: emailSubject,
  body_html: emailHtml,
  contact_id: contactId ?? undefined
})
```

Import from `lib/supabase/logEmailDraft`.
This is the only automation to wire up now — confirm it works before touching others.

---

## STEP 7 — VERIFY

1. Trigger the pre-approval automation with a test contact
2. Confirm the draft appears in Supabase `email_drafts` table
3. Confirm it renders in the LoanOS dashboard preview panel
4. Confirm "Mark Sent" removes it from the pending list
5. Confirm Outlook draft creation is still working (untouched)

If any step fails, fix it before exiting.

---

## DONE

You have built:
- `email_drafts` Supabase table with RLS
- `logEmailDraft` helper function
- `/api/email-drafts` GET + PATCH route
- `EmailDraftPreview` dashboard component
- Pre-approval automation wired as proof of concept

All existing automations and Outlook draft behavior are unchanged.
Exit cleanly.
