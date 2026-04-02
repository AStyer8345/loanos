'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface TenantDetail {
  id: string
  name: string
  slug: string | null
  plan: string
  nmls: string | null
  logo_url: string | null
  brand_color: string | null
  created_at: string
  members: { id: string; full_name: string | null; email: string | null; role: string; created_at: string }[]
  recent_activity: { id: string; action: string; entity_type: string | null; summary: string | null; created_at: string }[]
  loan_count: number
  contact_count: number
}

export default function TenantDetailPage() {
  const params = useParams()
  const [tenant, setTenant] = useState<TenantDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [overriding, setOverriding] = useState(false)

  const tenantId = params.id as string

  useEffect(() => {
    fetch(`/api/admin/tenants/${tenantId}`)
      .then(res => {
        if (!res.ok) throw new Error('Not found')
        return res.json()
      })
      .then(data => {
        setTenant(data)
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [tenantId])

  async function handlePlanOverride(newPlan: string) {
    if (!confirm(`Change plan to ${newPlan}? This bypasses Stripe.`)) return
    setOverriding(true)
    const res = await fetch(`/api/admin/tenants/${tenantId}/override-plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: newPlan }),
    })
    if (res.ok) {
      setTenant(prev => prev ? { ...prev, plan: newPlan } : prev)
    }
    setOverriding(false)
  }

  if (loading) {
    return <div className="text-sm text-zinc-500">Loading tenant...</div>
  }

  if (!tenant) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-500">Tenant not found</p>
        <Link href="/admin" className="text-amber-400 text-sm hover:underline mt-2 inline-block">
          ← Back to Admin
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
            ← Back to Admin
          </Link>
          <h1 className="text-2xl font-semibold text-zinc-100 mt-1">{tenant.name}</h1>
          {tenant.slug && <p className="text-sm text-zinc-500 font-mono">{tenant.slug}</p>}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 gap-6">
        {/* Organization Info */}
        <div className="rounded-lg border border-input bg-card/50 p-5 space-y-3">
          <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Organization</h2>
          <div className="space-y-2">
            <InfoRow label="Name" value={tenant.name} />
            <InfoRow label="Slug" value={tenant.slug || '—'} mono />
            <InfoRow label="NMLS" value={tenant.nmls || '—'} mono />
            <InfoRow label="Created" value={new Date(tenant.created_at).toLocaleDateString()} />
            <InfoRow label="Loans" value={String(tenant.loan_count)} mono />
            <InfoRow label="Contacts" value={String(tenant.contact_count)} mono />
            {tenant.brand_color && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500">Brand Color</span>
                <div className="w-4 h-4 rounded border border-zinc-700" style={{ backgroundColor: tenant.brand_color }} />
                <span className="text-xs text-zinc-400 font-mono">{tenant.brand_color}</span>
              </div>
            )}
          </div>
        </div>

        {/* Billing Info */}
        <div className="rounded-lg border border-input bg-card/50 p-5 space-y-3">
          <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Billing</h2>
          <div className="space-y-2">
            <InfoRow label="Plan" value={tenant.plan === 'professional' ? 'Professional' : 'Starter'} />
            <InfoRow label="MRR" value={tenant.plan === 'professional' ? '$99' : '$0'} mono />
          </div>
          <div className="pt-3 border-t border-input">
            <p className="text-xs text-zinc-600 mb-2">Manual Plan Override</p>
            <div className="flex gap-2">
              <button
                onClick={() => handlePlanOverride('starter')}
                disabled={overriding || tenant.plan === 'starter'}
                className="rounded px-3 py-1.5 text-xs font-medium border border-zinc-700 text-zinc-300 hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Set Starter
              </button>
              <button
                onClick={() => handlePlanOverride('professional')}
                disabled={overriding || tenant.plan === 'professional'}
                className="rounded px-3 py-1.5 text-xs font-medium border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Set Professional
              </button>
            </div>
            <p className="text-xs text-zinc-700 mt-2">Bypasses Stripe — use for trials/support only</p>
          </div>
        </div>
      </div>

      {/* Members */}
      <div className="rounded-lg border border-input bg-card/50 p-5 space-y-3">
        <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
          Members ({tenant.members.length})
        </h2>
        <div className="space-y-2">
          {tenant.members.map(m => (
            <div key={m.id} className="flex items-center justify-between py-1.5">
              <div>
                <span className="text-sm text-zinc-200">{m.full_name || 'Unnamed'}</span>
                <span className="ml-2 text-xs text-zinc-500">{m.email}</span>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                m.role === 'owner'
                  ? 'bg-amber-500/10 text-amber-400'
                  : m.role === 'admin'
                  ? 'bg-blue-500/10 text-blue-400'
                  : 'bg-zinc-800 text-zinc-400'
              }`}>
                {m.role}
              </span>
            </div>
          ))}
          {tenant.members.length === 0 && (
            <p className="text-xs text-zinc-600">No members</p>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-lg border border-input bg-card/50 p-5 space-y-3">
        <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
          Recent Activity (last 20)
        </h2>
        <div className="space-y-1">
          {tenant.recent_activity.map(a => (
            <div key={a.id} className="flex items-center justify-between py-1.5 border-b border-input/30 last:border-0">
              <div className="flex items-center gap-3">
                <span className="text-xs text-zinc-600 font-mono w-32 shrink-0">
                  {new Date(a.created_at).toLocaleString()}
                </span>
                <span className="text-xs text-zinc-500">{a.action}</span>
                {a.summary && <span className="text-xs text-zinc-400">— {a.summary}</span>}
              </div>
              {a.entity_type && (
                <span className="text-xs text-zinc-700 font-mono">{a.entity_type}</span>
              )}
            </div>
          ))}
          {tenant.recent_activity.length === 0 && (
            <p className="text-xs text-zinc-600">No activity recorded</p>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-zinc-500">{label}</span>
      <span className={`text-sm text-zinc-200 ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  )
}
