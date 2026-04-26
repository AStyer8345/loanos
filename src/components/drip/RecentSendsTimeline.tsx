'use client'

import { useState, useEffect } from 'react'
import type { DripSendWithDetails } from '@/lib/drip/types'

const STATUS_COLORS: Record<string, string> = {
  sent: 'text-loangreen',
  queued: 'text-[#e67e22]',
  approved: 'text-gold',
  skipped: 'text-loanmuted',
  cancelled: 'text-loanred',
}

function formatWhen(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  const now = Date.now()
  const diffMs = now - d.getTime()
  const diffHr = diffMs / 36e5
  if (diffHr < 1) return `${Math.max(1, Math.round(diffMs / 6e4))}m ago`
  if (diffHr < 24) return `${Math.round(diffHr)}h ago`
  if (diffHr < 24 * 7) return `${Math.round(diffHr / 24)}d ago`
  return d.toLocaleDateString()
}

export default function RecentSendsTimeline() {
  const [sends, setSends] = useState<DripSendWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch('/api/drip/sends/recent?limit=15')
        const data = await res.json() as { sends: DripSendWithDetails[] }
        if (!cancelled) setSends(data.sends ?? [])
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load recent sends')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="mt-8">
      <h2 className="font-display text-[18px] tracking-wide mb-3">RECENT ACTIVITY</h2>
      <div className="border border-loanborder rounded-lg overflow-hidden">
        <div className="grid grid-cols-[2fr_1.5fr_1.5fr_1fr_0.8fr] px-5 py-3 bg-surface2 font-mono text-[11px] font-semibold uppercase tracking-wider">
          <span>Contact</span>
          <span>Campaign</span>
          <span>Step</span>
          <span>Status</span>
          <span>When</span>
        </div>

        {loading && (
          <div className="px-5 py-8 text-center font-mono text-xs text-loanmuted animate-pulse">Loading...</div>
        )}

        {!loading && error && (
          <div className="px-5 py-8 text-center font-mono text-xs text-loanred">{error}</div>
        )}

        {!loading && !error && sends.length === 0 && (
          <div className="px-5 py-8 text-center font-mono text-xs text-loanmuted">
            No drip sends yet. Activity appears here once enrollments fire.
          </div>
        )}

        {!loading && !error && sends.map(s => (
          <div
            key={s.id}
            className="grid grid-cols-[2fr_1.5fr_1.5fr_1fr_0.8fr] px-5 py-3 border-t border-loanborder font-mono text-xs items-center hover:bg-[rgba(164,133,30,0.04)]"
          >
            <span className="font-medium truncate" title={s.contact_email}>{s.contact_name || s.contact_email || '—'}</span>
            <span className="text-loanmuted truncate">{s.campaign_name || '—'}</span>
            <span className="text-loanmuted truncate">{s.step_name || '—'}</span>
            <span className={STATUS_COLORS[s.status] ?? 'text-loanmuted'}>{s.status}</span>
            <span className="text-loanmuted">{formatWhen(s.sent_at ?? s.created_at)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
