'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
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
} from 'lucide-react'
import ActivityTimeline from '@/components/ActivityTimeline'
import LoanOSChat from '@/components/crm/LoanOSChat'

export type Contact = {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  contact_type: string | null
  stage: string | null
  referred_by: string | null
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
}

export type ContactLoan = {
  id: string
  loan_name: string | null
  borrower_name: string | null
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
  _source?: string        // e.g. 'Contact' | 'Loan: 123 Main St' — set client-side when merging
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

function fmtCurrency(n: number | null) {
  if (n == null) return '-'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

function fmtDate(s: string | null) {
  if (!s) return '-'
  const d = new Date(s.includes('T') ? s : s + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function fullName(c: Contact) {
  return `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() || '-'
}

function initials(c: Contact) {
  const first = (c.first_name ?? '').trim().slice(0, 1).toUpperCase()
  const last = (c.last_name ?? '').trim().slice(0, 1).toUpperCase()
  return (first + last) || '?'
}

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

const cardStyle: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  padding: '16px 20px',
}

const CONTACT_TABS = [
  { id: 'overview' as const, label: 'Overview' },
  { id: 'loans' as const, label: 'Loans' },
  { id: 'activity' as const, label: 'Activity' },
  { id: 'notes' as const, label: 'Notes' },
  { id: 'emails' as const, label: 'Emails' },
]

const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 9,
  color: 'var(--muted)',
  letterSpacing: '0.1em',
  marginBottom: 4,
}

type Props = {
  contact: Contact
  loans: ContactLoan[]
  activity: ActivityEntry[]
  emailDrafts: EmailDraftRow[]
  referrerContactId: string | null
  activeTab: 'overview' | 'loans' | 'activity' | 'notes' | 'emails'
  setActiveTab: (t: 'overview' | 'loans' | 'activity' | 'notes' | 'emails') => void
  newNote: string
  setNewNote: (s: string) => void
  savingNote: boolean
  onAddNote: () => void
  onSaveNotes?: (notes: string) => Promise<void>
  onSaveField?: (field: keyof Contact, value: string | null) => Promise<void>
}

// Inline-editable text field — click to edit, blur/Enter to save
function EditableContactField({ label, value, field, onSave }: {
  label: string
  value: string | null
  field: keyof Contact
  onSave: (field: keyof Contact, value: string | null) => Promise<void>
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
        {saved ? '✓ Saved' : (value || '—')}
      </div>
    </div>
  )
}

export function ContactRecordView(props: Props) {
  const {
    contact,
    loans,
    activity,
    emailDrafts,
    referrerContactId,
    activeTab,
    setActiveTab,
    newNote,
    setNewNote,
    savingNote,
    onAddNote,
    onSaveNotes,
    onSaveField,
  } = props

  const [notesVal, setNotesVal] = useState(contact.notes ?? '')
  const [notesSaving, setNotesSaving] = useState(false)
  const [notesSaved, setNotesSaved] = useState(false)

  const handleNotesBlur = async () => {
    if (!onSaveNotes) return
    if (notesVal === (contact.notes ?? '')) return
    setNotesSaving(true)
    await onSaveNotes(notesVal)
    setNotesSaving(false)
    setNotesSaved(true)
    setTimeout(() => setNotesSaved(false), 2000)
  }

  const phone = contact.phone || contact.phone_mobile || null
  const cityState = [contact.mailing_city, contact.mailing_state].filter(Boolean).join(', ')
  const mailingParts = [contact.mailing_street, cityState, contact.mailing_zip].filter(Boolean)
  const mailingAddress = mailingParts.length ? mailingParts.join(', ') : null

  const pageStyle: React.CSSProperties = {
    background: 'var(--bg)',
    minHeight: '100%',
    color: 'var(--fg)',
    fontFamily: 'var(--font-mono)',
  }

  return (
    <div style={pageStyle}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 32px' }}>
        <Link
          href="/dashboard/contacts"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            color: 'var(--muted)',
            marginBottom: 20,
            textDecoration: 'none',
          }}
        >
          <ArrowLeft size={13} />
          Back to Contacts
        </Link>

        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 20,
          marginBottom: 24,
          flexWrap: 'wrap',
        }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'rgba(201,168,76,0.2)',
              color: '#c9a84c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-display)',
              fontSize: 20,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {initials(contact)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, letterSpacing: '0.04em', margin: 0, lineHeight: 1.2 }}>
              {fullName(contact)}
            </h1>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginTop: 8 }}>
              <span style={getStageBadgeStyle(contact.stage)}>{contact.stage ?? '-'}</span>
              <span style={{
                ...getStageBadgeStyle(null),
                background: 'rgba(255,255,255,0.08)',
                textTransform: 'capitalize',
              }}>
                {contact.contact_type ?? '-'}
              </span>
              {contact.group_tag && (
                <span style={{
                  ...getStageBadgeStyle(null),
                  background: 'rgba(201,168,76,0.12)',
                  color: '#c9a84c',
                }}>
                  {contact.group_tag}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
              {phone && (
                <a
                  href={`tel:${phone.replace(/\D/g, '')}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    letterSpacing: '0.08em',
                    background: 'transparent',
                    color: '#c9a84c',
                    padding: '6px 12px',
                    borderRadius: 4,
                    border: '1px solid rgba(201,168,76,0.4)',
                    textDecoration: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <Phone size={12} />
                  Call
                </a>
              )}
              {phone && (
                <a
                  href={`sms:${phone.replace(/\D/g, '')}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    letterSpacing: '0.08em',
                    background: 'transparent',
                    color: '#c9a84c',
                    padding: '6px 12px',
                    borderRadius: 4,
                    border: '1px solid rgba(201,168,76,0.4)',
                    textDecoration: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <MessageSquare size={12} />
                  Text
                </a>
              )}
              {contact.email && (
                <a
                  href={`mailto:${contact.email}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    letterSpacing: '0.08em',
                    background: '#c9a84c',
                    color: '#000',
                    padding: '6px 12px',
                    borderRadius: 4,
                    border: 'none',
                    textDecoration: 'none',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  <Mail size={12} />
                  Email
                </a>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
          {CONTACT_TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                padding: '8px 18px',
                fontSize: 12,
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                letterSpacing: '0.08em',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === t.id ? '2px solid #c9a84c' : '2px solid transparent',
                color: activeTab === t.id ? '#c9a84c' : 'var(--muted)',
                cursor: 'pointer',
                textTransform: 'uppercase',
                marginBottom: -1,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Editable contact fields */}
            <div style={cardStyle}>
              <div style={labelStyle}>CONTACT INFO</div>
              {onSaveField ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 12 }}>
                  <EditableContactField label="First Name"  value={contact.first_name}  field="first_name"  onSave={onSaveField} />
                  <EditableContactField label="Last Name"   value={contact.last_name}   field="last_name"   onSave={onSaveField} />
                  <EditableContactField label="Email"       value={contact.email}        field="email"       onSave={onSaveField} />
                  <EditableContactField label="Phone"       value={contact.phone}        field="phone"       onSave={onSaveField} />
                  <EditableContactField label="Stage"       value={contact.stage}        field="stage"       onSave={onSaveField} />
                  <EditableContactField label="Type"        value={contact.contact_type} field="contact_type" onSave={onSaveField} />
                  <EditableContactField label="Referred By" value={contact.referred_by}  field="referred_by"  onSave={onSaveField} />
                  <EditableContactField label="Closing Date" value={contact.closing_date} field="closing_date" onSave={onSaveField} />
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {contact.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Mail size={14} style={{ color: 'var(--muted)' }} />
                      <a href={`mailto:${contact.email}`} style={{ color: '#c9a84c', textDecoration: 'none' }}>{contact.email}</a>
                    </div>
                  )}
                  {phone && <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Phone size={14} style={{ color: 'var(--muted)' }} /><span>{phone}</span></div>}
                </div>
              )}
              {/* Quick-action links */}
              {(contact.email || phone) && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: onSaveField ? 8 : 0, borderTop: onSaveField ? '1px solid var(--border)' : 'none' }}>
                  {phone && <a href={`tel:${phone.replace(/\D/g, '')}`} style={{ fontSize: 11, color: '#c9a84c', fontFamily: 'var(--font-mono)' }}>Call</a>}
                  {phone && <a href={`sms:${phone.replace(/\D/g, '')}`} style={{ fontSize: 11, color: '#c9a84c', fontFamily: 'var(--font-mono)' }}>Text</a>}
                  {contact.email && <a href={`mailto:${contact.email}`} style={{ fontSize: 11, color: '#c9a84c', fontFamily: 'var(--font-mono)' }}>Email</a>}
                </div>
              )}
            </div>

            <div style={cardStyle}>
              <div style={labelStyle}>ADDRESS</div>
              {onSaveField ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <EditableContactField label="Street"  value={contact.mailing_street}  field="mailing_street"  onSave={onSaveField} />
                  <EditableContactField label="City"    value={contact.mailing_city}    field="mailing_city"    onSave={onSaveField} />
                  <EditableContactField label="State"   value={contact.mailing_state}   field="mailing_state"   onSave={onSaveField} />
                  <EditableContactField label="Zip"     value={contact.mailing_zip}     field="mailing_zip"     onSave={onSaveField} />
                </div>
              ) : (
                <div style={{ fontSize: 13, color: 'var(--fg)' }}>{mailingAddress || <span style={{ color: 'var(--muted)' }}>No address</span>}</div>
              )}
            </div>

            <div style={cardStyle}>
              <div style={labelStyle}>RELATIONSHIP</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {contact.referred_by && (
                  <div>
                    <span style={{ color: 'var(--muted)', marginRight: 6 }}>Referred by</span>
                    {referrerContactId ? (
                      <Link href={`/dashboard/contacts/${referrerContactId}`} style={{ color: '#c9a84c', textDecoration: 'none', fontWeight: 600 }}>
                        {contact.referred_by}
                      </Link>
                    ) : (
                      <span>{contact.referred_by}</span>
                    )}
                  </div>
                )}
                <div><span style={{ color: 'var(--muted)', marginRight: 6 }}>Added</span>{fmtDate(contact.created_at)}</div>
                <div><span style={{ color: 'var(--muted)', marginRight: 6 }}>Last activity</span>{contact.last_touch ? fmtDate(contact.last_touch) : '-'}</div>
                {contact.closing_date && (
                  <div><span style={{ color: 'var(--muted)', marginRight: 6 }}>Closing date</span>{fmtDate(contact.closing_date)}</div>
                )}
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={labelStyle}>NOTES</div>
                {(notesSaving || notesSaved) && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: notesSaved ? '#80c080' : 'var(--muted)' }}>
                    {notesSaving ? 'Saving…' : 'Saved'}
                  </span>
                )}
              </div>
              <textarea
                value={notesVal}
                onChange={e => setNotesVal(e.target.value)}
                onBlur={handleNotesBlur}
                placeholder="Add notes…"
                rows={4}
                style={{
                  width: '100%',
                  background: 'var(--bg)',
                  color: 'var(--fg)',
                  border: '1px solid var(--border)',
                  borderRadius: 4,
                  padding: '10px 12px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>
        )}

        {activeTab === 'loans' && (
          <div style={cardStyle}>
            <div style={labelStyle}>LOANS</div>
            {loans.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '32px 0', color: 'var(--muted)' }}>
                <AlertCircle size={20} />
                <span style={{ fontSize: 13 }}>No loans linked to this contact yet.</span>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Address', 'Type', 'Amount', 'Rate', 'Status', 'Date'].map(h => (
                      <th key={h} style={{ ...labelStyle, textAlign: 'left', padding: '8px 12px 8px 0' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loans.map(l => (
                    <tr key={l.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 12px 10px 0' }}>
                        <Link href={`/dashboard/loans/${l.id}`} style={{ color: '#c9a84c', textDecoration: 'none' }}>
                          {l.property_address || [l.property_city, l.property_state].filter(Boolean).join(', ') || '-'}
                        </Link>
                      </td>
                      <td style={{ padding: '10px 12px 10px 0', color: 'var(--muted)' }}>{l.loan_type || l.loan_purpose || '-'}</td>
                      <td style={{ padding: '10px 12px 10px 0' }}>{fmtCurrency(l.loan_amount)}</td>
                      <td style={{ padding: '10px 12px 10px 0', color: 'var(--muted)' }}>
                        {l.interest_rate != null ? `${Number(l.interest_rate).toFixed(2)}%` : '-'}
                      </td>
                      <td style={{ padding: '10px 12px 10px 0', color: 'var(--muted)' }}>{l.status ?? '-'}</td>
                      <td style={{ padding: '10px 12px 10px 0', color: 'var(--muted)', whiteSpace: 'nowrap' }}>{fmtDate(l.closing_date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div style={cardStyle}>
            <div style={labelStyle}>ACTIVITY TIMELINE</div>
            <ActivityTimeline rows={activity} />
          </div>
        )}

        {activeTab === 'emails' && (
          <ContactEmailHistory drafts={emailDrafts} />
        )}

        {activeTab === 'notes' && (
          <div style={cardStyle}>
            <div style={labelStyle}>NOTES</div>
            <div style={{ fontSize: 13, color: 'var(--fg)', whiteSpace: 'pre-wrap', marginBottom: 20, minHeight: 60 }}>
              {contact.notes || 'No notes yet.'}
            </div>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <textarea
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                placeholder="Add a note..."
                rows={3}
                style={{
                  width: '100%',
                  background: 'var(--bg)',
                  color: 'var(--fg)',
                  border: '1px solid var(--border)',
                  borderRadius: 4,
                  padding: '10px 12px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  resize: 'vertical',
                  boxSizing: 'border-box',
                  marginBottom: 10,
                }}
              />
              <button
                onClick={onAddNote}
                disabled={savingNote || !newNote.trim()}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  letterSpacing: '0.08em',
                  background: '#c9a84c',
                  color: '#000',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: 4,
                  cursor: savingNote || !newNote.trim() ? 'default' : 'pointer',
                  fontWeight: 600,
                  opacity: savingNote || !newNote.trim() ? 0.6 : 1,
                }}
              >
                {savingNote ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        )}
      </div>
      <LoanOSChat recordId={contact.id} recordType="contact" recordName={fullName(contact)} />
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
