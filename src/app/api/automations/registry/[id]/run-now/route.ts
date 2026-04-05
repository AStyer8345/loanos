import { NextRequest, NextResponse } from 'next/server'
import { getOrganization } from '@/lib/getOrganization'
import { createServiceClient } from '@/lib/supabase/service'

// POST /api/automations/registry/[id]/run-now
// Trigger an n8n workflow execution manually
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const { organizationId } = await getOrganization()
    const supabase: any = createServiceClient() // eslint-disable-line @typescript-eslint/no-explicit-any

    const { data: automation, error } = await supabase
      .from('automation_registry')
      .select('source, source_id')
      .eq('id', id)
      .eq('org_id', organizationId)
      .single()

    if (error || !automation) {
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 })
    }

    if (automation.source !== 'n8n') {
      return NextResponse.json(
        { error: 'run-now is only supported for n8n automations' },
        { status: 400 }
      )
    }

    const n8nApiKey = process.env.N8N_API_KEY
    const n8nApiBase = process.env.N8N_API_BASE
    if (!n8nApiKey || !n8nApiBase) {
      return NextResponse.json({ error: 'N8N_API_KEY or N8N_API_BASE not configured' }, { status: 500 })
    }

    const n8nRes = await fetch(
      `${n8nApiBase}/workflows/${automation.source_id}/run`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-N8N-API-KEY': n8nApiKey,
        },
        body: JSON.stringify({}),
      }
    )

    if (!n8nRes.ok) {
      const text = await n8nRes.text()
      console.error(`n8n run failed: ${n8nRes.status} ${text}`)
      return NextResponse.json(
        { error: `n8n execution failed: ${n8nRes.status}` },
        { status: 502 }
      )
    }

    const result = await n8nRes.json()
    return NextResponse.json({ ok: true, executionId: result?.data?.executionId ?? null })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
