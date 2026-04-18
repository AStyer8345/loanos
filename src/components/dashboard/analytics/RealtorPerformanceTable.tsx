/**
 * RealtorPerformanceTable — per-agent scoreboard.
 *
 * Columns: realtor, loans (all-time), funded, conversion rate, volume, avg
 * loan size. Sorted by funded volume desc. Intended to answer "which agents
 * actually convert and produce revenue?" vs. "who sends the most top-of-funnel".
 */

import { Card } from '@/components/ui/card'
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@/components/ui/table'
import { fmtK, fmtPct } from '@/lib/formatters'

export interface RealtorPerformanceRow {
  realtor: string
  loans: number
  funded: number
  volume: number
}

interface RealtorPerformanceTableProps {
  rows: RealtorPerformanceRow[]
  /** Cap the visible rows. Default 10. */
  limit?: number
}

export default function RealtorPerformanceTable({
  rows,
  limit = 10,
}: RealtorPerformanceTableProps) {
  const sorted = [...rows]
    .sort((a, b) => b.volume - a.volume || b.funded - a.funded)
    .slice(0, limit)

  return (
    <Card className="overflow-hidden">
      <div className="p-4 pb-2">
        <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
          Realtor Performance — Top {limit}
        </h3>
      </div>

      <Table className="font-mono">
        <TableHeader>
          <TableRow>
            <TableHead className="text-left w-8">#</TableHead>
            <TableHead className="text-left">Realtor</TableHead>
            <TableHead className="text-right">Loans</TableHead>
            <TableHead className="text-right">Funded</TableHead>
            <TableHead className="text-right">Conv. Rate</TableHead>
            <TableHead className="text-right">Volume</TableHead>
            <TableHead className="text-right">Avg Loan</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((row, i) => {
            const rate = row.loans > 0 ? (row.funded / row.loans) * 100 : 0
            const avg = row.funded > 0 ? row.volume / row.funded : 0
            return (
              <TableRow key={row.realtor}>
                <TableCell className="text-muted-foreground text-[11px]">{i + 1}</TableCell>
                <TableCell className="text-foreground">{row.realtor}</TableCell>
                <TableCell className="text-right text-foreground">{row.loans}</TableCell>
                <TableCell className="text-right text-emerald-400">{row.funded}</TableCell>
                <TableCell className="text-right text-primary">{fmtPct(rate)}</TableCell>
                <TableCell className="text-right text-foreground">{fmtK(row.volume)}</TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {avg > 0 ? fmtK(avg) : '—'}
                </TableCell>
              </TableRow>
            )
          })}
          {sorted.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-6">
                No realtor data yet
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  )
}
