'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { NavItem } from './NavItem'
import { NavDropdown } from './NavDropdown'
import SignOutButton from '@/app/dashboard/SignOutButton'
import GlobalSearch from './GlobalSearch'
import ActivityFeed from './ActivityFeed'

type Section = 'briefing' | 'pipeline' | 'marketing' | 'admin' | 'settings'

function sectionFromPath(pathname: string): Section {
  if (pathname.startsWith('/dashboard/briefing')) return 'briefing'
  if (
    pathname.startsWith('/dashboard/contacts') ||
    pathname.startsWith('/dashboard/loans') ||
    pathname.startsWith('/dashboard/referral')
  ) {
    return 'pipeline'
  }
  if (
    pathname.startsWith('/dashboard/marketing') ||
    pathname.startsWith('/dashboard/automations')
  ) {
    return 'marketing'
  }
  if (pathname.startsWith('/dashboard/settings')) return 'settings'
  if (pathname.startsWith('/dashboard')) return 'pipeline'
  return 'briefing'
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
      <nav className="fixed inset-x-0 top-0 z-30 h-16 bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-800 text-white shadow flex items-center px-3 md:px-6">
        {/* Logo */}
        <button
          type="button"
          onClick={() => navigate('/dashboard/briefing')}
          className="flex items-baseline gap-2 mr-4"
        >
          <span className="text-2xl leading-none">🧠</span>
          <span className="text-lg font-semibold tracking-tight leading-none">
            Loan<span className="text-emerald-400">OS</span>
          </span>
        </button>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-2">
          <NavItem
            label="Daily Briefing"
            icon="📊"
            isActive={currentSection === 'briefing'}
            onClick={() => navigate('/dashboard/briefing')}
          />

          <NavDropdown
            label="Pipeline"
            icon="📈"
            isOpen={openDropdown === 'pipeline'}
            onToggle={() => toggleDropdown('pipeline')}
            items={[
              { label: 'Contacts', onClick: () => navigate('/dashboard/contacts') },
              { label: 'Loans', onClick: () => navigate('/dashboard/loans') },
              // Referrals view routes through contacts for now
              {
                label: 'Referrals',
                onClick: () => navigate('/dashboard/contacts'),
              },
            ]}
          />

          <NavDropdown
            label="Marketing"
            icon="📢"
            isOpen={openDropdown === 'marketing'}
            onToggle={() => toggleDropdown('marketing')}
            items={[
              {
                label: 'Content Dashboard',
                onClick: () => navigate('/dashboard/marketing'),
              },
              {
                label: 'Newsletter Generator',
                onClick: () => navigate('/dashboard/marketing'),
              },
              {
                label: 'Social Media Posts',
                onClick: () => navigate('/dashboard/marketing'),
              },
              {
                label: 'Rate Updates',
                onClick: () => navigate('/dashboard/marketing'),
              },
              {
                label: 'Automations (n8n, Zapier)',
                onClick: () => navigate('/dashboard/automations'),
              },
            ]}
          />

          <NavDropdown
            label="Admin"
            icon="⚙️"
            isOpen={openDropdown === 'admin'}
            onToggle={() => toggleDropdown('admin')}
            items={[
              { label: 'Settings', onClick: () => navigate('/dashboard/settings') },
              // Future admin screens can replace these placeholders
              { label: 'Users', onClick: () => navigate('/dashboard/settings') },
              { label: 'Integrations', onClick: () => navigate('/dashboard/settings') },
              { label: 'Billing', onClick: () => navigate('/dashboard/settings') },
              { label: 'Logs', onClick: () => navigate('/dashboard/settings') },
            ]}
          />

          <NavItem
            label="Settings"
            icon="🛠"
            isActive={currentSection === 'settings'}
            onClick={() => navigate('/dashboard/settings')}
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

        {/* Right side: profile + sign out */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end mr-1">
            <span className="text-xs font-semibold tracking-widest text-emerald-100/90">
              ADAM STYER
            </span>
            <span className="text-[10px] text-emerald-100/60 font-mono tracking-[0.18em] uppercase">
              Mortgage Solutions LP
            </span>
          </div>
          <div className="hidden sm:inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-300/60 text-sm font-semibold">
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
              onClick={() => navigate('/dashboard/briefing')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
                currentSection === 'briefing'
                  ? 'bg-white/10 text-white'
                  : 'text-emerald-50/90'
              }`}
            >
              <span className="text-base">📊</span>
              <span>Daily Briefing</span>
            </button>

            <div className="mt-1">
              <p className="px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-emerald-200/70">
                Pipeline
              </p>
              <button
                type="button"
                onClick={() => navigate('/dashboard/contacts')}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-emerald-50/90 hover:bg-white/5 w-full text-left"
              >
                <span>Contacts</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard/loans')}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-emerald-50/90 hover:bg-white/5 w-full text-left"
              >
                <span>Loans</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard/contacts')}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-emerald-50/90 hover:bg-white/5 w-full text-left"
              >
                <span>Referrals</span>
              </button>
            </div>

            <div className="mt-2">
              <p className="px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-emerald-200/70">
                Marketing
              </p>
              <button
                type="button"
                onClick={() => navigate('/dashboard/marketing')}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-emerald-50/90 hover:bg-white/5 w-full text-left"
              >
                <span>Content Dashboard</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard/marketing')}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-emerald-50/90 hover:bg-white/5 w-full text-left"
              >
                <span>Newsletter Generator</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard/marketing')}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-emerald-50/90 hover:bg-white/5 w-full text-left"
              >
                <span>Social Media</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard/automations')}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-emerald-50/90 hover:bg-white/5 w-full text-left"
              >
                <span>Automations</span>
              </button>
            </div>

            <div className="mt-2">
              <p className="px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-emerald-200/70">
                Admin
              </p>
              <button
                type="button"
                onClick={() => navigate('/dashboard/settings')}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-emerald-50/90 hover:bg-white/5 w-full text-left"
              >
                <span>Settings</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

