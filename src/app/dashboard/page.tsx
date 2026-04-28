import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getOrganization } from '@/lib/getOrganization'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import DashboardClient from '@/components/dashboard/DashboardClient'
import EmailAutomationCard from '@/components/dashboard/EmailAutomationCard'
import { getOrgFeatures } from '@/lib/features/getOrgFeatures'
import { toDashboardStage, DASHBOARD_STAGES, INACTIVE_STATUSES, isInStageGroup, STAGE_GROUPS, normalizeToStageKey } from '@/lib/constants/loan-stages'
import { rankLoans, type LoanForScoring } from '@/lib/scoreLoans'
import { type HotLead } from '@/components/dashboard/HotLeadsWidget'
import { getNeedsAttention } from '@/lib/needsAttention'
import {
  aggregateBySource,
  classifyLeadSource,
  type ContactSourceFields,
  type LeadSourceCategory,
} from '@/lib/leadSources'
import { type SourceConversionRow } from '@/components/dashboard/analytics/SourceConversionTable'
import { type RealtorPerformanceRow } from '@/components/dashboard/analytics/RealtorPerformanceTable'

const NEW_LEADS_WINDOW_DAYS = 30

export const dynamic = 'force-dynamic'

const INACTIVE = new Set(INACTIVE_STATUSES.map(s => s.toLowerCase()))

export default async function DashboardPage() {
  let organizationId: string
  let userId: string
  try {
    const ctx = await getOrganization()
    organizationId = ctx.organizationId
    userId = ctx.userId
  } catch {
    redirect('/auth/login')
  }
  const supabase = createClient()
  const features = await getOrgFeatures()

  // ── System admin check (for EmailAutomationCard gate) ──────────────────────
  let isSystemAdmin = false
  {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const service = createServiceClient() as any
      const { data: adminRow } = await service
        .from('system_admins')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle()
      isSystemAdmin = Boolean(adminRow)
    }
  }

  const newLeadsWindowStart = new Date(
    Date.now() - NEW_LEADS_WINDOW_DAYS * 24 * 60 * 60 * 1000
  ).toISOString()

  // Parallel fetch: org_settings + loans + mcc_state + recent contacts + all contacts (for analytics)
  const [
    { data: orgSettings },
    { data: loans = [] },
    { data: mccRow },
    { data: recentContacts = [] },
    { data: allContacts = [] },
  ] = await Promise.all([
    supabase
      .from('org_settings')
      .select('onboarding_completed')
      .eq('organization_id', organizationId)
      .single(),
    supabase
      .from('loans')
      .select('id, status, loan_amount, closing_date, estimated_closing_date, funding_date, pre_approval_expiry_date, rate_lock_expiration, borrower_first_name, borrower_last_name, loan_name, loan_type, loan_program, loan_term, interest_rate, commission_amount, contact_id, created_at, updated_at, lender_name, referral_source, rate_lock_date, rate_lock_days, referring_agent_email, referring_agent_name, application_date')
      .eq('organization_id', organizationId)
      .order('estimated_closing_date', { ascending: true }),
    supabase
      .from('mcc_state')
      .select('value')
      .eq('user_id', userId)
      .eq('key', 'mcc')
      .single(),
    supabase
      .from('contacts')
      .select('lead_source, referrer, source_page, utm_params')
      .eq('organization_id', organizationId)
      .gte('created_at', newLeadsWindowStart),
    supabase
      .from('contacts')
      .select('id, lead_source, referrer, source_page, utm_params, referred_by_contact_id')
      .eq('organization_id', organizationId),
  ])
  const showSetupBanner = orgSettings ? !orgSettings.onboarding_completed : false

  const now = new Date()
  const thisMonth = now.getMonth()
  const thisYear = now.getFullYear()

  const stageCounts: Record<string, { count: number; volume: number; commission: number }> = {}
  let totalActive = 0, totalActiveVolume = 0, totalActiveCommission = 0
  let pipelineCount = 0, pipelineVolume = 0, pipelineCommission = 0
  let commissionThisMonth = 0, commissionYTD = 0
  let fundedThisMonth = 0, fundedYTD = 0
  let volumeThisMonth = 0, volumeYTD = 0

  for (const loan of loans ?? []) {
    const rawStatus = (loan.status ?? 'unknown').toLowerCase()
    const stageName = toDashboardStage(loan.status)
    const amount = loan.loan_amount ?? 0
    const commission = loan.commission_amount ?? 0

    if (!stageCounts[stageName]) stageCounts[stageName] = { count: 0, volume: 0, commission: 0 }
    stageCounts[stageName].count++
    stageCounts[stageName].volume += amount
    stageCounts[stageName].commission += commission

    const isActive = !INACTIVE.has(rawStatus)
    if (isActive) {
      totalActive++
      totalActiveVolume += amount
      totalActiveCommission += commission
    }

    // Pipeline = in-process only (excludes pre-approvals, leads, new apps)
    if (isInStageGroup(loan.status, STAGE_GROUPS.IN_PROCESS)) {
      pipelineCount++
      pipelineVolume += amount
      pipelineCommission += commission
    }

    const closingDate = loan.closing_date || loan.funding_date
    if (closingDate && (rawStatus.includes('closed') || rawStatus.includes('funded'))) {
      const cd = new Date(closingDate)
      if (cd.getFullYear() === thisYear) {
        fundedYTD++
        volumeYTD += amount
        commissionYTD += commission
        if (cd.getMonth() === thisMonth) {
          fundedThisMonth++
          volumeThisMonth += amount
          commissionThisMonth += commission
        }
      }
    }

  }

  const stageData = DASHBOARD_STAGES.map(stage => ({
    stage,
    count: stageCounts[stage]?.count ?? 0,
    volume: stageCounts[stage]?.volume ?? 0,
    commission: stageCounts[stage]?.commission ?? 0,
  }))

  // ── Conversion funnel: count loans currently AT each stage ────────────
  const STAGE_TO_FUNNEL: Record<string, string> = {
    lead: 'Lead',
    new_application: 'Application',
    pre_approval: 'Pre-Approval',
    setup: 'Submitted', disclosed: 'Submitted', processing: 'Submitted',
    submitted: 'Submitted', underwriting: 'Submitted',
    approved: 'Approved', resubmit: 'Approved',
    clear_to_close: 'CTC',
    funded: 'Funded',
  }
  const FUNNEL_LABELS = ['Lead', 'Application', 'Pre-Approval', 'Submitted', 'Approved', 'CTC', 'Funded']

  const funnelCounts: Record<string, number> = {}
  for (const label of FUNNEL_LABELS) funnelCounts[label] = 0
  for (const loan of loans ?? []) {
    const key = normalizeToStageKey(loan.status)
    const bucket = STAGE_TO_FUNNEL[key]
    if (bucket) funnelCounts[bucket]++
  }
  const funnelData = FUNNEL_LABELS.map(label => ({ stage: label, count: funnelCounts[label] }))

  // recentLoans removed — pipeline tab no longer shows Active Loans table

  // ── Smart Action Queue: last human touch per active loan ─────────────────
  const activeLoans = (loans ?? []).filter(l => !INACTIVE.has((l.status ?? '').toLowerCase()))
  const activeLoanIds = activeLoans.map(l => l.id)

  // Parallel fetch: activity_log + contacts are independent (both depend on loans, not each other)
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

  const [activityResult, contactsResult] = await Promise.all([
    activeLoanIds.length > 0
      ? supabase
          .from('activity_log')
          .select('loan_id, occurred_at, action')
          .in('loan_id', activeLoanIds)
          .not('loan_id', 'is', null)
          .not('action', 'ilike', 'arive.%')
          .not('action', 'ilike', '%.webhook%')
          .not('action', 'ilike', 'error_%')
          .order('occurred_at', { ascending: false })
          .limit(500)
      : Promise.resolve({ data: [] as Array<{ loan_id: string | null; occurred_at: string | null; action: string | null }> }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from('contacts') as any)
      .select('id, first_name, last_name, email, phone, referred_by, created_at')
      .eq('organization_id', organizationId)
      .eq('stage', 'Lead')
      .neq('hot_lead_dismissed', true)
      .not('contact_type', 'in', '("realtor","agent","lender","title")')
      .gte('created_at', fourteenDaysAgo.toISOString())
      .order('created_at', { ascending: false }) as Promise<{ data: Array<{
        id: string; first_name: string | null; last_name: string | null
        email: string | null; phone: string | null; referred_by: string | null
        created_at: string
      }> | null }>,
  ])

  const activityRows = activityResult.data ?? []
  const webLeadContacts = contactsResult.data ?? []

  const lastActivityMap = new Map<string, string>() // loan_id → occurred_at ISO string
  for (const row of activityRows) {
    if (row.loan_id && row.occurred_at && !lastActivityMap.has(row.loan_id)) {
      lastActivityMap.set(row.loan_id, row.occurred_at)
    }
  }

  const loansForScoring: LoanForScoring[] = activeLoans.map(l => ({
    id: l.id,
    loan_name: l.loan_name,
    borrower_first_name: l.borrower_first_name,
    borrower_last_name: l.borrower_last_name,
    status: l.status,
    loan_amount: l.loan_amount,
    loan_program: l.loan_program,
    lender_name: l.lender_name ?? null,
    closing_date: l.closing_date,
    estimated_closing_date: l.estimated_closing_date,
    updated_at: l.updated_at ?? null,
    lastActivityAt: lastActivityMap.get(l.id) ?? null,
  }))

  const scoredLoans = rankLoans(loansForScoring)

  // Get most recent contact_activity note per lead
  const webLeadIds = (webLeadContacts ?? []).map(c => c.id)
  const latestActivityNote = new Map<string, string>()
  if (webLeadIds.length > 0) {
    const { data: actRows = [] } = await supabase
      .from('contact_activity')
      .select('contact_id, notes')
      .in('contact_id', webLeadIds)
      .not('notes', 'is', null)
      .order('logged_at', { ascending: false })
      .limit(200)
    for (const row of actRows ?? []) {
      if (row.contact_id && !latestActivityNote.has(row.contact_id)) {
        latestActivityNote.set(row.contact_id, row.notes ?? '')
      }
    }
  }

  const hotLeads: HotLead[] = (webLeadContacts ?? []).map(c => ({
    id: c.id,
    first_name: c.first_name ?? 'Unknown',
    last_name: c.last_name ?? null,
    email: c.email ?? null,
    phone: c.phone ?? null,
    referred_by: c.referred_by ?? null,
    notes: latestActivityNote.get(c.id) ?? '',
    daysAgo: Math.floor((now.getTime() - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24)),
    score: 0,
  }))

  // "Needs Your Attention" — AI-classified inbound emails from the last 7 days.
  // Server-side fetch because the scoring logic is shared with automations.
  const needsAttention = await getNeedsAttention(supabase, organizationId)

  // newLeads, recentApplications, activityEntries removed — dashboard redesign

  // Monthly funded data for performance charts
  const monthlyMap: Record<string, { loans: number; volume: number; commission: number }> = {}
  for (const loan of loans ?? []) {
    const rawStatus = (loan.status ?? '').toLowerCase()
    const closingDate = loan.closing_date || loan.funding_date
    if (!closingDate || !(rawStatus.includes('closed') || rawStatus.includes('funded'))) continue
    const cd = new Date(closingDate)
    if (cd.getFullYear() !== thisYear) continue
    const mk = cd.toLocaleString('en-US', { month: 'short' })
    if (!monthlyMap[mk]) monthlyMap[mk] = { loans: 0, volume: 0, commission: 0 }
    monthlyMap[mk].loans++
    monthlyMap[mk].volume += loan.loan_amount ?? 0
    monthlyMap[mk].commission += loan.commission_amount ?? 0
  }
  const MONTH_ORDER = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const chartData = MONTH_ORDER.filter(m => monthlyMap[m]).map(m => ({ month: m, ...monthlyMap[m] }))

  // ── Sparkline data: trailing 6 months of commission, volume, funded count ───
  const sparklineMonths: Array<{ month: string; commission: number; volume: number; funded: number }> = []
  {
    const today = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
      const mk = d.toLocaleString('en-US', { month: 'short' })
      const yr = d.getFullYear()
      const mo = d.getMonth()
      let commission = 0, volume = 0, funded = 0
      for (const loan of loans ?? []) {
        const rawStatus = (loan.status ?? '').toLowerCase()
        const closingDate = loan.closing_date || loan.funding_date
        if (!closingDate || !(rawStatus.includes('closed') || rawStatus.includes('funded'))) continue
        const cd = new Date(closingDate)
        if (cd.getFullYear() === yr && cd.getMonth() === mo) {
          commission += loan.commission_amount ?? 0
          volume += loan.loan_amount ?? 0
          funded++
        }
      }
      sparklineMonths.push({ month: mk, commission, volume, funded })
    }
  }

  // ── Referral leaderboard: top sources by funded + in-process volume ──────
  const referralMap = new Map<string, { loans: number; volume: number; funded: number }>()
  for (const loan of loans ?? []) {
    const source = loan.referral_source
    if (!source) continue
    const rawStatus = (loan.status ?? '').toLowerCase()
    const isFunded = rawStatus.includes('closed') || rawStatus.includes('funded')
    const isActive = !INACTIVE.has(rawStatus)
    if (!isFunded && !isActive) continue

    const entry = referralMap.get(source) ?? { loans: 0, volume: 0, funded: 0 }
    entry.loans++
    entry.volume += loan.loan_amount ?? 0
    if (isFunded) entry.funded++
    referralMap.set(source, entry)
  }

  const referralData = [...referralMap.entries()]
    .map(([source, data]) => ({ source, ...data }))
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 20)

  // ── Rate lock countdown data ─────────────────────────────────────────────
  const rateLockLoans: Array<{
    id: string
    name: string
    daysRemaining: number
    totalDays: number
    expirationDate: string
  }> = []
  for (const loan of activeLoans) {
    if (!loan.rate_lock_expiration) continue
    const lockExp = new Date(loan.rate_lock_expiration + 'T00:00:00')
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const daysRemaining = Math.ceil((lockExp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    if (daysRemaining < -7) continue // skip long-expired locks

    const lockStart = loan.rate_lock_date
      ? new Date(loan.rate_lock_date + 'T00:00:00')
      : null
    const totalDays = lockStart
      ? Math.ceil((lockExp.getTime() - lockStart.getTime()) / (1000 * 60 * 60 * 24))
      : loan.rate_lock_days ?? 30

    const borrowerName = [loan.borrower_first_name, loan.borrower_last_name].filter(Boolean).join(' ')
      || loan.loan_name || 'Unknown'

    rateLockLoans.push({
      id: loan.id,
      name: borrowerName,
      daysRemaining,
      totalDays: Math.max(totalDays, 1),
      expirationDate: loan.rate_lock_expiration,
    })
  }
  rateLockLoans.sort((a, b) => a.daysRemaining - b.daysRemaining)

  // ── YoY comparison: last year monthly volume ─────────────────────────────
  const lastYearMap: Record<string, { loans: number; volume: number; commission: number }> = {}
  const lastYear = thisYear - 1
  for (const loan of loans ?? []) {
    const rawStatus = (loan.status ?? '').toLowerCase()
    const closingDate = loan.closing_date || loan.funding_date
    if (!closingDate || !(rawStatus.includes('closed') || rawStatus.includes('funded'))) continue
    const cd = new Date(closingDate)
    if (cd.getFullYear() !== lastYear) continue
    const mk = cd.toLocaleString('en-US', { month: 'short' })
    if (!lastYearMap[mk]) lastYearMap[mk] = { loans: 0, volume: 0, commission: 0 }
    lastYearMap[mk].loans++
    lastYearMap[mk].volume += loan.loan_amount ?? 0
    lastYearMap[mk].commission += loan.commission_amount ?? 0
  }

  const yoyChartData = MONTH_ORDER.map(m => ({
    month: m,
    thisYear: monthlyMap[m]?.volume ?? 0,
    lastYear: lastYearMap[m]?.volume ?? 0,
  }))

  // ── Commission forecast: actual + projected from pipeline closing dates ──
  const forecastData = MONTH_ORDER.map((m, i) => {
    const actual = monthlyMap[m]?.commission ?? 0
    let projected = 0
    for (const loan of activeLoans) {
      if (!isInStageGroup(loan.status, STAGE_GROUPS.IN_PROCESS)) continue
      const ecd = loan.estimated_closing_date
      if (!ecd) continue
      const cd = new Date(ecd)
      if (cd.getFullYear() !== thisYear) continue
      if (cd.getMonth() === i) {
        projected += loan.commission_amount ?? 0
      }
    }
    return { month: m, actual, projected }
  })

  // ── Avg days-to-close by loan type (YTD funded loans) ────────────────────
  const dtcMap = new Map<string, { totalDays: number; count: number }>()
  for (const loan of loans ?? []) {
    const rawStatus = (loan.status ?? '').toLowerCase()
    if (!(rawStatus.includes('closed') || rawStatus.includes('funded'))) continue
    const closingDate = loan.closing_date || loan.funding_date
    if (!closingDate || !loan.created_at) continue
    const cd = new Date(closingDate)
    if (cd.getFullYear() !== thisYear) continue
    const created = new Date(loan.created_at)
    const days = Math.floor((cd.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
    if (days < 0 || days > 365) continue
    const loanType = loan.loan_type ?? 'Other'
    const entry = dtcMap.get(loanType) ?? { totalDays: 0, count: 0 }
    entry.totalDays += days
    entry.count++
    dtcMap.set(loanType, entry)
  }

  const daysToCloseData = [...dtcMap.entries()]
    .map(([type, data]) => ({
      type,
      avgDays: Math.round(data.totalDays / data.count),
      count: data.count,
    }))
    .sort((a, b) => b.count - a.count)

  // ── Pipeline loans for mini-table (active in-process loans) ─────────────
  const pipelineLoans = activeLoans
    .filter(l => isInStageGroup(l.status, STAGE_GROUPS.IN_PROCESS))
    .map(l => ({
      id: l.id,
      name: [l.borrower_first_name, l.borrower_last_name].filter(Boolean).join(' ') || l.loan_name || 'Unknown',
      amount: l.loan_amount ?? 0,
      status: l.status,
      closingDate: l.estimated_closing_date ?? l.closing_date,
      rate: l.interest_rate,
      commission: l.commission_amount ?? 0,
      rateLockExp: l.rate_lock_expiration,
      lender: l.lender_name,
    }))

  // ── New applications & pre-approvals (recent, sorted by created_at) ─────
  const EXCLUDED_STATUSES = ['Dead', 'Cancelled', 'canceled', 'Denied', 'Withdrawn', 'Suspended']
  const newAppsAndPAs = (loans ?? [])
    .filter(l => {
      if (!l.status || EXCLUDED_STATUSES.includes(l.status)) return false
      const key = normalizeToStageKey(l.status)
      return key === 'new_application' || key === 'pre_approval' || key === 'lead'
    })
    .sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime())
    .slice(0, 15)
    .map(l => ({
      id: l.id,
      name: [l.borrower_first_name, l.borrower_last_name].filter(Boolean).join(' ') || l.loan_name || 'Unknown',
      amount: l.loan_amount ?? 0,
      status: l.status,
      stage: normalizeToStageKey(l.status),
      createdAt: l.created_at,
      loanType: l.loan_type,
      referralSource: l.referral_source,
    }))

  // ── Lead source breakdown ───────────────────────────────────────────────
  const sourceMap = new Map<string, { count: number; volume: number }>()
  for (const loan of loans ?? []) {
    const source = loan.referral_source?.trim() || 'Direct / No Source'
    const entry = sourceMap.get(source) ?? { count: 0, volume: 0 }
    entry.count++
    entry.volume += loan.loan_amount ?? 0
    sourceMap.set(source, entry)
  }
  const leadSourceData = [...sourceMap.entries()]
    .map(([source, data]) => ({ source, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15)

  // ── New Leads by Source (30d contacts-based, AEO-aware) ─────────────────
  // Supabase returns utm_params as Json — safe-cast into our narrowed shape.
  const newLeadSourceData = aggregateBySource(
    ((recentContacts ?? []) as unknown as ContactSourceFields[])
  )

  // ── Marketing activity log (from mcc_state JSON blob) ───────────────────
  interface MarketingLogEntry { id: string; date: string; activity: string; channel: string; notes?: string }
  const mccValue = mccRow?.value as Record<string, unknown> | null
  const rawLog = (mccValue?.log ?? []) as MarketingLogEntry[]
  const marketingLog = rawLog.slice(0, 10) // most recent 10

  // ── Analytics: Source conversion, AEO vs SEO, Realtor performance ───────
  // Past-client referrer set — any contact whose loan is funded. Contacts
  // referred by them get auto-tagged as Past Client.
  const fundedBorrowerContactIds = new Set<string>()
  for (const l of loans ?? []) {
    const rs = (l.status ?? '').toLowerCase()
    if (l.contact_id && (rs.includes('closed') || rs.includes('funded'))) {
      fundedBorrowerContactIds.add(l.contact_id)
    }
  }

  // Per-contact funded tally (count + volume) for source conversion table
  const fundedByContact = new Map<string, { count: number; volume: number }>()
  for (const l of loans ?? []) {
    const rs = (l.status ?? '').toLowerCase()
    if (!l.contact_id) continue
    if (!(rs.includes('closed') || rs.includes('funded'))) continue
    const cur = fundedByContact.get(l.contact_id) ?? { count: 0, volume: 0 }
    cur.count += 1
    cur.volume += l.loan_amount ?? 0
    fundedByContact.set(l.contact_id, cur)
  }

  // Classify every contact, aggregate into source conversion rows
  const sourceConversionMap = new Map<LeadSourceCategory, SourceConversionRow>()
  for (const c of (allContacts ?? []) as unknown as Array<ContactSourceFields & { id: string }>) {
    const cat = classifyLeadSource(c, fundedBorrowerContactIds)
    const cur = sourceConversionMap.get(cat) ?? { source: cat, leads: 0, funded: 0, volume: 0 }
    cur.leads += 1
    const f = fundedByContact.get(c.id)
    if (f) {
      cur.funded += f.count
      cur.volume += f.volume
    }
    sourceConversionMap.set(cat, cur)
  }
  const sourceConversionRows: SourceConversionRow[] = [...sourceConversionMap.values()]
  const aeoBucket = sourceConversionMap.get('AEO') ?? { source: 'AEO' as const, leads: 0, funded: 0, volume: 0 }
  const seoBucket = sourceConversionMap.get('SEO') ?? { source: 'SEO' as const, leads: 0, funded: 0, volume: 0 }

  // Realtor performance — group loans by referring_agent_email||name, top 10 by funded volume
  const realtorMap = new Map<string, RealtorPerformanceRow>()
  for (const l of loans ?? []) {
    const key = (l.referring_agent_email || l.referring_agent_name || '').trim().toLowerCase()
    if (!key) continue
    const display = l.referring_agent_name || l.referring_agent_email || 'Unknown'
    const cur = realtorMap.get(key) ?? { realtor: display, loans: 0, funded: 0, volume: 0 }
    cur.loans += 1
    const rs = (l.status ?? '').toLowerCase()
    if (rs.includes('closed') || rs.includes('funded')) {
      cur.funded += 1
      cur.volume += l.loan_amount ?? 0
    }
    realtorMap.set(key, cur)
  }
  const realtorPerformanceRows: RealtorPerformanceRow[] = [...realtorMap.values()]
    .sort((a, b) => b.volume - a.volume || b.funded - a.funded || b.loans - a.loans)
    .slice(0, 10)

  return (
    <>
      {isSystemAdmin && features.email_intelligence && (
        <div className="px-4 lg:px-6 pt-4">
          <Suspense fallback={<div className="h-32 animate-pulse bg-muted rounded-lg" />}>
            <EmailAutomationCard />
          </Suspense>
        </div>
      )}
      <DashboardClient
        totalActive={totalActive}
        totalActiveVolume={totalActiveVolume}
        totalActiveCommission={totalActiveCommission}
        pipelineCount={pipelineCount}
        pipelineVolume={pipelineVolume}
        pipelineCommission={pipelineCommission}
        commissionThisMonth={commissionThisMonth}
        commissionYTD={commissionYTD}
        projectedCommission={totalActiveCommission}
        fundedThisMonth={fundedThisMonth}
        fundedYTD={fundedYTD}
        volumeThisMonth={volumeThisMonth}
        volumeYTD={volumeYTD}
        stageData={stageData}
        chartData={chartData}
        sparklineMonths={sparklineMonths}
        scoredLoans={scoredLoans}
        hotLeads={hotLeads}
        needsAttention={needsAttention}
        funnelData={funnelData}
        showSetupBanner={showSetupBanner}
        referralData={referralData}
        rateLockLoans={rateLockLoans}
        yoyChartData={yoyChartData}
        forecastData={forecastData}
        daysToCloseData={daysToCloseData}
        pipelineLoans={pipelineLoans}
        newAppsAndPAs={newAppsAndPAs}
        leadSourceData={leadSourceData}
        newLeadSourceData={newLeadSourceData}
        newLeadsWindowDays={NEW_LEADS_WINDOW_DAYS}
        marketingLog={marketingLog}
        sourceConversionRows={sourceConversionRows}
        aeoBucket={aeoBucket}
        seoBucket={seoBucket}
        realtorPerformanceRows={realtorPerformanceRows}
      />
    </>
  )
}
