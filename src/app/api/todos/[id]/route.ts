import { createClient } from '@/lib/supabase/server'
import { getOrganization } from '@/lib/getOrganization'
import { NextResponse } from 'next/server'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { organizationId } = await getOrganization()
    const supabase = createClient()

    const body = await req.json()
    const { data, error } = await supabase
      .from('todo_items')
      .update(body)
      .eq('id', params.id)
      .eq('organization_id', organizationId)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const { organizationId } = await getOrganization()
    const supabase = createClient()

    const { error } = await supabase
      .from('todo_items')
      .delete()
      .eq('id', params.id)
      .eq('organization_id', organizationId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
