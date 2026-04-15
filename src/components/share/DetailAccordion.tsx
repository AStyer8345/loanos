'use client'

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'
import type { DisplayData, ScenarioDisplayRow, HorizonAnalysis } from '@/lib/scenarios/displayData'
import { GOLD, TEXT, MUTED, BORDER, fmtCurrency } from './constants'

interface DetailAccordionProps {
  displayData: DisplayData
}

// ─── Shared table helpers ─────────────────────────────────────────

function DetailTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto -mx-1">
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 400 }}>
        {children}
      </table>
    </div>
  )
}

function THead({ labels }: { labels: string[] }) {
  return (
    <thead>
      <tr>
        <th style={{ ...thStyle, textAlign: 'left' }}>Metric</th>
        {labels.map((l, i) => (
          <th key={i} style={{ ...thStyle, textAlign: 'right' }}>{l}</th>
        ))}
      </tr>
    </thead>
  )
}

function TRow({
  label,
  values,
  bold,
  highlight,
}: {
  label: string
  values: string[]
  bold?: boolean
  highlight?: boolean
}) {
  return (
    <tr>
      <td style={{
        ...cellStyle,
        fontWeight: bold ? 600 : 400,
        color: highlight ? GOLD : MUTED,
      }}>
        {label}
      </td>
      {values.map((v, i) => (
        <td key={i} style={{
          ...cellStyle,
          textAlign: 'right',
          fontWeight: bold ? 600 : 400,
          color: highlight ? GOLD : TEXT,
          fontFamily: "'IBM Plex Mono', monospace",
        }}>
          {v}
        </td>
      ))}
    </tr>
  )
}

const thStyle: React.CSSProperties = {
  padding: '8px 12px',
  fontSize: 10,
  fontWeight: 600,
  color: MUTED,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  borderBottom: `1px solid ${BORDER}`,
}

const cellStyle: React.CSSProperties = {
  padding: '7px 12px',
  fontSize: 11,
  color: TEXT,
  borderBottom: `1px solid rgba(255,255,255,0.04)`,
}

// ─── Horizon Analysis ─────────────────────────────────────────────

function HorizonDetail({ displayData }: { displayData: DisplayData }) {
  const { rows, mode } = displayData
  const labels = rows.map(r => r.label)
  const hasHorizon = rows.some(r => r.horizonAnalysis)
  if (!hasHorizon) return null

  const ha = (r: ScenarioDisplayRow): HorizonAnalysis | undefined => r.horizonAnalysis

  return (
    <DetailTable>
      <THead labels={labels} />
      <tbody>
        {/* 5-Year */}
        <tr>
          <td colSpan={labels.length + 1} style={{
            padding: '10px 12px 4px', fontSize: 9, fontWeight: 700,
            letterSpacing: '0.08em', textTransform: 'uppercase', color: GOLD,
          }}>
            5-Year Analysis
          </td>
        </tr>
        <TRow label="Total P&I Paid" values={rows.map(r => fmtCurrency(ha(r)?.totalPIPaid5yr ?? 0))} />
        <TRow label="Principal Paid" values={rows.map(r => fmtCurrency(ha(r)?.principalPaid5yr ?? 0))} />
        <TRow label="Balance Remaining" values={rows.map(r => fmtCurrency(ha(r)?.balanceAt5yr ?? 0))} />
        <TRow label="Interest Paid" values={rows.map(r => fmtCurrency(ha(r)?.interestMIPaid5yr ?? 0))} />
        <TRow label="Net Savings" values={rows.map(r => {
          const ns = ha(r)?.netSavings5yr ?? 0
          return ns > 0 ? fmtCurrency(ns) : ns < 0 ? `(${fmtCurrency(Math.abs(ns))})` : '\u2014'
        })} highlight />

        {/* 15-Year */}
        <tr>
          <td colSpan={labels.length + 1} style={{
            padding: '10px 12px 4px', fontSize: 9, fontWeight: 700,
            letterSpacing: '0.08em', textTransform: 'uppercase', color: GOLD,
          }}>
            15-Year Analysis
          </td>
        </tr>
        {mode === 'purchase' && (
          <TRow label="Home Value (4%/yr)" values={rows.map(r => fmtCurrency(ha(r)?.homeValue15yr ?? 0))} />
        )}
        <TRow label="Loan Balance" values={rows.map(r => fmtCurrency(ha(r)?.balanceAt15yr ?? 0))} />
        {mode === 'purchase' && (
          <TRow label="Equity" values={rows.map(r => fmtCurrency(ha(r)?.equity15yr ?? 0))} />
        )}
        <TRow label="Total PITI Paid" values={rows.map(r => fmtCurrency(ha(r)?.totalPITI15yr ?? 0))} />
        <TRow label="Interest at 15yr" values={rows.map(r => fmtCurrency(ha(r)?.interestPaid15yr ?? 0))} bold />
      </tbody>
    </DetailTable>
  )
}

// ─── Main Component ───────────────────────────────────────────────

export default function DetailAccordion({ displayData }: DetailAccordionProps) {
  const hasHorizon = displayData.rows.some(r => r.horizonAnalysis)

  // "Full Scenario Comparison" removed — ScenarioComparisonTable covers it above.
  // Only render when there's unique horizon data (5yr / 15yr projections).
  if (!hasHorizon) return null

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(20,20,20,0.5)', border: `1px solid ${BORDER}` }}>
      <p className="text-[10px] font-semibold uppercase tracking-widest px-5 pt-5 pb-2" style={{ color: GOLD }}>
        Detailed Analysis
      </p>
      <Accordion type="multiple" className="px-5 pb-2">
        <AccordionItem value="horizon" className="border-b-0" style={{ borderColor: BORDER }}>
          <AccordionTrigger className="text-xs font-medium hover:no-underline" style={{ color: TEXT }}>
            5-Year &amp; 15-Year Projections
          </AccordionTrigger>
          <AccordionContent>
            <HorizonDetail displayData={displayData} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
