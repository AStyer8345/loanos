'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useOrg } from '@/hooks/useOrg'
import Link from 'next/link'
import { useOutreachChat, type SelectedContact } from '@/components/outreach/OutreachChatContext'
import Papa from 'papaparse'
import { normalizeContactStage } from '@/lib/constants/loan-stages'
import { updateLastTouch } from '@/lib/updateLastTouch'
import { fmtCurrency, fmtDate, fmtDateOnly } from '@/lib/formatters'
import { Trash2, Pencil, GripVertical } from 'lucide-react'
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd'
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

// ── Types ──────────────────────────────────────────────────────────────────────
type Contact = {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  contact_type: string | null
  stage: string | null
  lead_source: string | null
  referred_by: string | null
  referral_type: string | null
  company_name: string | null
  notes: string | null
  birthday: string | null
  coborrower_first_name: string | null
  coborrower_last_name: string | null
  coborrower_birthday: string | null
  last_touch: string | null
  last_touch_at: string | null
  last_activity_date: string | null
  last_activity_notes: string | null
  last_activity_type: string | null
  salesforce_id: string | null
  closing_date: string | null
  created_at: string | null
  do_not_call: boolean | null
  production_tier: string | null
  realtor_stage: string | null
  referred_by_contact_id: string | null
  referral_ytd_count: number | null
  referral_lifetime_count: number | null
  last_referral_date: string | null
  deals_ytd_count: number | null
  deals_lifetime_count: number | null
  last_deal_closed_date: string | null
  last_outreach_date: string | null
  referral_source_notes: string | null
}

type SmartListDef = { id: string; label: string; section?: string }
type ColumnDef    = { id: string; label: string; minWidth: number; render: (c: Contact) => React.ReactNode }
type SortConfig   = { key: keyof Contact; dir: 'asc' | 'desc' }
type BulkAction   = 'stage' | 'type' | 'referred_by' | null

interface ContactLoan {
  id: string
  loan_name: string | null
  borrower_name: string | null
  borrower_first_name: string | null
  borrower_last_name: string | null
  status: string | null
  loan_amount: number | null
  closing_date: string | null
}

const STAGE_TO_LIST: Record<string, string> = {
  'Lead':         'new-apps',
  'Pre-App':      'new-apps',
  'Application':  'new-apps',
  'Pre-Approved': 'active',
  'In Process':   'in-process',
  'Closing':      'in-process',
  'Closed':       'closed',
  'Other':        'unassigned',
}

// fmtCurrency, fmtDate, fmtDateOnly imported from '@/lib/formatters'

/** Normalize for tel: href (digits and + only) */
function telHref(phone: string | null): string | null {
  if (!phone || !phone.trim()) return null
  const digits = phone.replace(/\D/g, '')
  return digits.length >= 10 ? `tel:${phone.trim()}` : null
}

function PhoneCell({ value }: { value: string | null }) {
  const href = telHref(value)
  if (!value?.trim()) return <>—</>
  if (href) {
    return (
      <a href={href} onClick={e => e.stopPropagation()} style={{ color: 'inherit', textDecoration: 'none' }}>
        {value}
      </a>
    )
  }
  return <>{value}</>
}

/** mailto: link only if non-empty and contains @ */
function mailtoHref(email: string | null): string | null {
  if (!email || !email.trim() || !email.includes('@')) return null
  return `mailto:${email.trim()}`
}

function EmailCell({ value }: { value: string | null }) {
  const href = mailtoHref(value)
  if (!value?.trim()) return <>—</>
  if (href) {
    return (
      <a href={href} onClick={e => e.stopPropagation()} style={{ color: 'inherit', textDecoration: 'none' }}>
        {value}
      </a>
    )
  }
  return <>{value}</>
}

function LastTouchCell({ date }: { date: string | null }) {
  if (!date) return <span style={{ color: 'rgba(113,113,122,0.6)' }}>—</span>

  const ts = new Date(date)
  if (isNaN(ts.getTime())) return <span style={{ color: 'rgba(113,113,122,0.6)' }}>—</span>

  const diffDays = Math.floor((Date.now() - ts.getTime()) / 86400000)

  // Color coding by recency
  let color = 'rgba(113,113,122,0.6)'
  if (diffDays <= 3) color = '#4ade80'
  else if (diffDays <= 7) color = '#facc15'
  else color = '#f87171'

  const mo = String(ts.getMonth() + 1).padStart(2, '0')
  const da = String(ts.getDate()).padStart(2, '0')
  const label = `${mo}/${da}/${ts.getFullYear()}`

  return (
    <span style={{ color, fontFamily: 'var(--font-mono)', fontSize: 11 }}>
      {label}
    </span>
  )
}

function isClosedLoan(status: string | null) {
  if (!status) return false
  const s = status.toLowerCase()
  return ['closed', 'funded', 'closed/funded'].some(v => s.includes(v))
}

function stageToList(stage: string | null, contactType: string | null): string {
  if (contactType === 'realtor') return 'all-realtors'
  if (!stage || !(stage in STAGE_TO_LIST)) return 'unassigned'
  return STAGE_TO_LIST[stage]
}

// ── Smart Lists ───────────────────────────────────────────────────────────────
const SMART_LISTS: SmartListDef[] = [
  { id: 'active',         label: 'Hot List / Pre-Approved' },
  { id: 'all',            label: 'All Contacts' },
  { id: 'all-borrowers',  label: 'All Borrowers',          section: 'BORROWERS' },
  { id: 'new-apps',       label: 'New Applications' },
  { id: 'in-process',     label: 'In Process' },
  { id: 'closed',         label: 'Closed Borrowers' },
  { id: 'all-realtors',         label: 'All Realtors',                section: 'REALTORS' },
  { id: 'top-realtors',         label: 'Top / Target' },
  { id: 'active_deal_partners', label: 'Active Deal Partners' },
  { id: 'top_producers',        label: 'Top Producers (YTD ≥ 2)' },
  { id: 'due_for_outreach',     label: 'Due for Outreach (60+ days)' },
  { id: 'tier_a_not_this_month', label: 'Tier A — Not This Month' },
  { id: 'unassigned',           label: 'Unassigned / Other',          section: 'OTHER' },
]

// ── Quick filter dropdown options (maps to smart list IDs) ────────────────────
const QUICK_FILTERS = [
  { id: 'active',        label: 'Hot List / Pre-Approved' },
  { id: 'all',           label: 'All Contacts' },
  { id: 'all-borrowers', label: 'Borrowers' },
  { id: 'all-realtors',  label: 'Realtors' },
  { id: 'unassigned',    label: 'Others' },
] as const

// ── Custom lists (filter builder) ─────────────────────────────────────────────
type CustomListRule = { field: string; operator: string; value: string }
type CustomList = { id: string; name: string; page: 'contacts' | 'loans'; rules: CustomListRule[] }
const LS_CUSTOM_LISTS_KEY = 'loanos_custom_lists_v1'
const STAGES = ['Lead', 'Pre-App', 'Application', 'Pre-Approved', 'In Process', 'Closing', 'Closed', 'Other'] as const

const CONTACT_FILTER_FIELDS = [
  { id: 'contact_type', label: 'Type' },
  { id: 'stage', label: 'Stage' },
  { id: 'lead_source', label: 'Lead Source' },
  { id: 'referred_by', label: 'Referred By' },
  { id: 'company_name', label: 'Company' },
] as const

const FILTER_OPERATORS = [
  { id: 'is', label: 'is' },
  { id: 'is_not', label: 'is not' },
  { id: 'contains', label: 'contains' },
  { id: 'before', label: 'before' },
  { id: 'after', label: 'after' },
] as const

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyCustomListRulesContact(query: any, rules: CustomListRule[]): any {
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


const REFERRAL_TYPE_LABELS: Record<string, string> = {
  web_lead:                   'Web Lead',
  realtor_referral:           'Realtor Referral',
  client_referral:            'Client Referral',
  past_client:                'Past Client',
  friend_family:              'Friend / Family',
  financial_advisor_referral: 'Financial Advisor',
  builder_referral:           'Builder Referral',
  open_house:                 'Open House',
  other:                      'Other',
}

// ── Column Definitions ────────────────────────────────────────────────────────
const ALL_COLUMNS: ColumnDef[] = [
  { id: 'name',         label: 'Name',             minWidth: 200, render: c => (
      <Link href={`/dashboard/contacts/${c.id}`} onClick={e => e.stopPropagation()} style={{ color: '#c9a84c', textDecoration: 'none', fontWeight: 600 }}>
        {`${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() || '—'}
      </Link>
    ) },
  { id: 'type',         label: 'Type',             minWidth: 100, render: c => c.contact_type ?? '—' },
  { id: 'phone',        label: 'Phone',            minWidth: 140, render: c => <PhoneCell value={c.phone} /> },
  { id: 'email',        label: 'Email',            minWidth: 220, render: c => <EmailCell value={c.email} /> },
  { id: 'stage',        label: 'Stage',            minWidth: 120, render: c => c.stage ?? '—' },
  { id: 'lead_source',  label: 'Lead Source',      minWidth: 140, render: c => c.lead_source ?? '—' },
  { id: 'referral_type', label: 'Referral Type',    minWidth: 140, render: c => c.referral_type
      ? <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, padding: '2px 7px', borderRadius: 4, background: 'rgba(59,130,246,0.12)', color: '#60a5fa', whiteSpace: 'nowrap' }}>{REFERRAL_TYPE_LABELS[c.referral_type] ?? c.referral_type}</span>
      : <span style={{ color: 'var(--muted)' }}>—</span> },
  { id: 'referred_by',  label: 'Referred By',      minWidth: 160, render: c => c.referred_by
      ? <Link href={`/dashboard/contacts/by-name/${encodeURIComponent(c.referred_by)}`} onClick={e => e.stopPropagation()} style={{ color: '#c9a84c', textDecoration: 'none' }}>{c.referred_by}</Link>
      : '—' },
  { id: 'company',      label: 'Company',          minWidth: 160, render: c => c.company_name ?? '—' },
  { id: 'birthday',     label: 'Birthday',         minWidth: 120, render: c => c.birthday ?? '—' },
  { id: 'co_name',      label: 'Co-Borrower Name', minWidth: 180, render: c => c.coborrower_first_name ? `${c.coborrower_first_name} ${c.coborrower_last_name ?? ''}`.trim() : '—' },
  { id: 'co_bday',      label: 'Co-Bday',          minWidth: 120, render: c => c.coborrower_birthday ?? '—' },
  { id: 'notes',        label: 'Notes',            minWidth: 200, render: c => {
      const v = c.notes
      if (!v) return '—'
      // If the notes value looks like an ISO date/timestamp, display as MM/DD/YYYY only
      if (/^\d{4}-\d{2}-\d{2}/.test(v)) {
        const formatted = fmtDateOnly(v)
        if (formatted !== '—') return formatted
      }
      return v
    } },
  { id: 'last_touch',      label: 'Last Touch',       minWidth: 180, render: c => <LastTouchCell date={c.last_touch_at ?? c.last_activity_date} /> },
  { id: 'production_tier', label: 'Tier',             minWidth: 80,  render: c => c.production_tier
      ? <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'rgba(201,168,76,0.12)', color: '#c9a84c', fontWeight: 600 }}>{c.production_tier}</span>
      : <span style={{ color: 'var(--muted)' }}>—</span> },
  { id: 'realtor_stage',   label: 'Realtor Stage',    minWidth: 140, render: c => c.realtor_stage ?? '—' },
  { id: 'referral_lifetime', label: 'Referrals',      minWidth: 90,  render: c => c.referral_lifetime_count ? String(c.referral_lifetime_count) : null },
  { id: 'last_referral',   label: 'Last Referral',    minWidth: 120, render: c => c.last_referral_date ? fmtDate(c.last_referral_date) : null },
  { id: 'last_deal',       label: 'Last Deal',        minWidth: 120, render: c => c.last_deal_closed_date ? fmtDate(c.last_deal_closed_date) : null },
  { id: 'created',         label: 'Created Date',     minWidth: 140, render: c => fmtDateOnly(c.created_at) },
]

const DEFAULT_COLUMNS = ['name', 'type', 'phone', 'email', 'stage', 'referred_by', 'last_touch']
const LS_COLUMNS_KEY  = 'loanos_contacts_columns_v1'
const LS_COL_ORDER_KEY = 'loanos_contacts_col_order_v1'
// IDs of non-name (draggable) columns in their default order
const DRAGGABLE_COL_IDS = ALL_COLUMNS.filter(c => c.id !== 'name').map(c => c.id)

// ── Stage badge styles ────────────────────────────────────────────────────────
function getStageBadgeStyle(stage: string | null): React.CSSProperties {
  const map: Record<string, string> = {
    'Lead':         'rgba(201,168,76,0.15)',
    'Pre-App':      'rgba(201,168,76,0.20)',
    'Application':  'rgba(100,160,255,0.15)',
    'Pre-Approved': 'rgba(80,200,120,0.15)',
    'In Process':   'rgba(80,160,200,0.15)',
    'Closing':      'rgba(160,100,220,0.15)',
    'Closed':       'rgba(100,100,100,0.15)',
  }
  return {
    display: 'inline-block', padding: '2px 8px', borderRadius: 3,
    fontFamily: 'var(--font-mono)', fontSize: 11,
    background: stage ? (map[stage] ?? 'rgba(255,255,255,0.06)') : 'transparent',
    cursor: 'pointer', userSelect: 'none',
  }
}

// ── applySmartList ─────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applySmartList(query: any, listId: string): any {
  switch (listId) {
    case 'new-apps':
      return query.eq('contact_type', 'borrower').in('stage', ['Lead', 'Pre-App', 'Application'])
    case 'active':
      return query.eq('contact_type', 'borrower').in('stage', ['Pre-Approved'])
    case 'all-borrowers':
      return query.eq('contact_type', 'borrower')
    case 'in-process':
      return query.eq('contact_type', 'borrower').in('stage', ['In Process', 'Closing'])
    case 'closed':
      return query.eq('contact_type', 'borrower').in('stage', ['Closed'])
    case 'all-realtors':
      return query.eq('contact_type', 'realtor')
    case 'top-realtors':
      return query.eq('contact_type', 'realtor').not('production_tier', 'is', null)
    case 'active_deal_partners':
      return query.eq('contact_type', 'realtor').gte('deals_ytd_count', 1)
    case 'top_producers':
      return query.eq('contact_type', 'realtor').gte('referral_ytd_count', 2)
    case 'due_for_outreach': {
      const cutoff60 = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      return query.eq('contact_type', 'realtor').or(`last_outreach_date.is.null,last_outreach_date.lt.${cutoff60}`)
    }
    case 'tier_a_not_this_month': {
      const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0)
      const startOfMonth = d.toISOString().split('T')[0]
      return query.eq('contact_type', 'realtor').eq('production_tier', 'A').or(`last_outreach_date.is.null,last_outreach_date.lt.${startOfMonth}`)
    }
    case 'unassigned':
      return query.or(
        'contact_type.eq.other,contact_type.eq.advisor,contact_type.eq.title,contact_type.eq.insurance,' +
        'contact_type.is.null,and(contact_type.eq.borrower,stage.is.null)'
      )
    default:
      return query
  }
}

// ── Blank new-contact form ────────────────────────────────────────────────────
// ── ContactTypeahead ──────────────────────────────────────────────────────────
// Typeahead input that searches existing contacts by name. Stores the selected
// contact's full name as a string (referred_by is a free-text field in the DB).
type TypeaheadResult = { id: string; first_name: string | null; last_name: string | null; contact_type: string | null }

function ContactTypeahead({
  value,
  onChange,
  supabase,
  placeholder = 'referred by…',
  inputStyle,
}: {
  value: string
  onChange: (val: string) => void
  supabase: ReturnType<typeof createClient>
  placeholder?: string
  inputStyle?: React.CSSProperties
}) {
  const [results, setResults] = useState<TypeaheadResult[]>([])
  const [open, setOpen]       = useState(false)
  const [highlighted, setHighlighted] = useState(0)
  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  function runSearch(term: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!term.trim()) { setResults([]); setOpen(false); return }
    debounceRef.current = setTimeout(async () => {
      const { data } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, contact_type')
        .or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%`)
        .limit(20)
      const sorted = ((data ?? []) as TypeaheadResult[]).sort((a, b) => {
        const aR = (a.contact_type === 'realtor' || a.contact_type === 'agent') ? 0 : 1
        const bR = (b.contact_type === 'realtor' || b.contact_type === 'agent') ? 0 : 1
        return aR - bR
      }).slice(0, 10)
      setResults(sorted)
      setOpen(sorted.length > 0)
      setHighlighted(0)
    }, 300)
  }

  function select(c: TypeaheadResult) {
    const name = `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim()
    onChange(name)
    setResults([])
    setOpen(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlighted(h => Math.min(h + 1, results.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlighted(h => Math.max(h - 1, 0)) }
    else if (e.key === 'Enter' && results[highlighted]) { e.preventDefault(); select(results[highlighted]) }
    else if (e.key === 'Escape') { setOpen(false) }
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const base: React.CSSProperties = {
    width: '100%', background: 'var(--bg)', border: '1px solid var(--border)',
    color: 'var(--text)', borderRadius: 4, padding: '8px 10px', boxSizing: 'border-box' as const,
    fontFamily: 'var(--font-mono)', fontSize: 11, marginBottom: 10,
    ...inputStyle,
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', marginBottom: 10 }}>
      <input
        placeholder={placeholder}
        value={value}
        autoComplete="off"
        onChange={e => { onChange(e.target.value); runSearch(e.target.value) }}
        onKeyDown={handleKeyDown}
        style={{ ...base, marginBottom: 0 }}
      />
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 500,
          background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4,
          boxShadow: '0 4px 16px rgba(0,0,0,0.5)', marginTop: 2, overflow: 'hidden',
        }}>
          {results.map((c, i) => (
            <div
              key={c.id}
              onMouseDown={() => select(c)}
              style={{
                padding: '7px 10px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: i === highlighted ? 'rgba(201,168,76,0.12)' : 'transparent',
                fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text)',
              }}
            >
              <span>{`${c.first_name ?? ''} ${c.last_name ?? ''}`.trim()}</span>
              {c.contact_type && (
                <span style={{ fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {c.contact_type}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const BLANK_CONTACT = {
  first_name: '', last_name: '', email: '', phone: '',
  contact_type: 'borrower' as string | null, stage: 'Lead',
  lead_source: '', referred_by: '', referral_type: null as string | null, company_name: '', notes: '',
  co_borrower_first: '', co_borrower_last: '', co_borrower_birthdate: '', co_borrower_mobile: '', co_borrower_email: '',
}

const CONTACTS_PAGE_SIZE = 100

// ── Sortable column header (for @dnd-kit drag reorder) ────────────────────────
function SortableColumnHeader({
  col, sortKey, sortDir, onSort,
}: {
  col: ColumnDef
  sortKey: string
  sortDir: 'asc' | 'desc'
  onSort: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: col.id })
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    padding: '8px 16px',
    textAlign: 'left',
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    letterSpacing: '0.1em',
    color: sortKey === col.id ? '#c9a84c' : 'var(--muted)',
    whiteSpace: 'nowrap',
    userSelect: 'none',
    minWidth: col.minWidth,
    background: 'var(--surface)',
    position: 'sticky' as const,
    top: 0,
    zIndex: 10,
    cursor: isDragging ? 'grabbing' : 'pointer',
    verticalAlign: 'middle',
  }

  return (
    <th ref={setNodeRef} style={style} onClick={onSort}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span
          {...attributes}
          {...listeners}
          onClick={e => e.stopPropagation()}
          style={{
            cursor: 'grab',
            color: 'var(--muted)',
            opacity: 0,
            display: 'flex',
            alignItems: 'center',
            padding: '0 2px',
            // shown via parent :hover via CSS
          }}
          className="col-drag-handle"
        >
          <GripVertical size={12} />
        </span>
        {col.label.toUpperCase()}
        {sortKey === col.id ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}
      </div>
    </th>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function ContactsPage() {
  const supabase = useMemo(() => createClient(), [])
  const { organizationId, userId } = useOrg()
  const router = useRouter()

  // list state
  const [contacts, setContacts]     = useState<Contact[]>([])
  const [loading, setLoading]       = useState(true)
  const [activeList, setActiveList] = useState('active')
  const [search, setSearch]         = useState('')
  const [sort, setSort]             = useState<SortConfig>({ key: 'last_name', dir: 'asc' })
  const [total, setTotal]           = useState(0)
  const [counts, setCounts]         = useState<Record<string, number>>({})
  const [hasMore, setHasMore]       = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const offsetRef                   = useRef(0)

  // slide-out
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [editMode, setEditMode]               = useState(false)
  const [editData, setEditData]               = useState<Partial<Contact>>({})
  const [saving, setSaving]                   = useState(false)
  const [contactLoans, setContactLoans]       = useState<ContactLoan[]>([])
  const [contactLoansLoading, setContactLoansLoading] = useState(false)

  // new contact modal
  const [showNewContact, setShowNewContact] = useState(false)
  const [newContact, setNewContact]     = useState({ ...BLANK_CONTACT })
  const [creating, setCreating]         = useState(false)
  const [createError, setCreateError]   = useState<string | null>(null)
  const [showCoBorrower, setShowCoBorrower] = useState(false)

  // column picker + order
  const [visibleColumns, setVisibleColumns] = useState<string[]>(DEFAULT_COLUMNS)
  const [showColPicker, setShowColPicker]   = useState(false)
  const [columnOrder, setColumnOrder]       = useState<string[]>(DRAGGABLE_COL_IDS)

  // @dnd-kit sensors for column reorder
  const dndSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  // import modal
  const [showImport, setShowImport]     = useState(false)
  const [csvRows, setCsvRows]           = useState<Record<string, string>[]>([])
  const [csvImporting, setCsvImporting] = useState(false)
  const [importBanner, setImportBanner] = useState<string | null>(null)

  // ── Feature 1: inline stage editing ─────────────────────────────────────
  const [editingStageId, setEditingStageId] = useState<string | null>(null)

  // ── Feature 3: bulk actions ──────────────────────────────────────────────
  const [selectedIds, setSelectedIds]       = useState<Set<string>>(new Set())
  const [bulkAction, setBulkAction]         = useState<BulkAction>(null)
  const [bulkValue, setBulkValue]           = useState('')
  const [bulkProcessing, setBulkProcessing] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  // ── Outreach chat integration ─────────────────────────────────────────
  const { openWithContacts } = useOutreachChat()

  // ── Custom lists ────────────────────────────────────────────────────────
  const [customLists, setCustomLists] = useState<CustomList[]>([])
  const [showNewListModal, setShowNewListModal] = useState(false)
  const [newListName, setNewListName] = useState('')
  const [newListRules, setNewListRules] = useState<CustomListRule[]>([{ field: 'stage', operator: 'is', value: '' }])
  const [deleteListId, setDeleteListId] = useState<string | null>(null)
  const [editingListId, setEditingListId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table')
  const [kanbanContacts, setKanbanContacts] = useState<Record<string, Contact[]>>({})
  const [kanbanLoading, setKanbanLoading] = useState(false)

  // sidebar collapse: default collapsed when viewport < 1280px; toggle overrides
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sidebarCollapsedUser, setSidebarCollapsedUser] = useState<boolean | null>(null)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1279px)')
    const sync = () => setSidebarCollapsed(sidebarCollapsedUser ?? mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [sidebarCollapsedUser])


  // init columns + column order from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_COLUMNS_KEY)
      if (stored) setVisibleColumns(JSON.parse(stored))
    } catch {}
    try {
      const storedOrder = localStorage.getItem(LS_COL_ORDER_KEY)
      if (storedOrder) {
        const parsed: string[] = JSON.parse(storedOrder)
        // Merge: keep stored order, add any new columns at the end
        const merged = [
          ...parsed.filter(id => DRAGGABLE_COL_IDS.includes(id)),
          ...DRAGGABLE_COL_IDS.filter(id => !parsed.includes(id)),
        ]
        setColumnOrder(merged)
      }
    } catch {}
  }, [])

  // load custom lists from localStorage (contacts only)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_CUSTOM_LISTS_KEY)
      if (stored) {
        const all: CustomList[] = JSON.parse(stored)
        setCustomLists(all.filter(l => l.page === 'contacts'))
      }
    } catch {}
  }, [])

  // fetch loans for selected contact
  useEffect(() => {
    const id = selectedContact?.id
    if (!id) { setContactLoans([]); return }
    setContactLoansLoading(true)
    supabase
      .from('loans')
      .select('id, loan_name, borrower_name, borrower_first_name, borrower_last_name, status, loan_amount, closing_date')
      .eq('contact_id', id)
      .order('closing_date', { ascending: false, nullsFirst: false })
      .then(({ data }) => {
        setContactLoans(data || [])
        setContactLoansLoading(false)
      })
  }, [selectedContact?.id, supabase])

  // ── fetchCounts ─────────────────────────────────────────────────────────────
  const fetchCounts = useCallback(async () => {
    const h = { count: 'exact', head: true } as const
    const base = [
      supabase.from('contacts').select('*', h),
      supabase.from('contacts').select('*', h).eq('contact_type', 'borrower').in('stage', ['Pre-Approved']),
      supabase.from('contacts').select('*', h).eq('contact_type', 'borrower'),
      supabase.from('contacts').select('*', h).eq('contact_type', 'borrower').in('stage', ['Lead', 'Pre-App', 'Application']),
      supabase.from('contacts').select('*', h).eq('contact_type', 'borrower').in('stage', ['In Process', 'Closing']),
      supabase.from('contacts').select('*', h).eq('contact_type', 'borrower').in('stage', ['Closed']),
      supabase.from('contacts').select('*', h).eq('contact_type', 'realtor'),
      supabase.from('contacts').select('*', h).eq('contact_type', 'realtor').not('production_tier', 'is', null),
      supabase.from('contacts').select('*', h).or(
        'contact_type.eq.other,contact_type.eq.advisor,contact_type.eq.title,contact_type.eq.insurance,' +
        'contact_type.is.null,and(contact_type.eq.borrower,stage.is.null)'
      ),
      supabase.from('contacts').select('*', h).eq('contact_type', 'realtor').gte('deals_ytd_count', 1),
      supabase.from('contacts').select('*', h).eq('contact_type', 'realtor').gte('referral_ytd_count', 2),
      (() => { const c = new Date(Date.now() - 60*24*60*60*1000).toISOString().split('T')[0]; return supabase.from('contacts').select('*', h).eq('contact_type', 'realtor').or(`last_outreach_date.is.null,last_outreach_date.lt.${c}`) })(),
      (() => { const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); const s = d.toISOString().split('T')[0]; return supabase.from('contacts').select('*', h).eq('contact_type', 'realtor').eq('production_tier', 'A').or(`last_outreach_date.is.null,last_outreach_date.lt.${s}`) })(),
    ]
    const builtInIds = ['all', 'active', 'all-borrowers', 'new-apps', 'in-process', 'closed', 'all-realtors', 'top-realtors', 'unassigned', 'active_deal_partners', 'top_producers', 'due_for_outreach', 'tier_a_not_this_month']
    const results = await Promise.all(base)
    const next: Record<string, number> = {}
    builtInIds.forEach((id, i) => { next[id] = results[i].count ?? 0 })
    for (const list of customLists) {
      let q = supabase.from('contacts').select('*', h)
      if (list.rules?.length) q = applyCustomListRulesContact(q, list.rules)
      const { count } = await q
      next[list.id] = count ?? 0
    }
    setCounts(next)
  }, [supabase, customLists])

  // ── fetchContacts ────────────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buildContactQuery = useCallback((q: any) => {
    if (activeList.startsWith('custom-')) {
      const custom = customLists.find(l => l.id === activeList)
      if (custom?.rules?.length) q = applyCustomListRulesContact(q, custom.rules)
    } else {
      q = applySmartList(q, activeList)
    }
    if (search.trim()) {
      const s = `%${search.trim()}%`
      q = q.or(`first_name.ilike.${s},last_name.ilike.${s},email.ilike.${s},phone.ilike.${s}`)
    }
    return q
  }, [activeList, search, customLists])

  const fetchContacts = useCallback(async () => {
    setLoading(true)
    offsetRef.current = 0
    let q = buildContactQuery(supabase.from('contacts').select('*'))
    q = q.order(sort.key as string, { ascending: sort.dir === 'asc' })
         .range(0, CONTACTS_PAGE_SIZE - 1)
    const { data, error } = await q
    if (!error) {
      setContacts(data ?? [])
      setTotal(data?.length ?? 0)
      setHasMore((data?.length ?? 0) === CONTACTS_PAGE_SIZE)
    }
    setLoading(false)
    setSelectedIds(new Set())
  }, [supabase, buildContactQuery, sort])

  const loadMoreContacts = useCallback(async () => {
    setLoadingMore(true)
    const nextOffset = offsetRef.current + CONTACTS_PAGE_SIZE
    let q = buildContactQuery(supabase.from('contacts').select('*'))
    q = q.order(sort.key as string, { ascending: sort.dir === 'asc' })
         .range(nextOffset, nextOffset + CONTACTS_PAGE_SIZE - 1)
    const { data, error } = await q
    if (!error && data) {
      offsetRef.current = nextOffset
      setContacts(prev => [...prev, ...data])
      setTotal(prev => prev + data.length)
      setHasMore(data.length === CONTACTS_PAGE_SIZE)
    }
    setLoadingMore(false)
  }, [supabase, buildContactQuery, sort])

  useEffect(() => { fetchContacts() }, [fetchContacts])
  useEffect(() => { fetchCounts()   }, [fetchCounts])

  const fetchKanbanContacts = useCallback(async () => {
    setKanbanLoading(true)
    const grouped: Record<string, Contact[]> = {}
    STAGES.forEach(s => { grouped[s] = [] })
    await Promise.all(
      STAGES.map(async stage => {
        let q = buildContactQuery(supabase.from('contacts').select('*'))
        q = q.eq('stage', stage).order('updated_at', { ascending: false }).limit(50)
        const { data } = await q
        grouped[stage] = data ?? []
      })
    )
    setKanbanContacts(grouped)
    setKanbanLoading(false)
  }, [supabase, buildContactQuery])

  useEffect(() => {
    if (viewMode === 'kanban') fetchKanbanContacts()
  }, [viewMode, fetchKanbanContacts])

  // ── Sort ─────────────────────────────────────────────────────────────────
  function handleSort(key: keyof Contact) {
    setSort(prev => ({ key, dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc' }))
  }

  // ── Kanban drag ───────────────────────────────────────────────────────────
  async function handleDragEnd(result: DropResult) {
    if (!result.destination) return
    const { draggableId: contactId, source, destination } = result
    if (source.droppableId === destination.droppableId) return
    const fromStage = source.droppableId
    const toStage = destination.droppableId
    // Optimistic update — move card immediately in local state
    setKanbanContacts(prev => {
      const fromList = [...(prev[fromStage] ?? [])]
      const idx = fromList.findIndex(c => c.id === contactId)
      if (idx === -1) return prev
      const [moved] = fromList.splice(idx, 1)
      const toList = [...(prev[toStage] ?? [])]
      toList.splice(destination.index, 0, { ...moved, stage: toStage })
      return { ...prev, [fromStage]: fromList, [toStage]: toList }
    })
    // Persist to Supabase
    const { error } = await supabase
      .from('contacts')
      .update({ stage: normalizeContactStage(toStage), updated_at: new Date().toISOString() })
      .eq('id', contactId)
    if (error) {
      console.error('Stage update failed:', error)
      fetchKanbanContacts() // revert on error
    }
  }

  // ── Column picker ─────────────────────────────────────────────────────────
  function toggleColumn(id: string) {
    setVisibleColumns(prev => {
      const next = prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
      localStorage.setItem(LS_COLUMNS_KEY, JSON.stringify(next))
      return next
    })
  }

  // ── Feature 1: inline stage change ───────────────────────────────────────
  async function handleStageChange(contactId: string, newStage: string) {
    setEditingStageId(null)
    const contact = contacts.find(c => c.id === contactId)
    if (!contact) return
    const stageValue = newStage || null
    const newList = stageToList(stageValue, contact.contact_type)
    const shouldRemove = activeList !== 'all' && newList !== activeList

    if (shouldRemove) {
      setContacts(prev => prev.filter(c => c.id !== contactId))
      setTotal(prev => Math.max(0, prev - 1))
      if (selectedContact?.id === contactId) setSelectedContact(null)
    } else {
      setContacts(prev => prev.map(c => c.id === contactId ? { ...c, stage: stageValue } : c))
      if (selectedContact?.id === contactId)
        setSelectedContact(prev => prev ? { ...prev, stage: stageValue } : null)
    }
    await supabase.from('contacts').update({ stage: normalizeContactStage(stageValue) }).eq('id', contactId)
    updateLastTouch(supabase, contactId, 'stage_changed', `Stage changed to ${stageValue ?? '(none)'}`)
    fetchCounts()
  }

  // ── Feature 3: checkbox selection ────────────────────────────────────────
  function toggleSelect(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  function toggleSelectAll() {
    if (selectedIds.size === contacts.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(contacts.map(c => c.id)))
    }
  }

  // ── Feature 3: bulk update ────────────────────────────────────────────────
  async function handleBulkUpdate() {
    if (!bulkAction || !bulkValue || selectedIds.size === 0) return
    setBulkProcessing(true)
    const ids = Array.from(selectedIds)
    const field = bulkAction === 'stage' ? 'stage' : bulkAction === 'type' ? 'contact_type' : 'referred_by'
    const writeValue = field === 'stage' ? normalizeContactStage(bulkValue) : bulkValue
    await supabase.from('contacts').update({ [field]: writeValue }).in('id', ids)
    setBulkAction(null)
    setBulkValue('')
    await Promise.all([fetchContacts(), fetchCounts()])
    setBulkProcessing(false)
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return
    setBulkProcessing(true)
    const ids = Array.from(selectedIds)
    await supabase.from('contacts').delete().in('id', ids)
    setDeleteConfirmOpen(false)
    setBulkAction(null)
    await Promise.all([fetchContacts(), fetchCounts()])
    setBulkProcessing(false)
  }

  // ── Edit / Create handlers ─────────────────────────────────────────────
  async function handleSaveEdit() {
    if (!selectedContact) return
    setSaving(true)
    const { error } = await supabase.from('contacts').update(editData as any).eq('id', selectedContact.id) // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!error) {
      setEditMode(false)
      setSelectedContact(prev => prev ? { ...prev, ...editData } as Contact : null)
      updateLastTouch(supabase, selectedContact.id, 'contact_updated', 'Updated contact record', undefined, { fields: Object.keys(editData) })
      await Promise.all([fetchContacts(), fetchCounts()])
    }
    setSaving(false)
  }

  async function handleCreate() {
    setCreating(true); setCreateError(null)
    const first = (newContact.first_name ?? '').trim()
    const last = (newContact.last_name ?? '').trim()
    if (!last) {
      setCreateError('Last name is required.')
      setCreating(false)
      return
    }
    if (!userId) {
      setCreateError('You are not signed in. Please refresh and log in again.')
      setCreating(false)
      return
    }
    const raw = {
      ...newContact,
      first_name: first,
      last_name: last,
      contact_type: newContact.contact_type || 'other',
      stage: normalizeContactStage(newContact.stage),
      user_id: userId,
      organization_id: organizationId,
    }
    // Convert empty strings to null so date/typed columns don't receive ""
    const payload = Object.fromEntries(
      Object.entries(raw).map(([k, v]) => [k, v === '' ? null : v])
    )
    const { data, error } = await supabase.from('contacts').insert([payload as any]).select('id') // eslint-disable-line @typescript-eslint/no-explicit-any
    if (error) {
      setCreateError(error.message)
    } else {
      const newId = data?.[0]?.id
      setShowNewContact(false)
      setNewContact({ ...BLANK_CONTACT })
      if (newId) {
        router.push(`/dashboard/contacts/${newId}`)
      } else {
        await Promise.all([fetchContacts(), fetchCounts()])
      }
    }
    setCreating(false)
  }

  function persistCustomLists(lists: CustomList[]) {
    try {
      const existing = localStorage.getItem(LS_CUSTOM_LISTS_KEY)
      const all: CustomList[] = existing ? JSON.parse(existing) : []
      const others = all.filter(l => l.page !== 'contacts')
      localStorage.setItem(LS_CUSTOM_LISTS_KEY, JSON.stringify([...others, ...lists]))
    } catch {}
  }

  function handleSaveNewList() {
    const name = newListName.trim()
    if (!name) return
    const rules = newListRules.filter(r => r.value?.trim())
    let next: CustomList[]
    if (editingListId) {
      // Edit mode: overwrite matching list by id
      next = customLists.map(l =>
        l.id === editingListId ? { ...l, name, rules } : l
      )
    } else {
      // Create mode: new list with fresh UUID
      const list: CustomList = {
        id: `custom-${crypto.randomUUID()}`,
        name,
        page: 'contacts',
        rules,
      }
      next = [...customLists, list]
      setActiveList(list.id)
    }
    setCustomLists(next)
    persistCustomLists(next.filter(l => l.page === 'contacts'))
    setShowNewListModal(false)
    setEditingListId(null)
    fetchCounts()
    fetchContacts()
  }

  function openEditModal(cl: CustomList) {
    setNewListName(cl.name)
    setNewListRules(cl.rules?.length ? cl.rules : [{ field: 'stage', operator: 'is', value: '' }])
    setEditingListId(cl.id)
    setShowNewListModal(true)
  }

  function handleDeleteList() {
    if (!deleteListId) return
    const next = customLists.filter(l => l.id !== deleteListId)
    setCustomLists(next)
    persistCustomLists(next)
    if (activeList === deleteListId) setActiveList('all')
    setDeleteListId(null)
    fetchCounts()
    fetchContacts()
  }

  // ── Column reorder handler ────────────────────────────────────────────────
  function handleColDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setColumnOrder(prev => {
      const oldIdx = prev.indexOf(active.id as string)
      const newIdx = prev.indexOf(over.id as string)
      const next = arrayMove(prev, oldIdx, newIdx)
      localStorage.setItem(LS_COL_ORDER_KEY, JSON.stringify(next))
      return next
    })
  }

  // ── Derived ───────────────────────────────────────────────────────────────
  const activeListLabel = activeList.startsWith('custom-')
    ? (customLists.find(l => l.id === activeList)?.name ?? 'Custom List')
    : (SMART_LISTS.find(l => l.id === activeList)?.label ?? 'All Contacts')

  // Name column is always pinned first; other visible columns follow columnOrder
  const nameColDef = ALL_COLUMNS.find(c => c.id === 'name')!
  const draggableColDefs = columnOrder
    .map(id => ALL_COLUMNS.find(c => c.id === id))
    .filter((c): c is ColumnDef => !!c && c.id !== 'name' && visibleColumns.includes(c.id))

  const allSelected     = contacts.length > 0 && selectedIds.size === contacts.length
  const someSelected    = selectedIds.size > 0


  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full" style={{ background: 'var(--bg)', color: 'var(--fg)' }}>

      {/* ── Sidebar (collapses to icon rail under 1280px or via toggle) ───── */}
      <aside
        className="flex-shrink-0 border-r overflow-y-auto flex flex-col"
        style={{
          width: sidebarCollapsed ? 52 : 200,
          borderColor: 'var(--border)',
          background: 'var(--surface)',
          transition: 'width 0.2s ease',
        }}
      >
        <div className="px-2 py-3 flex items-center justify-between" style={{ minHeight: 40 }}>
          {!sidebarCollapsed && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: '0.12em' }}>
              SMART LISTS
            </div>
          )}
          <button
            type="button"
            onClick={() => setSidebarCollapsedUser(prev => (prev === null ? !sidebarCollapsed : !prev))}
            style={{
              padding: 4, background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 10,
            }}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? '›' : '‹'}
          </button>
        </div>
        <div className="px-2 pb-4">
          {SMART_LISTS.map(list => {
            const isActive = activeList === list.id
            const initial = list.label.charAt(0)
            return (
              <div key={list.id}>
                {list.section && !sidebarCollapsed && (
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--muted)', letterSpacing: '0.15em', marginTop: 10, marginBottom: 4, paddingLeft: 6, opacity: 0.6 }}>
                    {list.section}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => { setActiveList(list.id); setSelectedContact(null); setSelectedIds(new Set()) }}
                  className="w-full text-left rounded flex items-center justify-between"
                  style={{
                    fontFamily: 'var(--font-mono)', fontSize: 11,
                    padding: sidebarCollapsed ? '6px 8px' : '5px 8px',
                    background: isActive ? 'rgba(201,168,76,0.12)' : 'transparent',
                    color: isActive ? '#c9a84c' : 'var(--fg)',
                    border: isActive ? '1px solid rgba(201,168,76,0.25)' : '1px solid transparent',
                    marginBottom: 2,
                  }}
                  title={sidebarCollapsed ? list.label : undefined}
                >
                  {sidebarCollapsed ? (
                    <span style={{ fontWeight: 600, fontSize: 12 }}>{initial}</span>
                  ) : (
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{list.label}</span>
                  )}
                  <span style={{ opacity: 0.7, fontSize: 10, flexShrink: 0, marginLeft: 4 }}>{counts[list.id] ?? 0}</span>
                </button>
              </div>
            )
          })}
          {/* Custom lists */}
          {customLists.map(cl => {
            const isActive = activeList === cl.id
            const initial = cl.name.charAt(0)
            return (
              <div key={cl.id} className="flex items-center gap-1" style={{ marginBottom: 2 }}>
                <button
                  type="button"
                  onClick={() => { setActiveList(cl.id); setSelectedContact(null); setSelectedIds(new Set()) }}
                  className="w-full text-left rounded flex items-center justify-between flex-1 min-w-0"
                  style={{
                    fontFamily: 'var(--font-mono)', fontSize: 11,
                    padding: sidebarCollapsed ? '6px 8px' : '5px 8px',
                    background: isActive ? 'rgba(201,168,76,0.12)' : 'transparent',
                    color: isActive ? '#c9a84c' : 'var(--fg)',
                    border: isActive ? '1px solid rgba(201,168,76,0.25)' : '1px solid transparent',
                  }}
                  title={sidebarCollapsed ? cl.name : undefined}
                >
                  {sidebarCollapsed ? (
                    <span style={{ fontWeight: 600, fontSize: 12 }}>{initial}</span>
                  ) : (
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cl.name}</span>
                  )}
                  <span style={{ opacity: 0.7, fontSize: 10, flexShrink: 0, marginLeft: 4 }}>{counts[cl.id] ?? 0}</span>
                </button>
                {!sidebarCollapsed && (
                  <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); openEditModal(cl) }}
                      style={{ padding: '3px 4px', color: 'var(--muted)', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      title="Edit list"
                    >
                      <Pencil size={11} />
                    </button>
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); setDeleteListId(cl.id) }}
                      style={{ padding: '3px 4px', color: 'var(--muted)', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      title="Delete list"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
          <button
            type="button"
            onClick={() => { setShowNewListModal(true); setNewListName(''); setNewListRules([{ field: 'stage', operator: 'is', value: '' }]); setEditingListId(null) }}
            style={{
              fontFamily: 'var(--font-mono)', fontSize: 10, color: '#c9a84c', background: 'transparent',
              border: '1px dashed rgba(201,168,76,0.5)', padding: '6px 8px', borderRadius: 4, cursor: 'pointer',
              marginTop: 8, width: '100%',
            }}
          >
            + New List
          </button>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
             style={{ borderColor: 'var(--border)' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, letterSpacing: '0.05em', lineHeight: 1 }}>
              {activeListLabel.toUpperCase()}
            </h1>
            <div style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 11, marginTop: 2 }}>
              {counts[activeList] && counts[activeList] > total
                ? <>{total.toLocaleString()} of {counts[activeList].toLocaleString()} {counts[activeList] === 1 ? 'contact' : 'contacts'}</>
                : <>{total.toLocaleString()} {total === 1 ? 'contact' : 'contacts'}</>
              }
              {someSelected && <span style={{ marginLeft: 8, color: '#c9a84c' }}>· {selectedIds.size} selected</span>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowImport(true)} style={{
              fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em',
              background: 'transparent', color: '#c9a84c', padding: '8px 16px', borderRadius: 4,
              border: '1px solid rgba(201,168,76,0.4)', cursor: 'pointer', fontWeight: 600,
            }}>↑ IMPORT</button>
            <button onClick={() => setShowNewContact(true)} style={{
              fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em',
              background: '#c9a84c', color: '#000', padding: '8px 16px', borderRadius: 4,
              border: 'none', cursor: 'pointer', fontWeight: 600,
            }}>+ NEW CONTACT</button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-3 px-6 py-3 border-b flex-shrink-0"
             style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
          {/* Quick filter dropdown */}
          <select
            value={QUICK_FILTERS.some(f => f.id === activeList) ? activeList : 'all'}
            onChange={e => { setActiveList(e.target.value); setSelectedContact(null); setSelectedIds(new Set()) }}
            style={{
              fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.06em',
              background: 'var(--bg)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.4)',
              borderRadius: 4, padding: '6px 10px', cursor: 'pointer', outline: 'none', flexShrink: 0,
            }}
          >
            {QUICK_FILTERS.map(f => (
              <option key={f.id} value={f.id}>{f.label}</option>
            ))}
          </select>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search contacts…"
            style={{
              flex: 1, background: 'var(--bg)', color: 'var(--fg)', border: '1px solid var(--border)',
              borderRadius: 4, padding: '6px 10px', fontFamily: 'var(--font-mono)', fontSize: 12, outline: 'none',
            }}
          />
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowColPicker(p => !p)} style={{
              fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em',
              background: 'transparent', color: 'var(--muted)', padding: '6px 12px',
              border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer',
            }}>COLUMNS ▾</button>
            {showColPicker && (
              <div
                role="listbox"
                style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: 4, zIndex: 100,
                  background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6,
                  padding: '8px 0', minWidth: 200, boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                }}
              >
                {ALL_COLUMNS.map(col => (
                  <label key={col.id} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '5px 14px',
                    cursor: col.id === 'name' ? 'default' : 'pointer',
                    fontFamily: 'var(--font-mono)', fontSize: 11,
                    color: col.id === 'name' ? 'var(--muted)' : 'var(--fg)',
                    opacity: col.id === 'name' ? 0.5 : 1,
                  }}>
                    <input
                      type="checkbox"
                      checked={col.id === 'name' ? true : visibleColumns.includes(col.id)}
                      disabled={col.id === 'name'}
                      onChange={() => col.id !== 'name' && toggleColumn(col.id)}
                      onClick={e => e.stopPropagation()}
                      style={{ accentColor: '#c9a84c', cursor: col.id === 'name' ? 'default' : 'pointer' }}
                    />
                    {col.label}{col.id === 'name' ? ' (pinned)' : ''}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* View mode toggle */}
          <div style={{ display: 'flex', borderRadius: 4, border: '1px solid var(--border)', overflow: 'hidden', flexShrink: 0 }}>
            <button
              onClick={() => setViewMode('table')}
              style={{
                padding: '5px 14px', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em',
                cursor: 'pointer', border: 'none',
                background: viewMode === 'table' ? '#c9a84c' : 'transparent',
                color: viewMode === 'table' ? '#000' : 'var(--muted)', fontWeight: 600,
              }}>
              TABLE
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              style={{
                padding: '5px 14px', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em',
                cursor: 'pointer', border: 'none',
                background: viewMode === 'kanban' ? '#c9a84c' : 'transparent',
                color: viewMode === 'kanban' ? '#000' : 'var(--muted)', fontWeight: 600,
              }}>
              KANBAN
            </button>
          </div>
        </div>

        {/* Kanban board */}
        {viewMode === 'kanban' && (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div style={{
              flex: 1, overflowX: 'auto', overflowY: 'hidden', display: 'flex', gap: 14,
              padding: '16px 24px', minHeight: 0, alignItems: 'flex-start',
            }}>
              {kanbanLoading ? (
                <div style={{ padding: 48, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)' }}>LOADING…</div>
              ) : (
                STAGES.map(stage => (
                  <div key={stage} style={{ display: 'flex', flexDirection: 'column', flex: '0 0 230px', maxHeight: '100%' }}>
                    {/* Column header */}
                    <div style={{
                      padding: '7px 10px', marginBottom: 8, borderRadius: 4,
                      background: 'var(--surface)', border: '1px solid var(--border)',
                      fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em',
                      color: 'var(--muted)', display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', flexShrink: 0,
                    }}>
                      <span>{stage.toUpperCase()}</span>
                      <span style={{ color: '#c9a84c' }}>{(kanbanContacts[stage] ?? []).length}</span>
                    </div>
                    {/* Droppable column */}
                    <Droppable droppableId={stage}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          style={{
                            flex: 1, overflowY: 'auto', borderRadius: 4, padding: 4, minHeight: 80,
                            background: snapshot.isDraggingOver ? 'rgba(201,168,76,0.06)' : 'transparent',
                            border: snapshot.isDraggingOver ? '1px dashed rgba(201,168,76,0.35)' : '1px solid transparent',
                            transition: 'background 0.15s, border 0.15s',
                          }}
                        >
                          {(kanbanContacts[stage] ?? []).map((contact, index) => (
                            <Draggable key={contact.id} draggableId={contact.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  onClick={() => { setSelectedContact(contact); setEditMode(false); setEditData({}) }}
                                  style={{
                                    ...provided.draggableProps.style,
                                    padding: '9px 11px', marginBottom: 5, borderRadius: 4,
                                    background: snapshot.isDragging ? 'rgba(201,168,76,0.12)' : 'var(--surface)',
                                    border: snapshot.isDragging ? '1px solid rgba(201,168,76,0.6)' : '1px solid var(--border)',
                                    cursor: 'grab', fontFamily: 'var(--font-mono)',
                                    boxShadow: snapshot.isDragging ? '0 6px 20px rgba(0,0,0,0.5)' : 'none',
                                    transition: snapshot.isDragging ? 'none' : 'border 0.15s, background 0.15s',
                                  }}
                                >
                                  <div style={{ fontSize: 12, color: 'var(--fg)', fontWeight: 600, marginBottom: 2 }}>
                                    {[contact.first_name, contact.last_name].filter(Boolean).join(' ') || '(No Name)'}
                                  </div>
                                  {contact.email && (
                                    <div style={{ fontSize: 10, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {contact.email}
                                    </div>
                                  )}
                                  {contact.phone && (
                                    <div style={{ fontSize: 10, color: 'var(--muted)' }}>{contact.phone}</div>
                                  )}
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                ))
              )}
            </div>
          </DragDropContext>
        )}

        {/* Table */}
        <div
          className="flex-1"
          style={{
            display: viewMode === 'kanban' ? 'none' : 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Scrollable table container */}
          <div
            style={{
              flex: 1,
              overflowX: 'auto',
              overflowY: 'auto',
              // Dark gold scrollbar
              scrollbarWidth: 'thin',
              scrollbarColor: '#C9A84C44 transparent',
            }}
          >
            <style>{`
              .contacts-scroll::-webkit-scrollbar { height: 6px; width: 6px; }
              .contacts-scroll::-webkit-scrollbar-track { background: transparent; }
              .contacts-scroll::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.35); border-radius: 3px; }
              .contacts-scroll::-webkit-scrollbar-thumb:hover { background: rgba(201,168,76,0.6); }
              th:hover .col-drag-handle { opacity: 1 !important; }
            `}</style>
            <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={handleColDragEnd}>
            <div
              className="contacts-scroll"
              style={{ height: '100%', overflowX: 'auto', overflowY: 'auto' }}
            >
              {loading ? (
                <div style={{ padding: 48, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)' }}>LOADING…</div>
              ) : contacts.length === 0 ? (
                <div style={{ padding: 48, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)' }}>NO CONTACTS FOUND</div>
              ) : (
                <table style={{ minWidth: 'max-content', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                  <thead>
                      <SortableContext items={columnOrder} strategy={horizontalListSortingStrategy}>
                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                          {/* Checkbox header — sticky left */}
                          <th
                            style={{
                              padding: '8px 12px', width: 36, position: 'sticky', left: 0,
                              top: 0, zIndex: 30, background: 'var(--surface)',
                            }}
                            onClick={e => e.stopPropagation()}
                          >
                            <input type="checkbox" checked={allSelected} onChange={toggleSelectAll}
                                   style={{ accentColor: '#c9a84c', cursor: 'pointer' }} />
                          </th>
                          {/* Name column — sticky after checkbox */}
                          <th
                            onClick={() => handleSort('first_name' as keyof Contact)}
                            style={{
                              padding: '8px 16px', textAlign: 'left', cursor: 'pointer',
                              fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em',
                              color: sort.key === 'first_name' ? '#c9a84c' : 'var(--muted)',
                              whiteSpace: 'nowrap', userSelect: 'none',
                              minWidth: nameColDef.minWidth,
                              position: 'sticky', left: 36, top: 0, zIndex: 30,
                              background: 'var(--surface)',
                              borderRight: '1px solid var(--border)',
                            }}
                          >
                            {nameColDef.label.toUpperCase()}
                          </th>
                          {/* Draggable column headers */}
                          {draggableColDefs.map(col => (
                            <SortableColumnHeader
                              key={col.id}
                              col={col}
                              sortKey={sort.key as string}
                              sortDir={sort.dir}
                              onSort={() => handleSort(col.id as keyof Contact)}
                            />
                          ))}
                        </tr>
                      </SortableContext>
                  </thead>
                  <tbody>
                    {contacts.map((contact, i) => {
                      const isSelected = selectedIds.has(contact.id)
                      const isActive   = selectedContact?.id === contact.id
                      const rowBg      = isSelected
                        ? 'rgba(201,168,76,0.06)'
                        : isActive
                          ? 'rgba(201,168,76,0.08)'
                          : i % 2 === 0 ? 'var(--bg)' : 'rgba(255,255,255,0.02)'
                      // Pinned cells need explicit bg matching the row
                      const pinnedBg   = isSelected
                        ? 'rgba(21,18,10,1)'
                        : isActive
                          ? 'rgba(22,19,11,1)'
                          : i % 2 === 0 ? 'var(--bg)' : 'rgb(14,14,16)'

                      return (
                        <tr
                          key={contact.id}
                          onClick={() => { setSelectedContact(contact); setEditMode(false); setEditData({}) }}
                          style={{ borderBottom: '1px solid var(--border)', background: rowBg, cursor: 'pointer' }}
                          onMouseEnter={e => {
                            if (!isSelected && !isActive)
                              (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'
                          }}
                          onMouseLeave={e => {
                            if (!isSelected && !isActive)
                              (e.currentTarget as HTMLElement).style.background = rowBg
                          }}
                        >
                          {/* Checkbox — sticky left */}
                          <td
                            style={{ padding: '9px 12px', position: 'sticky', left: 0, zIndex: 10, background: pinnedBg }}
                            onClick={e => toggleSelect(contact.id, e)}
                          >
                            <input type="checkbox" checked={isSelected}
                                   onChange={() => {}} style={{ accentColor: '#c9a84c', cursor: 'pointer' }} />
                          </td>

                          {/* Name — sticky after checkbox */}
                          <td
                            style={{
                              padding: '9px 16px', position: 'sticky', left: 36, zIndex: 10,
                              background: pinnedBg, borderRight: '1px solid var(--border)',
                              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                              minWidth: nameColDef.minWidth, maxWidth: nameColDef.minWidth,
                            }}
                          >
                            {nameColDef.render(contact)}
                          </td>

                          {/* Data cells */}
                          {draggableColDefs.map(col => (
                            <td key={col.id} style={{ padding: '9px 16px', color: 'var(--fg)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: col.minWidth }}>
                              {col.id === 'stage' ? (
                                editingStageId === contact.id ? (
                                  <select
                                    autoFocus
                                    defaultValue={contact.stage ?? ''}
                                    onChange={e => handleStageChange(contact.id, e.target.value)}
                                    onBlur={() => setEditingStageId(null)}
                                    onClick={e => e.stopPropagation()}
                                    style={{ background: 'var(--bg)', color: 'var(--fg)', border: '1px solid var(--border)', borderRadius: 3, fontFamily: 'var(--font-mono)', fontSize: 11, padding: '2px 4px' }}>
                                    <option value="">— No Stage —</option>
                                    {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                                  </select>
                                ) : (
                                  <span
                                    onClick={e => { e.stopPropagation(); setEditingStageId(contact.id) }}
                                    style={getStageBadgeStyle(contact.stage)}>
                                    {contact.stage ?? '—'}
                                  </span>
                                )
                              ) : col.render(contact)}
                            </td>
                          ))}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
              {/* Load More */}
              {hasMore && !loading && (
                <div className="flex justify-center py-4 border-t border-zinc-700">
                  <button
                    onClick={loadMoreContacts}
                    disabled={loadingMore}
                    className="px-5 py-2 text-xs font-mono tracking-widest uppercase border border-zinc-600 rounded text-zinc-400 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loadingMore ? 'Loading…' : `Load more (showing ${contacts.length}${counts[activeList] ? ` of ${counts[activeList]}` : ''})`}
                  </button>
                </div>
              )}
            </div>
            </DndContext>
          </div>
        </div>
      </div>

      {/* ── Slide-out panel ──────────────────────────────────────────────── */}
      {selectedContact && (
        <aside style={{
          width: 360, borderLeft: '1px solid var(--border)', background: 'var(--surface)',
          overflowY: 'auto', flexShrink: 0, display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, letterSpacing: '0.04em' }}>
                {`${selectedContact.first_name ?? ''} ${selectedContact.last_name ?? ''}`.trim() || '—'}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>
                {selectedContact.contact_type?.toUpperCase() ?? '—'} · {selectedContact.stage ?? '—'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {!editMode && (
                <button onClick={() => { setEditMode(true); setEditData({ ...selectedContact }) }} style={{
                  fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em',
                  background: 'transparent', color: '#c9a84c', border: '1px solid #c9a84c',
                  padding: '4px 10px', borderRadius: 4, cursor: 'pointer',
                }}>EDIT</button>
              )}
              <button onClick={() => { setSelectedContact(null); setEditMode(false) }} style={{
                fontFamily: 'var(--font-mono)', fontSize: 10, background: 'transparent',
                color: 'var(--muted)', border: '1px solid var(--border)', padding: '4px 8px',
                borderRadius: 4, cursor: 'pointer',
              }}>✕</button>
            </div>
          </div>

          <div style={{ padding: '16px 24px', flex: 1 }}>
            {editMode ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {([
                  ['First Name', 'first_name'], ['Last Name', 'last_name'], ['Email', 'email'],
                  ['Phone', 'phone'], ['Stage', 'stage'],
                  ['Lead Source', 'lead_source'], ['Referred By', 'referred_by'],
                  ['Company', 'company_name'], ['Notes', 'notes'],
                ] as [string, keyof Contact][]).map(([label, field]) => (
                  <div key={field}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: 4 }}>{label.toUpperCase()}</div>
                    {field === 'notes' ? (
                      <textarea value={(editData[field] as string) ?? ''} rows={3}
                        onChange={e => setEditData(p => ({ ...p, [field]: e.target.value }))}
                        style={{ width: '100%', background: 'var(--bg)', color: 'var(--fg)', border: '1px solid var(--border)', borderRadius: 4, padding: '6px 8px', fontFamily: 'var(--font-mono)', fontSize: 12, resize: 'vertical', boxSizing: 'border-box' }} />
                    ) : field === 'stage' ? (
                      <select value={(editData[field] as string) ?? ''}
                        onChange={e => setEditData(p => ({ ...p, [field]: e.target.value }))}
                        style={{ width: '100%', background: 'var(--bg)', color: 'var(--fg)', border: '1px solid var(--border)', borderRadius: 4, padding: '6px 8px', fontFamily: 'var(--font-mono)', fontSize: 12, boxSizing: 'border-box' }}>
                        <option value="">— No Stage —</option>
                        {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    ) : (
                      <input value={(editData[field] as string) ?? ''}
                        onChange={e => setEditData(p => ({ ...p, [field]: e.target.value }))}
                        style={{ width: '100%', background: 'var(--bg)', color: 'var(--fg)', border: '1px solid var(--border)', borderRadius: 4, padding: '6px 8px', fontFamily: 'var(--font-mono)', fontSize: 12, boxSizing: 'border-box' }} />
                    )}
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button onClick={handleSaveEdit} disabled={saving} style={{
                    flex: 1, background: '#c9a84c', color: '#000', border: 'none', borderRadius: 4,
                    padding: '8px 0', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
                    cursor: saving ? 'default' : 'pointer', letterSpacing: '0.08em',
                  }}>{saving ? 'SAVING…' : 'SAVE CHANGES'}</button>
                  <button onClick={() => setEditMode(false)} style={{
                    background: 'transparent', color: 'var(--muted)', border: '1px solid var(--border)',
                    borderRadius: 4, padding: '8px 14px', fontFamily: 'var(--font-mono)', fontSize: 11, cursor: 'pointer',
                  }}>CANCEL</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {([
                  ['Email', selectedContact.email],
                  ['Phone', selectedContact.phone, true],
                  ['Stage', selectedContact.stage],
                  ['Lead Source', selectedContact.lead_source], ['Referred By', selectedContact.referred_by],
                  ['Company', selectedContact.company_name], ['Birthday', selectedContact.birthday],
                  ['Last Touch', selectedContact.last_activity_date
                    ? new Date(selectedContact.last_activity_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : selectedContact.last_touch], ['Notes', selectedContact.notes],
                  ['Co-Borrower', selectedContact.coborrower_first_name
                    ? `${selectedContact.coborrower_first_name} ${selectedContact.coborrower_last_name ?? ''}`.trim()
                    : null],
                ] as [string, string | null, boolean?][]).map(([label, val, isPhone]) => val ? (
                  <div key={label}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: 2 }}>{label.toUpperCase()}</div>
                    <div style={{ fontSize: 13, color: 'var(--fg)', wordBreak: 'break-word' }}>
                      {label === 'Referred By'
                        ? <Link href={`/dashboard/contacts/by-name/${encodeURIComponent(val)}`} onClick={e => e.stopPropagation()} style={{ color: '#c9a84c', textDecoration: 'none' }}>{val}</Link>
                        : isPhone && telHref(val)
                          ? <a href={telHref(val)!} onClick={e => e.stopPropagation()} style={{ color: 'inherit', textDecoration: 'none' }}>{val}</a>
                          : label === 'Email' && mailtoHref(val)
                            ? <a href={mailtoHref(val)!} onClick={e => e.stopPropagation()} style={{ color: 'inherit', textDecoration: 'none' }}>{val}</a>
                            : val}
                    </div>
                  </div>
                ) : null)}
                {/* ── Loan History ── */}
                {contactLoansLoading ? (
                  <div style={{ fontSize: 11, color: 'var(--muted)', paddingTop: 8 }}>Loading loans…</div>
                ) : contactLoans.length > 0 ? (
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, marginTop: 2 }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: 10 }}>LOAN HISTORY</div>
                    {contactLoans.map(l => (
                      <div key={l.id} style={{ marginBottom: 10 }}>
                        <Link
                          href={`/dashboard/loans/${l.id}`}
                          style={{ color: '#c9a84c', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}
                        >
                          {[l.borrower_first_name, l.borrower_last_name].filter(Boolean).join(' ') || l.borrower_name || l.loan_name || '(unnamed)'}
                        </Link>
                        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                          {[fmtCurrency(l.loan_amount), isClosedLoan(l.status) ? 'Closed' : l.status, fmtDate(l.closing_date)].filter(Boolean).join(' · ')}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </aside>
      )}


      {/* ── Floating bulk action bar ── */}
      {someSelected && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 200,
          background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8,
          padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12,
          boxShadow: '0 4px 24px rgba(0,0,0,0.5)', fontFamily: 'var(--font-mono)', fontSize: 11,
          whiteSpace: 'nowrap',
        }}>
          <span style={{ color: 'var(--muted)', marginRight: 4 }}>{selectedIds.size} selected</span>
          <button
            onClick={() => { setBulkAction('stage'); setBulkValue('') }}
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)',
                     borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
            UPDATE STAGE
          </button>
          <button
            onClick={() => { setBulkAction('type'); setBulkValue('') }}
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)',
                     borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
            UPDATE TYPE
          </button>
          <button
            onClick={() => { setBulkAction('referred_by'); setBulkValue('') }}
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)',
                     borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
            ASSIGN REFERRED BY
          </button>
          <button
            onClick={() => setDeleteConfirmOpen(true)}
            style={{ background: 'var(--bg)', border: '1px solid #ff5050', color: '#ff5050',
                     borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
            DELETE
          </button>
          <button
            onClick={() => {
              const mapped: SelectedContact[] = contacts
                .filter(c => selectedIds.has(c.id))
                .map(c => ({
                  id: c.id,
                  first_name: c.first_name,
                  last_name: c.last_name,
                  email: c.email,
                  phone: c.phone,
                  stage: c.stage,
                  contact_type: c.contact_type,
                }))
              openWithContacts(mapped)
            }}
            style={{ background: 'var(--bg)', border: '1px solid #C9A84C', color: '#C9A84C',
                     borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
            OUTREACH
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            style={{ background: 'transparent', border: 'none', color: 'var(--muted)',
                     cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: '0 4px' }}>
            ✕
          </button>
        </div>
      )}

      {/* ── Bulk action modal (Stage / Type / Referred By) ── */}
      {bulkAction && bulkAction !== null && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 300,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => { setBulkAction(null); setBulkValue('') }}>
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8,
            padding: 24, width: 360, fontFamily: 'var(--font-mono)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {bulkAction === 'stage'       ? 'Update Stage'       :
               bulkAction === 'type'        ? 'Update Type'        :
                                              'Assign Referred By'}
              {' '}— {selectedIds.size} contact{selectedIds.size !== 1 ? 's' : ''}
            </div>

            {bulkAction === 'stage' && (
              <select value={bulkValue} onChange={e => setBulkValue(e.target.value)}
                style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)',
                         color: 'var(--text)', borderRadius: 4, padding: '8px 10px',
                         fontFamily: 'var(--font-mono)', fontSize: 11, marginBottom: 16 }}>
                <option value="">— Select Stage —</option>
                {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            )}

            {bulkAction === 'type' && (
              <select value={bulkValue} onChange={e => setBulkValue(e.target.value)}
                style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)',
                         color: 'var(--text)', borderRadius: 4, padding: '8px 10px',
                         fontFamily: 'var(--font-mono)', fontSize: 11, marginBottom: 16 }}>
                <option value="">— Select Type —</option>
                <option value="borrower">Borrower</option>
                <option value="realtor">Realtor</option>
                <option value="other">Other</option>
              </select>
            )}

            {bulkAction === 'referred_by' && (
              <input value={bulkValue} onChange={e => setBulkValue(e.target.value)}
                placeholder="Referred by..."
                style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)',
                         color: 'var(--text)', borderRadius: 4, padding: '8px 10px', boxSizing: 'border-box',
                         fontFamily: 'var(--font-mono)', fontSize: 11, marginBottom: 16 }} />
            )}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => { setBulkAction(null); setBulkValue('') }}
                style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)',
                         borderRadius: 4, padding: '6px 14px', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                CANCEL
              </button>
              <button onClick={handleBulkUpdate} disabled={!bulkValue || bulkProcessing}
                style={{ background: 'var(--accent)', border: 'none', color: '#000',
                         borderRadius: 4, padding: '6px 14px', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 11,
                         opacity: (!bulkValue || bulkProcessing) ? 0.5 : 1 }}>
                {bulkProcessing ? 'APPLYING...' : 'APPLY'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirmation modal ── */}
      {deleteConfirmOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 300,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => setDeleteConfirmOpen(false)}>
          <div style={{
            background: 'var(--surface)', border: '1px solid #ff5050', borderRadius: 8,
            padding: 24, width: 340, fontFamily: 'var(--font-mono)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 12, color: 'var(--text)', marginBottom: 8, fontWeight: 600 }}>
              Delete {selectedIds.size} contact{selectedIds.size !== 1 ? 's' : ''}?
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 20 }}>
              This cannot be undone.
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteConfirmOpen(false)}
                style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)',
                         borderRadius: 4, padding: '6px 14px', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                CANCEL
              </button>
              <button onClick={handleBulkDelete}
                style={{ background: '#ff5050', border: 'none', color: '#fff',
                         borderRadius: 4, padding: '6px 14px', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                DELETE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Import modal ── */}
      {showImport && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 300,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => { if (!csvImporting) { setShowImport(false); setCsvRows([]) } }}>
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8,
            padding: 24, width: 540, maxHeight: '80vh', display: 'flex', flexDirection: 'column',
            fontFamily: 'var(--font-mono)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Import Contacts (CSV)
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 16, lineHeight: 1.6 }}>
              Required: <code style={{ color: 'var(--accent)' }}>last_name</code> and{' '}
              <code style={{ color: 'var(--accent)' }}>email</code>. Optional:{' '}
              <code style={{ color: 'var(--accent)' }}>first_name</code>,{' '}
              <code style={{ color: 'var(--accent)' }}>phone</code>,{' '}
              <code style={{ color: 'var(--accent)' }}>contact_type</code>
            </div>

            {csvRows.length === 0 ? (
              <input
                type="file"
                accept=".csv"
                disabled={csvImporting}
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  Papa.parse<Record<string, string>>(file, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (results) => setCsvRows(results.data),
                  })
                }}
                style={{
                  width: '100%', background: 'var(--bg)', border: '1px solid var(--border)',
                  color: 'var(--text)', borderRadius: 4, padding: '8px 10px', boxSizing: 'border-box',
                  fontFamily: 'var(--font-mono)', fontSize: 11, marginBottom: 16,
                }}
              />
            ) : (
              <>
                {(() => {
                  const valid   = csvRows.filter(r => r.last_name?.trim() && r.email?.trim())
                  const skipped = csvRows.length - valid.length
                  return (
                    <div style={{ fontSize: 11, marginBottom: 10, color: 'var(--text)', flexShrink: 0 }}>
                      <span style={{ color: 'var(--accent)' }}>{valid.length}</span> to import
                      {skipped > 0 && (
                        <span style={{ color: 'var(--muted)' }}>
                          {' '}· {skipped} skipped (missing last_name or email)
                        </span>
                      )}
                    </div>
                  )
                })()}
                <div style={{ overflowY: 'auto', flex: 1, border: '1px solid var(--border)', borderRadius: 4, marginBottom: 16 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
                    <thead>
                      <tr style={{ background: 'var(--bg)' }}>
                        {['first_name', 'last_name', 'email', 'phone', 'contact_type'].map(col => (
                          <th key={col} style={{
                            padding: '6px 8px', textAlign: 'left', color: 'var(--muted)',
                            fontWeight: 600, borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap',
                          }}>
                            {col}
                          </th>
                        ))}
                        <th style={{ padding: '6px 8px', color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>✓</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvRows.slice(0, 10).map((row, i) => {
                        const ok = !!row.last_name?.trim() && !!row.email?.trim()
                        return (
                          <tr key={i} style={{ opacity: ok ? 1 : 0.4 }}>
                            {['first_name', 'last_name', 'email', 'phone', 'contact_type'].map(col => (
                              <td key={col} style={{
                                padding: '5px 8px', color: 'var(--text)',
                                borderBottom: '1px solid var(--border)',
                                maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                              }}>
                                {row[col] || '—'}
                              </td>
                            ))}
                            <td style={{
                              padding: '5px 8px', textAlign: 'center',
                              borderBottom: '1px solid var(--border)',
                              color: ok ? 'var(--accent)' : '#ff5050',
                            }}>
                              {ok ? '✓' : '✗'}
                            </td>
                          </tr>
                        )
                      })}
                      {csvRows.length > 10 && (
                        <tr>
                          <td colSpan={6} style={{
                            padding: '6px 8px', color: 'var(--muted)', fontSize: 10, textAlign: 'center',
                          }}>
                            + {csvRows.length - 10} more rows
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexShrink: 0 }}>
              <button
                onClick={() => { setShowImport(false); setCsvRows([]) }}
                disabled={csvImporting}
                style={{
                  background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)',
                  borderRadius: 4, padding: '6px 14px', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 11,
                }}>
                CANCEL
              </button>
              {csvRows.length > 0 && (
                <button
                  disabled={csvImporting}
                  onClick={async () => {
                    const valid = csvRows.filter(r => r.last_name?.trim() && r.email?.trim())
                    if (!valid.length) return
                    setCsvImporting(true)
                    const BATCH = 50
                    let inserted = 0
                    let failed   = 0
                    for (let i = 0; i < valid.length; i += BATCH) {
                      const batch = valid.slice(i, i + BATCH).map(r => ({
                        first_name:   r.first_name?.trim()   || null,
                        last_name:    r.last_name.trim(),
                        email:        r.email.trim().toLowerCase(),
                        phone:        r.phone?.trim()         || null,
                        contact_type: r.contact_type?.trim() || null,
                      }))
                      const { error } = await supabase.from('contacts').insert(batch as any) // eslint-disable-line @typescript-eslint/no-explicit-any
                      if (error) failed += batch.length
                      else       inserted += batch.length
                    }
                    setCsvImporting(false)
                    setShowImport(false)
                    setCsvRows([])
                    const msg = failed > 0
                      ? `Imported ${inserted} · ${failed} failed`
                      : `${inserted} contact${inserted !== 1 ? 's' : ''} imported`
                    setImportBanner(msg)
                    setTimeout(() => setImportBanner(null), 5000)
                    fetchContacts()
                  }}
                  style={{
                    background: 'var(--accent)', border: 'none', color: '#000',
                    borderRadius: 4, padding: '6px 14px', fontFamily: 'var(--font-mono)', fontSize: 11,
                    cursor: csvImporting ? 'not-allowed' : 'pointer', opacity: csvImporting ? 0.5 : 1,
                  }}>
                  {csvImporting ? 'IMPORTING…' : 'IMPORT'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── New Contact modal ── */}
      {showNewContact && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 300,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => setShowNewContact(false)}>
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8,
            padding: 24, width: 420, maxHeight: '90vh', overflowY: 'auto', fontFamily: 'var(--font-mono)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              New Contact
            </div>

            {/* Core fields */}
            {(['first_name', 'last_name', 'email', 'phone'] as const).map(field => (
              <input key={field} placeholder={field.replace('_', ' ')}
                value={newContact[field] ?? ''}
                onChange={e => setNewContact(prev => ({ ...prev, [field]: e.target.value }))}
                style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)',
                         color: 'var(--text)', borderRadius: 4, padding: '8px 10px', boxSizing: 'border-box',
                         fontFamily: 'var(--font-mono)', fontSize: 11, marginBottom: 10 }} />
            ))}

            {/* Contact type */}
            <select value={newContact.contact_type ?? ''}
              onChange={e => setNewContact(prev => ({ ...prev, contact_type: e.target.value }))}
              style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)',
                       color: 'var(--text)', borderRadius: 4, padding: '8px 10px',
                       fontFamily: 'var(--font-mono)', fontSize: 11, marginBottom: 10 }}>
              <option value="">— Type —</option>
              <option value="borrower">Borrower</option>
              <option value="realtor">Realtor</option>
              <option value="advisor">Financial Advisor</option>
              <option value="title">Title</option>
              <option value="insurance">Insurance</option>
              <option value="other">Other</option>
            </select>

            {/* Referred By — typeahead */}
            <ContactTypeahead
              value={newContact.referred_by ?? ''}
              onChange={val => setNewContact(prev => ({ ...prev, referred_by: val }))}
              supabase={supabase}
              placeholder="referred by…"
            />

            {/* Referral Type */}
            <select value={newContact.referral_type ?? ''}
              onChange={e => setNewContact(prev => ({ ...prev, referral_type: e.target.value || null }))}
              style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)',
                       color: 'var(--text)', borderRadius: 4, padding: '8px 10px',
                       fontFamily: 'var(--font-mono)', fontSize: 11, marginBottom: 16 }}>
              <option value="">— Referral type —</option>
              {Object.entries(REFERRAL_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>

            {/* Co-borrower toggle */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginBottom: 12 }}>
              <button
                onClick={() => setShowCoBorrower(p => !p)}
                style={{
                  background: 'transparent', border: 'none', color: showCoBorrower ? 'var(--accent)' : 'var(--muted)',
                  fontFamily: 'var(--font-mono)', fontSize: 10, cursor: 'pointer', padding: 0,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                }}
              >
                {showCoBorrower ? '▾ co-borrower' : '▸ + co-borrower'}
              </button>
            </div>

            {showCoBorrower && (
              <div style={{ marginBottom: 16 }}>
                {([
                  ['co_borrower_first',     'co-borrower first name'],
                  ['co_borrower_last',      'co-borrower last name'],
                  ['co_borrower_birthdate', 'co-borrower date of birth (YYYY-MM-DD)'],
                  ['co_borrower_mobile',    'co-borrower mobile'],
                  ['co_borrower_email',     'co-borrower email'],
                ] as const).map(([field, placeholder]) => (
                  <input key={field} placeholder={placeholder}
                    value={newContact[field] ?? ''}
                    onChange={e => setNewContact(prev => ({ ...prev, [field]: e.target.value }))}
                    style={{ width: '100%', background: 'var(--bg)', border: '1px solid rgba(201,168,76,0.3)',
                             color: 'var(--text)', borderRadius: 4, padding: '8px 10px', boxSizing: 'border-box',
                             fontFamily: 'var(--font-mono)', fontSize: 11, marginBottom: 8 }} />
                ))}
              </div>
            )}

            {createError && (
              <div style={{ color: '#f97373', fontSize: 11, fontFamily: 'var(--font-mono)', marginBottom: 12 }}>
                {createError}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowNewContact(false); setShowCoBorrower(false) }}
                style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)',
                         borderRadius: 4, padding: '6px 14px', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                CANCEL
              </button>
              <button onClick={handleCreate} disabled={creating}
                style={{ background: 'var(--accent)', border: 'none', color: '#000',
                         borderRadius: 4, padding: '6px 14px', cursor: creating ? 'not-allowed' : 'pointer',
                         opacity: creating ? 0.6 : 1,
                         fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                {creating ? 'CREATING…' : 'CREATE'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── New List (custom filter) modal ── */}
      {showNewListModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 300,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => { setShowNewListModal(false); setEditingListId(null) }}>
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8,
            padding: 24, width: 420, maxHeight: '85vh', overflowY: 'auto', fontFamily: 'var(--font-mono)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {editingListId ? 'Edit Smart List' : 'New Smart List'}
            </div>
            <input
              placeholder="List name"
              value={newListName}
              onChange={e => setNewListName(e.target.value)}
              style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--fg)',
                borderRadius: 4, padding: '8px 10px', boxSizing: 'border-box', fontFamily: 'var(--font-mono)', fontSize: 12, marginBottom: 16 }}
            />
            <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 8, letterSpacing: '0.06em' }}>FILTER RULES (AND)</div>
            {newListRules.map((rule, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <select
                  value={rule.field}
                  onChange={e => setNewListRules(prev => prev.map((r, i) => i === idx ? { ...r, field: e.target.value } : r))}
                  style={{ minWidth: 120, background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--fg)', borderRadius: 4, padding: '6px 8px', fontFamily: 'var(--font-mono)', fontSize: 11 }}
                >
                  {CONTACT_FILTER_FIELDS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                </select>
                <select
                  value={rule.operator}
                  onChange={e => setNewListRules(prev => prev.map((r, i) => i === idx ? { ...r, operator: e.target.value } : r))}
                  style={{ minWidth: 90, background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--fg)', borderRadius: 4, padding: '6px 8px', fontFamily: 'var(--font-mono)', fontSize: 11 }}
                >
                  {FILTER_OPERATORS.map(op => <option key={op.id} value={op.id}>{op.label}</option>)}
                </select>
                <input
                  placeholder="Value"
                  value={rule.value}
                  onChange={e => setNewListRules(prev => prev.map((r, i) => i === idx ? { ...r, value: e.target.value } : r))}
                  style={{ flex: 1, minWidth: 80, background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--fg)',
                    borderRadius: 4, padding: '6px 8px', fontFamily: 'var(--font-mono)', fontSize: 11 }}
                />
                {newListRules.length > 1 && (
                  <button type="button" onClick={() => setNewListRules(prev => prev.filter((_, i) => i !== idx))} style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>×</button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => setNewListRules(prev => [...prev, { field: 'stage', operator: 'is', value: '' }])}
              style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#c9a84c', background: 'transparent', border: '1px dashed rgba(201,168,76,0.5)', padding: '6px 10px', borderRadius: 4, cursor: 'pointer', marginBottom: 16 }}
            >
              + Add Filter
            </button>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowNewListModal(false); setEditingListId(null) }}
                style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', borderRadius: 4, padding: '6px 14px', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                CANCEL
              </button>
              <button onClick={handleSaveNewList} disabled={!newListName.trim()}
                style={{ background: '#c9a84c', border: 'none', color: '#000', borderRadius: 4, padding: '6px 14px', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, opacity: newListName.trim() ? 1 : 0.5 }}>
                {editingListId ? 'Update List' : 'Save List'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete custom list confirmation ── */}
      {deleteListId && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 300,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => setDeleteListId(null)}>
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8,
            padding: 24, width: 320, fontFamily: 'var(--font-mono)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 12, color: 'var(--fg)', marginBottom: 8 }}>Delete this list?</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 16 }}>This cannot be undone.</div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteListId(null)}
                style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', borderRadius: 4, padding: '6px 14px', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                CANCEL
              </button>
              <button onClick={handleDeleteList}
                style={{ background: 'rgba(255,80,80,0.9)', border: 'none', color: '#fff', borderRadius: 4, padding: '6px 14px', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                DELETE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Import result banner ── */}
      {importBanner && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--surface)', border: '1px solid var(--accent)', borderRadius: 6,
          padding: '10px 20px', fontSize: 11, fontFamily: 'var(--font-mono)',
          color: 'var(--text)', zIndex: 400, boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          whiteSpace: 'nowrap',
        }}>
          {importBanner}
        </div>
      )}

      {/* ── Column picker backdrop (click outside to close) ── */}
      {showColPicker && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 50 }}
          onClick={() => setShowColPicker(false)}
          aria-hidden
        />
      )}

    </div>
  )
}

