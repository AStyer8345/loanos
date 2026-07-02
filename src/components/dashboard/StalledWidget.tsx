'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Snail } from 'lucide-react'
import { Card } from '@/components/ui/card'

export type StalledItem = {
  id: string
  kind: 'loan' | 'lead'
  name: string
  detail: string
  daysSince: number
  href: string
}

interface StalledWidgetProps {
  items: StalledItem[]
  neverContactedCount: number
  thresholdDays: number
}

export default function StalledWidget({ items, neverContactedCount, thresholdDays }: StalledWidgetProps) {
  const router = useRouter()
  const [days, setDays] = useState(thresholdDays)
  const [saving, setSaving] = useState(false)

  async function saveThreshold(next: number) {
    if (!Number.isInteger(next) || next < 1 || next > 90 || next === thresholdDays) return
    setSaving(true)
    try {
      const res = await fetch('/api/settings/stalled-threshold', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: next }),
      })
      if (res.ok) router.refresh()
    } finally {
      setSaving(false)
    }
  }

  if (items.length === 0 && neverContactedCount === 0) return null

  return (
    <Card className="overflow-hidden">
      <div className="px-4 py-3 border-b border-input flex items-center gap-2 flex-wrap">
        <Snail className="w-3.5 h-3.5 text-orange-400" />
        <span className="text-xs font-mono font-semibold text-orange-400 uppercase tracking-widest">Stalled</span>
        <span className="text-[10px] font-mono text-muted-foreground">no movement in</span>
        <input
          type="number"
          min={1}
          max={90}
          value={days}
          disabled={saving}
          onChange={e => setDays(Number(e.target.value))}
          onBlur={() => saveThreshold(days)}
          onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
          className="w-12 bg-muted border border-input rounded px-1.5 py-0.5 text-[11px] font-mono text-foreground text-center focus:outline-none focus:border-[#C9A84C]/60"
        />
        <span className="text-[10px] font-mono text-muted-foreground">days</span>
        {neverContactedCount > 0 && (
          <span className="ml-auto text-[10px] font-mono text-red-400">
            {neverContactedCount} lead{neverContactedCount === 1 ? '' : 's'} never contacted
          </span>
        )}
      </div>

      <div className="divide-y divide-input max-h-[280px] overflow-y-auto">
        {items.map(item => (
          <Link
            key={`${item.kind}-${item.id}`}
            href={item.href}
            className="px-4 py-2.5 flex items-center justify-between gap-3 hover:bg-[#1e293b]/30 transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded flex-shrink-0 ${
                item.kind === 'lead'
                  ? 'bg-red-900/40 text-red-400'
                  : 'bg-orange-900/40 text-orange-400'
              }`}>{item.kind === 'lead' ? 'never contacted' : 'loan'}</span>
              <span className="text-xs font-mono font-medium text-foreground truncate">{item.name}</span>
              <span className="text-[10px] font-mono text-muted-foreground truncate">{item.detail}</span>
            </div>
            <span className="text-[11px] font-mono text-orange-400 flex-shrink-0">{item.daysSince}d</span>
          </Link>
        ))}
      </div>
    </Card>
  )
}
