import SidebarNav from './SidebarNav'
import SignOutButton from './SignOutButton'

export const dynamic = 'force-dynamic'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">

      {/* ── Sidebar ───────────────────────────────────────── */}
      <aside className="w-[220px] fixed inset-y-0 left-0 flex flex-col bg-white border-r border-slate-200 z-10">

        {/* Logo */}
        <div className="px-5 py-5 border-b border-slate-200">
          <div className="text-lg font-bold tracking-tight leading-none text-slate-900">
            Loan<span className="text-emerald-600">OS</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1 font-medium tracking-wide uppercase">
            Mortgage Intelligence
          </div>
        </div>

        {/* Nav */}
        <div className="py-3 flex-1 overflow-y-auto">
          <SidebarNav />
        </div>

        {/* Sign out */}
        <div className="px-4 pb-5 pt-4 border-t border-slate-200">
          <SignOutButton />
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────────── */}
      <main className="ml-[220px] flex-1 overflow-auto">
        {children}
      </main>

    </div>
  )
}
