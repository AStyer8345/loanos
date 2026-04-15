'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { GOLD, TEXT, MUTED, CARD_BG, BORDER } from './constants'
import type { BorrowerQAPair } from '@/app/api/scenarios/generate-qa/route'

interface BorrowerQAProps {
  pairs: BorrowerQAPair[]
}

function QAItem({ pair, index }: { pair: BorrowerQAPair; index: number }) {
  const [open, setOpen] = useState(false)

  return (
    <div
      style={{
        borderBottom: `1px solid ${BORDER}`,
      }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3 py-4 text-left"
        aria-expanded={open}
      >
        <span
          className="text-sm font-medium leading-snug flex-1"
          style={{ color: TEXT }}
        >
          <span
            className="inline-block mr-2 text-[10px] font-semibold tabular-nums"
            style={{ color: GOLD, fontFamily: "'IBM Plex Mono', monospace" }}
          >
            {String(index + 1).padStart(2, '0')}
          </span>
          {pair.q}
        </span>
        <ChevronDown
          size={14}
          style={{
            color: MUTED,
            flexShrink: 0,
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 200ms ease',
          }}
        />
      </button>

      {open && (
        <div
          className="pb-4 pl-7 pr-1"
          style={{
            fontSize: 13,
            lineHeight: 1.6,
            color: MUTED,
          }}
        >
          {pair.a}
        </div>
      )}
    </div>
  )
}

export default function BorrowerQA({ pairs }: BorrowerQAProps) {
  if (!pairs || pairs.length === 0) return null

  return (
    <div
      className="rounded-2xl overflow-hidden print:hidden"
      style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-3 mb-0.5">
          <div style={{ width: 16, height: 1, background: GOLD }} />
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.15em]"
            style={{ color: GOLD }}
          >
            Common Questions
          </p>
        </div>
        <p className="text-xs ml-7" style={{ color: MUTED }}>
          Tap any question for a plain-English answer based on your specific numbers.
        </p>
      </div>

      {/* Q&A list */}
      <div className="px-5 pb-2">
        {pairs.map((pair, i) => (
          <QAItem key={i} pair={pair} index={i} />
        ))}
      </div>
    </div>
  )
}
