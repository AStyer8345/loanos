'use client'

import { useState, useEffect, useCallback } from 'react'
import type { DripSendWithDetails } from '@/lib/drip/types'

interface SendHistoryTableProps {
  campaignId: string
}

const STATUS_COLORS: Record<string, string> = {
  sent: 'text-loangreen',
  queued: 'text-[#e67e22]',
  approved: 'text-gold',
  skipped: 'text-loanmuted',
  cancelled: 'text-loanred',
}

export default function SendHistoryTable({ campaignId }: SendHistoryTableProps) {
  const [sends, setSends] = useState<DripSendWithDetails[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const limit = 50

  const fetchSends = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/drip/campaigns/${campaignId}/enrollments?history=true&page=${page}&limit=${limit}`)
      const data = await res.json() as { data: DripSendWithDetails[]; total: number }
      setSends(data.data ?? [])
      setTotal(data.total ?? 0)
    } catch (err) {
      console.error('Failed to load send history:', err)
    } finally {
      setLoading(false)
    }
  }, [campaignId, page])

  useEffect(() => { void fetchSends() }, [fetchSends])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="border border-loanborder rounded-lg overflow-hidden">
      <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr] px-5 py-3 bg-surface2 font-mono text-[11px] font-semibold uppercase tracking-wider">
        <span>Contact</span>
        <span>Step</span>
        <span>Channel</span>
        <span>Status</span>
        <span>Date</span>
      </div>

      {loading && (
        <div className="px-5 py-8 text-center font-mono text-xs text-loanmuted animate-pulse">Loading...</div>
      )}

      {!loading && sends.length === 0 && (
        <div className="px-5 py-8 text-center font-mono text-xs text-loanmuted">No sends yet.</div>
      )}

      {!loading && sends.map(s => (
        <div key={s.id} className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr] px-5 py-3.5 border-t border-loanborder font-mono text-xs items-center hover:bg-[rgba(164,133,30,0.04)]">
          <span className="font-medium">{s.contact_name}</span>
          <span className="text-loanmuted">{s.step_name}</span>
          <span className="text-loanmuted">{s.channel.replace('_', ' ')}</span>
          <span className={STATUS_COLORS[s.status] ?? 'text-loanmuted'}>{s.status}</span>
          <span className="text-loanmuted">{s.sent_at ? new Date(s.sent_at).toLocaleDateString() : s.created_at ? new Date(s.created_at).toLocaleDateString() : '—'}</span>
        </div>
      ))}

      {total > limit && (
        <div className="px-5 py-3 border-t border-loanborder flex items-center justify-between font-mono text-[11px] text-loanmuted">
          <span>Showing {sends.length} of {total}</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-2 py-1 border border-loanborder rounded hover:bg-surface2 disabled:opacity-30">Prev</button>
            <span>Page {page} of {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-2 py-1 border border-loanborder rounded hover:bg-surface2 disabled:opacity-30">Next</button>
          </div>
        </div>
      )}
    </div>
  )
}
