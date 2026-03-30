import { NextRequest, NextResponse } from 'next/server'
import { getOrganization } from '@/lib/getOrganization'
import { createServiceClient } from '@/lib/supabase/service'
import { checkRateLimit } from '@/lib/rateLimit'
import { getAnthropicClient } from '@/lib/anthropic/client'
import { CLAUDE_MODEL } from '@/lib/anthropic/model'

// POST /api/automations/registry/[id]/ask-claude
// Natural language instruction → proposed config JSON
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const { organizationId, userId } = await getOrganization()

    const { allowed } = checkRateLimit(`ask-claude:${userId}`, 10, 60_000)
    if (!allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    const body = await req.json()
    const instruction: string = body.instruction ?? ''

    if (!instruction || typeof instruction !== 'string' || instruction.trim().length < 3) {
      return NextResponse.json({ error: 'instruction is required' }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase: any = createServiceClient()

    const { data: automation, error } = await supabase
      .from('automation_registry')
      .select('config, name, description')
      .eq('id', id)
      .eq('org_id', organizationId)
      .single()

    if (error || !automation) {
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 })
    }

    const currentConfig = automation.config ?? {}

    const systemPrompt = `You are a configuration assistant for a mortgage loan officer automation system.
The user will describe a change they want to make to an automation's config in plain English.
You must return ONLY a valid JSON object representing the updated config — no explanation, no markdown, no code fences.

Automation name: ${automation.name}
Automation description: ${automation.description}

Config structure reference:
- AgentConfig: { focus_areas?: string[], avoid?: string, priority?: string }
- EmailConfig: { tone?: 'formal'|'conversational'|'casual', length?: 'short'|'medium'|'long', always_include?: string[], never_include?: string[] }
- AssistantConfig: { tone?: 'professional'|'friendly'|'casual', topics_focus?: string[], topics_avoid?: string[], key_instructions?: string }

The current config is: ${JSON.stringify(currentConfig, null, 2)}

Apply the user's instruction to produce an updated config object. Return ONLY the JSON object.`

    const anthropic = await getAnthropicClient()
    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: instruction.trim() }],
    })

    const rawText =
      message.content[0].type === 'text' ? message.content[0].text.trim() : ''

    let proposedConfig: unknown
    try {
      proposedConfig = JSON.parse(rawText)
    } catch {
      console.error('Claude returned invalid JSON:', rawText)
      return NextResponse.json(
        { error: 'Claude returned invalid JSON', raw: rawText },
        { status: 422 }
      )
    }

    return NextResponse.json({ current_config: currentConfig, proposed_config: proposedConfig })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
