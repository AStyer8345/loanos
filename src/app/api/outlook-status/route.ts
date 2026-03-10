import { NextResponse } from 'next/server'

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

function sbHeaders() {
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
  }
}

export async function GET() {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/outlook_tokens?order=updated_at.desc&limit=1`,
      { headers: sbHeaders() }
    )

    if (!res.ok) {
      return NextResponse.json({ connected: false, email: null, expires_at: null, token_valid: false })
    }

    const rows = await res.json()
    if (!rows || rows.length === 0) {
      return NextResponse.json({ connected: false, email: null, expires_at: null, token_valid: false })
    }

    const token = rows[0]
    const bufferMs = 5 * 60 * 1000
    const token_valid = new Date(token.expires_at).getTime() > Date.now() + bufferMs

    return NextResponse.json({
      connected: true,
      email: token.email,
      expires_at: token.expires_at,
      token_valid,
    })
  } catch {
    return NextResponse.json(
      { connected: false, email: null, expires_at: null, token_valid: false },
      { status: 500 }
    )
  }
}
