'use client'

import { AlertTriangle, X } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

interface UrgentFlag {
  id: string
  name: string
  flag: string
  date: string
}

interface UrgentFlagsProps {
  flags: UrgentFlag[]
}

export default function UrgentFlags({ flags }: UrgentFlagsProps) {
  const [dismissed, setDismissed] = useState<string[]>([])
  const visible = flags.filter(f => !dismissed.includes(f.id + f.flag))

  if (visible.length === 0) return null

  return (
    <div className="bg-zinc-900 border border-amber-700 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-4 h-4 text-amber-500" />
        <span className="text-xs font-mono text-amber-400 uppercase tracking-wider">Urgent — Needs Attention</span>
      </div>
      <div className="space-y-2">
        {visible.map((flag) => {
          const key = flag.id + flag.flag
          const date = new Date(flag.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          return (
            <div key={key} className="flex items-center justify-between bg-zinc-800 rounded px-3 py-2">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-amber-400 bg-amber-900/30 px-2 py-0.5 rounded">{flag.flag}</span>
                <Link href={`/dashboard/loans/${flag.id}`} className="text-sm font-mono text-zinc-200 hover:text-yellow-400 transition-colors">
                  {flag.name}
                </Link>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-zinc-500">{date}</span>
                <button
                  onClick={() => setDismissed(d => [...d, key])}
                  className="text-zinc-600 hover:text-zinc-400 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
