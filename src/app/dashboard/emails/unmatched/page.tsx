'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, Link2, X, Inbox } from 'lucide-react'

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
}

function fmtDate(s: string | null) {
  if (!s) return '—'
  const d = new Date(s)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ' at ' +
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export default function UnmatchedEmailsPage() {
  const supabase = createClient()
  const [emails, setEmails] = useState<UnmatchedEmail[]>([])
  const [loading, setLoading] = useState(true)
  const [linkingId, setLinkingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<ContactResult[]>([])
  const [searching, setSearching] = useState(false)

  const fetchEmails = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('activity_log')
      .select('id, from_address, subject, body_snippet, occurred_at, created_at, metadata')
      .eq('type', 'email_inbound')
      .filter('metadata->>needs_review', 'eq', 'true')
      .order('occurred_at', { ascending: false })
      .limit(200)
    setEmails((data ?? []) as UnmatchedEmail[])
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchEmails() }, [fetchEmails])

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

  const linkToContact = async (emailId: string, contactId: string) => {
    await supabase
      .from('activity_log')
      .update({
        contact_id: contactId,
        metadata: { needs_review: false },
      })
      .eq('id', emailId)

    // Update contact last_touch_at
    await supabase
      .from('contacts')
      .update({ last_touch_at: new Date().toISOString() })
      .eq('id', contactId)

    setLinkingId(null)
    setSearchQuery('')
    setSearchResults([])
    setEmails(prev => prev.filter(e => e.id !== emailId))
  }

  const dismissEmail = async (emailId: string) => {
    await supabase
      .from('activity_log')
      .update({ metadata: { needs_review: false, dismissed: true } })
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
                      onClick={() => { setLinkingId(email.id); setSearchQuery(''); setSearchResults([]) }}
                      title="Link to Contact"
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

                {/* Link-to-contact modal */}
                {linkingId === email.id && (
                  <div style={{
                    position: 'absolute', top: 0, right: 0, zIndex: 10,
                    width: 340, background: 'var(--surface)',
                    border: '1px solid var(--border)', borderRadius: 6,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    padding: 16,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em' }}>
                        LINK TO CONTACT
                      </span>
                      <button
                        onClick={() => setLinkingId(null)}
                        style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}
                      >
                        <X size={14} />
                      </button>
                    </div>

                    <div style={{ position: 'relative', marginBottom: 8 }}>
                      <Search size={13} style={{ position: 'absolute', left: 8, top: 8, color: 'var(--muted)' }} />
                      <input
                        autoFocus
                        placeholder="Search by name or email..."
                        value={searchQuery}
                        onChange={e => { setSearchQuery(e.target.value); searchContacts(e.target.value) }}
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

                    {searchResults.map(c => (
                      <button
                        key={c.id}
                        onClick={() => linkToContact(email.id, c.id)}
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
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 12, color: 'var(--fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {`${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() || '\u2014'}
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {c.email || '\u2014'}
                            {c.contact_type && (
                              <span style={{ marginLeft: 6, color: '#C9A84C' }}>
                                {c.contact_type}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}

                    {searchQuery && !searching && searchResults.length === 0 && (
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', padding: '8px 0' }}>
                        No contacts found
                      </p>
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
