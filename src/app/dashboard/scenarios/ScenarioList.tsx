'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Home, RefreshCw, Copy, Trash2, Eye, Search } from 'lucide-react'

interface ScenarioRow {
  id: string
  scenario_type: string
  borrower_name: string | null
  property_address: string | null
  created_at: string
  updated_at: string
  view_count: number
  share_token: string
}

export default function ScenarioList({ scenarios }: { scenarios: ScenarioRow[] }) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

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
                    {new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3 text-xs hidden sm:table-cell" style={{ color: 'var(--sc-muted)', fontFamily: "'IBM Plex Mono', monospace" }}>
                    {s.view_count}
                  </td>
                  <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => router.push(`/dashboard/scenarios/${s.id}`)}
                        className="p-1.5 rounded hover:bg-white/5 transition-colors"
                        title="View/Edit"
                        style={{ color: 'var(--sc-muted)' }}
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => handleDuplicate(s.id)}
                        className="p-1.5 rounded hover:bg-white/5 transition-colors"
                        title="Duplicate"
                        style={{ color: 'var(--sc-muted)' }}
                      >
                        <Copy size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        disabled={deleting === s.id}
                        className="p-1.5 rounded hover:bg-white/5 transition-colors"
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
