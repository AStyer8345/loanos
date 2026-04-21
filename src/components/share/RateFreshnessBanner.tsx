'use client'

import { GOLD } from './constants'

interface RateFreshnessBannerProps {
  createdAt: string
}

export default function RateFreshnessBanner({ createdAt }: RateFreshnessBannerProps) {
  const ageDays = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)

  if (ageDays <= 3) return null

  const dateStr = new Date(createdAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div
      className="print:hidden mb-6"
      style={{
        background: 'rgba(201, 168, 76, 0.08)',
        border: `1px solid ${GOLD}40`,
        borderLeft: `3px solid ${GOLD}`,
        borderRadius: 6,
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
      }}
    >
      <span style={{ color: GOLD, fontSize: 14, lineHeight: 1.4, flexShrink: 0 }}>⚠</span>
      <p
        style={{
          color: `${GOLD}CC`,
          fontSize: 12,
          lineHeight: 1.5,
          fontFamily: "'IBM Plex Mono', monospace",
          margin: 0,
        }}
      >
        Rates may have changed since this analysis was created on {dateStr}. Contact your loan officer for updated numbers before making any decisions.
      </p>
    </div>
  )
}
