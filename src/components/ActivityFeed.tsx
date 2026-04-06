'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

const LS_KEY = 'loanos_activity_last_read'

type ActivityEntry = {
  id: string
  created_at: string
  action: string | null
  entity_type: string | null
  metadata: Record<string, unknown> | null
  summary: string | null
  contact_id: string | null
  loan_id: string | null
  contacts: { first_name: string | null; last_name: string | null } | null
  loans: { loan_name: string | null } | null
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function actionLabel(action: string | null, metadata: Record<string, unknown> | null): string {
  if (!action) return 'Activity'
  if (action === 'contact_updated') {
    const field = metadata?.field as string | undefined
    const fields = metadata?.fields as string[] | undefined
    if (field) return `Updated ${field.replace(/_/g, ' ')}`
    if (fields?.length) return `Updated ${fields.map(f => f.replace(/_/g, ' ')).join(', ')}`
  }
  if (action === 'email.received' || action === 'email_received') return 'Email received'
  if (action === 'loan_created') return 'Loan created'
  if (action === 'contact_created') return 'Contact created'
  if (action === 'note_added') return 'Note added'
  if (action === 'stage_changed') return 'Stage changed'
  return action.replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function actionDetail(entry: ActivityEntry): string | null {
  const meta = entry.metadata ?? {}
  const action = entry.action ?? ''

  if (action === 'email.received' || action === 'email_received') {
    return (meta.subject ?? meta.email_subject ?? meta.from_address ?? null) as string | null
  }
  if (action === 'stage_changed') {
    return entry.summary ?? null
  }
  if (entry.summary && entry.summary !== 'Updated contact record') return entry.summary
  return null
}

function entityName(entry: ActivityEntry): string | null {
  if (entry.contacts) {
    const { first_name, last_name } = entry.contacts
    return [first_name, last_name].filter(Boolean).join(' ') || null
  }
  if (entry.loans?.loan_name) return entry.loans.loan_name
  return null
}

function navTarget(entry: ActivityEntry): string | null {
  if (entry.contact_id) return `/dashboard/contacts/${entry.contact_id}`
  if (entry.loan_id) return `/dashboard/loans/${entry.loan_id}`
  return null
}

export default function ActivityFeed() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [entries, setEntries] = useState<ActivityEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [lastRead, setLastRead] = useState(new Date(0).toISOString())

  // Load lastRead from localStorage (client-only, after mount)
  useEffect(() => {
    const stored = localStorage.getItem(LS_KEY)
    if (stored) setLastRead(stored)
  }, [])

  const fetchEntries = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/activity?limit=50&include_joins=contacts,loans')
      if (res.ok) {
        setEntries(await res.json())
      }
    } catch { /* ignore fetch errors */ }
    setLoading(false)
  }, [])

  // Fetch on mount so badge is populated immediately
  useEffect(() => { fetchEntries() }, [fetchEntries])

  // Mark all read whenever panel opens
  useEffect(() => {
    if (open) {
      const now = new Date().toISOString()
      localStorage.setItem(LS_KEY, now)
      setLastRead(now)
    }
  }, [open])

  const unreadCount = entries.filter(e => e.created_at > lastRead).length

  return (
    <>
      {/* Bell button — always rendered, lives in TopNav */}
      <button
        onClick={() => setOpen(v => !v)}
        title="Activity feed"
        style={{
          position: 'relative', background: 'transparent', border: 'none',
          cursor: 'pointer', padding: '4px 6px', fontSize: 15,
          color: open ? '#c9a84c' : 'rgba(255,255,255,0.5)',
          display: 'flex', alignItems: 'center', transition: 'color 0.15s',
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: 0, right: 0,
            background: '#c9a84c', color: '#000', borderRadius: '50%',
            width: 15, height: 15, fontSize: 9,
            fontFamily: 'var(--font-mono)', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 998, background: 'rgba(0,0,0,0.3)' }}
          />

          {/* Slide-out panel */}
          <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, width: 380, zIndex: 999,
            background: 'var(--card)', borderLeft: '1px solid var(--border)',
            display: 'flex', flexDirection: 'column',
            boxShadow: '-8px 0 32px rgba(0,0,0,0.4)',
          }}>
            {/* Header */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '14px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0,
            }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.1em', color: 'var(--muted)' }}>
                ACTIVITY FEED
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button onClick={fetchEntries}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 13, fontFamily: 'var(--font-mono)' }}
                  title="Refresh">↺</button>
                <button onClick={() => setOpen(false)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 16, lineHeight: 1 }}>
                  ✕
                </button>
              </div>
            </div>

            {/* Entries */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {loading ? (
                <p style={{ padding: 20, color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 12, textAlign: 'center' }}>Loading…</p>
              ) : entries.length === 0 ? (
                <p style={{ padding: 20, color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 12, textAlign: 'center' }}>No activity yet.</p>
              ) : entries.map(entry => {
                const isUnread = entry.created_at > lastRead
                const label = actionLabel(entry.action, entry.metadata)
                const detail = actionDetail(entry)
                const name = entityName(entry)
                const target = navTarget(entry)
                return (
                  <div
                    key={entry.id}
                    onClick={target ? () => { setOpen(false); router.push(target) } : undefined}
                    style={{
                      display: 'flex', gap: 12, padding: '12px 20px',
                      borderBottom: '1px solid var(--border)',
                      background: isUnread ? 'rgba(201,168,76,0.05)' : 'transparent',
                      cursor: target ? 'pointer' : 'default',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={target ? e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.04)' } : undefined}
                    onMouseLeave={target ? e => { (e.currentTarget as HTMLDivElement).style.background = isUnread ? 'rgba(201,168,76,0.05)' : 'transparent' } : undefined}
                  >
                    {/* Unread indicator dot */}
                    <div style={{ paddingTop: 6, flexShrink: 0 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: isUnread ? '#c9a84c' : 'transparent' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, marginBottom: 2 }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--foreground)', fontWeight: 600 }}>
                          {label}
                        </span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', flexShrink: 0 }}>
                          {timeAgo(entry.created_at)}
                        </span>
                      </div>
                      {name && (
                        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--foreground)', margin: '0 0 2px', fontWeight: 500 }}>
                          {name}
                        </p>
                      )}
                      {detail && (
                        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {detail.slice(0, 80)}
                        </p>
                      )}
                      {target && (
                        <span style={{ fontSize: 9, color: 'rgba(201,168,76,0.6)', fontFamily: 'var(--font-mono)', marginTop: 4, display: 'inline-block' }}>
                          view →
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </>
  )
}
