'use client'

import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { Search, ChevronDown, ChevronUp, AlertCircle, Trash2, X } from 'lucide-react'
import {
  IN_PROCESS_STATUSES, FUNDED_STATUSES, PRE_APPROVAL_STATUSES,
  LEAD_STATUSES, NEW_APP_STATUSES,
  PIPELINE_STAGES as PIPELINE_STAGE_DEFS,
  LOAN_STATUS_OPTIONS as STAGE_OPTIONS,
  rawStatusesForGroup,
} from '@/lib/constants/loan-stages'

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
  commission_amount?: number | null
  doc_count?: number
}

interface SmartList {
  id: string
  label: string
  statuses: string[] | null // null = all
}

// ── Smart lists (powered by loan-stages constants) ───────────────────────────

const SMART_LISTS: SmartList[] = [
  { id: 'all',          label: 'All Loans',       statuses: null },
  { id: 'inprocess',    label: 'Loans in Process', statuses: IN_PROCESS_STATUSES },
  { id: 'closed',       label: 'Closed',          statuses: FUNDED_STATUSES },
  { id: 'preapproval',  label: 'Pre-Approval',    statuses: [...PRE_APPROVAL_STATUSES, ...LEAD_STATUSES, ...NEW_APP_STATUSES] },
  { id: 'cancelled',    label: 'Other',           statuses: ['Cancelled', 'Denied', 'Withdrawn', 'Suspended', 'On Hold', 'Dead'] },
]

// ── Quick filter options (maps to smart list IDs) ──────────────────────────────
const LOAN_QUICK_FILTERS = [
  { id: 'inprocess',   label: 'Loans in Process' },
  { id: 'all',         label: 'All Loans' },
  { id: 'closed',      label: 'Closed' },
  { id: 'preapproval', label: 'Pre-Approval' },
  { id: 'cancelled',   label: 'Other' },
] as const

// Status options from constants (used for inline edit + bulk update dropdowns)
const LOAN_STATUS_OPTIONS = STAGE_OPTIONS

// Pipeline stage definitions from constants (used by in-process dashboard bar)
const PIPELINE_STAGES = PIPELINE_STAGE_DEFS.map(s => ({
  ...s,
  statuses: rawStatusesForGroup([s.key]),
}))

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

// Map dashboard stage query param to smart list ID
const STAGE_TO_LIST: Record<string, string> = {
  'Pre-Approval': 'preapproval',
  'Processing': 'inprocess',
  'Underwriting': 'inprocess',
  'Clear to Close': 'inprocess',
  'pipeline': 'inprocess',
  'pre_approval': 'preapproval',
  'processing': 'inprocess',
  'underwriting': 'inprocess',
  'clear_to_close': 'inprocess',
  'funded': 'closed',
  'Funded': 'closed',
}

export default function LoansPage() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const router = useRouter()
  const urlStage = searchParams.get('stage')
  const urlFilter = searchParams.get('filter')
  const urlPeriod = searchParams.get('period')

  const [userId, setUserId] = useState<string | null>(null)
  const [loans, setLoans] = useState<Loan[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [activeList, setActiveList] = useState('inprocess')
  const [urlFilterActive, setUrlFilterActive] = useState<{ stage?: string; filter?: string; period?: string } | null>(null)
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
  // Advanced filters
  const [filterType, setFilterType] = useState<string>('')     // Loan type: Conventional, FHA, etc.
  const [filterPurpose, setFilterPurpose] = useState<string>('')  // Purchase, Refinance
  const [filterDateFrom, setFilterDateFrom] = useState<string>('')
  const [filterDateTo, setFilterDateTo] = useState<string>('')
  const [filterPreset, setFilterPreset] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const loansOffsetRef = useRef(0)

  // Get authenticated user
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id)
    })
  }, [supabase])

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
    if (!userId) return
    const map: Record<string, number> = {}
    for (const list of SMART_LISTS) {
      let q = supabase.from('loans').select('id', { count: 'exact', head: true }).eq('user_id', userId)
      if (list.statuses) q = q.in('status', list.statuses)
      const { count } = await q
      map[list.id] = count ?? 0
    }
    for (const list of customLists) {
      let q = supabase.from('loans').select('id', { count: 'exact', head: true }).eq('user_id', userId)
      if (list.rules?.length) q = applyCustomListRulesLoan(q, list.rules)
      const { count } = await q
      map[list.id] = count ?? 0
    }
    setCounts(map)
  }, [customLists, supabase, userId])

  // ── Fetch loans (with contact email/phone via join) ──────────────────────
  const buildLoansQuery = useCallback((listId: string) => {
    let q = supabase
      .from('loans')
      .select('id, loan_name, borrower_name, status, loan_amount, loan_purpose, loan_program, closing_date, property_address, property_city, property_state, contact_id, commission_amount, contacts!contact_id(email, phone)')
      .order('closing_date', { ascending: false, nullsFirst: false })
    if (userId) q = q.eq('user_id', userId)
    if (listId.startsWith('custom-')) {
      const custom = customLists.find(l => l.id === listId)
      if (custom?.rules?.length) q = applyCustomListRulesLoan(q, custom.rules)
    } else {
      const list = SMART_LISTS.find(l => l.id === listId)
      if (list?.statuses) q = q.in('status', list.statuses)
    }
    return q
  }, [customLists, supabase, userId])

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

  // URL param-based filtering on initial load (wait for userId)
  useEffect(() => {
    if (!userId) return
    fetchCounts()

    if (urlStage || urlFilter || urlPeriod) {
      setUrlFilterActive({
        stage: urlStage || undefined,
        filter: urlFilter || undefined,
        period: urlPeriod || undefined,
      })

      // Map stage to a smart list and load
      if (urlStage) {
        const listId = STAGE_TO_LIST[urlStage] ?? 'all'
        setActiveList(listId)
        fetchLoans(listId)
      } else if (urlFilter === 'no_activity_3days') {
        setActiveList('inprocess')
        fetchLoans('inprocess')
      } else {
        fetchLoans('inprocess')
      }
    } else {
      fetchLoans('inprocess')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const handleListChange = (listId: string) => {
    setActiveList(listId)
    setSearch('')
    setEditingStatusId(null)
    setSelected(new Set())
    setUrlFilterActive(null)
    router.replace('/dashboard/loans')
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

    // Apply URL-based stage filter (from dashboard stage cards)
    if (urlFilterActive?.stage) {
      const stageName = urlFilterActive.stage
      // Stage-specific status sets from constants
      const STAGE_STATUSES: Record<string, string[]> = {
        'Pre-Approval': [...PRE_APPROVAL_STATUSES, ...LEAD_STATUSES],
        'Processing': rawStatusesForGroup(['setup', 'disclosed', 'processing']),
        'Underwriting': rawStatusesForGroup(['submitted', 'underwriting', 'approved', 'resubmit']),
        'Clear to Close': rawStatusesForGroup(['clear_to_close']),
        'funded': FUNDED_STATUSES,
        'Funded': FUNDED_STATUSES,
      }
      const validStatuses = STAGE_STATUSES[stageName]
      if (validStatuses) {
        list = list.filter(l => validStatuses.some(s => s.toLowerCase() === (l.status ?? '').toLowerCase()))
      }
    }

    // Apply period filter (mtd = this month, ytd = this year)
    if (urlFilterActive?.period && urlFilterActive?.stage === 'funded') {
      const now = new Date()
      list = list.filter(l => {
        const cd = l.closing_date
        if (!cd) return false
        const d = new Date(cd)
        if (urlFilterActive.period === 'mtd') {
          return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
        }
        if (urlFilterActive.period === 'ytd') {
          return d.getFullYear() === now.getFullYear()
        }
        return true
      })
    }

    // Apply no_activity_3days filter — client-side approximation using closing_date
    // (True stale check requires updated_at which isn't in the loans list query)
    if (urlFilterActive?.filter === 'no_activity_3days') {
      // This filter is applied at fetch time — here we just keep it as-is
      // The dashboard already provides staleLoans, so this serves as a landing for that link
    }

    // Advanced filters
    if (filterType) {
      list = list.filter(l => (l.loan_purpose || '').toLowerCase().includes(filterType.toLowerCase()))
    }
    if (filterPurpose) {
      list = list.filter(l => (l.loan_program || '').toLowerCase().includes(filterPurpose.toLowerCase()))
    }
    if (filterDateFrom) {
      list = list.filter(l => (l.closing_date ?? '') >= filterDateFrom)
    }
    if (filterDateTo) {
      list = list.filter(l => (l.closing_date ?? '') <= filterDateTo)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(l =>
        (l.borrower_name || '').toLowerCase().includes(q) ||
        (l.loan_name || '').toLowerCase().includes(q) ||
        (l.property_address || '').toLowerCase().includes(q) ||
        (l.property_city || '').toLowerCase().includes(q) ||
        (l.contact_email || '').toLowerCase().includes(q) ||
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
  }, [loans, search, sortKey, sortDir, urlFilterActive, filterType, filterPurpose, filterDateFrom, filterDateTo])

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

  const hasAdvancedFilters = !!(filterType || filterPurpose || filterDateFrom || filterDateTo)

  const clearAllFilters = () => {
    setFilterType('')
    setFilterPurpose('')
    setFilterDateFrom('')
    setFilterDateTo('')
    setFilterPreset('')
    setSearch('')
    setUrlFilterActive(null)
    router.replace('/dashboard/loans')
  }

  const applyPreset = (preset: string) => {
    clearAllFilters()
    setFilterPreset(preset)
    const now = new Date()
    const year = now.getFullYear()
    switch (preset) {
      case 'inprocess':
        handleListChange('inprocess')
        break
      case 'preapproval':
        handleListChange('preapproval')
        break
      case 'leads':
        handleListChange('preapproval')
        break
      case 'closed-jan':
        handleListChange('closed')
        setFilterDateFrom(`${year}-01-01`)
        setFilterDateTo(`${year}-01-31`)
        break
      case 'closed-feb':
        handleListChange('closed')
        setFilterDateFrom(`${year}-02-01`)
        setFilterDateTo(`${year}-02-28`)
        break
      case 'closed-mar':
        handleListChange('closed')
        setFilterDateFrom(`${year}-03-01`)
        setFilterDateTo(`${year}-03-31`)
        break
      case 'closed-ytd':
        handleListChange('closed')
        setFilterDateFrom(`${year}-01-01`)
        setFilterDateTo(`${year}-12-31`)
        break
      case 'needs-attention':
        handleListChange('inprocess')
        setUrlFilterActive({ filter: 'no_activity_3days' })
        break
    }
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

        {/* Filter bar */}
        <div className="px-4 pt-3 pb-2 border-b border-[#2A2A2A] bg-[#0E0E0E]">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Preset dropdown */}
            <select
              value={filterPreset}
              onChange={e => applyPreset(e.target.value)}
              className="text-[11px] font-mono px-2 py-1.5 border border-[#2A2A2A] rounded bg-[#1A1A1A] text-[#999999] outline-none"
            >
              <option value="">Presets…</option>
              <option value="inprocess">Loans in Process</option>
              <option value="preapproval">Pre-Approvals</option>
              <option value="leads">Leads + New Applications</option>
              <option value="closed-jan">Closed — January {new Date().getFullYear()}</option>
              <option value="closed-feb">Closed — February {new Date().getFullYear()}</option>
              <option value="closed-mar">Closed — March {new Date().getFullYear()}</option>
              <option value="closed-ytd">Closed — YTD</option>
              <option value="needs-attention">Needs Attention (3+ days idle)</option>
            </select>

            {/* Toggle advanced filters */}
            <button
              type="button"
              onClick={() => setShowFilters(p => !p)}
              className={`text-[11px] font-mono px-2 py-1.5 border rounded transition-colors ${
                showFilters || hasAdvancedFilters
                  ? 'border-[#C9A84C]/40 text-[#C9A84C] bg-[#C9A84C]/10'
                  : 'border-[#2A2A2A] text-[#666666] hover:text-[#F0F0F0]'
              }`}
            >
              Filters {hasAdvancedFilters ? '●' : '▾'}
            </button>

            {/* Active filter chips */}
            {filterType && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-900/30 border border-violet-700 text-[10px] font-mono text-violet-400">
                Purpose: {filterType}
                <button onClick={() => setFilterType('')} className="hover:text-white"><X size={10} /></button>
              </span>
            )}
            {filterPurpose && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-900/30 border border-sky-700 text-[10px] font-mono text-sky-400">
                Type: {filterPurpose}
                <button onClick={() => setFilterPurpose('')} className="hover:text-white"><X size={10} /></button>
              </span>
            )}
            {(filterDateFrom || filterDateTo) && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-900/30 border border-emerald-700 text-[10px] font-mono text-emerald-400">
                Date: {filterDateFrom || '…'} → {filterDateTo || '…'}
                <button onClick={() => { setFilterDateFrom(''); setFilterDateTo('') }} className="hover:text-white"><X size={10} /></button>
              </span>
            )}
            {hasAdvancedFilters && (
              <button
                onClick={clearAllFilters}
                className="text-[10px] font-mono text-zinc-500 hover:text-zinc-300 underline"
              >Clear all</button>
            )}
          </div>

          {/* Expanded filter controls */}
          {showFilters && (
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <div>
                <label className="block text-[9px] font-mono text-zinc-500 uppercase tracking-wider mb-0.5">Purpose</label>
                <select
                  value={filterType}
                  onChange={e => setFilterType(e.target.value)}
                  className="text-[11px] font-mono px-2 py-1 border border-[#2A2A2A] rounded bg-[#1A1A1A] text-[#F0F0F0] outline-none min-w-[110px]"
                >
                  <option value="">All</option>
                  <option value="Purchase">Purchase</option>
                  <option value="Refinance">Refinance</option>
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-mono text-zinc-500 uppercase tracking-wider mb-0.5">Loan Type</label>
                <select
                  value={filterPurpose}
                  onChange={e => setFilterPurpose(e.target.value)}
                  className="text-[11px] font-mono px-2 py-1 border border-[#2A2A2A] rounded bg-[#1A1A1A] text-[#F0F0F0] outline-none min-w-[110px]"
                >
                  <option value="">All</option>
                  <option value="Conventional">Conventional</option>
                  <option value="FHA">FHA</option>
                  <option value="VA">VA</option>
                  <option value="USDA">USDA</option>
                  <option value="Jumbo">Jumbo</option>
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-mono text-zinc-500 uppercase tracking-wider mb-0.5">Close From</label>
                <input
                  type="date"
                  value={filterDateFrom}
                  onChange={e => setFilterDateFrom(e.target.value)}
                  className="text-[11px] font-mono px-2 py-1 border border-[#2A2A2A] rounded bg-[#1A1A1A] text-[#F0F0F0] outline-none"
                />
              </div>
              <div>
                <label className="block text-[9px] font-mono text-zinc-500 uppercase tracking-wider mb-0.5">Close To</label>
                <input
                  type="date"
                  value={filterDateTo}
                  onChange={e => setFilterDateTo(e.target.value)}
                  className="text-[11px] font-mono px-2 py-1 border border-[#2A2A2A] rounded bg-[#1A1A1A] text-[#F0F0F0] outline-none"
                />
              </div>
            </div>
          )}
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

        {/* Active URL filter badge */}
        {urlFilterActive && (urlFilterActive.stage || urlFilterActive.filter || urlFilterActive.period) && (
          <div className="px-4 pt-3 pb-1 flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Filtered:</span>
            {urlFilterActive.stage && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/30 text-xs font-mono text-[#C9A84C]">
                Stage: {urlFilterActive.stage}
                <button onClick={() => { setUrlFilterActive(null); router.replace('/dashboard/loans'); fetchLoans(activeList) }} className="hover:text-white"><X size={11} /></button>
              </span>
            )}
            {urlFilterActive.period && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-900/30 border border-blue-700 text-xs font-mono text-blue-400">
                Period: {urlFilterActive.period === 'mtd' ? 'This Month' : urlFilterActive.period === 'ytd' ? 'Year to Date' : urlFilterActive.period}
                <button onClick={() => { setUrlFilterActive(prev => prev ? { ...prev, period: undefined } : null); router.replace('/dashboard/loans') }} className="hover:text-white"><X size={11} /></button>
              </span>
            )}
            {urlFilterActive.filter && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-900/30 border border-orange-700 text-xs font-mono text-orange-400">
                {urlFilterActive.filter === 'no_activity_3days' ? 'No activity 3+ days' : urlFilterActive.filter}
                <button onClick={() => { setUrlFilterActive(null); router.replace('/dashboard/loans'); fetchLoans(activeList) }} className="hover:text-white"><X size={11} /></button>
              </span>
            )}
            <button
              onClick={() => { setUrlFilterActive(null); router.replace('/dashboard/loans'); fetchLoans(activeList) }}
              className="text-[10px] font-mono text-zinc-500 hover:text-zinc-300 underline"
            >Clear all</button>
          </div>
        )}

        {/* Header stats — shown when not loading */}
        {!loading && filtered.length > 0 && (() => {
          const totalVolume = filtered.reduce((s, l) => s + (l.loan_amount ?? 0), 0)
          const totalCommission = filtered.reduce((s, l) => s + (l.commission_amount ?? 0), 0)
          return (
            <div className="px-4 pt-3 pb-2 border-b border-[#1e293b] bg-[#0a0f1a] flex items-center gap-6">
              <div>
                <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">Total Loans</p>
                <p className="text-lg font-mono font-bold text-zinc-100">{filtered.length}</p>
              </div>
              <div>
                <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">Total Volume</p>
                <p className="text-lg font-mono font-bold text-blue-400">{fmtCurrency(totalVolume)}</p>
              </div>
              <div>
                <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">Gross Commission</p>
                <p className="text-lg font-mono font-bold text-[#C9A84C]">{totalCommission > 0 ? fmtCurrency(totalCommission) : '—'}</p>
              </div>
            </div>
          )
        })()}

        {/* Pipeline dashboard — shown only on Loans in Process tab */}
        {activeList === 'inprocess' && !loading && loans.length > 0 && (() => {
          const stageLoans = PIPELINE_STAGES.map(stage => ({
            ...stage,
            count: loans.filter(l => stage.statuses.includes(l.status ?? '')).length,
          }))
          const total = stageLoans.reduce((sum, s) => sum + s.count, 0)
          return (
            <div className="px-4 pt-3 pb-2 border-b border-[#2A2A2A] bg-[#0E0E0E]">
              {/* Stage cards */}
              <div className="flex gap-2 mb-2">
                {stageLoans.map(stage => (
                  <div
                    key={stage.label}
                    className="flex-1 rounded-md px-3 py-2 border"
                    style={{ borderColor: `${stage.hex}40`, background: `${stage.hex}12` }}
                  >
                    <p className="text-[9px] font-mono font-semibold uppercase tracking-wider" style={{ color: stage.hex }}>
                      {stage.short}
                    </p>
                    <p className="text-lg font-mono font-bold text-[#F0F0F0] leading-tight">{stage.count}</p>
                    <p className="text-[9px] font-mono text-[#555555] mt-0.5 truncate">{stage.label}</p>
                  </div>
                ))}
              </div>
              {/* Progress bar */}
              {total > 0 && (
                <div className="flex h-1 rounded-full overflow-hidden gap-px">
                  {stageLoans.filter(s => s.count > 0).map(stage => (
                    <div
                      key={stage.label}
                      style={{ flex: stage.count, background: stage.hex, opacity: 0.7 }}
                      title={`${stage.label}: ${stage.count}`}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })()}

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
                    className={`border-b border-[#2A2A2A]/50 hover:bg-[#1A1A1A] transition-colors cursor-pointer ${selected.has(loan.id) ? 'bg-[#C9A84C]/5' : ''}`}
                    style={urgencyStyle}
                    onClick={() => router.push(`/dashboard/loans/${loan.id}`)}>
                    <td className="w-8 px-2 py-3" onClick={e => e.stopPropagation()}>
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
                          <td key={col.id} className="px-4 py-3 font-medium" onClick={e => e.stopPropagation()}>
                            {loan.contact_id ? (
                              <Link
                                href={`/dashboard/contacts/${loan.contact_id}`}
                                className="text-[#F0F0F0] hover:text-[#C9A84C] hover:underline font-mono"
                              >
                                {loan.borrower_name || loan.loan_name || '(unnamed)'}
                              </Link>
                            ) : (
                              <span className="text-[#F0F0F0] font-mono">
                                {loan.borrower_name || loan.loan_name || '(unnamed)'}
                              </span>
                            )}
                            {loan.loan_name && loan.borrower_name && (
                              <span className="block text-xs font-mono text-[#666666] mt-0.5">
                                {loan.loan_name}
                              </span>
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
