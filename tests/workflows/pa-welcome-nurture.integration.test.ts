// tests/workflows/pa-welcome-nurture.integration.test.ts
import { describe, it, expect, vi } from 'vitest'
import { shouldExitDrip, buildDripScheduleDays } from '@/lib/workflows/drip-helpers'

// Mock resend — no real network calls
vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: vi.fn().mockResolvedValue({ data: { id: 'mock-id' }, error: null }),
    },
  })),
}))

// Mock @microsoft/microsoft-graph-client — not used in this workflow but guard anyway
vi.mock('@microsoft/microsoft-graph-client', () => ({}))

// Test the exit-rule integration without running the full workflow
// (full sleep-based tests require @workflow/vitest harness — see smoke-checklist.md)
describe('PA Welcome nurture exit rules', () => {
  it('exits immediately when email_opt_out is set', () => {
    const result = shouldExitDrip({
      email_opt_out: true,
      status: 'active',
      recentBounce: false,
      recentComplaint: false,
    })
    expect(result).toBe(true)
  })

  it('continues when contact is clean at step 0', () => {
    const result = shouldExitDrip({
      email_opt_out: false,
      status: 'active',
      recentBounce: false,
      recentComplaint: false,
    })
    expect(result).toBe(false)
  })

  it('schedule has 6 entries', () => {
    expect(buildDripScheduleDays('pa-welcome')).toHaveLength(6)
  })

  it('exits when enrollment status is not active', () => {
    const result = shouldExitDrip({
      email_opt_out: false,
      status: 'removed',
      recentBounce: false,
      recentComplaint: false,
    })
    expect(result).toBe(true)
  })

  it('exits when recentBounce is true', () => {
    const result = shouldExitDrip({
      email_opt_out: false,
      status: 'active',
      recentBounce: true,
      recentComplaint: false,
    })
    expect(result).toBe(true)
  })

  it('pa-welcome schedule day offsets are correct', () => {
    expect(buildDripScheduleDays('pa-welcome')).toEqual([0, 3, 7, 14, 30, 60])
  })
})
