import { NextRequest, NextResponse } from 'next/server'
import { getOrganization } from '@/lib/getOrganization'
import { createServiceClient } from '@/lib/supabase/service'

const WHITELISTED_FIELDS = [
  'config',
  'status',
  'email_template',
  'email_mode',
  'email_variables',
  'email_test_data',
  'prompt_snapshot',
] as const

type WhitelistedField = (typeof WHITELISTED_FIELDS)[number]

// GET /api/automations/registry/[id]
// Fetch a single automation by id scoped to org
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const { organizationId } = await getOrganization()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase: any = createServiceClient()

    const { data, error } = await supabase
      .from('automation_registry')
      .select('*')
      .eq('id', id)
      .eq('org_id', organizationId)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 })
    }

    return NextResponse.json({ automation: data })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

// PATCH /api/automations/registry/[id]
// Update whitelisted fields; if status changes and source is n8n, sync to n8n
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const { organizationId } = await getOrganization()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase: any = createServiceClient()

    const body = await req.json()

    // Build update payload from whitelisted fields only
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }
    for (const field of WHITELISTED_FIELDS) {
      if (field in body) {
        updates[field as WhitelistedField] = body[field]
      }
    }

    if (Object.keys(updates).length === 1) {
      // Only updated_at — nothing to update
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    // Fetch the current row to check source and source_id
    const { data: existing, error: fetchError } = await supabase
      .from('automation_registry')
      .select('source, source_id, status')
      .eq('id', id)
      .eq('org_id', organizationId)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 })
    }

    // Persist to Supabase
    const { data: updated, error: updateError } = await supabase
      .from('automation_registry')
      .update(updates)
      .eq('id', id)
      .eq('org_id', organizationId)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to update automation:', updateError)
      return NextResponse.json({ error: 'Failed to update automation' }, { status: 500 })
    }

    // Sync status change to n8n if applicable
    const statusChanged = 'status' in body && body.status !== existing.status
    if (statusChanged && existing.source === 'n8n' && existing.source_id) {
      const n8nApiKey = process.env.N8N_API_KEY
      if (n8nApiKey) {
        try {
          const n8nRes = await fetch(
            `https://styer.app.n8n.cloud/api/v1/workflows/${existing.source_id}`,
            {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'X-N8N-API-KEY': n8nApiKey,
              },
              body: JSON.stringify({ active: body.status === 'active' }),
            }
          )
          if (!n8nRes.ok) {
            console.error(
              `n8n sync failed for workflow ${existing.source_id}: ${n8nRes.status} ${n8nRes.statusText}`
            )
          }
        } catch (n8nErr) {
          console.error('n8n sync error (non-blocking):', n8nErr)
        }
      }
    }

    return NextResponse.json({ automation: updated })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
