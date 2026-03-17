import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { fmtCurrency } from '@/lib/formatters'

export const dynamic = 'force-dynamic'

const fmt = fmtCurrency

export default async function CommissionReportPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: loans = [] } = await supabase
    .from('loans')
    .select('id, borrower_name, borrower_first_name, borrower_last_name, loan_name, loan_amount, status, closing_date, funding_date, commission_amount')
    .eq('user_id', user.id)
    .order('closing_date', { ascending: false })

  const now = new Date()
  const thisYear = now.getFullYear()

  const funded = (loans ?? []).filter(l => {
    const s = (l.status ?? '').toLowerCase()
    const cd = l.closing_date || l.funding_date
    if (!cd || !['closed', 'funded'].includes(s)) return false
    return new Date(cd).getFullYear() === thisYear
  })

  const totalCommission = funded.reduce((sum, l) => sum + (l.commission_amount ?? 0), 0)
  const totalVolume = funded.reduce((sum, l) => sum + (l.loan_amount ?? 0), 0)

  return (
    <div className="min-h-screen bg-[#060b18] p-6">
      <Link href="/dashboard" className="text-xs font-mono text-zinc-500 hover:text-zinc-300 mb-4 inline-block">&larr; Dashboard</Link>
      <h1 className="text-xl font-mono font-bold text-zinc-100 mb-1">Commission Report</h1>
      <p className="text-xs font-mono text-zinc-500 mb-6">{thisYear} YTD &middot; {funded.length} loans &middot; {fmt(totalCommission)} gross commission</p>

      <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg overflow-hidden">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="border-b border-[#1e293b]">
              <th className="text-left px-4 py-3 text-[10px] text-zinc-500 uppercase tracking-wider">Borrower</th>
              <th className="text-right px-4 py-3 text-[10px] text-zinc-500 uppercase tracking-wider">Loan Amount</th>
              <th className="text-left px-4 py-3 text-[10px] text-zinc-500 uppercase tracking-wider">Status</th>
              <th className="text-right px-4 py-3 text-[10px] text-zinc-500 uppercase tracking-wider">Commission</th>
            </tr>
          </thead>
          <tbody>
            {funded.map((loan, i) => {
              const name = [loan.borrower_first_name, loan.borrower_last_name].filter(Boolean).join(' ') || loan.borrower_name || loan.loan_name || '(unnamed)'
              return (
                <tr key={loan.id} className={`hover:bg-[#1e293b]/30 ${i > 0 ? 'border-t border-[#1e293b]' : ''}`}>
                  <td className="px-4 py-2.5">
                    <Link href={`/dashboard/loans/${loan.id}`} className="text-zinc-200 hover:text-[#C9A84C]">{name}</Link>
                  </td>
                  <td className="px-4 py-2.5 text-right text-zinc-200">{fmt(loan.loan_amount ?? 0)}</td>
                  <td className="px-4 py-2.5 text-emerald-400">{loan.status}</td>
                  <td className="px-4 py-2.5 text-right text-[#C9A84C]">{loan.commission_amount ? fmt(loan.commission_amount) : '—'}</td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-[#334155] bg-[#1e293b]/50">
              <td className="px-4 py-3 text-zinc-100 font-semibold">Total ({funded.length} loans)</td>
              <td className="px-4 py-3 text-right text-blue-400 font-semibold">{fmt(totalVolume)}</td>
              <td />
              <td className="px-4 py-3 text-right text-[#C9A84C] font-semibold">{fmt(totalCommission)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
