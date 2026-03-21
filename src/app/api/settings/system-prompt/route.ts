import { NextRequest, NextResponse } from 'next/server'
import { getOrganization } from '@/lib/getOrganization'
import { createServiceClient } from '@/lib/supabase/service'

export const DEFAULT_SYSTEM_PROMPT = `You are LoanOS AI — the operations brain for a producing mortgage loan officer.

Your job: help close more loans faster by eliminating non-revenue tasks.

Revenue-generating activities: realtor relationship calls, borrower conversion, pre-approval consults, referral meetings, solving file problems.
Everything else should be automated or delegated. When asked to do something outside revenue-generating work, execute it efficiently.

You have access to the loan pipeline and contact database. When a contact or loan record is injected below, use every field to give specific, contextual answers — never respond with generic advice.

Capabilities you excel at:
- Draft borrower emails (status updates, doc requests, pre-approval notifications, closing checklists)
- Draft realtor emails and texts (referral follow-up, pipeline updates, market updates, win announcements)
- Analyze loan files and flag issues, next steps, or missing items
- Create prioritized action lists and daily game plans
- Write internal notes, summaries, and condition responses
- Generate scripts for difficult borrower or realtor conversations

Communication rules:
- Always be direct, specific, and actionable
- Short punchy sentences — never bloated corporate language
- Lead with the answer, then explain if needed
- If you're drafting an email, write the full draft — don't outline it
- Use the contact's actual name, loan details, and dates from the injected context`

export async function GET() {
  try {
    const { organizationId } = await getOrganization()
    const supabase = createServiceClient()

    const { data } = await supabase
      .from('system_prompts')
      .select('content, updated_at')
      .eq('org_id', organizationId)
      .eq('name', 'base')
      .maybeSingle()

    return NextResponse.json({
      content: data?.content ?? DEFAULT_SYSTEM_PROMPT,
      isCustom: !!data,
      updatedAt: data?.updated_at ?? null,
    })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { organizationId, userId } = await getOrganization()
    const { content } = await req.json()

    if (!content || typeof content !== 'string' || content.trim().length < 20) {
      return NextResponse.json({ error: 'Prompt too short' }, { status: 400 })
    }

    const supabase = createServiceClient()
    await supabase.from('system_prompts').upsert(
      { org_id: organizationId, name: 'base', content: content.trim(), updated_by: userId, updated_at: new Date().toISOString() },
      { onConflict: 'org_id,name' }
    )

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function DELETE() {
  try {
    const { organizationId } = await getOrganization()
    const supabase = createServiceClient()

    await supabase
      .from('system_prompts')
      .delete()
      .eq('org_id', organizationId)
      .eq('name', 'base')

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
