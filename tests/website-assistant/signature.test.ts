import { describe, expect, it } from 'vitest'
import { assertFreshTimestamp, canonicalRequest, signRequest, verifySignature } from '@/lib/website-assistant/signature'

describe('website assistant service signatures', () => {
  it('signs the method, path, timestamp, nonce, and body digest', () => {
    const headers = { keyId: 'site-v1', timestamp: '1700000000000', nonce: '0123456789abcdef' }
    const canonical = canonicalRequest('post', '/api/v1/website-assistant/escalate_to_adam', headers, '{"safe":true}')
    const signature = signRequest('test-secret', canonical)
    expect(verifySignature('test-secret', canonical, signature)).toBe(true)
    expect(verifySignature('wrong-secret', canonical, signature)).toBe(false)
  })

  it('rejects expired requests', () => {
    expect(() => assertFreshTimestamp('1700000000000', 1700000600001)).toThrow('Expired request')
  })
})
