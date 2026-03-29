'use client'

import { useState, useEffect } from 'react'

const GOLD = '#C9A84C'

type ActivityEntry = {
  id: string
  type: 'success' | 'warning' | 'error'
  message: string
  created_at: string
}

const DOT_COLORS: Record<string, string> = {
  success: '#4CAF82',
  warning: '#C9A84C',
  error: '#E05252',
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export default function SocialActivityFeed() {
  const [entries, setEntries] = useState<ActivityEntry[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch('/api/social/activity')
        if (!res.ok) throw new Error('fetch failed')
        const data = await res.json()
        if (!cancelled) setEntries(data?.activity ?? [])
      } catch {
        // API may not exist yet — use empty state
        if (!cancelled) setEntries([])
      } finally {
        if (!cancelled) setLoaded(true)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  return (
    <div
      className="border-b border-zinc-800 px-4 py-2"
      style={{ background: '#0a0a1a', fontFamily: "'IBM Plex Mono', 'Courier New', monospace" }}
    >
      <div className="flex items-center gap-4">
        <span
          className="flex-shrink-0 font-bold"
          style={{ color: GOLD, fontSize: 10, letterSpacing: '0.2em' }}
        >
          RECENT ACTIVITY
        </span>

        {!loaded ? (
          <span className="text-zinc-600" style={{ fontSize: 11 }}>Loading...</span>
        ) : entries.length === 0 ? (
          <span className="text-zinc-600" style={{ fontSize: 11 }}>No activity yet</span>
        ) : (
          <div className="flex items-center gap-4 overflow-x-auto">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-1.5 flex-shrink-0"
                style={{ fontSize: 11 }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: DOT_COLORS[entry.type] || DOT_COLORS.success,
                    display: 'inline-block',
                    flexShrink: 0,
                  }}
                />
                <span className="text-zinc-500">{relativeTime(entry.created_at)}</span>
                <span className="text-zinc-400">&mdash;</span>
                <span className="text-zinc-300">{entry.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
