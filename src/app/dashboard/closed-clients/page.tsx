'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'

type LoanSummary = {
  loan_amount: number | null
  closing_date: string | null
  loan_type: string | null
}

type ClosedContact = {
  id: string
  first_name: string | null
  last_name: string | null
  referred_by: string | null
  stage: string | null
  loans: LoanSummary[]
}

export default function ClosedClientsPage() {
  const supabase = useMemo(() => createClient(), [])

  const [contacts, setContacts] = useState<ClosedContact[]>([])
  const [filtered, setFiltered]   = useState<ClosedContact[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [sortDir, setSortDir]     = useState<'asc' | 'desc'>('desc')

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchContacts = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, referred_by, stage, loans(loan_amount, closing_date, loan_type)')
      .eq('stage', 'Closed Client')
      .limit(1000)
    if (!error) setContacts((data ?? []) as ClosedContact[])
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchContacts() }, [fetchContacts])

  // ── Client-side filter + sort ──────────────────────────────────────────────
  useEffect(() => {
    let result = contacts

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter(c =>
        `${c.first_name ?? ''} ${c.last_name ?? ''}`.toLowerCase().includes(q)
      )
    }

    result = [...result].sort((a, b) => {
      const dateA = a.loans?.[0]?.closing_date ?? ''
      const dateB = b.loans?.[0]?.closing_date ?? ''
      if (!dateA && !dateB) return 0
      if (!dateA) return 1
      if (!dateB) return -1
      return sortDir === 'desc'
        ? dateB.localeCompare(dateA)
        : dateA.localeCompare(dateB)
    })

    setFiltered(result)
  }, [contacts, search, sortDir])

  // ── Helpers ───────────────────────────────────────────────────────────────
  function fmt(val: string | null | undefined, type: 'currency' | 'date' | 'text' = 'text') {
    if (!val) return '—'
    if (type === 'currency') return `$${Number(val).toLocaleString()}`
    if (type === 'date') return new Date(val).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    return val
  }

  return (
    <div style={{ padding: '32px 32px 0', background: 'var(--bg)', minHeight: '100%', color: 'var(--fg)' }}>

      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, letterSpacing: '0.05em', lineHeight: 1 }}>
            CLOSED CLIENTS
          </h1>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
            {loading ? 'LOADING…' : `${filtered.length.toLocaleString()} of ${contacts.length.toLocaleString()} clients`}
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20,
        padding: '12px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6,
      }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name…"
          style={{
            flex: 1, background: 'var(--bg)', color: 'var(--fg)', border: '1px solid var(--border)',
            borderRadius: 4, padding: '7px 12px', fontFamily: 'var(--font-mono)', fontSize: 12, outline: 'none',
          }}
        />
        <button
          onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em',
            background: 'transparent', color: 'var(--muted)', border: '1px solid var(--border)',
            borderRadius: 4, padding: '7px 14px', cursor: 'pointer', whiteSpace: 'nowrap',
          }}
        >
          CLOSE DATE {sortDir === 'desc' ? '▼' : '▲'}
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ padding: 64, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)' }}>
          LOADING…
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 64, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)' }}>
          NO CLOSED CLIENTS FOUND
        </div>
      ) : (
        <div style={{ borderRadius: 6, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
            <thead>
              <tr style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
                {[
                  { label: 'NAME',            width: 200 },
                  { label: 'LOAN AMOUNT',      width: 140 },
                  { label: 'CLOSE DATE',       width: 130 },
                  { label: 'LOAN TYPE',        width: 140 },
                  { label: 'REFERRING AGENT',  width: undefined },
                ].map(col => (
                  <th key={col.label} style={{
                    padding: '10px 16px', textAlign: 'left',
                    fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em',
                    color: 'var(--muted)', whiteSpace: 'nowrap', width: col.width,
                  }}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((contact, i) => {
                const loan = contact.loans?.[0]
                const name = `${contact.first_name ?? ''} ${contact.last_name ?? ''}`.trim() || '—'
                return (
                  <tr key={contact.id} style={{
                    borderBottom: '1px solid var(--border)',
                    background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                  }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(201,168,76,0.06)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}
                  >
                    <td style={{ padding: '10px 16px', color: 'var(--fg)', fontWeight: 500 }}>{name}</td>
                    <td style={{ padding: '10px 16px', color: loan?.loan_amount ? '#c9a84c' : 'var(--muted)' }}>
                      {fmt(loan?.loan_amount?.toString(), 'currency')}
                    </td>
                    <td style={{ padding: '10px 16px', color: 'var(--fg)' }}>
                      {fmt(loan?.closing_date, 'date')}
                    </td>
                    <td style={{ padding: '10px 16px', color: 'var(--fg)' }}>
                      {fmt(loan?.loan_type)}
                    </td>
                    <td style={{ padding: '10px 16px', color: 'var(--muted)' }}>
                      {fmt(contact.referred_by)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

    </div>
  )
}
