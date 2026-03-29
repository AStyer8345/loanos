import { createClient } from '@/lib/supabase/server'
import { getOrganization } from '@/lib/getOrganization'
import { redirect } from 'next/navigation'
import GettingStartedWizard from './components/GettingStartedWizard'

export const dynamic = 'force-dynamic'

export default async function GettingStartedPage() {
  let organizationId: string
  let userId: string
  try {
    const ctx = await getOrganization()
    organizationId = ctx.organizationId
    userId = ctx.userId
  } catch {
    redirect('/auth/login')
  }

  const supabase = createClient()

  // Load org settings (onboarding state)
  const { data: settings } = await supabase
    .from('org_settings')
    .select('onboarding_completed, onboarding_step, setup_arive_done, setup_import_done, setup_automations_done')
    .eq('organization_id', organizationId)
    .single()

  // If already completed, redirect to dashboard
  if (settings?.onboarding_completed) {
    redirect('/dashboard')
  }

  // Load org + user profile for personalization
  const { data: org } = await supabase
    .from('organizations')
    .select('name, plan')
    .eq('id', organizationId)
    .single()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', userId)
    .single()

  // Current contact count
  const { count: contactCount } = await supabase
    .from('contacts')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId)

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'

  return (
    <GettingStartedWizard
      initialStep={settings?.onboarding_step ?? 0}
      setupAriveDone={settings?.setup_arive_done ?? false}
      setupImportDone={settings?.setup_import_done ?? false}
      setupAutomationsDone={settings?.setup_automations_done ?? false}
      orgName={org?.name ?? 'Your Organization'}
      userName={firstName}
      plan={org?.plan ?? 'starter'}
      contactCount={contactCount ?? 0}
    />
  )
}
