'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { DripSendWithDetails } from '@/lib/drip/types'
import ApprovalCard from '@/components/drip/ApprovalCard'

export default function ApprovalQueuePage() {
  const router = useRouter()
  const [queue, setQueue] = useState<DripSendWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  const fetchQueue = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/drip/approval-queue')
      const data = await res.json() as { queue: DripSendWithDetails[] }
      setQueue(data.queue ?? [])
    } catch (err) {
      console.error('Failed to load approval queue:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void fetchQueue() }, [fetchQueue])

  async function handleAction(sendId: string, action: 'approve' | 'skip' | 'cancel', edits?: { subject?: string; body?: string }) {
    await fetch(`/api/drip/approval-queue/${sendId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        edited_subject: edits?.subject,
        edited_body: edits?.body,
      }),
    })
    setQueue(prev => prev.filter(s => s.id !== sendId))
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <button onClick={() => router.push('/dashboard/drip-campaigns')} className="font-mono text-[11px] text-gold hover:text-gold/80 mb-2 block">
            &larr; All Campaigns
          </button>
          <h1 className="font-display text-[24px] tracking-wide">APPROVAL QUEUE</h1>
          <p className="font-mono text-[11px] text-loanmuted mt-1">
            {queue.length} email{queue.length !== 1 ? 's' : ''} awaiting your review
          </p>
        </div>
      </div>

      {loading && (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="bg-surface border border-loanborder rounded-lg px-5 py-8 animate-pulse">
              <div className="h-4 w-48 bg-surface2 rounded" />
            </div>
          ))}
        </div>
      )}

      {!loading && queue.length === 0 && (
        <div className="bg-surface border border-loanborder rounded-lg px-5 py-12 text-center font-mono text-xs text-loanmuted">
          All clear — no emails waiting for approval.
        </div>
      )}

      {!loading && queue.length > 0 && (
        <div className="space-y-4">
          {queue.map(send => (
            <ApprovalCard key={send.id} send={send} onAction={handleAction} />
          ))}
        </div>
      )}
    </div>
  )
}
