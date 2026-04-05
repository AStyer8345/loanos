import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { createServerClient } from '@supabase/ssr'

/**
 * Path prefixes that require the $197 professional tier.
 * Any request matching one of these is 402'd (API) or redirected to /dashboard/billing (UI)
 * when the org's plan !== 'professional'.
 */
const PROFESSIONAL_API_PREFIXES = [
  '/api/drip',
  '/api/automations',
  '/api/chat',
  '/api/agents',
  '/api/social/publish',
  '/api/performance',
  '/api/scenarios/save',
  '/api/scenarios/generate-pdf',
  '/api/scenarios/send-email',
  '/api/outreach',
]

const PROFESSIONAL_UI_PREFIXES = [
  '/dashboard/drip',
  '/dashboard/automations',
  '/dashboard/marketing',
  '/dashboard/performance',
]

function isProfessionalApi(pathname: string): boolean {
  return PROFESSIONAL_API_PREFIXES.some((p) => pathname.startsWith(p))
}

function isProfessionalUi(pathname: string): boolean {
  return PROFESSIONAL_UI_PREFIXES.some((p) => pathname.startsWith(p))
}

export async function middleware(request: NextRequest) {
  const response = await updateSession(request)
  const { pathname } = request.nextUrl

  // Fast path — nothing we care about
  if (!pathname.startsWith('/dashboard') && !pathname.startsWith('/api')) {
    return response
  }

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

  // For API routes gated by plan, we need both a session and a pro plan.
  // For agent-secret API routes, the per-route Bearer check still applies;
  // middleware only enforces plan for session-authed calls.
  if (pathname.startsWith('/api')) {
    if (!isProfessionalApi(pathname)) return response
    if (!user) return response // per-route auth handles agent-secret cases
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()
    if (!profile?.organization_id) return response
    const { data: org } = await supabase
      .from('organizations')
      .select('plan')
      .eq('id', profile.organization_id)
      .single()
    if (org?.plan !== 'professional') {
      return NextResponse.json(
        {
          error: 'Plan upgrade required',
          requiredPlan: 'professional',
          currentPlan: org?.plan || 'starter',
          message: 'This feature requires the Professional plan ($197/mo).',
        },
        { status: 402 }
      )
    }
    return response
  }

  // /dashboard/* path — existing auth + onboarding checks
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

  // Plan gate for pro-only dashboard sections
  if (isProfessionalUi(pathname)) {
    const { data: org } = await supabase
      .from('organizations')
      .select('plan')
      .eq('id', profile.organization_id)
      .single()
    if (org?.plan !== 'professional') {
      return NextResponse.redirect(new URL('/dashboard/billing?upgrade=required', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/agents/.*|api/contacts/web-lead|api/marketing/log-social-post|onboarding|share/.*|api/share/.*).*)',
  ],
}
