'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowLeft,
  Phone,
  Mail,
  MessageSquare,
  AlertCircle,
  Clock,
  Inbox,
  Check,
  X,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  StickyNote,
  Plus,
  Trash2,
} from 'lucide-react'
import { useOutreachChat } from '@/components/outreach/OutreachChatContext'
import { fmtCurrency, fmtDate, fmtPhone } from '@/lib/formatters'
import { statusHex } from '@/lib/constants/loan-stages'

export type Contact = {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  contact_type: string | null
  stage: string | null
  referred_by: string | null
  referral_type?: string | null
  lead_source?: string | null
  co_borrower_first?: string | null
  co_borrower_last?: string | null
  co_borrower_birthdate?: string | null
  co_borrower_mobile?: string | null
  co_borrower_email?: string | null
  notes: string | null
  last_touch: string | null
  closing_date: string | null
  created_at: string | null
  group_tag: string | null
  mailing_street: string | null
  mailing_city: string | null
  mailing_state: string | null
  mailing_zip: string | null
  mailing_country: string | null
  phone_mobile: string | null
  title: string | null
  created_date: string | null
  last_activity_date: string | null
  last_activity_type: string | null
  last_activity_notes: string | null
}

export type ContactLoan = {
  id: string
  loan_name: string | null
  borrower_name: string | null
  borrower_first_name: string | null
  borrower_last_name: string | null
  status: string | null
  loan_amount: number | null
  interest_rate: number | null
  closing_date: string | null
  property_address: string | null
  property_city: string | null
  property_state: string | null
  loan_purpose: string | null
  loan_type: string | null
}

export type ActivityEntry = {
  id: string
  created_at: string
  // Legacy columns
  action: string
  entity_type: string | null
  metadata: Record<string, unknown> | null
  // New columns added in migration 008
  type?: string | null
  summary?: string | null
  raw_payload?: Record<string, unknown> | null
  external_id?: string | null
  // Cross-entity fields
  loan_id?: string | null
  _source?: string
}

export type ContactActivityRow = {
  id: string
  activity_type: 'call' | 'email' | 'text' | 'note'
  notes: string | null
  logged_at: string
  created_by: string | null
  loan_id: string | null
}

export type EmailDraftRow = {
  id: string
  automation_name: string
  recipient_name: string | null
  recipient_email: string
  subject: string
  body_html: string
  body_preview: string | null
  status: string
  created_at: string
}

export type ContactEmailRow = {
  id: string
  subject: string
  body_html: string | null
  body_text: string | null
  automation_source: string | null
  sent_at: string
  created_at: string
}

// fmtCurrency and fmtDate imported from @/lib/formatters

function fullName(c: Contact) {
  return `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() || '-'
}

function initials(c: Contact) {
  const first = (c.first_name ?? '').trim().slice(0, 1).toUpperCase()
  const last = (c.last_name ?? '').trim().slice(0, 1).toUpperCase()
  return (first + last) || '?'
}

const REFERRAL_TYPE_LABELS: Record<string, string> = {
  web_lead:                    'Web Lead',
  realtor_referral:            'Realtor Referral',
  client_referral:             'Client Referral',
  past_client:                 'Past Client',
  friend_family:               'Friend / Family',
  financial_advisor_referral:  'Financial Advisor',
  builder_referral:            'Builder Referral',
  open_house:                  'Open House',
  other:                       'Other',
}

// Stage badge for contacts (uses contact stage labels)
function getStageBadgeStyle(stage: string | null): React.CSSProperties {
  const map: Record<string, string> = {
    Lead: 'rgba(201,168,76,0.15)',
    'Pre-App': 'rgba(201,168,76,0.20)',
    Application: 'rgba(100,160,255,0.15)',
    'Pre-Approved': 'rgba(80,200,120,0.15)',
    'In Process': 'rgba(80,160,200,0.15)',
    Closing: 'rgba(160,100,220,0.15)',
    Closed: 'rgba(100,100,100,0.15)',
  }
  return {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 3,
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    background: stage ? (map[stage] ?? 'rgba(255,255,255,0.06)') : 'transparent',
  }
}

// Loan status badge — uses global statusHex map to match Loans table + dashboard
function LoanStageBadge({ status }: { status: string | null }) {
  if (!status) return <span style={{ color: 'var(--muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }}>—</span>
  const hex = statusHex(status)
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', borderRadius: 12,
      fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 600,
      background: `${hex}22`,
      color: hex,
      border: `1px solid ${hex}44`,
    }}>
      {status}
    </span>
  )
}

function isActiveLoan(status: string | null) {
  if (!status) return false
  const s = status.toLowerCase()
  return !['closed', 'funded', 'closed/funded', 'denied', 'withdrawn'].some(v => s.includes(v))
}

const cardStyle: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  padding: '16px 20px',
}

const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 9,
  color: 'var(--muted)',
  letterSpacing: '0.1em',
  marginBottom: 4,
}

const LEFT_TABS = [
  { id: 'overview' as const, label: 'Overview' },
  { id: 'emails'   as const, label: 'Emails' },
]

type LeftTab = 'overview' | 'emails'

type Props = {
  contact: Contact
  loans: ContactLoan[]
  referredLoans?: ContactLoan[]
  activity: ActivityEntry[]
  contactActivity: ContactActivityRow[]
  emailDrafts: EmailDraftRow[]
  inboundEmails: InboundEmailRow[]
  contactEmails?: ContactEmailRow[]
  referrerContactId: string | null
  activeTab: 'overview' | 'loans' | 'activity' | 'emails'
  setActiveTab: (t: 'overview' | 'loans' | 'activity' | 'emails') => void
  newNote: string
  setNewNote: (s: string) => void
  savingNote: boolean
  onAddNote: () => void
  onSaveField?: (field: keyof Contact, value: string | null) => Promise<void>
  onLogActivity?: (type: ContactActivityRow['activity_type'], notes: string) => Promise<void>
  onDeleteActivity?: (id: string) => Promise<void>
}

// Typeahead for referred_by — searches existing contacts by name
type TAResult = { id: string; first_name: string | null; last_name: string | null; contact_type: string | null }

function ReferredByTypeahead({ value, onSave }: {
  value: string | null
  onSave: (field: keyof Contact, value: string | null) => Promise<void>
}) {
  const supabase = createClient()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft]     = useState(value ?? '')
  const [results, setResults] = useState<TAResult[]>([])
  const [open, setOpen]       = useState(false)
  const [highlighted, setHighlighted] = useState(0)
  const [saved, setSaved]     = useState(false)
  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const baseStyle: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontSize: 13 }

  function runSearch(term: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!term.trim()) { setResults([]); setOpen(false); return }
    debounceRef.current = setTimeout(async () => {
      const { data } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, contact_type')
        .or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%`)
        .limit(20)
      // Sort so realtors appear before borrowers
      const sorted = ((data ?? []) as TAResult[]).sort((a, b) => {
        const aR = (a.contact_type === 'realtor' || a.contact_type === 'agent') ? 0 : 1
        const bR = (b.contact_type === 'realtor' || b.contact_type === 'agent') ? 0 : 1
        return aR - bR
      }).slice(0, 10)
      setResults(sorted)
      setOpen(sorted.length > 0)
      setHighlighted(0)
    }, 300)
  }

  function select(c: TAResult) {
    const name = `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim()
    setDraft(name)
    setResults([])
    setOpen(false)
  }

  async function commit() {
    setEditing(false)
    setOpen(false)
    const next = draft.trim() || null
    await onSave('referred_by', next)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && open && results[highlighted]) {
      e.preventDefault(); select(results[highlighted])
    } else if (e.key === 'Enter') {
      e.preventDefault(); commit()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault(); setHighlighted(h => Math.min(h + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault(); setHighlighted(h => Math.max(h - 1, 0))
    } else if (e.key === 'Escape') {
      setOpen(false); setEditing(false); setDraft(value ?? '')
    }
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        if (editing) commit()
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing, draft])

  if (editing) return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div style={{ ...baseStyle, fontSize: 9, color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: 4 }}>REFERRED BY</div>
      <input
        autoFocus
        value={draft}
        placeholder="search by name…"
        onChange={e => { setDraft(e.target.value); runSearch(e.target.value) }}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        style={{
          ...baseStyle,
          color: 'var(--fg)', background: 'var(--bg)',
          border: '1px solid rgba(201,168,76,0.6)', borderRadius: 3,
          padding: '3px 8px', width: '100%', outline: 'none', boxSizing: 'border-box',
        }}
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
                fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg)',
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

  return (
    <div onClick={() => { setEditing(true); setDraft(value ?? '') }} title="Click to edit referred by" style={{ cursor: 'pointer' }}>
      <div style={{ ...baseStyle, fontSize: 9, color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: 2 }}>REFERRED BY</div>
      <div style={{
        ...baseStyle,
        color: saved ? '#6ee7b7' : (value ? 'var(--fg)' : 'var(--muted)'),
        borderBottom: '1px dashed rgba(201,168,76,0.25)',
        paddingBottom: 1, display: 'inline-block', minWidth: 80,
      }}>
        {saved ? '✓ Saved' : (value || '—')}
      </div>
    </div>
  )
}

// Inline select for referral_type — shows dropdown with predefined options only
function ReferralTypeSelect({ value, onSave }: {
  value: string | null
  onSave: (field: keyof Contact, value: string | null) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(false)
  const baseStyle: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontSize: 13 }

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value || null
    setEditing(false)
    await onSave('referral_type', next)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (editing) return (
    <div>
      <div style={{ ...baseStyle, fontSize: 9, color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: 4 }}>REFERRAL TYPE</div>
      <select
        autoFocus
        defaultValue={value ?? ''}
        onChange={handleChange}
        onBlur={() => setEditing(false)}
        style={{
          ...baseStyle,
          color: 'var(--fg)',
          background: 'var(--bg)',
          border: '1px solid rgba(201,168,76,0.6)',
          borderRadius: 3,
          padding: '3px 8px',
          width: '100%',
          outline: 'none',
        }}
      >
        <option value="">— none —</option>
        {Object.entries(REFERRAL_TYPE_LABELS).map(([k, v]) => (
          <option key={k} value={k}>{v}</option>
        ))}
      </select>
    </div>
  )

  return (
    <div onClick={() => setEditing(true)} title="Click to change referral type" style={{ cursor: 'pointer' }}>
      <div style={{ ...baseStyle, fontSize: 9, color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: 2 }}>REFERRAL TYPE</div>
      <div style={{
        ...baseStyle,
        color: saved ? '#6ee7b7' : (value ? 'var(--fg)' : 'var(--muted)'),
        borderBottom: '1px dashed rgba(201,168,76,0.25)',
        paddingBottom: 1,
        display: 'inline-block',
        minWidth: 80,
      }}>
        {saved ? '✓ Saved' : (value ? (REFERRAL_TYPE_LABELS[value] ?? value) : '—')}
      </div>
    </div>
  )
}

// Inline-editable text field — click to edit, blur/Enter to save
function EditableContactField({ label, value, field, onSave, display }: {
  label: string
  value: string | null
  field: keyof Contact
  onSave: (field: keyof Contact, value: string | null) => Promise<void>
  display?: string | null
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value ?? '')
  const [saved, setSaved] = useState(false)

  async function commit() {
    setEditing(false)
    const next = draft.trim() || null
    await onSave(field, next)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const baseStyle: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontSize: 13 }

  if (editing) {
    return (
      <div>
        <div style={{ ...baseStyle, fontSize: 9, color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: 4 }}>{label.toUpperCase()}</div>
        <input
          autoFocus
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
          style={{
            ...baseStyle,
            color: 'var(--fg)',
            background: 'var(--bg)',
            border: '1px solid rgba(201,168,76,0.6)',
            borderRadius: 3,
            padding: '3px 8px',
            outline: 'none',
            width: '100%',
            boxSizing: 'border-box',
          }}
        />
      </div>
    )
  }

  return (
    <div
      onClick={() => { setDraft(value ?? ''); setEditing(true) }}
      title="Click to edit"
      style={{ cursor: 'text' }}
    >
      <div style={{ ...baseStyle, fontSize: 9, color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: 2 }}>{label.toUpperCase()}</div>
      <div style={{
        ...baseStyle,
        color: saved ? '#6ee7b7' : (value ? 'var(--fg)' : 'var(--muted)'),
        borderBottom: '1px dashed rgba(201,168,76,0.25)',
        paddingBottom: 1,
        display: 'inline-block',
        minWidth: 80,
      }}>
        {saved ? '✓ Saved' : ((display ?? value) || '—')}
      </div>
    </div>
  )
}

// ── Loan card (used in Overview tab) ─────────────────────────────────────────
function LoanCard({ loan }: { loan: ContactLoan }) {
  const address = loan.property_address
    || [loan.property_city, loan.property_state].filter(Boolean).join(', ')
    || loan.loan_name
    || 'Untitled Loan'

  return (
    <Link
      href={`/dashboard/loans/${loan.id}`}
      style={{ textDecoration: 'none', display: 'block' }}
    >
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderLeft: '3px solid #c9a84c',
        borderRadius: 6,
        padding: '14px 18px',
        cursor: 'pointer',
        transition: 'border-color 0.15s',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              letterSpacing: '0.12em',
              color: 'var(--muted)',
              textTransform: 'uppercase',
            }}>
              {isActiveLoan(loan.status) ? 'Active Loan' : 'Loan'}
            </span>
            <LoanStageBadge status={loan.status} />
          </div>
          <ExternalLink size={12} style={{ color: 'var(--muted)' }} />
        </div>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 13,
          fontWeight: 600,
          color: '#c9a84c',
          marginBottom: 10,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {address}
        </div>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {[
            { label: 'Loan Amt', value: fmtCurrency(loan.loan_amount) },
            { label: 'Rate', value: loan.interest_rate != null ? `${Number(loan.interest_rate).toFixed(3)}%` : '-' },
            { label: 'Type', value: loan.loan_type || loan.loan_purpose || '-' },
            { label: 'Closing', value: fmtDate(loan.closing_date) },
          ].map(({ label, value }) => (
            <div key={label}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: 2 }}>{label}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg)' }}>{value}</div>
            </div>
          ))}
        </div>
      </div>
    </Link>
  )
}

// ── Activity type config ─────────────────────────────────────────────────────
const ACTIVITY_TYPE_CONFIG: Record<string, { icon: typeof Phone; color: string; bg: string; label: string }> = {
  call:  { icon: Phone,          color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', label: 'Call' },
  text:  { icon: MessageSquare,  color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  label: 'Text' },
  email: { icon: Mail,           color: '#34d399', bg: 'rgba(52,211,153,0.12)',  label: 'Email' },
  note:  { icon: StickyNote,     color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  label: 'Note' },
}

// ── Activity feed item ───────────────────────────────────────────────────────
function ActivityFeedItem({ item, onDelete }: { item: ContactActivityRow; onDelete?: (id: string) => Promise<void> }) {
  const cfg = ACTIVITY_TYPE_CONFIG[item.activity_type] ?? ACTIVITY_TYPE_CONFIG.note
  const Icon = cfg.icon
  const ts = new Date(item.logged_at)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - ts.getTime()) / 86400000)
  const [expanded, setExpanded] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const timeLabel = diffDays === 0
    ? ts.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : diffDays === 1 ? 'Yesterday'
    : diffDays < 7 ? `${diffDays}d ago`
    : ts.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  const preview = item.notes
    ? item.notes.replace(/\n+/g, ' ').slice(0, 80) + (item.notes.length > 80 ? '…' : '')
    : null

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!onDelete) return
    setDeleting(true)
    await onDelete(item.id)
    setDeleting(false)
  }

  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      <div
        onClick={() => setExpanded(e => !e)}
        style={{ display: 'flex', gap: 10, padding: '9px 0', alignItems: 'center', cursor: 'pointer' }}
      >
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Icon size={13} style={{ color: cfg.color }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: cfg.color }}>
              {cfg.label}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                {timeLabel}
              </span>
              <ChevronDown size={11} style={{ color: 'var(--muted)', transition: 'transform 0.15s', transform: expanded ? 'rotate(180deg)' : 'none' }} />
            </div>
          </div>
          {!expanded && preview && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {preview}
            </div>
          )}
        </div>
      </div>
      {expanded && (
        <div style={{ paddingLeft: 38, paddingBottom: 10 }}>
          {item.notes && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg)', lineHeight: 1.6, whiteSpace: 'pre-wrap', marginBottom: 8 }}>
              {item.notes}
            </div>
          )}
          {onDelete && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                fontFamily: 'var(--font-mono)', fontSize: 10, color: '#ef4444',
                background: 'transparent', border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 4, padding: '3px 8px', cursor: deleting ? 'default' : 'pointer',
                opacity: deleting ? 0.5 : 1,
              }}
            >
              <Trash2 size={10} /> {deleting ? 'Deleting…' : 'Delete'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────
export function ContactRecordView(props: Props) {
  const {
    contact,
    loans,
    referredLoans = [],
    contactActivity,
    emailDrafts,
    inboundEmails,
    contactEmails = [],
    referrerContactId,
    onSaveField,
    onLogActivity,
    onDeleteActivity,
  } = props

  const { setActiveRecord } = useOutreachChat()

  useEffect(() => {
    const name = [contact.first_name, contact.last_name].filter(Boolean).join(' ') || 'Contact'
    setActiveRecord({ id: contact.id, type: 'contact', name })
    return () => setActiveRecord(null)
  }, [contact.id, contact.first_name, contact.last_name, setActiveRecord])

  const [leftTab, setLeftTab] = useState<LeftTab>('overview')

  // Activity form state
  const [activityFormType, setActivityFormType] = useState<ContactActivityRow['activity_type'] | null>(null)
  const [activityNotes, setActivityNotes] = useState('')
  const [activitySaving, setActivitySaving] = useState(false)
  const [activityError, setActivityError] = useState<string | null>(null)

  // Log prompt after Call/Text/Email click
  const [logPromptType, setLogPromptType] = useState<'call' | 'text' | 'email' | null>(null)

  const activityNotesRef = useRef<HTMLTextAreaElement>(null)

  const phone = contact.phone || contact.phone_mobile || null
  const cityState = [contact.mailing_city, contact.mailing_state].filter(Boolean).join(', ')
  const mailingParts = [contact.mailing_street, cityState, contact.mailing_zip].filter(Boolean)
  const mailingAddress = mailingParts.length ? mailingParts.join(', ') : null

  // Focus textarea when activity form opens
  useEffect(() => {
    if (activityFormType && activityNotesRef.current) {
      activityNotesRef.current.focus()
    }
  }, [activityFormType])

  const handleLogActivity = async () => {
    if (!activityFormType || !onLogActivity) return
    setActivitySaving(true)
    setActivityError(null)
    try {
      await onLogActivity(activityFormType, activityNotes)
      setActivityFormType(null)
      setActivityNotes('')
    } catch (err) {
      setActivityError((err as Error).message || 'Failed to save')
    }
    setActivitySaving(false)
  }

  const handleActionClick = (type: 'call' | 'text' | 'email') => {
    // Show log prompt after a brief delay to let the native app open
    setTimeout(() => setLogPromptType(type), 500)
  }

  const handleLogPromptAccept = () => {
    if (logPromptType) {
      setActivityFormType(logPromptType)
      setActivityNotes('')
      setLogPromptType(null)
    }
  }

  // Shared action button base
  const actionBtnBase: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: '0.06em',
    padding: '9px 22px',
    borderRadius: 5,
    textDecoration: 'none',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)', color: 'var(--fg)', fontFamily: 'var(--font-mono)', overflow: 'hidden' }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ flexShrink: 0, padding: '20px 28px 16px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>

        <Link
          href="/dashboard/contacts"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--muted)', textDecoration: 'none', marginBottom: 16 }}
        >
          <ArrowLeft size={12} />
          Back to Contacts
        </Link>

        {/* Avatar + Name + Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 16 }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: 'rgba(201,168,76,0.18)', color: '#c9a84c',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700,
            flexShrink: 0, border: '1px solid rgba(201,168,76,0.3)',
          }}>
            {initials(contact)}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{
              fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700,
              letterSpacing: '0.03em', margin: 0, lineHeight: 1.2,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {fullName(contact)}
            </h1>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', marginTop: 7 }}>
              <span style={getStageBadgeStyle(contact.stage)}>{contact.stage ?? '-'}</span>
              <span style={{ ...getStageBadgeStyle(null), background: 'rgba(255,255,255,0.08)', textTransform: 'capitalize' }}>
                {contact.contact_type ?? '-'}
              </span>
              {contact.group_tag && (
                <span style={{ ...getStageBadgeStyle(null), background: 'rgba(201,168,76,0.12)', color: '#c9a84c' }}>
                  {contact.group_tag}
                </span>
              )}
              {contact.referral_type && (
                <span style={{ ...getStageBadgeStyle(null), background: 'rgba(59,130,246,0.12)', color: '#60a5fa', textTransform: 'none' }}>
                  {REFERRAL_TYPE_LABELS[contact.referral_type] ?? contact.referral_type}
                </span>
              )}
              {contact.referred_by && (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>
                  via{' '}
                  {referrerContactId ? (
                    <Link href={`/dashboard/contacts/${referrerContactId}`} style={{ color: '#c9a84c', textDecoration: 'none' }}>
                      {contact.referred_by}
                    </Link>
                  ) : contact.referred_by}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons: Call, Text, Email */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {phone && (
            <a
              href={`tel:${phone.replace(/\D/g, '')}`}
              onClick={() => handleActionClick('call')}
              style={{ ...actionBtnBase, background: 'transparent', color: '#c9a84c', border: '1.5px solid rgba(201,168,76,0.5)' }}
            >
              <Phone size={13} />
              Call
            </a>
          )}
          {phone && (
            <a
              href={`sms:${phone.replace(/\D/g, '')}`}
              onClick={() => handleActionClick('text')}
              style={{ ...actionBtnBase, background: 'transparent', color: '#c9a84c', border: '1.5px solid rgba(201,168,76,0.5)' }}
            >
              <MessageSquare size={13} />
              Text
            </a>
          )}
          {contact.email && (
            <a
              href={`mailto:${contact.email}`}
              onClick={() => handleActionClick('email')}
              style={{ ...actionBtnBase, background: '#c9a84c', color: '#000', border: 'none' }}
            >
              <Mail size={13} />
              Email
            </a>
          )}
        </div>

        {/* Log prompt after Call/Text/Email */}
        {logPromptType && (
          <div style={{
            marginTop: 10, padding: '10px 14px',
            background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg)' }}>
              Log this {logPromptType}?
            </span>
            <button
              onClick={handleLogPromptAccept}
              style={{
                fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
                background: '#c9a84c', color: '#000', border: 'none',
                padding: '4px 12px', borderRadius: 4, cursor: 'pointer',
              }}
            >
              Log it
            </button>
            <button
              onClick={() => setLogPromptType(null)}
              style={{
                fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
                background: 'transparent', color: 'var(--muted)', border: '1px solid var(--border)',
                padding: '4px 12px', borderRadius: 4, cursor: 'pointer',
              }}
            >
              Skip
            </button>
          </div>
        )}
      </div>

      {/* ── Two-column body ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', marginTop: 0 }}>

        {/* ── Left column: tabs + content ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

          {/* Tab bar */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', paddingLeft: 28, flexShrink: 0 }}>
            {LEFT_TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setLeftTab(t.id)}
                style={{
                  padding: '8px 16px', fontSize: 11,
                  fontFamily: 'var(--font-mono)', fontWeight: 600,
                  letterSpacing: '0.08em', background: 'none', border: 'none',
                  borderBottom: leftTab === t.id ? '2px solid #c9a84c' : '2px solid transparent',
                  color: leftTab === t.id ? '#c9a84c' : 'var(--muted)',
                  cursor: 'pointer', textTransform: 'uppercase', marginBottom: -1,
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Scrollable tab content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px 40px' }}>

            {leftTab === 'overview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* ── Active Loans section (moved from separate tab) ── */}
                <div style={cardStyle}>
                  <div style={labelStyle}>ACTIVE LOAN(S)</div>
                  {loans.length === 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 0', color: 'var(--muted)' }}>
                      <AlertCircle size={16} />
                      <span style={{ fontSize: 12 }}>No active loans</span>
                      <Link
                        href="/dashboard/loans"
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          fontFamily: 'var(--font-mono)', fontSize: 11, color: '#c9a84c',
                          textDecoration: 'none', marginLeft: 8,
                        }}
                      >
                        <Plus size={12} /> New Loan
                      </Link>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {loans.map(loan => (
                        <LoanCard key={loan.id} loan={loan} />
                      ))}
                    </div>
                  )}
                </div>

                {/* ── Referred Borrowers (realtors only) ── */}
                {(contact.contact_type?.toLowerCase().includes('realtor') || referredLoans.length > 0) && (
                  <div style={cardStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div style={labelStyle}>REFERRED BORROWERS</div>
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
                        background: referredLoans.length > 0 ? '#c9a84c22' : 'transparent',
                        color: referredLoans.length > 0 ? '#c9a84c' : 'var(--muted)',
                        border: `1px solid ${referredLoans.length > 0 ? '#c9a84c44' : 'transparent'}`,
                        borderRadius: 4, padding: '2px 6px',
                      }}>
                        {referredLoans.length} loan{referredLoans.length !== 1 ? 's' : ''} referred
                      </span>
                    </div>
                    {referredLoans.length === 0 ? (
                      <div style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 12, padding: '8px 0' }}>
                        No referrals yet
                      </div>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid var(--border)' }}>
                              {['Borrower', 'Loan Amount', 'Status', 'Close Date'].map(h => (
                                <th key={h} style={{ textAlign: 'left', padding: '4px 8px 8px 0', fontSize: 9, color: '#c9a84c', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {referredLoans.map(loan => {
                              const borrowerName = [loan.borrower_first_name, loan.borrower_last_name].filter(Boolean).join(' ')
                                || loan.borrower_name || loan.loan_name || '—'
                              const closeDate = (loan as { estimated_closing_date?: string | null }).estimated_closing_date || loan.closing_date
                              return (
                                <tr key={loan.id} style={{ borderBottom: '1px solid var(--border-subtle, #2a2a2a)' }}>
                                  <td style={{ padding: '8px 8px 8px 0' }}>
                                    <Link href={`/dashboard/loans/${loan.id}`} style={{ color: '#c9a84c', textDecoration: 'none' }}>
                                      {borrowerName}
                                    </Link>
                                  </td>
                                  <td style={{ padding: '8px 8px 8px 0', color: 'var(--fg)' }}>
                                    {loan.loan_amount ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(loan.loan_amount) : '—'}
                                  </td>
                                  <td style={{ padding: '8px 8px 8px 0' }}>
                                    <span style={{
                                      fontSize: 10, padding: '2px 6px', borderRadius: 4,
                                      background: loan.status?.toLowerCase().includes('fund') ? '#10b98122' : loan.status?.toLowerCase().includes('clear') ? '#3b82f622' : '#ffffff11',
                                      color: loan.status?.toLowerCase().includes('fund') ? '#10b981' : loan.status?.toLowerCase().includes('clear') ? '#60a5fa' : 'var(--muted)',
                                      border: '1px solid currentColor',
                                    }}>{loan.status || '—'}</span>
                                  </td>
                                  <td style={{ padding: '8px 0', color: 'var(--muted)' }}>
                                    {closeDate ? new Date(closeDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* Contact info */}
                <div style={cardStyle}>
                  <div style={labelStyle}>CONTACT INFO</div>
                  {onSaveField ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 12 }}>
                      <EditableContactField label="First Name"   value={contact.first_name}   field="first_name"   onSave={onSaveField} />
                      <EditableContactField label="Last Name"    value={contact.last_name}    field="last_name"    onSave={onSaveField} />
                      <EditableContactField label="Email"        value={contact.email}         field="email"        onSave={onSaveField} />
                      <EditableContactField label="Phone"        value={contact.phone}         field="phone"        onSave={onSaveField} display={fmtPhone(contact.phone)} />
                      <EditableContactField label="Stage"        value={contact.stage}         field="stage"        onSave={onSaveField} />
                      <EditableContactField label="Type"         value={contact.contact_type}  field="contact_type" onSave={onSaveField} />
                      <ReferredByTypeahead value={contact.referred_by} onSave={onSaveField} />
                      <ReferralTypeSelect value={contact.referral_type ?? null} onSave={onSaveField} />
                      <EditableContactField label="Lead Source"   value={contact.lead_source ?? null}    field="lead_source"    onSave={onSaveField} />
                      <EditableContactField label="Closing Date"  value={contact.closing_date}   field="closing_date"   onSave={onSaveField} />
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {contact.email && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Mail size={14} style={{ color: 'var(--muted)' }} />
                          <a href={`mailto:${contact.email}`} style={{ color: '#c9a84c', textDecoration: 'none', fontFamily: 'var(--font-mono)', fontSize: 13 }}>{contact.email}</a>
                        </div>
                      )}
                      {phone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Phone size={14} style={{ color: 'var(--muted)' }} />
                          <a href={`tel:${phone.replace(/\D/g, '')}`} style={{ color: '#c9a84c', textDecoration: 'none', fontFamily: 'var(--font-mono)', fontSize: 13 }}>{fmtPhone(phone) ?? phone}</a>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Address */}
                <div style={cardStyle}>
                  <div style={labelStyle}>ADDRESS</div>
                  {onSaveField ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <EditableContactField label="Street" value={contact.mailing_street} field="mailing_street" onSave={onSaveField} />
                      <EditableContactField label="City"   value={contact.mailing_city}   field="mailing_city"   onSave={onSaveField} />
                      <EditableContactField label="State"  value={contact.mailing_state}  field="mailing_state"  onSave={onSaveField} />
                      <EditableContactField label="Zip"    value={contact.mailing_zip}    field="mailing_zip"    onSave={onSaveField} />
                    </div>
                  ) : (
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--fg)' }}>
                      {mailingAddress || <span style={{ color: 'var(--muted)' }}>No address on file</span>}
                    </div>
                  )}
                </div>

                {/* Co-Borrower */}
                {(onSaveField || contact.co_borrower_first || contact.co_borrower_last) && (() => {
                  const hasCoBorrower = !!(contact.co_borrower_first || contact.co_borrower_last || contact.co_borrower_mobile || contact.co_borrower_email || contact.co_borrower_birthdate)
                  return (
                  <div style={cardStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={labelStyle}>CO-BORROWER</div>
                      {!hasCoBorrower && onSaveField && (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', cursor: 'default' }}>
                          click any field below to add
                        </span>
                      )}
                    </div>
                    {onSaveField ? (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <EditableContactField label="First Name" value={contact.co_borrower_first ?? null} field="co_borrower_first" onSave={onSaveField} />
                        <EditableContactField label="Last Name"  value={contact.co_borrower_last ?? null}  field="co_borrower_last"  onSave={onSaveField} />
                        <EditableContactField label="Date of Birth" value={contact.co_borrower_birthdate ?? null} field="co_borrower_birthdate" onSave={onSaveField} />
                        <EditableContactField label="Mobile"    value={contact.co_borrower_mobile ?? null} field="co_borrower_mobile" onSave={onSaveField} />
                        <EditableContactField label="Email"     value={contact.co_borrower_email ?? null}  field="co_borrower_email"  onSave={onSaveField} />
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                        {(contact.co_borrower_first || contact.co_borrower_last) && (
                          <div style={{ color: 'var(--fg)' }}>
                            {`${contact.co_borrower_first ?? ''} ${contact.co_borrower_last ?? ''}`.trim()}
                          </div>
                        )}
                        {contact.co_borrower_birthdate && (
                          <div><span style={{ color: 'var(--muted)' }}>DOB </span>{contact.co_borrower_birthdate}</div>
                        )}
                        {contact.co_borrower_mobile && (
                          <div>
                            <a href={`tel:${contact.co_borrower_mobile.replace(/\D/g, '')}`}
                              style={{ color: '#c9a84c', textDecoration: 'none' }}>
                              {fmtPhone(contact.co_borrower_mobile) ?? contact.co_borrower_mobile}
                            </a>
                          </div>
                        )}
                        {contact.co_borrower_email && (
                          <div>
                            <a href={`mailto:${contact.co_borrower_email}`}
                              style={{ color: '#c9a84c', textDecoration: 'none' }}>
                              {contact.co_borrower_email}
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  )
                })()}

                {/* Relationship */}
                <div style={cardStyle}>
                  <div style={labelStyle}>RELATIONSHIP</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                      <span style={{ color: 'var(--muted)' }}>Added </span>
                      {fmtDate(contact.created_at)}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                      <span style={{ color: 'var(--muted)' }}>Last activity </span>
                      {contact.last_activity_date ? fmtDate(contact.last_activity_date) : (contact.last_touch ? fmtDate(contact.last_touch) : '-')}
                    </div>
                    {contact.closing_date && (
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                        <span style={{ color: 'var(--muted)' }}>Closing date </span>
                        {fmtDate(contact.closing_date)}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}

            {leftTab === 'emails' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <InboundEmailFeed emails={inboundEmails} />
                <ContactEmailHistory drafts={emailDrafts} />
                {contactEmails.length > 0 && (
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: 10, textTransform: 'uppercase' }}>Email Log</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {contactEmails.map(ce => (
                        <ContactEmailLogRow key={ce.id} email={ce} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* ── Right column: activity feed ── */}
        <div style={{
          width: 360, flexShrink: 0,
          borderLeft: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>

          {/* Sticky header with count */}
          <div style={{
            flexShrink: 0, padding: '12px 20px',
            borderBottom: '1px solid var(--border)', background: 'var(--bg)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div style={{ ...labelStyle, marginBottom: 0 }}>
              ACTIVITY {contactActivity.length > 0 && `(${contactActivity.length})`}
            </div>
          </div>

          {/* Activity action buttons */}
          <div style={{ flexShrink: 0, padding: '10px 16px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['call', 'text', 'email', 'note'] as const).map(type => {
                const cfg = ACTIVITY_TYPE_CONFIG[type]
                const Icon = cfg.icon
                const isActive = activityFormType === type
                return (
                  <button
                    key={type}
                    onClick={() => {
                      if (isActive) { setActivityFormType(null); setActivityNotes('') }
                      else { setActivityFormType(type); setActivityNotes(''); setActivityError(null) }
                    }}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
                      letterSpacing: '0.06em',
                      padding: '6px 12px', borderRadius: 4, cursor: 'pointer',
                      background: isActive ? cfg.bg : 'var(--bg)',
                      color: isActive ? cfg.color : 'var(--muted)',
                      border: isActive ? `1px solid ${cfg.color}` : '1px solid var(--border)',
                      transition: 'all 0.15s',
                    }}
                  >
                    <Icon size={11} />
                    {cfg.label}
                  </button>
                )
              })}
            </div>

            {/* Inline activity form */}
            {activityFormType && (
              <div style={{ marginTop: 10 }}>
                <textarea
                  ref={activityNotesRef}
                  value={activityNotes}
                  onChange={e => setActivityNotes(e.target.value)}
                  placeholder="Add notes..."
                  rows={2}
                  style={{
                    width: '100%', background: 'var(--bg)', color: 'var(--fg)',
                    border: '1px solid var(--border)', borderRadius: 4,
                    padding: '8px 10px', fontFamily: 'var(--font-mono)', fontSize: 11,
                    resize: 'none', boxSizing: 'border-box', marginBottom: 8,
                  }}
                />
                {activityError && (
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#fca5a5', marginBottom: 6 }}>
                    {activityError}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={handleLogActivity}
                    disabled={activitySaving}
                    style={{
                      fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
                      background: activitySaving ? 'var(--surface)' : '#c9a84c',
                      color: activitySaving ? 'var(--muted)' : '#000',
                      border: 'none', padding: '5px 14px', borderRadius: 4,
                      cursor: activitySaving ? 'default' : 'pointer',
                    }}
                  >
                    {activitySaving ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    onClick={() => { setActivityFormType(null); setActivityNotes(''); setActivityError(null) }}
                    style={{
                      fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
                      background: 'transparent', color: 'var(--muted)',
                      border: '1px solid var(--border)', padding: '5px 14px', borderRadius: 4,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Scrollable activity feed */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 40px' }}>
            {contactActivity.length === 0 ? (
              <div style={{ padding: '32px 0', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)' }}>
                No activity yet — log a call, text, or email above.
              </div>
            ) : (
              contactActivity.map(item => (
                <ActivityFeedItem key={item.id} item={item} onDelete={onDeleteActivity} />
              ))
            )}
          </div>

        </div>
      </div>

    </div>
  )
}

// ── Contact email history ─────────────────────────────────────────────────────

const DRAFT_COLORS: Record<string, string> = {
  pre_approval:      '#064e3b',
  contract_received: '#1e3a5f',
  final_cd:          '#78350f',
  review_request:    '#3b0764',
  referral_intro:    '#431407',
  milestone:         '#1e1b4b',
}

const DRAFT_LABELS: Record<string, string> = {
  pre_approval: 'Pre-Approval', contract_received: 'Contract', final_cd: 'Final CD',
  review_request: 'Review Request', referral_intro: 'Referral Intro', milestone: 'Milestone',
}

const STATUS_COLOR: Record<string, string> = {
  pending: '#c9a84c', sent: '#6ee7b7', discarded: '#71717a',
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

// ── Inbound email feed for a contact ─────────────────────────────────────────
export type InboundEmailRow = {
  id: string
  subject: string | null
  from_address: string | null
  body_snippet: string | null
  occurred_at: string | null
  metadata: Record<string, unknown> | null
}

function InboundEmailFeed({ emails }: { emails: InboundEmailRow[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (emails.length === 0) return null

  return (
    <div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: 8 }}>
        INBOUND EMAILS ({emails.length})
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {emails.map(email => {
          const isOpen = expandedId === email.id
          const fromName = (email.metadata?.from_name as string) || null
          const ts = email.occurred_at
            ? new Date(email.occurred_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
              ' at ' +
              new Date(email.occurred_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
            : '\u2014'

          return (
            <div
              key={email.id}
              style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 6, overflow: 'hidden',
              }}
            >
              <button
                onClick={() => setExpandedId(isOpen ? null : email.id)}
                style={{
                  width: '100%', textAlign: 'left', background: 'none',
                  border: 'none', cursor: 'pointer', padding: '12px 16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{
                    background: 'rgba(201,168,76,0.15)', color: '#C9A84C',
                    fontSize: 10, fontFamily: 'var(--font-mono)', padding: '2px 8px',
                    borderRadius: 12, fontWeight: 600, letterSpacing: '0.05em',
                  }}>
                    INBOUND
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' }}>
                    {ts}
                  </span>
                </div>
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--fg)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2,
                }}>
                  {email.subject || '\u2014'}
                </div>
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  From: {fromName ? `${fromName} <${email.from_address}>` : (email.from_address || '\u2014')}
                </div>
              </button>
              {isOpen && email.body_snippet && (
                <div style={{
                  borderTop: '1px solid var(--border)', padding: '12px 16px',
                  fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)',
                  lineHeight: 1.6, whiteSpace: 'pre-wrap',
                }}>
                  {email.body_snippet}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ContactEmailLogRow({ email }: { email: ContactEmailRow }) {
  const [open, setOpen] = useState(false)
  const src = email.automation_source ?? 'unknown'
  const label = src.replace(/_/g, ' ')

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden', background: 'var(--surface)' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', textAlign: 'left', padding: '10px 14px',
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 10,
        }}
      >
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.08em',
          padding: '2px 8px', borderRadius: 10,
          background: 'rgba(201,168,76,0.12)', color: '#c9a84c',
          border: '1px solid rgba(201,168,76,0.3)', flexShrink: 0,
        }}>{label}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {email.subject}
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', flexShrink: 0 }}>
          {new Date(email.sent_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      </button>
      {open && (email.body_html || email.body_text) && (
        <div style={{
          borderTop: '1px solid var(--border)',
          padding: '12px 14px',
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--fg)', lineHeight: 1.6,
          whiteSpace: 'pre-wrap', maxHeight: 240, overflowY: 'auto',
          background: 'var(--bg)',
        }}>
          {email.body_html
            ? <div dangerouslySetInnerHTML={{ __html: email.body_html }} />
            : email.body_text}
        </div>
      )}
    </div>
  )
}

function ContactEmailHistory({ drafts }: { drafts: EmailDraftRow[] }) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const iframeRefs = useRef<Record<string, HTMLIFrameElement | null>>({})

  useEffect(() => {
    if (!expanded) return
    const iframe = iframeRefs.current[expanded]
    const draft = drafts.find(d => d.id === expanded)
    if (!iframe || !draft) return
    const doc = iframe.contentDocument
    if (doc) {
      doc.open()
      doc.write(`<html><head><style>body{font-family:-apple-system,sans-serif;font-size:14px;line-height:1.6;color:#1e293b;padding:16px;margin:0}</style></head><body>${draft.body_html}</body></html>`)
      doc.close()
    }
  }, [expanded, drafts])

  const updateStatus = async (id: string, status: 'sent' | 'discarded') => {
    await fetch('/api/email-drafts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
  }

  if (drafts.length === 0) {
    return (
      <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '32px 0' }}>
        <Inbox size={20} style={{ color: 'var(--muted)' }} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--muted)' }}>No emails logged for this contact</span>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {drafts.map(draft => {
        const bgColor = DRAFT_COLORS[draft.automation_name] ?? '#27272a'
        const label = DRAFT_LABELS[draft.automation_name] || draft.automation_name
        const isOpen = expanded === draft.id
        return (
          <div key={draft.id} style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
            <button
              onClick={() => setExpanded(isOpen ? null : draft.id)}
              style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: '14px 18px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ background: bgColor, color: '#fff', fontSize: 10, fontFamily: 'var(--font-mono)', padding: '2px 8px', borderRadius: 12, fontWeight: 600, letterSpacing: '0.05em' }}>{label}</span>
                  <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: STATUS_COLOR[draft.status] ?? '#c9a84c', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{draft.status}</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                    <Clock size={11} />{timeAgo(draft.created_at)}
                  </span>
                </div>
                <ChevronRight size={14} style={{ color: 'var(--muted)', transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }} />
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--fg)', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{draft.subject}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                To: {draft.recipient_name ? `${draft.recipient_name} <${draft.recipient_email}>` : draft.recipient_email}
              </div>
              {!isOpen && draft.body_preview && (
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', marginTop: 6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{draft.body_preview}</div>
              )}
            </button>
            {isOpen && (
              <div style={{ borderTop: '1px solid var(--border)' }}>
                <iframe
                  ref={el => { iframeRefs.current[draft.id] = el }}
                  style={{ width: '100%', border: 'none', minHeight: 180, maxHeight: 360, display: 'block' }}
                  title="Email preview"
                  sandbox="allow-same-origin"
                />
                {draft.status === 'pending' && (
                  <div style={{ display: 'flex', gap: 8, padding: '10px 14px', borderTop: '1px solid var(--border)' }}>
                    <button
                      onClick={e => { e.stopPropagation(); updateStatus(draft.id, 'sent') }}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontFamily: 'var(--font-mono)', background: 'rgba(52,211,153,0.1)', color: '#6ee7b7', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 4, padding: '6px 12px', cursor: 'pointer', fontWeight: 600 }}
                    >
                      <Check size={12} /> Mark Sent
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); updateStatus(draft.id, 'discarded') }}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontFamily: 'var(--font-mono)', background: 'rgba(239,68,68,0.1)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 4, padding: '6px 12px', cursor: 'pointer', fontWeight: 600 }}
                    >
                      <X size={12} /> Discard
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
