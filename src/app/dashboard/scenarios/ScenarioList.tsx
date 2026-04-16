'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Home, RefreshCw, Copy, Trash2, Eye, Search, MessageSquare } from 'lucide-react'

interface ScenarioRow {
  id: string
  scenario_type: string
  borrower_name: string | null
  property_address: string | null
  created_at: string | null
  updated_at: string | null
  view_count: number | null
  share_token: string | null
}

export default function ScenarioList({ scenarios, qaNeededCount }: { scenarios: ScenarioRow[]; qaNeededCount: number }) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [backfilling, setBackfilling] = useState(false)
  const [backfillResult, setBackfillResult] = useState<{ processed: number; errors: number } | null>(null)
  const [qaNeeded, setQaNeeded] = useState(qaNeededCount)

  const handleBackfillQA = async () => {
    setBackfilling(true)
    setBackfillResult(null)
    try {
      const res = await fetch('/api/scenarios/backfill-qa', { method: 'POST' })
      const data = await res.json() as { processed: number; errors: number }
      setBackfillResult(data)
      setQaNeeded(data.errors > 0 ? data.errors : 0)
    } catch {
      setBackfillResult({ processed: 0, errors: -1 })
    } finally {
      setBackfilling(false)
    }
  }

  const filtered = scenarios.filter(s => {
    if (!search) return true
    const q = search.toLowerCase()
    return (s.borrower_name?.toLowerCase().includes(q)) || (s.property_address?.toLowerCase().includes(q))
  })

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this scenario?')) return
    setDeleting(id)
    try {
      await fetch('/api/scenarios/save', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      router.refresh()
    } catch (e) {
      console.error('Delete failed:', e)
    } finally {
      setDeleting(null)
    }
  }

  const handleDuplicate = async (id: string) => {
    const scenario = scenarios.find(s => s.id === id)
    if (!scenario) return
    // Navigate to new scenario page — duplication handled via query param
    router.push(`/dashboard/scenarios/new?duplicate=${id}`)
  }

  return (
    <div>
      {/* Q&A Backfill Banner — only visible when scenarios are missing Q&A */}
      {(qaNeeded > 0 || backfillResult) && (
        <div
          className="flex items-center justify-between gap-4 px-4 py-3 rounded-lg mb-4"
          style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.25)' }}
        >
          <div className="flex items-center gap-2">
            <MessageSquare size={14} style={{ color: '#C9A84C' }} />
            {backfillResult ? (
              <span className="text-xs" style={{ color: backfillResult.errors === -1 ? '#f87171' : '#C9A84C', fontFamily: "'IBM Plex Mono', monospace" }}>
                {backfillResult.errors === -1
                  ? 'Backfill failed — try again'
                  : `Q&A generated for ${backfillResult.processed} scenario${backfillResult.processed !== 1 ? 's' : ''}${backfillResult.errors > 0 ? ` (${backfillResult.errors} failed)` : ' ✓'}`}
              </span>
            ) : (
              <span className="text-xs" style={{ color: '#C9A84C', fontFamily: "'IBM Plex Mono', monospace" }}>
                {qaNeeded} scenario{qaNeeded !== 1 ? 's' : ''} missing Q&A for the share page
              </span>
            )}
          </div>
          {!backfillResult && (
            <button
              onClick={handleBackfillQA}
              disabled={backfilling}
              className="px-3 py-1.5 rounded-md text-xs font-semibold transition-all disabled:opacity-50"
              style={{ background: '#C9A84C', color: '#0a0a0a' }}
            >
              {backfilling ? 'Generating...' : `Generate Q&A (${qaNeeded})`}
            </button>
          )}
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--sc-muted)' }} />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by borrower name..."
          className="w-full pl-9 pr-3 py-2 rounded-md text-sm border outline-none"
          style={{ borderColor: 'var(--sc-border)', color: 'var(--sc-text)', background: 'var(--sc-card)' }}
        />
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--sc-muted)' }}>
          <p className="text-sm">No scenarios found.</p>
        </div>
      ) : (
        <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--sc-border)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--sc-card)' }}>
                <th className="text-left px-4 py-2 font-medium text-xs" style={{ color: 'var(--sc-muted)' }}>Type</th>
                <th className="text-left px-4 py-2 font-medium text-xs" style={{ color: 'var(--sc-muted)' }}>Borrower</th>
                <th className="text-left px-4 py-2 font-medium text-xs hidden md:table-cell" style={{ color: 'var(--sc-muted)' }}>Property</th>
                <th className="text-left px-4 py-2 font-medium text-xs hidden sm:table-cell" style={{ color: 'var(--sc-muted)' }}>Date</th>
                <th className="text-left px-4 py-2 font-medium text-xs hidden sm:table-cell" style={{ color: 'var(--sc-muted)' }}>Views</th>
                <th className="text-right px-4 py-2 font-medium text-xs" style={{ color: 'var(--sc-muted)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => (
                <tr
                  key={s.id}
                  className="cursor-pointer transition-colors"
                  style={{ background: i % 2 === 0 ? 'var(--sc-card)' : 'var(--sc-card-alt)' }}
                  onClick={() => router.push(`/dashboard/scenarios/${s.id}`)}
                >
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded"
                      style={{
                        background: s.scenario_type === 'purchase' ? 'var(--sc-gold-dim)' : 'var(--sc-blue-dim)',
                        color: s.scenario_type === 'purchase' ? 'var(--sc-gold)' : 'var(--sc-blue)',
                      }}>
                      {s.scenario_type === 'purchase' ? <Home size={11} /> : <RefreshCw size={11} />}
                      {s.scenario_type === 'purchase' ? 'Purchase' : 'Refinance'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: 'var(--sc-text)' }}>
                    {s.borrower_name || '—'}
                  </td>
                  <td className="px-4 py-3 text-xs hidden md:table-cell" style={{ color: 'var(--sc-muted)' }}>
                    {s.property_address || '—'}
                  </td>
                  <td className="px-4 py-3 text-xs hidden sm:table-cell" style={{ color: 'var(--sc-muted)', fontFamily: "'IBM Plex Mono', monospace" }}>
                    {s.created_at ? new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs hidden sm:table-cell" style={{ color: 'var(--sc-muted)', fontFamily: "'IBM Plex Mono', monospace" }}>
                    {s.view_count}
                  </td>
                  <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => router.push(`/dashboard/scenarios/${s.id}`)}
                        className="p-1.5 rounded hover:bg-muted/60 transition-colors"
                        title="View/Edit"
                        style={{ color: 'var(--sc-muted)' }}
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => handleDuplicate(s.id)}
                        className="p-1.5 rounded hover:bg-muted/60 transition-colors"
                        title="Duplicate"
                        style={{ color: 'var(--sc-muted)' }}
                      >
                        <Copy size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        disabled={deleting === s.id}
                        className="p-1.5 rounded hover:bg-muted/60 transition-colors"
                        title="Delete"
                        style={{ color: 'var(--sc-red)' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
