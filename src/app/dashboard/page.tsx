import { createClient } from '@/lib/supabase/server'
import { getOrganization } from '@/lib/getOrganization'
import { redirect } from 'next/navigation'
import DashboardClient from '@/components/dashboard/DashboardClient'
import { toDashboardStage, DASHBOARD_STAGES, INACTIVE_STATUSES, isInStageGroup, STAGE_GROUPS, normalizeToStageKey } from '@/lib/constants/loan-stages'
import { rankLoans, type LoanForScoring } from '@/lib/scoreLoans'
import { type HotLead } from '@/components/dashboard/HotLeadsWidget'

export const dynamic = 'force-dynamic'

const INACTIVE = new Set(INACTIVE_STATUSES.map(s => s.toLowerCase()))

export default async function DashboardPage() {
  let organizationId: string
  try {
    const ctx = await getOrganization()
    organizationId = ctx.organizationId
  } catch {
    redirect('/auth/login')
  }
  const supabase = createClient()

  // Parallel fetch: org_settings + loans are independent
  const [{ data: orgSettings }, { data: loans = [] }] = await Promise.all([
    supabase
      .from('org_settings')
      .select('onboarding_completed')
      .eq('organization_id', organizationId)
      .single(),
    supabase
      .from('loans')
      .select('id, status, loan_amount, closing_date, estimated_closing_date, funding_date, pre_approval_expiry_date, rate_lock_expiration, borrower_first_name, borrower_last_name, loan_name, loan_type, loan_program, loan_term, interest_rate, commission_amount, contact_id, created_at, updated_at, lender_name, referral_source, rate_lock_date, rate_lock_days')
      .eq('organization_id', organizationId)
      .order('estimated_closing_date', { ascending: true }),
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
  const urgentFlags: Array<{ id: string; name: string; flag: string; date: string }> = []
  const staleLoans: Array<{ id: string; name: string; daysSinceActivity: number; status: string | null; estimated_closing_date: string | null; loan_amount: number | null }> = []

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

    const borrowerName = [loan.borrower_first_name, loan.borrower_last_name].filter(Boolean).join(' ')
      || loan.loan_name || 'Unknown'

    if (loan.pre_approval_expiry_date) {
      const exp = new Date(loan.pre_approval_expiry_date)
      const next7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      if (exp >= now && exp <= next7) {
        urgentFlags.push({ id: loan.id, name: borrowerName, flag: 'Pre-approval expiring', date: loan.pre_approval_expiry_date })
      }
    }
    if (loan.estimated_closing_date && isActive) {
      if (new Date(loan.estimated_closing_date) < now) {
        urgentFlags.push({ id: loan.id, name: borrowerName, flag: 'Past est. closing date', date: loan.estimated_closing_date })
      }
    }
    if (loan.rate_lock_expiration && isActive) {
      const lockExp = new Date(loan.rate_lock_expiration + 'T00:00:00')
      const next7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      if (lockExp < now) {
        urgentFlags.push({ id: loan.id, name: borrowerName, flag: 'Rate lock EXPIRED', date: loan.rate_lock_expiration })
      } else if (lockExp <= next7) {
        urgentFlags.push({ id: loan.id, name: borrowerName, flag: 'Rate lock expiring', date: loan.rate_lock_expiration })
      }
    }
  }
  // staleLoans computed after lastActivityMap is built below

  const stageData = DASHBOARD_STAGES.map(stage => ({
    stage,
    count: stageCounts[stage]?.count ?? 0,
    volume: stageCounts[stage]?.volume ?? 0,
    commission: stageCounts[stage]?.commission ?? 0,
  }))

  // ── Conversion funnel: count loans that reached each stage (YTD) ────────
  const funnelStages = [
    { key: 'lead' as const, label: 'Lead' },
    { key: 'new_application' as const, label: 'Application' },
    { key: 'pre_approval' as const, label: 'Pre-Approval' },
    { key: 'submitted' as const, label: 'Submitted' },
    { key: 'approved' as const, label: 'Approved' },
    { key: 'clear_to_close' as const, label: 'CTC' },
    { key: 'funded' as const, label: 'Funded' },
  ] as const

  const STAGE_ORDER: Record<string, number> = {
    lead: 0, new_application: 1, pre_approval: 2, setup: 3,
    disclosed: 3, processing: 3, submitted: 4, underwriting: 4,
    approved: 5, resubmit: 5, clear_to_close: 6, funded: 7,
  }

  const funnelData = funnelStages.map(fs => {
    const threshold = STAGE_ORDER[fs.key] ?? 0
    const count = (loans ?? []).filter(l => {
      const key = normalizeToStageKey(l.status)
      return (STAGE_ORDER[key] ?? 0) >= threshold
    }).length
    return { stage: fs.label, count }
  })

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

  // Build staleLoans using real human activity timestamps
  for (const loan of activeLoans) {
    const borrowerName = [loan.borrower_first_name, loan.borrower_last_name].filter(Boolean).join(' ')
      || loan.loan_name || 'Unknown'
    const lastHumanTouch = lastActivityMap.get(loan.id)
    // Use created_at as fallback (not updated_at) — Arive syncs touch updated_at constantly
    const compareDate = lastHumanTouch ?? loan.created_at
    if (compareDate) {
      const daysSince = Math.floor((now.getTime() - new Date(compareDate).getTime()) / (1000 * 60 * 60 * 24))
      if (daysSince >= 7) {
        staleLoans.push({
          id: loan.id,
          name: borrowerName,
          daysSinceActivity: daysSince,
          status: loan.status,
          estimated_closing_date: loan.estimated_closing_date,
          loan_amount: loan.loan_amount,
        })
      }
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
    .slice(0, 10)

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

  return (
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
      urgentFlags={urgentFlags}
      staleLoans={staleLoans}
      chartData={chartData}
      sparklineMonths={sparklineMonths}
      scoredLoans={scoredLoans}
      hotLeads={hotLeads}
      funnelData={funnelData}
      showSetupBanner={showSetupBanner}
      referralData={referralData}
      rateLockLoans={rateLockLoans}
      yoyChartData={yoyChartData}
      forecastData={forecastData}
      daysToCloseData={daysToCloseData}
    />
  )
}
