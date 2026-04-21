'use client'

import { type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  ChevronLeft,
  ChevronRight,
  Flame,
  Users,
  UserPlus,
  Clock,
  CheckCircle2,
  Handshake,
  Star,
  TrendingUp,
  CalendarClock,
  Award,
  HelpCircle,
  Plus,
  Pencil,
  Trash2,
  Sparkles,
  AlertCircle,
  ShoppingBag,
} from 'lucide-react'

// ── Section icons mapped by smart list ID ──
const LIST_ICONS: Record<string, ReactNode> = {
  'followup-new-leads':    <Sparkles className="size-3.5 text-violet-400" />,
  'followup-stale':        <AlertCircle className="size-3.5 text-amber-500" />,
  'followup-pa-shopping':  <ShoppingBag className="size-3.5 text-emerald-400" />,
  active:               <Flame className="size-3.5 text-amber-500" />,
  all:                  <Users className="size-3.5" />,
  'all-borrowers':      <UserPlus className="size-3.5" />,
  'new-apps':           <Clock className="size-3.5" />,
  'in-process':         <TrendingUp className="size-3.5" />,
  closed:               <CheckCircle2 className="size-3.5" />,
  'all-realtors':       <Handshake className="size-3.5" />,
  'top-realtors':       <Star className="size-3.5" />,
  active_deal_partners: <Handshake className="size-3.5" />,
  top_producers:        <Award className="size-3.5" />,
  due_for_outreach:     <CalendarClock className="size-3.5" />,
  tier_a_not_this_month:<CalendarClock className="size-3.5" />,
  unassigned:           <HelpCircle className="size-3.5" />,
}

type SmartList = {
  id: string
  label: string
  section?: string
}

type CustomList = {
  id: string
  name: string
}

type ContactsSidebarProps = {
  smartLists: SmartList[]
  customLists: CustomList[]
  activeList: string
  counts: Record<string, number>
  collapsed: boolean
  onToggleCollapse: () => void
  onSelectList: (id: string) => void
  onNewList: () => void
  onEditList: (list: CustomList) => void
  onDeleteList: (id: string) => void
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="px-3 pt-4 pb-1.5">
      <span className="text-[9px] font-semibold tracking-[0.15em] text-muted-foreground/60 uppercase">
        {label}
      </span>
    </div>
  )
}

function SidebarItem({
  label,
  icon,
  count,
  isActive,
  collapsed,
  onClick,
  actions,
}: {
  label: string
  icon?: ReactNode
  count?: number
  isActive: boolean
  collapsed: boolean
  onClick: () => void
  actions?: ReactNode
}) {
  return (
    <div className="group flex items-center gap-0.5 px-1.5">
      <button
        type="button"
        onClick={onClick}
        title={collapsed ? label : undefined}
        className={cn(
          'flex items-center gap-2.5 w-full rounded-md text-[12px] font-medium transition-colors min-w-0',
          collapsed ? 'justify-center px-2 py-1.5' : 'px-2.5 py-1.5',
          isActive
            ? 'bg-primary/12 text-primary border border-primary/20'
            : 'text-foreground/80 hover:bg-accent hover:text-accent-foreground border border-transparent',
        )}
      >
        {icon && (
          <span className={cn('flex-shrink-0', isActive ? 'text-primary' : 'text-muted-foreground')}>
            {icon}
          </span>
        )}
        {!collapsed && (
          <>
            <span className="truncate flex-1 text-left">{label}</span>
            {count !== undefined && (
              <span className={cn(
                'text-[10px] tabular-nums flex-shrink-0',
                isActive ? 'text-primary/70' : 'text-muted-foreground/70'
              )}>
                {count}
              </span>
            )}
          </>
        )}
        {collapsed && count !== undefined && (
          <span className="sr-only">{count}</span>
        )}
      </button>
      {!collapsed && actions && (
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
  )
}

export default function ContactsSidebar({
  smartLists,
  customLists,
  activeList,
  counts,
  collapsed,
  onToggleCollapse,
  onSelectList,
  onNewList,
  onEditList,
  onDeleteList,
}: ContactsSidebarProps) {
  const pathname = usePathname()
  const realtorsActive = pathname === '/dashboard/contacts/realtors'

  return (
    <aside
      className={cn(
        'flex-shrink-0 border-r border-input overflow-y-auto flex flex-col bg-card/50 transition-[width] duration-200',
        collapsed ? 'w-[52px]' : 'w-[210px]',
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3" style={{ minHeight: 44 }}>
        {!collapsed && (
          <span className="text-[10px] font-bold tracking-[0.14em] text-primary uppercase">
            Smart Lists
          </span>
        )}
        <button
          type="button"
          onClick={onToggleCollapse}
          className={cn(
            'flex items-center justify-center size-6 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors',
            collapsed && 'mx-auto',
          )}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="size-3.5" /> : <ChevronLeft className="size-3.5" />}
        </button>
      </div>

      {/* Views */}
      <div className="px-1.5 pb-1 pt-1 border-b border-input">
        <Link
          href="/dashboard/contacts/realtors"
          title={collapsed ? 'Realtor Roster' : undefined}
          className={cn(
            'flex items-center gap-2.5 w-full rounded-md text-[12px] font-medium transition-colors min-w-0',
            collapsed ? 'justify-center px-2 py-1.5' : 'px-2.5 py-1.5',
            realtorsActive
              ? 'bg-primary/12 text-primary border border-primary/20'
              : 'text-foreground/80 hover:bg-accent hover:text-accent-foreground border border-transparent',
          )}
        >
          <span className={cn('flex-shrink-0', realtorsActive ? 'text-primary' : 'text-muted-foreground')}>
            <Handshake className="size-3.5" />
          </span>
          {!collapsed && <span className="truncate flex-1 text-left">Realtor Roster</span>}
        </Link>
      </div>

      {/* Smart Lists */}
      <div className="flex-1 pb-3 space-y-0.5">
        {smartLists.map((list) => (
          <div key={list.id}>
            {list.section && !collapsed && <SectionHeader label={list.section} />}
            <SidebarItem
              label={list.label}
              icon={LIST_ICONS[list.id]}
              count={counts[list.id] ?? 0}
              isActive={activeList === list.id}
              collapsed={collapsed}
              onClick={() => onSelectList(list.id)}
            />
          </div>
        ))}

        {/* Custom Lists */}
        {customLists.length > 0 && !collapsed && <SectionHeader label="CUSTOM LISTS" />}
        {customLists.map((cl) => (
          <SidebarItem
            key={cl.id}
            label={cl.name}
            count={counts[cl.id] ?? 0}
            isActive={activeList === cl.id}
            collapsed={collapsed}
            onClick={() => onSelectList(cl.id)}
            actions={
              <>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onEditList(cl) }}
                  className="flex items-center justify-center size-6 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  title="Edit list"
                >
                  <Pencil className="size-3" />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onDeleteList(cl.id) }}
                  className="flex items-center justify-center size-6 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  title="Delete list"
                >
                  <Trash2 className="size-3" />
                </button>
              </>
            }
          />
        ))}

        {/* New List button */}
        {!collapsed && (
          <div className="px-2 pt-2">
            <button
              type="button"
              onClick={onNewList}
              className="flex items-center justify-center gap-1.5 w-full rounded-md border border-dashed border-primary/40 text-primary text-[11px] font-medium py-1.5 hover:bg-primary/5 hover:border-primary/60 transition-colors"
            >
              <Plus className="size-3" />
              New List
            </button>
          </div>
        )}
        {collapsed && (
          <div className="px-1.5 pt-2">
            <button
              type="button"
              onClick={onNewList}
              className="flex items-center justify-center w-full rounded-md text-primary py-1.5 hover:bg-primary/5 transition-colors"
              title="New List"
            >
              <Plus className="size-3.5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
