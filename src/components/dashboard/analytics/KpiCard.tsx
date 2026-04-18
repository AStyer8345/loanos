/**
 * KpiCard — compact single-metric tile for the analytics grid.
 *
 * Mirrors the typography conventions used across LoanOS dashboard surfaces:
 * mono label (uppercase, muted), large foreground value, optional subtext
 * for secondary context (e.g. "last 90d" or "$42M pipeline").
 */

import { Card } from '@/components/ui/card'

interface KpiCardProps {
  label: string
  value: string
  subtext?: string
  accent?: 'default' | 'primary' | 'warning' | 'success'
}

const ACCENT_CLASS: Record<NonNullable<KpiCardProps['accent']>, string> = {
  default: 'text-foreground',
  primary: 'text-primary',
  warning: 'text-amber-400',
  success: 'text-emerald-400',
}

export default function KpiCard({ label, value, subtext, accent = 'default' }: KpiCardProps) {
  return (
    <Card className="p-4">
      <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-2">
        {label}
      </div>
      <div className={`text-2xl font-mono font-semibold ${ACCENT_CLASS[accent]}`}>
        {value}
      </div>
      {subtext && (
        <div className="text-[11px] font-mono text-muted-foreground mt-1">
          {subtext}
        </div>
      )}
    </Card>
  )
}
