'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type ContactResult = {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  stage: string | null
  contact_type: string | null
}

type LoanResult = {
  id: string
  borrower_name: string | null
  loan_name: string | null
  status: string | null
  loan_amount: number | null
}

type SearchResults = { contacts: ContactResult[]; loans: LoanResult[] }

export default function GlobalSearch() {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResults>({ contacts: [], loans: [] })
  const [loading, setLoading] = useState(false)
  const [highlightIdx, setHighlightIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Keyboard shortcut: cmd/ctrl+k to open, Esc to close ──────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(prev => !prev)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  // ── Reset + focus on open ─────────────────────────────────────────────────
  useEffect(() => {
    if (open) {
      setQuery('')
      setResults({ contacts: [], loans: [] })
      setHighlightIdx(0)
      setTimeout(() => inputRef.current?.focus(), 40)
    }
  }, [open])

  // ── Search: parallel Supabase ilike queries ───────────────────────────────
  const search = useCallback(async (term: string) => {
    if (!term.trim()) {
      setResults({ contacts: [], loans: [] })
      setLoading(false)
      return
    }
    setLoading(true)
    const t = term.trim()
    const [{ data: contacts }, { data: loans }] = await Promise.all([
      supabase
        .from('contacts')
        .select('id, first_name, last_name, email, stage, contact_type')
        .or(`first_name.ilike.%${t}%,last_name.ilike.%${t}%,email.ilike.%${t}%`)
        .limit(5),
      supabase
        .from('loans')
        .select('id, borrower_name, loan_name, status, loan_amount')
        .or(`borrower_name.ilike.%${t}%,loan_name.ilike.%${t}%`)
        .limit(5),
    ])
    setResults({ contacts: contacts ?? [], loans: loans ?? [] })
    setLoading(false)
    setHighlightIdx(0)
  }, [supabase])

  // ── Debounce: 300ms after last keystroke ──────────────────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(query), 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, search])

  // ── Flat list for single-index keyboard nav (contacts then loans) ─────────
  const allResults = [
    ...results.contacts.map(c => ({ type: 'contact' as const, item: c })),
    ...results.loans.map(l => ({ type: 'loan' as const, item: l })),
  ]

  function navigate(type: 'contact' | 'loan', id: string) {
    setOpen(false)
    router.push(type === 'contact' ? `/dashboard/contacts/${id}` : `/dashboard/loans/${id}`)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightIdx(i => Math.min(i + 1, allResults.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightIdx(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && allResults[highlightIdx]) {
      const r = allResults[highlightIdx]
      navigate(r.type, r.item.id)
    }
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}
      />

      {/* Palette */}
      <div style={{
        position: 'fixed', top: '15vh', left: '50%', transform: 'translateX(-50%)',
        zIndex: 1000, width: '100%', maxWidth: 560,
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: 8, boxShadow: '0 20px 60px rgba(0,0,0,0.4)', overflow: 'hidden',
      }}>
        {/* Input row */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 16px', borderBottom: '1px solid var(--border)' }}>
          <span style={{ color: 'var(--muted)', marginRight: 10, fontSize: 18 }}>⌕</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search contacts, loans…"
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--foreground)',
              padding: '14px 0',
            }}
          />
          {loading && <span style={{ color: 'var(--muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>…</span>}
        </div>

        {/* Results */}
        <div style={{ maxHeight: 380, overflowY: 'auto' }}>
          {!query.trim() ? (
            <div style={{ padding: '12px 16px' }}>
              <p style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginBottom: 8, letterSpacing: '0.1em' }}>QUICK JUMP</p>
              {[
                { label: 'All Contacts', href: '/dashboard/contacts' },
                { label: 'All Loans', href: '/dashboard/loans' },
              ].map(link => (
                <button key={link.href} onClick={() => { setOpen(false); router.push(link.href) }}
                  style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: 4,
                    border: 'none', background: 'transparent', cursor: 'pointer',
                    fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--foreground)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  → {link.label}
                </button>
              ))}
            </div>
          ) : allResults.length === 0 && !loading ? (
            <p style={{ padding: '20px 16px', color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 12, textAlign: 'center' }}>
              No results for &quot;{query}&quot;
            </p>
          ) : (
            <>
              {results.contacts.length > 0 && (
                <div>
                  <p style={{ padding: '10px 16px 4px', fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>CONTACTS</p>
                  {results.contacts.map((c, i) => (
                    <button key={c.id} onClick={() => navigate('contact', c.id)}
                      onMouseEnter={() => setHighlightIdx(i)}
                      style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '9px 16px', border: 'none',
                        cursor: 'pointer', textAlign: 'left', gap: 10,
                        background: i === highlightIdx ? 'rgba(201,168,76,0.12)' : 'transparent' }}>
                      <span style={{ fontSize: 13, color: 'var(--foreground)', fontFamily: 'var(--font-mono)', flex: 1 }}>
                        {[c.first_name, c.last_name].filter(Boolean).join(' ') || '—'}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{c.email ?? ''}</span>
                      {c.stage && (
                        <span style={{ fontSize: 10, color: '#c9a84c', fontFamily: 'var(--font-mono)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 3, padding: '1px 5px' }}>
                          {c.stage}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {results.loans.length > 0 && (
                <div>
                  <p style={{ padding: '10px 16px 4px', fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>LOANS</p>
                  {results.loans.map((l, i) => {
                    const flatIdx = results.contacts.length + i
                    return (
                      <button key={l.id} onClick={() => navigate('loan', l.id)}
                        onMouseEnter={() => setHighlightIdx(flatIdx)}
                        style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '9px 16px', border: 'none',
                          cursor: 'pointer', textAlign: 'left', gap: 10,
                          background: flatIdx === highlightIdx ? 'rgba(201,168,76,0.12)' : 'transparent' }}>
                        <span style={{ fontSize: 13, color: 'var(--foreground)', fontFamily: 'var(--font-mono)', flex: 1 }}>
                          {l.borrower_name ?? l.loan_name ?? '—'}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                          {l.loan_amount ? `$${l.loan_amount.toLocaleString()}` : ''}
                        </span>
                        {l.status && (
                          <span style={{ fontSize: 10, color: '#c9a84c', fontFamily: 'var(--font-mono)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 3, padding: '1px 5px' }}>
                            {l.status}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer hint bar */}
        <div style={{ display: 'flex', gap: 16, padding: '8px 16px', borderTop: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)' }}>
          {([['↵', 'select'], ['↑↓', 'navigate'], ['esc', 'close']] as const).map(([key, label]) => (
            <span key={key} style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <kbd style={{ background: 'var(--border)', borderRadius: 3, padding: '1px 5px', fontSize: 9 }}>{key}</kbd>
              {label}
            </span>
          ))}
        </div>
      </div>
    </>
  )
}
