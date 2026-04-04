import type { BreakEvenRow } from '@/lib/scenarios/displayData'
import { GOLD, TEXT, MUTED, CARD_BG, BORDER, GREEN, fmtCurrency } from './constants'

interface BreakEvenVisualProps {
  breakEvenRows: BreakEvenRow[]
}

const MAX_MONTHS = 84 // 7 years

export default function BreakEvenVisual({ breakEvenRows }: BreakEvenVisualProps) {
  if (!breakEvenRows.length) return null

  return (
    <div className="rounded-2xl p-6" style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
      <p
        className="text-[11px] font-semibold uppercase tracking-[0.15em] mb-1"
        style={{ color: GOLD }}
      >
        Cost Recovery Timeline
      </p>
      <p className="text-sm mb-6" style={{ color: MUTED }}>
        How long until lower payments offset the additional upfront cost.
      </p>

      <div className="space-y-6">
        {breakEvenRows.map((row) => {
          const pct = Math.min((row.breakEvenMonths / MAX_MONTHS) * 100, 100)
          const isQuick = row.breakEvenMonths <= 24

          return (
            <div key={row.label}>
              <div className="flex items-baseline justify-between mb-3">
                <span className="text-sm font-semibold" style={{ color: TEXT }}>{row.label}</span>
                <span
                  className="text-xl font-bold"
                  style={{
                    color: isQuick ? GREEN : GOLD,
                    fontFamily: "'IBM Plex Mono', monospace",
                  }}
                >
                  {row.breakEvenMonths} mo
                  <span className="text-[11px] font-normal ml-1.5" style={{ color: MUTED }}>
                    ({row.breakEvenYears.toFixed(1)} yrs)
                  </span>
                </span>
              </div>

              {/* Progress bar */}
              <div
                className="relative w-full h-3 rounded-full overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.04)' }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${pct}%`,
                    background: isQuick
                      ? `linear-gradient(90deg, ${GREEN}40, ${GREEN})`
                      : `linear-gradient(90deg, ${GOLD}40, ${GOLD})`,
                  }}
                />
                {/* Dot at break-even point */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
                  style={{
                    left: `${pct}%`,
                    transform: `translate(-50%, -50%)`,
                    background: isQuick ? GREEN : GOLD,
                    boxShadow: `0 0 8px ${isQuick ? GREEN : GOLD}60`,
                  }}
                />
              </div>

              {/* Supporting details */}
              <div className="flex items-center gap-5 mt-2.5">
                <span className="text-[11px]" style={{ color: MUTED }}>
                  Upfront: {fmtCurrency(row.additionalCostToClose)}
                </span>
                <span className="text-[11px] font-medium" style={{ color: GREEN }}>
                  Saves {fmtCurrency(row.monthlySavings)}/mo
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Scale */}
      <div className="flex justify-between mt-5 pt-3" style={{ borderTop: `1px solid ${BORDER}` }}>
        <span className="text-[10px]" style={{ color: `${MUTED}60` }}>0 months</span>
        <span className="text-[10px]" style={{ color: `${MUTED}60` }}>7 years</span>
      </div>
    </div>
  )
}
