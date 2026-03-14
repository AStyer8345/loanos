import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { api_key } = await req.json()
  if (!api_key) return NextResponse.json({ ok: false, error: 'No API key provided' }, { status: 400 })

  try {
    const res = await fetch('https://api.anthropic.com/v1/models', {
      headers: {
        'x-api-key': api_key,
        'anthropic-version': '2023-06-01',
      },
    })
    if (res.ok) return NextResponse.json({ ok: true })
    const body = await res.json().catch(() => ({}))
    return NextResponse.json({ ok: false, error: (body as { error?: { message?: string } }).error?.message ?? `HTTP ${res.status}` })
  } catch {
    return NextResponse.json({ ok: false, error: 'Network error' })
  }
}
