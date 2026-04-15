// tests/workflows/web-lead-intake.integration.test.ts
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/resend/send', () => ({
  sendViaResend: vi.fn().mockResolvedValue('mock-resend-id-1'),
}))

vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue({
      upsert: vi.fn().mockResolvedValue({ data: [{ id: 'contact-123' }], error: null }),
      insert: vi.fn().mockResolvedValue({ error: null }),
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'contact-123', first_name: 'Jane', email: 'jane@example.com', organization_id: 'org-1' },
            error: null,
          }),
        }),
      }),
      update: vi.fn().mockResolvedValue({ error: null }),
    }),
  }),
}))

vi.mock('workflow', () => ({
  start: vi.fn().mockResolvedValue(undefined),
}))

describe('webLeadIntakeWorkflow — classification', () => {
  it('classifies loan_goal=dpa as dpa', async () => {
    const { classifyLeadFallback } = await import('@/lib/workflows/drip-helpers')
    expect(classifyLeadFallback({ loan_goal: 'dpa', situation: '' })).toBe('dpa')
  })

  it('classifies loan_goal=purchase as pa', async () => {
    const { classifyLeadFallback } = await import('@/lib/workflows/drip-helpers')
    expect(classifyLeadFallback({ loan_goal: 'purchase', situation: '' })).toBe('pa')
  })

  it('classifies unknown goal as generic', async () => {
    const { classifyLeadFallback } = await import('@/lib/workflows/drip-helpers')
    expect(classifyLeadFallback({ loan_goal: null, situation: '' })).toBe('generic')
  })
})
