'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, Link2, X, Inbox, FileText, Sparkles } from 'lucide-react'

type UnmatchedEmail = {
  id: string
  from_address: string | null
  subject: string | null
  body_snippet: string | null
  occurred_at: string | null
  created_at: string
  metadata: Record<string, unknown> | null
}

type ContactResult = {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  contact_type: string | null
  _suggested?: boolean
}

type LoanResult = {
  id: string
  loan_name: string | null
  borrower_name: string | null
  property_address: string | null
  status: string | null
  _suggested?: boolean
}

function fmtDate(s: string | null) {
  if (!s) return '—'
  const d = new Date(s)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ' at ' +
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

// Extract a plausible name from an email subject line.
// e.g. "Re: Preston Couch Introduction - 2621..." → "Preston Couch"
function extractNameFromSubject(subject: string | null): string {
  if (!subject) return ''
  // Strip Re:/Fwd:/FW: prefixes
  const clean = subject.replace(/^(re:|fwd:|fw:)\s*/gi, '').trim()
  // Look for "FirstName LastName" pattern — two consecutive capitalized words
  const match = clean.match(/\b([A-Z][a-z]{1,15})\s+([A-Z][a-z]{1,20})\b/)
  if (match) return `${match[1]} ${match[2]}`
  return ''
}

export default function UnmatchedEmailsPage() {
  const supabase = createClient()
  const [emails, setEmails] = useState<UnmatchedEmail[]>([])
  const [loading, setLoading] = useState(true)
  const [linkingId, setLinkingId] = useState<string | null>(null)
  const [linkMode, setLinkMode] = useState<'contact' | 'loan'>('contact')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<ContactResult[]>([])
  const [loanResults, setLoanResults] = useState<LoanResult[]>([])
  const [searching, setSearching] = useState(false)

  const fetchEmails = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('activity_log')
      .select('id, from_address, subject, body_snippet, occurred_at, created_at, metadata')
      .eq('type', 'email_inbound')
      .is('contact_id', null)
      .is('loan_id', null)
      .not('dismissed', 'eq', true)
      .order('occurred_at', { ascending: false })
      .limit(200)
    setEmails((data ?? []) as UnmatchedEmail[])
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchEmails() }, [fetchEmails])

  // When the link panel opens, auto-suggest by sender email + subject name
  const openLinkPanel = useCallback(async (email: UnmatchedEmail) => {
    setLinkingId(email.id)
    setLinkMode('contact')
    setSearchQuery('')
    setSearchResults([])
    setLoanResults([])

    // Try to find a contact by exact sender email address
    if (email.from_address) {
      setSearching(true)
      const { data: byEmail } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, email, contact_type')
        .ilike('email', email.from_address)
        .limit(5)

      if (byEmail && byEmail.length > 0) {
        setSearchResults((byEmail as ContactResult[]).map(c => ({ ...c, _suggested: true })))
        setSearching(false)
        return
      }
      setSearching(false)
    }

    // Fallback: extract a name from subject and pre-search
    const name = extractNameFromSubject(email.subject)
    if (name) {
      setSearchQuery(name)
      setSearching(true)
      const parts = name.split(' ')
      const { data: byName } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, email, contact_type')
        .or(`first_name.ilike.%${parts[0]}%,last_name.ilike.%${parts[parts.length - 1]}%`)
        .limit(8)
      setSearchResults((byName ?? []) as ContactResult[])
      setSearching(false)
    }
  }, [supabase])

  const searchContacts = async (query: string) => {
    if (!query.trim()) { setSearchResults([]); return }
    setSearching(true)
    const q = query.trim()
    const { data } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, email, contact_type')
      .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%`)
      .limit(10)
    setSearchResults((data ?? []) as ContactResult[])
    setSearching(false)
  }

  const searchLoans = async (query: string) => {
    if (!query.trim()) { setLoanResults([]); return }
    setSearching(true)
    const q = query.trim()
    const { data } = await supabase
      .from('loans')
      .select('id, loan_name, borrower_name, property_address, status')
      .or(`loan_name.ilike.%${q}%,borrower_name.ilike.%${q}%,property_address.ilike.%${q}%`)
      .not('status', 'in', '("Closed","Cancelled","Denied","Withdrawn")')
      .limit(10)
    setLoanResults((data ?? []) as LoanResult[])
    setSearching(false)
  }

  const linkToContact = async (email: UnmatchedEmail, contactId: string) => {
    await supabase
      .from('activity_log')
      .update({
        contact_id: contactId,
        summary: email.subject || email.body_snippet?.slice(0, 120) || 'Inbound email',
      })
      .eq('id', email.id)
    await supabase
      .from('contacts')
      .update({ last_touch_at: new Date().toISOString() })
      .eq('id', contactId)
    setLinkingId(null)
    setSearchQuery('')
    setSearchResults([])
    setEmails(prev => prev.filter(e => e.id !== email.id))
  }

  const linkToLoan = async (email: UnmatchedEmail, loanId: string) => {
    await supabase
      .from('activity_log')
      .update({
        loan_id: loanId,
        summary: email.subject || email.body_snippet?.slice(0, 120) || 'Inbound email',
      })
      .eq('id', email.id)
    setLinkingId(null)
    setSearchQuery('')
    setLoanResults([])
    setEmails(prev => prev.filter(e => e.id !== email.id))
  }

  const dismissEmail = async (emailId: string) => {
    await supabase
      .from('activity_log')
      .update({ dismissed: true })
      .eq('id', emailId)
    setEmails(prev => prev.filter(e => e.id !== emailId))
  }

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1000 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{
          fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700,
          letterSpacing: '0.08em', color: 'var(--fg)', margin: 0,
        }}>
          UNMATCHED EMAILS
        </h1>
        <p style={{
          fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)',
          marginTop: 4,
        }}>
          Inbound emails from unknown senders that look transactional. Link them to a contact or dismiss.
        </p>
      </div>

      {loading ? (
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)', textAlign: 'center', padding: 48 }}>
          Loading...
        </p>
      ) : emails.length === 0 ? (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
          padding: '64px 0', color: 'var(--muted)',
        }}>
          <Inbox size={28} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>
            No unmatched emails to review {'\u2014'} all clear.
          </span>
        </div>
      ) : (
        <div style={{
          border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden',
        }}>
          {/* Table header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '200px 1fr 140px 100px',
            padding: '10px 16px', borderBottom: '1px solid var(--border)',
            background: 'var(--surface)',
          }}>
            {['FROM', 'SUBJECT', 'RECEIVED', ''].map(h => (
              <span key={h} style={{
                fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)',
                letterSpacing: '0.1em', fontWeight: 600,
              }}>
                {h}
              </span>
            ))}
          </div>

          {/* Rows */}
          {emails.map(email => {
            const fromName = (email.metadata?.from_name as string) || null
            return (
              <div key={email.id} style={{ position: 'relative' }}>
                <div style={{
                  display: 'grid', gridTemplateColumns: '200px 1fr 140px 100px',
                  padding: '12px 16px', borderBottom: '1px solid var(--border)',
                  alignItems: 'center',
                }}>
                  <div style={{ overflow: 'hidden' }}>
                    {fromName && (
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {fromName}
                      </div>
                    )}
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {email.from_address || '\u2014'}
                    </div>
                  </div>

                  <div style={{ overflow: 'hidden', paddingRight: 12 }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {email.subject || '\u2014'}
                    </div>
                    {email.body_snippet && (
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
                        {email.body_snippet.slice(0, 100)}
                      </div>
                    )}
                  </div>

                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>
                    {fmtDate(email.occurred_at || email.created_at)}
                  </span>

                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => openLinkPanel(email)}
                      title="Link to Contact or Loan"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
                        padding: '5px 10px', borderRadius: 4, cursor: 'pointer',
                        background: 'rgba(201,168,76,0.1)', color: '#C9A84C',
                        border: '1px solid rgba(201,168,76,0.3)',
                      }}
                    >
                      <Link2 size={11} /> Link
                    </button>
                    <button
                      onClick={() => dismissEmail(email.id)}
                      title="Dismiss"
                      style={{
                        display: 'inline-flex', alignItems: 'center',
                        padding: '5px 6px', borderRadius: 4, cursor: 'pointer',
                        background: 'transparent', color: 'var(--muted)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <X size={11} />
                    </button>
                  </div>
                </div>

                {/* Link panel */}
                {linkingId === email.id && (
                  <div style={{
                    position: 'absolute', top: 0, right: 0, zIndex: 10,
                    width: 360, background: 'var(--surface)',
                    border: '1px solid var(--border)', borderRadius: 6,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    padding: 16,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {(['contact', 'loan'] as const).map(mode => (
                          <button
                            key={mode}
                            onClick={() => { setLinkMode(mode); setSearchQuery(''); setSearchResults([]); setLoanResults([]) }}
                            style={{
                              fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
                              letterSpacing: '0.1em', padding: '3px 10px', borderRadius: 4, cursor: 'pointer',
                              background: linkMode === mode ? 'rgba(201,168,76,0.15)' : 'transparent',
                              color: linkMode === mode ? '#C9A84C' : 'var(--muted)',
                              border: `1px solid ${linkMode === mode ? 'rgba(201,168,76,0.4)' : 'var(--border)'}`,
                            }}
                          >
                            {mode === 'contact' ? 'CONTACT' : 'LOAN'}
                          </button>
                        ))}
                      </div>
                      <button onClick={() => setLinkingId(null)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}>
                        <X size={14} />
                      </button>
                    </div>

                    <div style={{ position: 'relative', marginBottom: 8 }}>
                      <Search size={13} style={{ position: 'absolute', left: 8, top: 8, color: 'var(--muted)' }} />
                      <input
                        autoFocus
                        placeholder={linkMode === 'contact' ? 'Search by name or email...' : 'Search by borrower, address, loan name...'}
                        value={searchQuery}
                        onChange={e => {
                          setSearchQuery(e.target.value)
                          if (linkMode === 'contact') searchContacts(e.target.value)
                          else searchLoans(e.target.value)
                        }}
                        style={{
                          width: '100%', boxSizing: 'border-box',
                          fontFamily: 'var(--font-mono)', fontSize: 12,
                          padding: '7px 10px 7px 28px', borderRadius: 4,
                          background: 'var(--bg)', color: 'var(--fg)',
                          border: '1px solid var(--border)', outline: 'none',
                        }}
                      />
                    </div>

                    {searching && (
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', padding: '8px 0' }}>Searching...</p>
                    )}

                    {linkMode === 'contact' && searchResults.map(c => (
                      <button
                        key={c.id}
                        onClick={() => linkToContact(email, c.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          width: '100%', textAlign: 'left',
                          padding: '8px 10px', borderRadius: 4, cursor: 'pointer',
                          background: 'transparent', border: 'none',
                          fontFamily: 'var(--font-mono)',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(201,168,76,0.08)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                      >
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%',
                          background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.3)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 10, fontWeight: 700, color: '#C9A84C', flexShrink: 0,
                        }}>
                          {(c.first_name ?? '').slice(0, 1).toUpperCase()}{(c.last_name ?? '').slice(0, 1).toUpperCase()}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: 12, color: 'var(--fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {`${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() || '\u2014'}
                            {c._suggested && (
                              <span style={{ marginLeft: 6, fontSize: 9, color: '#C9A84C', letterSpacing: '0.08em' }}>
                                <Sparkles size={9} style={{ display: 'inline', marginRight: 2 }} />SUGGESTED
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {c.email || '\u2014'}
                            {c.contact_type && <span style={{ marginLeft: 6, color: '#C9A84C' }}>{c.contact_type}</span>}
                          </div>
                        </div>
                      </button>
                    ))}

                    {linkMode === 'loan' && loanResults.map(loan => (
                      <button
                        key={loan.id}
                        onClick={() => linkToLoan(email, loan.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          width: '100%', textAlign: 'left',
                          padding: '8px 10px', borderRadius: 4, cursor: 'pointer',
                          background: 'transparent', border: 'none',
                          fontFamily: 'var(--font-mono)',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(201,168,76,0.08)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                      >
                        <div style={{
                          width: 28, height: 28, borderRadius: 4,
                          background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <FileText size={12} color="#818CF8" />
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: 12, color: 'var(--fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {loan.borrower_name || loan.loan_name || '\u2014'}
                            {loan._suggested && (
                              <span style={{ marginLeft: 6, fontSize: 9, color: '#818CF8', letterSpacing: '0.08em' }}>
                                <Sparkles size={9} style={{ display: 'inline', marginRight: 2 }} />SUGGESTED
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {loan.property_address || loan.loan_name || '\u2014'}
                            {loan.status && <span style={{ marginLeft: 6, color: '#818CF8' }}>{loan.status}</span>}
                          </div>
                        </div>
                      </button>
                    ))}

                    {searchQuery && !searching && linkMode === 'contact' && searchResults.length === 0 && (
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', padding: '8px 0' }}>No contacts found</p>
                    )}
                    {searchQuery && !searching && linkMode === 'loan' && loanResults.length === 0 && (
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', padding: '8px 0' }}>No active loans found</p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
