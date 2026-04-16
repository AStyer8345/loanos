'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useOrg } from '@/hooks/useOrg'
import { classifyLeadSource, categoryFromSlug, type ContactSourceFields, type LeadSourceCategory } from '@/lib/leadSources'
import { Card } from '@/components/ui/card'
import { ArrowLeft, AlertCircle } from 'lucide-react'

/**
 * Drill-down view for the Dashboard NewLeadsChart.
 * URL: /dashboard/contacts/by-source/[category]?days=30
 *
 * Why client-side classification: the classifier checks referrer hostname
 * substrings and utm_source combinations — expressible as JS but not as a
 * clean SQL filter. For the 30-day window on a single LO, result sets are
 * small (typically <100 rows), so fetching + filtering in the browser is
 * cheaper than adding a denormalized category column with backfill + insert
 * triggers. If volume grows (multi-tenant + multi-month), promote to a DB
 * column at that point.
 */

type ContactRow = ContactSourceFields & {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  stage: string | null
  created_at: string | null
  last_activity_date: string | null
}

export default function ContactsBySourcePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const { organizationId } = useOrg()

  const slug = (params.category as string) ?? ''
  const category: LeadSourceCategory | null = categoryFromSlug(slug)
  const windowDays = Number(searchParams.get('days') ?? '30') || 30

  const [rows, setRows]       = useState<ContactRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    if (!organizationId || !category) {
      setLoading(false)
      return
    }
    const supabase = createClient()
    const cutoff = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString()

    setLoading(true)
    supabase
      .from('contacts')
      .select('id, first_name, last_name, email, phone, stage, created_at, last_activity_date, lead_source, referrer, source_page, utm_params')
      .eq('organization_id', organizationId)
      .eq('contact_type', 'borrower')
      .gte('created_at', cutoff)
      .order('created_at', { ascending: false })
      .then(({ data, error: err }) => {
        if (err) {
          setError(err.message)
          setLoading(false)
          return
        }
        setRows((data ?? []) as unknown as ContactRow[])
        setLoading(false)
      })
  }, [organizationId, category, windowDays])

  const matching = useMemo(() => {
    if (!category) return []
    return rows.filter(r => classifyLeadSource(r) === category)
  }, [rows, category])

  if (!category) {
    return (
      <div className="p-8 text-center font-mono text-xs text-muted-foreground">
        <AlertCircle className="mx-auto size-6 mb-3" />
        Unknown source &ldquo;{slug}&rdquo;.
        <div className="mt-4">
          <Link href="/dashboard" className="text-[#C9A84C] hover:underline">← Back to Dashboard</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <Link href="/dashboard" className="inline-flex items-center gap-1 text-[11px] font-mono text-muted-foreground hover:text-foreground mb-2">
            <ArrowLeft className="size-3" /> Back to Dashboard
          </Link>
          <h1 className="text-xl font-mono font-bold text-foreground">New Leads · {category}</h1>
          <p className="text-xs font-mono text-muted-foreground mt-0.5">
            Contacts created in the last {windowDays} days, classified as {category}
          </p>
        </div>
      </div>

      {/* Results */}
      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center font-mono text-xs text-muted-foreground">Loading…</div>
        ) : error ? (
          <div className="p-8 text-center font-mono text-xs text-red-500">Error: {error}</div>
        ) : matching.length === 0 ? (
          <div className="p-8 text-center font-mono text-xs text-muted-foreground">
            No {category} leads in the last {windowDays} days.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead className="bg-muted/40 border-b border-border">
                <tr>
                  <th className="text-left px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground">Name</th>
                  <th className="text-left px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground">Email</th>
                  <th className="text-left px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground">Phone</th>
                  <th className="text-left px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground">Stage</th>
                  <th className="text-left px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground">Referrer</th>
                  <th className="text-right px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground">Created</th>
                </tr>
              </thead>
              <tbody>
                {matching.map(c => {
                  const name = [c.first_name, c.last_name].filter(Boolean).join(' ') || '—'
                  const created = c.created_at ? new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'
                  return (
                    <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                      <td className="px-3 py-2">
                        <Link href={`/dashboard/contacts/${c.id}`} className="text-foreground hover:text-[#C9A84C] transition-colors">
                          {name}
                        </Link>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground truncate max-w-[200px]">{c.email ?? '—'}</td>
                      <td className="px-3 py-2 text-muted-foreground">{c.phone ?? '—'}</td>
                      <td className="px-3 py-2 text-muted-foreground">{c.stage ?? '—'}</td>
                      <td className="px-3 py-2 text-muted-foreground truncate max-w-[200px]">{c.referrer ?? c.source_page ?? '—'}</td>
                      <td className="px-3 py-2 text-right text-muted-foreground">{created}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Count */}
      {!loading && !error && (
        <div className="text-[11px] font-mono text-muted-foreground text-right">
          {matching.length} {matching.length === 1 ? 'lead' : 'leads'}
        </div>
      )}
    </div>
  )
}
