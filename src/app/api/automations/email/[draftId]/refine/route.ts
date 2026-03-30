import { NextRequest, NextResponse } from 'next/server'
import { getOrganization } from '@/lib/getOrganization'
import { checkRateLimit } from '@/lib/rateLimit'
import { getAnthropicClient } from '@/lib/anthropic/client'
import { CLAUDE_MODEL } from '@/lib/anthropic/model'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(
  req: NextRequest,
  { params }: { params: { draftId: string } }
) {
  let userId: string
  let organizationId: string
  try {
    const ctx = await getOrganization()
    userId = ctx.userId
    organizationId = ctx.organizationId
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { allowed } = checkRateLimit(`automation-email-refine:${userId}`, 30, 60_000)
  if (!allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  try {
    const { draftId } = params
    const { instruction, currentSubject, currentBody } = await req.json()

    if (!instruction) {
      return NextResponse.json({ error: 'Missing required field: instruction' }, { status: 400 })
    }

    const anthropic = await getAnthropicClient()

    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1000,
      system: `You are refining an email draft for a senior mortgage loan officer.
Keep the trusted advisor voice — conversational, direct, short punchy sentences.
Do not add fluff, inspiration, or filler phrases.
Return ONLY valid JSON with no markdown fences: { "subject": "...", "body": "..." }`,
      messages: [
        {
          role: 'user',
          content: `Current email draft:
Subject: ${currentSubject || '(no subject)'}
Body: ${currentBody || '(empty)'}

Instruction: ${instruction}

Refine the email and return the updated version as JSON.`,
        },
      ],
    })

    const text = response.content.find(b => b.type === 'text')?.text ?? ''

    let subject = currentSubject || ''
    let body = currentBody || ''
    try {
      const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
      const parsed = JSON.parse(cleaned)
      subject = parsed.subject || subject
      body = parsed.body || body
    } catch {
      body = text
    }

    // Strip HTML for preview
    const body_preview = body
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 200)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase: any = createServiceClient()

    const { error: updateError } = await supabase
      .from('email_drafts')
      .update({
        subject,
        body_html: body,
        body_preview,
        personalization_notes: instruction,
        updated_at: new Date().toISOString(),
      })
      .eq('id', draftId)
      .eq('organization_id', organizationId)

    if (updateError) {
      console.error('[automations/email/refine] Update error:', updateError)
      return NextResponse.json({ error: 'Failed to update draft' }, { status: 500 })
    }

    return NextResponse.json({ subject, body })
  } catch (error) {
    console.error('[automations/email/refine] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
