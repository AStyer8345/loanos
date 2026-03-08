import SidebarNav from './SidebarNav'
import SignOutButton from './SignOutButton'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>

      {/* ── Sidebar ───────────────────────────────────────── */}
      <aside
        className="w-[220px] fixed inset-y-0 left-0 flex flex-col border-r z-10"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        {/* Logo mark */}
        <div
          className="px-4 py-5 border-b"
          style={{ borderColor: 'var(--border)' }}
        >
          <div
            className="font-display tracking-widest text-xl leading-none"
            style={{ color: 'var(--gold)' }}
          >
            LOAN<span style={{ color: 'var(--text)' }}>OS</span>
          </div>
          <div
            className="font-mono text-[10px] mt-1"
            style={{ color: 'var(--muted)' }}
          >
            MORTGAGE INTELLIGENCE
          </div>
        </div>

        {/* Nav links */}
        <div className="py-4 flex-1">
          <SidebarNav />
        </div>

        {/* Sign out */}
        <div
          className="px-4 pb-5 pt-4 border-t"
          style={{ borderColor: 'var(--border)' }}
        >
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
