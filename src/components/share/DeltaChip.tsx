import { fmtCurrency } from './constants'

interface DeltaChipProps {
  value: number
  label: string
  /** positive = saves money, negative = costs more */
  type: 'savings' | 'cost' | 'neutral'
}

export default function DeltaChip({ value, label, type }: DeltaChipProps) {
  const isPositive = type === 'savings'
  const isCost = type === 'cost'

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-medium"
      style={{
        background: isPositive
          ? 'rgba(74,222,128,0.1)'
          : isCost
          ? 'rgba(251,191,36,0.1)'
          : 'rgba(255,255,255,0.05)',
        color: isPositive ? '#4ade80' : isCost ? '#fbbf24' : '#888',
        border: `1px solid ${
          isPositive
            ? 'rgba(74,222,128,0.2)'
            : isCost
            ? 'rgba(251,191,36,0.2)'
            : 'rgba(255,255,255,0.1)'
        }`,
      }}
    >
      {isPositive ? '↓' : isCost ? '↑' : ''}
      {' '}
      {fmtCurrency(Math.abs(value))} {label}
    </span>
  )
}
