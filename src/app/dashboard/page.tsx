import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AlertTriangle } from 'lucide-react'
import UrgentFlags from '@/components/dashboard/UrgentFlags'
import PipelineSummary from '@/components/dashboard/PipelineSummary'
import RecentLoans from '@/components/dashboard/RecentLoans'
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
    .select('id, status, loan_amount, closing_date, estimated_closing_date, funding_date, pre_approval_expiry_date, borrower_first_name, borrower_last_name, loan_name, loan_type, loan_program, loan_term, created_at')
    .eq('user_id', user.id)
    .order('estimated_closing_date', { ascending: true })

  // ── compute pipeline stats ──
  const now = new Date()
  const next7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const stageCounts: Record<string, { count: number; volume: number }> = {}
  let totalCount = 0
  let totalVolume = 0
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

  // ── recent loans (active only, up to 8, sorted by soonest closing) ──
  const recentLoans = (loans ?? [])
    .filter(l => !['closed', 'funded'].includes((l.status ?? '').toLowerCase()))
    .slice(0, 8)

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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-mono font-bold text-zinc-100">Dashboard</h1>
          <p className="text-xs font-mono text-zinc-500 mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {urgentFlags.length > 0 && (
            <div className="flex items-center gap-1.5 bg-amber-900/30 border border-amber-700 rounded-lg px-3 py-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-mono text-amber-400">{urgentFlags.length} urgent</span>
            </div>
          )}
          <a
            href="/dashboard/loans"
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-semibold rounded transition-colors"
          >
            + New Loan
          </a>
        </div>
      </div>

      {/* ── Urgent Flags ── */}
      {urgentFlags.length > 0 && <UrgentFlags flags={urgentFlags} />}

      {/* ── Pipeline Summary ── */}
      <PipelineSummary
        stageCounts={stageCounts}
        totalCount={totalCount}
        totalVolume={totalVolume}
      />

      {/* ── Quick Actions ── */}
      <div className="flex flex-wrap gap-2">
        {[
          { icon: '✉️', label: 'Send PA Email',  href: '/dashboard/loans' },
          { icon: '🔒', label: 'Lock Rate',       href: '/dashboard/loans' },
          { icon: '📋', label: 'Order Appraisal', href: '/dashboard/loans' },
          { icon: '📎', label: 'Request Docs',    href: '/dashboard/loans' },
        ].map(({ icon, label, href }) => (
          <a
            key={label}
            href={href}
            className="flex items-center gap-2 px-3 py-2 bg-zinc-900 rounded shadow shadow-black/40 text-xs font-mono text-zinc-300 border border-zinc-700 hover:border-indigo-500/50 hover:text-indigo-300 hover:bg-zinc-800 transition-colors"
          >
            <span>{icon}</span>
            <span>{label}</span>
          </a>
        ))}
      </div>

      {/* ── Recent Loans + Activity ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RecentLoans loans={recentLoans} />
        </div>
        <div>
          <RecentActivity entries={activityEntries ?? []} />
        </div>
      </div>

    </div>
  )
}
