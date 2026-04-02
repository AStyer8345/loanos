'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Tenant {
  id: string
  name: string
  slug: string | null
  plan: string
  nmls: string | null
  created_at: string
  member_count: number
  last_active: string | null
}

export default function AdminDashboard() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/admin/tenants')
      .then(res => res.json())
      .then(data => {
        setTenants(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filtered = tenants.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.slug?.toLowerCase().includes(search.toLowerCase())
  )

  const proCount = tenants.filter(t => t.plan === 'professional').length
  const mrr = proCount * 99

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Tenant Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage all LoanOS tenants</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total Tenants" value={tenants.length} />
        <StatCard label="Professional" value={proCount} />
        <StatCard label="MRR" value={`$${mrr}`} />
        <StatCard label="Starter" value={tenants.length - proCount} />
      </div>

      {/* Search + Table */}
      <div className="space-y-4">
        <input
          type="text"
          placeholder="Search tenants..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full max-w-sm rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
        />

        {loading ? (
          <div className="text-sm text-muted-foreground">Loading tenants...</div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-input">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-input bg-card/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Plan</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Members</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">NMLS</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Last Active</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Created</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => (
                  <tr key={t.id} className="border-b border-input/50 hover:bg-card/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/admin/tenants/${t.id}`} className="text-foreground hover:text-amber-400 transition-colors font-medium">
                        {t.name}
                      </Link>
                      {t.slug && <span className="ml-2 text-xs text-muted-foreground">{t.slug}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <PlanBadge plan={t.plan} />
                    </td>
                    <td className="px-4 py-3 text-foreground/80 font-mono">{t.member_count}</td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{t.nmls || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {t.last_active ? formatRelative(t.last_active) : '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      {search ? 'No tenants match your search' : 'No tenants found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-input bg-card/50 p-4">
      <div className="text-2xl font-semibold text-foreground font-mono">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  )
}

function PlanBadge({ plan }: { plan: string }) {
  const isPro = plan === 'professional'
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
      isPro
        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
        : 'bg-muted text-muted-foreground border border-input'
    }`}>
      {isPro ? 'Pro' : 'Starter'}
    </span>
  )
}

function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}
