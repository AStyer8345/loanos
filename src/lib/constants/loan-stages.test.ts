import { describe, expect, it } from 'vitest'
import {
  FUNDED_STATUSES,
  INACTIVE_STATUSES,
  isFundedStatus,
  normalizeToStageKey,
  toDashboardStage,
} from './loan-stages'

describe('Commission Paid loan status', () => {
  it.each(['Commission Paid', 'commission paid', 'COMMISSION_PAID'])(
    'normalizes %s into the funded/closed stage',
    status => {
      expect(normalizeToStageKey(status)).toBe('funded')
      expect(isFundedStatus(status)).toBe(true)
      expect(toDashboardStage(status)).toBe('Funded')
    }
  )

  it('is included in raw funded queries and excluded from the active pipeline', () => {
    expect(FUNDED_STATUSES).toContain('Commission Paid')
    expect(INACTIVE_STATUSES).toContain('Commission Paid')
  })
})
