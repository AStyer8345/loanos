import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOrganization } from '@/lib/getOrganization'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { organizationId } = await getOrganization()
    const supabase = createClient()

    const { data, error } = await supabase
      .from('contact_activity')
      .select('id, activity_type, notes, logged_at, created_by, loan_id')
      .eq('contact_id', params.id)
      .eq('organization_id', organizationId)
      .order('logged_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ activity: data })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { organizationId, userId } = await getOrganization()
    const supabase = createClient()

    const body = await req.json()
    const { activity_type, notes, loan_id } = body

    if (!activity_type || !['call', 'email', 'text', 'note'].includes(activity_type)) {
      return NextResponse.json(
        { error: 'activity_type is required and must be one of: call, email, text, note' },
        { status: 400 }
      )
    }

    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('contact_activity')
      .insert({
        contact_id: params.id,
        activity_type,
        notes: notes || null,
        loan_id: loan_id || null,
        user_id: userId,
        created_by: user?.email ?? userId,
        organization_id: organizationId,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, activity: data })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
