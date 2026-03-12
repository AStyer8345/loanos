'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  FileText,
  Upload,
  Zap,
  BarChart2,
  CheckSquare,
  GitBranch,
  Settings,
  Brain,
} from 'lucide-react'

const NAV = [
  { label: 'Daily Briefing', href: '/dashboard/briefing',    icon: Brain },
  { label: 'Dashboard',      href: '/dashboard',             icon: LayoutDashboard },
  { label: 'Contacts',      href: '/dashboard/contacts',    icon: Users },
  { label: 'Loans',         href: '/dashboard/loans',       icon: FileText },
  { label: 'Upload Doc',    href: '/dashboard/upload',      icon: Upload },
  { label: 'Automations',   href: '/dashboard/automations', icon: Zap },
  { label: 'Marketing',     href: '/dashboard/marketing',   icon: BarChart2 },
  { label: 'Build Tracker', href: '/dashboard/build-tracker', icon: CheckSquare },
  { label: 'System Map',    href: '/dashboard/system-map',  icon: GitBranch },
  { label: 'Settings',      href: '/dashboard/settings',    icon: Settings },
]

export default function SidebarNav() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-0.5 px-2">
      {NAV.map(({ label, href, icon: Icon }) => {
        const active = href === '/dashboard'
          ? pathname === '/dashboard'
          : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={`
              flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors
              border-l-2 -ml-2 pl-[10px]
              ${active
                ? 'border-emerald-600 text-emerald-600 bg-emerald-50'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }
            `}
          >
            <Icon size={15} strokeWidth={active ? 2.2 : 1.8} />
            {label}
          </Link>
        )
      })
      }
    </nav>
  )
}
