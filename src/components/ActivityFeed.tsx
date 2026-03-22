'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

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

function actionLabel(action: string | null): string {
  if (!action) return 'Activity'
  return action.replace(/_/g, ' ').replace(/\./g, ' › ')
}

export default function ActivityFeed() {
  const supabase = createClient()
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
    const { data } = await supabase
      .from('activity_log')
      .select('id, created_at, action, entity_type, metadata, summary, contact_id, loan_id')
      .order('created_at', { ascending: false })
      .limit(50)
    setEntries((data ?? []) as ActivityEntry[])
    setLoading(false)
  }, [supabase])

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
                const label = actionLabel(entry.action)
                const preview = entry.summary
                  ?? (entry.metadata
                    ? (Object.values(entry.metadata).find(v => typeof v === 'string') as string | undefined) ?? ''
                    : '')
                return (
                  <div key={entry.id} style={{
                    display: 'flex', gap: 12, padding: '12px 20px',
                    borderBottom: '1px solid var(--border)',
                    background: isUnread ? 'rgba(201,168,76,0.05)' : 'transparent',
                  }}>
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
                      {preview && (
                        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {String(preview).slice(0, 80)}
                        </p>
                      )}
                      {entry.entity_type && (
                        <span style={{ fontSize: 9, color: '#c9a84c', fontFamily: 'var(--font-mono)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 3, padding: '1px 4px', display: 'inline-block', marginTop: 4 }}>
                          {entry.entity_type}
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
