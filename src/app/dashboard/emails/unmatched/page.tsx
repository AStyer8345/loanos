'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, Link2, X, Inbox, FileText, Sparkles, User } from 'lucide-react'

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

type AutoSuggestion = {
  loan: LoanResult | null
  contact: ContactResult | null
}

function fmtDate(s: string | null) {
  if (!s) return '—'
  const d = new Date(s)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ' at ' +
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

// Loan-related keywords that indicate this email is about a specific file
const LOAN_KEYWORDS = /loan|disclosure|document|appraisal|title|closing|close|funding|escrow|deed|application|underwriting|approval|commit/i

// Extract a street address from a subject line.
// Handles: "2621 Greatwood Trail", "2621 Greatwood Trail, Leander TX", "Couch | 2621 Greatwood Trail"
function extractAddressFromSubject(subject: string | null): string {
  if (!subject) return ''
  const match = subject.match(/\b(\d{3,5}\s+[A-Za-z][A-Za-z\s]{2,30}(?:Trail|Dr|Drive|St|Street|Ave|Avenue|Rd|Road|Blvd|Boulevard|Way|Ct|Court|Ln|Lane|Circle|Cir|Place|Pl|Loop|Pkwy|Parkway))\b/i)
  return match ? match[1].trim() : ''
}

// Extract a plausible borrower name from subject.
// e.g. "Loan Disclosures| Couch | 2621..." → "Couch"
// e.g. "Re: Kyle Burton Introduction" → "Kyle Burton"
function extractNameFromSubject(subject: string | null): string {
  if (!subject) return ''
  const clean = subject.replace(/^(re:|fwd:|fw:)\s*/gi, '').trim()
  // Two-word capitalized name
  const twoWord = clean.match(/\b([A-Z][a-z]{1,15})\s+([A-Z][a-z]{1,20})\b/)
  if (twoWord) return `${twoWord[1]} ${twoWord[2]}`
  // Single capitalized word between pipes or after common keywords (surname only)
  const singleAfterPipe = clean.match(/\|\s*([A-Z][a-z]{2,20})\s*\|/)
  if (singleAfterPipe) return singleAfterPipe[1]
  return ''
}

// Determine if this email is loan-related (subject has address or loan keywords)
function isLoanRelated(subject: string | null): boolean {
  if (!subject) return false
  return LOAN_KEYWORDS.test(subject) || !!extractAddressFromSubject(subject)
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

  // Auto-suggestions: emailId → { loan, contact }
  const [suggestions, setSuggestions] = useState<Map<string, AutoSuggestion>>(new Map())

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
    const rows = (data ?? []) as UnmatchedEmail[]
    setEmails(rows)
    setLoading(false)
    // Run auto-matching in background after load
    runAutoMatch(rows)
  }, [supabase]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-match every email against loans + contacts using subject line analysis
  const runAutoMatch = useCallback(async (rows: UnmatchedEmail[]) => {
    const newSuggestions = new Map<string, AutoSuggestion>()

    for (const email of rows) {
      const address = extractAddressFromSubject(email.subject)
      const name = extractNameFromSubject(email.subject)
      let suggestedLoan: LoanResult | null = null
      let suggestedContact: ContactResult | null = null

      // 1. Try loan match by property address (highest confidence)
      if (address) {
        const { data: byAddress } = await supabase
          .from('loans')
          .select('id, loan_name, borrower_name, property_address, status')
          .ilike('property_address', `%${address}%`)
          .limit(1)
        if (byAddress && byAddress.length > 0) {
          suggestedLoan = { ...(byAddress[0] as LoanResult), _suggested: true }
        }
      }

      // 2. Try loan match by borrower name (if no address match)
      if (!suggestedLoan && name) {
        const parts = name.split(' ')
        const lastName = parts[parts.length - 1]
        const { data: byBorrower } = await supabase
          .from('loans')
          .select('id, loan_name, borrower_name, property_address, status')
          .ilike('borrower_name', `%${lastName}%`)
          .not('status', 'in', '("Closed","Cancelled","Denied","Withdrawn","Funded")')
          .order('created_at', { ascending: false })
          .limit(1)
        if (byBorrower && byBorrower.length > 0) {
          suggestedLoan = { ...(byBorrower[0] as LoanResult), _suggested: true }
        }
      }

      // 3. Try contact match by sender email
      if (email.from_address) {
        const { data: byEmail } = await supabase
          .from('contacts')
          .select('id, first_name, last_name, email, contact_type')
          .ilike('email', email.from_address)
          .limit(1)
        if (byEmail && byEmail.length > 0) {
          suggestedContact = { ...(byEmail[0] as ContactResult), _suggested: true }
        }
      }

      // 4. Try contact match by name from subject (if no email match)
      if (!suggestedContact && name) {
        const parts = name.split(' ')
        const { data: byName } = await supabase
          .from('contacts')
          .select('id, first_name, last_name, email, contact_type')
          .or(`first_name.ilike.%${parts[0]}%,last_name.ilike.%${parts[parts.length - 1]}%`)
          .limit(1)
        if (byName && byName.length > 0) {
          suggestedContact = { ...(byName[0] as ContactResult), _suggested: true }
        }
      }

      if (suggestedLoan || suggestedContact) {
        newSuggestions.set(email.id, { loan: suggestedLoan, contact: suggestedContact })
      }
    }

    setSuggestions(newSuggestions)
  }, [supabase])

  useEffect(() => { fetchEmails() }, [fetchEmails])

  // Open the link panel, defaulting to LOAN mode for loan-related emails
  const openLinkPanel = useCallback(async (email: UnmatchedEmail) => {
    setLinkingId(email.id)
    const defaultMode = isLoanRelated(email.subject) ? 'loan' : 'contact'
    setLinkMode(defaultMode)
    setSearchQuery('')
    setSearchResults([])
    setLoanResults([])

    // Pre-populate with auto-suggestions if available
    const suggestion = suggestions.get(email.id)
    if (suggestion?.loan) {
      setLoanResults([suggestion.loan])
      setLinkMode('loan')
      return
    }
    if (suggestion?.contact) {
      setSearchResults([suggestion.contact])
      setLinkMode('contact')
      return
    }

    // Fallback: try sender email for contact match
    if (email.from_address) {
      setSearching(true)
      const { data: byEmail } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, email, contact_type')
        .ilike('email', email.from_address)
        .limit(5)
      if (byEmail && byEmail.length > 0) {
        setSearchResults((byEmail as ContactResult[]).map(c => ({ ...c, _suggested: true })))
        setLinkMode('contact')
        setSearching(false)
        return
      }
      setSearching(false)
    }

    // Fallback: name-based search
    const name = extractNameFromSubject(email.subject)
    if (name) {
      setSearchQuery(name)
      setSearching(true)
      const parts = name.split(' ')
      if (defaultMode === 'loan') {
        const { data: byBorrower } = await supabase
          .from('loans')
          .select('id, loan_name, borrower_name, property_address, status')
          .ilike('borrower_name', `%${parts[parts.length - 1]}%`)
          .limit(8)
        setLoanResults((byBorrower ?? []) as LoanResult[])
      } else {
        const { data: byName } = await supabase
          .from('contacts')
          .select('id, first_name, last_name, email, contact_type')
          .or(`first_name.ilike.%${parts[0]}%,last_name.ilike.%${parts[parts.length - 1]}%`)
          .limit(8)
        setSearchResults((byName ?? []) as ContactResult[])
      }
      setSearching(false)
    }
  }, [supabase, suggestions])

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
      .limit(10)
    setLoanResults((data ?? []) as LoanResult[])
    setSearching(false)
  }

  const linkToContact = async (email: UnmatchedEmail, contactId: string) => {
    const res = await fetch('/api/emails/link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailId: email.id, contactId }),
    })
    if (!res.ok) {
      console.error('[inbox-review] linkToContact failed:', await res.text())
      return
    }
    setLinkingId(null)
    setSearchQuery('')
    setSearchResults([])
    setSuggestions(prev => { const m = new Map(prev); m.delete(email.id); return m })
    setEmails(prev => prev.filter(e => e.id !== email.id))
  }

  const linkToLoan = async (email: UnmatchedEmail, loanId: string) => {
    const res = await fetch('/api/emails/link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailId: email.id, loanId }),
    })
    if (!res.ok) {
      console.error('[inbox-review] linkToLoan failed:', await res.text())
      return
    }
    setLinkingId(null)
    setSearchQuery('')
    setLoanResults([])
    setSuggestions(prev => { const m = new Map(prev); m.delete(email.id); return m })
    setEmails(prev => prev.filter(e => e.id !== email.id))
  }

  const dismissEmail = async (emailId: string) => {
    const res = await fetch('/api/emails/link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailId, dismiss: true }),
    })
    if (!res.ok) {
      console.error('[inbox-review] dismissEmail failed:', await res.text())
      return
    }
    setSuggestions(prev => { const m = new Map(prev); m.delete(emailId); return m })
    setEmails(prev => prev.filter(e => e.id !== emailId))
  }

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1100 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{
          fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700,
          letterSpacing: '0.08em', color: 'var(--fg)', margin: 0,
        }}>
          INBOX REVIEW
        </h1>
        <p style={{
          fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)',
          marginTop: 4,
        }}>
          Unmatched emails — auto-matched by address & name where possible. Click Link to confirm or reassign.
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
            display: 'grid', gridTemplateColumns: '200px 1fr 180px 140px 120px',
            padding: '10px 16px', borderBottom: '1px solid var(--border)',
            background: 'var(--surface)',
          }}>
            {['FROM', 'SUBJECT', 'AUTO-MATCH', 'RECEIVED', ''].map(h => (
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
            const suggestion = suggestions.get(email.id)
            return (
              <div key={email.id} style={{ position: 'relative' }}>
                <div style={{
                  display: 'grid', gridTemplateColumns: '200px 1fr 180px 140px 120px',
                  padding: '12px 16px', borderBottom: '1px solid var(--border)',
                  alignItems: 'center',
                }}>
                  {/* FROM */}
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

                  {/* SUBJECT */}
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

                  {/* AUTO-MATCH */}
                  <div style={{ overflow: 'hidden' }}>
                    {suggestion?.loan ? (
                      <button
                        onClick={() => linkToLoan(email, suggestion.loan!.id)}
                        title={`Link to loan: ${suggestion.loan.borrower_name || suggestion.loan.loan_name}`}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 5,
                          fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
                          padding: '4px 8px', borderRadius: 4, cursor: 'pointer',
                          background: 'rgba(99,102,241,0.12)', color: '#818CF8',
                          border: '1px solid rgba(99,102,241,0.3)',
                          overflow: 'hidden', maxWidth: '100%',
                        }}
                      >
                        <FileText size={10} style={{ flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {suggestion.loan.borrower_name || suggestion.loan.loan_name}
                        </span>
                        <Sparkles size={9} style={{ flexShrink: 0 }} />
                      </button>
                    ) : suggestion?.contact ? (
                      <button
                        onClick={() => linkToContact(email, suggestion.contact!.id)}
                        title={`Link to contact: ${[suggestion.contact.first_name, suggestion.contact.last_name].filter(Boolean).join(' ')}`}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 5,
                          fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
                          padding: '4px 8px', borderRadius: 4, cursor: 'pointer',
                          background: 'rgba(201,168,76,0.1)', color: '#C9A84C',
                          border: '1px solid rgba(201,168,76,0.3)',
                          overflow: 'hidden', maxWidth: '100%',
                        }}
                      >
                        <User size={10} style={{ flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {[suggestion.contact.first_name, suggestion.contact.last_name].filter(Boolean).join(' ')}
                        </span>
                        <Sparkles size={9} style={{ flexShrink: 0 }} />
                      </button>
                    ) : suggestions.size > 0 ? (
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' }}>—</span>
                    ) : (
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' }}>scanning…</span>
                    )}
                  </div>

                  {/* RECEIVED */}
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>
                    {fmtDate(email.occurred_at || email.created_at)}
                  </span>

                  {/* ACTIONS */}
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
                    width: 380, background: 'var(--surface)',
                    border: '1px solid var(--border)', borderRadius: 6,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    padding: 16,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {(['loan', 'contact'] as const).map(mode => (
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
                            {mode === 'loan' ? 'LOAN' : 'CONTACT'}
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
                        placeholder={linkMode === 'loan' ? 'Search by borrower, address, loan name...' : 'Search by name or email...'}
                        value={searchQuery}
                        onChange={e => {
                          setSearchQuery(e.target.value)
                          if (linkMode === 'loan') searchLoans(e.target.value)
                          else searchContacts(e.target.value)
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
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.08)' }}
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

                    {searchQuery && !searching && linkMode === 'loan' && loanResults.length === 0 && (
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', padding: '8px 0' }}>No loans found</p>
                    )}
                    {searchQuery && !searching && linkMode === 'contact' && searchResults.length === 0 && (
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', padding: '8px 0' }}>No contacts found</p>
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
