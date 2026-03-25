import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const YEAR = new Date().getFullYear()

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('performance_data')
    .select('data')
    .eq('year', YEAR)
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: data?.data ?? null })
}

export async function POST(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) return NextResponse.json({ error: 'No organization' }, { status: 400 })

  const body = await req.json()

  const { error } = await supabase
    .from('performance_data')
    .upsert(
      {
        organization_id: profile.organization_id,
        year: YEAR,
        data: body,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'organization_id,year' }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
