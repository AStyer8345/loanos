'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

interface LoanRow {
  id: string
  borrower_first_name: string | null
  borrower_last_name: string | null
  loan_name: string | null
  loan_amount: number | null
  loan_type: string | null
  loan_program: string | null
  loan_term: number | null
  status: string | null
  estimated_closing_date: string | null
  closing_date: string | null
}

interface RecentLoansProps {
  loans: LoanRow[]
}

function fmtCurrency(n: number | null): string {
  if (n == null) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0,
  }).format(n)
}

function fmtDate(s: string | null): string {
  if (!s) return '—'
  return new Date(s + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-zinc-600 text-xs font-mono">—</span>
  const s = status.toLowerCase()
  let cls = 'bg-zinc-800 text-zinc-400 border border-zinc-600'
  if (['closed', 'funded'].some(v => s.includes(v)))
    cls = 'bg-emerald-900/30 text-emerald-400 border border-emerald-800'
  else if (['clear to close', 'ctc'].some(v => s.includes(v)))
    cls = 'bg-indigo-900/30 text-indigo-300 border border-indigo-700'
  else if (['underwriting', 'conditional', 'approved'].some(v => s.includes(v)))
    cls = 'bg-amber-900/20 text-amber-400 border border-amber-800'
  else if (['processing', 'submitted'].some(v => s.includes(v)))
    cls = 'bg-orange-900/20 text-orange-400 border border-orange-800'
  else if (['pre-app', 'pre_app', 'pre-approval', 'lead', 'application'].some(v => s.includes(v)))
    cls = 'bg-blue-900/20 text-blue-400 border border-blue-800'
  else if (['cancelled', 'denied', 'withdrawn', 'dead'].some(v => s.includes(v)))
    cls = 'bg-red-900/20 text-red-400 border border-red-800'

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-medium ${cls}`}>
      {status}
    </span>
  )
}

function productLabel(loan: LoanRow): string {
  const parts: string[] = []
  if (loan.loan_type) parts.push(loan.loan_type)
  if (loan.loan_term) parts.push(`${loan.loan_term / 12}yr`)
  if (loan.loan_program && loan.loan_program !== loan.loan_type) parts.push(loan.loan_program)
  return parts.join(' ') || '—'
}

export default function RecentLoans({ loans }: RecentLoansProps) {
  return (
    <div className="bg-zinc-900 rounded shadow-lg shadow-black/50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <span className="text-xs font-mono font-semibold text-zinc-400 uppercase tracking-widest">
          Recent Loans
        </span>
        <Link
          href="/dashboard/loans"
          className="flex items-center gap-1 text-xs font-mono text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          View all <ArrowRight size={11} />
        </Link>
      </div>

      {loans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-zinc-600 font-mono">
          <p className="text-sm">No loans yet</p>
          <Link href="/dashboard/loans" className="text-xs text-indigo-400 mt-1 hover:underline">
            Add your first loan →
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left px-4 py-2.5 text-[10px] font-mono font-semibold text-zinc-500 uppercase tracking-wider">Borrower</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-mono font-semibold text-zinc-500 uppercase tracking-wider hidden sm:table-cell">Product</th>
                <th className="text-right px-4 py-2.5 text-[10px] font-mono font-semibold text-zinc-500 uppercase tracking-wider">Amount</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-mono font-semibold text-zinc-500 uppercase tracking-wider">Stage</th>
                <th className="text-right px-4 py-2.5 text-[10px] font-mono font-semibold text-zinc-500 uppercase tracking-wider hidden md:table-cell">Close</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((loan, i) => {
                const name = [loan.borrower_first_name, loan.borrower_last_name]
                  .filter(Boolean).join(', ') || loan.loan_name || '(unnamed)'
                const closeDate = loan.estimated_closing_date || loan.closing_date
                return (
                  <tr
                    key={loan.id}
                    className={`hover:bg-zinc-800/50 transition-colors group ${i !== 0 ? 'border-t border-zinc-800' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/loans/${loan.id}`}
                        className="font-mono font-medium text-zinc-200 group-hover:text-indigo-300 transition-colors truncate block max-w-[180px]"
                      >
                        {name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-zinc-500 font-mono text-xs hidden sm:table-cell">
                      {productLabel(loan)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-medium text-zinc-200">
                      {fmtCurrency(loan.loan_amount)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={loan.status} />
                    </td>
                    <td className="px-4 py-3 text-right text-xs font-mono text-zinc-500 hidden md:table-cell">
                      {fmtDate(closeDate)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
