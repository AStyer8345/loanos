'use client'

import Link from 'next/link'
import {
  ArrowLeft,
  Phone,
  Mail,
  MessageSquare,
  AlertCircle,
} from 'lucide-react'
import ActivityTimeline from '@/components/ActivityTimeline'

export type Contact = {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  mobile_phone: string | null
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

function fmtDateTime(s: string) {
  const d = new Date(s)
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
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
  referrerContactId: string | null
  activeTab: 'overview' | 'loans' | 'activity' | 'notes'
  setActiveTab: (t: 'overview' | 'loans' | 'activity' | 'notes') => void
  newNote: string
  setNewNote: (s: string) => void
  savingNote: boolean
  onAddNote: () => void
}

export function ContactRecordView(props: Props) {
  const {
    contact,
    loans,
    activity,
    referrerContactId,
    activeTab,
    setActiveTab,
    newNote,
    setNewNote,
    savingNote,
    onAddNote,
  } = props

  const phone = contact.phone || contact.mobile_phone || null
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
            <div style={cardStyle}>
              <div style={labelStyle}>CONTACT INFO</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {contact.email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Mail size={14} style={{ color: 'var(--muted)' }} />
                    <a href={`mailto:${contact.email}`} style={{ color: '#c9a84c', textDecoration: 'none' }}>{contact.email}</a>
                  </div>
                )}
                {phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <Phone size={14} style={{ color: 'var(--muted)' }} />
                    <span>{phone}</span>
                    <a href={`tel:${phone.replace(/\D/g, '')}`} style={{ fontSize: 11, color: '#c9a84c', marginLeft: 4 }}>Call</a>
                    <a href={`sms:${phone.replace(/\D/g, '')}`} style={{ fontSize: 11, color: '#c9a84c' }}>Text</a>
                  </div>
                )}
                {mailingAddress && (
                  <div style={{ fontSize: 13, color: 'var(--fg)' }}>{mailingAddress}</div>
                )}
                {!contact.email && !phone && !mailingAddress && (
                  <span style={{ color: 'var(--muted)' }}>No contact info</span>
                )}
              </div>
            </div>

            <div style={cardStyle}>
              <div style={labelStyle}>RELATIONSHIP</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {contact.referred_by && (
                  <div>
                    <span style={{ color: 'var(--muted)', marginRight: 6 }}>Referred by</span>
                    {referrerContactId ? (
                      <Link
                        href={`/dashboard/contacts/${referrerContactId}`}
                        style={{ color: '#c9a84c', textDecoration: 'none', fontWeight: 600 }}
                      >
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
                <div style={labelStyle}>NOTES PREVIEW</div>
                <button
                  onClick={() => setActiveTab('notes')}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    letterSpacing: '0.08em',
                    background: 'transparent',
                    color: '#c9a84c',
                    border: '1px solid rgba(201,168,76,0.4)',
                    padding: '4px 10px',
                    borderRadius: 4,
                    cursor: 'pointer',
                  }}
                >
                  + Add Note
                </button>
              </div>
              <div style={{ fontSize: 12, color: 'var(--fg)', whiteSpace: 'pre-wrap', maxHeight: 100, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {contact.notes?.slice(0, 200) ?? 'No notes yet.'}
                {(contact.notes?.length ?? 0) > 200 && '...'}
              </div>
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
    </div>
  )
}
