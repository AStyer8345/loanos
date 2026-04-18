/**
 * StageAgingTable — pipeline health view.
 *
 * Shows active loans sorted by days-in-stage (stalest first) with a color
 * tier: green <= 14d, amber <= 30d, red > 30d. Links out to each loan's
 * detail page.
 *
 * Data source: public.pipeline_stage_aging() RPC (migration 090).
 */

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@/components/ui/table'
import { fmtK, fmtRelative } from '@/lib/formatters'
import { statusHex } from '@/lib/constants/loan-stages'

export interface StageAgingRow {
  loan_id: string
  loan_name: string | null
  borrower_name: string | null
  status: string | null
  loan_amount: number | null
  last_changed_at: string | null
  days_in_stage: number
}

interface StageAgingTableProps {
  rows: StageAgingRow[]
  /** Max rows to render. Default 15. */
  limit?: number
}

function agingClass(days: number): string {
  if (days > 30) return 'text-red-400'
  if (days > 14) return 'text-amber-400'
  return 'text-emerald-400'
}

export default function StageAgingTable({ rows, limit = 15 }: StageAgingTableProps) {
  // Sort stalest-first; cap to `limit` so the analytics page stays tight.
  const sorted = [...rows].sort((a, b) => b.days_in_stage - a.days_in_stage).slice(0, limit)
  const stuck = rows.filter(r => r.days_in_stage > 30).length

  return (
    <Card className="overflow-hidden">
      <div className="p-4 pb-2 flex items-baseline justify-between">
        <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
          Pipeline Health — Stage Aging
        </h3>
        <span className="text-[10px] font-mono text-muted-foreground">
          {rows.length} active &middot;{' '}
          <span className={stuck > 0 ? 'text-red-400' : 'text-muted-foreground'}>
            {stuck} stuck &gt; 30d
          </span>
        </span>
      </div>

      {sorted.length === 0 ? (
        <div className="text-xs font-mono text-muted-foreground py-8 text-center">
          No active loans
        </div>
      ) : (
        <Table className="font-mono">
          <TableHeader>
            <TableRow>
              <TableHead className="text-left">Borrower</TableHead>
              <TableHead className="text-left">Stage</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Days in Stage</TableHead>
              <TableHead className="text-right">Last Change</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((row) => {
              const name = row.borrower_name || row.loan_name || '(unnamed)'
              const color = statusHex(row.status)
              return (
                <TableRow key={row.loan_id}>
                  <TableCell>
                    <Link
                      href={`/dashboard/loans/${row.loan_id}`}
                      className="text-foreground hover:text-primary"
                    >
                      {name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <span
                      className="inline-block px-2 py-0.5 rounded text-[10px]"
                      style={{ backgroundColor: `${color}33`, color }}
                    >
                      {row.status || '—'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-foreground">
                    {fmtK(row.loan_amount)}
                  </TableCell>
                  <TableCell className={`text-right ${agingClass(row.days_in_stage)}`}>
                    {row.days_in_stage}d
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground text-[11px]">
                    {fmtRelative(row.last_changed_at)}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}
    </Card>
  )
}
