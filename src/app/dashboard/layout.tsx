import TopNav from '@/components/TopNav'

export const dynamic = 'force-dynamic'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950">
      <TopNav />
      <main className="pt-16">
        {children}
      </main>
    </div>
  )
}
