import { Crown } from 'lucide-react'
import type { ScenarioDisplayRow } from '@/lib/scenarios/displayData'
import { GOLD, TEXT, MUTED, CARD_BG, BORDER, fmtCurrency, fmtRate } from './constants'
import DeltaChip from './DeltaChip'

export interface DeltaItem {
  value: number
  label: string
  type: 'savings' | 'cost' | 'neutral'
}

interface OptionCardProps {
  row: ScenarioDisplayRow
  isWinner: boolean
  deltas: DeltaItem[]
  mode: 'purchase' | 'refinance'
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] font-medium uppercase tracking-wider" style={{ color: MUTED }}>
        {label}
      </p>
      <p className="text-sm font-semibold" style={{ color: TEXT, fontFamily: "'IBM Plex Mono', monospace" }}>
        {value}
      </p>
    </div>
  )
}

export default function OptionCard({ row, isWinner, deltas, mode }: OptionCardProps) {
  const breakdownItems: { label: string; value: number }[] = [
    { label: 'Principal & Interest', value: row.monthlyPI },
    { label: 'Property Tax', value: row.propertyTaxes },
    { label: 'Insurance', value: row.homeownersInsurance },
    ...(row.hoa > 0 ? [{ label: 'HOA', value: row.hoa }] : []),
    ...(row.pmi > 0 ? [{ label: 'PMI', value: row.pmi }] : []),
  ].filter(item => item.value > 0)

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4 transition-all"
      style={{
        background: CARD_BG,
        border: `1px solid ${isWinner ? `${GOLD}50` : BORDER}`,
        boxShadow: isWinner ? `0 0 24px rgba(201,168,76,0.08)` : 'none',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold" style={{ color: TEXT }}>
            {row.label}
          </h3>
          <span
            className="text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md"
            style={{
              background: 'rgba(255,255,255,0.05)',
              color: MUTED,
              border: `1px solid ${BORDER}`,
            }}
          >
            {row.loanType}
          </span>
        </div>
        {isWinner && (
          <span
            className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
            style={{
              background: `${GOLD}15`,
              color: GOLD,
              border: `1px solid ${GOLD}30`,
            }}
          >
            <Crown size={10} />
            Best Option
          </span>
        )}
      </div>

      {/* Hero Payment */}
      <div>
        <p className="text-3xl font-bold" style={{ color: isWinner ? GOLD : TEXT, fontFamily: "'IBM Plex Mono', monospace" }}>
          {fmtCurrency(row.totalMonthlyPayment)}
          <span className="text-sm font-medium" style={{ color: MUTED }}>/mo</span>
        </p>
      </div>

      {/* Payment Breakdown */}
      <div
        className="rounded-xl p-3 space-y-1.5"
        style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${BORDER}` }}
      >
        {breakdownItems.map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <span className="text-[10px]" style={{ color: MUTED }}>{item.label}</span>
            <span className="text-[10px] font-medium" style={{ color: TEXT, fontFamily: "'IBM Plex Mono', monospace" }}>
              {fmtCurrency(item.value)}
            </span>
          </div>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <MiniStat label="Rate" value={fmtRate(row.interestRate)} />
        <MiniStat label="APR" value={fmtRate(row.apr)} />
        <MiniStat label="Loan Amount" value={fmtCurrency(row.loanAmount)} />
        <MiniStat label={mode === 'purchase' ? 'Cash to Close' : 'Closing Costs'} value={fmtCurrency(row.cashToClose)} />
      </div>

      {/* Delta Chips */}
      {deltas.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {deltas.map((d, i) => (
            <DeltaChip key={i} value={d.value} label={d.label} type={d.type} />
          ))}
        </div>
      )}
    </div>
  )
}
