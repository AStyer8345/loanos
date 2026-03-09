'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

// ── Types ────────────────────────────────────────────────────────────────────

type Contact = Record<string, unknown> & {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  contact_type: string | null
  stage: string | null
  lead_source: string | null
  referred_by: string | null
  created_at: string | null
}

// ── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 50

// Fields shown first in slide-out, in this order
const PRIORITY_FIELDS = [
  'first_name', 'last_name', 'email', 'phone', 'contact_type',
  'stage', 'lead_source', 'referred_by', 'company', 'notes',
]

// Never display
const SKIP_FIELDS = new Set(['id', 'user_id'])

// Display only, no editing
const READONLY_FIELDS = new Set(['created_at', 'updated_at'])

const TYPE_COLORS: Record<string, { border: string; color: string }> = {
  borrower: { border: 'var(--green)',  color: 'var(--green)' },
  realtor:  { border: 'var(--gold)',   color: 'var(--gold)'  },
  other:    { border: 'var(--border)', color: 'var(--muted)' },
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(val: unknown): string {
  if (val === null || val === undefined || val === '') return '—'
  if (typeof val === 'boolean') return val ? 'Yes' : 'No'
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) {
    return new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }
  return String(val)
}

function fieldLabel(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function typeStyle(type: string | null) {
  return TYPE_COLORS[type ?? ''] ?? TYPE_COLORS.other
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function ContactsPage() {
  const supabase = createClient()

  // ── State ─────────────────────────────────────────────────────────────────
  const [contacts, setContacts]             = useState<Contact[]>([])
  const [total, setTotal]                   = useState(0)
  const [page, setPage]                     = useState(0)
  const [search, setSearch]                 = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [typeFilter, setTypeFilter]         = useState('')
  const [stageFilter, setStageFilter]       = useState('')
  const [leadSourceFilter, setLeadSourceFilter] = useState('')
  const [loading, setLoading]               = useState(true)
  const [selected, setSelected]             = useState<Contact | null>(null)
  const [editing, setEditing]               = useState(false)
  const [editFields, setEditFields]         = useState<Record<string, string>>({})
  const [saving, setSaving]                 = useState(false)
  const [saveMsg, setSaveMsg]               = useState<{ ok: boolean; msg: string } | null>(null)

  // Stage and lead_source options populated from data
  const [stageOptions, setStageOptions]         = useState<string[]>([])
  const [leadSourceOptions, setLeadSourceOptions] = useState<string[]>([])

  // ── Debounce search ────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(0)
    }, 300)
    return () => clearTimeout(t)
  }, [search])

  // ── Fetch options (distinct stage + lead_source values) ───────────────────
  useEffect(() => {
    async function fetchOptions() {
      const { data } = await supabase
        .from('contacts')
        .select('stage, lead_source')
        .not('stage', 'is', null)
      if (!data) return
      const stages = [...new Set(data.map(r => r.stage).filter(Boolean))] as string[]
      const sources = [...new Set(data.map(r => r.lead_source).filter(Boolean))] as string[]
      setStageOptions(stages.sort())
      setLeadSourceOptions(sources.sort())
    }
    fetchOptions()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch contacts ─────────────────────────────────────────────────────────
  const fetchContacts = useCallback(async () => {
    setLoading(true)

    let query = supabase
      .from('contacts')
      .select('*', { count: 'exact' })
      .order('last_name', { ascending: true })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1)

    if (debouncedSearch.trim()) {
      const q = `%${debouncedSearch.trim()}%`
      query = query.or(
        `first_name.ilike.${q},last_name.ilike.${q},email.ilike.${q},phone.ilike.${q}`
      )
    }

    if (typeFilter)       query = query.eq('contact_type', typeFilter)
    if (stageFilter)      query = query.eq('stage', stageFilter)
    if (leadSourceFilter) query = query.eq('lead_source', leadSourceFilter)

    const { data, count, error } = await query

    if (!error) {
      setContacts((data as Contact[]) ?? [])
      setTotal(count ?? 0)
    }
    setLoading(false)
  }, [debouncedSearch, page, typeFilter, stageFilter, leadSourceFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchContacts() }, [fetchContacts])

  // ── Slide-out helpers ─────────────────────────────────────────────────────
  function openContact(c: Contact) {
    setSelected(c)
    setEditing(false)
    setSaveMsg(null)
    setEditFields(
      Object.fromEntries(
        Object.entries(c)
          .filter(([k]) => !SKIP_FIELDS.has(k) && !READONLY_FIELDS.has(k))
          .map(([k, v]) => [k, v === null || v === undefined ? '' : String(v)])
      )
    )
  }

  function closePanel() {
    setSelected(null)
    setEditing(false)
    setSaveMsg(null)
  }

  async function saveContact() {
    if (!selected) return
    setSaving(true)
    setSaveMsg(null)

    // Build update payload — convert empty string → null for non-required fields
    const updateData: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(editFields)) {
      updateData[k] = v.trim() === '' ? null : v.trim()
    }

    const { data, error } = await supabase
      .from('contacts')
      .update(updateData)
      .eq('id', selected.id)
      .select()
      .single()

    if (error) {
      setSaveMsg({ ok: false, msg: error.message })
    } else {
      const updated = data as Contact
      setSelected(updated)
      // Update row in table without full reload
      setContacts(prev => prev.map(c => c.id === updated.id ? updated : c))
      setEditing(false)
      setSaveMsg({ ok: true, msg: 'Saved.' })
    }
    setSaving(false)
  }

  // ── Slide-out field ordering ──────────────────────────────────────────────
  function orderedFields(c: Contact): [string, unknown][] {
    const allKeys = Object.keys(c).filter(k => !SKIP_FIELDS.has(k))
    const prioritized = PRIORITY_FIELDS.filter(k => allKeys.includes(k))
    const rest = allKeys.filter(k => !PRIORITY_FIELDS.includes(k)).sort()
    return [...prioritized, ...rest].map(k => [k, c[k]])
  }

  // ── Pagination ────────────────────────────────────────────────────────────
  const totalPages = Math.ceil(total / PAGE_SIZE)

  // ── CSS helpers ───────────────────────────────────────────────────────────
  const inputCls = 'rounded border px-3 py-2 font-mono text-xs outline-none transition-colors'
  const inputStyle = { background: 'var(--surface2)', borderColor: 'var(--border)', color: 'var(--text)' }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full">

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div
        className="flex flex-col flex-1 overflow-hidden transition-all"
        style={{ paddingRight: selected ? '400px' : '0' }}
      >

        {/* Header */}
        <div className="px-8 pt-8 pb-4 shrink-0">
          <h1 className="font-display text-4xl tracking-widest leading-none" style={{ color: 'var(--text)' }}>
            CONTACTS
          </h1>
          <p className="font-mono text-xs mt-2" style={{ color: 'var(--muted)' }}>
            {loading ? 'Loading…' : `${total.toLocaleString()} records`}
          </p>
        </div>

        {/* Search + Filters */}
        <div className="px-8 pb-4 shrink-0">
          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              placeholder="Search name, email, phone…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={`${inputCls} flex-1 min-w-[200px]`}
              style={inputStyle}
            />

            <select
              value={typeFilter}
              onChange={e => { setTypeFilter(e.target.value); setPage(0) }}
              className={inputCls}
              style={inputStyle}
            >
              <option value="">All Types</option>
              <option value="borrower">Borrower</option>
              <option value="realtor">Realtor</option>
              <option value="other">Other</option>
            </select>

            {stageOptions.length > 0 && (
              <select
                value={stageFilter}
                onChange={e => { setStageFilter(e.target.value); setPage(0) }}
                className={inputCls}
                style={inputStyle}
              >
                <option value="">All Stages</option>
                {stageOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            )}

            {leadSourceOptions.length > 0 && (
              <select
                value={leadSourceFilter}
                onChange={e => { setLeadSourceFilter(e.target.value); setPage(0) }}
                className={inputCls}
                style={inputStyle}
              >
                <option value="">All Sources</option>
                {leadSourceOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            )}

            {(search || typeFilter || stageFilter || leadSourceFilter) && (
              <button
                onClick={() => { setSearch(''); setTypeFilter(''); setStageFilter(''); setLeadSourceFilter(''); setPage(0) }}
                className={`${inputCls} px-3`}
                style={{ ...inputStyle, color: 'var(--muted)', cursor: 'pointer' }}
              >
                ✕ Clear
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto px-8">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0" style={{ background: 'var(--bg)' }}>
              <tr>
                {['NAME', 'TYPE', 'PHONE', 'EMAIL', 'STAGE', 'LEAD SOURCE', 'REFERRED BY', 'CREATED'].map(col => (
                  <th
                    key={col}
                    className="font-mono text-[10px] tracking-widest py-3 pr-6 border-b"
                    style={{ color: 'var(--muted)', borderColor: 'var(--border)' }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="font-mono text-xs py-12 text-center" style={{ color: 'var(--muted)' }}>
                    Loading…
                  </td>
                </tr>
              ) : contacts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="font-mono text-xs py-12 text-center" style={{ color: 'var(--muted)' }}>
                    No contacts found.
                  </td>
                </tr>
              ) : contacts.map(c => {
                const ts = typeStyle(c.contact_type)
                const isSelected = selected?.id === c.id
                return (
                  <tr
                    key={c.id}
                    onClick={() => openContact(c)}
                    className="cursor-pointer border-b transition-colors"
                    style={{
                      borderColor: 'var(--border)',
                      background: isSelected ? 'var(--surface2)' : 'transparent',
                    }}
                    onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'var(--surface)' }}
                    onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                  >
                    <td className="font-mono text-xs py-3 pr-6" style={{ color: 'var(--text)' }}>
                      {[c.first_name, c.last_name].filter(Boolean).join(' ') || '—'}
                    </td>
                    <td className="py-3 pr-6">
                      <span
                        className="font-mono text-[10px] tracking-widest px-2 py-0.5 rounded border"
                        style={{ borderColor: ts.border, color: ts.color }}
                      >
                        {(c.contact_type ?? 'other').toUpperCase()}
                      </span>
                    </td>
                    <td className="font-mono text-xs py-3 pr-6" style={{ color: 'var(--muted)' }}>
                      {c.phone ?? '—'}
                    </td>
                    <td className="font-mono text-xs py-3 pr-6" style={{ color: 'var(--muted)' }}>
                      {c.email ?? '—'}
                    </td>
                    <td className="font-mono text-xs py-3 pr-6" style={{ color: 'var(--muted)' }}>
                      {c.stage ?? '—'}
                    </td>
                    <td className="font-mono text-xs py-3 pr-6" style={{ color: 'var(--muted)' }}>
                      {c.lead_source ?? '—'}
                    </td>
                    <td className="font-mono text-xs py-3 pr-6" style={{ color: 'var(--muted)' }}>
                      {c.referred_by ?? '—'}
                    </td>
                    <td className="font-mono text-xs py-3" style={{ color: 'var(--muted)' }}>
                      {c.created_at ? new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-8 py-4 shrink-0 flex items-center gap-4 border-t" style={{ borderColor: 'var(--border)' }}>
            <button
              disabled={page === 0}
              onClick={() => setPage(p => Math.max(0, p - 1))}
              className="font-mono text-xs px-3 py-1.5 rounded border transition-colors"
              style={page === 0
                ? { borderColor: 'var(--border)', color: 'var(--muted)', cursor: 'not-allowed' }
                : { borderColor: 'var(--gold)', color: 'var(--gold)', cursor: 'pointer' }
              }
            >
              ← PREV
            </button>
            <span className="font-mono text-xs" style={{ color: 'var(--muted)' }}>
              {page + 1} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              className="font-mono text-xs px-3 py-1.5 rounded border transition-colors"
              style={page >= totalPages - 1
                ? { borderColor: 'var(--border)', color: 'var(--muted)', cursor: 'not-allowed' }
                : { borderColor: 'var(--gold)', color: 'var(--gold)', cursor: 'pointer' }
              }
            >
              NEXT →
            </button>
          </div>
        )}
      </div>

      {/* ── Slide-out panel ───────────────────────────────────────────────── */}
      {selected && (
        <div
          className="fixed top-0 right-0 h-full flex flex-col border-l overflow-hidden"
          style={{
            width: '400px',
            background: 'var(--surface)',
            borderColor: 'var(--border)',
            zIndex: 20,
          }}
        >
          {/* Panel header */}
          <div
            className="flex items-center justify-between px-6 py-5 border-b shrink-0"
            style={{ borderColor: 'var(--border)' }}
          >
            <div>
              <div className="font-display text-xl tracking-widest" style={{ color: 'var(--text)' }}>
                {[selected.first_name, selected.last_name].filter(Boolean).join(' ') || 'Contact'}
              </div>
              <div
                className="font-mono text-[10px] tracking-widest mt-1 px-2 py-0.5 inline-block rounded border"
                style={{ borderColor: typeStyle(selected.contact_type).border, color: typeStyle(selected.contact_type).color }}
              >
                {(selected.contact_type ?? 'other').toUpperCase()}
              </div>
            </div>
            <button
              onClick={closePanel}
              className="font-mono text-sm transition-colors ml-4"
              style={{ color: 'var(--muted)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
            >
              ✕
            </button>
          </div>

          {/* Save message */}
          {saveMsg && (
            <div
              className="mx-6 mt-4 shrink-0 rounded border px-4 py-2 font-mono text-xs"
              style={saveMsg.ok
                ? { borderColor: 'var(--green)', color: 'var(--green)', background: 'rgba(62,214,138,0.05)' }
                : { borderColor: 'var(--red)', color: 'var(--red)', background: 'rgba(224,92,92,0.05)' }
              }
            >
              {saveMsg.ok ? '✓ ' : '✗ '}{saveMsg.msg}
            </div>
          )}

          {/* Fields */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {orderedFields(selected).map(([key, val]) => {
              const isReadonly = READONLY_FIELDS.has(key)
              const label = fieldLabel(key)

              if (editing && !isReadonly) {
                return (
                  <div key={key}>
                    <label className="block font-mono text-[10px] tracking-widest mb-1" style={{ color: 'var(--muted)' }}>
                      {label.toUpperCase()}
                    </label>
                    {key === 'contact_type' ? (
                      <select
                        value={editFields[key] ?? ''}
                        onChange={e => setEditFields(prev => ({ ...prev, [key]: e.target.value }))}
                        className={`w-full ${inputCls}`}
                        style={inputStyle}
                      >
                        <option value="borrower">Borrower</option>
                        <option value="realtor">Realtor</option>
                        <option value="other">Other</option>
                      </select>
                    ) : key === 'notes' ? (
                      <textarea
                        value={editFields[key] ?? ''}
                        onChange={e => setEditFields(prev => ({ ...prev, [key]: e.target.value }))}
                        rows={4}
                        className={`w-full ${inputCls}`}
                        style={{ ...inputStyle, resize: 'vertical' }}
                      />
                    ) : (
                      <input
                        type="text"
                        value={editFields[key] ?? ''}
                        onChange={e => setEditFields(prev => ({ ...prev, [key]: e.target.value }))}
                        className={`w-full ${inputCls}`}
                        style={inputStyle}
                      />
                    )}
                  </div>
                )
              }

              return (
                <div key={key}>
                  <div className="font-mono text-[10px] tracking-widest mb-0.5" style={{ color: 'var(--muted)' }}>
                    {label.toUpperCase()}
                  </div>
                  <div className="font-mono text-xs" style={{ color: isReadonly ? 'var(--muted)' : 'var(--text)', whiteSpace: 'pre-wrap' }}>
                    {fmt(val)}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Panel actions */}
          <div className="px-6 py-4 border-t shrink-0 flex gap-3" style={{ borderColor: 'var(--border)' }}>
            {editing ? (
              <>
                <button
                  onClick={saveContact}
                  disabled={saving}
                  className="flex-1 font-mono text-xs tracking-widest py-2.5 rounded border transition-colors"
                  style={saving
                    ? { borderColor: 'var(--border)', color: 'var(--muted)', background: 'transparent' }
                    : { borderColor: 'var(--gold)', color: 'var(--bg)', background: 'var(--gold)', cursor: 'pointer' }
                  }
                >
                  {saving ? 'SAVING…' : 'SAVE'}
                </button>
                <button
                  onClick={() => { setEditing(false); setSaveMsg(null) }}
                  className="font-mono text-xs tracking-widest py-2.5 px-4 rounded border transition-colors"
                  style={{ borderColor: 'var(--border)', color: 'var(--muted)', cursor: 'pointer' }}
                >
                  CANCEL
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="flex-1 font-mono text-xs tracking-widest py-2.5 rounded border transition-colors"
                style={{ borderColor: 'var(--gold)', color: 'var(--gold)', background: 'transparent', cursor: 'pointer' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--gold)'; (e.currentTarget as HTMLElement).style.color = 'var(--bg)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--gold)' }}
              >
                EDIT CONTACT
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
