'use client'

import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { Search, AlertCircle, Trash2, X, Phone, Mail, MessageSquare, GripVertical } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { updateLastTouch } from '@/lib/updateLastTouch'
import {
  IN_PROCESS_STATUSES, FUNDED_STATUSES, PRE_APPROVAL_STATUSES,
  LEAD_STATUSES, NEW_APP_STATUSES,
  PIPELINE_STAGES as PIPELINE_STAGE_DEFS,
  LOAN_STATUS_OPTIONS as STAGE_OPTIONS,
  rawStatusesForGroup,
  statusHex,
} from '@/lib/constants/loan-stages'

// ── Types ────────────────────────────────────────────────────────────────────

interface Loan {
  id: string
  loan_name: string | null
  loan_number: string | null
  borrower_name: string | null
  borrower_first_name: string | null
  borrower_last_name: string | null
  borrower_email: string | null
  borrower_phone: string | null
  status: string | null
  loan_amount: number | null
  loan_purpose: string | null
  loan_program: string | null
  interest_rate: number | null
  lender: string | null
  lender_name: string | null
  closing_date: string | null
  estimated_closing_date: string | null
  rate_lock_expiration: string | null
  property_address: string | null
  property_city: string | null
  property_state: string | null
  contact_id: string | null
  contact_email?: string | null
  contact_phone?: string | null
  commission_amount?: number | null
  purchase_price?: number | null
  doc_count?: number
  last_milestone_at?: string | null
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

function fmtPhone(phone: string | null | undefined): string {
  if (!phone) return '—'
  const digits = String(phone).replace(/\D/g, '')
  if (digits.length === 11 && digits[0] === '1') {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  return String(phone).trim() || '—'
}

function mailtoHref(email: string | null | undefined): string | null {
  if (!email || !String(email).trim() || !String(email).includes('@')) return null
  return `mailto:${String(email).trim()}`
}

function fmtRelativeDate(s: string | null | undefined): string {
  if (!s) return '—'
  const diffDays = Math.floor((Date.now() - new Date(s).getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'today'
  if (diffDays === 1) return '1 day ago'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`
  return `${Math.floor(diffDays / 365)}y ago`
}

function borrowerDisplayName(loan: Pick<Loan, 'borrower_first_name' | 'borrower_last_name' | 'borrower_name' | 'loan_name'>): string {
  const full = [loan.borrower_first_name, loan.borrower_last_name].filter(Boolean).join(' ')
  return full || loan.borrower_name || loan.loan_name || '(unnamed)'
}

/** Best closing date: prefer estimated_closing_date for display, fall back to closing_date */
function effectiveClosingDate(loan: Pick<Loan, 'estimated_closing_date' | 'closing_date'>): string | null {
  return loan.estimated_closing_date || loan.closing_date
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

type SortKey = 'borrower_name' | 'loan_amount' | 'closing_date' | 'status' | 'interest_rate' | 'commission_amount' | 'purchase_price'
type SortDir = 'asc' | 'desc'

// ── Column definitions (toggleable) ───────────────────────────────────────────
const LOAN_COLUMNS: { id: string; label: string; key: SortKey | null }[] = [
  { id: 'borrower_name',        label: 'Borrower',            key: 'borrower_name' },
  { id: 'loan_name',            label: 'Loan Name',           key: null },
  { id: 'loan_amount',          label: 'Amount',              key: 'loan_amount' },
  { id: 'purchase_price',       label: 'Purchase Price',      key: 'purchase_price' },
  { id: 'status',               label: 'Status',              key: 'status' },
  { id: 'loan_purpose',         label: 'Purpose',             key: null },
  { id: 'loan_program',         label: 'Program',             key: null },
  { id: 'closing_date',         label: 'Closing',             key: 'closing_date' },
  { id: 'interest_rate',        label: 'Rate',                key: 'interest_rate' },
  { id: 'lender',               label: 'Lender',              key: null },
  { id: 'rate_lock_expiration', label: 'Lock Exp',            key: null },
  { id: 'loan_number',          label: 'Loan #',              key: null },
  { id: 'location',             label: 'Location',            key: null },
  { id: 'property_state',       label: 'State',               key: null },
  { id: 'contact_email',        label: 'Email',               key: null },
  { id: 'contact_phone',        label: 'Phone',               key: null },
  { id: 'borrower_email',       label: 'Borrower Email',      key: null },
  { id: 'borrower_phone',       label: 'Borrower Phone',      key: null },
  { id: 'commission_amount',    label: 'Commission',          key: 'commission_amount' },
  { id: 'last_milestone',      label: 'Last Milestone',       key: null },
  { id: 'actions',             label: '',                     key: null },
]

const DEFAULT_LOAN_COLUMNS = ['borrower_name', 'loan_amount', 'status', 'closing_date', 'interest_rate', 'location', 'actions']
const LS_LOAN_COLUMNS_KEY = 'loanos_loans_columns_v1'
const LS_LOAN_COL_ORDER_KEY = 'loanos_loans_col_order_v1'
const LS_CUSTOM_LISTS_KEY = 'loanos_custom_lists_v1'
const LS_LOAN_VIEW_KEY = 'loanos_loans_view_v1'
// IDs of non-borrower (draggable) columns in their default order
const DRAGGABLE_LOAN_COL_IDS = LOAN_COLUMNS.filter(c => c.id !== 'borrower_name').map(c => c.id)

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

function applyCustomListRulesLoan(query: any, rules: CustomListRule[]): any { // eslint-disable-line @typescript-eslint/no-explicit-any
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
    const loan = rest as unknown as Loan & { lender?: string | null; lender_name?: string | null }
    return {
      ...loan,
      lender: loan.lender || loan.lender_name || null,
      contact_email: (contact as { email?: string } | null)?.email ?? null,
      contact_phone: (contact as { phone?: string } | null)?.phone ?? null,
      last_milestone_at: null,
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

// ── Sortable column header (for @dnd-kit drag reorder) ────────────────────────
function SortableLoanColumnHeader({
  col, sortKey, sortDir, onSort,
}: {
  col: { id: string; label: string; key: SortKey | null }
  sortKey: SortKey
  sortDir: SortDir
  onSort: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: col.id })
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : col.key ? 'pointer' : 'default',
  }

  return (
    <th
      ref={setNodeRef}
      style={style}
      onClick={onSort}
      className={`text-left px-4 py-2.5 text-xs font-mono font-semibold uppercase tracking-wide select-none bg-[var(--surface2)] ${
        col.key === sortKey ? 'text-[#C9A84C]' : 'text-[var(--muted)]'
      } ${col.key ? 'hover:text-[var(--fg)]' : ''}`}
    >
      <div className="flex items-center gap-1">
        <span
          {...attributes}
          {...listeners}
          onClick={e => e.stopPropagation()}
          style={{ cursor: 'grab', color: 'var(--muted, #666)', opacity: 0, display: 'flex', alignItems: 'center', padding: '0 2px' }}
          className="col-drag-handle"
        >
          <GripVertical size={12} />
        </span>
        <span className="flex items-center gap-0.5">
          {col.label}
          {col.key && col.key === sortKey && (sortDir === 'asc' ? ' ▲' : ' ▼')}
        </span>
      </div>
    </th>
  )
}

export default function LoansPage() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const router = useRouter()
  const urlStage = searchParams.get('stage')
  const urlFilter = searchParams.get('filter')
  const urlPeriod = searchParams.get('period')

  const [loans, setLoans] = useState<Loan[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [activeList, setActiveList] = useState('inprocess')
  const [urlFilterActive, setUrlFilterActive] = useState<{ stage?: string; filter?: string; period?: string } | null>(null)
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('closing_date')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [visibleColumns, setVisibleColumns] = useState<string[]>(DEFAULT_LOAN_COLUMNS)
  const [columnOrder, setColumnOrder] = useState<string[]>(DRAGGABLE_LOAN_COL_IDS)
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
  const [filterStatuses, setFilterStatuses] = useState<string[]>([])
  const [filterPurpose, setFilterPurpose] = useState<string>('')   // Purchase, Refinance, HELOC
  const [filterProgram, setFilterProgram] = useState<string>('')   // FHA, Conventional, etc.
  const [filterLender, setFilterLender] = useState<string>('')
  const [filterState, setFilterState] = useState<string>('')
  const [filterRateMin, setFilterRateMin] = useState<string>('')   // interest rate >
  const [filterDateFrom, setFilterDateFrom] = useState<string>('')
  const [filterDateTo, setFilterDateTo] = useState<string>('')
  const [filterPreset, setFilterPreset] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)
  const [colSearch, setColSearch] = useState('')
  const [deletingLoanId, setDeletingLoanId] = useState<string | null>(null)
  const [distinctLenders, setDistinctLenders] = useState<string[]>([])
  const [distinctStatuses, setDistinctStatuses] = useState<string[]>([])
  const [loadingMore, setLoadingMore] = useState(false)
  const loansOffsetRef = useRef(0)
  const [editingCommissionId, setEditingCommissionId] = useState<string | null>(null)
  const [editingCommissionValue, setEditingCommissionValue] = useState<string>('')
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table')
  const dndSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  // Fetch distinct status + lender values for filter dropdowns
  useEffect(() => {
    supabase.from('loans').select('status').then(({ data }) => {
      if (data) {
        const vals = [...new Set(data.map(r => r.status).filter(Boolean) as string[])].sort()
        setDistinctStatuses(vals)
      }
    })
    supabase.from('loans').select('lender, lender_name').then(({ data }) => {
      if (data) {
        const vals = [...new Set(
          data.flatMap(r => [r.lender, r.lender_name]).filter(Boolean) as string[]
        )].sort()
        setDistinctLenders(vals)
      }
    })
  }, [supabase])

  // Restore column visibility + order from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_LOAN_COLUMNS_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as string[]
        if (Array.isArray(parsed) && parsed.length > 0)
          setVisibleColumns(parsed.filter(id => LOAN_COLUMNS.some(c => c.id === id)))
      }
    } catch {}
    try {
      const storedOrder = localStorage.getItem(LS_LOAN_COL_ORDER_KEY)
      if (storedOrder) {
        const parsed: string[] = JSON.parse(storedOrder)
        // Merge: keep stored order, add any new columns at the end
        const merged = [
          ...parsed.filter(id => DRAGGABLE_LOAN_COL_IDS.includes(id)),
          ...DRAGGABLE_LOAN_COL_IDS.filter(id => !parsed.includes(id)),
        ]
        setColumnOrder(merged)
      }
    } catch {}
  }, [])

  // Restore view mode from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_LOAN_VIEW_KEY)
      if (stored === 'kanban' || stored === 'table') setViewMode(stored)
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

  // ── Column reorder handler ────────────────────────────────────────────────
  function handleColDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setColumnOrder(prev => {
      const oldIdx = prev.indexOf(active.id as string)
      const newIdx = prev.indexOf(over.id as string)
      const next = arrayMove(prev, oldIdx, newIdx)
      localStorage.setItem(LS_LOAN_COL_ORDER_KEY, JSON.stringify(next))
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
      .select('id, loan_name, loan_number, borrower_name, borrower_first_name, borrower_last_name, borrower_email, borrower_phone, status, loan_amount, purchase_price, loan_purpose, loan_program, interest_rate, lender, lender_name, closing_date, estimated_closing_date, rate_lock_expiration, property_address, property_city, property_state, contact_id, commission_amount, contacts!contact_id(email, phone)')
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

  const handleCommissionChange = useCallback(async (loanId: string, rawValue: string) => {
    const value = rawValue.trim()
    const amount = value ? Number(value.replace(/[^0-9.]/g, '')) : 0
    if (Number.isNaN(amount)) return
    setEditingCommissionId(null)
    setEditingCommissionValue('')
    const { error } = await supabase.from('loans').update({ commission_amount: amount }).eq('id', loanId)
    if (!error) {
      setLoans(prev => prev.map(l => l.id === loanId ? { ...l, commission_amount: amount } : l))
      await fetchCounts()
    }
  }, [supabase, fetchCounts])

  // URL param-based filtering on initial load
  useEffect(() => {
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
  }, [])

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
    const loan = loans.find(l => l.id === loanId)
    const { error } = await supabase.from('loans').update({ status: newStatus }).eq('id', loanId)
    if (!error) {
      setLoans(prev => prev.map(l => l.id === loanId ? { ...l, status: newStatus } : l))
      supabase.from('activity_log').insert({ action: 'loan.status_changed', entity_type: 'loan', loan_id: loanId, metadata: { to: newStatus } })
      if (loan?.contact_id) {
        updateLastTouch(supabase, loan.contact_id, 'loan_stage_changed', `Loan moved to ${newStatus}`, loanId)
      }
      await fetchCounts()
      if (!activeList.startsWith('custom-')) fetchLoans(activeList)
    }
  }, [supabase, activeList, loans, fetchCounts, fetchLoans])

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

  // ── Single loan delete ────────────────────────────────────────────────
  const handleDeleteLoan = useCallback(async (loanId: string) => {
    const { error } = await supabase.from('loans').delete().eq('id', loanId)
    if (!error) {
      setLoans(prev => prev.filter(l => l.id !== loanId))
      setDeletingLoanId(null)
      await fetchCounts()
    }
  }, [supabase, fetchCounts])

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
    // NOTE: Parse year/month from the date string directly to avoid timezone bugs.
    // new Date('2026-04-01') is parsed as UTC midnight, which is March 31 in CT.
    if (urlFilterActive?.period && urlFilterActive?.stage === 'funded') {
      const now = new Date()
      const nowYear = now.getFullYear()
      const nowMonth = now.getMonth() + 1 // 1-indexed to match date string
      list = list.filter(l => {
        const cd = l.closing_date
        if (!cd) return false
        const [y, m] = cd.split('-').map(Number)
        if (urlFilterActive.period === 'mtd') {
          return y === nowYear && m === nowMonth
        }
        if (urlFilterActive.period === 'ytd') {
          return y === nowYear
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
    if (filterStatuses.length > 0) {
      list = list.filter(l => filterStatuses.includes(l.status ?? ''))
    }
    if (filterPurpose) {
      list = list.filter(l => (l.loan_purpose || '').toLowerCase().includes(filterPurpose.toLowerCase()))
    }
    if (filterProgram) {
      list = list.filter(l => (l.loan_program || '').toLowerCase().includes(filterProgram.toLowerCase()))
    }
    if (filterLender) {
      list = list.filter(l => (l.lender || '').toLowerCase().includes(filterLender.toLowerCase()))
    }
    if (filterState) {
      list = list.filter(l => (l.property_state || '').toLowerCase().includes(filterState.toLowerCase()))
    }
    if (filterRateMin) {
      const minRate = parseFloat(filterRateMin)
      if (!isNaN(minRate)) list = list.filter(l => l.interest_rate != null && l.interest_rate > minRate)
    }
    if (filterDateFrom) {
      list = list.filter(l => (effectiveClosingDate(l) ?? '') >= filterDateFrom)
    }
    if (filterDateTo) {
      list = list.filter(l => (effectiveClosingDate(l) ?? '') <= filterDateTo)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(l =>
        borrowerDisplayName(l).toLowerCase().includes(q) ||
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
      if (sortKey === 'purchase_price') {
        return mul * ((a.purchase_price ?? 0) - (b.purchase_price ?? 0))
      }
      if (sortKey === 'interest_rate') {
        return mul * ((a.interest_rate ?? 0) - (b.interest_rate ?? 0))
      }
      if (sortKey === 'commission_amount') {
        return mul * ((a.commission_amount ?? 0) - (b.commission_amount ?? 0))
      }
      if (sortKey === 'closing_date') {
        const av = effectiveClosingDate(a) ?? ''
        const bv = effectiveClosingDate(b) ?? ''
        return mul * (av < bv ? -1 : av > bv ? 1 : 0)
      }
      if (sortKey === 'borrower_name') {
        const av = borrowerDisplayName(a).toLowerCase()
        const bv = borrowerDisplayName(b).toLowerCase()
        return mul * (av < bv ? -1 : av > bv ? 1 : 0)
      }
      const av = (a[sortKey] || '').toLowerCase()
      const bv = (b[sortKey] || '').toLowerCase()
      return mul * (av < bv ? -1 : av > bv ? 1 : 0)
    })
  }, [loans, search, sortKey, sortDir, urlFilterActive, filterStatuses, filterPurpose, filterProgram, filterLender, filterState, filterRateMin, filterDateFrom, filterDateTo])

  // ── Kanban columns (view mode = 'kanban') ─────────────────────────────
  const kanbanColumns = useMemo(() => {
    if (viewMode !== 'kanban') return []
    if (activeList === 'inprocess') {
      // Use pipeline stage ordering for the inprocess list
      return PIPELINE_STAGES.map(stage => ({
        key: stage.label,
        label: stage.label,
        hex: stage.hex,
        loans: filtered.filter(l => stage.statuses.includes(l.status ?? '')),
      }))
    }
    // For other lists: group by status, ordered by pipeline stage order then alpha
    const stageOrder = PIPELINE_STAGES.flatMap(s => s.statuses)
    const statuses = [...new Set(filtered.map(l => l.status ?? '(No Status)'))]
      .sort((a, b) => {
        const ai = stageOrder.indexOf(a)
        const bi = stageOrder.indexOf(b)
        if (ai >= 0 && bi >= 0) return ai - bi
        if (ai >= 0) return -1
        if (bi >= 0) return 1
        return a.localeCompare(b)
      })
    return statuses.map(status => ({
      key: status,
      label: status,
      hex: statusHex(status),
      loans: filtered.filter(l => (l.status ?? '(No Status)') === status),
    }))
  }, [viewMode, activeList, filtered])

  const toggleViewMode = (mode: 'table' | 'kanban') => {
    setViewMode(mode)
    try { localStorage.setItem(LS_LOAN_VIEW_KEY, mode) } catch {}
  }

  // ── Property location ──────────────────────────────────────────────────
  const loanLocation = (l: Loan) => {
    const parts = [l.property_city, l.property_state].filter(Boolean)
    return parts.length ? parts.join(', ') : l.property_address || '—'
  }

  const hasAdvancedFilters = !!(filterStatuses.length || filterPurpose || filterProgram || filterLender || filterState || filterRateMin || filterDateFrom || filterDateTo)

  const clearAllFilters = () => {
    setFilterStatuses([])
    setFilterPurpose('')
    setFilterProgram('')
    setFilterLender('')
    setFilterState('')
    setFilterRateMin('')
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

  // Borrower is always pinned first; other visible columns follow columnOrder
  const borrowerColDef = LOAN_COLUMNS.find(c => c.id === 'borrower_name')!
  const draggableColDefs = columnOrder
    .map(id => LOAN_COLUMNS.find(c => c.id === id))
    .filter((c): c is typeof LOAN_COLUMNS[number] => !!c && c.id !== 'borrower_name' && visibleColumns.includes(c.id))
  const colDefs = [borrowerColDef, ...draggableColDefs].filter(c => visibleColumns.includes(c.id))
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
    <div className="flex min-h-screen bg-[var(--bg)]">
      {/* Sidebar */}
      <aside
        className="shrink-0 border-r border-[var(--input)] bg-[var(--bg)] flex flex-col transition-[width] duration-200"
        style={{ width: sidebarCollapsed ? 52 : 200 }}
      >
        <div className="flex items-center justify-between px-2 py-3 min-h-[40px]">
          {!sidebarCollapsed && (
            <p className="text-[9px] font-mono font-semibold text-[var(--muted)] uppercase tracking-wider">Views</p>
          )}
          <button
            type="button"
            onClick={() => setSidebarCollapsedUser(prev => (prev === null ? !sidebarCollapsed : !prev))}
            className="text-[var(--muted)] text-xs p-1 hover:text-[var(--fg)] transition-colors"
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
                    : 'text-[#999999] hover:bg-[var(--card)] hover:text-[var(--fg)]'
                }`}
                title={sidebarCollapsed ? list.label : undefined}
              >
                {sidebarCollapsed ? (
                  <span className="font-semibold text-xs">{initial}</span>
                ) : (
                  <span className="truncate">{list.label}</span>
                )}
                <span className={`text-[11px] rounded-full px-1 py-0 shrink-0 ml-1 ${
                  activeList === list.id ? 'bg-[#C9A84C]/20 text-[#C9A84C]' : 'bg-[var(--input)] text-[var(--muted)]'
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
                      : 'text-[#999999] hover:bg-[var(--card)] hover:text-[var(--fg)]'
                  }`}
                  title={sidebarCollapsed ? cl.name : undefined}
                >
                  {sidebarCollapsed ? (
                    <span className="font-semibold text-xs">{initial}</span>
                  ) : (
                    <span className="truncate">{cl.name}</span>
                  )}
                  <span className={`text-[11px] rounded-full px-1 py-0 shrink-0 ml-1 ${
                    activeList === cl.id ? 'bg-[#C9A84C]/20 text-[#C9A84C]' : 'bg-[var(--input)] text-[var(--muted)]'
                  }`}>
                    {counts[cl.id] ?? '…'}
                  </span>
                </button>
                {!sidebarCollapsed && (
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); setDeleteListId(cl.id) }}
                    className="text-[var(--muted)] hover:text-[var(--fg)] p-0.5 text-xs transition-colors"
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
            className="w-full mt-2 text-[11px] font-mono text-[#C9A84C] border border-dashed border-[#C9A84C]/40 rounded px-2 py-1.5 hover:bg-[#C9A84C]/10 transition-colors"
          >
            + New List
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-[var(--input)]">
          <div>
            <h1 className="text-lg font-mono font-semibold text-[var(--fg)]">
              {activeListLabel}
            </h1>
            <p className="text-xs font-mono text-[var(--muted)] mt-0.5">
              {filtered.length} {filtered.length === 1 ? 'loan' : 'loans'}
              {search && ` matching "${search}"`}
            </p>
          </div>
          {/* Search */}
          <div className="relative w-64">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
            <input
              type="text"
              placeholder="Search loans…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-sm font-mono border border-[var(--input)] rounded-lg bg-[var(--card)] text-[var(--fg)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[#C9A84C] focus:border-transparent"
            />
          </div>
        </div>

        {/* Unified control + stats bar */}
        <div className="px-4 py-2 border-b border-input bg-card">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <select
                value={LOAN_QUICK_FILTERS.some(f => f.id === activeList) ? activeList : 'all'}
                onChange={e => handleListChange(e.target.value)}
                className="text-xs font-mono px-2.5 py-1.5 border border-[#C9A84C]/40 rounded bg-[var(--secondary)] text-[#C9A84C] cursor-pointer outline-none"
              >
                {LOAN_QUICK_FILTERS.map(f => (
                  <option key={f.id} value={f.id}>{f.label}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowFilters(p => !p)}
                className={`text-xs font-mono px-2.5 py-1.5 border rounded transition-colors ${
                  showFilters || hasAdvancedFilters
                    ? 'border-[#C9A84C]/40 text-[#C9A84C] bg-[#C9A84C]/10'
                    : 'border-[var(--input)] text-[var(--muted)] hover:text-[var(--fg)] hover:bg-[var(--secondary)]'
                }`}
              >
                Filters {hasAdvancedFilters ? '●' : '▾'}
              </button>
            </div>

            <div className="flex-1 min-w-0 flex items-center justify-center">
              {!loading && filtered.length > 0 && (() => {
                const totalVolume = filtered.reduce((s, l) => s + (l.loan_amount ?? 0), 0)
                const totalCommission = filtered.reduce((s, l) => s + (l.commission_amount ?? 0), 0)
                const closingThisWeek = filtered.filter(l => {
                  const d = daysUntilClose(effectiveClosingDate(l))
                  return d !== null && d >= 0 && d <= 7
                }).length
                return (
                  <div className="flex items-center gap-3 text-xs font-mono whitespace-nowrap">
                    <span className="text-[var(--muted)]">Total Loans <span className="text-[#F3F4F6] font-semibold">{filtered.length}</span></span>
                    <span className="text-[#374151]">|</span>
                    <span className="text-[var(--muted)]">Total Volume <span className="text-blue-400 font-semibold">{fmtCurrency(totalVolume)}</span></span>
                    <span className="text-[#374151]">|</span>
                    <span className="text-[var(--muted)]">Gross Commission <span className="text-[#C9A84C] font-semibold">{totalCommission > 0 ? fmtCurrency(totalCommission) : '—'}</span></span>
                    <span className="text-[#374151]">|</span>
                    <span className="text-[var(--muted)]">Closing This Week <span className={`font-semibold ${closingThisWeek > 0 ? 'text-amber-400' : 'text-[#F3F4F6]'}`}>{closingThisWeek}</span></span>
                  </div>
                )
              })()}
            </div>

            {/* View toggle: Table | Kanban */}
            <div className="flex items-center border border-[var(--input)] rounded overflow-hidden shrink-0">
              <button
                type="button"
                onClick={() => toggleViewMode('table')}
                title="Table view"
                className={`px-2.5 py-1.5 text-xs font-mono transition-colors ${viewMode === 'table' ? 'bg-[#C9A84C]/15 text-[#C9A84C]' : 'text-[var(--muted)] hover:text-[var(--fg)] hover:bg-[var(--secondary)]'}`}
              >
                ≡ List
              </button>
              <div className="w-px h-4 bg-[var(--input)]" />
              <button
                type="button"
                onClick={() => toggleViewMode('kanban')}
                title="Kanban view"
                className={`px-2.5 py-1.5 text-xs font-mono transition-colors ${viewMode === 'kanban' ? 'bg-[#C9A84C]/15 text-[#C9A84C]' : 'text-[var(--muted)] hover:text-[var(--fg)] hover:bg-[var(--secondary)]'}`}
              >
                ⊞ Board
              </button>
            </div>

            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setShowColPicker(p => !p)}
                className="text-xs font-mono font-medium text-[var(--muted)] px-2.5 py-1.5 border border-[var(--input)] rounded hover:bg-[var(--secondary)] hover:text-[var(--fg)] transition-colors"
              >
                COLUMNS ▾
              </button>
              {showColPicker && (
                <div
                  role="listbox"
                  className="absolute right-0 top-full mt-1 z-[100] w-[220px] bg-[var(--card)] border border-[var(--input)] rounded-lg shadow-xl"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="p-2 border-b border-[var(--input)]">
                    <input
                      autoFocus
                      type="text"
                      placeholder="Search fields…"
                      value={colSearch}
                      onChange={e => setColSearch(e.target.value)}
                      className="w-full px-2 py-1 text-xs font-mono bg-[var(--bg)] border border-[var(--input)] rounded text-[var(--fg)] placeholder:text-[#555] outline-none focus:ring-1 focus:ring-[#C9A84C]"
                    />
                  </div>
                  <div className="max-h-[280px] overflow-y-auto py-1">
                    {LOAN_COLUMNS.filter(col =>
                      !colSearch || col.label.toLowerCase().includes(colSearch.toLowerCase())
                    ).map(col => (
                      <label
                        key={col.id}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono text-[var(--fg)] cursor-pointer hover:bg-[var(--input)]"
                      >
                        <input
                          type="checkbox"
                          checked={visibleColumns.includes(col.id)}
                          onChange={() => toggleColumn(col.id)}
                          className="rounded cursor-pointer accent-[#C9A84C]"
                        />
                        {col.label}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {(hasAdvancedFilters || (urlFilterActive && (urlFilterActive.stage || urlFilterActive.filter || urlFilterActive.period))) && (
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              {/* Active filter chips */}
            {filterStatuses.length > 0 && filterStatuses.map(s => (
              <span key={s} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-900/30 border border-violet-700 text-[11px] font-mono text-violet-400">
                {s}
                <button onClick={() => setFilterStatuses(prev => prev.filter(x => x !== s))} className="hover:text-white"><X size={10} /></button>
              </span>
            ))}
            {filterPurpose && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-900/30 border border-sky-700 text-[11px] font-mono text-sky-400">
                Purpose: {filterPurpose}
                <button onClick={() => setFilterPurpose('')} className="hover:text-white"><X size={10} /></button>
              </span>
            )}
            {filterProgram && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-900/30 border border-indigo-700 text-[11px] font-mono text-indigo-400">
                Program: {filterProgram}
                <button onClick={() => setFilterProgram('')} className="hover:text-white"><X size={10} /></button>
              </span>
            )}
            {filterLender && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-900/30 border border-amber-700 text-[11px] font-mono text-amber-400">
                Lender: {filterLender}
                <button onClick={() => setFilterLender('')} className="hover:text-white"><X size={10} /></button>
              </span>
            )}
            {filterState && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-900/30 border border-teal-700 text-[11px] font-mono text-teal-400">
                State: {filterState}
                <button onClick={() => setFilterState('')} className="hover:text-white"><X size={10} /></button>
              </span>
            )}
            {filterRateMin && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-900/30 border border-orange-700 text-[11px] font-mono text-orange-400">
                Rate &gt; {filterRateMin}%
                <button onClick={() => setFilterRateMin('')} className="hover:text-white"><X size={10} /></button>
              </span>
            )}
            {(filterDateFrom || filterDateTo) && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-900/30 border border-emerald-700 text-[11px] font-mono text-emerald-400">
                Close: {filterDateFrom || '…'} → {filterDateTo || '…'}
                <button onClick={() => { setFilterDateFrom(''); setFilterDateTo('') }} className="hover:text-white"><X size={10} /></button>
              </span>
            )}
              {urlFilterActive?.stage && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/30 text-[11px] font-mono text-[#C9A84C]">
                  Stage: {urlFilterActive.stage}
                  <button onClick={() => { setUrlFilterActive(null); router.replace('/dashboard/loans'); fetchLoans(activeList) }} className="hover:text-white"><X size={10} /></button>
                </span>
              )}
              {urlFilterActive?.period && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-900/30 border border-blue-700 text-[11px] font-mono text-blue-400">
                  Period: {urlFilterActive.period === 'mtd' ? 'This Month' : urlFilterActive.period === 'ytd' ? 'Year to Date' : urlFilterActive.period}
                  <button onClick={() => { setUrlFilterActive(prev => prev ? { ...prev, period: undefined } : null); router.replace('/dashboard/loans') }} className="hover:text-white"><X size={10} /></button>
                </span>
              )}
              {urlFilterActive?.filter && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-orange-900/30 border border-orange-700 text-[11px] font-mono text-orange-400">
                  {urlFilterActive.filter === 'no_activity_3days' ? 'No activity 3+ days' : urlFilterActive.filter}
                  <button onClick={() => { setUrlFilterActive(null); router.replace('/dashboard/loans'); fetchLoans(activeList) }} className="hover:text-white"><X size={10} /></button>
                </span>
              )}
            {hasAdvancedFilters && (
                <button onClick={clearAllFilters} className="text-[11px] font-mono text-muted-foreground hover:text-foreground/80 underline">Clear all</button>
            )}
            </div>
          )}

          {/* Expanded filter controls */}
          {showFilters && (
            <div className="mt-3 p-3 bg-[var(--bg)] border border-[var(--input)] rounded-lg">
              <div className="mb-3">
                <label className="block text-[9px] font-mono text-muted-foreground uppercase tracking-wider mb-1">Presets</label>
                <select
                  value={filterPreset}
                  onChange={e => applyPreset(e.target.value)}
                  className="text-[11px] font-mono px-2 py-1.5 border border-[var(--input)] rounded bg-[var(--card)] text-[#999999] outline-none min-w-[220px]"
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
              </div>
              <div className="flex items-start gap-4 flex-wrap">
                {/* Status multi-select */}
                <div className="min-w-[180px]">
                  <label className="block text-[9px] font-mono text-muted-foreground uppercase tracking-wider mb-1">Status</label>
                  <div className="max-h-[140px] overflow-y-auto border border-[var(--input)] rounded bg-[var(--card)] py-1">
                    {distinctStatuses.map(s => (
                      <label key={s} className="flex items-center gap-2 px-2 py-0.5 hover:bg-[var(--input)] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filterStatuses.includes(s)}
                          onChange={() => setFilterStatuses(prev =>
                            prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
                          )}
                          className="accent-[#C9A84C] rounded"
                        />
                        <span className="text-[11px] font-mono text-foreground/80 truncate">{s}</span>
                      </label>
                    ))}
                  </div>
                </div>
                {/* Purpose */}
                <div>
                  <label className="block text-[9px] font-mono text-muted-foreground uppercase tracking-wider mb-1">Purpose</label>
                  <select value={filterPurpose} onChange={e => setFilterPurpose(e.target.value)}
                    className="text-[11px] font-mono px-2 py-1 border border-[var(--input)] rounded bg-[var(--card)] text-[var(--fg)] outline-none min-w-[120px]">
                    <option value="">All</option>
                    <option value="Purchase">Purchase</option>
                    <option value="Refinance">Refinance</option>
                    <option value="HELOC">HELOC</option>
                  </select>
                </div>
                {/* Program */}
                <div>
                  <label className="block text-[9px] font-mono text-muted-foreground uppercase tracking-wider mb-1">Program</label>
                  <select value={filterProgram} onChange={e => setFilterProgram(e.target.value)}
                    className="text-[11px] font-mono px-2 py-1 border border-[var(--input)] rounded bg-[var(--card)] text-[var(--fg)] outline-none min-w-[120px]">
                    <option value="">All</option>
                    <option value="Conventional">Conventional</option>
                    <option value="FHA">FHA</option>
                    <option value="VA">VA</option>
                    <option value="USDA">USDA</option>
                    <option value="Jumbo">Jumbo</option>
                  </select>
                </div>
                {/* Lender */}
                <div>
                  <label className="block text-[9px] font-mono text-muted-foreground uppercase tracking-wider mb-1">Lender</label>
                  <select value={filterLender} onChange={e => setFilterLender(e.target.value)}
                    className="text-[11px] font-mono px-2 py-1 border border-[var(--input)] rounded bg-[var(--card)] text-[var(--fg)] outline-none min-w-[140px]">
                    <option value="">All</option>
                    {distinctLenders.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                {/* State */}
                <div>
                  <label className="block text-[9px] font-mono text-muted-foreground uppercase tracking-wider mb-1">State</label>
                  <input type="text" value={filterState} onChange={e => setFilterState(e.target.value)}
                    placeholder="e.g. TX"
                    className="text-[11px] font-mono px-2 py-1 border border-[var(--input)] rounded bg-[var(--card)] text-[var(--fg)] outline-none w-20 placeholder:text-muted-foreground"
                  />
                </div>
                {/* Rate > */}
                <div>
                  <label className="block text-[9px] font-mono text-muted-foreground uppercase tracking-wider mb-1">Rate &gt;</label>
                  <input type="number" step="0.125" value={filterRateMin} onChange={e => setFilterRateMin(e.target.value)}
                    placeholder="6.5"
                    className="text-[11px] font-mono px-2 py-1 border border-[var(--input)] rounded bg-[var(--card)] text-[var(--fg)] outline-none w-20 placeholder:text-muted-foreground"
                  />
                </div>
                {/* Closing date range */}
                <div>
                  <label className="block text-[9px] font-mono text-muted-foreground uppercase tracking-wider mb-1">Close From</label>
                  <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)}
                    className="text-[11px] font-mono px-2 py-1 border border-[var(--input)] rounded bg-[var(--card)] text-[var(--fg)] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-mono text-muted-foreground uppercase tracking-wider mb-1">Close To</label>
                  <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)}
                    className="text-[11px] font-mono px-2 py-1 border border-[var(--input)] rounded bg-[var(--card)] text-[var(--fg)] outline-none"
                  />
                </div>
              </div>
              <button onClick={clearAllFilters} className="mt-3 text-[11px] font-mono text-muted-foreground hover:text-foreground/80 underline">Clear All Filters</button>
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
                className="text-xs font-mono border border-[var(--input)] rounded px-2 py-1.5 bg-[var(--card)] text-[var(--fg)]"
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
                className="text-xs font-mono text-[var(--muted)] hover:text-[var(--fg)] px-2 py-1.5 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Pipeline dashboard — shown only on Loans in Process tab */}
        {activeList === 'inprocess' && !loading && loans.length > 0 && (() => {
          const stageLoans = PIPELINE_STAGES.map(stage => ({
            ...stage,
            count: loans.filter(l => stage.statuses.includes(l.status ?? '')).length,
          }))
          const total = stageLoans.reduce((sum, s) => sum + s.count, 0)
          return (
            <div className="px-4 pt-3 pb-2 border-b border-[var(--input)] bg-[var(--bg)]">
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
                    <p className="text-lg font-mono font-bold text-[var(--fg)] leading-tight">{stage.count}</p>
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
        <style>{`
          .loans-scroll::-webkit-scrollbar { height: 6px; width: 6px; }
          .loans-scroll::-webkit-scrollbar-track { background: transparent; }
          .loans-scroll::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.35); border-radius: 3px; }
          .loans-scroll::-webkit-scrollbar-thumb:hover { background: rgba(201,168,76,0.6); }
        `}</style>
        {/* ── Kanban board ───────────────────────────────────────────────── */}
        {viewMode === 'kanban' && (
          <div
            className="loans-scroll flex-1 overflow-x-auto"
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#C9A84C44 transparent', display: 'flex', minHeight: 0 }}
          >
            {loading ? (
              <div className="flex items-center justify-center w-full text-[var(--muted)] text-sm font-mono">Loading…</div>
            ) : kanbanColumns.filter(c => c.loans.length > 0).length === 0 ? (
              <div className="flex flex-col items-center justify-center w-full gap-2 text-[var(--muted)]">
                <AlertCircle size={20} />
                <p className="text-sm font-mono">No loans found</p>
              </div>
            ) : (
              kanbanColumns.filter(c => c.loans.length > 0).map(col => (
                <div key={col.key} className="flex-shrink-0 w-72 flex flex-col border-r border-[var(--input)] last:border-r-0">
                  {/* Column header */}
                  <div
                    className="px-3 py-2 border-b border-[var(--input)] flex items-center gap-2 sticky top-0 z-10"
                    style={{ background: `color-mix(in srgb, ${col.hex} 10%, var(--bg))` }}
                  >
                    <span className="text-xs font-mono font-semibold truncate" style={{ color: col.hex }}>{col.label}</span>
                    <span
                      className="ml-auto shrink-0 text-[11px] font-mono px-1.5 py-0.5 rounded-full"
                      style={{ background: `${col.hex}22`, color: col.hex }}
                    >
                      {col.loans.length}
                    </span>
                  </div>
                  {/* Cards */}
                  <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
                    {col.loans.map(loan => {
                      const ecd = effectiveClosingDate(loan)
                      const days = daysUntilClose(ecd)
                      const urgentClose = days !== null && days <= 7
                      const warnClose = days !== null && days > 7 && days <= 14
                      return (
                        <div
                          key={loan.id}
                          onClick={() => router.push(`/dashboard/loans/${loan.id}`)}
                          className="bg-[var(--card)] border border-[var(--input)] rounded-lg p-3 cursor-pointer hover:border-[#C9A84C]/40 hover:bg-secondary transition-colors"
                          style={urgentClose
                            ? { borderLeftColor: 'rgba(239,68,68,0.5)', borderLeftWidth: 3 }
                            : warnClose
                              ? { borderLeftColor: 'rgba(245,158,11,0.5)', borderLeftWidth: 3 }
                              : {}}
                        >
                          <p className="text-sm font-mono font-medium text-[var(--fg)] truncate">{borrowerDisplayName(loan)}</p>
                          {loan.loan_name && <p className="text-[11px] font-mono text-[#C9A84C]/60 truncate mt-0.5">{loan.loan_name}</p>}
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <span className="text-xs font-mono text-blue-400 whitespace-nowrap">{fmtCurrency(loan.loan_amount)}</span>
                            {ecd && (
                              <span className={`text-[11px] font-mono whitespace-nowrap ${urgentClose ? 'text-red-400' : warnClose ? 'text-amber-400' : 'text-[#555555]'}`}>
                                {fmtDate(ecd)}{days !== null && days <= 14 ? ` · ${days}d` : ''}
                              </span>
                            )}
                          </div>
                          {loan.lender && <p className="text-[11px] font-mono text-[#444444] mt-1.5 truncate">{loan.lender}</p>}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── Table ─────────────────────────────────────────────────────── */}
        <style>{`th:hover .col-drag-handle { opacity: 1 !important; }`}</style>
        <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={handleColDragEnd}>
        <div
          className={`loans-scroll flex-1 w-0 min-w-full overflow-auto${viewMode === 'kanban' ? ' hidden' : ''}`}
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#C9A84C44 transparent' }}
        >
          {loading ? (
            <div className="flex items-center justify-center h-48 text-[var(--muted)] text-sm font-mono">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2 text-[var(--muted)]">
              <AlertCircle size={20} />
              <p className="text-sm font-mono">No loans found</p>
            </div>
          ) : (
            <table className="min-w-max text-sm">
              <thead>
                <SortableContext items={columnOrder} strategy={horizontalListSortingStrategy}>
                <tr className="border-b border-[var(--input)] bg-[var(--surface2)]">
                  <th className="w-8 px-2 py-2.5 bg-[var(--surface2)] sticky top-0 z-10">
                    <input
                      type="checkbox"
                      checked={filtered.length > 0 && selected.size === filtered.length}
                      onChange={toggleSelectAll}
                      className="rounded border-[var(--input)] accent-[#C9A84C] focus:ring-[#C9A84C]"
                    />
                  </th>
                  {/* Borrower column — pinned, not draggable */}
                  {visibleColumns.includes('borrower_name') && (
                    <th
                      onClick={() => handleSort('borrower_name')}
                      className={`text-left px-4 py-2.5 text-xs font-mono font-semibold uppercase tracking-wide select-none cursor-pointer bg-[var(--surface2)] sticky top-0 z-10 ${
                        sortKey === 'borrower_name' ? 'text-[#C9A84C]' : 'text-[var(--muted)] hover:text-[var(--fg)]'
                      }`}
                    >
                      <span className="flex items-center gap-0.5">
                        {borrowerColDef.label}
                        {sortKey === 'borrower_name' && (sortDir === 'asc' ? ' ▲' : ' ▼')}
                      </span>
                    </th>
                  )}
                  {/* Draggable column headers */}
                  {draggableColDefs.map(col => (
                    <SortableLoanColumnHeader
                      key={col.id}
                      col={col}
                      sortKey={sortKey}
                      sortDir={sortDir}
                      onSort={() => col.key && handleSort(col.key)}
                    />
                  ))}
                </tr>
                </SortableContext>
              </thead>
              <tbody>
                {filtered.map(loan => {
                  const ecd = effectiveClosingDate(loan)
                  const urgencyStyle = closingUrgencyStyle(ecd, activeList === 'inprocess')
                  const days = activeList === 'inprocess' ? daysUntilClose(ecd) : null
                  return (
                  <tr key={loan.id}
                    className={`group/row border-b border-[var(--input)]/50 hover:bg-[var(--card)] transition-colors cursor-pointer ${selected.has(loan.id) ? 'bg-[#C9A84C]/5' : ''}`}
                    style={urgencyStyle}
                    onClick={() => router.push(`/dashboard/loans/${loan.id}`)}>
                    <td className="w-8 px-2 py-3" onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected.has(loan.id)}
                        onChange={() => toggleSelect(loan.id)}
                        className="rounded border-[var(--input)] accent-[#C9A84C] focus:ring-[#C9A84C]"
                      />
                    </td>
                    {colDefs.map(col => {
                      if (col.id === 'borrower_name') {
                        return (
                          <td key={col.id} className="px-4 py-3 font-medium" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center gap-2">
                              {/* Borrower name → contact */}
                              {loan.contact_id ? (
                                <Link
                                  href={`/dashboard/contacts/${loan.contact_id}`}
                                  className="text-[var(--fg)] hover:text-[#C9A84C] font-mono text-sm"
                                  style={{ textDecoration: 'none' }}
                                  onMouseEnter={e => (e.currentTarget.style.textDecorationColor = '#C9A84C', e.currentTarget.style.textDecoration = 'underline')}
                                  onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
                                >
                                  {borrowerDisplayName(loan)}
                                </Link>
                              ) : (
                                <span className="text-[var(--fg)] font-mono text-sm">{borrowerDisplayName(loan)}</span>
                              )}
                              {/* Delete button */}
                              <button
                                onClick={e => { e.stopPropagation(); setDeletingLoanId(loan.id) }}
                                className="opacity-0 group-hover/row:opacity-100 text-muted-foreground hover:text-red-400 transition-all ml-auto"
                                title="Delete loan"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                            {/* Loan name → loan detail */}
                            {loan.loan_name && (
                              <Link
                                href={`/dashboard/loans/${loan.id}`}
                                className="block text-xs font-mono text-[#C9A84C]/70 mt-0.5 hover:text-[#C9A84C]"
                                style={{ textDecoration: 'none' }}
                                onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline', e.currentTarget.style.textDecorationColor = '#C9A84C')}
                                onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
                                onClick={e => e.stopPropagation()}
                              >
                                {loan.loan_name}
                              </Link>
                            )}
                          </td>
                        )
                      }
                      if (col.id === 'loan_name') {
                        return (
                          <td key={col.id} className="px-4 py-3" onClick={e => e.stopPropagation()}>
                            <Link
                              href={`/dashboard/loans/${loan.id}`}
                              className="text-[#C9A84C]/80 hover:text-[#C9A84C] font-mono text-sm"
                              style={{ textDecoration: 'none' }}
                              onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline', e.currentTarget.style.textDecorationColor = '#C9A84C')}
                              onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
                            >
                              {loan.loan_name || '—'}
                            </Link>
                          </td>
                        )
                      }
                      if (col.id === 'loan_amount') return <td key={col.id} className="px-4 py-3 font-mono text-[#CCCCCC] whitespace-nowrap">{fmtCurrency(loan.loan_amount)}</td>
                      if (col.id === 'purchase_price') return <td key={col.id} className="px-4 py-3 font-mono text-[#CCCCCC] whitespace-nowrap">{fmtCurrency(loan.purchase_price ?? null)}</td>
                      if (col.id === 'status') {
                        return (
                          <td key={col.id} className="px-4 py-3" onClick={e => e.stopPropagation()}>
                            {editingStatusId === loan.id ? (
                              <select
                                autoFocus
                                value={loan.status ?? ''}
                                onChange={e => handleStatusChange(loan.id, e.target.value)}
                                onBlur={() => setEditingStatusId(null)}
                                className="text-xs font-mono border border-[var(--input)] rounded px-2 py-1 bg-[var(--card)] text-[var(--fg)]"
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
                            {fmtDate(ecd)}
                          </span>
                          {days !== null && days <= 14 && (
                            <span className={`ml-2 text-[11px] ${days <= 7 ? 'text-red-400' : 'text-amber-400'}`}>
                              {days <= 0 ? 'TODAY' : `${days}d`}
                            </span>
                          )}
                        </td>
                      )
                      if (col.id === 'interest_rate') return <td key={col.id} className="px-4 py-3 font-mono text-[#999999] whitespace-nowrap">{loan.interest_rate != null ? `${loan.interest_rate}%` : '—'}</td>
                      if (col.id === 'lender') return <td key={col.id} className="px-4 py-3 font-mono text-[#999999]">{loan.lender || '—'}</td>
                      if (col.id === 'rate_lock_expiration') {
                        const lockDays = daysUntilClose(loan.rate_lock_expiration)
                        const lockExpired = lockDays !== null && lockDays < 0
                        const lockWarn = lockDays !== null && lockDays >= 0 && lockDays <= 7
                        return (
                          <td key={col.id} className="px-4 py-3 font-mono whitespace-nowrap">
                            <span className={lockExpired ? 'text-red-400' : lockWarn ? 'text-amber-400' : 'text-[#999999]'}>
                              {fmtDate(loan.rate_lock_expiration)}
                            </span>
                            {lockExpired && <span className="ml-1.5 text-[11px] text-red-400">EXPIRED</span>}
                            {lockWarn && <span className="ml-1.5 text-[11px] text-amber-400">{lockDays}d</span>}
                          </td>
                        )
                      }
                      if (col.id === 'loan_number') return <td key={col.id} className="px-4 py-3 font-mono text-[#999999]">{loan.loan_number || '—'}</td>
                      if (col.id === 'location') return <td key={col.id} className="px-4 py-3 font-mono text-[#999999]">{loanLocation(loan)}</td>
                      if (col.id === 'property_state') return <td key={col.id} className="px-4 py-3 font-mono text-[#999999]">{loan.property_state || '—'}</td>
                      if (col.id === 'loan_program') return <td key={col.id} className="px-4 py-3 font-mono text-[#999999]">{loan.loan_program || '—'}</td>
                      if (col.id === 'borrower_email') return <td key={col.id} className="px-4 py-3 font-mono text-[#999999]">{loan.borrower_email || '—'}</td>
                      if (col.id === 'borrower_phone') {
                        const href = telHref(loan.borrower_phone)
                        const val = fmtPhone(loan.borrower_phone)
                        return (
                          <td key={col.id} className="px-4 py-3 font-mono text-[#999999]">
                            {href ? <a href={href} onClick={e => e.stopPropagation()} className="hover:text-[#C9A84C] hover:underline">{val}</a> : val}
                          </td>
                        )
                      }
                      if (col.id === 'commission_amount') {
                        const isEditing = editingCommissionId === loan.id
                        return (
                          <td
                            key={col.id}
                            className="px-4 py-3 font-mono text-[#C9A84C]"
                            onClick={e => { e.stopPropagation(); if (!isEditing) { setEditingCommissionId(loan.id); setEditingCommissionValue((loan.commission_amount ?? 0).toString()); } }}
                          >
                            {isEditing ? (
                              <input
                                autoFocus
                                type="number"
                                step="100"
                                value={editingCommissionValue}
                                onChange={e => setEditingCommissionValue(e.target.value)}
                                onBlur={() => handleCommissionChange(loan.id, editingCommissionValue)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') handleCommissionChange(loan.id, editingCommissionValue)
                                  if (e.key === 'Escape') { setEditingCommissionId(null); setEditingCommissionValue('') }
                                }}
                                className="w-24 bg-[var(--bg)] border border-[var(--input)] rounded px-2 py-1 text-xs text-[var(--fg)] outline-none focus:ring-1 focus:ring-[#C9A84C]"
                              />
                            ) : (
                              <span className="cursor-text underline-offset-2 hover:underline decoration-dotted">
                                {fmtCurrency(loan.commission_amount ?? null)}
                              </span>
                            )}
                          </td>
                        )
                      }
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
                        const val = fmtPhone(loan.contact_phone)
                        return (
                          <td key={col.id} className="px-4 py-3 font-mono text-[#999999]">
                            {href ? <a href={href} onClick={e => e.stopPropagation()} className="hover:text-[#C9A84C] hover:underline">{val}</a> : val}
                          </td>
                        )
                      }
                      if (col.id === 'last_milestone') {
                        const ms = loan.last_milestone_at
                        const msAgeDays = ms ? Math.floor((Date.now() - new Date(ms).getTime()) / (1000 * 60 * 60 * 24)) : null
                        return (
                          <td key={col.id} className="px-4 py-3 font-mono whitespace-nowrap">
                            <span className={msAgeDays !== null && msAgeDays > 30 ? 'text-amber-400' : 'text-[#999999]'}>
                              {fmtRelativeDate(ms)}
                            </span>
                          </td>
                        )
                      }
                      if (col.id === 'actions') {
                        const phone = loan.borrower_phone || loan.contact_phone
                        const email = loan.borrower_email || loan.contact_email
                        const tel = telHref(phone)
                        const mailto = mailtoHref(email)
                        const smsHref = phone ? `sms:${String(phone).replace(/\D/g, '')}` : null
                        return (
                          <td key={col.id} className="px-2 py-3" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center gap-1 opacity-40 group-hover/row:opacity-100 transition-opacity">
                              {tel && (
                                <a href={tel} title={`Call ${fmtPhone(phone)}`} className="p-1.5 rounded hover:bg-green-500/20 text-muted-foreground hover:text-green-400 transition-colors">
                                  <Phone size={14} />
                                </a>
                              )}
                              {smsHref && (
                                <a href={smsHref} title={`Text ${fmtPhone(phone)}`} className="p-1.5 rounded hover:bg-blue-500/20 text-muted-foreground hover:text-blue-400 transition-colors">
                                  <MessageSquare size={14} />
                                </a>
                              )}
                              {mailto && (
                                <a href={mailto} title={`Email ${email}`} className="p-1.5 rounded hover:bg-amber-500/20 text-muted-foreground hover:text-[#C9A84C] transition-colors">
                                  <Mail size={14} />
                                </a>
                              )}
                              {!tel && !smsHref && !mailto && (
                                <span className="text-[11px] font-mono text-muted-foreground">No contact</span>
                              )}
                            </div>
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
            <div className="flex justify-center py-4 border-t border-[var(--input)]">
              <button
                onClick={loadMoreLoans}
                disabled={loadingMore}
                className="px-5 py-2 text-xs font-mono tracking-widest uppercase border border-[var(--input)] rounded text-[#999999] hover:bg-[var(--card)] hover:text-[var(--fg)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loadingMore ? 'Loading…' : `Load more (showing ${loans.length})`}
              </button>
            </div>
          )}
        </div>
        </DndContext>
      </div>

      {/* New List (custom filter) modal */}
      {showNewListModal && (
        <div className="fixed inset-0 bg-black/70 z-[300] flex items-center justify-center" onClick={() => setShowNewListModal(false)}>
          <div className="bg-[var(--card)] border border-[var(--input)] rounded-lg p-6 w-full max-w-md max-h-[85vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="text-xs font-mono font-semibold text-[var(--muted)] uppercase tracking-wider mb-3">New Smart List</div>
            <input
              placeholder="List name"
              value={newListName}
              onChange={e => setNewListName(e.target.value)}
              className="w-full border border-[var(--input)] rounded px-3 py-2 text-sm font-mono bg-[var(--bg)] text-[var(--fg)] placeholder:text-[var(--muted)] mb-4 focus:outline-none focus:ring-1 focus:ring-[#C9A84C]"
            />
            <div className="text-[11px] font-mono text-[var(--muted)] uppercase tracking-wider mb-2">Filter rules (AND)</div>
            {newListRules.map((rule, idx) => (
              <div key={idx} className="flex gap-2 mb-2 flex-wrap items-center">
                <select
                  value={rule.field}
                  onChange={e => setNewListRules(prev => prev.map((r, i) => i === idx ? { ...r, field: e.target.value } : r))}
                  className="min-w-[100px] border border-[var(--input)] rounded px-2 py-1.5 text-xs font-mono bg-[var(--bg)] text-[var(--fg)]"
                >
                  {LOAN_FILTER_FIELDS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                </select>
                <select
                  value={rule.operator}
                  onChange={e => setNewListRules(prev => prev.map((r, i) => i === idx ? { ...r, operator: e.target.value } : r))}
                  className="min-w-[80px] border border-[var(--input)] rounded px-2 py-1.5 text-xs font-mono bg-[var(--bg)] text-[var(--fg)]"
                >
                  {FILTER_OPERATORS.map(op => <option key={op.id} value={op.id}>{op.label}</option>)}
                </select>
                <input
                  placeholder="Value"
                  value={rule.value}
                  onChange={e => setNewListRules(prev => prev.map((r, i) => i === idx ? { ...r, value: e.target.value } : r))}
                  className="flex-1 min-w-[80px] border border-[var(--input)] rounded px-2 py-1.5 text-xs font-mono bg-[var(--bg)] text-[var(--fg)] placeholder:text-[var(--muted)]"
                />
                {newListRules.length > 1 && (
                  <button type="button" onClick={() => setNewListRules(prev => prev.filter((_, i) => i !== idx))} className="text-[var(--muted)] hover:text-[var(--fg)] p-1 transition-colors">×</button>
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
              <button onClick={() => setShowNewListModal(false)} className="px-3 py-1.5 text-xs font-mono border border-[var(--input)] rounded text-[var(--muted)] hover:bg-[var(--input)] transition-colors">
                Cancel
              </button>
              <button onClick={handleSaveNewList} disabled={!newListName.trim()} className="px-3 py-1.5 text-xs font-mono bg-[#C9A84C] text-[var(--bg)] rounded font-semibold disabled:opacity-50 hover:bg-[#D4B05C] transition-colors">
                Save List
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete custom list confirmation */}
      {deleteListId && (
        <div className="fixed inset-0 bg-black/70 z-[300] flex items-center justify-center" onClick={() => setDeleteListId(null)}>
          <div className="bg-[var(--card)] border border-[var(--input)] rounded-lg p-6 w-80 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="text-sm font-mono text-[var(--fg)] mb-2">Delete this list?</div>
            <div className="text-xs font-mono text-[var(--muted)] mb-4">This cannot be undone.</div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteListId(null)} className="px-3 py-1.5 text-xs font-mono border border-[var(--input)] rounded text-[var(--muted)] hover:bg-[var(--input)] transition-colors">Cancel</button>
              <button onClick={handleDeleteList} className="px-3 py-1.5 text-xs font-mono bg-red-700 text-white rounded hover:bg-red-600 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Column picker backdrop — click outside to close */}
      {showColPicker && (
        <div
          className="fixed inset-0 z-[50]"
          onClick={() => { setShowColPicker(false); setColSearch('') }}
          aria-hidden
        />
      )}

      {/* Single loan delete confirmation */}
      {deletingLoanId && (
        <div className="fixed inset-0 bg-black/70 z-[300] flex items-center justify-center" onClick={() => setDeletingLoanId(null)}>
          <div className="bg-[var(--card)] border border-[var(--input)] rounded-lg p-6 w-80 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="text-sm font-mono text-[var(--fg)] mb-1">Delete this loan?</div>
            <div className="text-xs font-mono text-[var(--muted)] mb-4">
              {(() => { const l = loans.find(l => l.id === deletingLoanId); return l ? (l.loan_name || borrowerDisplayName(l)) : 'This loan' })()} will be permanently removed. This cannot be undone.
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeletingLoanId(null)} className="px-3 py-1.5 text-xs font-mono border border-[var(--input)] rounded text-[var(--muted)] hover:bg-[var(--input)] transition-colors">Cancel</button>
              <button onClick={() => handleDeleteLoan(deletingLoanId)} className="px-3 py-1.5 text-xs font-mono bg-red-700 text-white rounded hover:bg-red-600 transition-colors flex items-center gap-1.5">
                <Trash2 size={11} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-[var(--muted)] font-mono text-xs">—</span>
  const hex = statusHex(status)
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono font-medium whitespace-nowrap"
      style={{ background: `${hex}22`, color: hex, border: `1px solid ${hex}44` }}
    >
      {status}
    </span>
  )
}
