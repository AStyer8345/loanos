import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getOrganization } from '@/lib/getOrganization'
import Link from 'next/link'
import ScenarioList from './ScenarioList'

export const dynamic = 'force-dynamic'

export default async function ScenariosPage() {
  let organizationId: string
  try {
    const ctx = await getOrganization()
    organizationId = ctx.organizationId
  } catch {
    redirect('/auth/login')
  }
  const supabase = createClient()

  const [{ data: scenarios }, { count: qaNeededCount }] = await Promise.all([
    supabase
      .from('scenarios')
      .select('id, scenario_type, borrower_name, property_address, created_at, updated_at, view_count, share_token')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false }),
    supabase
      .from('scenarios')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .is('borrower_qa', null),
  ])

  return (
    <div className="min-h-screen font-sans" style={{ background: 'var(--sc-bg)', color: 'var(--sc-text)', fontFamily: "'IBM Plex Sans', sans-serif" }}>
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Scenarios</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--sc-muted)' }}>
              {scenarios?.length ?? 0} saved scenario{(scenarios?.length ?? 0) !== 1 ? 's' : ''}
            </p>
          </div>
          <Link
            href="/dashboard/scenarios/new"
            className="px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ background: 'var(--sc-gold)', color: 'var(--bg)' }}
          >
            + New Scenario
          </Link>
        </div>

        <ScenarioList scenarios={scenarios ?? []} qaNeededCount={qaNeededCount ?? 0} />
      </div>
    </div>
  )
}
