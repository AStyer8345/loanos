import { fmtCurrency } from './constants'

interface DeltaChipProps {
  value: number
  label: string
  type: 'savings' | 'cost' | 'neutral'
}

export default function DeltaChip({ value, label, type }: DeltaChipProps) {
  const isPositive = type === 'savings'
  const isCost = type === 'cost'

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-semibold"
      style={{
        background: isPositive
          ? 'rgba(74,222,128,0.10)'
          : isCost
          ? 'rgba(251,191,36,0.10)'
          : 'rgba(255,255,255,0.04)',
        color: isPositive ? '#4ade80' : isCost ? '#fbbf24' : '#888',
        border: `1px solid ${
          isPositive
            ? 'rgba(74,222,128,0.20)'
            : isCost
            ? 'rgba(251,191,36,0.20)'
            : 'rgba(255,255,255,0.08)'
        }`,
      }}
    >
      {isPositive ? '↓' : isCost ? '↑' : ''}
      {' '}
      {fmtCurrency(Math.abs(value))} {label}
    </span>
  )
}
