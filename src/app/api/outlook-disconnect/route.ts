import { NextResponse } from 'next/server'

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

function sbHeaders() {
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
  }
}

export async function POST() {
  try {
    // Delete all rows from outlook_tokens (only Adam's account, no multi-user needed)
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/outlook_tokens?id=neq.00000000-0000-0000-0000-000000000000`,
      { method: 'DELETE', headers: sbHeaders() }
    )

    if (!res.ok) {
      const body = await res.text()
      return NextResponse.json({ ok: false, error: body }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
