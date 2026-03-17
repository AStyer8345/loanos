'use client'

import Link from 'next/link'
import { AlertCircle, AlertTriangle, Info, Minus, ExternalLink } from 'lucide-react'
import type { ScoredLoan, UrgencyLabel } from '@/lib/scoreLoans'

// ── Design tokens ──────────────────────────────────────────────────────────
// Non-negotiable per spec. Keep these in one place.

const BG_CARD  = '#111114'
const BG_HOVER = '#1a1a1f'
const BORDER   = '#ffffff14'
const TEXT_PRI = '#f0ede8'
const TEXT_MUT = '#8b8b8b'
const GOLD     = '#C9A84C'

const URGENCY_COLORS: Record<UrgencyLabel, { text: string; border: string; badge: string; icon: string; chip: string }> = {
  CRITICAL: { text: '#ef4444', border: '#ef4444',  badge: '#1f0a0a', icon: '#ef4444', chip: '#2d0f0f' },
  HIGH:     { text: '#f59e0b', border: '#f59e0b',  badge: '#1c1100', icon: '#f59e0b', chip: '#271a00' },
  MEDIUM:   { text: '#3b82f6', border: '#3b82f6',  badge: '#080f1f', icon: '#3b82f6', chip: '#0d1830' },
  LOW:      { text: TEXT_MUT,  border: '#333337',   badge: BG_CARD,   icon: TEXT_MUT,  chip: '#161619' },
}

const URGENCY_ICONS: Record<UrgencyLabel, React.ReactNode> = {
  CRITICAL: <AlertCircle size={13} />,
  HIGH:     <AlertTriangle size={13} />,
  MEDIUM:   <Info size={13} />,
  LOW:      <Minus size={13} />,
}

// ── Helpers ────────────────────────────────────────────────────────────────

function fmt(n: number | null): string {
  if (n == null) return '—'
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n}`
}

function borrowerName(loan: ScoredLoan): string {
  const full = [loan.borrower_first_name, loan.borrower_last_name].filter(Boolean).join(' ')
  return full || loan.loan_name || 'Unknown Borrower'
}

function closingDateDisplay(loan: ScoredLoan): string | null {
  const d = loan.closing_date ?? loan.estimated_closing_date
  if (!d) return null
  const date = new Date(d + 'T00:00:00')
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ── Stat chip ──────────────────────────────────────────────────────────────

function StatChip({ label, count, color, chipBg }: { label: string; count: number; color: string; chipBg: string }) {
  return (
    <div
      style={{ background: chipBg, border: `1px solid ${color}33`, borderRadius: 8, padding: '8px 14px' }}
      className="flex items-center gap-2"
    >
      <span style={{ color, fontFamily: 'monospace', fontSize: 20, fontWeight: 700, lineHeight: 1 }}>
        {count}
      </span>
      <span style={{ color: TEXT_MUT, fontFamily: 'monospace', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {label}
      </span>
    </div>
  )
}

// ── Loan card ──────────────────────────────────────────────────────────────

function LoanCard({ loan }: { loan: ScoredLoan }) {
  const colors = URGENCY_COLORS[loan.urgencyLabel]
  const name = borrowerName(loan)
  const closing = closingDateDisplay(loan)

  return (
    <div
      style={{
        background: BG_CARD,
        border: `1px solid ${BORDER}`,
        borderLeft: `3px solid ${colors.border}`,
        borderRadius: 10,
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 16,
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = BG_HOVER)}
      onMouseLeave={e => (e.currentTarget.style.background = BG_CARD)}
    >
      {/* Score badge */}
      <div
        style={{
          background: colors.badge,
          border: `1px solid ${colors.border}30`,
          borderRadius: 8,
          width: 52,
          flexShrink: 0,
          padding: '8px 0',
          textAlign: 'center',
        }}
      >
        <div style={{ color: colors.text, fontFamily: 'monospace', fontSize: 22, fontWeight: 700, lineHeight: 1 }}>
          {loan.urgencyScore}
        </div>
        <div
          style={{
            color: colors.icon,
            fontFamily: 'monospace',
            fontSize: 8,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginTop: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
          }}
        >
          {URGENCY_ICONS[loan.urgencyLabel]}
          {loan.urgencyLabel}
        </div>
      </div>

      {/* Center content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
          {loan.isPastDue && (
            <span style={{
              background: '#3d0000',
              border: '1px solid #7f1d1d',
              color: '#fca5a5',
              fontFamily: 'monospace',
              fontSize: 9,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              padding: '1px 6px',
              borderRadius: 4,
            }}>
              PAST DUE
            </span>
          )}
          <span style={{ color: TEXT_PRI, fontFamily: 'sans-serif', fontSize: 14, fontWeight: 600 }}>
            {name}
          </span>
        </div>

        {/* Status + meta row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
          <span style={{
            background: '#1a1a20',
            border: `1px solid ${BORDER}`,
            color: TEXT_MUT,
            fontFamily: 'monospace',
            fontSize: 9,
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
            padding: '2px 7px',
            borderRadius: 4,
          }}>
            {loan.status ?? loan.stageKey}
          </span>
          {loan.loan_program && (
            <span style={{ color: TEXT_MUT, fontFamily: 'monospace', fontSize: 10 }}>{loan.loan_program}</span>
          )}
          {loan.lender_name && (
            <span style={{ color: TEXT_MUT, fontFamily: 'monospace', fontSize: 10 }}>· {loan.lender_name}</span>
          )}
          {closing && (
            <span style={{ color: GOLD, fontFamily: 'monospace', fontSize: 10 }}>· Close {closing}</span>
          )}
        </div>

        {/* Recommended action */}
        <div style={{ color: TEXT_PRI, fontFamily: 'monospace', fontSize: 11, marginBottom: 3 }}>
          {loan.recommendedAction}
        </div>

        {/* Reason */}
        <div style={{ color: TEXT_MUT, fontFamily: 'monospace', fontSize: 10 }}>
          {loan.urgencyReason}
        </div>
      </div>

      {/* Right side */}
      <div style={{ flexShrink: 0, textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
        {loan.loan_amount != null && (
          <span style={{ color: GOLD, fontFamily: 'monospace', fontSize: 12, fontWeight: 600 }}>
            {fmt(loan.loan_amount)}
          </span>
        )}
        <Link
          href={`/dashboard/loans/${loan.id}`}
          style={{
            color: TEXT_MUT,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontFamily: 'monospace',
            fontSize: 10,
            textDecoration: 'none',
            padding: '3px 8px',
            borderRadius: 5,
            border: `1px solid ${BORDER}`,
            background: 'transparent',
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLAnchorElement
            el.style.color = TEXT_PRI
            el.style.borderColor = GOLD + '44'
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLAnchorElement
            el.style.color = TEXT_MUT
            el.style.borderColor = BORDER
          }}
        >
          Open <ExternalLink size={10} />
        </Link>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

interface SmartActionQueueProps {
  scoredLoans: ScoredLoan[]
}

export default function SmartActionQueue({ scoredLoans }: SmartActionQueueProps) {
  const critical = scoredLoans.filter(l => l.urgencyLabel === 'CRITICAL').length
  const high     = scoredLoans.filter(l => l.urgencyLabel === 'HIGH').length
  const medium   = scoredLoans.filter(l => l.urgencyLabel === 'MEDIUM').length
  const total    = scoredLoans.length

  return (
    <div style={{ maxWidth: 900 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h2 style={{ color: TEXT_PRI, fontFamily: 'monospace', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
            Action Queue
          </h2>
          <p style={{ color: TEXT_MUT, fontFamily: 'monospace', fontSize: 10, margin: '4px 0 0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Ranked by urgency · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Summary stat chips */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        <StatChip label="Critical"     count={critical} color={URGENCY_COLORS.CRITICAL.text} chipBg={URGENCY_COLORS.CRITICAL.chip} />
        <StatChip label="High"         count={high}     color={URGENCY_COLORS.HIGH.text}     chipBg={URGENCY_COLORS.HIGH.chip} />
        <StatChip label="Medium"       count={medium}   color={URGENCY_COLORS.MEDIUM.text}   chipBg={URGENCY_COLORS.MEDIUM.chip} />
        <StatChip label="Total Active" count={total}    color={GOLD}                         chipBg={BG_CARD} />
      </div>

      {/* Empty state */}
      {total === 0 && (
        <div style={{
          background: BG_CARD,
          border: `1px solid ${BORDER}`,
          borderRadius: 10,
          padding: '40px 24px',
          textAlign: 'center',
        }}>
          <p style={{ color: TEXT_MUT, fontFamily: 'monospace', fontSize: 12 }}>No active loans in pipeline.</p>
        </div>
      )}

      {/* Loan cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {scoredLoans.map(loan => (
          <LoanCard key={loan.id} loan={loan} />
        ))}
      </div>
    </div>
  )
}
