import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { normalizeStage } from '@/lib/stageNormalization'

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, serviceKey)
}

type BulkActionBody = {
  contactIds: string[]
  action: 'update_stage' | 'update_type' | 'delete'
  value?: string
}

export async function POST(req: NextRequest) {
  try {
    const body: BulkActionBody = await req.json()
    const { contactIds, action, value } = body

    if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
      return NextResponse.json({ error: 'contactIds array required' }, { status: 400 })
    }

    if (!action) {
      return NextResponse.json({ error: 'action required' }, { status: 400 })
    }

    const supabase = getServiceClient()

    if (action === 'update_stage') {
      if (!value) {
        return NextResponse.json({ error: 'value required for update_stage' }, { status: 400 })
      }

      const { error } = await supabase
        .from('contacts')
        .update({ stage: normalizeStage(value) })
        .in('id', contactIds)

      if (error) {
        console.error('[bulk-action] update_stage error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      // Log activity for each contact
      await supabase.from('activity_log').insert(
        contactIds.map((id) => ({
          record_id: id,
          record_type: 'contact',
          action: 'stage_updated',
          details: `Bulk update: stage → "${value}"`,
        }))
      )

      return NextResponse.json({
        message: `Updated ${contactIds.length} contact${contactIds.length !== 1 ? 's' : ''} to stage "${value}"`,
        count: contactIds.length,
      })
    }

    if (action === 'update_type') {
      if (!value) {
        return NextResponse.json({ error: 'value required for update_type' }, { status: 400 })
      }

      const { error } = await supabase
        .from('contacts')
        .update({ contact_type: value })
        .in('id', contactIds)

      if (error) {
        console.error('[bulk-action] update_type error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      await supabase.from('activity_log').insert(
        contactIds.map((id) => ({
          record_id: id,
          record_type: 'contact',
          action: 'type_updated',
          details: `Bulk update: type → "${value}"`,
        }))
      )

      return NextResponse.json({
        message: `Updated ${contactIds.length} contact${contactIds.length !== 1 ? 's' : ''} to type "${value}"`,
        count: contactIds.length,
      })
    }

    if (action === 'delete') {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .in('id', contactIds)

      if (error) {
        console.error('[bulk-action] delete error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({
        message: `Deleted ${contactIds.length} contact${contactIds.length !== 1 ? 's' : ''}`,
        count: contactIds.length,
      })
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
  } catch (error) {
    console.error('[bulk-action] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
