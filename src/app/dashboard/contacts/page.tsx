'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

// ── Types ──────────────────────────────────────────────────────────────────────
type Contact = {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  mobile_phone: string | null
  contact_type: string | null
  stage: string | null
  lead_source: string | null
  referred_by: string | null
  company_name: string | null
  notes: string | null
  birthday: string | null
  coborrower_first_name: string | null
  coborrower_last_name: string | null
  coborrower_birthday: string | null
  last_touch: string | null
  top_realtor: boolean | null
  target_realtor: boolean | null
  salesforce_id: string | null
  closing_date: string | null
  realtor_email: string | null
  realtor_phone: string | null
  created_at: string | null
}

type SmartListDef = { id: string; label: string; section?: string }
type ColumnDef    = { id: string; label: string; render: (c: Contact) => React.ReactNode }
type SortConfig   = { key: keyof Contact; dir: 'asc' | 'desc' }
type BulkAction   = 'stage' | 'type' | 'referred_by' | null

interface ContactLoan {
  id: string
  loan_name: string | null
  borrower_name: string | null
  status: string | null
  loan_amount: number | null
  closing_date: string | null
}

// ── Canonical Stages ──────────────────────────────────────────────────────────
const STAGES = ['Lead', 'Pre-App', 'Application', 'Pre-Approved', 'In Process', 'Closing', 'Closed', 'Other']

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

function fmtCurrency(n: number | null) {
  if (n == null) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

function fmtDate(s: string | null) {
  if (!s) return '—'
  const d = new Date(s + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

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
  { id: 'all',          label: 'All Contacts' },
  { id: 'new-apps',     label: 'New Applications',   section: 'BORROWERS' },
  { id: 'active',       label: 'Active Borrowers' },
  { id: 'in-process',   label: 'In Process' },
  { id: 'closed',       label: 'Closed Borrowers' },
  { id: 'all-realtors', label: 'All Realtors',       section: 'REALTORS' },
  { id: 'top-realtors', label: 'Top / Target' },
  { id: 'unassigned',   label: 'Unassigned / Other', section: 'OTHER' },
]


// ── Column Definitions ────────────────────────────────────────────────────────
const ALL_COLUMNS: ColumnDef[] = [
  { id: 'name',         label: 'Name',             render: c => (
      <Link href={`/dashboard/contacts/${c.id}`} onClick={e => e.stopPropagation()} style={{ color: '#c9a84c', textDecoration: 'none', fontWeight: 600 }}>
        {`${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() || '—'}
      </Link>
    ) },
  { id: 'type',         label: 'Type',             render: c => c.contact_type ?? '—' },
  { id: 'phone',        label: 'Phone',            render: c => <PhoneCell value={c.phone} /> },
  { id: 'mobile',       label: 'Mobile',           render: c => <PhoneCell value={c.mobile_phone} /> },
  { id: 'email',        label: 'Email',            render: c => c.email ?? '—' },
  { id: 'stage',        label: 'Stage',            render: c => c.stage ?? '—' },
  { id: 'lead_source',  label: 'Lead Source',      render: c => c.lead_source ?? '—' },
  { id: 'referred_by',  label: 'Referred By',      render: c => c.referred_by
      ? <Link href={`/dashboard/contacts/by-name/${encodeURIComponent(c.referred_by)}`} onClick={e => e.stopPropagation()} style={{ color: '#c9a84c', textDecoration: 'none' }}>{c.referred_by}</Link>
      : '—' },
  { id: 'company',      label: 'Company',          render: c => c.company_name ?? '—' },
  { id: 'birthday',     label: 'Birthday',         render: c => c.birthday ?? '—' },
  { id: 'co_name',      label: 'Co-Borrower Name', render: c => c.coborrower_first_name ? `${c.coborrower_first_name} ${c.coborrower_last_name ?? ''}`.trim() : '—' },
  { id: 'co_bday',      label: 'Co-Bday',          render: c => c.coborrower_birthday ?? '—' },
  { id: 'notes',        label: 'Notes',            render: c => c.notes ?? '—' },
  { id: 'last_touch',   label: 'Last Touch',       render: c => c.last_touch ?? '—' },
  { id: 'closing_date', label: 'Closing Date',     render: c => c.closing_date ?? '—' },
  { id: 'realtor_email',label: 'Realtor Email',    render: c => c.realtor_email ?? '—' },
  { id: 'created',      label: 'Created Date',     render: c => c.created_at ? new Date(c.created_at).toLocaleDateString() : '—' },
]

const DEFAULT_COLUMNS = ['name', 'type', 'phone', 'email', 'stage', 'referred_by']
const LS_COLUMNS_KEY  = 'loanos_contacts_columns_v1'

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
    case 'in-process':
      return query.eq('contact_type', 'borrower').in('stage', ['In Process', 'Closing'])
    case 'closed':
      return query.eq('contact_type', 'borrower').in('stage', ['Closed Client'])
    case 'all-realtors':
      return query.eq('contact_type', 'realtor')
    case 'top-realtors':
      return query.eq('contact_type', 'realtor').or('top_realtor.eq.true,target_realtor.eq.true')
    case 'unassigned':
      return query.or('contact_type.eq.other,contact_type.is.null,and(contact_type.eq.borrower,stage.is.null)')
    default:
      return query
  }
}

// ── Blank new-contact form ────────────────────────────────────────────────────
const BLANK_CONTACT = {
  first_name: '', last_name: '', email: '', phone: '', mobile_phone: '',
  contact_type: 'borrower' as string | null, stage: 'Lead',
  lead_source: '', referred_by: '', company_name: '', notes: '',
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function ContactsPage() {
  const supabase = useMemo(() => createClient(), [])

  // list state
  const [contacts, setContacts]     = useState<Contact[]>([])
  const [loading, setLoading]       = useState(true)
  const [activeList, setActiveList] = useState('all')
  const [search, setSearch]         = useState('')
  const [sort, setSort]             = useState<SortConfig>({ key: 'last_name', dir: 'asc' })
  const [total, setTotal]           = useState(0)
  const [counts, setCounts]         = useState<Record<string, number>>({})

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
  const [, setCreating]         = useState(false)
  const [, setCreateError]   = useState<string | null>(null)

  // column picker
  const [visibleColumns, setVisibleColumns] = useState<string[]>(DEFAULT_COLUMNS)
  const [showColPicker, setShowColPicker]   = useState(false)

  // import modal
  const [showImport, setShowImport] = useState(false)

  // ── Feature 1: inline stage editing ─────────────────────────────────────
  const [editingStageId, setEditingStageId] = useState<string | null>(null)

  // ── Feature 3: bulk actions ──────────────────────────────────────────────
  const [selectedIds, setSelectedIds]       = useState<Set<string>>(new Set())
  const [bulkAction, setBulkAction]         = useState<BulkAction>(null)
  const [bulkValue, setBulkValue]           = useState('')
  const [bulkProcessing, setBulkProcessing] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

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

  // init columns from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_COLUMNS_KEY)
      if (stored) setVisibleColumns(JSON.parse(stored))
    } catch {}
  }, [])

  // fetch loans for selected contact
  useEffect(() => {
    const id = selectedContact?.id
    if (!id) { setContactLoans([]); return }
    setContactLoansLoading(true)
    supabase
      .from('loans')
      .select('id, loan_name, borrower_name, status, loan_amount, closing_date')
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
    const [all, newApps, active, inProc, closed, allR, topR, unassigned] = await Promise.all([
      supabase.from('contacts').select('*', h),
      supabase.from('contacts').select('*', h).eq('contact_type', 'borrower').in('stage', ['Lead', 'Pre-App', 'Application']),
      supabase.from('contacts').select('*', h).eq('contact_type', 'borrower').in('stage', ['Pre-Approved']),
      supabase.from('contacts').select('*', h).eq('contact_type', 'borrower').in('stage', ['In Process', 'Closing']),
      supabase.from('contacts').select('*', h).eq('contact_type', 'borrower').in('stage', ['Closed Client']),
      supabase.from('contacts').select('*', h).eq('contact_type', 'realtor'),
      supabase.from('contacts').select('*', h).eq('contact_type', 'realtor').or('top_realtor.eq.true,target_realtor.eq.true'),
      supabase.from('contacts').select('*', h).or('contact_type.eq.other,contact_type.is.null,and(contact_type.eq.borrower,stage.is.null)'),
    ])
    setCounts({
      all:           all.count       ?? 0,
      'new-apps':    newApps.count   ?? 0,
      active:        active.count    ?? 0,
      'in-process':  inProc.count    ?? 0,
      closed:        closed.count    ?? 0,
      'all-realtors':allR.count      ?? 0,
      'top-realtors':topR.count      ?? 0,
      unassigned:    unassigned.count ?? 0,
    })
  }, [supabase])

  // ── fetchContacts ────────────────────────────────────────────────────────────
  const fetchContacts = useCallback(async () => {
    setLoading(true)
    let q = supabase.from('contacts').select('*')
    q = applySmartList(q, activeList)
    if (search.trim()) {
      const s = `%${search.trim()}%`
      q = q.or(`first_name.ilike.${s},last_name.ilike.${s},email.ilike.${s},phone.ilike.${s}`)
    }
    q = q.order(sort.key as string, { ascending: sort.dir === 'asc' }).limit(500)
    const { data, error } = await q
    if (!error) { setContacts(data ?? []); setTotal(data?.length ?? 0) }
    setLoading(false)
    setSelectedIds(new Set())
  }, [supabase, activeList, search, sort])

  useEffect(() => { fetchContacts() }, [fetchContacts])
  useEffect(() => { fetchCounts()   }, [fetchCounts])

  // ── Sort ─────────────────────────────────────────────────────────────────
  function handleSort(key: keyof Contact) {
    setSort(prev => ({ key, dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc' }))
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
    await supabase.from('contacts').update({ stage: stageValue }).eq('id', contactId)
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
    await supabase.from('contacts').update({ [field]: bulkValue }).in('id', ids)
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
    const { error } = await supabase.from('contacts').update(editData).eq('id', selectedContact.id)
    if (!error) {
      setEditMode(false)
      setSelectedContact(prev => prev ? { ...prev, ...editData } as Contact : null)
      await Promise.all([fetchContacts(), fetchCounts()])
    }
    setSaving(false)
  }

  async function handleCreate() {
    setCreating(true); setCreateError(null)
    const { error } = await supabase.from('contacts').insert([newContact])
    if (error) {
      setCreateError(error.message)
    } else {
      setShowNewContact(false)
      setNewContact({ ...BLANK_CONTACT })
      await Promise.all([fetchContacts(), fetchCounts()])
    }
    setCreating(false)
  }

  // ── Derived ───────────────────────────────────────────────────────────────
  const activeListLabel = SMART_LISTS.find(l => l.id === activeList)?.label ?? 'All Contacts'
  const colDefs         = ALL_COLUMNS.filter(c => visibleColumns.includes(c.id))
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
              {total.toLocaleString()} {total === 1 ? 'contact' : 'contacts'}
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
                    display: 'flex', alignItems: 'center', gap: 8, padding: '5px 14px', cursor: 'pointer',
                    fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg)',
                  }}>
                    <input
                      type="checkbox"
                      checked={visibleColumns.includes(col.id)}
                      onChange={() => toggleColumn(col.id)}
                      onClick={e => e.stopPropagation()}
                      style={{ accentColor: '#c9a84c', cursor: 'pointer' }}
                    />
                    {col.label}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div style={{ padding: 48, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)' }}>LOADING…</div>
          ) : contacts.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)' }}>NO CONTACTS FOUND</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
                  {/* Checkbox header */}
                  <th style={{ padding: '8px 12px', width: 36 }} onClick={e => e.stopPropagation()}>
                    <input type="checkbox" checked={allSelected} onChange={toggleSelectAll}
                           style={{ accentColor: '#c9a84c', cursor: 'pointer' }} />
                  </th>
                  {colDefs.map(col => (
                    <th key={col.id}
                        onClick={() => handleSort(col.id as keyof Contact)}
                        style={{
                          padding: '8px 16px', textAlign: 'left', cursor: 'pointer',
                          fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em',
                          color: sort.key === col.id ? '#c9a84c' : 'var(--muted)',
                          whiteSpace: 'nowrap', userSelect: 'none',
                        }}>
                      {col.label.toUpperCase()}
                      {sort.key === col.id ? (sort.dir === 'asc' ? ' ▲' : ' ▼') : ''}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {contacts.map((contact, i) => (
                  <tr key={contact.id}
                      onClick={() => { setSelectedContact(contact); setEditMode(false); setEditData({}) }}
                      style={{
                        borderBottom: '1px solid var(--border)',
                        background: selectedIds.has(contact.id)
                          ? 'rgba(201,168,76,0.06)'
                          : selectedContact?.id === contact.id
                            ? 'rgba(201,168,76,0.08)'
                            : i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={e => {
                        if (!selectedIds.has(contact.id) && selectedContact?.id !== contact.id)
                          (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'
                      }}
                      onMouseLeave={e => {
                        if (!selectedIds.has(contact.id) && selectedContact?.id !== contact.id)
                          (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)'
                      }}>
                    {/* Checkbox cell */}
                    <td style={{ padding: '9px 12px' }} onClick={e => toggleSelect(contact.id, e)}>
                      <input type="checkbox" checked={selectedIds.has(contact.id)}
                             onChange={() => {}} style={{ accentColor: '#c9a84c', cursor: 'pointer' }} />
                    </td>

                    {/* Data cells */}
                    {colDefs.map(col => (
                      <td key={col.id} style={{ padding: '9px 16px', color: 'var(--fg)', whiteSpace: 'nowrap', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
                ))}
              </tbody>
            </table>
          )}
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
                  ['Phone', 'phone'], ['Mobile', 'mobile_phone'], ['Stage', 'stage'],
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
                  ['Mobile', selectedContact.mobile_phone, true],
                  ['Stage', selectedContact.stage],
                  ['Lead Source', selectedContact.lead_source], ['Referred By', selectedContact.referred_by],
                  ['Company', selectedContact.company_name], ['Birthday', selectedContact.birthday],
                  ['Last Touch', selectedContact.last_touch], ['Notes', selectedContact.notes],
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
                          {l.borrower_name || l.loan_name || '(unnamed)'}
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
        }} onClick={() => setShowImport(false)}>
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8,
            padding: 24, width: 400, fontFamily: 'var(--font-mono)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Import Contacts (CSV)
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 16, lineHeight: 1.6 }}>
              CSV must include columns: <code style={{ color: 'var(--accent)' }}>first_name</code>,{' '}
              <code style={{ color: 'var(--accent)' }}>last_name</code>,{' '}
              <code style={{ color: 'var(--accent)' }}>email</code>,{' '}
              <code style={{ color: 'var(--accent)' }}>contact_type</code>
            </div>
            <input type="file" accept=".csv"
              style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)',
                       color: 'var(--text)', borderRadius: 4, padding: '8px 10px', boxSizing: 'border-box',
                       fontFamily: 'var(--font-mono)', fontSize: 11, marginBottom: 16 }} />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowImport(false)}
                style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)',
                         borderRadius: 4, padding: '6px 14px', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                CANCEL
              </button>
              <button
                style={{ background: 'var(--accent)', border: 'none', color: '#000',
                         borderRadius: 4, padding: '6px 14px', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                IMPORT
              </button>
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
            padding: 24, width: 400, fontFamily: 'var(--font-mono)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              New Contact
            </div>
            {(['first_name', 'last_name', 'email', 'phone'] as const).map(field => (
              <input key={field} placeholder={field.replace('_', ' ')}
                value={newContact[field] ?? ''}
                onChange={e => setNewContact(prev => ({ ...prev, [field]: e.target.value }))}
                style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)',
                         color: 'var(--text)', borderRadius: 4, padding: '8px 10px', boxSizing: 'border-box',
                         fontFamily: 'var(--font-mono)', fontSize: 11, marginBottom: 10 }} />
            ))}
            <select value={newContact.contact_type ?? ''}
              onChange={e => setNewContact(prev => ({ ...prev, contact_type: e.target.value }))}
              style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)',
                       color: 'var(--text)', borderRadius: 4, padding: '8px 10px',
                       fontFamily: 'var(--font-mono)', fontSize: 11, marginBottom: 16 }}>
              <option value="">— Type —</option>
              <option value="borrower">Borrower</option>
              <option value="realtor">Realtor</option>
              <option value="other">Other</option>
            </select>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowNewContact(false)}
                style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)',
                         borderRadius: 4, padding: '6px 14px', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                CANCEL
              </button>
              <button onClick={handleCreate}
                style={{ background: 'var(--accent)', border: 'none', color: '#000',
                         borderRadius: 4, padding: '6px 14px', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                CREATE
              </button>
            </div>
          </div>
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

