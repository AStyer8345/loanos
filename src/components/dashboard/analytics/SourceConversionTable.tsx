/**
 * SourceConversionTable — lead-source efficacy.
 *
 * For each lead source category, shows:
 *   - Leads (total contacts tagged to that source)
 *   - Funded loans (contacts in that source whose loans closed)
 *   - Conversion rate (funded / leads)
 *   - Total funded volume
 *   - Avg loan size
 *
 * Sorted by conversion rate desc so the best channel rises.
 */

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@/components/ui/table'
import { fmtK, fmtPct } from '@/lib/formatters'
import { CATEGORY_SLUGS, type LeadSourceCategory } from '@/lib/leadSources'

export interface SourceConversionRow {
  source: LeadSourceCategory
  leads: number
  funded: number
  volume: number
}

interface SourceConversionTableProps {
  rows: SourceConversionRow[]
}

export default function SourceConversionTable({ rows }: SourceConversionTableProps) {
  // Sort: conversion rate desc, then volume desc as tiebreaker.
  const sorted = [...rows].sort((a, b) => {
    const aRate = a.leads > 0 ? a.funded / a.leads : 0
    const bRate = b.leads > 0 ? b.funded / b.leads : 0
    if (bRate !== aRate) return bRate - aRate
    return b.volume - a.volume
  })

  const totals = rows.reduce(
    (acc, r) => ({
      leads: acc.leads + r.leads,
      funded: acc.funded + r.funded,
      volume: acc.volume + r.volume,
    }),
    { leads: 0, funded: 0, volume: 0 },
  )
  const overallRate = totals.leads > 0 ? (totals.funded / totals.leads) * 100 : 0

  return (
    <Card className="overflow-hidden">
      <div className="p-4 pb-2">
        <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
          Conversion by Lead Source
        </h3>
      </div>

      <Table className="font-mono">
        <TableHeader>
          <TableRow>
            <TableHead className="text-left">Source</TableHead>
            <TableHead className="text-right">Leads</TableHead>
            <TableHead className="text-right">Funded</TableHead>
            <TableHead className="text-right">Conv. Rate</TableHead>
            <TableHead className="text-right">Volume</TableHead>
            <TableHead className="text-right">Avg Loan</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((row) => {
            const rate = row.leads > 0 ? (row.funded / row.leads) * 100 : 0
            const avg = row.funded > 0 ? row.volume / row.funded : 0
            return (
              <TableRow key={row.source}>
                <TableCell>
                  <Link
                    href={`/dashboard/contacts/by-source/${CATEGORY_SLUGS[row.source]}`}
                    className="text-foreground hover:text-primary"
                  >
                    {row.source}
                  </Link>
                </TableCell>
                <TableCell className="text-right text-foreground">{row.leads}</TableCell>
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
              <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                No lead source data yet
              </TableCell>
            </TableRow>
          )}
        </TableBody>
        {sorted.length > 0 && (
          <tfoot>
            <TableRow className="border-t-2 border-input">
              <TableCell className="text-foreground font-semibold">Total</TableCell>
              <TableCell className="text-right text-foreground font-semibold">
                {totals.leads}
              </TableCell>
              <TableCell className="text-right text-emerald-400 font-semibold">
                {totals.funded}
              </TableCell>
              <TableCell className="text-right text-primary font-semibold">
                {fmtPct(overallRate)}
              </TableCell>
              <TableCell className="text-right text-foreground font-semibold">
                {fmtK(totals.volume)}
              </TableCell>
              <TableCell />
            </TableRow>
          </tfoot>
        )}
      </Table>
    </Card>
  )
}
