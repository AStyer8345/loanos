import { createClient } from '@/lib/supabase/server'
import { getOrganization } from '@/lib/getOrganization'
import { parseRouting } from '@/lib/command-center-routing'
import { NextResponse } from 'next/server'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  let context: Awaited<ReturnType<typeof getOrganization>>
  try { context = await getOrganization() }
  catch { return NextResponse.json({ error: 'Sign in to update a task.' }, { status: 401 }) }
  let body: ReturnType<typeof parseRouting>
  try { body = parseRouting(await req.json()) }
  catch { return NextResponse.json({ error: 'Choose a valid team member or routing reason.' }, { status: 400 }) }
  const db = createClient()
  if (body.assigned_to) {
    const { data, error } = await db.from('profiles').select('id').eq('id', body.assigned_to).eq('organization_id', context.organizationId).maybeSingle()
    if (error) return NextResponse.json({ error: 'Team membership could not be verified.' }, { status: 503 })
    if (!data) return NextResponse.json({ error: 'Assignee must belong to your team.' }, { status: 400 })
  }
  const { data, error } = await db.from('todo_items').update(body).eq('id', params.id).eq('organization_id', context.organizationId).select('id').maybeSingle()
  if (error) return NextResponse.json({ error: 'Task routing could not be saved.' }, { status: 503 })
  if (!data) return NextResponse.json({ error: 'Task not found.' }, { status: 404 })
  return NextResponse.json({ id: data.id }, { headers: { 'Cache-Control': 'private, no-store' } })
}
