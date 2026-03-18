import { createClient } from '@/lib/supabase/server'
import { getOrganization } from '@/lib/getOrganization'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const { organizationId } = await getOrganization()
    const supabase = createClient()

    const { data, error } = await supabase
      .from('todo_items')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_complete', false)
      .order('is_urgent', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function POST(req: Request) {
  try {
    const { organizationId, userId } = await getOrganization()
    const supabase = createClient()

    const body = await req.json()
    const { data, error } = await supabase
      .from('todo_items')
      .insert({ ...body, user_id: userId, organization_id: organizationId })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
