import TopNav from '@/components/TopNav'
import { OrgProvider } from '@/components/OrgProvider'

export const dynamic = 'force-dynamic'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <OrgProvider>
      <div className="min-h-screen bg-background">
        <TopNav />
        <main className="pt-14">
          {children}
        </main>
      </div>
    </OrgProvider>
  )
}
