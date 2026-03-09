'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'

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
  created_at: string | null
}

type SmartListDef = { id: string; label: string; section?: string }
type ColumnDef    = { id: string; label: string; render: (c: Contact) => React.ReactNode }
type SortConfig   = { key: keyof Contact; dir: 'asc' | 'desc' }

// ── Smart Lists ───────────────────────────────────────────────────────────────
const SMART_LISTS: SmartListDef[] = [
  { id: 'all',           label: 'All Contacts' },
  { id: 'new-apps',      label: 'New Applications',  section: 'BORROWERS' },
  { id: 'active',        label: 'Active Borrowers' },
  { id: 'in-process',    label: 'In Process' },
  { id: 'closed',        label: 'Closed Borrowers' },
  { id: 'all-realtors',  label: 'All Realtors',      section: 'REALTORS' },
  { id: 'top-realtors',  label: 'Top / Target' },
  { id: 'everyone-else', label: 'Everyone Else',     section: 'OTHER' },
]

// ── Column Definitions ────────────────────────────────────────────────────────
const ALL_COLUMNS: ColumnDef[] = [
  { id: 'name',        label: 'Name',             render: c => `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() || '—' },
  { id: 'type',        label: 'Type',             render: c => c.contact_type ?? '—' },
  { id: 'phone',       label: 'Phone',            render: c => c.phone ?? '—' },
  { id: 'mobile',      label: 'Mobile',           render: c => c.mobile_phone ?? '—' },
  { id: 'email',       label: 'Email',            render: c => c.email ?? '—' },
  { id: 'stage',       label: 'Stage',            render: c => c.stage ?? '—' },
  { id: 'lead_source', label: 'Lead Source',      render: c => c.lead_source ?? '—' },
  { id: 'referred_by', label: 'Referred By',      render: c => c.referred_by ?? '—' },
  { id: 'company',     label: 'Company',          render: c => c.company_name ?? '—' },
  { id: 'birthday',    label: 'Birthday',         render: c => c.birthday ?? '—' },
  { id: 'co_name',     label: 'Co-Borrower Name', render: c => c.coborrower_first_name ? `${c.coborrower_first_name} ${c.coborrower_last_name ?? ''}`.trim() : '—' },
  { id: 'co_bday',     label: 'Co-Bday',          render: c => c.coborrower_birthday ?? '—' },
  { id: 'notes',       label: 'Notes',            render: c => c.notes ?? '—' },
  { id: 'last_touch',  label: 'Last Touch',       render: c => c.last_touch ?? '—' },
  { id: 'created',     label: 'Created Date',     render: c => c.created_at ? new Date(c.created_at).toLocaleDateString() : '—' },
]

const DEFAULT_COLUMNS = ['name', 'type', 'phone', 'email', 'stage', 'referred_by']
const LS_COLUMNS_KEY  = 'loanos_contacts_columns_v1'

// ── Stage filter helper ───────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applySmartList(query: any, listId: string): any {
  switch (listId) {
    case 'new-apps':
      return query.eq('contact_type', 'borrower')
                  .in('stage', ['Lead', 'New', 'Application'])
    case 'active':
      return query.eq('contact_type', 'borrower')
                  .in('stage', ['Pre-Approved', 'Pre-Approval', 'Approved'])
    case 'in-process':
      return query.eq('contact_type', 'borrower')
                  .in('stage', ['In Process', 'Processing', 'Submitted', 'Conditional Approval', 'Clear to Close'])
    case 'closed':
      return query.eq('contact_type', 'borrower')
                  .in('stage', ['Closed', 'Funded', 'Closed/Funded'])
    case 'all-realtors':
      return query.eq('contact_type', 'realtor')
    case 'top-realtors':
      return query.eq('contact_type', 'realtor').or('top_realtor.eq.true,target_realtor.eq.true')
    case 'everyone-else':
      return query.neq('contact_type', 'borrower').neq('contact_type', 'realtor')
    default:
      return query
  }
}

// ── Blank new-contact form ────────────────────────────────────────────────────
const BLANK_CONTACT = {
  first_name: '', last_name: '', email: '', phone: '', mobile_phone: '',
  contact_type: 'borrower', stage: 'Lead',
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

  // new contact modal
  const [showNewModal, setShowNewModal] = useState(false)
  const [newContact, setNewContact]     = useState({ ...BLANK_CONTACT })
  const [creating, setCreating]         = useState(false)
  const [createError, setCreateError]   = useState<string | null>(null)

  // column picker
  const [visibleColumns, setVisibleColumns] = useState<string[]>(DEFAULT_COLUMNS)
  const [showColPicker, setShowColPicker]   = useState(false)

  // view mode: 'active' excludes Closed Client contacts (they have their own page)
  const [viewMode, setViewMode] = useState<'active' | 'all'>('active')

  // init columns from localStorage (after hydration)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_COLUMNS_KEY)
      if (stored) setVisibleColumns(JSON.parse(stored))
    } catch {}
  }, [])

  // ── fetchCounts ─────────────────────────────────────────────────────────────
  const fetchCounts = useCallback(async () => {
    const h = { count: 'exact', head: true } as const
    const [all, newApps, active, inProc, closed, allR, topR, everyoneElse] = await Promise.all([
      viewMode === 'active'
        ? supabase.from('contacts').select('*', h).neq('stage', 'Closed Client')
        : supabase.from('contacts').select('*', h),
      supabase.from('contacts').select('*', h).eq('contact_type', 'borrower').in('stage', ['Lead', 'New', 'Application']),
      supabase.from('contacts').select('*', h).eq('contact_type', 'borrower').in('stage', ['Pre-Approved', 'Pre-Approval', 'Approved']),
      supabase.from('contacts').select('*', h).eq('contact_type', 'borrower').in('stage', ['In Process', 'Processing', 'Submitted', 'Conditional Approval', 'Clear to Close']),
      supabase.from('contacts').select('*', h).eq('contact_type', 'borrower').in('stage', ['Closed', 'Funded', 'Closed/Funded']),
      supabase.from('contacts').select('*', h).eq('contact_type', 'realtor'),
      supabase.from('contacts').select('*', h).eq('contact_type', 'realtor').or('top_realtor.eq.true,target_realtor.eq.true'),
      supabase.from('contacts').select('*', h).neq('contact_type', 'borrower').neq('contact_type', 'realtor'),
    ])
    setCounts({
      all:             all.count            ?? 0,
      'new-apps':      newApps.count        ?? 0,
      active:          active.count         ?? 0,
      'in-process':    inProc.count         ?? 0,
      closed:          closed.count         ?? 0,
      'all-realtors':  allR.count           ?? 0,
      'top-realtors':  topR.count           ?? 0,
      'everyone-else': everyoneElse.count   ?? 0,
    })
  }, [supabase, viewMode])

  // ── fetchContacts ────────────────────────────────────────────────────────────
  const fetchContacts = useCallback(async () => {
    setLoading(true)
    let q = supabase.from('contacts').select('*')
    q = applySmartList(q, activeList)
    if (activeList === 'all' && viewMode === 'active') {
      q = q.neq('stage', 'Closed Client')
    }
    if (search.trim()) {
      const s = `%${search.trim()}%`
      q = q.or(`first_name.ilike.${s},last_name.ilike.${s},email.ilike.${s},phone.ilike.${s}`)
    }
    q = q.order(sort.key as string, { ascending: sort.dir === 'asc' }).limit(500)
    const { data, error } = await q
    if (!error) { setContacts(data ?? []); setTotal(data?.length ?? 0) }
    setLoading(false)
  }, [supabase, activeList, search, sort, viewMode])

  useEffect(() => { fetchContacts() }, [fetchContacts])
  useEffect(() => { fetchCounts()   }, [fetchCounts])

  // ── Handlers ──────────────────────────────────────────────────────────────
  function handleSort(key: keyof Contact) {
    setSort(prev => ({ key, dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc' }))
  }

  function toggleColumn(id: string) {
    setVisibleColumns(prev => {
      const next = prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
      localStorage.setItem(LS_COLUMNS_KEY, JSON.stringify(next))
      return next
    })
  }

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
      setShowNewModal(false)
      setNewContact({ ...BLANK_CONTACT })
      await Promise.all([fetchContacts(), fetchCounts()])
    }
    setCreating(false)
  }

  // ── Derived ───────────────────────────────────────────────────────────────
  const activeListLabel = SMART_LISTS.find(l => l.id === activeList)?.label ?? 'All Contacts'
  const colDefs         = ALL_COLUMNS.filter(c => visibleColumns.includes(c.id))

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full" style={{ background: 'var(--bg)', color: 'var(--fg)' }}>

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="flex-shrink-0 border-r overflow-y-auto"
             style={{ width: 220, borderColor: 'var(--border)', background: 'var(--surface)' }}>
        <div className="px-4 py-5">
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)',
                        letterSpacing: '0.12em', marginBottom: 12 }}>
            SMART LISTS
          </div>
          {SMART_LISTS.map(list => {
            const isActive = activeList === list.id
            return (
              <div key={list.id}>
                {list.section && (
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)',
                                letterSpacing: '0.15em', marginTop: 16, marginBottom: 6,
                                paddingLeft: 8, opacity: 0.6 }}>
                    {list.section}
                  </div>
                )}
                <button
                  onClick={() => { setActiveList(list.id); setSelectedContact(null) }}
                  className="w-full text-left px-3 py-2 rounded flex items-center justify-between"
                  style={{
                    fontFamily: 'var(--font-mono)', fontSize: 11,
                    background: isActive ? 'rgba(201,168,76,0.12)' : 'transparent',
                    color: isActive ? '#c9a84c' : 'var(--fg)',
                    border: isActive ? '1px solid rgba(201,168,76,0.25)' : '1px solid transparent',
                    marginBottom: 2,
                  }}>
                  <span>{list.label}</span>
                  <span style={{ opacity: 0.5, fontSize: 10 }}>{counts[list.id] ?? 0}</span>
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
              </div>
            </div>
            <button onClick={() => setShowNewModal(true)} style={{
              fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em',
              background: '#c9a84c', color: '#000', padding: '8px 16px', borderRadius: 4,
              border: 'none', cursor: 'pointer', fontWeight: 600,
            }}>
              + NEW CONTACT
            </button>
          </div>

          {/* Filter bar */}
          <div className="flex items-center gap-3 px-6 py-3 border-b flex-shrink-0"
               style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search contacts…"
              style={{
                flex: 1, background: 'var(--bg)', color: 'var(--fg)', border: '1px solid var(--border)',
                borderRadius: 4, padding: '6px 10px', fontFamily: 'var(--font-mono)', fontSize: 12,
                outline: 'none',
              }}
            />
            <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 4, overflow: 'hidden' }}>
              {(['active', 'all'] as const).map(mode => (
                <button key={mode} onClick={() => setViewMode(mode)} style={{
                  fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em',
                  padding: '6px 12px', cursor: 'pointer', border: 'none',
                  background: viewMode === mode ? '#c9a84c' : 'transparent',
                  color: viewMode === mode ? '#000' : 'var(--muted)',
                }}>
                  {mode === 'active' ? 'ACTIVE' : 'ALL'}
                </button>
              ))}
            </div>
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowColPicker(p => !p)} style={{
                fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em',
                background: 'transparent', color: 'var(--muted)', padding: '6px 12px',
                border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer',
              }}>
                COLUMNS ▾
              </button>
              {showColPicker && (
                <div style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: 4, zIndex: 50,
                  background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6,
                  padding: '8px 0', minWidth: 200, boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                }}>
                  {ALL_COLUMNS.map(col => (
                    <label key={col.id} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '5px 14px', cursor: 'pointer',
                      fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg)',
                    }}>
                      <input type="checkbox" checked={visibleColumns.includes(col.id)}
                             onChange={() => toggleColumn(col.id)} style={{ accentColor: '#c9a84c' }} />
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
              <div style={{ padding: 48, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)' }}>
                LOADING…
              </div>
            ) : contacts.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)' }}>
                NO CONTACTS FOUND
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
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
                          background: selectedContact?.id === contact.id
                            ? 'rgba(201,168,76,0.08)' : i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={e => { if (selectedContact?.id !== contact.id) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)' }}
                        onMouseLeave={e => { if (selectedContact?.id !== contact.id) (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                      {colDefs.map(col => (
                        <td key={col.id} style={{ padding: '9px 16px', color: 'var(--fg)', whiteSpace: 'nowrap', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {col.render(contact)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Slide-out panel */}
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
                      ) : (
                        <input value={(editData[field] as string) ?? ''}
                          onChange={e => setEditData(p => ({ ...p, [field]: e.target.value }))}
                          style={{ width: '100%', background: 'var(--bg)', color: 'var(--fg)', border: '1px solid var(--border)', borderRadius: 4, padding: '6px 8px', fontFamily: 'var(--font-mono)', fontSize: 12, boxSizing: 'border-box' }} />
                      )}
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button onClick={handleSaveEdit} disabled={saving} style={{
                      flex: 1, background: '#c9a84c', color: '#000', border: 'none',
                      borderRadius: 4, padding: '8px 0', fontFamily: 'var(--font-mono)',
                      fontSize: 11, fontWeight: 600, cursor: saving ? 'default' : 'pointer', letterSpacing: '0.08em',
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
                    ['Email', selectedContact.email], ['Phone', selectedContact.phone],
                    ['Mobile', selectedContact.mobile_phone], ['Stage', selectedContact.stage],
                    ['Lead Source', selectedContact.lead_source], ['Referred By', selectedContact.referred_by],
                    ['Company', selectedContact.company_name], ['Birthday', selectedContact.birthday],
                    ['Last Touch', selectedContact.last_touch], ['Notes', selectedContact.notes],
                    ['Co-Borrower', selectedContact.coborrower_first_name
                      ? `${selectedContact.coborrower_first_name} ${selectedContact.coborrower_last_name ?? ''}`.trim()
                      : null],
                  ] as [string, string | null][]).map(([label, val]) => val ? (
                    <div key={label}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: 2 }}>{label.toUpperCase()}</div>
                      <div style={{ fontSize: 13, color: 'var(--fg)', wordBreak: 'break-word' }}>{val}</div>
                    </div>
                  ) : null)}
                </div>
              )}
            </div>
          </aside>
        )}

      {/* New Contact Modal */}
      {showNewModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={e => { if (e.target === e.currentTarget) setShowNewModal(false) }}>
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8,
            padding: '28px 32px', width: 520, maxHeight: '90vh', overflowY: 'auto',
          }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: '0.05em', marginBottom: 20 }}>NEW CONTACT</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {([
                ['First Name', 'first_name'], ['Last Name', 'last_name'],
                ['Email', 'email'], ['Phone', 'phone'], ['Mobile', 'mobile_phone'],
                ['Referred By', 'referred_by'], ['Lead Source', 'lead_source'],
                ['Company', 'company_name'],
              ] as [string, keyof typeof BLANK_CONTACT][]).map(([label, field]) => (
                <div key={field}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: 4 }}>{label.toUpperCase()}</div>
                  <input value={newContact[field] as string}
                    onChange={e => setNewContact(p => ({ ...p, [field]: e.target.value }))}
                    style={{ width: '100%', background: 'var(--bg)', color: 'var(--fg)', border: '1px solid var(--border)', borderRadius: 4, padding: '7px 10px', fontFamily: 'var(--font-mono)', fontSize: 12, boxSizing: 'border-box' }} />
                </div>
              ))}
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: 4 }}>CONTACT TYPE</div>
                <select value={newContact.contact_type} onChange={e => setNewContact(p => ({ ...p, contact_type: e.target.value }))}
                  style={{ width: '100%', background: 'var(--bg)', color: 'var(--fg)', border: '1px solid var(--border)', borderRadius: 4, padding: '7px 10px', fontFamily: 'var(--font-mono)', fontSize: 12, boxSizing: 'border-box' }}>
                  <option value="borrower">Borrower</option>
                  <option value="realtor">Realtor</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: 4 }}>STAGE</div>
                <input value={newContact.stage} onChange={e => setNewContact(p => ({ ...p, stage: e.target.value }))}
                  style={{ width: '100%', background: 'var(--bg)', color: 'var(--fg)', border: '1px solid var(--border)', borderRadius: 4, padding: '7px 10px', fontFamily: 'var(--font-mono)', fontSize: 12, boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ marginTop: 14 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: 4 }}>NOTES</div>
              <textarea value={newContact.notes} rows={3} onChange={e => setNewContact(p => ({ ...p, notes: e.target.value }))}
                style={{ width: '100%', background: 'var(--bg)', color: 'var(--fg)', border: '1px solid var(--border)', borderRadius: 4, padding: '7px 10px', fontFamily: 'var(--font-mono)', fontSize: 12, resize: 'vertical', boxSizing: 'border-box' }} />
            </div>
            {createError && (
              <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.3)', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: 11, color: '#ff5050' }}>
                {createError}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={handleCreate} disabled={creating} style={{
                flex: 1, background: '#c9a84c', color: '#000', border: 'none', borderRadius: 4,
                padding: '10px 0', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
                cursor: creating ? 'default' : 'pointer', letterSpacing: '0.08em',
              }}>{creating ? 'CREATING…' : 'CREATE CONTACT'}</button>
              <button onClick={() => { setShowNewModal(false); setNewContact({ ...BLANK_CONTACT }); setCreateError(null) }} style={{
                background: 'transparent', color: 'var(--muted)', border: '1px solid var(--border)',
                borderRadius: 4, padding: '10px 18px', fontFamily: 'var(--font-mono)', fontSize: 11, cursor: 'pointer',
              }}>CANCEL</button>
            </div>
          </div>
        </div>
      )}

      {/* Col picker backdrop */}
      {showColPicker && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setShowColPicker(false)} />
      )}
    </div>
  )
}
