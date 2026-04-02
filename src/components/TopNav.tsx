'use client'

import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Workflow,
  Users,
  Calculator,
  Megaphone,
  Shield,
  Settings,
  Search,
  Menu,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import SignOutButton from '@/app/dashboard/SignOutButton'
import GlobalSearch from './GlobalSearch'
import ActivityFeed from './ActivityFeed'

type Section = 'dashboard' | 'pipeline' | 'contacts' | 'scenarios' | 'marketing' | 'admin' | 'settings'

const NAV_ITEMS: { label: string; section: Section; href: string; icon: React.ReactNode }[] = [
  { label: 'Dashboard', section: 'dashboard', href: '/dashboard', icon: <LayoutDashboard className="size-4" /> },
  { label: 'Pipeline',  section: 'pipeline',  href: '/dashboard/loans', icon: <Workflow className="size-4" /> },
  { label: 'Contacts',  section: 'contacts',  href: '/dashboard/contacts', icon: <Users className="size-4" /> },
  { label: 'Scenarios', section: 'scenarios', href: '/dashboard/scenarios', icon: <Calculator className="size-4" /> },
  { label: 'Marketing', section: 'marketing', href: '/dashboard/marketing', icon: <Megaphone className="size-4" /> },
  { label: 'Admin',     section: 'admin',     href: '/dashboard/automations', icon: <Shield className="size-4" /> },
]

function sectionFromPath(pathname: string): Section | null {
  if (pathname === '/dashboard') return 'dashboard'
  if (pathname.startsWith('/dashboard/briefing')) return 'dashboard'
  if (pathname.startsWith('/dashboard/loans')) return 'pipeline'
  if (pathname.startsWith('/dashboard/contacts')) return 'contacts'
  if (pathname.startsWith('/dashboard/scenarios')) return 'scenarios'
  if (pathname.startsWith('/dashboard/marketing')) return 'marketing'
  if (pathname.startsWith('/dashboard/automations')) return 'admin'
  if (pathname.startsWith('/dashboard/settings')) return 'settings'
  return null
}

export default function TopNav() {
  const pathname = usePathname()
  const router = useRouter()
  const currentSection = sectionFromPath(pathname || '')

  return (
    <>
      <GlobalSearch />
      <header className="fixed inset-x-0 top-0 z-30 h-14 border-b border-input bg-[var(--bg)] shadow-lg shadow-black/40">
        <div className="flex h-full items-center justify-between px-4 md:px-6">

          {/* ── Left: Logo + Nav ── */}
          <div className="flex items-center gap-6">
            {/* Logo */}
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="flex items-baseline gap-1.5"
            >
              <span className="text-lg font-bold tracking-tight font-mono text-foreground">
                Loan<span className="text-primary">OS</span>
              </span>
            </button>

            {/* Desktop nav links */}
            <nav className="hidden lg:flex items-center gap-1">
              {NAV_ITEMS.map((item) => {
                const isActive = currentSection === item.section
                return (
                  <button
                    key={item.section}
                    type="button"
                    onClick={() => router.push(item.href)}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary/15 text-primary'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* ── Right: Search + Activity + Settings + Profile + Mobile toggle ── */}
          <div className="flex items-center gap-2">
            {/* ⌘K search hint */}
            <button
              type="button"
              onClick={() => {
                document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }))
              }}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-md border border-input px-2.5 py-1 text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-colors"
              style={{ fontSize: 11, letterSpacing: '0.05em' }}
            >
              <Search className="size-3" />
              <span className="font-mono">⌘K</span>
            </button>

            <ActivityFeed />

            {/* Settings */}
            <button
              type="button"
              onClick={() => router.push('/dashboard/settings')}
              className={cn(
                'hidden sm:inline-flex items-center justify-center size-8 rounded-md transition-colors',
                currentSection === 'settings'
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
              title="Settings"
            >
              <Settings className="size-4" />
            </button>

            {/* Theme toggle */}
            <ThemeToggle />

            {/* User profile */}
            <div className="hidden sm:flex items-center gap-2 ml-1">
              <div className="flex flex-col items-end">
                <span className="text-xs font-semibold tracking-widest text-foreground">
                  ADAM STYER
                </span>
                <span className="text-[10px] text-muted-foreground font-mono tracking-[0.18em] uppercase">
                  Mortgage Solutions LP
                </span>
              </div>
              <div className="flex items-center justify-center size-8 rounded-full bg-primary/20 border border-primary/50 text-sm font-semibold text-primary">
                AS
              </div>
            </div>

            {/* Sign out */}
            <div className="hidden sm:block ml-1">
              <SignOutButton />
            </div>

            {/* ── Mobile menu ── */}
            <div className="lg:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="size-9 border-input text-muted-foreground">
                    <Menu className="size-4" />
                    <span className="sr-only">Toggle navigation</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-72 bg-[var(--bg)] border-input">
                  <SheetHeader>
                    <SheetTitle>
                      <span className="text-lg font-bold tracking-tight font-mono text-foreground">
                        Loan<span className="text-primary">OS</span>
                      </span>
                    </SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 flex flex-col gap-1">
                    {NAV_ITEMS.map((item) => {
                      const isActive = currentSection === item.section
                      return (
                        <button
                          key={item.section}
                          type="button"
                          onClick={() => router.push(item.href)}
                          className={cn(
                            'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors w-full text-left',
                            isActive
                              ? 'bg-primary/15 text-primary'
                              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                          )}
                        >
                          {item.icon}
                          {item.label}
                        </button>
                      )
                    })}

                    <div className="my-3 border-t border-input" />

                    <button
                      type="button"
                      onClick={() => router.push('/dashboard/settings')}
                      className={cn(
                        'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors w-full text-left',
                        currentSection === 'settings'
                          ? 'bg-primary/15 text-primary'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      )}
                    >
                      <Settings className="size-4" />
                      Settings
                    </button>

                    <div className="my-3 border-t border-input" />

                    {/* Mobile user info */}
                    <div className="flex items-center gap-3 px-3 py-2">
                      <div className="flex items-center justify-center size-8 rounded-full bg-primary/20 border border-primary/50 text-sm font-semibold text-primary">
                        AS
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold tracking-wider text-foreground">
                          ADAM STYER
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono tracking-wider uppercase">
                          Mortgage Solutions LP
                        </span>
                      </div>
                    </div>

                    <div className="px-3 mt-2">
                      <SignOutButton />
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>
    </>
  )
}
