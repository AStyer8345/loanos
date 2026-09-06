import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import { readStaffAccess, staffPathAllowed } from './staff-access'

/** Runs before ALL application routes, including previously exempt API routes. */
export async function staffBoundary(request: NextRequest): Promise<NextResponse | null> {
  const token = request.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1]
  const hasCookie = request.cookies.getAll().some(c => c.name.startsWith('sb-'))
  if (!token && !hasCookie) return null
  const clients = []
  if (token) clients.push(createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false, autoRefreshToken: false },
  }))
  if (hasCookie) clients.push(createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll: () => request.cookies.getAll(), setAll: () => {} },
  }))
  try {
    let access = null
    for (const db of clients) {
      const { data: { user } } = await db.auth.getUser()
      if (!user) continue // automation tokens use their existing per-route checks
      const candidate = await readStaffAccess(db)
      if (candidate) access = candidate
    }
    if (!access) return null
    const path = request.nextUrl.pathname
    if (!access.active) return NextResponse.json({ error: 'Your team access is not active.' }, { status: 403, headers: { 'Cache-Control': 'private, no-store' } })
    if (staffPathAllowed(path)) return null
    if (path.startsWith('/api/')) return NextResponse.json({ error: 'Use your team workspace.' }, { status: 403, headers: { 'Cache-Control': 'private, no-store' } })
    return NextResponse.redirect(new URL('/team', request.url))
  } catch {
    return NextResponse.json({ error: 'Access settings are temporarily unavailable.' }, { status: 503, headers: { 'Cache-Control': 'private, no-store' } })
  }
}
