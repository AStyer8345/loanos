'use client'

import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Search, ChevronDown, ChevronUp, AlertCircle, Trash2 } from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────

interface Loan {
  id: string
  loan_name: string | null
  borrower_name: string | null
  status: string | null
  loan_amount: number | null
  loan_purpose: string | null
  loan_program: string | null
  closing_date: string | null
  property_address: string | null
  property_city: string | null
  property_state: string | null
  contact_id: string | null
  contact_email?: string | null
  contact_phone?: string | null
  doc_count?: number
}

interface SmartList {
  id: string
  label: string
  statuses: string[] | null // null = all
}

// ── Smart lists ──────────────────────────────────────────────────────────────

const SMART_LISTS: SmartList[] = [
  { id: 'all',           label: 'All Loans',    statuses: null },
  { id: 'inprocess',     label: 'In Process',   statuses: ['In Process', 'Loan in Process', 'Processing', 'processing', 'Submitted', 'Conditional Approval', 'Clear to Close', 'Approved', 'QUALIFICATION', 'DISCLOSURE_SENT'] },
  { id: 'closed',        label: 'Closed',       statuses: ['Closed', 'Funded', 'Closed/Funded'] },
  { id: 'preapproval',   label: 'Pre-Approval', statuses: ['Pre-Approved', 'Started', 'Started App', 'lead', 'Lead', 'Pre-App', 'Application', 'APPLICATION_INTAKE'] },
  { id: 'cancelled',     label: 'Other',        statuses: ['Cancelled', 'Denied', 'Withdrawn', 'Suspended', 'On Hold', 'Dead'] },
]

// ── Quick filter options (maps to smart list IDs) ──────────────────────────────
const LOAN_QUICK_FILTERS = [
  { id: 'inprocess',   label: 'In Process' },
  { id: 'all',         label: 'All Loans' },
  { id: 'closed',      label: 'Closed' },
  { id: 'preapproval', label: 'Pre-Approval' },
  { id: 'cancelled',   label: 'Other' },
] as const

const LOAN_STATUS_OPTIONS = ['Lead', 'Pre-App', 'Application', 'In Process', 'Clear to Close', 'Closed', 'On Hold', 'Dead'] as const

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtCurrency(n: number | null) {
  if (n == null) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

function fmtDate(s: string | null) {
  if (!s) return '—'
  const d = new Date(s + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function telHref(phone: string | null | undefined): string | null {
  if (!phone || !String(phone).trim()) return null
  const digits = String(phone).replace(/\D/g, '')
  return digits.length >= 10 ? `tel:${String(phone).trim()}` : null
}

function mailtoHref(email: string | null | undefined): string | null {
  if (!email || !String(email).trim() || !String(email).includes('@')) return null
  return `mailto:${String(email).trim()}`
}

function daysUntilClose(dateStr: string | null): number | null {
  if (!dateStr) return null
  const d = new Date(dateStr + 'T00:00:00')
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return Math.round((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

function closingUrgencyStyle(dateStr: string | null, isInProcess: boolean): Record<string, string> {
  if (!isInProcess || !dateStr) return {}
  const days = daysUntilClose(dateStr)
  if (days === null) return {}
  if (days <= 7) return { background: 'rgba(239,68,68,0.08)', borderLeft: '3px solid rgba(239,68,68,0.6)' }
  if (days <= 14) return { background: 'rgba(245,158,11,0.08)', borderLeft: '3px solid rgba(245,158,11,0.5)' }
  return {}
}

type SortKey = 'borrower_name' | 'loan_amount' | 'closing_date' | 'status'
type SortDir = 'asc' | 'desc'

// ── Column definitions (toggleable) ───────────────────────────────────────────
const LOAN_COLUMNS: { id: string; label: string; key: SortKey | null }[] = [
  { id: 'borrower_name', label: 'Borrower', key: 'borrower_name' },
  { id: 'loan_amount',   label: 'Amount',   key: 'loan_amount' },
  { id: 'status',        label: 'Status',   key: 'status' },
  { id: 'loan_purpose',  label: 'Purpose',  key: null },
  { id: 'closing_date',  label: 'Closing',  key: 'closing_date' },
  { id: 'location',      label: 'Location', key: null },
  { id: 'loan_program',  label: 'Program',  key: null },
  { id: 'contact_email', label: 'Email',    key: null },
  { id: 'contact_phone', label: 'Phone',    key: null },
]

const DEFAULT_LOAN_COLUMNS = LOAN_COLUMNS.map(c => c.id)
const LS_LOAN_COLUMNS_KEY = 'loanos_loans_columns_v1'
const LS_CUSTOM_LISTS_KEY = 'loanos_custom_lists_v1'

// ── Custom lists (filter builder) ───────────────────────────────────────────
type CustomListRule = { field: string; operator: string; value: string }
type CustomList = { id: string; name: string; page: 'contacts' | 'loans'; rules: CustomListRule[] }

const LOAN_FILTER_FIELDS = [
  { id: 'status', label: 'Status' },
  { id: 'loan_purpose', label: 'Purpose' },
  { id: 'loan_program', label: 'Program' },
  { id: 'closing_date', label: 'Closing Date' },
] as const

const FILTER_OPERATORS = [
  { id: 'is', label: 'is' },
  { id: 'is_not', label: 'is not' },
  { id: 'contains', label: 'contains' },
  { id: 'before', label: 'before' },
  { id: 'after', label: 'after' },
] as const

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyCustomListRulesLoan(query: any, rules: CustomListRule[]): any {
  let q = query
  for (const r of rules) {
    if (!r.value?.trim()) continue
    const val = r.value.trim()
    if (r.operator === 'is') q = q.eq(r.field, val)
    else if (r.operator === 'is_not') q = q.neq(r.field, val)
    else if (r.operator === 'contains') q = q.ilike(r.field, `%${val}%`)
    else if (r.operator === 'before') q = q.lt(r.field, val)
    else if (r.operator === 'after') q = q.gt(r.field, val)
  }
  return q
}

// ── Pagination + helpers (module-level to avoid re-creation) ─────────────────
const LOANS_PAGE_SIZE = 100

function flattenLoans(data: Record<string, unknown>[]): Loan[] {
  return data.map((row) => {
    const raw = row.contacts
    const contact = Array.isArray(raw) ? raw[0] : raw
    const rest = { ...row }
    delete rest.contacts
    return {
      ...rest,
      contact_email: (contact as { email?: string } | null)?.email ?? null,
      contact_phone: (contact as { phone?: string } | null)?.phone ?? null,
    } as Loan
  })
}

// ── Component ────────────────────────────────────────────────────────────────

export default function LoansPage() {
  const supabase = createClient()
  const [loans, setLoans] = useState<Loan[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [activeList, setActiveList] = useState('inprocess')
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('closing_date')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [visibleColumns, setVisibleColumns] = useState<string[]>(DEFAULT_LOAN_COLUMNS)
  const [showColPicker, setShowColPicker] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sidebarCollapsedUser, setSidebarCollapsedUser] = useState<boolean | null>(null)
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null)
  const [customLists, setCustomLists] = useState<CustomList[]>([])
  const [showNewListModal, setShowNewListModal] = useState(false)
  const [newListName, setNewListName] = useState('')
  const [newListRules, setNewListRules] = useState<CustomListRule[]>([{ field: 'status', operator: 'is', value: '' }])
  const [deleteListId, setDeleteListId] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkStatus, setBulkStatus] = useState('')
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const loansOffsetRef = useRef(0)

  // Restore column visibility from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_LOAN_COLUMNS_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as string[]
        if (Array.isArray(parsed) && parsed.length > 0)
          setVisibleColumns(parsed.filter(id => LOAN_COLUMNS.some(c => c.id === id)))
      }
    } catch {}
  }, [])

  // Sidebar collapse: under 1280px default collapsed; toggle overrides
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1279px)')
    const sync = () => setSidebarCollapsed(sidebarCollapsedUser ?? mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [sidebarCollapsedUser])

  // Load custom lists from localStorage (loans only)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_CUSTOM_LISTS_KEY)
      if (stored) {
        const all: CustomList[] = JSON.parse(stored)
        setCustomLists(all.filter(l => l.page === 'loans'))
      }
    } catch {}
  }, [])

  const toggleColumn = (id: string) => {
    setVisibleColumns(prev => {
      const next = prev.includes(id)
        ? prev.filter(c => c !== id)
        : [...prev, id]
      try { localStorage.setItem(LS_LOAN_COLUMNS_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }

  // ── Fetch counts ───────────────────────────────────────────────────────
  const fetchCounts = useCallback(async () => {
    const map: Record<string, number> = {}
    for (const list of SMART_LISTS) {
      let q = supabase.from('loans').select('id', { count: 'exact', head: true })
      if (list.statuses) q = q.in('status', list.statuses)
      const { count } = await q
      map[list.id] = count ?? 0
    }
    for (const list of customLists) {
      let q = supabase.from('loans').select('id', { count: 'exact', head: true })
      if (list.rules?.length) q = applyCustomListRulesLoan(q, list.rules)
      const { count } = await q
      map[list.id] = count ?? 0
    }
    setCounts(map)
  }, [customLists, supabase])

  // ── Fetch loans (with contact email/phone via join) ──────────────────────
  const buildLoansQuery = useCallback((listId: string) => {
    let q = supabase
      .from('loans')
      .select('id, loan_name, borrower_name, status, loan_amount, loan_purpose, loan_program, closing_date, property_address, property_city, property_state, contact_id, contacts!contact_id(email, phone)')
      .order('closing_date', { ascending: false, nullsFirst: false })
    if (listId.startsWith('custom-')) {
      const custom = customLists.find(l => l.id === listId)
      if (custom?.rules?.length) q = applyCustomListRulesLoan(q, custom.rules)
    } else {
      const list = SMART_LISTS.find(l => l.id === listId)
      if (list?.statuses) q = q.in('status', list.statuses)
    }
    return q
  }, [customLists, supabase])

  const fetchLoans = useCallback(async (listId: string) => {
    setLoading(true)
    loansOffsetRef.current = 0
    const { data, error } = await buildLoansQuery(listId).range(0, LOANS_PAGE_SIZE - 1)
    if (!error && data) {
      setLoans(flattenLoans(data as Record<string, unknown>[]))
      setHasMore(data.length === LOANS_PAGE_SIZE)
    } else if (!error) {
      setLoans([])
      setHasMore(false)
    }
    setLoading(false)
  }, [buildLoansQuery])

  const loadMoreLoans = useCallback(async () => {
    setLoadingMore(true)
    const nextOffset = loansOffsetRef.current + LOANS_PAGE_SIZE
    const { data, error } = await buildLoansQuery(activeList).range(nextOffset, nextOffset + LOANS_PAGE_SIZE - 1)
    if (!error && data) {
      loansOffsetRef.current = nextOffset
      setLoans(prev => [...prev, ...flattenLoans(data as Record<string, unknown>[])])
      setHasMore(data.length === LOANS_PAGE_SIZE)
    }
    setLoadingMore(false)
  }, [buildLoansQuery, activeList])

  useEffect(() => {
    fetchCounts()
    fetchLoans('inprocess')
  }, [fetchCounts, fetchLoans])

  const handleListChange = (listId: string) => {
    setActiveList(listId)
    setSearch('')
    setEditingStatusId(null)
    setSelected(new Set())
    fetchLoans(listId)
  }

  // ── Inline status change ───────────────────────────────────────────────
  const handleStatusChange = useCallback(async (loanId: string, newStatus: string) => {
    setEditingStatusId(null)
    const { error } = await supabase.from('loans').update({ status: newStatus }).eq('id', loanId)
    if (!error) {
      setLoans(prev => prev.map(l => l.id === loanId ? { ...l, status: newStatus } : l))
      supabase.from('activity_log').insert({ action: 'loan.status_changed', entity_type: 'loan', loan_id: loanId, metadata: { to: newStatus } })
      await fetchCounts()
      if (!activeList.startsWith('custom-')) fetchLoans(activeList)
    }
  }, [supabase, activeList, fetchCounts, fetchLoans])

  // ── Bulk actions ──────────────────────────────────────────────────────
  const toggleSelect = (id: string) => setSelected(prev => {
    const next = new Set(prev)
    if (next.has(id)) { next.delete(id) } else { next.add(id) }
    return next
  })

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set())
    else setSelected(new Set(filtered.map(l => l.id)))
  }

  const handleBulkStatusUpdate = useCallback(async (newStatus: string) => {
    if (!selected.size) return
    const ids = [...selected]
    const { error } = await supabase.from('loans').update({ status: newStatus }).in('id', ids)
    if (!error) {
      setLoans(prev => prev.map(l => ids.includes(l.id) ? { ...l, status: newStatus } : l))
      supabase.from('activity_log').insert(ids.map(id => ({ action: 'loan.status_changed', entity_type: 'loan', loan_id: id, metadata: { to: newStatus } })))
      setSelected(new Set())
      setBulkStatus('')
      await fetchCounts()
    }
  }, [selected, supabase, fetchCounts])

  const handleBulkDelete = useCallback(async () => {
    if (!selected.size || !confirm(`Delete ${selected.size} loan(s)? This cannot be undone.`)) return
    const ids = [...selected]
    const { error } = await supabase.from('loans').delete().in('id', ids)
    if (!error) {
      setLoans(prev => prev.filter(l => !ids.includes(l.id)))
      setSelected(new Set())
      await fetchCounts()
    }
  }, [selected, supabase, fetchCounts])

  // ── Sort + search ──────────────────────────────────────────────────────
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const filtered = useMemo(() => {
    let list = loans
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(l =>
        (l.borrower_name || '').toLowerCase().includes(q) ||
        (l.loan_name || '').toLowerCase().includes(q) ||
        (l.property_address || '').toLowerCase().includes(q) ||
        (l.property_city || '').toLowerCase().includes(q) ||
        (l.status || '').toLowerCase().includes(q)
      )
    }
    return [...list].sort((a, b) => {
      const mul = sortDir === 'asc' ? 1 : -1
      if (sortKey === 'loan_amount') {
        return mul * ((a.loan_amount ?? 0) - (b.loan_amount ?? 0))
      }
      if (sortKey === 'closing_date') {
        const av = a.closing_date ?? ''
        const bv = b.closing_date ?? ''
        return mul * (av < bv ? -1 : av > bv ? 1 : 0)
      }
      const av = (a[sortKey] || '').toLowerCase()
      const bv = (b[sortKey] || '').toLowerCase()
      return mul * (av < bv ? -1 : av > bv ? 1 : 0)
    })
  }, [loans, search, sortKey, sortDir])

  // ── Sort icon ──────────────────────────────────────────────────────────
  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ChevronDown size={12} className="text-[#666666] ml-0.5" />
    return sortDir === 'asc'
      ? <ChevronUp size={12} className="text-[#C9A84C] ml-0.5" />
      : <ChevronDown size={12} className="text-[#C9A84C] ml-0.5" />
  }

  // ── Property location ──────────────────────────────────────────────────
  const loanLocation = (l: Loan) => {
    const parts = [l.property_city, l.property_state].filter(Boolean)
    return parts.length ? parts.join(', ') : l.property_address || '—'
  }

  const colDefs = LOAN_COLUMNS.filter(c => visibleColumns.includes(c.id))
  const activeListLabel = activeList.startsWith('custom-')
    ? (customLists.find(l => l.id === activeList)?.name ?? 'Custom List')
    : (SMART_LISTS.find(l => l.id === activeList)?.label ?? 'All Loans')

  function persistCustomListsLoans(lists: CustomList[]) {
    try {
      const existing = localStorage.getItem(LS_CUSTOM_LISTS_KEY)
      const all: CustomList[] = existing ? JSON.parse(existing) : []
      const others = all.filter(l => l.page !== 'loans')
      localStorage.setItem(LS_CUSTOM_LISTS_KEY, JSON.stringify([...others, ...lists]))
    } catch {}
  }

  function handleSaveNewList() {
    const name = newListName.trim()
    if (!name) return
    const list: CustomList = {
      id: `custom-${crypto.randomUUID()}`,
      name,
      page: 'loans',
      rules: newListRules.filter(r => r.value?.trim()),
    }
    const next = [...customLists, list]
    setCustomLists(next)
    persistCustomListsLoans(next.filter(l => l.page === 'loans'))
    setShowNewListModal(false)
    setActiveList(list.id)
    fetchCounts()
    fetchLoans(list.id)
  }

  function handleDeleteList() {
    if (!deleteListId) return
    const next = customLists.filter(l => l.id !== deleteListId)
    setCustomLists(next)
    persistCustomListsLoans(next)
    if (activeList === deleteListId) setActiveList('all')
    setDeleteListId(null)
    fetchCounts()
    fetchLoans('all')
  }

  return (
    <div className="flex min-h-screen bg-[#0A0A0A]">
      {/* Sidebar */}
      <aside
        className="shrink-0 border-r border-[#2A2A2A] bg-[#0A0A0A] flex flex-col transition-[width] duration-200"
        style={{ width: sidebarCollapsed ? 52 : 200 }}
      >
        <div className="flex items-center justify-between px-2 py-3 min-h-[40px]">
          {!sidebarCollapsed && (
            <p className="text-[9px] font-mono font-semibold text-[#666666] uppercase tracking-wider">Views</p>
          )}
          <button
            type="button"
            onClick={() => setSidebarCollapsedUser(prev => (prev === null ? !sidebarCollapsed : !prev))}
            className="text-[#666666] text-xs p-1 hover:text-[#F0F0F0] transition-colors"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? '›' : '‹'}
          </button>
        </div>
        <div className="px-2 pb-4">
          {SMART_LISTS.map(list => {
            const initial = list.label.charAt(0)
            return (
              <button
                key={list.id}
                onClick={() => handleListChange(list.id)}
                className={`w-full flex items-center justify-between rounded text-left transition-colors ${
                  sidebarCollapsed ? 'px-2 py-1.5' : 'px-2 py-1'
                } text-[11px] font-mono ${
                  activeList === list.id
                    ? 'text-[#C9A84C] font-semibold bg-[#C9A84C]/10 border-r-2 border-[#C9A84C]'
                    : 'text-[#999999] hover:bg-[#1A1A1A] hover:text-[#F0F0F0]'
                }`}
                title={sidebarCollapsed ? list.label : undefined}
              >
                {sidebarCollapsed ? (
                  <span className="font-semibold text-xs">{initial}</span>
                ) : (
                  <span className="truncate">{list.label}</span>
                )}
                <span className={`text-[10px] rounded-full px-1 py-0 shrink-0 ml-1 ${
                  activeList === list.id ? 'bg-[#C9A84C]/20 text-[#C9A84C]' : 'bg-[#2A2A2A] text-[#666666]'
                }`}>
                  {counts[list.id] ?? '…'}
                </span>
              </button>
            )
          })}
          {customLists.map(cl => {
            const initial = cl.name.charAt(0)
            return (
              <div key={cl.id} className="flex items-center gap-1">
                <button
                  key={cl.id}
                  onClick={() => handleListChange(cl.id)}
                  className={`w-full flex items-center justify-between rounded text-left transition-colors ${
                    sidebarCollapsed ? 'px-2 py-1.5' : 'px-2 py-1'
                  } text-[11px] font-mono flex-1 min-w-0 ${
                    activeList === cl.id
                      ? 'text-[#C9A84C] font-semibold bg-[#C9A84C]/10 border-r-2 border-[#C9A84C]'
                      : 'text-[#999999] hover:bg-[#1A1A1A] hover:text-[#F0F0F0]'
                  }`}
                  title={sidebarCollapsed ? cl.name : undefined}
                >
                  {sidebarCollapsed ? (
                    <span className="font-semibold text-xs">{initial}</span>
                  ) : (
                    <span className="truncate">{cl.name}</span>
                  )}
                  <span className={`text-[10px] rounded-full px-1 py-0 shrink-0 ml-1 ${
                    activeList === cl.id ? 'bg-[#C9A84C]/20 text-[#C9A84C]' : 'bg-[#2A2A2A] text-[#666666]'
                  }`}>
                    {counts[cl.id] ?? '…'}
                  </span>
                </button>
                {!sidebarCollapsed && (
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); setDeleteListId(cl.id) }}
                    className="text-[#666666] hover:text-[#F0F0F0] p-0.5 text-xs transition-colors"
                    title="Delete list"
                  >
                    ×
                  </button>
                )}
              </div>
            )
          })}
          <button
            type="button"
            onClick={() => { setShowNewListModal(true); setNewListName(''); setNewListRules([{ field: 'status', operator: 'is', value: '' }]) }}
            className="w-full mt-2 text-[10px] font-mono text-[#C9A84C] border border-dashed border-[#C9A84C]/40 rounded px-2 py-1.5 hover:bg-[#C9A84C]/10 transition-colors"
          >
            + New List
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A2A2A]">
          <div>
            <h1 className="text-lg font-mono font-semibold text-[#F0F0F0]">
              {activeListLabel}
            </h1>
            <p className="text-xs font-mono text-[#666666] mt-0.5">
              {filtered.length} {filtered.length === 1 ? 'loan' : 'loans'}
              {search && ` matching "${search}"`}
            </p>
          </div>
          {/* Quick filter dropdown */}
          <select
            value={LOAN_QUICK_FILTERS.some(f => f.id === activeList) ? activeList : 'all'}
            onChange={e => handleListChange(e.target.value)}
            className="text-xs font-mono px-3 py-1.5 border border-[#C9A84C]/40 rounded-lg bg-[#1A1A1A] text-[#C9A84C] cursor-pointer outline-none"
          >
            {LOAN_QUICK_FILTERS.map(f => (
              <option key={f.id} value={f.id}>{f.label}</option>
            ))}
          </select>
          {/* Column picker */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowColPicker(p => !p)}
              className="text-xs font-mono font-medium text-[#666666] px-3 py-1.5 border border-[#2A2A2A] rounded-lg hover:bg-[#1A1A1A] hover:text-[#F0F0F0] transition-colors"
            >
              COLUMNS ▾
            </button>
            {showColPicker && (
              <div
                role="listbox"
                className="absolute right-0 top-full mt-1 z-[100] min-w-[180px] py-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg shadow-xl"
              >
                {LOAN_COLUMNS.map(col => (
                  <label
                    key={col.id}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono text-[#F0F0F0] cursor-pointer hover:bg-[#2A2A2A]"
                  >
                    <input
                      type="checkbox"
                      checked={visibleColumns.includes(col.id)}
                      onChange={() => toggleColumn(col.id)}
                      onClick={e => e.stopPropagation()}
                      className="rounded cursor-pointer accent-[#C9A84C]"
                    />
                    {col.label}
                  </label>
                ))}
              </div>
            )}
          </div>
          {/* Search */}
          <div className="relative w-64">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#666666]" />
            <input
              type="text"
              placeholder="Search loans…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-sm font-mono border border-[#2A2A2A] rounded-lg bg-[#1A1A1A] text-[#F0F0F0] placeholder:text-[#666666] focus:outline-none focus:ring-2 focus:ring-[#C9A84C] focus:border-transparent"
            />
          </div>
        </div>

        {/* Bulk actions bar */}
        {selected.size > 0 && (
          <div className="flex items-center gap-3 px-4 py-2 bg-[#C9A84C]/10 border border-[#C9A84C]/30 rounded-lg mx-4 mb-2 mt-2">
            <span className="text-sm font-mono font-medium text-[#C9A84C]">{selected.size} selected</span>
            <div className="flex items-center gap-2 ml-auto">
              <select
                value={bulkStatus}
                onChange={e => { setBulkStatus(e.target.value); if (e.target.value) handleBulkStatusUpdate(e.target.value) }}
                className="text-xs font-mono border border-[#2A2A2A] rounded px-2 py-1.5 bg-[#1A1A1A] text-[#F0F0F0]"
              >
                <option value="">Update Status…</option>
                {LOAN_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-1 text-xs font-mono px-3 py-1.5 rounded bg-red-900/30 text-red-400 border border-red-800 hover:bg-red-900/50 transition-colors"
              >
                <Trash2 size={12} />
                Delete
              </button>
              <button
                onClick={() => setSelected(new Set())}
                className="text-xs font-mono text-[#666666] hover:text-[#F0F0F0] px-2 py-1.5 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-[#666666] text-sm font-mono">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2 text-[#666666]">
              <AlertCircle size={20} />
              <p className="text-sm font-mono">No loans found</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2A2A2A] bg-[#161616]">
                  <th className="w-8 px-2 py-2.5">
                    <input
                      type="checkbox"
                      checked={filtered.length > 0 && selected.size === filtered.length}
                      onChange={toggleSelectAll}
                      className="rounded border-[#2A2A2A] accent-[#C9A84C] focus:ring-[#C9A84C]"
                    />
                  </th>
                  {colDefs.map(col => (
                    <th
                      key={col.id}
                      onClick={() => col.key && handleSort(col.key)}
                      className={`text-left px-4 py-2.5 text-xs font-mono font-semibold text-[#666666] uppercase tracking-wide select-none ${
                        col.key ? 'cursor-pointer hover:text-[#F0F0F0]' : ''
                      }`}
                    >
                      <span className="flex items-center gap-0.5">
                        {col.label}
                        {col.key && <SortIcon k={col.key} />}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(loan => {
                  const urgencyStyle = closingUrgencyStyle(loan.closing_date, activeList === 'inprocess')
                  const days = activeList === 'inprocess' ? daysUntilClose(loan.closing_date) : null
                  return (
                  <tr key={loan.id}
                    className={`border-b border-[#2A2A2A]/50 hover:bg-[#1A1A1A] transition-colors ${selected.has(loan.id) ? 'bg-[#C9A84C]/5' : ''}`}
                    style={urgencyStyle}>
                    <td className="w-8 px-2 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(loan.id)}
                        onChange={() => toggleSelect(loan.id)}
                        className="rounded border-[#2A2A2A] accent-[#C9A84C] focus:ring-[#C9A84C]"
                      />
                    </td>
                    {colDefs.map(col => {
                      if (col.id === 'borrower_name') {
                        return (
                          <td key={col.id} className="px-4 py-3 font-medium">
                            <Link href={`/dashboard/loans/${loan.id}`} className="text-[#F0F0F0] hover:text-[#C9A84C] hover:underline font-mono">
                              {loan.borrower_name || loan.loan_name || '(unnamed)'}
                            </Link>
                            {loan.loan_name && loan.borrower_name && (
                              <p className="text-xs font-mono text-[#666666] mt-0.5">{loan.loan_name}</p>
                            )}
                          </td>
                        )
                      }
                      if (col.id === 'loan_amount') return <td key={col.id} className="px-4 py-3 font-mono text-[#CCCCCC] whitespace-nowrap">{fmtCurrency(loan.loan_amount)}</td>
                      if (col.id === 'status') {
                        return (
                          <td key={col.id} className="px-4 py-3" onClick={e => e.stopPropagation()}>
                            {editingStatusId === loan.id ? (
                              <select
                                autoFocus
                                value={loan.status ?? ''}
                                onChange={e => handleStatusChange(loan.id, e.target.value)}
                                onBlur={() => setEditingStatusId(null)}
                                className="text-xs font-mono border border-[#2A2A2A] rounded px-2 py-1 bg-[#1A1A1A] text-[#F0F0F0]"
                              >
                                {LOAN_STATUS_OPTIONS.map(s => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </select>
                            ) : (
                              <span onClick={() => setEditingStatusId(loan.id)} className="cursor-pointer">
                                <StatusBadge status={loan.status} />
                              </span>
                            )}
                          </td>
                        )
                      }
                      if (col.id === 'loan_purpose') return <td key={col.id} className="px-4 py-3 font-mono text-[#999999]">{loan.loan_purpose || '—'}</td>
                      if (col.id === 'closing_date') return (
                        <td key={col.id} className="px-4 py-3 font-mono whitespace-nowrap">
                          <span className={days !== null && days <= 7 ? 'text-red-400' : days !== null && days <= 14 ? 'text-amber-400' : 'text-[#999999]'}>
                            {fmtDate(loan.closing_date)}
                          </span>
                          {days !== null && days <= 14 && (
                            <span className={`ml-2 text-[10px] ${days <= 7 ? 'text-red-400' : 'text-amber-400'}`}>
                              {days <= 0 ? 'TODAY' : `${days}d`}
                            </span>
                          )}
                        </td>
                      )
                      if (col.id === 'location') return <td key={col.id} className="px-4 py-3 font-mono text-[#999999]">{loanLocation(loan)}</td>
                      if (col.id === 'loan_program') return <td key={col.id} className="px-4 py-3 font-mono text-[#999999]">{loan.loan_program || '—'}</td>
                      if (col.id === 'contact_email') {
                        const href = mailtoHref(loan.contact_email)
                        const val = loan.contact_email ?? '—'
                        return (
                          <td key={col.id} className="px-4 py-3 font-mono text-[#999999]">
                            {href ? <a href={href} onClick={e => e.stopPropagation()} className="hover:text-[#C9A84C] hover:underline">{val}</a> : val}
                          </td>
                        )
                      }
                      if (col.id === 'contact_phone') {
                        const href = telHref(loan.contact_phone)
                        const val = loan.contact_phone ?? '—'
                        return (
                          <td key={col.id} className="px-4 py-3 font-mono text-[#999999]">
                            {href ? <a href={href} onClick={e => e.stopPropagation()} className="hover:text-[#C9A84C] hover:underline">{val}</a> : val}
                          </td>
                        )
                      }
                      return null
                    })}
                  </tr>
                  )
                })}
              </tbody>
            </table>
          )}
          {/* Load More */}
          {hasMore && !loading && (
            <div className="flex justify-center py-4 border-t border-[#2A2A2A]">
              <button
                onClick={loadMoreLoans}
                disabled={loadingMore}
                className="px-5 py-2 text-xs font-mono tracking-widest uppercase border border-[#2A2A2A] rounded text-[#999999] hover:bg-[#1A1A1A] hover:text-[#F0F0F0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loadingMore ? 'Loading…' : `Load more (showing ${loans.length})`}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* New List (custom filter) modal */}
      {showNewListModal && (
        <div className="fixed inset-0 bg-black/70 z-[300] flex items-center justify-center" onClick={() => setShowNewListModal(false)}>
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-6 w-full max-w-md max-h-[85vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="text-xs font-mono font-semibold text-[#666666] uppercase tracking-wider mb-3">New Smart List</div>
            <input
              placeholder="List name"
              value={newListName}
              onChange={e => setNewListName(e.target.value)}
              className="w-full border border-[#2A2A2A] rounded px-3 py-2 text-sm font-mono bg-[#0A0A0A] text-[#F0F0F0] placeholder:text-[#666666] mb-4 focus:outline-none focus:ring-1 focus:ring-[#C9A84C]"
            />
            <div className="text-[10px] font-mono text-[#666666] uppercase tracking-wider mb-2">Filter rules (AND)</div>
            {newListRules.map((rule, idx) => (
              <div key={idx} className="flex gap-2 mb-2 flex-wrap items-center">
                <select
                  value={rule.field}
                  onChange={e => setNewListRules(prev => prev.map((r, i) => i === idx ? { ...r, field: e.target.value } : r))}
                  className="min-w-[100px] border border-[#2A2A2A] rounded px-2 py-1.5 text-xs font-mono bg-[#0A0A0A] text-[#F0F0F0]"
                >
                  {LOAN_FILTER_FIELDS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                </select>
                <select
                  value={rule.operator}
                  onChange={e => setNewListRules(prev => prev.map((r, i) => i === idx ? { ...r, operator: e.target.value } : r))}
                  className="min-w-[80px] border border-[#2A2A2A] rounded px-2 py-1.5 text-xs font-mono bg-[#0A0A0A] text-[#F0F0F0]"
                >
                  {FILTER_OPERATORS.map(op => <option key={op.id} value={op.id}>{op.label}</option>)}
                </select>
                <input
                  placeholder="Value"
                  value={rule.value}
                  onChange={e => setNewListRules(prev => prev.map((r, i) => i === idx ? { ...r, value: e.target.value } : r))}
                  className="flex-1 min-w-[80px] border border-[#2A2A2A] rounded px-2 py-1.5 text-xs font-mono bg-[#0A0A0A] text-[#F0F0F0] placeholder:text-[#666666]"
                />
                {newListRules.length > 1 && (
                  <button type="button" onClick={() => setNewListRules(prev => prev.filter((_, i) => i !== idx))} className="text-[#666666] hover:text-[#F0F0F0] p-1 transition-colors">×</button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => setNewListRules(prev => [...prev, { field: 'status', operator: 'is', value: '' }])}
              className="text-xs font-mono text-[#C9A84C] border border-dashed border-[#C9A84C]/40 rounded px-2 py-1 mb-4 hover:bg-[#C9A84C]/10 transition-colors"
            >
              + Add Filter
            </button>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowNewListModal(false)} className="px-3 py-1.5 text-xs font-mono border border-[#2A2A2A] rounded text-[#666666] hover:bg-[#2A2A2A] transition-colors">
                Cancel
              </button>
              <button onClick={handleSaveNewList} disabled={!newListName.trim()} className="px-3 py-1.5 text-xs font-mono bg-[#C9A84C] text-[#0A0A0A] rounded font-semibold disabled:opacity-50 hover:bg-[#D4B05C] transition-colors">
                Save List
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete custom list confirmation */}
      {deleteListId && (
        <div className="fixed inset-0 bg-black/70 z-[300] flex items-center justify-center" onClick={() => setDeleteListId(null)}>
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-6 w-80 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="text-sm font-mono text-[#F0F0F0] mb-2">Delete this list?</div>
            <div className="text-xs font-mono text-[#666666] mb-4">This cannot be undone.</div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteListId(null)} className="px-3 py-1.5 text-xs font-mono border border-[#2A2A2A] rounded text-[#666666] hover:bg-[#2A2A2A] transition-colors">Cancel</button>
              <button onClick={handleDeleteList} className="px-3 py-1.5 text-xs font-mono bg-red-700 text-white rounded hover:bg-red-600 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Column picker backdrop — click outside to close */}
      {showColPicker && (
        <div
          className="fixed inset-0 z-[50]"
          onClick={() => setShowColPicker(false)}
          aria-hidden
        />
      )}
    </div>
  )
}

// ── Status badge (dark-theme color map) ──────────────────────────────────────

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  'Lead':           { bg: 'rgba(255,255,255,0.06)',  text: '#888888' },
  'Pre-App':        { bg: 'rgba(76,126,201,0.2)',    text: '#7AABEE' },
  'Application':    { bg: 'rgba(123,76,201,0.2)',    text: '#A97EEE' },
  'In Process':     { bg: 'rgba(76,201,138,0.15)',   text: '#5CC99A' },
  'Clear to Close': { bg: 'rgba(46,204,113,0.15)',   text: '#4ECC80' },
  'Closed':         { bg: 'rgba(201,168,76,0.15)',   text: '#C9A84C' },
  'On Hold':        { bg: 'rgba(230,126,34,0.15)',   text: '#E8944A' },
  'Dead':           { bg: 'rgba(100,100,100,0.2)',   text: '#666666' },
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-[#666666] font-mono">—</span>

  const s = status.toLowerCase()
  let style = STATUS_STYLES[status] ?? { bg: 'rgba(100,100,100,0.2)', text: '#666666' }
  if (!STATUS_STYLES[status]) {
    if (['closed', 'funded', 'closed/funded'].some(v => s.includes(v))) style = STATUS_STYLES['Closed'] ?? style
    else if (['in process', 'processing', 'clear to close', 'submitted', 'conditional', 'approved', 'pre-approved'].some(v => s.includes(v))) style = STATUS_STYLES['In Process'] ?? style
    else if (['lead', 'pre-app', 'application', 'started'].some(v => s.includes(v))) style = STATUS_STYLES['Lead'] ?? style
    else if (['on hold', 'dead', 'cancelled', 'denied', 'withdrawn', 'suspended'].some(v => s.includes(v))) style = STATUS_STYLES['Dead'] ?? style
  }

  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono font-medium" style={{ background: style.bg, color: style.text }}>
      {status}
    </span>
  )
}
