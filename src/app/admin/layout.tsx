import { redirect } from 'next/navigation'
import { isSystemAdmin } from '@/lib/admin/auth'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const isAdmin = await isSystemAdmin()
  if (!isAdmin) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-zinc-950">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-input bg-zinc-950/90 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="font-mono text-sm font-semibold text-amber-500 tracking-wide">
              LOANOS ADMIN
            </Link>
            <Link href="/dashboard" className="text-xs text-muted-foreground hover:text-foreground/80 transition-colors">
              ← Back to Dashboard
            </Link>
          </div>
          <span className="text-xs text-muted-foreground font-mono">SUPER ADMIN</span>
        </div>
      </nav>
      <main className="pt-14">
        <div className="mx-auto max-w-7xl px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
