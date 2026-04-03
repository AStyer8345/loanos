import type { ScenarioDisplayRow } from '@/lib/scenarios/displayData'
import OptionCard from './OptionCard'
import type { DeltaItem } from './OptionCard'

interface OptionCardsGridProps {
  rows: ScenarioDisplayRow[]
  mode: 'purchase' | 'refinance'
}

function computeDeltas(
  row: ScenarioDisplayRow,
  baseline: ScenarioDisplayRow,
  isBaseline: boolean,
): DeltaItem[] {
  if (isBaseline) return []

  const deltas: DeltaItem[] = []
  const paymentDiff = row.totalMonthlyPayment - baseline.totalMonthlyPayment
  if (paymentDiff > 0) {
    deltas.push({ value: paymentDiff, label: '/mo more', type: 'cost' })
  } else if (paymentDiff < 0) {
    deltas.push({ value: Math.abs(paymentDiff), label: '/mo less', type: 'savings' })
  }

  const cashDiff = row.cashToClose - baseline.cashToClose
  if (Math.abs(cashDiff) >= 500) {
    if (cashDiff < 0) {
      deltas.push({ value: Math.abs(cashDiff), label: 'less at closing', type: 'savings' })
    } else {
      deltas.push({ value: cashDiff, label: 'more at closing', type: 'cost' })
    }
  }

  // Compare 5-year interest if horizon data is available
  const rowInterest5yr = row.horizonAnalysis?.interestMIPaid5yr
  const baseInterest5yr = baseline.horizonAnalysis?.interestMIPaid5yr
  if (rowInterest5yr != null && baseInterest5yr != null) {
    const interestDiff = rowInterest5yr - baseInterest5yr
    if (Math.abs(interestDiff) >= 1000) {
      if (interestDiff > 0) {
        deltas.push({ value: interestDiff, label: 'more interest + MI (5 yr)', type: 'cost' })
      } else {
        deltas.push({ value: Math.abs(interestDiff), label: 'less interest + MI (5 yr)', type: 'savings' })
      }
    }
  }

  return deltas
}

export default function OptionCardsGrid({ rows, mode }: OptionCardsGridProps) {
  const baseline = rows[0]

  return (
    <div
      className={`grid gap-4 ${
        rows.length === 2
          ? 'grid-cols-1 sm:grid-cols-2'
          : rows.length === 3
          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
          : 'grid-cols-1 sm:grid-cols-2'
      }`}
    >
      {rows.map((row, i) => {
        const deltas = computeDeltas(row, baseline, i === 0)
        return (
          <OptionCard
            key={i}
            row={row}
            deltas={deltas}
            mode={mode}
          />
        )
      })}
    </div>
  )
}
