import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const response = await updateSession(request)

  // Only guard dashboard routes
  const { pathname } = request.nextUrl
  if (!pathname.startsWith('/dashboard')) return response

  // Check logged-in user has a profile with org assignment
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return response // updateSession already redirects to login

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) {
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }

  // Redirect first-time users to getting-started wizard
  if (pathname === '/dashboard') {
    const { data: settings } = await supabase
      .from('org_settings')
      .select('onboarding_completed')
      .eq('organization_id', profile.organization_id)
      .single()
    if (settings && settings.onboarding_completed === false) {
      return NextResponse.redirect(new URL('/dashboard/getting-started', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/agents/.*|api/contacts/web-lead|api/marketing/log-social-post|onboarding|share/.*|api/share/.*).*)',
  ],
}
