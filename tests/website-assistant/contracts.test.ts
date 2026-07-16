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

  it('only reports a nonce collision as a replay', () => {
    const route = fs.readFileSync('src/app/api/v1/website-assistant/[operation]/route.ts', 'utf8')
    expect(route).toContain("nonceError.code === '23505'")
    expect(route).toContain("'security_store_unavailable'")
  })

  it('prefers the server-only Supabase URL for isolated previews', () => {
    const serviceClient = fs.readFileSync('src/lib/supabase/service.ts', 'utf8')
    expect(serviceClient).toContain('process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL')
  })

  it('creates a follow-up task and sends lead notifications after contact capture', () => {
    const route = fs.readFileSync('src/app/api/v1/website-assistant/[operation]/route.ts', 'utf8')
    expect(route).toContain('assistant-followup:')
    expect(route).toContain('sendWebsiteAssistantLeadNotifications')
    expect(route).toContain('followUpTaskId')
  })

  it('serves transcripts through an authenticated contact-scoped route', () => {
    const route = fs.readFileSync('src/app/api/contacts/[id]/website-conversations/route.ts', 'utf8')
    expect(route).toContain('getOrganization()')
    expect(route).toContain(".eq('organization_id', organizationId)")
    expect(route).toContain(".eq('contact_id', params.id)")
    expect(route).toContain("'Cache-Control': 'no-store'")
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
