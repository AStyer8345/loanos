'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { Settings } from 'lucide-react'
import { NavItem } from './NavItem'
import SignOutButton from '@/app/dashboard/SignOutButton'
import GlobalSearch from './GlobalSearch'
import ActivityFeed from './ActivityFeed'

type Section = 'dashboard' | 'pipeline' | 'contacts' | 'scenarios' | 'voice-guide' | 'admin' | 'settings'

function sectionFromPath(pathname: string): Section | null {
  if (pathname === '/dashboard') return 'dashboard'
  if (pathname.startsWith('/dashboard/briefing')) return 'dashboard'
  if (pathname.startsWith('/dashboard/loans')) return 'pipeline'
  if (pathname.startsWith('/dashboard/contacts')) return 'contacts'
  if (pathname.startsWith('/dashboard/scenarios')) return 'scenarios'
  if (pathname.startsWith('/dashboard/marketing')) return 'voice-guide'
  if (pathname.startsWith('/dashboard/automations')) return 'admin'
  if (pathname.startsWith('/dashboard/settings')) return 'settings'
  return null
}

export default function TopNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  const currentSection = sectionFromPath(pathname || '')

  const navigate = (href: string) => {
    router.push(href)
    setMobileOpen(false)
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
            label="Pipeline"
            icon="📋"
            isActive={currentSection === 'pipeline'}
            onClick={() => navigate('/dashboard/loans')}
          />

          <NavItem
            label="Contacts"
            icon="👥"
            isActive={currentSection === 'contacts'}
            onClick={() => navigate('/dashboard/contacts')}
          />

          <NavItem
            label="Scenarios"
            icon="📐"
            isActive={currentSection === 'scenarios'}
            onClick={() => navigate('/dashboard/scenarios')}
          />

          <NavItem
            label="Voice Guide"
            icon="🎙️"
            isActive={currentSection === 'voice-guide'}
            onClick={() => navigate('/dashboard/marketing')}
          />

          <NavItem
            label="Admin"
            icon="⚙️"
            isActive={currentSection === 'admin'}
            onClick={() => navigate('/dashboard/automations')}
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
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded border border-zinc-700 text-zinc-500 hover:text-zinc-200 hover:border-zinc-500 transition-colors mr-2"
          style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.05em' }}
        >
          <span>⌘K</span>
          <span className="text-zinc-600">search</span>
        </button>

        <ActivityFeed />

        {/* Right side: settings icon + profile + sign out */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/dashboard/settings')}
            className={`hidden sm:inline-flex items-center justify-center w-8 h-8 rounded-md transition-colors ${
              currentSection === 'settings'
                ? 'bg-amber-500/20 text-amber-200'
                : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
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
            className="md:hidden ml-1 inline-flex items-center justify-center w-9 h-9 rounded-md border border-zinc-700 text-zinc-400 hover:bg-zinc-800"
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
        <div className="fixed inset-x-0 top-16 z-20 bg-zinc-950/95 text-zinc-200 border-t border-zinc-800 md:hidden">
          <div className="flex flex-col gap-1 px-3 py-3">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
                currentSection === 'dashboard'
                  ? 'bg-amber-500/20 text-amber-200'
                  : 'text-zinc-400'
              }`}
            >
              <span className="text-base">📊</span>
              <span>Dashboard</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/dashboard/loans')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
                currentSection === 'pipeline'
                  ? 'bg-amber-500/20 text-amber-200'
                  : 'text-zinc-400'
              }`}
            >
              <span className="text-base">📋</span>
              <span>Pipeline</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/dashboard/contacts')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
                currentSection === 'contacts'
                  ? 'bg-amber-500/20 text-amber-200'
                  : 'text-zinc-400'
              }`}
            >
              <span className="text-base">👥</span>
              <span>Contacts</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/dashboard/scenarios')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
                currentSection === 'scenarios'
                  ? 'bg-amber-500/20 text-amber-200'
                  : 'text-zinc-400'
              }`}
            >
              <span className="text-base">📐</span>
              <span>Scenarios</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/dashboard/marketing')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
                currentSection === 'voice-guide'
                  ? 'bg-amber-500/20 text-amber-200'
                  : 'text-zinc-400'
              }`}
            >
              <span className="text-base">🎙️</span>
              <span>Voice Guide</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/dashboard/automations')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
                currentSection === 'admin'
                  ? 'bg-amber-500/20 text-amber-200'
                  : 'text-zinc-400'
              }`}
            >
              <span className="text-base">⚙️</span>
              <span>Admin</span>
            </button>

            <div className="mt-2 border-t border-zinc-800 pt-2">
              <button
                type="button"
                onClick={() => navigate('/dashboard/settings')}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200 w-full text-left"
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
