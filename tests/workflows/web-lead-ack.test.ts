import { beforeEach, describe, expect, it, vi } from 'vitest'

const sendViaResend = vi.fn().mockResolvedValue('mock-resend-id-ack')

vi.mock('@/lib/resend/send', () => ({
  sendViaResend,
}))

describe('webLeadAcknowledgmentWorkflow', () => {
  beforeEach(() => {
    sendViaResend.mockClear()
  })

  it('sends a transactional acknowledgment with Adam contact details', async () => {
    const { webLeadAcknowledgmentWorkflow } = await import('@/workflows/web-lead-intake')

    await webLeadAcknowledgmentWorkflow({
      org_id: 'org-1',
      contact_id: 'contact-123',
      first_name: 'Jane',
      email: 'jane@example.com',
      loan_goal: 'jumbo',
      source_page: 'https://styermortgage.com/',
      form_name: 'hero-quick-lead',
    })

    expect(sendViaResend).toHaveBeenCalledOnce()
    expect(sendViaResend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'jane@example.com',
        subject: 'Got your message, Jane - Adam Styer',
        replyTo: 'adam@thestyerteam.com',
        tags: { kind: 'lead_confirmation', source: 'web-lead-ack' },
        log: { organizationId: 'org-1', contactId: 'contact-123', template: 'lead_confirmation' },
      })
    )

    const body = sendViaResend.mock.calls[0][0].body
    expect(body).toContain('tel:5129566010')
    expect(body).toContain('adam@thestyerteam.com')
    expect(body).toContain('https://calendly.com/adamstyer/15minutes')
    expect(body).toContain('NMLS #513013')
    expect(body).toContain('Kyber Mortgage Corporation dba HyperSmart Home Loans')
    expect(body).toContain('This is an automated confirmation')
  })

  it('does not send without a borrower email', async () => {
    const { webLeadAcknowledgmentWorkflow } = await import('@/workflows/web-lead-intake')

    await webLeadAcknowledgmentWorkflow({
      org_id: 'org-1',
      contact_id: 'contact-123',
      first_name: 'Jane',
      email: null,
      loan_goal: 'jumbo',
      source_page: null,
      form_name: null,
    })

    expect(sendViaResend).not.toHaveBeenCalled()
  })
})
