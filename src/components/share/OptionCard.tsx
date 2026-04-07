import type { ScenarioDisplayRow } from '@/lib/scenarios/displayData'
import { TEXT, MUTED, CARD_BG, BORDER, GOLD, fmtCurrency, fmtRate } from './constants'
import DeltaChip from './DeltaChip'

export interface DeltaItem {
  value: number
  label: string
  type: 'savings' | 'cost' | 'neutral'
}

interface OptionCardProps {
  row: ScenarioDisplayRow
  deltas: DeltaItem[]
  mode: 'purchase' | 'refinance'
  index: number
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: MUTED }}>
        {label}
      </p>
      <p className="text-sm font-bold" style={{ color: TEXT, fontFamily: "'IBM Plex Mono', monospace" }}>
        {value}
      </p>
    </div>
  )
}

export default function OptionCard({ row, deltas, mode, index }: OptionCardProps) {
  const breakdownItems: { label: string; value: number }[] = [
    { label: 'Principal & Interest', value: row.monthlyPI },
    { label: 'Property Tax', value: row.propertyTaxes },
    { label: 'Insurance', value: row.homeownersInsurance },
    ...(row.hoa > 0 ? [{ label: 'HOA', value: row.hoa }] : []),
    ...(row.pmi > 0 ? [{ label: 'PMI', value: row.pmi }] : []),
  ].filter(item => item.value > 0)

  return (
    <div
      className="rounded-2xl flex flex-col"
      style={{
        background: index === 0
          ? `linear-gradient(180deg, #1a1710 0%, ${CARD_BG} 100%)`
          : CARD_BG,
        border: `1px solid ${index === 0 ? `${GOLD}30` : BORDER}`,
        boxShadow: index === 0
          ? `0 2px 16px rgba(201,168,76,0.06)`
          : '0 2px 8px rgba(0,0,0,0.2)',
      }}
    >
      {/* Gold accent bar at top */}
      <div
        style={{
          height: 3,
          borderRadius: '16px 16px 0 0',
          background: index === 0
            ? `linear-gradient(90deg, ${GOLD}60, ${GOLD}, ${GOLD}60)`
            : `linear-gradient(90deg, ${GOLD}00, ${GOLD}30, ${GOLD}00)`,
        }}
      />

      <div className="p-4 sm:p-6 flex flex-col gap-4 sm:gap-5 flex-1">
        {/* Header */}
        <div className="flex items-center gap-2.5">
          <h3 className="text-base font-bold" style={{ color: TEXT }}>
            {row.label}
          </h3>
          <span
            className="text-[9px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md"
            style={{
              background: 'rgba(255,255,255,0.04)',
              color: `${MUTED}CC`,
              border: `1px solid ${BORDER}`,
            }}
          >
            {row.loanType}
          </span>
        </div>

        {/* Hero Payment — the main event */}
        <div className="py-1">
          <p
            className="text-4xl sm:text-[42px] font-bold leading-none"
            style={{
              color: TEXT,
              fontFamily: "'IBM Plex Mono', monospace",
              letterSpacing: '-0.02em',
            }}
          >
            {fmtCurrency(row.totalMonthlyPayment)}
            <span className="text-base font-medium ml-0.5" style={{ color: MUTED }}>/mo</span>
          </p>
        </div>

        {/* Payment Breakdown */}
        <div
          className="rounded-xl p-4 space-y-2.5"
          style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${BORDER}` }}
        >
          {breakdownItems.map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <span className="text-[11px]" style={{ color: MUTED }}>{item.label}</span>
              <span
                className="text-[11px] font-semibold"
                style={{ color: TEXT, fontFamily: "'IBM Plex Mono', monospace" }}
              >
                {fmtCurrency(item.value)}
              </span>
            </div>
          ))}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <MiniStat label="Rate" value={fmtRate(row.interestRate)} />
          <MiniStat label="APR" value={fmtRate(row.apr)} />
          <MiniStat label="Loan Amount" value={fmtCurrency(row.loanAmount)} />
          <MiniStat label={mode === 'purchase' ? 'Cash to Close' : 'Closing Costs'} value={fmtCurrency(row.cashToClose)} />
        </div>

        {/* Delta Chips — push to bottom */}
        {deltas.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 mt-auto">
            {deltas.map((d, i) => (
              <DeltaChip key={i} value={d.value} label={d.label} type={d.type} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
