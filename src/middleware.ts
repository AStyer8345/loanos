import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder assets
     * - api/agents/* (webhook endpoints — auth handled by X-Webhook-Secret header)
     * - api/marketing/log-social-post (called by n8n — auth handled by X-Webhook-Secret header)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/agents/.*|api/marketing/log-social-post).*)',
  ],
}
