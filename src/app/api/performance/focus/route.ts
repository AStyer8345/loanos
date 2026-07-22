import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOrganization } from '@/lib/getOrganization'
import type { Json } from '@/lib/database.types'

const YEAR = new Date().getFullYear()

export async function GET() {
  try {
    const { organizationId } = await getOrganization()
    const supabase = createClient()
    const { data, error } = await supabase.from('performance_data').select('data').eq('organization_id', organizationId).eq('year', YEAR).maybeSingle()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    const envelope = (data?.data && typeof data.data === 'object' && !Array.isArray(data.data) ? data.data : {}) as Record<string, Json | undefined>
    return NextResponse.json({ data: envelope.focusCommand ?? null })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function PUT(req: Request) {
  try {
    const { organizationId } = await getOrganization()
    const focusCommand = await req.json() as Json
    const supabase = createClient()
    const { data: current, error: readError } = await supabase.from('performance_data').select('data').eq('organization_id', organizationId).eq('year', YEAR).maybeSingle()
    if (readError) return NextResponse.json({ error: readError.message }, { status: 500 })
    const envelope = (current?.data && typeof current.data === 'object' && !Array.isArray(current.data) ? current.data : {}) as Record<string, Json | undefined>
    const { error } = await supabase.from('performance_data').upsert({ organization_id: organizationId, year: YEAR, data: { ...envelope, focusCommand }, updated_at: new Date().toISOString() }, { onConflict: 'organization_id,year' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
