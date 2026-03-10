'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, Users, TrendingUp, DollarSign, AlertCircle } from 'lucide-react'

const supabase = createClient()

// ── Types ────────────────────────────────────────────────────────────────────

interface ReferralContact {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  stage: string | null
  contact_type: string | null
  created_at: string
}

interface ReferralLoan {
  id: string
  loan_name: string | null
  borrower_name: string | null
  status: string | null
  loan_amount: number | null
  loan_purpose: string | null
  loan_program: string | null
  closing_date: string | null
  property_city: string | null
  property_state: string | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtCurrency(n: number | null) {
  if (n == null) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

function fmtDate(s: string | null) {
  if (!s) return '—'
  const d = new Date(s + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function isClosedLoan(status: string | null) {
  if (!status) return false
  const s = status.toLowerCase()
  return ['closed', 'funded', 'closed/funded'].some(v => s.includes(v))
}

function fullName(c: ReferralContact) {
  return [c.first_name, c.last_name].filter(Boolean).join(' ') || '(unnamed)'
}

// ── Status Badge ─────────────────────────────────────────────────────────────

function LoanStatusBadge({ status }: { status: string | null }) {
  if (!status) return <span style={{ color: 'var(--muted)' }}>—</span>
  const s = status.toLowerCase()
  let color = 'var(--muted)'
  if (['closed', 'funded', 'closed/funded'].some(v => s.includes(v))) color = '#4ade80'
  else if (['in process', 'processing', 'submitted', 'conditional', 'clear to close', 'approved'].some(v => s.includes(v))) color = '#60a5fa'
  else if (['started'].some(v => s.includes(v))) color = '#fbbf24'
  else if (['cancelled', 'denied', 'withdrawn'].some(v => s.includes(v))) color = '#f87171'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '1px 8px', borderRadius: 9999,
      fontSize: 11, fontWeight: 600, letterSpacing: '0.03em',
      background: `${color}22`, color,
    }}>
      {status}
    </span>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ReferralPage() {
  const params = useParams()
  const referrerName = decodeURIComponent(params.referrerName as string)

  const [contacts, setContacts] = useState<ReferralContact[]>([])
  const [loans, setLoans] = useState<ReferralLoan[]>([])
  const [referrerContactId, setReferrerContactId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'borrowers' | 'loans'>('borrowers')

  useEffect(() => {
    async function load() {
      setLoading(true)

      // Resolve referrer name to contact id (for link to contact record)
      const parts = referrerName.trim().split(/\s+/)
      const firstName = parts[0] ?? ''
      const lastName = parts.slice(1).join(' ') || ''
      let q = supabase.from('contacts').select('id, first_name, last_name')
      if (firstName) q = q.ilike('first_name', firstName)
      if (lastName) q = q.ilike('last_name', lastName)
      const { data: referrerList } = await q.limit(50)
      const match = (referrerList ?? []).find(
        (c: { first_name: string | null; last_name: string | null }) =>
          `${(c.first_name ?? '').trim()} ${(c.last_name ?? '').trim()}`.trim() === referrerName.trim()
      )
      setReferrerContactId(match ? (match as { id: string }).id : null)

      // Step 1: fetch contacts referred by this person
      const { data: contactData } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, email, phone, stage, contact_type, created_at')
        .ilike('referred_by', referrerName)
        .order('created_at', { ascending: false })

      const contactList = contactData || []
      setContacts(contactList)

      // Step 2: fetch loans for those contacts
      if (contactList.length > 0) {
        const ids = contactList.map(c => c.id)
        const { data: loanData } = await supabase
          .from('loans')
          .select('id, loan_name, borrower_name, status, loan_amount, loan_purpose, loan_program, closing_date, property_city, property_state')
          .in('contact_id', ids)
          .order('closing_date', { ascending: false, nullsFirst: false })
        setLoans(loanData || [])
      } else {
        setLoans([])
      }

      setLoading(false)
    }
    load()
  }, [referrerName])

  // ── Stats ─────────────────────────────────────────────────────────────────
  const closedLoans = useMemo(() => loans.filter(l => isClosedLoan(l.status)), [loans])
  const totalVolume = useMemo(() =>
    closedLoans.reduce((sum, l) => sum + (l.loan_amount ?? 0), 0),
    [closedLoans]
  )

  const loanLocation = (l: ReferralLoan) => {
    const parts = [l.property_city, l.property_state].filter(Boolean)
    return parts.length ? parts.join(', ') : '—'
  }

  // ── Bloomberg dark styles ─────────────────────────────────────────────────
  const card = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 6,
    padding: '16px 20px',
  }

  const thStyle: React.CSSProperties = {
    textAlign: 'left' as const,
    padding: '8px 14px',
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    color: 'var(--muted)',
    letterSpacing: '0.1em',
    fontWeight: 600,
    borderBottom: '1px solid var(--border)',
    whiteSpace: 'nowrap' as const,
  }

  const tdStyle: React.CSSProperties = {
    padding: '10px 14px',
    fontSize: 13,
    color: 'var(--fg)',
    borderBottom: '1px solid var(--border)',
    verticalAlign: 'middle',
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100%', padding: '28px 32px', fontFamily: 'var(--font-mono)' }}>

      {/* Back nav */}
      <Link
        href="/dashboard/contacts"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)', marginBottom: 20, textDecoration: 'none' }}
      >
        <ArrowLeft size={13} />
        Back to Contacts
      </Link>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
          {referrerContactId ? (
            <Link href={`/dashboard/contacts/${referrerContactId}`} style={{ color: '#c9a84c', textDecoration: 'none' }}>
              {referrerName}
            </Link>
          ) : (
            <span style={{ color: '#c9a84c' }}>{referrerName}</span>
          )}
        </h1>
        <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, letterSpacing: '0.08em' }}>
          REFERRAL SUMMARY
        </p>
      </div>

      {loading ? (
        <div style={{ color: 'var(--muted)', fontSize: 13, paddingTop: 40, textAlign: 'center' }}>Loading…</div>
      ) : (
        <>
          {/* Stats cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28 }}>
            <div style={card}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Users size={14} color="#c9a84c" />
                <span style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', fontWeight: 600 }}>TOTAL REFERRALS</span>
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--fg)', fontFamily: 'var(--font-display)' }}>
                {contacts.length}
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>contacts referred</div>
            </div>

            <div style={card}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <TrendingUp size={14} color="#4ade80" />
                <span style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', fontWeight: 600 }}>CLOSED LOANS</span>
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--fg)', fontFamily: 'var(--font-display)' }}>
                {closedLoans.length}
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>of {loans.length} total loans</div>
            </div>

            <div style={card}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <DollarSign size={14} color="#4ade80" />
                <span style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', fontWeight: 600 }}>TOTAL VOLUME</span>
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--fg)', fontFamily: 'var(--font-display)' }}>
                {fmtCurrency(totalVolume)}
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>closed loan volume</div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
            {(['borrowers', 'loans'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: '8px 18px',
                  fontSize: 12,
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  background: 'none',
                  border: 'none',
                  borderBottom: tab === t ? '2px solid #c9a84c' : '2px solid transparent',
                  color: tab === t ? '#c9a84c' : 'var(--muted)',
                  cursor: 'pointer',
                  textTransform: 'uppercase' as const,
                  marginBottom: -1,
                }}
              >
                {t === 'borrowers' ? `Borrowers (${contacts.length})` : `Loans (${loans.length})`}
              </button>
            ))}
          </div>

          {/* Borrowers tab */}
          {tab === 'borrowers' && (
            contacts.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '48px 0', color: 'var(--muted)' }}>
                <AlertCircle size={20} />
                <span style={{ fontSize: 13 }}>No contacts found for &ldquo;{referrerName}&rdquo;</span>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Name', 'Email', 'Phone', 'Type', 'Stage', 'Added'].map(h => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {contacts.map(c => (
                    <tr key={c.id} style={{ cursor: 'pointer' }}>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>
                        <Link href={`/dashboard/contacts/${c.id}`} style={{ color: '#c9a84c', textDecoration: 'none' }}>
                          {fullName(c)}
                        </Link>
                      </td>
                      <td style={{ ...tdStyle, color: 'var(--muted)' }}>{c.email || '—'}</td>
                      <td style={{ ...tdStyle, color: 'var(--muted)' }}>{c.phone || '—'}</td>
                      <td style={{ ...tdStyle, color: 'var(--muted)' }}>{c.contact_type || '—'}</td>
                      <td style={{ ...tdStyle, color: 'var(--muted)' }}>{c.stage || '—'}</td>
                      <td style={{ ...tdStyle, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                        {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}

          {/* Loans tab */}
          {tab === 'loans' && (
            loans.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '48px 0', color: 'var(--muted)' }}>
                <AlertCircle size={20} />
                <span style={{ fontSize: 13 }}>No loans linked to contacts referred by &ldquo;{referrerName}&rdquo;</span>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Borrower', 'Amount', 'Status', 'Purpose', 'Closing', 'Location', 'Program'].map(h => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loans.map(l => (
                    <tr key={l.id}>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>
                        <Link
                          href={`/dashboard/loans/${l.id}`}
                          style={{ color: '#c9a84c', textDecoration: 'none' }}
                        >
                          {l.borrower_name || l.loan_name || '(unnamed)'}
                        </Link>
                        {l.loan_name && l.borrower_name && (
                          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{l.loan_name}</div>
                        )}
                      </td>
                      <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{fmtCurrency(l.loan_amount)}</td>
                      <td style={tdStyle}><LoanStatusBadge status={l.status} /></td>
                      <td style={{ ...tdStyle, color: 'var(--muted)' }}>{l.loan_purpose || '—'}</td>
                      <td style={{ ...tdStyle, color: 'var(--muted)', whiteSpace: 'nowrap' }}>{fmtDate(l.closing_date)}</td>
                      <td style={{ ...tdStyle, color: 'var(--muted)' }}>{loanLocation(l)}</td>
                      <td style={{ ...tdStyle, color: 'var(--muted)' }}>{l.loan_program || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </>
      )}
    </div>
  )
}
