'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'

interface RateLock {
  id: string
  name: string
  daysRemaining: number
  totalDays: number
  expirationDate: string
}

interface RateLockCountdownProps {
  locks: RateLock[]
}

function lockColor(daysRemaining: number): string {
  if (daysRemaining <= 0) return '#ef4444'
  if (daysRemaining <= 3) return '#f97316'
  if (daysRemaining <= 7) return '#eab308'
  return '#22c55e'
}

function fmtDateShort(s: string): string {
  return new Date(s + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function RateLockCountdown({ locks }: RateLockCountdownProps) {
  if (locks.length === 0) return null

  return (
    <Card className="p-4">
      <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-4">
        Rate Lock Status
      </h3>
      <div className="space-y-3">
        {locks.map(lock => {
          const color = lockColor(lock.daysRemaining)
          const elapsed = lock.totalDays - lock.daysRemaining
          const pctUsed = Math.min(100, Math.max(0, (elapsed / lock.totalDays) * 100))
          const label = lock.daysRemaining <= 0
            ? `EXPIRED ${-lock.daysRemaining}d ago`
            : lock.daysRemaining === 1
              ? '1 day left'
              : `${lock.daysRemaining} days left`

          return (
            <Link
              key={lock.id}
              href={`/dashboard/loans/${lock.id}`}
              className="block hover:bg-secondary/50 rounded -mx-2 px-2 py-1 transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-mono text-foreground">{lock.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-muted-foreground">
                    exp {fmtDateShort(lock.expirationDate)}
                  </span>
                  <span className="text-[11px] font-mono font-medium" style={{ color }}>
                    {label}
                  </span>
                </div>
              </div>
              <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${pctUsed}%`,
                    backgroundColor: color,
                    opacity: 0.7,
                  }}
                />
              </div>
            </Link>
          )
        })}
      </div>
    </Card>
  )
}
