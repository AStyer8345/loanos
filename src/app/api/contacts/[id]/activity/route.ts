import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase
      .from('contact_activity')
      .select('id, activity_type, notes, logged_at, created_by, loan_id')
      .eq('contact_id', params.id)
      .order('logged_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ activity: data })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { activity_type, notes, loan_id } = body

    if (!activity_type || !['call', 'email', 'text', 'note'].includes(activity_type)) {
      return NextResponse.json(
        { error: 'activity_type is required and must be one of: call, email, text, note' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('contact_activity')
      .insert({
        contact_id: params.id,
        activity_type,
        notes: notes || null,
        loan_id: loan_id || null,
        user_id: user.id,
        created_by: user.email ?? user.id,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, activity: data })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
