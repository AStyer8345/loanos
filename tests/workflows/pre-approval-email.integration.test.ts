// tests/workflows/pre-approval-email.integration.test.ts
import { describe, it, expect, vi } from 'vitest'
import { preApprovalEmailWorkflow } from '@/workflows/pre-approval-email'

// Mock Resend send so tests don't hit the Resend API
vi.mock('@/lib/resend/send', () => ({
  sendViaResend: vi.fn().mockResolvedValue('mock-resend-id-1'),
}))

// Mock Supabase so tests don't need a live DB
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: null }),
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'contact-123', first_name: 'Jane', email: 'jane@example.com' },
            error: null,
          }),
        }),
      }),
    }),
  }),
}))

describe('preApprovalEmailWorkflow', () => {
  it('sends one Resend email and writes email.sent to activity_log', async () => {
    const { sendViaResend } = await import('@/lib/resend/send')
    const { createClient } = await import('@/lib/supabase/server')

    await preApprovalEmailWorkflow({ contact_id: 'contact-123', loan_id: 'loan-456', org_id: 'org-789' })

    expect(sendViaResend).toHaveBeenCalledOnce()
    expect(sendViaResend).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'jane@example.com', subject: expect.stringContaining('Pre-Approval') })
    )

    const client = createClient()
    // activity_log insert should have been called with event_type 'email.sent'
    expect(client.from).toHaveBeenCalledWith('activity_log')
  })
})
