import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get all active loans
  const { data: loans, error } = await supabase
    .from('loans')
    .select('id, status, loan_amount, closing_date, est_closing_date, funding_date, pre_approval_expiry_date, borrower_name, loan_name, created_at')
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
  const next30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

  // Stage groupings
  const stageMap: Record<string, string> = {
    'lead': 'Lead',
    'pre_approval': 'Pre-App',
    'pre-approval': 'Pre-App',
    'application': 'Application',
    'processing': 'Processing',
    'underwriting': 'Underwriting',
    'conditional_approval': 'Cond. Approval',
    'conditional-approval': 'Cond. Approval',
    'clear_to_close': 'Clear to Close',
    'clear-to-close': 'Clear to Close',
    'closing': 'Closing',
    'closed': 'Closed',
    'funded': 'Funded',
  }

  const stageCounts: Record<string, { count: number; volume: number }> = {}
  let totalVolume = 0
  let totalCount = 0
  let closedThisMonth = 0
  let closedThisMonthVolume = 0
  let closedLastMonth = 0
  let closedLastMonthVolume = 0
  let closingNext30 = 0
  let closingNext30Volume = 0

  const urgentFlags: Array<{ id: string; name: string; flag: string; date: string }> = []

  for (const loan of loans || []) {
    const status = (loan.status || 'unknown').toLowerCase()
    const stageName = stageMap[status] || loan.status || 'Unknown'
    const amount = loan.loan_amount || 0

    if (!stageCounts[stageName]) stageCounts[stageName] = { count: 0, volume: 0 }
    stageCounts[stageName].count++
    stageCounts[stageName].volume += amount

    // Exclude closed/funded from "active" totals
    if (!['closed', 'funded'].includes(status)) {
      totalCount++
      totalVolume += amount
    }

    // Closed this month
    const closingDate = loan.closing_date || loan.funding_date
    if (closingDate) {
      const cd = new Date(closingDate)
      if (cd >= thisMonthStart && cd <= now && ['closed', 'funded'].includes(status)) {
        closedThisMonth++
        closedThisMonthVolume += amount
      }
      if (cd >= lastMonthStart && cd <= lastMonthEnd && ['closed', 'funded'].includes(status)) {
        closedLastMonth++
        closedLastMonthVolume += amount
      }
    }

    // Est closing in next 30 days
    const estClose = loan.est_closing_date
    if (estClose) {
      const ec = new Date(estClose)
      if (ec >= now && ec <= next30Days) {
        closingNext30++
        closingNext30Volume += amount
      }
    }

    // Urgent: pre-approval expiring in 7 days
    if (loan.pre_approval_expiry_date) {
      const exp = new Date(loan.pre_approval_expiry_date)
      if (exp >= now && exp <= next7Days) {
        urgentFlags.push({
          id: loan.id,
          name: loan.borrower_name || loan.loan_name || 'Unknown',
          flag: 'Pre-approval expiring',
          date: loan.pre_approval_expiry_date,
        })
      }
    }

    // Urgent: loan past est closing date and not closed
    if (loan.est_closing_date && !['closed', 'funded'].includes(status)) {
      const ec = new Date(loan.est_closing_date)
      if (ec < now) {
        urgentFlags.push({
          id: loan.id,
          name: loan.borrower_name || loan.loan_name || 'Unknown',
          flag: 'Past est. closing date',
          date: loan.est_closing_date,
        })
      }
    }
  }

  // Closing trend: last 90 days by week
  const { data: closedLoans } = await supabase
    .from('loans')
    .select('closing_date, funding_date, loan_amount')
    .eq('user_id', user.id)
    .in('status', ['closed', 'funded'])
    .gte('closing_date', ninetyDaysAgo.toISOString())

  // Build weekly buckets
  const weeklyTrend: Array<{ week: string; volume: number; count: number }> = []
  for (let i = 12; i >= 0; i--) {
    const weekStart = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000)
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)
    const label = `${weekStart.getMonth() + 1}/${weekStart.getDate()}`
    let vol = 0
    let cnt = 0
    for (const l of closedLoans || []) {
      const d = new Date(l.closing_date || l.funding_date)
      if (d >= weekStart && d < weekEnd) {
        vol += l.loan_amount || 0
        cnt++
      }
    }
    weeklyTrend.push({ week: label, volume: vol, count: cnt })
  }

  return NextResponse.json({
    totalCount,
    totalVolume,
    stageCounts,
    closedThisMonth,
    closedThisMonthVolume,
    closedLastMonth,
    closedLastMonthVolume,
    closingNext30,
    closingNext30Volume,
    weeklyTrend,
    urgentFlags,
  })
}
