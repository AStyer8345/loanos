import { createClient } from '@/lib/supabase/server'
import { getOrganization } from '@/lib/getOrganization'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { fmtCurrency, fmtK, fmtDate } from '@/lib/formatters'

export const dynamic = 'force-dynamic'

const fmt = fmtCurrency

export default async function VolumeReportPage() {
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
    .select('id, borrower_name, borrower_first_name, borrower_last_name, loan_name, loan_amount, status, closing_date, funding_date, estimated_closing_date')
    .eq('organization_id', organizationId)
    .order('closing_date', { ascending: false })

  const now = new Date()
  const thisYear = now.getFullYear()

  const funded = (loans ?? []).filter(l => {
    const s = (l.status ?? '').toLowerCase()
    const cd = l.closing_date || l.funding_date
    if (!cd || !['closed', 'funded'].includes(s)) return false
    return new Date(cd).getFullYear() === thisYear
  })

  const totalVolume = funded.reduce((sum, l) => sum + (l.loan_amount ?? 0), 0)

  return (
    <div className="min-h-screen bg-[#060b18] p-6">
      <Link href="/dashboard" className="text-xs font-mono text-zinc-500 hover:text-zinc-300 mb-4 inline-block">&larr; Dashboard</Link>
      <h1 className="text-xl font-mono font-bold text-zinc-100 mb-1">Volume Report</h1>
      <p className="text-xs font-mono text-zinc-500 mb-6">{thisYear} YTD &middot; {funded.length} loans &middot; {fmtK(totalVolume)} total volume</p>

      <div className="bg-card border border-input rounded-lg overflow-hidden">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="border-b border-input">
              <th className="text-left px-4 py-3 text-[10px] text-zinc-500 uppercase tracking-wider">Borrower</th>
              <th className="text-right px-4 py-3 text-[10px] text-zinc-500 uppercase tracking-wider">Loan Amount</th>
              <th className="text-left px-4 py-3 text-[10px] text-zinc-500 uppercase tracking-wider">Status</th>
              <th className="text-right px-4 py-3 text-[10px] text-zinc-500 uppercase tracking-wider">Close Date</th>
            </tr>
          </thead>
          <tbody>
            {funded.map((loan, i) => {
              const name = [loan.borrower_first_name, loan.borrower_last_name].filter(Boolean).join(' ') || loan.borrower_name || loan.loan_name || '(unnamed)'
              const cd = loan.closing_date || loan.funding_date
              return (
                <tr key={loan.id} className={`hover:bg-input/30 ${i > 0 ? 'border-t border-input' : ''}`}>
                  <td className="px-4 py-2.5">
                    <Link href={`/dashboard/loans/${loan.id}`} className="text-zinc-200 hover:text-[#C9A84C]">{name}</Link>
                  </td>
                  <td className="px-4 py-2.5 text-right text-zinc-200">{fmt(loan.loan_amount ?? 0)}</td>
                  <td className="px-4 py-2.5 text-emerald-400">{loan.status}</td>
                  <td className="px-4 py-2.5 text-right text-zinc-500">{fmtDate(cd)}</td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-[#334155] bg-[#1e293b]/50">
              <td className="px-4 py-3 text-zinc-100 font-semibold">Total ({funded.length} loans)</td>
              <td className="px-4 py-3 text-right text-blue-400 font-semibold">{fmt(totalVolume)}</td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
