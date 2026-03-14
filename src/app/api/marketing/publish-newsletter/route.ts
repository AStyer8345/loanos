import { NextRequest, NextResponse } from 'next/server'

/**
 * Publishes a generated newsletter page to styermortgage.com via the
 * configured dispatch webhook URL.
 *
 * Expected payload from the site's dispatch handler:
 *   { type, audience, slug, title, html }
 * Authorization: Bearer {dispatch_secret}
 */
export async function POST(req: NextRequest) {
  const { dispatch_url, dispatch_secret, audience, slug, title, html } = await req.json()

  if (!dispatch_url) {
    return NextResponse.json(
      { error: 'Dispatch webhook URL not configured. Set it in Settings → Website.' },
      { status: 400 },
    )
  }
  if (!slug || !title || !html) {
    return NextResponse.json({ error: 'slug, title, and html are required' }, { status: 400 })
  }

  try {
    const res = await fetch(dispatch_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(dispatch_secret ? { Authorization: `Bearer ${dispatch_secret}` } : {}),
      },
      body: JSON.stringify({
        type:     'newsletter',
        audience: (audience as string).toLowerCase(),
        slug,
        title,
        html,
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      return NextResponse.json(
        { error: `Dispatch returned HTTP ${res.status}: ${body.slice(0, 200)}` },
        { status: 400 },
      )
    }

    const data = await res.json().catch(() => ({})) as { url?: string }
    return NextResponse.json({ ok: true, url: data.url })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
