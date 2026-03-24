import { createClient } from '@/lib/supabase/server'
import { getOrganization } from '@/lib/getOrganization'
import { redirect } from 'next/navigation'
import DashboardClient from '@/components/dashboard/DashboardClient'
import { toDashboardStage, DASHBOARD_STAGES, INACTIVE_STATUSES } from '@/lib/constants/loan-stages'
import { rankLoans, type LoanForScoring } from '@/lib/scoreLoans'
import type { ActivityEntry } from '@/app/dashboard/contacts/[id]/ContactRecordView'
import { type HotLead } from '@/components/dashboard/HotLeadsWidget'

export const dynamic = 'force-dynamic'

const INACTIVE = new Set(INACTIVE_STATUSES.map(s => s.toLowerCase()))

const HOT_KEYWORDS = [
  'follow up', 'call back', 'interested', 'ready', 'wants to',
  'motivated', 'urgent', 'asap', 'soon', 'this week', 'next week',
  'remind', 'reach out', 'needs to', 'looking to', 'actively',
]

function scoreNotes(notes: string): number {
  const lower = notes.toLowerCase()
  return HOT_KEYWORDS.reduce((score, kw) => score + (lower.includes(kw) ? 1 : 0), 0)
}

export default async function DashboardPage() {
  let organizationId: string
  try {
    const ctx = await getOrganization()
    organizationId = ctx.organizationId
  } catch {
    redirect('/auth/login')
  }
  const supabase = createClient()

  const { data: loans = [] } = await supabase
    .from('loans')
    .select('id, status, loan_amount, closing_date, estimated_closing_date, funding_date, pre_approval_expiry_date, borrower_first_name, borrower_last_name, loan_name, loan_type, loan_program, loan_term, interest_rate, commission_amount, contact_id, created_at, updated_at, lender_name')
    .eq('organization_id', organizationId)
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
  }
  // staleLoans computed after lastActivityMap is built below

  const stageData = DASHBOARD_STAGES.map(stage => ({
    stage,
    count: stageCounts[stage]?.count ?? 0,
    volume: stageCounts[stage]?.volume ?? 0,
    commission: stageCounts[stage]?.commission ?? 0,
  }))

  const recentLoans = (loans ?? [])
    .filter(l => !INACTIVE.has((l.status ?? '').toLowerCase()))
    .slice(0, 8)

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
        staleLoans.push({ id: loan.id, name: borrowerName, daysSinceActivity: daysSince })
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

  // ── New Leads (contacts without a loan, last 30 days) ────────────────────
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  // Hot leads query — contacts with follow-up intent notes updated in last 30 days
  const thirtyDaysAgoIso = thirtyDaysAgo.toISOString()
  const { data: recentContacts = [] } = await supabase
    .from('contacts')
    .select('id, first_name, last_name, notes, updated_at')
    .eq('organization_id', organizationId)
    .not('notes', 'is', null)
    .gte('updated_at', thirtyDaysAgoIso)
    .limit(20)

  const hotLeads: HotLead[] = (recentContacts ?? [])
    .map(c => ({
      id: c.id,
      first_name: c.first_name ?? 'Unknown',
      last_name: c.last_name ?? null,
      notes: c.notes as string,
      daysAgo: Math.floor((now.getTime() - new Date(c.updated_at).getTime()) / (1000 * 60 * 60 * 24)),
      score: scoreNotes(c.notes as string),
    }))
    .filter(h => h.score > 0)
    .sort((a, b) => b.score - a.score || a.daysAgo - b.daysAgo)
    .slice(0, 5)

  // Get all contact_ids already tied to a loan so we can exclude them
  const { data: loanContactRows = [] } = await supabase
    .from('loans')
    .select('contact_id')
    .eq('organization_id', organizationId)
    .not('contact_id', 'is', null)

  const contactIdsWithLoans = (loanContactRows ?? [])
    .map(r => r.contact_id as string)
    .filter(Boolean)

  // Cast via unknown — referral_type/lead_source not yet in generated DB types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const contactsTable = supabase.from('contacts') as any

  let leadsQuery = contactsTable
    .select('id, first_name, last_name, email, phone, referral_type, lead_source, created_at, stage')
    .eq('organization_id', organizationId)
    .gte('created_at', thirtyDaysAgo.toISOString())
    .order('created_at', { ascending: false })
    .limit(20)

  if (contactIdsWithLoans.length > 0) {
    leadsQuery = leadsQuery.not('id', 'in', `(${contactIdsWithLoans.join(',')})`)
  }

  const { data: newLeads = [] } = await leadsQuery as { data: Array<{
    id: string; first_name: string | null; last_name: string | null
    email: string | null; phone: string | null; created_at: string
    stage: string | null; referral_type: string | null; lead_source: string | null
  }> | null }

  // ── Recent Applications (new loans in last 30 days) ───────────────────────
  const { data: recentApplications = [] } = await supabase
    .from('loans')
    .select('id, loan_name, borrower_first_name, borrower_last_name, loan_amount, status, loan_type, created_at, contact_id')
    .eq('organization_id', organizationId)
    .gte('created_at', thirtyDaysAgo.toISOString())
    .not('status', 'in', '("Closed","Funded","Cancelled","Denied","Withdrawn")')
    .order('created_at', { ascending: false })
    .limit(10)

  // ── Activity feed ─────────────────────────────────────────────────────────
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const { data: rawActivity = [] } = await supabase
    .from('activity_log')
    .select('id, created_at, type, action, summary, contact_id, loan_id, metadata')
    .gte('created_at', sevenDaysAgo.toISOString())
    .order('created_at', { ascending: false })
    .limit(100)

  const activityEntries = ((rawActivity ?? []).filter(e => {
    const action = (e.action ?? '').toLowerCase()
    const summary = (e.summary ?? '').toLowerCase()
    return !action.includes('webhook.error') && !action.includes('error_loan_not_found')
      && !action.startsWith('arive.webhook') && !summary.includes('webhook error')
      && !action.includes('error_')
  }) as unknown as ActivityEntry[])

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
      scoredLoans={scoredLoans}
      recentApplications={recentApplications ?? []}
      newLeads={newLeads ?? []}
      hotLeads={hotLeads}
    />
  )
}
