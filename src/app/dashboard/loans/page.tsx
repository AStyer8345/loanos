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
  { id: 'started',    label: 'Started',    statuses: ['Started', 'Started App', 'lead', 'APPLICATION_INTAKE'] },
  { id: 'cancelled',  label: 'Cancelled',  statuses: ['Cancelled', 'Denied', 'Withdrawn', 'Suspended'] },
]

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
]

const DEFAULT_LOAN_COLUMNS = LOAN_COLUMNS.map(c => c.id)
const LS_LOAN_COLUMNS_KEY = 'loanos_loans_columns_v1'

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
    const results = await Promise.all(
      SMART_LISTS.map(async (list) => {
        let q = supabase.from('loans').select('id', { count: 'exact', head: true })
        if (list.statuses) q = q.in('status', list.statuses)
        const { count } = await q
        return { id: list.id, count: count ?? 0 }
      })
    )
    const map: Record<string, number> = {}
    results.forEach(r => { map[r.id] = r.count })
    setCounts(map)
  }, [])

  // ── Fetch loans ────────────────────────────────────────────────────────
  const fetchLoans = useCallback(async (listId: string) => {
    setLoading(true)
    const list = SMART_LISTS.find(l => l.id === listId)!
    let q = supabase
      .from('loans')
      .select('id, loan_name, borrower_name, status, loan_amount, loan_purpose, loan_program, closing_date, property_address, property_city, property_state, contact_id')
      .order('closing_date', { ascending: false, nullsFirst: false })

    if (list.statuses) q = q.in('status', list.statuses)

    const { data, error } = await q.limit(500)
    if (!error) setLoans(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchCounts()
    fetchLoans('all')
  }, [fetchCounts, fetchLoans])

  const handleListChange = (listId: string) => {
    setActiveList(listId)
    setSearch('')
    fetchLoans(listId)
  }

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
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">
              {SMART_LISTS.find(l => l.id === activeList)?.label}
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
                      if (col.id === 'status') return <td key={col.id} className="px-4 py-3"><StatusBadge status={loan.status} /></td>
                      if (col.id === 'loan_purpose') return <td key={col.id} className="px-4 py-3 text-slate-600">{loan.loan_purpose || '—'}</td>
                      if (col.id === 'closing_date') return <td key={col.id} className="px-4 py-3 text-slate-600 whitespace-nowrap">{fmtDate(loan.closing_date)}</td>
                      if (col.id === 'location') return <td key={col.id} className="px-4 py-3 text-slate-600">{loanLocation(loan)}</td>
                      if (col.id === 'loan_program') return <td key={col.id} className="px-4 py-3 text-slate-600">{loan.loan_program || '—'}</td>
                      return null
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

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

// ── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-slate-400">—</span>

  const s = status.toLowerCase()
  let cls = 'bg-slate-100 text-slate-600'
  if (['closed', 'funded', 'closed/funded'].some(v => s.includes(v))) {
    cls = 'bg-emerald-100 text-emerald-700'
  } else if (['in process', 'processing', 'submitted', 'conditional', 'clear to close', 'approved', 'pre-approved', 'qualification', 'disclosure_sent'].some(v => s.includes(v))) {
    cls = 'bg-blue-100 text-blue-700'
  } else if (['started', 'lead', 'application_intake'].some(v => s.includes(v))) {
    cls = 'bg-amber-100 text-amber-700'
  } else if (['cancelled', 'denied', 'withdrawn', 'suspended'].some(v => s.includes(v))) {
    cls = 'bg-red-100 text-red-600'
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {status}
    </span>
  )
}
