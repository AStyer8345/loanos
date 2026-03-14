import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { api_key, server_prefix } = await req.json()
  if (!api_key || !server_prefix) {
    return NextResponse.json({ ok: false, error: 'API key and server prefix are required' }, { status: 400 })
  }

  try {
    const res = await fetch(`https://${server_prefix}.api.mailchimp.com/3.0/ping`, {
      headers: {
        Authorization: `Basic ${Buffer.from(`anystring:${api_key}`).toString('base64')}`,
      },
    })
    if (res.ok) return NextResponse.json({ ok: true })
    const body = await res.json().catch(() => ({}))
    return NextResponse.json({ ok: false, error: (body as { detail?: string }).detail ?? `HTTP ${res.status}` })
  } catch {
    return NextResponse.json({ ok: false, error: 'Network error' })
  }
}
