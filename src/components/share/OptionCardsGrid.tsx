import type { ScenarioDisplayRow } from '@/lib/scenarios/displayData'
import OptionCard from './OptionCard'
import type { DeltaItem } from './OptionCard'

interface OptionCardsGridProps {
  rows: ScenarioDisplayRow[]
  mode: 'purchase' | 'refinance'
  recommendedIdx: number
}

function computeDeltas(
  row: ScenarioDisplayRow,
  recommended: ScenarioDisplayRow,
  isWinner: boolean,
  mode: 'purchase' | 'refinance'
): DeltaItem[] {
  if (isWinner) return []

  const deltas: DeltaItem[] = []
  const paymentDiff = row.totalMonthlyPayment - recommended.totalMonthlyPayment
  if (paymentDiff > 0) {
    deltas.push({ value: paymentDiff, label: '/mo more', type: 'cost' })
  } else if (paymentDiff < 0) {
    deltas.push({ value: Math.abs(paymentDiff), label: '/mo less', type: 'savings' })
  }

  const cashDiff = row.cashToClose - recommended.cashToClose
  if (Math.abs(cashDiff) >= 500) {
    if (cashDiff < 0) {
      deltas.push({ value: Math.abs(cashDiff), label: 'less at closing', type: 'savings' })
    } else {
      deltas.push({ value: cashDiff, label: 'more at closing', type: 'cost' })
    }
  }

  const interestDiff = row.totalInterest - recommended.totalInterest
  if (Math.abs(interestDiff) >= 1000) {
    if (interestDiff > 0) {
      deltas.push({ value: interestDiff, label: `more interest (${mode === 'purchase' ? 'life of loan' : 'total'})`, type: 'cost' })
    } else {
      deltas.push({ value: Math.abs(interestDiff), label: `less interest`, type: 'savings' })
    }
  }

  return deltas
}

export default function OptionCardsGrid({ rows, mode, recommendedIdx }: OptionCardsGridProps) {
  const recommended = rows[recommendedIdx]

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
        const isWinner = i === recommendedIdx
        const deltas = computeDeltas(row, recommended, isWinner, mode)
        return (
          <OptionCard
            key={i}
            row={row}
            isWinner={isWinner}
            deltas={deltas}
            mode={mode}
          />
        )
      })}
    </div>
  )
}
