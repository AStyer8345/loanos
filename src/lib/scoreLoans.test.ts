import { describe, it, expect } from 'vitest'
import { scoreLoan, rankLoans, type LoanForScoring } from './scoreLoans'

// ── Helpers ───────────────────────────────────────────────────────────────────

function hoursAgo(n: number): string {
  return new Date(Date.now() - n * 60 * 60 * 1000).toISOString()
}

function daysFromNow(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  // Use local date parts (not toISOString which shifts to UTC) to match
  // how the scorer parses dates: new Date(str + 'T00:00:00') = local midnight.
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function baseLoan(overrides: Partial<LoanForScoring> = {}): LoanForScoring {
  return {
    id: 'loan-1',
    loan_name: 'Test Loan',
    borrower_first_name: 'Jane',
    borrower_last_name: 'Doe',
    status: 'CLEAR_TO_CLOSE',
    loan_amount: 400000,
    loan_program: 'Conventional',
    lender_name: 'UWM',
    closing_date: null,
    estimated_closing_date: null,
    updated_at: hoursAgo(1),
    lastActivityAt: hoursAgo(1), // recent — no decay
    ...overrides,
  }
}

// ── Status base scores ────────────────────────────────────────────────────────

describe('base scores by status', () => {
  const cases: [string, string, number][] = [
    ['CLEAR_TO_CLOSE',          'clear_to_close', 95],
    ['Clear to Close',          'clear_to_close', 95],
    ['RE_SUBMITTAL',            'resubmit',       85],
    ['Resubmitted',             'resubmit',       85],
    ['APPROVED_WITH_CONDITIONS','approved',        75],
    ['DISCLOSURE_SENT',         'disclosed',      70],
    ['UNDERWRITING_SUBMITTED',  'submitted',      60],
    ['LOAN_SETUP',              'setup',          30],
    ['unknown_status_xyz',      'lead',           15], // defaults to lead
  ]

  for (const [rawStatus, expectedKey, expectedBase] of cases) {
    it(`${rawStatus} → stageKey=${expectedKey}, base score=${expectedBase}`, () => {
      const result = scoreLoan(baseLoan({ status: rawStatus }))
      expect(result.stageKey).toBe(expectedKey)
      // With recent activity and no closing date, score should equal base (no multiplier, no addend)
      expect(result.urgencyScore).toBe(expectedBase)
    })
  }

  it('null status defaults to lead base score (15)', () => {
    const result = scoreLoan(baseLoan({ status: null }))
    expect(result.urgencyScore).toBe(15)
  })
})

// ── Time decay multipliers ────────────────────────────────────────────────────

describe('time decay multipliers', () => {
  // Base: LOAN_IN_PROCESS / processing → 50 base
  const processingLoan = (lastActivityAt: string | null) =>
    baseLoan({ status: 'Loan in Process', lastActivityAt, updated_at: lastActivityAt })

  it('< 24h ago → no multiplier (score = 50)', () => {
    const result = scoreLoan(processingLoan(hoursAgo(12)))
    expect(result.urgencyScore).toBe(50)
  })

  it('> 24h ago → ×1.1 (score = 55)', () => {
    const result = scoreLoan(processingLoan(hoursAgo(30)))
    expect(result.urgencyScore).toBe(55)
  })

  it('> 48h ago → ×1.2 (score = 60)', () => {
    const result = scoreLoan(processingLoan(hoursAgo(55)))
    expect(result.urgencyScore).toBe(60)
  })

  it('> 72h ago → ×1.4 (score = 70)', () => {
    const result = scoreLoan(processingLoan(hoursAgo(80)))
    expect(result.urgencyScore).toBe(70)
  })

  it('falls back to updated_at when lastActivityAt is null', () => {
    const loan = baseLoan({ status: 'Loan in Process', lastActivityAt: null, updated_at: hoursAgo(80) })
    const result = scoreLoan(loan)
    expect(result.urgencyScore).toBe(70) // ×1.4 decay applies via updated_at fallback
  })

  it('no activity data (both null) → treated as Infinity hours → ×1.4 applied', () => {
    const loan = baseLoan({ status: 'Loan in Process', lastActivityAt: null, updated_at: null })
    const result = scoreLoan(loan)
    expect(result.urgencyScore).toBe(70)
  })
})

// ── Closing date urgency ──────────────────────────────────────────────────────

describe('closing date urgency addends', () => {
  // Base: CLEAR_TO_CLOSE → 95, no decay (recent activity)
  const ctcLoan = (closing_date: string | null) =>
    baseLoan({ status: 'CLEAR_TO_CLOSE', closing_date })

  it('closing today → +30 addend, capped at 100', () => {
    const result = scoreLoan(ctcLoan(daysFromNow(0)))
    expect(result.urgencyScore).toBe(100)   // 95 + 30 = 125 → capped
    expect(result.isPastDue).toBe(false)
  })

  it('closing in 2 days → +20 addend, capped at 100', () => {
    const result = scoreLoan(ctcLoan(daysFromNow(2)))
    expect(result.urgencyScore).toBe(100)   // 95 + 20 = 115 → capped
  })

  it('closing in 5 days → +10 addend (score = 100 after cap)', () => {
    const result = scoreLoan(ctcLoan(daysFromNow(5)))
    expect(result.urgencyScore).toBe(100)   // 95 + 10 = 105 → capped
  })

  it('closing in 14 days → no addend (score = 95)', () => {
    const result = scoreLoan(ctcLoan(daysFromNow(14)))
    expect(result.urgencyScore).toBe(95)
  })

  it('closing date in the past → +40, isPastDue = true', () => {
    const result = scoreLoan(ctcLoan(daysFromNow(-3)))
    expect(result.isPastDue).toBe(true)
    expect(result.urgencyScore).toBe(100)   // 95 + 40 = 135 → capped
  })

  it('uses estimated_closing_date when closing_date is null', () => {
    const loan = baseLoan({
      status: 'Loan in Process',
      closing_date: null,
      estimated_closing_date: daysFromNow(0),
      lastActivityAt: hoursAgo(1),
    })
    const result = scoreLoan(loan)
    // 50 base + 30 (today) = 80 → CRITICAL
    expect(result.urgencyScore).toBe(80)
    expect(result.urgencyLabel).toBe('CRITICAL')
  })
})

// ── Score cap ─────────────────────────────────────────────────────────────────

describe('score cap at 100', () => {
  it('CTC + past due + 72h decay never exceeds 100', () => {
    const loan = baseLoan({
      status: 'CLEAR_TO_CLOSE',
      closing_date: daysFromNow(-5),
      lastActivityAt: hoursAgo(100),
    })
    const result = scoreLoan(loan)
    expect(result.urgencyScore).toBe(100)
    expect(result.urgencyScore).toBeLessThanOrEqual(100)
  })
})

// ── Urgency labels ────────────────────────────────────────────────────────────

describe('urgency label thresholds', () => {
  it('score 80–100 → CRITICAL', () => {
    const result = scoreLoan(baseLoan({ status: 'CLEAR_TO_CLOSE' })) // 95
    expect(result.urgencyLabel).toBe('CRITICAL')
  })

  it('score 60–79 → HIGH', () => {
    const result = scoreLoan(baseLoan({ status: 'DISCLOSURE_SENT' })) // 70
    expect(result.urgencyLabel).toBe('HIGH')
  })

  it('score 40–59 → MEDIUM', () => {
    const result = scoreLoan(baseLoan({ status: 'Loan in Process' })) // 50
    expect(result.urgencyLabel).toBe('MEDIUM')
  })

  it('score < 40 → LOW', () => {
    const result = scoreLoan(baseLoan({ status: 'LOAN_SETUP' })) // 30
    expect(result.urgencyLabel).toBe('LOW')
  })
})

// ── isPastDue flag ────────────────────────────────────────────────────────────

describe('isPastDue flag', () => {
  it('future closing date → isPastDue = false', () => {
    const result = scoreLoan(baseLoan({ closing_date: daysFromNow(10) }))
    expect(result.isPastDue).toBe(false)
  })

  it('past closing date → isPastDue = true', () => {
    const result = scoreLoan(baseLoan({ closing_date: daysFromNow(-1) }))
    expect(result.isPastDue).toBe(true)
  })

  it('no closing date → isPastDue = false', () => {
    const result = scoreLoan(baseLoan({ closing_date: null, estimated_closing_date: null }))
    expect(result.isPastDue).toBe(false)
  })
})

// ── rankLoans ─────────────────────────────────────────────────────────────────

describe('rankLoans', () => {
  it('returns loans sorted highest score first', () => {
    const loans: LoanForScoring[] = [
      baseLoan({ id: 'a', status: 'LOAN_SETUP' }),          // low
      baseLoan({ id: 'b', status: 'CLEAR_TO_CLOSE' }),      // critical
      baseLoan({ id: 'c', status: 'DISCLOSURE_SENT' }),     // high
    ]
    const ranked = rankLoans(loans)
    expect(ranked.map(l => l.id)).toEqual(['b', 'c', 'a'])
  })

  it('returns empty array for empty input', () => {
    expect(rankLoans([])).toEqual([])
  })
})
