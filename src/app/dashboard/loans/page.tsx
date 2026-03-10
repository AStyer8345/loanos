'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Search, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'

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
  { id: 'all',        label: 'All Loans',  statuses: null },
  { id: 'closed',     label: 'Closed',     statuses: ['Closed', 'Funded', 'Closed/Funded'] },
  { id: 'inprocess',  label: 'In Process', statuses: ['In Process', 'Loan in Process', 'Processing', 'processing', 'Submitted', 'Conditional Approval', 'Clear to Close', 'Approved', 'Pre-Approved', 'QUALIFICATION', 'DISCLOSURE_SENT'] },
  { id: 'started',    label: 'Started',    statuses: ['Started', 'Started App', 'lead', 'Lead', 'Pre-App', 'Application', 'APPLICATION_INTAKE'] },
  { id: 'cancelled',  label: 'Cancelled',  statuses: ['Cancelled', 'Denied', 'Withdrawn', 'Suspended', 'On Hold', 'Dead'] },
]

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

// ── Component ────────────────────────────────────────────────────────────────

export default function LoansPage() {
  const supabase = createClient()
  const [loans, setLoans] = useState<Loan[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [activeList, setActiveList] = useState('all')
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('closing_date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
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
  }, [customLists])

  // ── Fetch loans (with contact email/phone via join) ──────────────────────
  const fetchLoans = useCallback(async (listId: string) => {
    setLoading(true)
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

    const { data, error } = await q.limit(500)
    if (!error && data) {
      const flattened: Loan[] = data.map((row: Record<string, unknown>) => {
        const raw = row.contacts
        const contact = Array.isArray(raw) ? raw[0] : raw
        const { contacts: _, ...rest } = row
        return {
          ...rest,
          contact_email: (contact as { email?: string } | null)?.email ?? null,
          contact_phone: (contact as { phone?: string } | null)?.phone ?? null,
        } as Loan
      })
      setLoans(flattened)
    } else if (!error) {
      setLoans([])
    }
    setLoading(false)
  }, [customLists])

  useEffect(() => {
    fetchCounts()
    fetchLoans('all')
  }, [fetchCounts, fetchLoans])

  const handleListChange = (listId: string) => {
    setActiveList(listId)
    setSearch('')
    setEditingStatusId(null)
    fetchLoans(listId)
  }

  // ── Inline status change ───────────────────────────────────────────────
  const handleStatusChange = useCallback(async (loanId: string, newStatus: string) => {
    setEditingStatusId(null)
    const { error } = await supabase.from('loans').update({ status: newStatus }).eq('id', loanId)
    if (!error) {
      setLoans(prev => prev.map(l => l.id === loanId ? { ...l, status: newStatus } : l))
      await fetchCounts()
      if (!activeList.startsWith('custom-')) fetchLoans(activeList)
    }
  }, [supabase, activeList, fetchCounts, fetchLoans])

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
    if (sortKey !== k) return <ChevronDown size={12} className="text-slate-300 ml-0.5" />
    return sortDir === 'asc'
      ? <ChevronUp size={12} className="text-emerald-600 ml-0.5" />
      : <ChevronDown size={12} className="text-emerald-600 ml-0.5" />
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
    <div className="flex h-full">
      {/* Sidebar — collapses to icon rail under 1280px or via toggle */}
      <aside
        className="shrink-0 border-r border-slate-200 flex flex-col transition-[width] duration-200"
        style={{ width: sidebarCollapsed ? 52 : 200 }}
      >
        <div className="flex items-center justify-between px-2 py-3 min-h-[40px]">
          {!sidebarCollapsed && (
            <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Views</p>
          )}
          <button
            type="button"
            onClick={() => setSidebarCollapsedUser(prev => (prev === null ? !sidebarCollapsed : !prev))}
            className="text-slate-400 text-xs p-1 hover:text-slate-600"
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
                } text-[11px] ${
                  activeList === list.id
                    ? 'text-emerald-700 font-semibold bg-emerald-50 border-r-2 border-emerald-600'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
                title={sidebarCollapsed ? list.label : undefined}
              >
                {sidebarCollapsed ? (
                  <span className="font-semibold text-xs">{initial}</span>
                ) : (
                  <span className="truncate">{list.label}</span>
                )}
                <span className={`text-[10px] rounded-full px-1 py-0 shrink-0 ml-1 ${
                  activeList === list.id ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
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
                  } text-[11px] flex-1 min-w-0 ${
                    activeList === cl.id
                      ? 'text-emerald-700 font-semibold bg-emerald-50 border-r-2 border-emerald-600'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                  title={sidebarCollapsed ? cl.name : undefined}
                >
                  {sidebarCollapsed ? (
                    <span className="font-semibold text-xs">{initial}</span>
                  ) : (
                    <span className="truncate">{cl.name}</span>
                  )}
                  <span className={`text-[10px] rounded-full px-1 py-0 shrink-0 ml-1 ${
                    activeList === cl.id ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {counts[cl.id] ?? '…'}
                  </span>
                </button>
                {!sidebarCollapsed && (
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); setDeleteListId(cl.id) }}
                    className="text-slate-400 hover:text-slate-600 p-0.5 text-xs"
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
            className="w-full mt-2 text-[10px] text-emerald-600 border border-dashed border-emerald-300 rounded px-2 py-1.5 hover:bg-emerald-50"
          >
            + New List
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">
              {activeListLabel}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {filtered.length} {filtered.length === 1 ? 'loan' : 'loans'}
              {search && ` matching "${search}"`}
            </p>
          </div>
          {/* Column picker */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowColPicker(p => !p)}
              className="text-xs font-medium text-slate-500 px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              COLUMNS ▾
            </button>
            {showColPicker && (
              <div
                role="listbox"
                className="absolute right-0 top-full mt-1 z-[100] min-w-[180px] py-2 bg-white border border-slate-200 rounded-lg shadow-lg"
              >
                {LOAN_COLUMNS.map(col => (
                  <label
                    key={col.id}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 cursor-pointer hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      checked={visibleColumns.includes(col.id)}
                      onChange={() => toggleColumn(col.id)}
                      onClick={e => e.stopPropagation()}
                      className="rounded accent-emerald-600 cursor-pointer"
                    />
                    {col.label}
                  </label>
                ))}
              </div>
            )}
          </div>
          {/* Search */}
          <div className="relative w-64">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search loans…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-slate-400 text-sm">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2 text-slate-400">
              <AlertCircle size={20} />
              <p className="text-sm">No loans found</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  {colDefs.map(col => (
                    <th
                      key={col.id}
                      onClick={() => col.key && handleSort(col.key)}
                      className={`text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide select-none ${
                        col.key ? 'cursor-pointer hover:text-slate-700' : ''
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
                {filtered.map(loan => (
                  <tr key={loan.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    {colDefs.map(col => {
                      if (col.id === 'borrower_name') {
                        return (
                          <td key={col.id} className="px-4 py-3 font-medium">
                            <Link href={`/dashboard/loans/${loan.id}`} className="text-slate-900 hover:text-emerald-700 hover:underline">
                              {loan.borrower_name || loan.loan_name || '(unnamed)'}
                            </Link>
                            {loan.loan_name && loan.borrower_name && (
                              <p className="text-xs text-slate-400 mt-0.5">{loan.loan_name}</p>
                            )}
                          </td>
                        )
                      }
                      if (col.id === 'loan_amount') return <td key={col.id} className="px-4 py-3 text-slate-700 whitespace-nowrap">{fmtCurrency(loan.loan_amount)}</td>
                      if (col.id === 'status') {
                        return (
                          <td key={col.id} className="px-4 py-3" onClick={e => e.stopPropagation()}>
                            {editingStatusId === loan.id ? (
                              <select
                                autoFocus
                                value={loan.status ?? ''}
                                onChange={e => handleStatusChange(loan.id, e.target.value)}
                                onBlur={() => setEditingStatusId(null)}
                                className="text-xs border border-slate-200 rounded px-2 py-1 bg-white text-slate-800"
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
                      if (col.id === 'loan_purpose') return <td key={col.id} className="px-4 py-3 text-slate-600">{loan.loan_purpose || '—'}</td>
                      if (col.id === 'closing_date') return <td key={col.id} className="px-4 py-3 text-slate-600 whitespace-nowrap">{fmtDate(loan.closing_date)}</td>
                      if (col.id === 'location') return <td key={col.id} className="px-4 py-3 text-slate-600">{loanLocation(loan)}</td>
                      if (col.id === 'loan_program') return <td key={col.id} className="px-4 py-3 text-slate-600">{loan.loan_program || '—'}</td>
                      if (col.id === 'contact_email') {
                        const href = mailtoHref(loan.contact_email)
                        const val = loan.contact_email ?? '—'
                        return (
                          <td key={col.id} className="px-4 py-3 text-slate-600">
                            {href ? <a href={href} onClick={e => e.stopPropagation()} className="text-inherit no-underline hover:underline">{val}</a> : val}
                          </td>
                        )
                      }
                      if (col.id === 'contact_phone') {
                        const href = telHref(loan.contact_phone)
                        const val = loan.contact_phone ?? '—'
                        return (
                          <td key={col.id} className="px-4 py-3 text-slate-600">
                            {href ? <a href={href} onClick={e => e.stopPropagation()} className="text-inherit no-underline hover:underline">{val}</a> : val}
                          </td>
                        )
                      }
                      return null
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* New List (custom filter) modal */}
      {showNewListModal && (
        <div className="fixed inset-0 bg-black/60 z-[300] flex items-center justify-center" onClick={() => setShowNewListModal(false)}>
          <div className="bg-white border border-slate-200 rounded-lg p-6 w-full max-w-md max-h-[85vh] overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">New Smart List</div>
            <input
              placeholder="List name"
              value={newListName}
              onChange={e => setNewListName(e.target.value)}
              className="w-full border border-slate-200 rounded px-3 py-2 text-sm text-slate-800 mb-4"
            />
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Filter rules (AND)</div>
            {newListRules.map((rule, idx) => (
              <div key={idx} className="flex gap-2 mb-2 flex-wrap items-center">
                <select
                  value={rule.field}
                  onChange={e => setNewListRules(prev => prev.map((r, i) => i === idx ? { ...r, field: e.target.value } : r))}
                  className="min-w-[100px] border border-slate-200 rounded px-2 py-1.5 text-xs text-slate-800"
                >
                  {LOAN_FILTER_FIELDS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                </select>
                <select
                  value={rule.operator}
                  onChange={e => setNewListRules(prev => prev.map((r, i) => i === idx ? { ...r, operator: e.target.value } : r))}
                  className="min-w-[80px] border border-slate-200 rounded px-2 py-1.5 text-xs text-slate-800"
                >
                  {FILTER_OPERATORS.map(op => <option key={op.id} value={op.id}>{op.label}</option>)}
                </select>
                <input
                  placeholder="Value"
                  value={rule.value}
                  onChange={e => setNewListRules(prev => prev.map((r, i) => i === idx ? { ...r, value: e.target.value } : r))}
                  className="flex-1 min-w-[80px] border border-slate-200 rounded px-2 py-1.5 text-xs text-slate-800"
                />
                {newListRules.length > 1 && (
                  <button type="button" onClick={() => setNewListRules(prev => prev.filter((_, i) => i !== idx))} className="text-slate-400 hover:text-slate-600 p-1">×</button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => setNewListRules(prev => [...prev, { field: 'status', operator: 'is', value: '' }])}
              className="text-xs text-emerald-600 border border-dashed border-emerald-300 rounded px-2 py-1 mb-4 hover:bg-emerald-50"
            >
              + Add Filter
            </button>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowNewListModal(false)} className="px-3 py-1.5 text-xs border border-slate-200 rounded text-slate-500 hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={handleSaveNewList} disabled={!newListName.trim()} className="px-3 py-1.5 text-xs bg-emerald-600 text-white rounded font-medium disabled:opacity-50">
                Save List
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete custom list confirmation */}
      {deleteListId && (
        <div className="fixed inset-0 bg-black/60 z-[300] flex items-center justify-center" onClick={() => setDeleteListId(null)}>
          <div className="bg-white border border-slate-200 rounded-lg p-6 w-80 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="text-sm text-slate-800 mb-2">Delete this list?</div>
            <div className="text-xs text-slate-500 mb-4">This cannot be undone.</div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteListId(null)} className="px-3 py-1.5 text-xs border border-slate-200 rounded text-slate-500">Cancel</button>
              <button onClick={handleDeleteList} className="px-3 py-1.5 text-xs bg-red-600 text-white rounded">Delete</button>
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

// ── Status badge (color map per spec) ───────────────────────────────────────

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  'Lead':           { bg: 'rgba(201,168,76,0.2)',  text: '#C9A84C' },
  'Pre-App':        { bg: 'rgba(76,126,201,0.2)',  text: '#4C7EC9' },
  'Application':    { bg: 'rgba(123,76,201,0.2)',  text: '#7B4CC9' },
  'In Process':     { bg: 'rgba(76,201,138,0.2)',  text: '#4CC98A' },
  'Clear to Close': { bg: 'rgba(46,204,113,0.2)',   text: '#2ecc71' },
  'Closed':         { bg: 'rgba(39,174,96,0.2)',    text: '#27ae60' },
  'On Hold':        { bg: 'rgba(230,126,34,0.2)', text: '#e67e22' },
  'Dead':           { bg: 'rgba(149,165,166,0.3)', text: '#95a5a6' },
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-slate-400">—</span>

  const s = status.toLowerCase()
  let style = STATUS_STYLES[status] ?? { bg: 'rgba(148,163,184,0.2)', text: '#64748b' }
  if (!STATUS_STYLES[status]) {
    if (['closed', 'funded', 'closed/funded'].some(v => s.includes(v))) style = STATUS_STYLES['Closed'] ?? style
    else if (['in process', 'processing', 'clear to close', 'submitted', 'conditional', 'approved', 'pre-approved'].some(v => s.includes(v))) style = STATUS_STYLES['In Process'] ?? style
    else if (['lead', 'pre-app', 'application', 'started'].some(v => s.includes(v))) style = STATUS_STYLES['Lead'] ?? style
    else if (['on hold', 'dead', 'cancelled', 'denied', 'withdrawn', 'suspended'].some(v => s.includes(v))) style = STATUS_STYLES['Dead'] ?? style
  }

  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: style.bg, color: style.text }}>
      {status}
    </span>
  )
}
