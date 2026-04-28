import TopNav from '@/components/TopNav'
import { OrgProvider } from '@/components/OrgProvider'
import { getOrgFeatures, DEFAULT_FEATURES } from '@/lib/features/getOrgFeatures'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let features = DEFAULT_FEATURES
  try {
    features = await getOrgFeatures()
  } catch {
    // unauthenticated layout render — middleware will redirect; keep defaults
  }

  return (
    <OrgProvider>
      <div className="min-h-screen bg-background">
        <TopNav features={features} />
        <main className="pt-14">
          {children}
        </main>
      </div>
    </OrgProvider>
  )
}
