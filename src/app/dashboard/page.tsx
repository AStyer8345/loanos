import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AlertTriangle } from 'lucide-react'
import PipelineKPIs from '@/components/dashboard/PipelineKPIs'
import PipelineCharts from '@/components/dashboard/PipelineCharts'
import UrgentFlags from '@/components/dashboard/UrgentFlags'
import DailyBriefingPanel from '@/components/dashboard/DailyBriefingPanel'
import TodoList from '@/components/dashboard/TodoList'
import RecentActivity from '@/components/dashboard/RecentActivity'

export const dynamic = 'force-dynamic'

// ─── helpers ────────────────────────────────────────────────────────────────

const STAGE_MAP: Record<string, string> = {
  lead: 'Lead',
  pre_approval: 'Pre-App',
  'pre-approval': 'Pre-App',
  application: 'Application',
  processing: 'Processing',
  underwriting: 'Underwriting',
  conditional_approval: 'Cond. Approval',
  'conditional-approval': 'Cond. Approval',
  clear_to_close: 'Clear to Close',
  'clear-to-close': 'Clear to Close',
  closing: 'Closing',
  closed: 'Closed',
  funded: 'Funded',
}

// ─── page ────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // ── fetch loans ──
  const { data: loans = [] } = await supabase
    .from('loans')
    .select('id, status, loan_amount, closing_date, estimated_closing_date, funding_date, pre_approval_expiry_date, borrower_first_name, borrower_last_name, loan_name')
    .eq('user_id', user.id)

  // ── compute pipeline stats ──
  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
  const next30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const next7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const ninetyAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

  const stageCounts: Record<string, { count: number; volume: number }> = {}
  let totalCount = 0
  let totalVolume = 0
  let closedThisMonth = 0
  let closedThisMonthVolume = 0
  let closedLastMonth = 0
  let closedLastMonthVolume = 0
  let closingNext30 = 0
  let closingNext30Volume = 0
  const urgentFlags: Array<{ id: string; name: string; flag: string; date: string }> = []

  for (const loan of loans ?? []) {
    const status = (loan.status ?? 'unknown').toLowerCase()
    const stageName = STAGE_MAP[status] ?? loan.status ?? 'Unknown'
    const amount = loan.loan_amount ?? 0

    if (!stageCounts[stageName]) stageCounts[stageName] = { count: 0, volume: 0 }
    stageCounts[stageName].count++
    stageCounts[stageName].volume += amount

    if (!['closed', 'funded'].includes(status)) {
      totalCount++
      totalVolume += amount
    }

    const closingDate = loan.closing_date ?? loan.funding_date
    if (closingDate) {
      const cd = new Date(closingDate)
      if (cd >= thisMonthStart && cd <= now && ['closed', 'funded'].includes(status)) {
        closedThisMonth++; closedThisMonthVolume += amount
      }
      if (cd >= lastMonthStart && cd <= lastMonthEnd && ['closed', 'funded'].includes(status)) {
        closedLastMonth++; closedLastMonthVolume += amount
      }
    }

    if (loan.estimated_closing_date) {
      const ec = new Date(loan.estimated_closing_date)
      if (ec >= now && ec <= next30) { closingNext30++; closingNext30Volume += amount }
    }

    const borrowerName = [loan.borrower_first_name, loan.borrower_last_name].filter(Boolean).join(' ') || loan.loan_name || 'Unknown'

    if (loan.pre_approval_expiry_date) {
      const exp = new Date(loan.pre_approval_expiry_date)
      if (exp >= now && exp <= next7) {
        urgentFlags.push({ id: loan.id, name: borrowerName, flag: 'Pre-approval expiring', date: loan.pre_approval_expiry_date })
      }
    }

    if (loan.estimated_closing_date && !['closed', 'funded'].includes(status)) {
      const ec = new Date(loan.estimated_closing_date)
      if (ec < now) {
        urgentFlags.push({ id: loan.id, name: borrowerName, flag: 'Past est. closing date', date: loan.estimated_closing_date })
      }
    }
  }

  // ── closing trend (last 90 days, weekly buckets) ──
  const { data: closedLoans = [] } = await supabase
    .from('loans')
    .select('closing_date, funding_date, loan_amount')
    .eq('user_id', user.id)
    .in('status', ['closed', 'funded'])
    .gte('closing_date', ninetyAgo.toISOString())

  const weeklyTrend = Array.from({ length: 13 }, (_, i) => {
    const weekStart = new Date(now.getTime() - (12 - i) * 7 * 24 * 60 * 60 * 1000)
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)
    const label = `${weekStart.getMonth() + 1}/${weekStart.getDate()}`
    let volume = 0; let count = 0
    for (const l of closedLoans ?? []) {
      const d = new Date(l.closing_date ?? l.funding_date)
      if (d >= weekStart && d < weekEnd) { volume += l.loan_amount ?? 0; count++ }
    }
    return { week: label, volume, count }
  })

  // ── fetch activity (last 7 days) ──
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const { data: activityEntries = [] } = await supabase
    .from('activity_log')
    .select('id, created_at, type, action, summary, contact_id, loan_id, metadata')
    .eq('user_id', user.id)
    .gte('created_at', sevenDaysAgo.toISOString())
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="min-h-screen bg-zinc-950 p-4 lg:p-6 space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-mono font-bold text-zinc-100">Pipeline Dashboard</h1>
          <p className="text-xs font-mono text-zinc-500 mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        {urgentFlags.length > 0 && (
          <div className="flex items-center gap-1.5 bg-amber-900/30 border border-amber-700 rounded-lg px-3 py-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-mono text-amber-400">{urgentFlags.length} urgent</span>
          </div>
        )}
      </div>

      {/* ── Urgent Flags ── */}
      {urgentFlags.length > 0 && <UrgentFlags flags={urgentFlags} />}

      {/* ── Pipeline KPIs ── */}
      <PipelineKPIs
        totalCount={totalCount}
        totalVolume={totalVolume}
        closedThisMonth={closedThisMonth}
        closedThisMonthVolume={closedThisMonthVolume}
        closedLastMonth={closedLastMonth}
        closedLastMonthVolume={closedLastMonthVolume}
        closingNext30={closingNext30}
        closingNext30Volume={closingNext30Volume}
        urgentCount={urgentFlags.length}
      />

      {/* ── Charts ── */}
      <PipelineCharts stageCounts={stageCounts} weeklyTrend={weeklyTrend} />

      {/* ── Briefing + Todo ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <DailyBriefingPanel />
        </div>
        <div>
          <TodoList />
        </div>
      </div>

      {/* ── Activity Log ── */}
      <RecentActivity entries={activityEntries ?? []} />
    </div>
  )
}
