import { createClient } from '@/lib/supabase/server'
import { getOrganization } from '@/lib/getOrganization'
import { NextResponse } from 'next/server'
import { parseTaskMutation } from '@/lib/tasks'

export async function GET(req: Request) {
  try {
    const { organizationId } = await getOrganization()
    const supabase = createClient()

    const filter = new URL(req.url).searchParams.get('filter') ?? 'open'
    const now = new Date()
    const todayEnd = new Date(now)
    todayEnd.setHours(23, 59, 59, 999)
    const upcomingEnd = new Date(todayEnd)
    upcomingEnd.setDate(upcomingEnd.getDate() + 7)

    let query = supabase
      .from('todo_items')
      .select('*')
      .eq('organization_id', organizationId)
      .order('due_at', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })

    if (filter === 'completed') query = query.eq('status', 'completed')
    else if (filter === 'overdue') query = query.in('status', ['open', 'in_progress']).lt('due_at', now.toISOString())
    else if (filter === 'today') query = query.in('status', ['open', 'in_progress']).lte('due_at', todayEnd.toISOString())
    else if (filter === 'upcoming') query = query.in('status', ['open', 'in_progress']).gt('due_at', todayEnd.toISOString()).lte('due_at', upcomingEnd.toISOString())
    else query = query.in('status', ['open', 'in_progress'])

    query = query.or(`snoozed_until.is.null,snoozed_until.lte.${now.toISOString()}`)
    const { data, error } = await query

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

    const body = parseTaskMutation(await req.json(), 'create')
    const { data, error } = await supabase
      .from('todo_items')
      .insert({ ...body, user_id: userId, organization_id: organizationId })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status: message === 'Unauthorized' ? 401 : 400 })
  }
}
