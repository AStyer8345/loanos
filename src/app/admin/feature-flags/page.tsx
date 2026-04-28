'use client'

import { useEffect, useState } from 'react'
import { ALL_FEATURE_KEYS, type OrgFeatures } from '@/lib/features/types'

type OrgFlagsRow = {
  id: string
  name: string
  features: Partial<OrgFeatures> | null
}

function isEnabled(features: Partial<OrgFeatures> | null, key: keyof OrgFeatures): boolean {
  if (!features) return true
  return features[key] !== false
}

export default function FeatureFlagsAdmin() {
  const [orgs, setOrgs] = useState<OrgFlagsRow[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/feature-flags')
      .then(r => r.json())
      .then((data: OrgFlagsRow[]) => {
        setOrgs(data)
        setLoading(false)
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Failed to load orgs')
        setLoading(false)
      })
  }, [])

  async function toggle(orgId: string, key: keyof OrgFeatures, nextValue: boolean) {
    const target = orgs.find(o => o.id === orgId)
    if (!target) return

    const nextFeatures: Partial<OrgFeatures> = { ...(target.features ?? {}) }
    if (nextValue) {
      delete nextFeatures[key]
    } else {
      nextFeatures[key] = false
    }
    const featuresPayload =
      Object.keys(nextFeatures).length === 0 ? null : nextFeatures

    setSavingId(orgId)
    setError(null)

    setOrgs(prev =>
      prev.map(o => (o.id === orgId ? { ...o, features: featuresPayload } : o))
    )

    try {
      const res = await fetch('/api/admin/feature-flags', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ organizationId: orgId, features: featuresPayload }),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error ?? `HTTP ${res.status}`)
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed')
      setOrgs(prev =>
        prev.map(o => (o.id === orgId ? { ...o, features: target.features } : o))
      )
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Feature Flags</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Per-org UI gates. Unchecked = hidden in that org&apos;s UI. Empty/all-checked row = default-on (no DB row written).
          API routes are RLS-protected regardless — this gates rendering only.
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading orgs...</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-input">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-input bg-card/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground sticky left-0 bg-card/50">
                  Organization
                </th>
                {ALL_FEATURE_KEYS.map(key => (
                  <th
                    key={key}
                    className="px-3 py-3 text-center font-medium text-muted-foreground whitespace-nowrap"
                  >
                    {key.replace(/_/g, ' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orgs.map(org => (
                <tr key={org.id} className="border-b border-input/50 hover:bg-card/30">
                  <td className="px-4 py-3 sticky left-0 bg-background">
                    <div className="font-medium text-foreground">{org.name}</div>
                    <div className="font-mono text-[10px] text-muted-foreground">
                      {org.id}
                      {savingId === org.id && <span className="ml-2 text-amber-400">saving…</span>}
                    </div>
                  </td>
                  {ALL_FEATURE_KEYS.map(key => {
                    const enabled = isEnabled(org.features, key)
                    return (
                      <td key={key} className="px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={enabled}
                          disabled={savingId === org.id}
                          onChange={e => toggle(org.id, key, e.target.checked)}
                          className="size-4 cursor-pointer accent-amber-500"
                          aria-label={`${key} for ${org.name}`}
                        />
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
