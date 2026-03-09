'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { label: 'DASHBOARD',     href: '/dashboard' },
  { label: 'CONTACTS',      href: '/dashboard/contacts' },
  { label: 'UPLOAD DOC',    href: '/dashboard/upload' },
  { label: 'BUILD TRACKER', href: '/dashboard/build-tracker' },
  { label: 'SYSTEM MAP',    href: '/dashboard/system-map' },
]

export default function SidebarNav() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-0.5 flex-1">
      {NAV.map(({ label, href }) => {
        const active = href === '/dashboard'
          ? pathname === '/dashboard'
          : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={`
              font-mono text-xs tracking-widest px-4 py-2.5 transition-colors
              border-l-2
              ${active
                ? 'border-[var(--gold)] text-[var(--gold)] bg-[var(--surface2)]'
                : 'border-transparent text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--border)]'
              }
            `}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
