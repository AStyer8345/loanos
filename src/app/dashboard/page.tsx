import { createClient } from '@/lib/supabase/server'
import { getOrganization } from '@/lib/getOrganization'
import { redirect } from 'next/navigation'
import DashboardClient from '@/components/dashboard/DashboardClient'
import { toDashboardStage, DASHBOARD_STAGES, INACTIVE_STATUSES, isInStageGroup, STAGE_GROUPS } from '@/lib/constants/loan-stages'
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

  // Check onboarding state for setup banner
  const { data: orgSettings } = await supabase
    .from('org_settings')
    .select('onboarding_completed')
    .eq('organization_id', organizationId)
    .single()
  const showSetupBanner = orgSettings ? !orgSettings.onboarding_completed : false

  const { data: loans = [] } = await supabase
    .from('loans')
    .select('id, status, loan_amount, closing_date, estimated_closing_date, funding_date, pre_approval_expiry_date, rate_lock_expiration, borrower_first_name, borrower_last_name, loan_name, loan_type, loan_program, loan_term, interest_rate, commission_amount, contact_id, created_at, updated_at, lender_name')
    .eq('organization_id', organizationId)
    .order('estimated_closing_date', { ascending: true })

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

  // recentLoans removed — pipeline tab no longer shows Active Loans table

  // ── Smart Action Queue: last human touch per active loan ─────────────────
  const activeLoans = (loans ?? []).filter(l => !INACTIVE.has((l.status ?? '').toLowerCase()))
  const activeLoanIds = activeLoans.map(l => l.id)

  const lastActivityMap = new Map<string, string>() // loan_id → occurred_at ISO string
  if (activeLoanIds.length > 0) {
    const { data: activityRows = [] } = await supabase
      .from('activity_log')
      .select('loan_id, occurred_at, action')
      .in('loan_id', activeLoanIds)
      .not('loan_id', 'is', null)
      .not('action', 'ilike', 'arive.%')
      .not('action', 'ilike', '%.webhook%')
      .not('action', 'ilike', 'error_%')
      .order('occurred_at', { ascending: false })
      .limit(500)

    for (const row of activityRows ?? []) {
      if (row.loan_id && row.occurred_at && !lastActivityMap.has(row.loan_id)) {
        lastActivityMap.set(row.loan_id, row.occurred_at)
      }
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

  // ── Hot Leads — all Lead-stage contacts, created within 14 days, not dismissed ─
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: webLeadContacts = [] } = await (supabase.from('contacts') as any)
    .select('id, first_name, last_name, email, phone, referred_by, created_at')
    .eq('organization_id', organizationId)
    .eq('stage', 'Lead')
    .neq('hot_lead_dismissed', true)
    .not('contact_type', 'in', '("realtor","agent","lender","title")')
    .gte('created_at', fourteenDaysAgo.toISOString())
    .order('created_at', { ascending: false }) as { data: Array<{
      id: string; first_name: string | null; last_name: string | null
      email: string | null; phone: string | null; referred_by: string | null
      created_at: string
    }> | null }

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
      showSetupBanner={showSetupBanner}
    />
  )
}
