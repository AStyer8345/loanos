'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'

// ── Types ──────────────────────────────────────────────────────────────────

type Contact = Record<string, unknown> & {
  id: string
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  contact_type?: string
  stage?: string
  lead_source?: string
  notes?: string
  created_at?: string
  updated_at?: string
}

type ListCounts = Record<string, number>

// ── Smart Lists ────────────────────────────────────────────────────────────

type SmartListDef = { id: string; label: string; section?: string }

const SMART_LISTS: SmartListDef[] = [
  { id: 'all',           label: 'All Contacts' },
  { id: 'new-apps',      label: 'New Applications',  section: 'BORROWERS' },
  { id: 'active',        label: 'Active Borrowers' },
  { id: 'closed',        label: 'Closed Borrowers' },
  { id: 'all-realtors',  label: 'All Realtors',      section: 'REALTORS' },
  { id: 'top-realtors',  label: 'Top / Target' },
  { id: 'everyone-else', label: 'Everyone Else',     section: 'OTHER' },
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applySmartList(query: any, listId: string): any {
  switch (listId) {
    case 'new-apps':      return query.eq('contact_type', 'borrower').eq('stage', 'Lead')
    case 'active':        return query.eq('contact_type', 'borrower').in('stage', ['Pre-Approved', 'In Process'])
    case 'closed':        return query.eq('contact_type', 'borrower').eq('stage', 'Closed')
    case 'all-realtors':  return query.eq('contact_type', 'realtor')
    case 'top-realtors':  return query.eq('contact_type', 'realtor').or('top_realtor.eq.true,target_realtor.eq.true')
    case 'everyone-else': return query.eq('contact_type', 'other')
    default:              return query
  }
}

// ── Field Config ───────────────────────────────────────────────────────────

const PRIORITY_FIELDS = ['first_name','last_name','email','phone','contact_type','stage','lead_source']
const SKIP_FIELDS     = ['id','user_id','created_at','updated_at']
const READONLY_FIELDS = ['id','user_id','created_at','updated_at']

const TYPE_COLORS: Record<string, string> = {
  borrower: '#2563eb',
  realtor:  '#c9a84c',
  other:    '#6b7280',
}

// ── Helpers ────────────────────────────────────────────────────────────────

function fmt(val: unknown): string {
  if (val === null || val === undefined) return '—'
  if (typeof val === 'boolean') return val ? 'Yes' : 'No'
  if (typeof val === 'string' && val.match(/^\d{4}-\d{2}-\d{2}T/)) {
    return new Date(val).toLocaleDateString()
  }
  return String(val)
}

function fieldLabel(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function typeStyle(type: unknown) {
  const color = TYPE_COLORS[String(type)] ?? TYPE_COLORS.other
  return {
    color,
    border: `1px solid ${color}`,
    padding: '1px 8px',
    borderRadius: '3px',
    fontSize: '11px',
    fontFamily: 'var(--font-mono)',
    textTransform: 'uppercase' as const,
  }
}

const PAGE_SIZE = 50

// ── Component ──────────────────────────────────────────────────────────────

export default function ContactsPage() {
  const supabase = useMemo(() => createClient(), [])

  // Smart list state
  const [activeList,  setActiveList]  = useState('all')
  const [listCounts,  setListCounts]  = useState<ListCounts>({})

  // Table state
  const [contacts,    setContacts]    = useState<Contact[]>([])
  const [total,       setTotal]       = useState(0)
  const [page,        setPage]        = useState(0)
  const [loading,     setLoading]     = useState(true)

  // Filter state
  const [search,           setSearch]           = useState('')
  const [debouncedSearch,  setDebouncedSearch]  = useState('')
  const [stageFilter,      setStageFilter]      = useState('')
  const [leadSourceFilter, setLeadSourceFilter] = useState('')
  const [stageOptions,     setStageOptions]     = useState<string[]>([])
  const [leadSrcOptions,   setLeadSrcOptions]   = useState<string[]>([])

  // Slide-out panel state
  const [selected, setSelected] = useState<Contact | null>(null)
  const [editing,  setEditing]  = useState(false)
  const [editData, setEditData] = useState<Record<string, string>>({})
  const [saving,   setSaving]   = useState(false)

  // ── Debounce search ──────────────────────────────────────────────────────

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  // ── Fetch smart list counts ──────────────────────────────────────────────

  const fetchCounts = useCallback(async () => {
    const h = { count: 'exact' as const, head: true }
    const [all, newApps, active, closed, allR, topR, everyoneElse] = await Promise.all([
      supabase.from('contacts').select('*', h),
      supabase.from('contacts').select('*', h).eq('contact_type', 'borrower').eq('stage', 'Lead'),
      supabase.from('contacts').select('*', h).eq('contact_type', 'borrower').in('stage', ['Pre-Approved', 'In Process']),
      supabase.from('contacts').select('*', h).eq('contact_type', 'borrower').eq('stage', 'Closed'),
      supabase.from('contacts').select('*', h).eq('contact_type', 'realtor'),
      supabase.from('contacts').select('*', h).eq('contact_type', 'realtor').or('top_realtor.eq.true,target_realtor.eq.true'),
      supabase.from('contacts').select('*', h).eq('contact_type', 'other'),
    ])
    setListCounts({
      'all':           all.count ?? 0,
      'new-apps':      newApps.count ?? 0,
      'active':        active.count ?? 0,
      'closed':        closed.count ?? 0,
      'all-realtors':  allR.count ?? 0,
      'top-realtors':  topR.count ?? 0,
      'everyone-else': everyoneElse.count ?? 0,
    })
  }, [supabase])

  useEffect(() => { fetchCounts() }, [fetchCounts])

  // ── Fetch filter options ─────────────────────────────────────────────────

  useEffect(() => {
    async function loadOptions() {
      const { data } = await supabase.from('contacts').select('stage, lead_source')
      if (!data) return
      setStageOptions([...new Set(data.map(r => r.stage).filter(Boolean) as string[])])
      setLeadSrcOptions([...new Set(data.map(r => r.lead_source).filter(Boolean) as string[])])
    }
    loadOptions()
  }, [supabase])

  // ── Fetch contacts ───────────────────────────────────────────────────────

  const fetchContacts = useCallback(async () => {
    setLoading(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q: any = supabase.from('contacts').select('*', { count: 'exact' })
    q = applySmartList(q, activeList)
    if (debouncedSearch) {
      q = q.or(`first_name.ilike.%${debouncedSearch}%,last_name.ilike.%${debouncedSearch}%,email.ilike.%${debouncedSearch}%,phone.ilike.%${debouncedSearch}%`)
    }
    if (stageFilter)      q = q.eq('stage', stageFilter)
    if (leadSourceFilter) q = q.eq('lead_source', leadSourceFilter)
    q = q.order('created_at', { ascending: false }).range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1)
    const { data, count } = await q
    setContacts((data ?? []) as Contact[])
    setTotal(count ?? 0)
    setLoading(false)
  }, [supabase, activeList, debouncedSearch, stageFilter, leadSourceFilter, page])

  useEffect(() => { fetchContacts() }, [fetchContacts])

  // ── Smart list switch ────────────────────────────────────────────────────

  function selectList(id: string) {
    setActiveList(id)
    setPage(0)
    setSearch('')
    setDebouncedSearch('')
    setStageFilter('')
    setLeadSourceFilter('')
    setSelected(null)
    setEditing(false)
  }

  // ── Panel handlers ───────────────────────────────────────────────────────

  function openContact(c: Contact) {
    setSelected(c)
    setEditing(false)
    setEditData({})
  }

  function closePanel() {
    setSelected(null)
    setEditing(false)
    setEditData({})
  }

  function startEdit() {
    if (!selected) return
    const editable: Record<string, string> = {}
    Object.entries(selected).forEach(([k, v]) => {
      if (!READONLY_FIELDS.includes(k)) {
        editable[k] = v === null || v === undefined ? '' : String(v)
      }
    })
    setEditData(editable)
    setEditing(true)
  }

  async function saveContact() {
    if (!selected) return
    setSaving(true)
    const { data, error } = await supabase
      .from('contacts')
      .update(editData)
      .eq('id', selected.id)
      .select()
      .single()
    if (!error && data) {
      setSelected(data as Contact)
      setEditing(false)
      fetchContacts()
      fetchCounts()
    }
    setSaving(false)
  }

  function orderedFields(c: Contact): string[] {
    const keys = Object.keys(c).filter(k => !SKIP_FIELDS.includes(k))
    const priority = PRIORITY_FIELDS.filter(f => f in c)
    const rest = keys.filter(k => !PRIORITY_FIELDS.includes(k))
    return [...priority, ...rest]
  }

  const activeListLabel = SMART_LISTS.find(l => l.id === activeList)?.label ?? 'Contacts'
  const totalPages      = Math.ceil(total / PAGE_SIZE)

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full overflow-hidden">

      {/* ── Smart List Sidebar ─────────────────────────────────────────── */}
      <div
        className="w-56 flex-shrink-0 overflow-y-auto flex flex-col border-r"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div
          className="px-3 pt-4 pb-2"
          style={{ color: 'var(--muted)', fontSize: '10px', letterSpacing: '0.1em', fontFamily: 'var(--font-mono)' }}
        >
          SMART LISTS
        </div>

        {SMART_LISTS.map(list => (
          <div key={list.id}>
            {list.section && (
              <div
                className="px-3 pt-3 pb-1"
                style={{ color: 'var(--muted)', fontSize: '9px', letterSpacing: '0.12em', fontFamily: 'var(--font-mono)' }}
              >
                {list.section}
              </div>
            )}
            <button
              onClick={() => selectList(list.id)}
              className="w-full flex items-center justify-between px-3 py-2 text-left"
              style={{
                background:  activeList === list.id ? 'rgba(201,168,76,0.12)' : 'transparent',
                borderLeft:  activeList === list.id ? '2px solid #c9a84c'     : '2px solid transparent',
                color:       activeList === list.id ? '#c9a84c'                : 'var(--fg)',
                fontSize:    '12px',
                fontFamily:  'var(--font-mono)',
              }}
            >
              <span>{list.label}</span>
              <span style={{ color: activeList === list.id ? '#c9a84c' : 'var(--muted)', fontSize: '11px' }}>
                {listCounts[list.id] ?? '—'}
              </span>
            </button>
          </div>
        ))}
      </div>

      {/* ── Main Content ──────────────────────────────────────────────── */}
      <div
        className="flex flex-col flex-1 min-w-0 overflow-hidden"
        style={{ paddingRight: selected ? '400px' : '0', transition: 'padding-right 0.2s' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
          style={{ borderColor: 'var(--border)' }}
        >
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--fg)', letterSpacing: '0.05em', lineHeight: 1 }}>
              {activeListLabel.toUpperCase()}
            </h1>
            <div style={{ color: 'var(--muted)', fontSize: '12px', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
              {total.toLocaleString()} {total === 1 ? 'contact' : 'contacts'}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div
          className="flex items-center gap-3 px-6 py-3 border-b flex-shrink-0"
          style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
        >
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, email, phone..."
            style={{
              background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--fg)',
              fontFamily: 'var(--font-mono)', fontSize: '12px', padding: '4px 10px',
              borderRadius: '3px', outline: 'none', flex: '1', maxWidth: '300px',
            }}
          />
          <select
            value={stageFilter}
            onChange={e => { setStageFilter(e.target.value); setPage(0) }}
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--fg)', fontFamily: 'var(--font-mono)', fontSize: '12px', padding: '4px 8px', borderRadius: '3px' }}
          >
            <option value="">All Stages</option>
            {stageOptions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={leadSourceFilter}
            onChange={e => { setLeadSourceFilter(e.target.value); setPage(0) }}
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--fg)', fontFamily: 'var(--font-mono)', fontSize: '12px', padding: '4px 8px', borderRadius: '3px' }}
          >
            <option value="">All Lead Sources</option>
            {leadSrcOptions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {(search || stageFilter || leadSourceFilter) && (
            <button
              onClick={() => { setSearch(''); setDebouncedSearch(''); setStageFilter(''); setLeadSourceFilter(''); setPage(0) }}
              style={{ color: '#c9a84c', fontFamily: 'var(--font-mono)', fontSize: '12px', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              CLEAR
            </button>
          )}
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full border-collapse" style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
            <thead>
              <tr>
                {['NAME', 'TYPE', 'EMAIL', 'PHONE', 'STAGE', 'LEAD SOURCE'].map(h => (
                  <th
                    key={h}
                    className="text-left px-4 py-2"
                    style={{
                      color: 'var(--muted)', fontWeight: 400, letterSpacing: '0.05em',
                      whiteSpace: 'nowrap', position: 'sticky', top: 0,
                      background: 'var(--surface)', zIndex: 1, borderBottom: '1px solid var(--border)',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '64px', color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '0.05em' }}>
                    LOADING...
                  </td>
                </tr>
              ) : contacts.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '64px', color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '0.05em' }}>
                    NO CONTACTS FOUND
                  </td>
                </tr>
              ) : contacts.map(c => (
                <tr
                  key={c.id}
                  onClick={() => openContact(c)}
                  className="cursor-pointer"
                  style={{ borderBottom: '1px solid var(--border)', background: selected?.id === c.id ? 'rgba(201,168,76,0.08)' : 'transparent' }}
                  onMouseEnter={e => { if (selected?.id !== c.id) (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,0.03)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = selected?.id === c.id ? 'rgba(201,168,76,0.08)' : 'transparent' }}
                >
                  <td className="px-4 py-2" style={{ color: 'var(--fg)', whiteSpace: 'nowrap' }}>
                    {`${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() || '—'}
                  </td>
                  <td className="px-4 py-2">
                    <span style={typeStyle(c.contact_type)}>{String(c.contact_type ?? '—').toUpperCase()}</span>
                  </td>
                  <td className="px-4 py-2" style={{ color: 'var(--muted)' }}>{fmt(c.email)}</td>
                  <td className="px-4 py-2" style={{ color: 'var(--muted)' }}>{fmt(c.phone)}</td>
                  <td className="px-4 py-2" style={{ color: 'var(--muted)' }}>{fmt(c.stage)}</td>
                  <td className="px-4 py-2" style={{ color: 'var(--muted)' }}>{fmt(c.lead_source)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            className="flex items-center justify-between px-6 py-3 border-t flex-shrink-0"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
          >
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              style={{
                fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '0.05em',
                color: page === 0 ? 'var(--muted)' : '#c9a84c',
                background: 'none', border: 'none', cursor: page === 0 ? 'default' : 'pointer',
              }}
            >
              ← PREV
            </button>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--muted)' }}>
              PAGE {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              style={{
                fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '0.05em',
                color: page >= totalPages - 1 ? 'var(--muted)' : '#c9a84c',
                background: 'none', border: 'none', cursor: page >= totalPages - 1 ? 'default' : 'pointer',
              }}
            >
              NEXT →
            </button>
          </div>
        )}
      </div>

      {/* ── Slide-out Contact Panel ───────────────────────────────────── */}
      {selected && (
        <div
          className="fixed right-0 flex flex-col border-l overflow-hidden"
          style={{ width: '400px', top: '56px', bottom: 0, background: 'var(--surface)', borderColor: 'var(--border)', zIndex: 50 }}
        >
          {/* Panel header */}
          <div
            className="flex items-start justify-between px-5 py-4 border-b flex-shrink-0"
            style={{ borderColor: 'var(--border)' }}
          >
            <div style={{ flex: 1, minWidth: 0, marginRight: '12px' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--fg)', letterSpacing: '0.05em', lineHeight: 1.1, marginBottom: '6px' }}>
                {`${selected.first_name ?? ''} ${selected.last_name ?? ''}`.trim() || '—'}
              </div>
              <span style={typeStyle(selected.contact_type)}>
                {String(selected.contact_type ?? '—').toUpperCase()}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {!editing ? (
                <button
                  onClick={startEdit}
                  style={{
                    fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.05em',
                    color: '#c9a84c', border: '1px solid #c9a84c', padding: '3px 10px',
                    borderRadius: '3px', background: 'none', cursor: 'pointer',
                  }}
                >
                  EDIT
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setEditing(false)}
                    style={{
                      fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--muted)',
                      border: '1px solid var(--border)', padding: '3px 10px',
                      borderRadius: '3px', background: 'none', cursor: 'pointer',
                    }}
                  >
                    CANCEL
                  </button>
                  <button
                    onClick={saveContact}
                    disabled={saving}
                    style={{
                      fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.05em',
                      color: '#000', background: saving ? 'rgba(201,168,76,0.5)' : '#c9a84c',
                      border: 'none', padding: '3px 10px', borderRadius: '3px',
                      cursor: saving ? 'default' : 'pointer',
                    }}
                  >
                    {saving ? 'SAVING...' : 'SAVE'}
                  </button>
                </>
              )}
              <button
                onClick={closePanel}
                style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', lineHeight: 1, padding: '0 4px' }}
              >
                ×
              </button>
            </div>
          </div>

          {/* Panel body */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {orderedFields(selected).map(key => (
              <div key={key} className="mb-4">
                <div
                  style={{
                    color: 'var(--muted)', fontSize: '10px', fontFamily: 'var(--font-mono)',
                    letterSpacing: '0.08em', marginBottom: '3px',
                  }}
                >
                  {fieldLabel(key).toUpperCase()}
                </div>
                {editing && !READONLY_FIELDS.includes(key) ? (
                  <input
                    value={editData[key] ?? ''}
                    onChange={e => setEditData(d => ({ ...d, [key]: e.target.value }))}
                    style={{
                      width: '100%', background: 'var(--bg)', border: '1px solid var(--border)',
                      color: 'var(--fg)', fontFamily: 'var(--font-mono)', fontSize: '13px',
                      padding: '4px 8px', borderRadius: '3px', outline: 'none',
                      boxSizing: 'border-box' as const,
                    }}
                  />
                ) : (
                  <div style={{ color: 'var(--fg)', fontFamily: 'var(--font-mono)', fontSize: '13px', wordBreak: 'break-all' as const }}>
                    {fmt(selected[key])}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
