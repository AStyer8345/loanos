import { NextRequest, NextResponse } from 'next/server'
import { getOrganization } from '@/lib/getOrganization'
import { checkRateLimit } from '@/lib/rateLimit'
import { getAnthropicClient } from '@/lib/anthropic/client'
import { CLAUDE_MODEL } from '@/lib/anthropic/model'
import { createServiceClient } from '@/lib/supabase/service'
import { fetchVoiceGuide } from '@/lib/voice/fetchVoiceGuide'

export async function POST(req: NextRequest) {
  let userId: string
  let organizationId: string
  try {
    const ctx = await getOrganization()
    userId = ctx.userId
    organizationId = ctx.organizationId
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { allowed } = checkRateLimit(`automation-refine:${userId}`, 30, 60_000)
  if (!allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  try {
    const { draftId, instruction, currentSubject, currentBody } = await req.json()

    if (!draftId || !instruction) {
      return NextResponse.json({ error: 'Missing required fields: draftId, instruction' }, { status: 400 })
    }

    const anthropic = await getAnthropicClient()

    // Fetch voice guide for consistent brand voice
    const { voiceGuide, voiceFeedback } = await fetchVoiceGuide(organizationId)

    const voiceBlock = voiceGuide
      ? `## Voice Guide (PRIMARY — follow this exactly)
${voiceGuide}

## Voice Feedback (patterns from past edits — do not repeat mistakes)
${voiceFeedback || 'No feedback yet.'}`
      : ''

    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1000,
      system: `You are refining an email draft based on the user's instruction.
${voiceBlock}
Keep the same voice and tone — trusted advisor, conversational, direct.
Plain text only — no HTML, no markdown formatting.
Return ONLY valid JSON: { "subject": "...", "body": "..." }`,
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
      // If parsing fails, use the raw text as the new body
      body = text
    }

    // Update the draft in email_drafts
    const supabase: any = createServiceClient() // eslint-disable-line @typescript-eslint/no-explicit-any
    const bodyPreview = body
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 200)

    await supabase
      .from('email_drafts')
      .update({
        subject,
        body_html: body,
        body_preview: bodyPreview,
        updated_at: new Date().toISOString(),
      })
      .eq('id', draftId)
      .eq('organization_id', organizationId)

    return NextResponse.json({ subject, body })
  } catch (error) {
    console.error('[automations/refine] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
