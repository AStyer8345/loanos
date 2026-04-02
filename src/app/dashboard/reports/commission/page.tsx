import { createClient } from '@/lib/supabase/server'
import { getOrganization } from '@/lib/getOrganization'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { fmtCurrency } from '@/lib/formatters'
import { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell } from '@/components/ui/table'
import { Card } from '@/components/ui/card'

export const dynamic = 'force-dynamic'

const fmt = fmtCurrency

export default async function CommissionReportPage() {
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
    .select('id, borrower_name, borrower_first_name, borrower_last_name, loan_name, loan_amount, status, closing_date, funding_date, commission_amount')
    .eq('organization_id', organizationId)
    .order('closing_date', { ascending: false })

  const now = new Date()
  const thisYear = now.getFullYear()

  const funded = (loans ?? []).filter(l => {
    const s = (l.status ?? '').toLowerCase()
    const cd = l.closing_date || l.funding_date
    // Match all variations: "funded", "closed", "FUNDED", "Funded / Closed", "clear_to_close" etc.
    const isFunded = s.includes('funded') || s.includes('closed') || s === 'clear_to_close' || s === 'ctc_issued'
    if (!cd || !isFunded) return false
    return new Date(cd).getFullYear() === thisYear
  })

  const totalCommission = funded.reduce((sum, l) => sum + (l.commission_amount ?? 0), 0)
  const totalVolume = funded.reduce((sum, l) => sum + (l.loan_amount ?? 0), 0)

  return (
    <div className="min-h-screen bg-[var(--bg)] p-6">
      <Link href="/dashboard" className="text-xs font-mono text-zinc-500 hover:text-zinc-300 mb-4 inline-block">&larr; Dashboard</Link>
      <h1 className="text-xl font-mono font-bold text-zinc-100 mb-1">Commission Report</h1>
      <p className="text-xs font-mono text-zinc-500 mb-6">{thisYear} YTD &middot; {funded.length} loans &middot; {fmt(totalCommission)} gross commission</p>

      <Card className="overflow-hidden">
        <Table className="font-mono">
          <TableHeader>
            <TableRow>
              <TableHead className="text-left">Borrower</TableHead>
              <TableHead className="text-right">Loan Amount</TableHead>
              <TableHead className="text-left">Status</TableHead>
              <TableHead className="text-right">Commission</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {funded.map((loan) => {
              const name = [loan.borrower_first_name, loan.borrower_last_name].filter(Boolean).join(' ') || loan.borrower_name || loan.loan_name || '(unnamed)'
              return (
                <TableRow key={loan.id}>
                  <TableCell>
                    <Link href={`/dashboard/loans/${loan.id}`} className="text-zinc-200 hover:text-primary">{name}</Link>
                  </TableCell>
                  <TableCell className="text-right text-zinc-200">{fmt(loan.loan_amount ?? 0)}</TableCell>
                  <TableCell className="text-emerald-400">{loan.status}</TableCell>
                  <TableCell className="text-right text-primary">{loan.commission_amount ? fmt(loan.commission_amount) : '—'}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
          <TableFooter>
            <TableRow className="border-t-2 border-input">
              <TableCell className="text-zinc-100 font-semibold">Total ({funded.length} loans)</TableCell>
              <TableCell className="text-right text-blue-400 font-semibold">{fmt(totalVolume)}</TableCell>
              <TableCell />
              <TableCell className="text-right text-primary font-semibold">{fmt(totalCommission)}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </Card>
    </div>
  )
}
