import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import { normalizeEmail, normalizePhone, parseOperationInput } from '@/lib/website-assistant/contracts'

const base = {
  conversationId: '11111111-1111-4111-8111-111111111111',
  correlationId: 'corr-1',
}

describe('website assistant contracts', () => {
  it('keeps the signed service API outside user-session middleware', () => {
    const middleware = fs.readFileSync('src/middleware.ts', 'utf8')
    expect(middleware).toContain('api/v1/website-assistant/.*')
  })

  it('normalizes email without provider-specific rewriting', () => {
    expect(normalizeEmail(' Adam+Mortgage@Example.COM ')).toBe('adam+mortgage@example.com')
  })

  it('normalizes supported US phones to E.164', () => {
    expect(normalizePhone('(512) 555-1212')).toBe('+15125551212')
    expect(normalizePhone('+1 512 555 1212')).toBe('+15125551212')
    expect(normalizePhone('555-1212')).toBeNull()
  })

  it('requires a contact method and privacy consent for lead creation', () => {
    expect(() => parseOperationInput('create_or_update_website_lead', {
      ...base,
      firstName: 'Alex',
      leadIntent: 'purchase',
      consents: [],
    })).toThrow('email or phone is required')

    expect(() => parseOperationInput('create_or_update_website_lead', {
      ...base,
      firstName: 'Alex',
      email: 'alex@example.com',
      leadIntent: 'purchase',
      consents: [],
    })).toThrow('privacy consent is required')
  })

  it('accepts the minimum approved lead shape', () => {
    const input = parseOperationInput('create_or_update_website_lead', {
      ...base,
      firstName: 'Alex',
      email: 'Alex@Example.com',
      leadIntent: 'information',
      consents: [{ type: 'privacy', status: 'granted', policyVersion: 'PLACEHOLDER-v1' }],
    })
    expect(input.operation).toBe('create_or_update_website_lead')
    if (input.operation === 'create_or_update_website_lead') expect(input.email).toBe('alex@example.com')
  })
})
