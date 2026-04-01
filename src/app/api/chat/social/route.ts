import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getAnthropicClient } from '@/lib/anthropic/client'
import { getOrganization } from '@/lib/getOrganization'
import { checkRateLimit } from '@/lib/rateLimit'
import { CLAUDE_MODEL } from '@/lib/anthropic/model'
import type { MessageParam } from '@anthropic-ai/sdk/resources/messages'

async function buildSocialSystemPrompt(
  organizationId: string,
  draftId?: string,
  compose?: boolean
): Promise<string> {
  const supabase = createServiceClient() as any // eslint-disable-line @typescript-eslint/no-explicit-any

  // Load voice guide from social_settings
  const { data: voiceRow } = await supabase
    .from('social_settings')
    .select('value')
    .eq('organization_id', organizationId)
    .eq('key', 'voice_guide')
    .maybeSingle()

  const voiceGuide = voiceRow?.value || 'No voice guide configured yet.'

  // Load voice feedback (learnings from Adam's edits and rejections)
  const { data: feedbackRow } = await supabase
    .from('social_settings')
    .select('value')
    .eq('organization_id', organizationId)
    .eq('key', 'voice_feedback')
    .maybeSingle()

  const voiceFeedback = feedbackRow?.value || ''

  let draftContext = ''
  if (draftId) {
    const { data: draft } = await supabase
      .from('social_drafts')
      .select('title, platform, format, pillar, content, hashtags, agent_notes')
      .eq('id', draftId)
      .maybeSingle()

    if (draft) {
      draftContext = `## Current Post
- Title: ${draft.title || 'Untitled'}
- Platform: ${draft.platform || 'N/A'}
- Format: ${draft.format || 'N/A'}
- Pillar: ${draft.pillar || 'N/A'}
- Content: ${draft.content || '(empty)'}
- Hashtags: ${draft.hashtags || 'None'}
- Agent Notes: ${draft.agent_notes || 'None'}`
    }
  } else if (compose) {
    draftContext = `## Current Post
The user wants to create a new post. Generate a complete social media post based on their prompt.`
  }

  return `You are Adam Styer's social media content assistant. You write and edit social media posts using his voice, tone, and style.

## Voice & Workflow Guide
${voiceGuide}

${voiceFeedback ? `## Feedback from Adam's Edits & Rejections\nLearn from these — do not repeat the same mistakes:\n${voiceFeedback}\n` : ''}
${draftContext}

## Rules
- Follow Adam's voice guide exactly
- NMLS# 513013 required on any post mentioning rates, loan products, or mortgage services
- No guaranteed approval language
- No specific rate percentages without APR disclosure
- Business name: Adam Styer | Mortgage Solutions LP (never "The Styer Team")
- Keep posts short and punchy — Adam's voice, not corporate
- When editing, return ONLY the updated post content (no explanations unless asked)`
}

// POST /api/chat/social
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

  const { allowed } = checkRateLimit(`chat-social:${userId}`, 30, 60_000)
  if (!allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  try {
    const { messages, draftId, compose, platform, format, mediaUrls } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array required' }, { status: 400 })
    }

    const systemPrompt = await buildSocialSystemPrompt(organizationId, draftId, compose)
    const anthropic = await getAnthropicClient()

    // Normalize messages for the Anthropic API
    const apiMessages: MessageParam[] = messages.map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2048,
      system: systemPrompt,
      messages: apiMessages,
    })

    const text = response.content.find((b) => b.type === 'text')?.text ?? ''
    const assistantMessage = { role: 'assistant' as const, content: text }
    const supabase = createServiceClient() as any // eslint-disable-line @typescript-eslint/no-explicit-any

    // Compose mode — create a new draft from Claude's response
    if (compose) {
      const title = text.split('\n')[0]?.slice(0, 40) || 'Untitled post'

      // Validate format against DB check constraint
      const VALID_FORMATS = ['single_image', 'carousel', 'video', 'reel_script', 'text_only']
      const safeFormat = format && VALID_FORMATS.includes(format) ? format : null

      // Validate platform
      const VALID_PLATFORMS = ['instagram', 'linkedin', 'facebook', 'all']
      const safePlatform = platform && VALID_PLATFORMS.includes(platform) ? platform : 'all'

      const { data: newDraft, error: insertError } = await supabase
        .from('social_drafts')
        .insert({
          organization_id: organizationId,
          platform: safePlatform,
          format: safeFormat,
          title,
          content: text,
          media_urls: mediaUrls?.length ? mediaUrls : null,
          status: 'draft',
          created_by: 'human',
          agent_notes: 'Created via compose mode',
        })
        .select('id, title, platform')
        .single()

      if (insertError) {
        console.error('[chat/social] Draft insert error:', insertError)
        return NextResponse.json({
          error: `Failed to save draft: ${insertError.message}`,
          message: assistantMessage,
        }, { status: 500 })
      }

      const { error: activityError } = await supabase
        .from('social_activity')
        .insert({
          organization_id: organizationId,
          action: 'drafted',
          detail: `New draft: "${newDraft?.title}" (${newDraft?.platform})`,
        })

      if (activityError) {
        console.error('[chat/social] Activity insert error:', activityError)
      }

      return NextResponse.json({
        message: assistantMessage,
        draftId: newDraft?.id,
      })
    }

    // Edit mode — update the existing draft with Claude's edited content
    if (draftId) {
      await supabase
        .from('social_drafts')
        .update({
          content: text,
          updated_at: new Date().toISOString(),
        })
        .eq('id', draftId)

      return NextResponse.json({
        message: assistantMessage,
        draftId,
      })
    }

    // General chat mode — no draft interaction
    return NextResponse.json({ message: assistantMessage })
  } catch (error) {
    console.error('[chat/social] POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
