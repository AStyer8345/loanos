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
  ExternalLink,
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
  { id: 'loans'    as const, label: 'Loans' },
  { id: 'emails'   as const, label: 'Emails' },
]

type LeftTab = 'overview' | 'loans' | 'emails'

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

// ── Active loan card ──────────────────────────────────────────────────────────
function ActiveLoanCard({ loan }: { loan: ContactLoan }) {
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
              Active Loan
            </span>
            {loan.status && (
              <span style={{ ...getStageBadgeStyle(loan.status) }}>{loan.status}</span>
            )}
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

export function ContactRecordView(props: Props) {
  const {
    contact,
    loans,
    activity,
    emailDrafts,
    referrerContactId,
    newNote,
    setNewNote,
    savingNote,
    onAddNote,
    onSaveNotes,
    onSaveField,
  } = props

  // Map parent activeTab to our three-tab left rail
  const [leftTab, setLeftTab] = useState<LeftTab>('overview')

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

  const activeLoan = loans.find(l => isActiveLoan(l.status)) ?? null

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
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: 'rgba(201,168,76,0.18)',
            color: '#c9a84c',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-display)',
            fontSize: 18,
            fontWeight: 700,
            flexShrink: 0,
            border: '1px solid rgba(201,168,76,0.3)',
          }}>
            {initials(contact)}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: '0.03em',
              margin: 0,
              lineHeight: 1.2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
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

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {phone && (
            <a
              href={`tel:${phone.replace(/\D/g, '')}`}
              style={{ ...actionBtnBase, background: 'transparent', color: '#c9a84c', border: '1.5px solid rgba(201,168,76,0.5)' }}
            >
              <Phone size={13} />
              Call
            </a>
          )}
          {phone && (
            <a
              href={`sms:${phone.replace(/\D/g, '')}`}
              style={{ ...actionBtnBase, background: 'transparent', color: '#c9a84c', border: '1.5px solid rgba(201,168,76,0.5)' }}
            >
              <MessageSquare size={13} />
              Text
            </a>
          )}
          {contact.email && (
            <a
              href={`mailto:${contact.email}`}
              style={{ ...actionBtnBase, background: '#c9a84c', color: '#000', border: 'none' }}
            >
              <Mail size={13} />
              Email
            </a>
          )}
        </div>
      </div>

      {/* ── Active loan card ─────────────────────────────────────────────────── */}
      {activeLoan && (
        <div style={{ flexShrink: 0, padding: '14px 28px 0' }}>
          <ActiveLoanCard loan={activeLoan} />
        </div>
      )}

      {/* ── Two-column body ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', marginTop: 14 }}>

        {/* ── Left column: tabs + content ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

          {/* Tab bar */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', paddingLeft: 28, flexShrink: 0 }}>
            {LEFT_TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setLeftTab(t.id)}
                style={{
                  padding: '8px 16px',
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  background: 'none',
                  border: 'none',
                  borderBottom: leftTab === t.id ? '2px solid #c9a84c' : '2px solid transparent',
                  color: leftTab === t.id ? '#c9a84c' : 'var(--muted)',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  marginBottom: -1,
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

                {/* Contact info */}
                <div style={cardStyle}>
                  <div style={labelStyle}>CONTACT INFO</div>
                  {onSaveField ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 12 }}>
                      <EditableContactField label="First Name"   value={contact.first_name}   field="first_name"   onSave={onSaveField} />
                      <EditableContactField label="Last Name"    value={contact.last_name}    field="last_name"    onSave={onSaveField} />
                      <EditableContactField label="Email"        value={contact.email}         field="email"        onSave={onSaveField} />
                      <EditableContactField label="Phone"        value={contact.phone}         field="phone"        onSave={onSaveField} />
                      <EditableContactField label="Stage"        value={contact.stage}         field="stage"        onSave={onSaveField} />
                      <EditableContactField label="Type"         value={contact.contact_type}  field="contact_type" onSave={onSaveField} />
                      <EditableContactField label="Referred By"  value={contact.referred_by}   field="referred_by"  onSave={onSaveField} />
                      <EditableContactField label="Closing Date" value={contact.closing_date}  field="closing_date" onSave={onSaveField} />
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
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{phone}</span>
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
                      {contact.last_touch ? fmtDate(contact.last_touch) : '-'}
                    </div>
                    {contact.closing_date && (
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                        <span style={{ color: 'var(--muted)' }}>Closing date </span>
                        {fmtDate(contact.closing_date)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes */}
                <div style={cardStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={labelStyle}>NOTES</div>
                    {(notesSaving || notesSaved) && (
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: notesSaved ? '#80c080' : 'var(--muted)' }}>
                        {notesSaving ? 'Saving…' : '✓ Saved'}
                      </span>
                    )}
                  </div>
                  <textarea
                    value={notesVal}
                    onChange={e => setNotesVal(e.target.value)}
                    onBlur={handleNotesBlur}
                    placeholder="Add notes…"
                    rows={5}
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
                      lineHeight: 1.6,
                    }}
                  />
                </div>

              </div>
            )}

            {leftTab === 'loans' && (
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
                            {l.interest_rate != null ? `${Number(l.interest_rate).toFixed(3)}%` : '-'}
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

            {leftTab === 'emails' && (
              <ContactEmailHistory drafts={emailDrafts} />
            )}

          </div>
        </div>

        {/* ── Right column: activity feed ── */}
        <div style={{
          width: 340,
          flexShrink: 0,
          borderLeft: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>

          {/* Sticky header */}
          <div style={{
            flexShrink: 0,
            padding: '12px 20px',
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg)',
          }}>
            <div style={{ ...labelStyle, marginBottom: 0 }}>ACTIVITY FEED</div>
          </div>

          {/* Log a note */}
          <div style={{ flexShrink: 0, padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
            <textarea
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              placeholder="Log a note or call…"
              rows={2}
              style={{
                width: '100%',
                background: 'var(--bg)',
                color: 'var(--fg)',
                border: '1px solid var(--border)',
                borderRadius: 4,
                padding: '8px 10px',
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                resize: 'none',
                boxSizing: 'border-box',
                marginBottom: 8,
              }}
            />
            <button
              onClick={onAddNote}
              disabled={savingNote || !newNote.trim()}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                letterSpacing: '0.08em',
                background: savingNote || !newNote.trim() ? 'var(--surface)' : '#c9a84c',
                color: savingNote || !newNote.trim() ? 'var(--muted)' : '#000',
                border: '1px solid var(--border)',
                padding: '5px 14px',
                borderRadius: 4,
                cursor: savingNote || !newNote.trim() ? 'default' : 'pointer',
                fontWeight: 600,
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              {savingNote ? 'Saving…' : 'Log Note'}
            </button>
          </div>

          {/* Scrollable timeline */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 40px' }}>
            <ActivityTimeline rows={activity} />
          </div>

        </div>
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
