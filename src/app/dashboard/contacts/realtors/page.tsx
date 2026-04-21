'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowUpDown, ArrowUp, ArrowDown, Handshake } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useOrg } from '@/hooks/useOrg'
import { fmtDateOnly } from '@/lib/formatters'
import { Card } from '@/components/ui/card'

type Realtor = {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  referral_ytd_count: number | null
  deals_ytd_count: number | null
  last_referral_date: string | null
  production_tier: string | null
  realtor_stage: string | null
}

type SortKey = 'name' | 'referral_ytd_count' | 'deals_ytd_count' | 'last_referral_date' | 'production_tier'
type SortDir = 'asc' | 'desc'

function TierBadge({ tier }: { tier: string | null }) {
  if (!tier) return <span className="text-muted-foreground text-xs">—</span>
  const upper = tier.toUpperCase()
  const cls =
    upper === 'A' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' :
    upper === 'B' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border-amber-200 dark:border-amber-800' :
                   'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold tabular-nums ${cls}`}>
      {upper}
    </span>
  )
}

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ArrowUpDown className="size-3 text-muted-foreground/50 ml-1" />
  return sortDir === 'asc'
    ? <ArrowUp className="size-3 text-primary ml-1" />
    : <ArrowDown className="size-3 text-primary ml-1" />
}

function sortValue(r: Realtor, key: SortKey): string | number {
  switch (key) {
    case 'name':
      return `${r.first_name ?? ''} ${r.last_name ?? ''}`.trim().toLowerCase()
    case 'referral_ytd_count':
      return r.referral_ytd_count ?? -1
    case 'deals_ytd_count':
      return r.deals_ytd_count ?? -1
    case 'last_referral_date':
      return r.last_referral_date ?? ''
    case 'production_tier':
      return r.production_tier?.toUpperCase() ?? 'Z'
  }
}

export default function RealtorRosterPage() {
  const { organizationId } = useOrg()
  const [realtors, setRealtors] = useState<Realtor[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [sortKey, setSortKey]   = useState<SortKey>('referral_ytd_count')
  const [sortDir, setSortDir]   = useState<SortDir>('desc')

  useEffect(() => {
    if (!organizationId) return
    const supabase = createClient()
    supabase
      .from('contacts')
      .select('id, first_name, last_name, email, phone, referral_ytd_count, deals_ytd_count, last_referral_date, production_tier, realtor_stage')
      .eq('organization_id', organizationId)
      .or('referral_ytd_count.gt.0,deals_ytd_count.gt.0')
      .then(({ data, error: err }) => {
        if (err) {
          setError(err.message)
        } else {
          setRealtors((data ?? []) as Realtor[])
        }
        setLoading(false)
      })
  }, [organizationId])

  const sorted = useMemo(() => {
    return [...realtors].sort((a, b) => {
      const av = sortValue(a, sortKey)
      const bv = sortValue(b, sortKey)
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [realtors, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir(key === 'name' || key === 'production_tier' ? 'asc' : 'desc')
    }
  }

  const th = (label: string, key: SortKey) => (
    <th
      className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground cursor-pointer select-none whitespace-nowrap"
      onClick={() => toggleSort(key)}
    >
      <span className="inline-flex items-center">
        {label}
        <SortIcon col={key} sortKey={sortKey} sortDir={sortDir} />
      </span>
    </th>
  )

  return (
    <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/contacts"
          className="flex items-center justify-center size-8 rounded-md border border-input bg-background hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          title="Back to Contacts"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div className="flex items-center gap-2">
          <Handshake className="size-5 text-muted-foreground" />
          <h1 className="text-lg font-semibold tracking-tight">Realtor Roster</h1>
        </div>
        {!loading && (
          <span className="ml-auto text-sm text-muted-foreground tabular-nums">
            {sorted.length} {sorted.length === 1 ? 'partner' : 'partners'}
          </span>
        )}
      </div>

      {/* Error */}
      {error && (
        <Card className="p-4 border-destructive/40 bg-destructive/5">
          <p className="text-sm text-destructive">{error}</p>
        </Card>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 rounded-md bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && sorted.length === 0 && (
        <Card className="p-10 text-center">
          <Handshake className="size-8 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No referral contacts yet.</p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Add a contact with referral_type = realtor_referral to get started.
          </p>
        </Card>
      )}

      {/* Table */}
      {!loading && !error && sorted.length > 0 && (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-input bg-muted/30">
                <tr>
                  {th('Name', 'name')}
                  {th('Referrals YTD', 'referral_ytd_count')}
                  {th('Deals Closed YTD', 'deals_ytd_count')}
                  {th('Last Referral', 'last_referral_date')}
                  {th('Tier', 'production_tier')}
                </tr>
              </thead>
              <tbody className="divide-y divide-input">
                {sorted.map((r) => {
                  const fullName = [r.first_name, r.last_name].filter(Boolean).join(' ') || 'Unknown'
                  const encodedName = encodeURIComponent(fullName)
                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium">
                        <Link
                          href={`/dashboard/referral/${encodedName}`}
                          className="hover:text-primary hover:underline underline-offset-2 transition-colors"
                        >
                          {fullName}
                        </Link>
                      </td>
                      <td className="px-4 py-3 tabular-nums text-muted-foreground">
                        {r.referral_ytd_count ?? 0}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-muted-foreground">
                        {r.deals_ytd_count ?? 0}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {fmtDateOnly(r.last_referral_date)}
                      </td>
                      <td className="px-4 py-3">
                        <TierBadge tier={r.production_tier} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
