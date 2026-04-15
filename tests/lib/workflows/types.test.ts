// tests/lib/workflows/types.test.ts
import { describe, it, expect } from 'vitest'
import type { WebLeadPayload } from '@/lib/workflows/types'

describe('WebLeadPayload shape', () => {
  it('accepts required fields', () => {
    const payload: WebLeadPayload = {
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane@example.com',
      phone: null,
      loan_goal: 'purchase',
      source_page: '/get-preapproved',
      form_name: 'pre-approval-form',
      utm_params: { source: 'google', medium: 'cpc', campaign: 'spring2026' },
      referrer: 'https://google.com',
      org_id: 'org-uuid-here',
    }
    expect(payload.first_name).toBe('Jane')
  })
})
