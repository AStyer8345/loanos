'use client'

import { useState, useEffect, useCallback } from 'react'
import type { DripEnrollmentWithContact } from '@/lib/drip/types'

interface EnrollmentTableProps {
  campaignId: string
}

export default function EnrollmentTable({ campaignId }: EnrollmentTableProps) {
  const [enrollments, setEnrollments] = useState<DripEnrollmentWithContact[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const limit = 50

  const fetchEnrollments = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (search) params.set('search', search)
      const res = await fetch(`/api/drip/campaigns/${campaignId}/enrollments?${params}`)
      const data = await res.json() as { data: DripEnrollmentWithContact[]; total: number }
      setEnrollments(data.data ?? [])
      setTotal(data.total ?? 0)
    } catch (err) {
      console.error('Failed to load enrollments:', err)
    } finally {
      setLoading(false)
    }
  }, [campaignId, page, search])

  useEffect(() => { void fetchEnrollments() }, [fetchEnrollments])

  async function handleAction(enrollmentId: string, action: 'pause' | 'resume' | 'remove') {
    const statusMap = { pause: 'paused', resume: 'active', remove: 'removed' } as const
    await fetch(`/api/drip/campaigns/${campaignId}/enrollments/${enrollmentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: statusMap[action], removed_reason: action === 'remove' ? 'manual' : undefined }),
    })
    void fetchEnrollments()
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div>
      {/* Search */}
      <div className="flex gap-3 mb-4">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          placeholder="Search contacts..."
          className="flex-1 bg-surface2 border border-loanborder rounded-lg px-3 py-2 font-mono text-xs"
        />
      </div>

      {/* Table */}
      <div className="border border-loanborder rounded-lg overflow-hidden">
        <div className="grid grid-cols-[2fr_1.8fr_1fr_1fr_1.5fr_0.4fr] px-5 py-3 bg-surface2 font-mono text-[11px] font-semibold uppercase tracking-wider">
          <span>Contact</span>
          <span>Property</span>
          <span>Enrolled</span>
          <span>Next Send</span>
          <span>Next Step</span>
          <span></span>
        </div>

        {loading && (
          <div className="px-5 py-8 text-center font-mono text-xs text-loanmuted animate-pulse">
            Loading...
          </div>
        )}

        {!loading && enrollments.length === 0 && (
          <div className="px-5 py-8 text-center font-mono text-xs text-loanmuted">
            No contacts enrolled.
          </div>
        )}

        {!loading && enrollments.map(e => (
          <div
            key={e.id}
            className={`grid grid-cols-[2fr_1.8fr_1fr_1fr_1.5fr_0.4fr] px-5 py-3.5 border-t border-loanborder font-mono text-xs items-center hover:bg-[rgba(164,133,30,0.04)] ${
              e.status !== 'active' ? 'opacity-50' : ''
            }`}
          >
            <span className="font-medium">{e.contact_name}</span>
            <span className="text-loanmuted">{e.property_address ?? '—'}</span>
            <span className="text-loanmuted">{new Date(e.enrolled_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
            <span className={e.status === 'active' ? 'text-loangreen' : 'text-loanmuted'}>
              {e.next_send_at ? new Date(e.next_send_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
            </span>
            <span className="text-loanmuted">{e.status !== 'active' ? `${e.status}` : e.next_step_name ?? '—'}</span>
            <div className="relative group">
              <button className="text-loanmuted hover:text-foreground">&#8943;</button>
              <div className="hidden group-hover:block absolute right-0 top-full bg-surface border border-loanborder rounded-lg shadow-lg py-1 z-10 w-36">
                {e.status === 'active' && (
                  <button onClick={() => handleAction(e.id, 'pause')} className="block w-full text-left px-3 py-1.5 text-xs hover:bg-surface2">Pause</button>
                )}
                {e.status === 'paused' && (
                  <button onClick={() => handleAction(e.id, 'resume')} className="block w-full text-left px-3 py-1.5 text-xs hover:bg-surface2">Resume</button>
                )}
                <button onClick={() => handleAction(e.id, 'remove')} className="block w-full text-left px-3 py-1.5 text-xs text-loanred hover:bg-surface2">Remove</button>
              </div>
            </div>
          </div>
        ))}

        {/* Pagination */}
        {total > limit && (
          <div className="px-5 py-3 border-t border-loanborder flex items-center justify-between font-mono text-[11px] text-loanmuted">
            <span>Showing {enrollments.length} of {total}</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-2 py-1 border border-loanborder rounded hover:bg-surface2 disabled:opacity-30">Prev</button>
              <span>Page {page} of {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-2 py-1 border border-loanborder rounded hover:bg-surface2 disabled:opacity-30">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
