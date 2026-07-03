/**
 * /dashboard/performance — DEPRECATED 2026-07-03.
 *
 * The old page here was a seed-data demo backed by localStorage/performance_data.
 * Real compensation tracking now lives on the main /dashboard Performance tab
 * (CompensationPanel, driven by loan_compensation + comp_plans). This route
 * redirects there for any old links.
 */

import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function PerformancePage(): never {
  redirect('/dashboard')
}
