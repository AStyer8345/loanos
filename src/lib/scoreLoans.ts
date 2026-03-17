/**
 * Smart Action Queue — loan scoring and ranking.
 *
 * Takes raw loan records, assigns a numeric urgency score (0–100),
 * and returns them sorted with human-readable labels and recommended actions.
 *
 * All status normalization routes through normalizeToStageKey() so every
 * raw Arive webhook value and every LoanOS canonical name resolves correctly.
 */

import { normalizeToStageKey, type StageKey } from '@/lib/constants/loan-stages'

// ── Input type ────────────────────────────────────────────────────────────────
// Minimal slice of the loans table needed for scoring.

export interface LoanForScoring {
  id: string
  loan_name: string | null
  borrower_first_name: string | null
  borrower_last_name: string | null
  status: string | null
  loan_amount: number | null
  loan_program: string | null
  lender_name: string | null
  closing_date: string | null
  estimated_closing_date: string | null
  updated_at: string | null
  // Injected from activity_log query — null means no logged activity yet
  lastActivityAt: string | null
}

// ── Output types ──────────────────────────────────────────────────────────────

export type UrgencyLabel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'

export interface ScoredLoan extends LoanForScoring {
  stageKey: StageKey
  urgencyScore: number
  urgencyLabel: UrgencyLabel
  urgencyReason: string
  isPastDue: boolean
  recommendedAction: string
}

// ── Base scores by canonical stage key ───────────────────────────────────────

const BASE_SCORES: Partial<Record<StageKey, number>> = {
  clear_to_close: 95,
  resubmit:       85,
  approved:       75,
  disclosed:      70,
  submitted:      60,
  processing:     50,
  underwriting:   50,
  setup:          30,
  pre_approval:   20,
  new_application: 20,
  lead:           15,
}

const DEFAULT_BASE_SCORE = 20

// ── Recommended actions by canonical stage key ────────────────────────────────

const RECOMMENDED_ACTIONS: Partial<Record<StageKey, string>> = {
  clear_to_close: 'Confirm closing time with title',
  resubmit:       'Review UW conditions and resubmit',
  disclosed:      'Call borrower — disclosures must be signed',
  submitted:      'Follow up with lender on file status',
  underwriting:   'Follow up with lender on file status',
  processing:     'Check outstanding conditions',
  approved:       'Clear remaining conditions',
  setup:          'Collect missing documents',
}

const DEFAULT_ACTION = 'Review file and determine next step'

// ── Urgency label thresholds ──────────────────────────────────────────────────

function toUrgencyLabel(score: number): UrgencyLabel {
  if (score >= 80) return 'CRITICAL'
  if (score >= 60) return 'HIGH'
  if (score >= 40) return 'MEDIUM'
  return 'LOW'
}

// ── Core scoring function ─────────────────────────────────────────────────────

export function scoreLoan(loan: LoanForScoring): ScoredLoan {
  const stageKey = normalizeToStageKey(loan.status)
  const now = new Date()

  // 1. Base score
  let score = BASE_SCORES[stageKey] ?? DEFAULT_BASE_SCORE

  // 2. Time decay multiplier based on last human touch
  //    Falls back to updated_at if no activity_log entry exists.
  const lastTouchStr = loan.lastActivityAt ?? loan.updated_at
  const hoursSinceActivity = lastTouchStr
    ? (now.getTime() - new Date(lastTouchStr).getTime()) / (1000 * 60 * 60)
    : Infinity

  let decayReason = ''
  if (hoursSinceActivity > 72) {
    score *= 1.4
    decayReason = 'No activity in 72+ hrs'
  } else if (hoursSinceActivity > 48) {
    score *= 1.2
    decayReason = 'No activity in 48+ hrs'
  } else if (hoursSinceActivity > 24) {
    score *= 1.1
    decayReason = 'No activity in 24+ hrs'
  }

  // 3. Closing date urgency (additive)
  const closingDateStr = loan.closing_date ?? loan.estimated_closing_date
  let closingAddend = 0
  let isPastDue = false
  let closingReason = ''

  if (closingDateStr) {
    // Parse as local date (YYYY-MM-DD) to avoid timezone shifting
    const closing = new Date(closingDateStr + 'T00:00:00')
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const daysUntilClosing = Math.floor(
      (closing.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (daysUntilClosing < 0) {
      closingAddend = 40
      isPastDue = true
      closingReason = 'PAST DUE closing date'
    } else if (daysUntilClosing === 0) {
      closingAddend = 30
      closingReason = 'Closing TODAY'
    } else if (daysUntilClosing <= 3) {
      closingAddend = 20
      closingReason = `Closing in ${daysUntilClosing}d`
    } else if (daysUntilClosing <= 7) {
      closingAddend = 10
      closingReason = `Closing in ${daysUntilClosing}d`
    }
  }

  score += closingAddend

  // 4. Cap at 100
  const urgencyScore = Math.min(100, Math.round(score))

  // 5. Human-readable reason
  const stageLabel = loan.status ?? stageKey
  const reasonParts = [
    closingReason,
    decayReason,
    !closingReason && !decayReason ? stageLabel : '',
  ].filter(Boolean)
  const urgencyReason = reasonParts.join(' — ') || stageLabel

  return {
    ...loan,
    stageKey,
    urgencyScore,
    urgencyLabel: toUrgencyLabel(urgencyScore),
    urgencyReason,
    isPastDue,
    recommendedAction: RECOMMENDED_ACTIONS[stageKey] ?? DEFAULT_ACTION,
  }
}

// ── Batch ranking function ────────────────────────────────────────────────────

export function rankLoans(loans: LoanForScoring[]): ScoredLoan[] {
  return loans
    .map(scoreLoan)
    .sort((a, b) => b.urgencyScore - a.urgencyScore)
}
