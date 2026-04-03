import type { BreakEvenRow } from '@/lib/scenarios/displayData'
import { GOLD, TEXT, MUTED, CARD_BG, BORDER, fmtCurrency } from './constants'

interface BreakEvenVisualProps {
  breakEvenRows: BreakEvenRow[]
}

const MAX_MONTHS = 84 // 7 years — max display scale

export default function BreakEvenVisual({ breakEvenRows }: BreakEvenVisualProps) {
  if (!breakEvenRows.length) return null

  return (
    <div className="rounded-2xl p-5" style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
      <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: GOLD }}>
        Cost Recovery
      </p>
      <p className="text-[10px] mb-5" style={{ color: MUTED }}>
        Months until additional upfront cost is recouped through lower monthly payments
      </p>

      <div className="space-y-5">
        {breakEvenRows.map((row) => {
          const pct = Math.min((row.breakEvenMonths / MAX_MONTHS) * 100, 100)

          return (
            <div key={row.label}>
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-xs font-medium" style={{ color: TEXT }}>{row.label}</span>
                <span className="text-lg font-bold" style={{ color: GOLD, fontFamily: "'IBM Plex Mono', monospace" }}>
                  {row.breakEvenMonths} mo
                  <span className="text-[10px] font-normal ml-1" style={{ color: MUTED }}>
                    ({row.breakEvenYears.toFixed(1)} yrs)
                  </span>
                </span>
              </div>

              {/* Progress bar */}
              <div
                className="w-full h-2.5 rounded-full overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.05)' }}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${pct}%`,
                    background: `linear-gradient(90deg, ${GOLD}40, ${GOLD})`,
                  }}
                />
              </div>

              {/* Supporting details */}
              <div className="flex items-center gap-4 mt-2">
                <span className="text-[10px]" style={{ color: MUTED }}>
                  Upfront: {fmtCurrency(row.additionalCostToClose)}
                </span>
                <span className="text-[10px]" style={{ color: '#4ade80' }}>
                  Saves: {fmtCurrency(row.monthlySavings)}/mo
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Scale reference */}
      <div className="flex justify-between mt-4 pt-3" style={{ borderTop: `1px solid ${BORDER}` }}>
        <span className="text-[9px]" style={{ color: `${MUTED}60` }}>0 months</span>
        <span className="text-[9px]" style={{ color: `${MUTED}60` }}>7 years</span>
      </div>
    </div>
  )
}
