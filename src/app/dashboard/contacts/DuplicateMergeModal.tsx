'use client'

import { useState, useEffect, useCallback } from 'react'

type DupeContact = {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  contact_type: string | null
  stage: string | null
  created_at: string
  updated_at: string
}

type DupeGroup = {
  group_key: string
  match_type: 'name' | 'email'
  contacts: DupeContact[]
}

type Props = {
  open: boolean
  onClose: () => void
  onMerged: () => void
}

function fmtName(c: DupeContact) {
  return [c.first_name, c.last_name].filter(Boolean).join(' ') || '(unnamed)'
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function DuplicateMergeModal({ open, onClose, onMerged }: Props) {
  const [groups, setGroups] = useState<DupeGroup[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [merging, setMerging] = useState<string | null>(null) // group_key being merged
  const [keepSelections, setKeepSelections] = useState<Record<string, string>>({}) // group_key → keepId
  const [mergedKeys, setMergedKeys] = useState<Set<string>>(new Set())
  const [mergeResult, setMergeResult] = useState<string | null>(null)

  const fetchDuplicates = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/contacts/duplicates')
      if (!res.ok) throw new Error(`${res.status}`)
      const data = await res.json()
      setGroups(data.groups ?? [])
      // Auto-select the most recently updated contact as the "keep" in each group
      const selections: Record<string, string> = {}
      for (const g of (data.groups ?? []) as DupeGroup[]) {
        selections[g.group_key] = g.contacts[0]?.id ?? ''
      }
      setKeepSelections(selections)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      setMergedKeys(new Set())
      setMergeResult(null)
      fetchDuplicates()
    }
  }, [open, fetchDuplicates])

  async function handleMerge(group: DupeGroup) {
    const keepId = keepSelections[group.group_key]
    if (!keepId) return
    const mergeIds = group.contacts.filter(c => c.id !== keepId).map(c => c.id)
    if (mergeIds.length === 0) return

    setMerging(group.group_key)
    try {
      for (const mergeId of mergeIds) {
        const res = await fetch('/api/contacts/merge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keepId, mergeId }),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || `Merge failed: ${res.status}`)
        }
      }
      setMergedKeys(prev => new Set([...prev, group.group_key]))
      setMergeResult(`Merged ${mergeIds.length} duplicate(s) into "${fmtName(group.contacts.find(c => c.id === keepId)!)}"`)
      onMerged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Merge failed')
    } finally {
      setMerging(null)
    }
  }

  if (!open) return null

  const pendingGroups = groups.filter(g => !mergedKeys.has(g.group_key))

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 300,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8,
          padding: 0, width: 680, maxHeight: '80vh', display: 'flex', flexDirection: 'column',
          fontFamily: 'var(--font-mono)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '16px 24px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg)' }}>
              DUPLICATE CONTACTS
            </div>
            <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>
              {loading ? 'Scanning…' : `${pendingGroups.length} group${pendingGroups.length === 1 ? '' : 's'} found`}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: 'none', color: 'var(--muted)',
              fontSize: 18, cursor: 'pointer', padding: '4px 8px',
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ overflow: 'auto', flex: 1, padding: '16px 24px' }}>
          {error && (
            <div style={{
              background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.3)',
              borderRadius: 4, padding: '8px 12px', fontSize: 11, color: '#ff5050', marginBottom: 12,
            }}>
              {error}
            </div>
          )}

          {mergeResult && (
            <div style={{
              background: 'rgba(80,200,120,0.1)', border: '1px solid rgba(80,200,120,0.3)',
              borderRadius: 4, padding: '8px 12px', fontSize: 11, color: '#50c878', marginBottom: 12,
            }}>
              {mergeResult}
            </div>
          )}

          {loading && (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)', fontSize: 12 }}>
              Scanning for duplicates…
            </div>
          )}

          {!loading && pendingGroups.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)', fontSize: 12 }}>
              {mergedKeys.size > 0 ? 'All duplicates resolved!' : 'No duplicates found.'}
            </div>
          )}

          {pendingGroups.map(group => (
            <div
              key={group.group_key}
              style={{
                border: '1px solid var(--border)', borderRadius: 6,
                marginBottom: 12, overflow: 'hidden',
              }}
            >
              {/* Group header */}
              <div style={{
                padding: '8px 12px', background: 'rgba(201,168,76,0.06)',
                borderBottom: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ fontSize: 11 }}>
                  <span style={{ color: '#c9a84c', fontWeight: 600 }}>
                    {group.match_type === 'name' ? 'Name match' : 'Email match'}
                  </span>
                  <span style={{ color: 'var(--muted)', marginLeft: 8 }}>
                    &quot;{group.group_key}&quot; — {group.contacts.length} contacts
                  </span>
                </div>
                <button
                  onClick={() => handleMerge(group)}
                  disabled={merging === group.group_key || !keepSelections[group.group_key]}
                  style={{
                    fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em',
                    background: merging === group.group_key ? 'var(--muted)' : '#c9a84c',
                    color: '#000', padding: '5px 12px', borderRadius: 4,
                    border: 'none', cursor: merging === group.group_key ? 'wait' : 'pointer',
                    fontWeight: 600, opacity: merging === group.group_key ? 0.6 : 1,
                  }}
                >
                  {merging === group.group_key ? 'MERGING…' : 'MERGE'}
                </button>
              </div>

              {/* Contact rows */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '6px 12px', textAlign: 'left', color: 'var(--muted)', fontSize: 9, letterSpacing: '0.1em', width: 40 }}>KEEP</th>
                    <th style={{ padding: '6px 12px', textAlign: 'left', color: 'var(--muted)', fontSize: 9, letterSpacing: '0.1em' }}>NAME</th>
                    <th style={{ padding: '6px 12px', textAlign: 'left', color: 'var(--muted)', fontSize: 9, letterSpacing: '0.1em' }}>EMAIL</th>
                    <th style={{ padding: '6px 12px', textAlign: 'left', color: 'var(--muted)', fontSize: 9, letterSpacing: '0.1em' }}>PHONE</th>
                    <th style={{ padding: '6px 12px', textAlign: 'left', color: 'var(--muted)', fontSize: 9, letterSpacing: '0.1em' }}>TYPE</th>
                    <th style={{ padding: '6px 12px', textAlign: 'left', color: 'var(--muted)', fontSize: 9, letterSpacing: '0.1em' }}>UPDATED</th>
                  </tr>
                </thead>
                <tbody>
                  {group.contacts.map(c => {
                    const isKeep = keepSelections[group.group_key] === c.id
                    return (
                      <tr
                        key={c.id}
                        style={{
                          borderBottom: '1px solid var(--border)',
                          background: isKeep ? 'rgba(201,168,76,0.06)' : 'transparent',
                          cursor: 'pointer',
                        }}
                        onClick={() => setKeepSelections(prev => ({ ...prev, [group.group_key]: c.id }))}
                      >
                        <td style={{ padding: '6px 12px', textAlign: 'center' }}>
                          <input
                            type="radio"
                            name={`keep-${group.group_key}`}
                            checked={isKeep}
                            onChange={() => setKeepSelections(prev => ({ ...prev, [group.group_key]: c.id }))}
                            style={{ accentColor: '#c9a84c' }}
                          />
                        </td>
                        <td style={{ padding: '6px 12px', color: isKeep ? '#c9a84c' : 'var(--fg)', fontWeight: isKeep ? 600 : 400 }}>
                          {fmtName(c)}
                        </td>
                        <td style={{ padding: '6px 12px', color: 'var(--muted)' }}>{c.email ?? '—'}</td>
                        <td style={{ padding: '6px 12px', color: 'var(--muted)' }}>{c.phone ?? '—'}</td>
                        <td style={{ padding: '6px 12px', color: 'var(--muted)', textTransform: 'uppercase', fontSize: 9 }}>{c.contact_type ?? '—'}</td>
                        <td style={{ padding: '6px 12px', color: 'var(--muted)' }}>{fmtDate(c.updated_at)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 24px', borderTop: '1px solid var(--border)',
          display: 'flex', justifyContent: 'flex-end', gap: 8,
        }}>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)',
              borderRadius: 4, padding: '6px 14px', cursor: 'pointer',
              fontFamily: 'var(--font-mono)', fontSize: 11,
            }}
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  )
}
