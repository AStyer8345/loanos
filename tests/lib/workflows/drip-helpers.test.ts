// tests/lib/workflows/drip-helpers.test.ts
import { describe, it, expect } from 'vitest'
import {
  shouldExitDrip,
  mapResendEventType,
  buildDripScheduleDays,
} from '@/lib/workflows/drip-helpers'

describe('shouldExitDrip', () => {
  it('exits when email_opt_out is true', () => {
    expect(shouldExitDrip({ email_opt_out: true, status: 'active', recentBounce: false, recentComplaint: false })).toBe(true)
  })

  it('exits on hard bounce', () => {
    expect(shouldExitDrip({ email_opt_out: false, status: 'active', recentBounce: true, recentComplaint: false })).toBe(true)
  })

  it('exits on complaint', () => {
    expect(shouldExitDrip({ email_opt_out: false, status: 'active', recentBounce: false, recentComplaint: true })).toBe(true)
  })

  it('exits when enrollment is not active', () => {
    expect(shouldExitDrip({ email_opt_out: false, status: 'paused', recentBounce: false, recentComplaint: false })).toBe(true)
  })

  it('does NOT exit when all conditions are clean', () => {
    expect(shouldExitDrip({ email_opt_out: false, status: 'active', recentBounce: false, recentComplaint: false })).toBe(false)
  })
})

describe('mapResendEventType', () => {
  it('maps Resend event names to activity_log event_type values', () => {
    expect(mapResendEventType('email.sent')).toBe('email.sent')
    expect(mapResendEventType('email.delivered')).toBe('email.delivered')
    expect(mapResendEventType('email.bounced')).toBe('email.bounced')
    expect(mapResendEventType('email.complained')).toBe('email.complained')
    expect(mapResendEventType('email.opened')).toBe('email.opened')
    expect(mapResendEventType('email.clicked')).toBe('email.clicked')
    expect(mapResendEventType('email.delivery_delayed')).toBe('email.delivery_delayed')
  })

  it('returns null for unknown event types', () => {
    expect(mapResendEventType('contact.created')).toBeNull()
  })
})

describe('buildDripScheduleDays', () => {
  it('returns PA Welcome schedule', () => {
    expect(buildDripScheduleDays('pa-welcome')).toEqual([0, 3, 7, 14, 30, 60])
  })

  it('returns DPA Guide schedule', () => {
    expect(buildDripScheduleDays('dpa-guide')).toEqual([0, 2, 5, 10, 17, 25, 38, 52])
  })
})
