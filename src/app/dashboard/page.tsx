import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardClient from '@/components/dashboard/DashboardClient'

export const dynamic = 'force-dynamic'

// ─── status → pipeline stage mapping ────────────────────────────────────────
const STAGE_MAP: Record<string, string> = {
  lead: 'Pre-Approval', pre_approval: 'Pre-Approval', 'pre-approval': 'Pre-Approval',
  pre_approved: 'Pre-Approval', 'pre-approved': 'Pre-Approval', 'pre-app': 'Pre-Approval',
  application: 'Pre-Approval', application_intake: 'Pre-Approval', 'application intake': 'Pre-Approval',
  started: 'Pre-Approval', qualification: 'Pre-Approval',
  processing: 'Processing', loan_setup: 'Processing', 'loan setup': 'Processing',
  disclosed: 'Processing', submitted: 'Processing', 'in process': 'Processing',
  'loan in process': 'Processing',
  underwriting: 'Underwriting', submitted_to_uw: 'Underwriting', 'submitted to uw': 'Underwriting',
  resubmitted: 'Underwriting', approved: 'Underwriting',
  approved_with_conditions: 'Underwriting', 'approved with conditions': 'Underwriting',
  conditional_approval: 'Underwriting', 'conditional-approval': 'Underwriting',
  'approved w/ conditions': 'Underwriting',
  clear_to_close: 'Clear to Close', 'clear-to-close': 'Clear to Close',
  'clear to close': 'Clear to Close', ctc: 'Clear to Close', closing: 'Clear to Close',
  closed: 'Funded', funded: 'Funded',
  cancelled: 'Cancelled', canceled: 'Cancelled', dead: 'Cancelled',
  denied: 'Cancelled', withdrawn: 'Cancelled', 'on hold': 'Cancelled', on_hold: 'Cancelled',
}

const INACTIVE = new Set([
  'closed', 'funded', 'cancelled', 'canceled', 'dead', 'denied', 'withdrawn', 'on hold', 'on_hold',
])

const ACTIVE_STAGES = ['Pre-Approval', 'Processing', 'Underwriting', 'Clear to Close']

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: loans = [] } = await supabase
    .from('loans')
    .select('id, status, loan_amount, closing_date, estimated_closing_date, funding_date, pre_approval_expiry_date, borrower_first_name, borrower_last_name, loan_name, loan_type, loan_program, loan_term, interest_rate, commission_amount, contact_id, created_at, updated_at')
    .eq('user_id', user.id)
    .order('estimated_closing_date', { ascending: true })

  const now = new Date()
  const thisMonth = now.getMonth()
  const thisYear = now.getFullYear()

  const stageCounts: Record<string, { count: number; volume: number; commission: number }> = {}
  let totalActive = 0, totalActiveVolume = 0, totalActiveCommission = 0
  let commissionThisMonth = 0, commissionYTD = 0
  let fundedThisMonth = 0, fundedYTD = 0
  let volumeThisMonth = 0, volumeYTD = 0
  const urgentFlags: Array<{ id: string; name: string; flag: string; date: string }> = []
  const staleLoans: Array<{ id: string; name: string; daysSinceActivity: number }> = []

  for (const loan of loans ?? []) {
    const rawStatus = (loan.status ?? 'unknown').toLowerCase()
    const stageName = STAGE_MAP[rawStatus] ?? loan.status ?? 'Other'
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

    const closingDate = loan.closing_date || loan.funding_date
    if (closingDate && ['closed', 'funded'].includes(rawStatus)) {
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
    if (isActive && loan.updated_at) {
      const daysSince = Math.floor((now.getTime() - new Date(loan.updated_at).getTime()) / (1000 * 60 * 60 * 24))
      if (daysSince >= 3) {
        staleLoans.push({ id: loan.id, name: borrowerName, daysSinceActivity: daysSince })
      }
    }
  }

  const stageData = ACTIVE_STAGES.map(stage => ({
    stage,
    count: stageCounts[stage]?.count ?? 0,
    volume: stageCounts[stage]?.volume ?? 0,
    commission: stageCounts[stage]?.commission ?? 0,
  }))

  const recentLoans = (loans ?? [])
    .filter(l => !INACTIVE.has((l.status ?? '').toLowerCase()))
    .slice(0, 8)

  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const { data: rawActivity = [] } = await supabase
    .from('activity_log')
    .select('id, created_at, type, action, summary, contact_id, loan_id, metadata')
    .eq('user_id', user.id)
    .gte('created_at', sevenDaysAgo.toISOString())
    .order('created_at', { ascending: false })
    .limit(100)

  const activityEntries = (rawActivity ?? []).filter(e => {
    const action = (e.action ?? '').toLowerCase()
    const summary = (e.summary ?? '').toLowerCase()
    return !action.includes('webhook.error') && !action.includes('error_loan_not_found')
      && !action.startsWith('arive.webhook') && !summary.includes('webhook error')
      && !action.includes('error_')
  })

  // Monthly funded data for performance charts
  const monthlyMap: Record<string, { loans: number; volume: number; commission: number }> = {}
  for (const loan of loans ?? []) {
    const rawStatus = (loan.status ?? '').toLowerCase()
    const closingDate = loan.closing_date || loan.funding_date
    if (!closingDate || !['closed', 'funded'].includes(rawStatus)) continue
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

  return (
    <DashboardClient
      totalActive={totalActive}
      totalActiveVolume={totalActiveVolume}
      totalActiveCommission={totalActiveCommission}
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
      recentLoans={recentLoans}
      activityEntries={activityEntries}
      chartData={chartData}
    />
  )
}
