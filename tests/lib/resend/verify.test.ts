// tests/lib/resend/verify.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { verifyResendSignature } from '@/lib/resend/verify'

// Top-level mock — hoisted by Vitest before any imports
vi.mock('svix', () => ({
  Webhook: vi.fn(),
}))

import { Webhook } from 'svix'

describe('verifyResendSignature', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns verified payload on valid signature', async () => {
    const mockVerify = vi.fn().mockReturnValue({ type: 'email.delivered', data: {} })
    vi.mocked(Webhook).mockImplementation(function (this: unknown) {
      return { verify: mockVerify } as unknown as InstanceType<typeof Webhook>
    } as unknown as typeof Webhook)

    const result = await verifyResendSignature(
      'raw-body-string',
      {
        'svix-id': 'msg_abc',
        'svix-timestamp': '1234567890',
        'svix-signature': 'v1,abc',
      },
      'whsec_test'
    )
    expect(result.type).toBe('email.delivered')
  })

  it('throws on invalid signature', async () => {
    const mockVerify = vi.fn().mockImplementation(() => {
      throw new Error('invalid signature')
    })
    vi.mocked(Webhook).mockImplementation(function (this: unknown) {
      return { verify: mockVerify } as unknown as InstanceType<typeof Webhook>
    } as unknown as typeof Webhook)

    await expect(
      verifyResendSignature('bad-body', {}, 'whsec_test')
    ).rejects.toThrow('invalid signature')
  })
})
