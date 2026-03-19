'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { Settings } from 'lucide-react'
import { NavItem } from './NavItem'
import { NavDropdown } from './NavDropdown'
import SignOutButton from '@/app/dashboard/SignOutButton'
import GlobalSearch from './GlobalSearch'
import ActivityFeed from './ActivityFeed'

type Section = 'dashboard' | 'contacts' | 'loans' | 'scenarios' | 'reports' | 'marketing' | 'emails' | 'settings'

function sectionFromPath(pathname: string): Section | null {
  if (pathname === '/dashboard') return 'dashboard'
  if (pathname.startsWith('/dashboard/briefing')) return 'dashboard'
  if (pathname.startsWith('/dashboard/contacts')) return 'contacts'
  if (pathname.startsWith('/dashboard/loans')) return 'loans'
  if (pathname.startsWith('/dashboard/scenarios')) return 'scenarios'
  if (pathname.startsWith('/dashboard/performance')) return 'reports'
  if (pathname.startsWith('/dashboard/emails')) return 'emails'
  if (
    pathname.startsWith('/dashboard/marketing') ||
    pathname.startsWith('/dashboard/automations')
  ) {
    return 'marketing'
  }
  if (pathname.startsWith('/dashboard/settings')) return 'settings'
  return null
}

export default function TopNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)

  const currentSection = sectionFromPath(pathname || '')

  const navigate = (href: string) => {
    router.push(href)
    setOpenDropdown(null)
    setMobileOpen(false)
  }

  const toggleDropdown = (id: string) => {
    setOpenDropdown((prev) => (prev === id ? null : id))
  }

  return (
    <>
      <GlobalSearch />
      <nav className="fixed inset-x-0 top-0 z-30 h-16 bg-[#060b18] border-b border-[#1e293b] text-white shadow-lg shadow-black/40 flex items-center px-3 md:px-6">
        {/* Logo → Pipeline Dashboard */}
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="flex items-baseline gap-2 mr-4"
        >
          <span className="text-lg font-bold tracking-tight leading-none font-mono">
            Loan<span className="text-[#C9A84C]">OS</span>
          </span>
        </button>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-2">
          <NavItem
            label="Dashboard"
            icon="📊"
            isActive={currentSection === 'dashboard'}
            onClick={() => navigate('/dashboard')}
          />

          <NavItem
            label="Loans"
            icon="📋"
            isActive={currentSection === 'loans'}
            onClick={() => navigate('/dashboard/loans')}
          />

          <NavItem
            label="Contacts"
            icon="👥"
            isActive={currentSection === 'contacts'}
            onClick={() => navigate('/dashboard/contacts')}
          />

          <NavItem
            label="Inbox Review"
            icon="📧"
            isActive={currentSection === 'emails'}
            onClick={() => navigate('/dashboard/emails/unmatched')}
          />

          <NavItem
            label="Scenarios"
            icon="📐"
            isActive={currentSection === 'scenarios'}
            onClick={() => navigate('/dashboard/scenarios')}
          />

          <NavItem
            label="Reports"
            icon="📈"
            isActive={currentSection === 'reports'}
            onClick={() => navigate('/dashboard/performance')}
          />

          <NavDropdown
            label="Marketing"
            icon="📢"
            isOpen={openDropdown === 'marketing'}
            onToggle={() => toggleDropdown('marketing')}
            items={[
              {
                label: 'Marketing Command Center',
                onClick: () => navigate('/dashboard/marketing'),
              },
              {
                label: 'Automations (n8n, Zapier)',
                onClick: () => navigate('/dashboard/automations'),
              },
            ]}
          />
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* ⌘K search hint */}
        <button
          type="button"
          onClick={() => {
            const evt = new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true })
            document.dispatchEvent(evt)
          }}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded border border-white/20 text-white/50 hover:text-white/80 hover:border-white/40 transition-colors mr-2"
          style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.05em' }}
        >
          <span>⌘K</span>
          <span className="text-white/30">search</span>
        </button>

        <ActivityFeed />

        {/* Right side: settings icon + profile + sign out */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/dashboard/settings')}
            className={`hidden sm:inline-flex items-center justify-center w-8 h-8 rounded-md transition-colors ${
              currentSection === 'settings'
                ? 'bg-white/20 text-white'
                : 'text-white/50 hover:bg-white/10 hover:text-white/80'
            }`}
            title="Settings"
          >
            <Settings size={15} />
          </button>

          <div className="hidden sm:flex flex-col items-end mr-1">
            <span className="text-xs font-semibold tracking-widest text-zinc-200">
              ADAM STYER
            </span>
            <span className="text-[10px] text-zinc-500 font-mono tracking-[0.18em] uppercase">
              Mortgage Solutions LP
            </span>
          </div>
          <div className="hidden sm:inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#C9A84C]/20 border border-[#C9A84C]/50 text-sm font-semibold text-[#C9A84C]">
            AS
          </div>
          <div className="ml-1">
            <SignOutButton />
          </div>
          {/* Mobile hamburger */}
          <button
            type="button"
            className="md:hidden ml-1 inline-flex items-center justify-center w-9 h-9 rounded-md border border-white/20 text-white hover:bg-white/10"
            onClick={() => setMobileOpen((prev) => !prev)}
          >
            <span className="sr-only">Toggle navigation</span>
            <span className="flex flex-col gap-1.5">
              <span className="block w-4 h-0.5 bg-current rounded-full" />
              <span className="block w-4 h-0.5 bg-current rounded-full" />
              <span className="block w-4 h-0.5 bg-current rounded-full" />
            </span>
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="fixed inset-x-0 top-16 z-20 bg-slate-950/95 text-white border-t border-white/10 md:hidden">
          <div className="flex flex-col gap-1 px-3 py-3">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
                currentSection === 'dashboard'
                  ? 'bg-white/10 text-white'
                  : 'text-blue-50/90'
              }`}
            >
              <span className="text-base">📊</span>
              <span>Dashboard</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/dashboard/loans')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
                currentSection === 'loans'
                  ? 'bg-white/10 text-white'
                  : 'text-blue-50/90'
              }`}
            >
              <span className="text-base">📋</span>
              <span>Loans</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/dashboard/contacts')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
                currentSection === 'contacts'
                  ? 'bg-white/10 text-white'
                  : 'text-blue-50/90'
              }`}
            >
              <span className="text-base">👥</span>
              <span>Contacts</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/dashboard/emails/unmatched')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
                currentSection === 'emails'
                  ? 'bg-white/10 text-white'
                  : 'text-blue-50/90'
              }`}
            >
              <span className="text-base">📧</span>
              <span>Inbox Review</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/dashboard/scenarios')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
                currentSection === 'scenarios'
                  ? 'bg-white/10 text-white'
                  : 'text-blue-50/90'
              }`}
            >
              <span className="text-base">📐</span>
              <span>Scenarios</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/dashboard/performance')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
                currentSection === 'reports'
                  ? 'bg-white/10 text-white'
                  : 'text-blue-50/90'
              }`}
            >
              <span className="text-base">📈</span>
              <span>Reports</span>
            </button>

            <div className="mt-2">
              <p className="px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-blue-200/70">
                Marketing
              </p>
              <button
                type="button"
                onClick={() => navigate('/dashboard/marketing')}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-blue-50/90 hover:bg-white/5 w-full text-left"
              >
                <span>Marketing Command Center</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard/automations')}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-blue-50/90 hover:bg-white/5 w-full text-left"
              >
                <span>Automations</span>
              </button>
            </div>

            <div className="mt-2 border-t border-white/10 pt-2">
              <button
                type="button"
                onClick={() => navigate('/dashboard/settings')}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-blue-50/90 hover:bg-white/5 w-full text-left"
              >
                <span>⚙️</span>
                <span>Settings</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
