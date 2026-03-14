import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST — create a new draft (for external callers like n8n; internal code uses logEmailDraft() directly)
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { automation_name, recipient_email, subject, body_html } = body

  if (!automation_name || !recipient_email || !subject || !body_html) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const body_preview = String(body_html)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 200)

  const { data, error } = await supabase
    .from('email_drafts')
    .insert({ ...body, body_preview, status: 'pending' })
    .select()
    .single()

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ draft: data }, { status: 201 })
}

// GET — fetch recent drafts
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || 'pending'
  const limit = parseInt(searchParams.get('limit') || '20')

  const { data, error } = await supabase
    .from('email_drafts')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ drafts: data })
}

// PATCH — update status (sent / discarded)
export async function PATCH(req: NextRequest) {
  const { id, status } = await req.json()

  if (!id || !status) {
    return NextResponse.json({ error: 'Missing id or status' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('email_drafts')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ draft: data })
}
