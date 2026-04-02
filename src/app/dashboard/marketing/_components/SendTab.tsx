'use client'

import { useState } from 'react'
import { type MCCState } from '@/lib/marketing/types'
import RateUpdateForm from './RateUpdateForm'
import NewsletterForm from './NewsletterForm'

const GOLD = '#C9A84C'

type Props = {
  mccState: MCCState
  onSave:   (next: MCCState) => Promise<void>
}

type SendMode = 'rate-update' | 'newsletter'

export default function SendTab({ mccState, onSave }: Props) {
  const [sendMode, setSendMode] = useState<SendMode>('rate-update')

  return (
    <div className="space-y-4">
      {/* Inner toggle */}
      <div className="flex border border-input rounded-sm overflow-hidden w-fit">
        {([
          { key: 'rate-update' as SendMode, label: '📈 RATE UPDATE' },
          { key: 'newsletter'  as SendMode, label: '✉ NEWSLETTER' },
        ]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setSendMode(key)}
            className="px-4 py-2 text-xs font-bold transition-colors"
            style={{
              background: sendMode === key ? GOLD : 'transparent',
              color: sendMode === key ? 'var(--bg)' : '#71717a',
              fontFamily: 'inherit',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Active form */}
      {sendMode === 'rate-update'
        ? <RateUpdateForm mccState={mccState} onSave={onSave} />
        : <NewsletterForm mccState={mccState} onSave={onSave} />
      }
    </div>
  )
}
