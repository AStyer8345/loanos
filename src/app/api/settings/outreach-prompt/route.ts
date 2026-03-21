import { NextRequest, NextResponse } from 'next/server'
import { getOrganization } from '@/lib/getOrganization'
import { createServiceClient } from '@/lib/supabase/service'
import { getDefaultOutreachPrompt } from '@/lib/defaultOutreachPrompt'

export async function GET() {
  try {
    const { organizationId } = await getOrganization()
    const supabase = createServiceClient()

    const { data } = await supabase
      .from('system_prompts')
      .select('content, updated_at')
      .eq('org_id', organizationId)
      .eq('name', 'outreach')
      .maybeSingle()

    return NextResponse.json({
      content: data?.content ?? getDefaultOutreachPrompt(),
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
      { org_id: organizationId, name: 'outreach', content: content.trim(), updated_by: userId, updated_at: new Date().toISOString() },
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
      .eq('name', 'outreach')

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
