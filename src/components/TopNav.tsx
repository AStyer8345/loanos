'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Workflow,
  Users,
  Calculator,
  Building2,
  Settings,
  Search,
  Menu,
  ChevronDown,
  MessageSquareText,
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
import type { OrgFeatures } from '@/lib/features/types'

type Section =
  | 'dashboard'
  | 'pipeline'
  | 'contacts'
  | 'more'
  | 'settings'

type NavItem = {
  label: string
  section: Section
  href: string
  icon: React.ReactNode
}

type MoreItem = {
  label: string
  href: string
  icon: React.ReactNode
  requires?: keyof OrgFeatures
}

// Primary nav — the three surfaces used to work leads and loans.
const NAV_ITEMS_ALL: (NavItem & { requires?: keyof OrgFeatures })[] = [
  { label: 'Today', section: 'dashboard', href: '/dashboard', icon: <LayoutDashboard className="size-4" /> },
  { label: 'Loan records',  section: 'pipeline',  href: '/dashboard/loans', icon: <Workflow className="size-4" /> },
  { label: 'Contact records',  section: 'contacts',  href: '/dashboard/contacts', icon: <Users className="size-4" /> },
]

// Secondary nav — power-user surfaces tucked behind a More dropdown.
// All map to section 'more' so the More button highlights when any are active.
const MORE_ITEMS_ALL: MoreItem[] = [
  { label: 'Chat transcripts', href: '/dashboard/assistant-conversations', icon: <MessageSquareText className="size-4" /> },
  { label: 'Scenarios', href: '/dashboard/scenarios', icon: <Calculator className="size-4" />, requires: 'scenarios' },
  { label: 'Lenders',   href: '/dashboard/lenders',   icon: <Building2 className="size-4" />, requires: 'lender_knowledge' },
]

function sectionFromPath(pathname: string): Section | null {
  if (pathname === '/dashboard') return 'dashboard'
  if (pathname.startsWith('/dashboard/loans')) return 'pipeline'
  if (pathname.startsWith('/dashboard/contacts')) return 'contacts'
  // Power-user surfaces hidden under More
  if (pathname.startsWith('/dashboard/scenarios')) return 'more'
  if (pathname.startsWith('/dashboard/lenders')) return 'more'
  if (pathname.startsWith('/dashboard/assistant-conversations')) return 'more'
  if (pathname.startsWith('/dashboard/settings')) return 'settings'
  return null
}

export default function TopNav({ features }: { features: OrgFeatures }) {
  const pathname = usePathname()
  const router = useRouter()
  const currentSection = sectionFromPath(pathname || '')

  const NAV_ITEMS = NAV_ITEMS_ALL.filter(i => !i.requires || features[i.requires])
  const MORE_ITEMS = MORE_ITEMS_ALL.filter(i => !i.requires || features[i.requires])

  // More dropdown state + click-outside handler
  const [moreOpen, setMoreOpen] = useState(false)
  const moreRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (!moreOpen) return
    function onDocClick(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [moreOpen])

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

              {/* More dropdown */}
              {MORE_ITEMS.length > 0 && (
              <div ref={moreRef} className="relative">
                <button
                  type="button"
                  onClick={() => setMoreOpen(o => !o)}
                  aria-haspopup="menu"
                  aria-expanded={moreOpen}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                    currentSection === 'more'
                      ? 'bg-primary/15 text-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  More
                  <ChevronDown className={cn('size-3.5 transition-transform', moreOpen && 'rotate-180')} />
                </button>
                {moreOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-1 w-48 rounded-md border border-input bg-[var(--bg)] shadow-lg shadow-black/40 py-1 z-40"
                  >
                    {MORE_ITEMS.map(item => {
                      const isActive = pathname?.startsWith(item.href) ?? false
                      return (
                        <button
                          key={item.href}
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            router.push(item.href)
                            setMoreOpen(false)
                          }}
                          className={cn(
                            'flex w-full items-center gap-2 px-3 py-2 text-sm font-medium text-left transition-colors',
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
                  </div>
                )}
              </div>
              )}
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

                    {MORE_ITEMS.length > 0 && (
                      <>
                        <div className="my-3 border-t border-input" />
                        <div className="px-3 pb-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                          More
                        </div>
                      </>
                    )}
                    {MORE_ITEMS.map(item => {
                      const isActive = pathname?.startsWith(item.href) ?? false
                      return (
                        <button
                          key={item.href}
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
