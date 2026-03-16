import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { logEmailDraft } from '@/lib/supabase/logEmailDraft'
import { logEmail } from '@/lib/logEmail'
import { validateAgentSecret } from '@/lib/auth/validateAgentSecret'
import { createServiceClient } from '@/lib/supabase/service'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ── Milestone → human-readable label ─────────────────────────────────────────
const MILESTONE_LABELS: Record<string, string> = {
  application_received:  'Application Received',
  processing:            'File in Processing',
  appraisal_ordered:     'Appraisal Ordered',
  conditional_approval:  'Conditional Loan Approval',
  clear_to_close:        'Clear to Close',
  closing_scheduled:     'Closing Scheduled',
  funded:                'Loan Funded',
}

// ── Push one draft to Outlook via Zapier dispatch webhook ─────────────────────
async function pushDraftToOutlook(
  recipientEmail: string,
  subject: string,
  body: string
): Promise<boolean> {
  const dispatchUrl = process.env.ZAPIER_DISPATCH_WEBHOOK_URL
  const dispatchSecret = process.env.DISPATCH_SECRET

  if (!dispatchUrl || !dispatchSecret) {
    console.warn('[milestone] ZAPIER_DISPATCH_WEBHOOK_URL or DISPATCH_SECRET not set — skipping push')
    return false
  }

  try {
    const res = await fetch(dispatchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${dispatchSecret}`,
      },
      body: JSON.stringify({ to: recipientEmail, subject, body }),
    })
    return res.ok
  } catch (err) {
    console.error('[milestone] Zapier dispatch error:', err)
    return false
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const authError = validateAgentSecret(req)
  if (authError) return authError

  try {
    const body = await req.json()
    const {
      loan_id,
      milestone,
      borrower_name,
      borrower_email,
      realtor_name,
      realtor_email,
      property_address,
    } = body

    if (!loan_id || !milestone) {
      return NextResponse.json({ error: 'loan_id and milestone are required' }, { status: 400 })
    }

    const validMilestones = Object.keys(MILESTONE_LABELS)
    if (!validMilestones.includes(milestone)) {
      return NextResponse.json(
        { error: `Invalid milestone. Must be one of: ${validMilestones.join(', ')}` },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()
    const milestoneLabel = MILESTONE_LABELS[milestone]

    // ── 1. Insert milestone event ──────────────────────────────────────────────
    const { data: event, error: eventError } = await supabase
      .from('loan_milestone_events')
      .insert({
        loan_id,
        milestone,
        borrower_name:  borrower_name  ?? null,
        borrower_email: borrower_email ?? null,
        realtor_name:   realtor_name   ?? null,
        realtor_email:  realtor_email  ?? null,
        raw_payload: body,
      })
      .select('id')
      .single()

    if (eventError || !event) {
      console.error('[milestone] Failed to insert milestone event:', eventError)
      return NextResponse.json({ error: 'Failed to log milestone event' }, { status: 500 })
    }

    const eventId = event.id
    const results: { borrower?: object; realtor?: object } = {}

    // Look up contact_id so logEmail() can link to the contact record
    const { data: loanRecord } = await supabase
      .from('loans')
      .select('contact_id')
      .eq('id', loan_id)
      .single()
    const contactId = loanRecord?.contact_id ?? null

    // ── 2. Draft borrower email (if email provided) ───────────────────────────
    if (borrower_email) {
      const borrowerPrompt = `You are Adam Styer, a senior mortgage broker in Austin, TX. Write a short, warm email to a homebuyer about their loan milestone.

Milestone: ${milestoneLabel}
Borrower name: ${borrower_name ?? 'there'}
Property: ${property_address ?? 'your property'}
Loan ID: ${loan_id}

Guidelines:
- Plain English, warm and encouraging — not corporate
- 3–5 sentences max
- No jargon, no acronyms
- End with a brief next-step or reassurance
- Sign off as: Adam Styer | Mortgage Solutions LP

Return ONLY a JSON object with keys "subject" and "body" (body is plain text, no HTML).`

      const borrowerMsg = await anthropic.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 512,
        messages: [{ role: 'user', content: borrowerPrompt }],
      })

      const borrowerRaw = (borrowerMsg.content[0] as { type: string; text: string }).text.trim()
      let borrowerSubject = `Your Loan Update: ${milestoneLabel}`
      let borrowerBody = borrowerRaw

      try {
        const parsed = JSON.parse(borrowerRaw)
        borrowerSubject = parsed.subject ?? borrowerSubject
        borrowerBody    = parsed.body    ?? borrowerBody
      } catch {
        // Claude didn't return JSON — use raw text as body
      }

      // Insert communication record
      const { data: borrowerComm } = await supabase
        .from('milestone_communications')
        .insert({
          milestone_event_id: eventId,
          recipient_type:  'borrower',
          recipient_email: borrower_email,
          subject: borrowerSubject,
          body:    borrowerBody,
        })
        .select('id')
        .single()

      // Push to Outlook
      const pushed = await pushDraftToOutlook(borrower_email, borrowerSubject, borrowerBody)
      if (pushed && borrowerComm) {
        await supabase
          .from('milestone_communications')
          .update({ draft_pushed: true, draft_pushed_at: new Date().toISOString() })
          .eq('id', borrowerComm.id)
      }

      // Log to email_drafts for dashboard preview
      await logEmailDraft({
        automation_name: 'milestone',
        recipient_name: borrower_name ?? undefined,
        recipient_email: borrower_email,
        subject: borrowerSubject,
        body_html: borrowerBody,
        loan_id: loan_id ?? undefined,
      })

      // Log to contact_emails for permanent audit trail
      await logEmail({
        contact_id: contactId,
        loan_id: loan_id ?? null,
        subject: borrowerSubject,
        body_text: borrowerBody,
        automation_source: 'milestone',
      })

      results.borrower = { subject: borrowerSubject, pushed }
    }

    // ── 3. Draft realtor email (if email provided) ────────────────────────────
    if (realtor_email) {
      const realtorPrompt = `You are Adam Styer, a senior mortgage broker in Austin, TX. Write a brief professional email to a real estate agent about their client's loan milestone.

Milestone: ${milestoneLabel}
Agent name: ${realtor_name ?? 'there'}
Borrower name: ${borrower_name ?? 'the borrower'}
Property: ${property_address ?? 'the subject property'}
Loan ID: ${loan_id}

Guidelines:
- Professional and concise — agents are busy
- 2–3 sentences max
- Confirm the milestone, note any action needed from their side if applicable
- No filler, no fluff
- Sign off as: Adam Styer | Mortgage Solutions LP | NMLS #513013

Return ONLY a JSON object with keys "subject" and "body" (body is plain text, no HTML).`

      const realtorMsg = await anthropic.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 512,
        messages: [{ role: 'user', content: realtorPrompt }],
      })

      const realtorRaw = (realtorMsg.content[0] as { type: string; text: string }).text.trim()
      let realtorSubject = `Loan Update — ${milestoneLabel} | ${borrower_name ?? loan_id}`
      let realtorBody = realtorRaw

      try {
        const parsed = JSON.parse(realtorRaw)
        realtorSubject = parsed.subject ?? realtorSubject
        realtorBody    = parsed.body    ?? realtorBody
      } catch {
        // Claude didn't return JSON — use raw text as body
      }

      // Insert communication record
      const { data: realtorComm } = await supabase
        .from('milestone_communications')
        .insert({
          milestone_event_id: eventId,
          recipient_type:  'realtor',
          recipient_email: realtor_email,
          subject: realtorSubject,
          body:    realtorBody,
        })
        .select('id')
        .single()

      // Push to Outlook
      const pushed = await pushDraftToOutlook(realtor_email, realtorSubject, realtorBody)
      if (pushed && realtorComm) {
        await supabase
          .from('milestone_communications')
          .update({ draft_pushed: true, draft_pushed_at: new Date().toISOString() })
          .eq('id', realtorComm.id)
      }

      // Log to email_drafts for dashboard preview
      await logEmailDraft({
        automation_name: 'milestone',
        recipient_name: realtor_name ?? undefined,
        recipient_email: realtor_email,
        subject: realtorSubject,
        body_html: realtorBody,
        loan_id: loan_id ?? undefined,
      })

      // Log to contact_emails for permanent audit trail
      await logEmail({
        contact_id: contactId,
        loan_id: loan_id ?? null,
        subject: realtorSubject,
        body_text: realtorBody,
        automation_source: 'milestone',
      })

      results.realtor = { subject: realtorSubject, pushed }
    }

    // ── 4. Mark event as processed ────────────────────────────────────────────
    await supabase
      .from('loan_milestone_events')
      .update({ processed_at: new Date().toISOString() })
      .eq('id', eventId)

    return NextResponse.json({
      ok: true,
      event_id: eventId,
      milestone,
      results,
    })
  } catch (err) {
    console.error('[milestone] Unhandled error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
