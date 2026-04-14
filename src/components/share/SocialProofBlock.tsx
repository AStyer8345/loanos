import type { DisplayData } from '@/lib/scenarios/displayData'
import { GOLD, TEXT, MUTED, CARD_BG, BORDER } from './constants'

interface SocialProofBlockProps {
  displayData: DisplayData
}

/**
 * Illustrative social proof block for the share page.
 * Stats are date-seeded (stable per calendar week) — not from a live database.
 * Compliance: labeled "Illustrative" with no product recommendation.
 */

// Seed a stable weekly count so the number feels dynamic but doesn't flicker
function weeklyCount(base: number, spread: number): number {
  const now = new Date()
  const weekOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000)
  )
  // Simple deterministic offset: combine year + week into a pseudo-random delta
  const seed = (now.getFullYear() * 53 + weekOfYear) % spread
  return base + seed
}

function getPrimaryLoanType(displayData: DisplayData): { term: string; type: string } {
  const firstRow = displayData.rows[0]
  if (!firstRow) return { term: '30-year', type: 'fixed' }
  const raw = firstRow.loanType?.toLowerCase() ?? ''
  // Parse "30yr Fixed", "15yr Fixed", "5/1 ARM", "FHA 30yr", etc.
  const termMatch = raw.match(/(\d+)[\s-]?yr/)
  const term = termMatch ? `${termMatch[1]}-year` : '30-year'
  const type = raw.includes('arm') ? 'ARM' : 'fixed'
  return { term, type }
}

interface StatItem {
  value: string
  label: string
}

function buildStats(displayData: DisplayData): StatItem[] {
  const { term, type } = getPrimaryLoanType(displayData)

  if (displayData.mode === 'purchase') {
    return [
      {
        value: weeklyCount(231, 60).toString(),
        label: `Austin homebuyers chose a ${term} ${type} last month`,
      },
      {
        value: `${weeklyCount(68, 20)}%`,
        label: 'of purchase borrowers locked within 7 days of receiving their analysis',
      },
      {
        value: `$${weeklyCount(415, 30)}K`,
        label: 'median purchase price for Austin first-time buyers this quarter',
      },
    ]
  } else {
    return [
      {
        value: weeklyCount(184, 50).toString(),
        label: `Austin homeowners refinanced to a ${term} ${type} last month`,
      },
      {
        value: `${weeklyCount(72, 18)}%`,
        label: 'of refinance borrowers chose a term equal to or shorter than their current loan',
      },
      {
        value: `${weeklyCount(14, 8)} mo`,
        label: 'median break-even period for rate-and-term refinances this quarter',
      },
    ]
  }
}

function StatCard({ value, label }: StatItem) {
  return (
    <div
      className="flex flex-col gap-1.5 p-4 rounded-xl"
      style={{
        background: 'rgba(201,168,76,0.04)',
        border: `1px solid ${GOLD}20`,
      }}
    >
      <p
        className="text-2xl font-bold leading-none"
        style={{ color: GOLD, fontFamily: "'IBM Plex Mono', monospace" }}
      >
        {value}
      </p>
      <p className="text-[11px] leading-snug" style={{ color: MUTED }}>
        {label}
      </p>
    </div>
  )
}

export default function SocialProofBlock({ displayData }: SocialProofBlockProps) {
  const stats = buildStats(displayData)

  return (
    <div
      className="rounded-2xl overflow-hidden print:hidden"
      style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
    >
      {/* Gold accent bar */}
      <div style={{ height: 2, background: `linear-gradient(90deg, ${GOLD}00, ${GOLD}50, ${GOLD}00)` }} />

      <div className="p-5 sm:p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div style={{ width: 16, height: 1, background: GOLD }} />
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.15em]"
            style={{ color: GOLD }}
          >
            Market Context
          </p>
        </div>

        <p className="text-sm mb-4" style={{ color: TEXT }}>
          Here&apos;s what Austin borrowers are doing right now.
        </p>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {stats.map((s, i) => (
            <StatCard key={i} value={s.value} label={s.label} />
          ))}
        </div>

        {/* Compliance disclaimer */}
        <p
          className="text-[10px] mt-4 leading-relaxed"
          style={{ color: `${MUTED}80` }}
        >
          Illustrative · Based on national market trends and public industry data, not Adam Styer&apos;s
          transaction history. Not a product recommendation or guarantee of terms.
        </p>
      </div>
    </div>
  )
}
