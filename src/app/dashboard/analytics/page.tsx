/**
 * /dashboard/analytics — DEPRECATED 2026-04-18.
 *
 * The three widgets that lived here (AEO vs SEO, Source Conversion,
 * Realtor Performance Top 10) now live on the main /dashboard
 * Performance tab. This route just redirects there for any old links.
 */

import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function AnalyticsPage(): never {
  redirect('/dashboard')
}
