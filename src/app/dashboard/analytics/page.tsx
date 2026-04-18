/**
 * /dashboard/analytics — LoanOS analytics surface.
 *
 * Server-rendered single-page report. Pulls everything in parallel:
 *   - Pipeline stage aging (RPC, RLS-scoped)
 *   - Loans (for revenue, days-to-close, realtor performance)
 *   - Contacts (for source classification, past-client detection)
 *
 * Data flows:
 *   Funnel        ← loans grouped by canonical StageKey
 *   KPIs          ← active loans, pipeline volume, projected commission, avg days to close
 *   Source table  ← contacts × loans, classified via classifyLeadSource()
 *   AEO vs SEO    ← isolated columns from the source table
 *   Realtor table ← loans grouped by referring_agent_email|name
 *   Aging table   ← pipeline_stage_aging() RPC
 */

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getOrganization } from '@/lib/getOrganization'
import { fmtK, fmtCurrency } from '@/lib/formatters'
import {
  STAGE_GROUPS,
  STAGE_LABELS,
  normalizeToStageKey,
  type StageKey,
} from '@/lib/constants/loan-stages'
import {
  classifyLeadSource,
  type LeadSourceCategory,
  type ContactSourceFields,
} from '@/lib/leadSources'

import KpiCard from '@/components/dashboard/analytics/KpiCard'
import StageAgingTable, {
  type StageAgingRow,
} from '@/components/dashboard/analytics/StageAgingTable'
import SourceConversionTable, {
  type SourceConversionRow,
} from '@/components/dashboard/analytics/SourceConversionTable'
import RealtorPerformanceTable, {
  type RealtorPerformanceRow,
} from '@/components/dashboard/analytics/RealtorPerformanceTable'
import AeoVsSeoCard from '@/components/dashboard/analytics/AeoVsSeoCard'
import ConversionFunnel from '@/components/dashboard/charts/ConversionFunnel'

export const dynamic = 'force-dynamic'

// ── Types matching the slim selects below ────────────────────────────────────

interface LoanRow {
  id: string
  status: string | null
  loan_amount: number | null
  commission_amount: number | null
  closing_date: string | null
  funding_date: string | null
  application_date: string | null
  contact_id: string | null
  referring_agent_email: string | null
  referring_agent_name: string | null
}

interface ContactRow extends ContactSourceFields {
  id: string
  contact_type: string | null
}

// ── Funnel groupings (display order matches Adam's mental model) ─────────────

const FUNNEL_STAGES: { key: StageKey; label: string }[] = [
  { key: 'lead',            label: STAGE_LABELS.lead },
  { key: 'new_application', label: STAGE_LABELS.new_application },
  { key: 'pre_approval',    label: STAGE_LABELS.pre_approval },
  { key: 'processing',      label: 'In Process' },
  { key: 'underwriting',    label: STAGE_LABELS.underwriting },
  { key: 'clear_to_close',  label: STAGE_LABELS.clear_to_close },
  { key: 'funded',          label: STAGE_LABELS.funded },
]

// Map any StageKey to one of FUNNEL_STAGES' keys for grouping.
function toFunnelKey(raw: string | null | undefined): StageKey | null {
  const key = normalizeToStageKey(raw)
  if (STAGE_GROUPS.LEADS.includes(key)) return 'lead'
  if (STAGE_GROUPS.NEW_APPLICATION.includes(key)) return 'new_application'
  if (STAGE_GROUPS.PRE_APPROVAL.includes(key)) return 'pre_approval'
  if (key === 'submitted' || key === 'approved' || key === 'resubmit' || key === 'underwriting') {
    return 'underwriting'
  }
  if (key === 'setup' || key === 'disclosed' || key === 'processing') return 'processing'
  if (key === 'clear_to_close') return 'clear_to_close'
  if (key === 'funded') return 'funded'
  return null
}

const INACTIVE = new Set([
  'funded', 'Funded', 'Closed', 'closed', 'Closed/Funded', 'LOAN_FUNDED', 'Closed Client',
  'Cancelled', 'canceled', 'Dead', 'Denied', 'Withdrawn', 'Suspended', 'On Hold', 'on_hold',
])
const FUNDED = new Set([
  'funded', 'Funded', 'Closed', 'closed', 'Closed/Funded', 'LOAN_FUNDED', 'Closed Client',
])

function isFunded(status: string | null | undefined): boolean {
  if (!status) return false
  return FUNDED.has(status) || normalizeToStageKey(status) === 'funded'
}

function isActive(status: string | null | undefined): boolean {
  if (!status) return false
  return !INACTIVE.has(status)
}

function daysBetween(a: string | null, b: string | null): number | null {
  if (!a || !b) return null
  const da = new Date(a).getTime()
  const db = new Date(b).getTime()
  if (isNaN(da) || isNaN(db)) return null
  return Math.round((db - da) / 86_400_000)
}

export default async function AnalyticsPage() {
  let organizationId: string
  try {
    const ctx = await getOrganization()
    organizationId = ctx.organizationId
  } catch {
    redirect('/auth/login')
  }
  const supabase = createClient()

  // Parallel fetches — these are independent of each other.
  const [loansRes, contactsRes, agingRes] = await Promise.all([
    supabase
      .from('loans')
      .select(
        'id, status, loan_amount, commission_amount, closing_date, funding_date, application_date, contact_id, referring_agent_email, referring_agent_name',
      )
      .eq('organization_id', organizationId),
    supabase
      .from('contacts')
      .select(
        'id, contact_type, lead_source, referrer, source_page, utm_params, referred_by_contact_id',
      )
      .eq('organization_id', organizationId),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.rpc as any)('pipeline_stage_aging'),
  ])

  const loans: LoanRow[] = (loansRes.data ?? []) as LoanRow[]
  const contacts: ContactRow[] = (contactsRes.data ?? []) as unknown as ContactRow[]
  const aging: StageAgingRow[] = (agingRes.data ?? []) as StageAgingRow[]

  // ── Past-client referrer set ────────────────────────────────────────────────
  // A contact is a "past client" if any of their loans is funded. We pass the
  // resulting set of contact_ids to classifyLeadSource so anyone they refer is
  // auto-tagged as Past Client.
  const fundedBorrowerContactIds = new Set<string>()
  for (const l of loans) {
    if (l.contact_id && isFunded(l.status)) fundedBorrowerContactIds.add(l.contact_id)
  }

  // ── KPIs ────────────────────────────────────────────────────────────────────
  const activeLoans = loans.filter((l) => isActive(l.status))
  const fundedLoans = loans.filter((l) => isFunded(l.status))
  const pipelineVolume = activeLoans.reduce((s, l) => s + (l.loan_amount ?? 0), 0)
  const projectedCommission = activeLoans.reduce(
    (s, l) => s + (l.commission_amount ?? 0),
    0,
  )

  // YTD funded volume (this calendar year)
  const thisYear = new Date().getFullYear()
  const ytdFunded = fundedLoans.filter((l) => {
    const cd = l.closing_date || l.funding_date
    if (!cd) return false
    return new Date(cd).getFullYear() === thisYear
  })
  const ytdVolume = ytdFunded.reduce((s, l) => s + (l.loan_amount ?? 0), 0)
  const ytdCommission = ytdFunded.reduce((s, l) => s + (l.commission_amount ?? 0), 0)

  // Avg days to close — measured from application_date to closing/funding date
  const closeDays = fundedLoans
    .map((l) => daysBetween(l.application_date, l.closing_date || l.funding_date))
    .filter((n): n is number => n !== null && n >= 0)
  const avgDaysToClose = closeDays.length
    ? Math.round(closeDays.reduce((s, n) => s + n, 0) / closeDays.length)
    : null

  // ── Funnel ──────────────────────────────────────────────────────────────────
  const funnelCounts = new Map<StageKey, number>()
  for (const l of loans) {
    const k = toFunnelKey(l.status)
    if (!k) continue
    funnelCounts.set(k, (funnelCounts.get(k) ?? 0) + 1)
  }
  const funnelData = FUNNEL_STAGES.map((s) => ({
    stage: s.label,
    count: funnelCounts.get(s.key) ?? 0,
  }))

  // ── Source classification — leads + funded volume per category ──────────────
  // A contact's "funded volume" is the sum of their funded loans' amounts.
  const fundedByContact = new Map<string, { count: number; volume: number }>()
  for (const l of fundedLoans) {
    if (!l.contact_id) continue
    const cur = fundedByContact.get(l.contact_id) ?? { count: 0, volume: 0 }
    cur.count += 1
    cur.volume += l.loan_amount ?? 0
    fundedByContact.set(l.contact_id, cur)
  }

  const sourceMap = new Map<LeadSourceCategory, SourceConversionRow>()
  for (const c of contacts) {
    const cat = classifyLeadSource(c, fundedBorrowerContactIds)
    const cur = sourceMap.get(cat) ?? {
      source: cat,
      leads: 0,
      funded: 0,
      volume: 0,
    }
    cur.leads += 1
    const f = fundedByContact.get(c.id)
    if (f) {
      cur.funded += f.count
      cur.volume += f.volume
    }
    sourceMap.set(cat, cur)
  }
  const sourceRows: SourceConversionRow[] = [...sourceMap.values()]

  const aeoBucket = sourceMap.get('AEO') ?? { source: 'AEO' as const, leads: 0, funded: 0, volume: 0 }
  const seoBucket = sourceMap.get('SEO') ?? { source: 'SEO' as const, leads: 0, funded: 0, volume: 0 }

  // ── Realtor performance ────────────────────────────────────────────────────
  // Group by referring_agent_email when available (most reliable identifier),
  // else by name. Skip loans with no agent at all.
  const realtorMap = new Map<string, RealtorPerformanceRow>()
  for (const l of loans) {
    const key = (l.referring_agent_email || l.referring_agent_name || '').trim().toLowerCase()
    if (!key) continue
    const display = l.referring_agent_name || l.referring_agent_email || 'Unknown'
    const cur = realtorMap.get(key) ?? {
      realtor: display,
      loans: 0,
      funded: 0,
      volume: 0,
    }
    cur.loans += 1
    if (isFunded(l.status)) {
      cur.funded += 1
      cur.volume += l.loan_amount ?? 0
    }
    realtorMap.set(key, cur)
  }
  const realtorRows: RealtorPerformanceRow[] = [...realtorMap.values()]

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[var(--bg)] p-6">
      <Link
        href="/dashboard"
        className="text-xs font-mono text-muted-foreground hover:text-foreground/80 mb-4 inline-block"
      >
        &larr; Dashboard
      </Link>

      <div className="mb-6">
        <h1 className="text-xl font-mono font-bold text-foreground mb-1">Analytics</h1>
        <p className="text-xs font-mono text-muted-foreground">
          Pipeline health, source efficacy, realtor performance &middot; live data
        </p>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard
          label="Active Loans"
          value={String(activeLoans.length)}
          subtext={`${fmtK(pipelineVolume)} pipeline volume`}
        />
        <KpiCard
          label="Projected Commission"
          value={fmtK(projectedCommission)}
          subtext="from active pipeline"
          accent="primary"
        />
        <KpiCard
          label={`${thisYear} YTD Funded`}
          value={`${ytdFunded.length} loans`}
          subtext={`${fmtCurrency(ytdVolume)} · ${fmtK(ytdCommission)} commission`}
          accent="success"
        />
        <KpiCard
          label="Avg Days to Close"
          value={avgDaysToClose !== null ? `${avgDaysToClose}d` : '—'}
          subtext={
            avgDaysToClose !== null
              ? `from ${closeDays.length} funded loans`
              : 'need application_date + closing_date'
          }
        />
      </div>

      {/* Funnel + AEO vs SEO row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-6">
        <ConversionFunnel data={funnelData} />
        <AeoVsSeoCard aeo={aeoBucket} seo={seoBucket} />
      </div>

      {/* Source conversion */}
      <div className="mb-6">
        <SourceConversionTable rows={sourceRows} />
      </div>

      {/* Realtor performance */}
      <div className="mb-6">
        <RealtorPerformanceTable rows={realtorRows} />
      </div>

      {/* Pipeline aging — full width */}
      <div className="mb-6">
        <StageAgingTable rows={aging} />
      </div>
    </div>
  )
}
