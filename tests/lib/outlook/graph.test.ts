// tests/lib/outlook/graph.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sendOutlookEmail, OutlookEmailParams } from '@/lib/outlook/graph'

vi.mock('@microsoft/microsoft-graph-client', () => ({
  Client: {
    initWithMiddleware: vi.fn().mockReturnValue({
      api: vi.fn().mockReturnValue({
        post: vi.fn().mockResolvedValue({ id: 'message-id-123' }),
      }),
    }),
  },
}))

vi.mock('@azure/identity', () => ({
  ClientSecretCredential: vi.fn().mockImplementation(function () {
    return { getToken: vi.fn().mockResolvedValue({ token: 'mock-token' }) }
  }),
}))

describe('sendOutlookEmail', () => {
  const params: OutlookEmailParams = {
    to: 'borrower@example.com',
    subject: 'Your Pre-Approval is Ready',
    body: '<p>Congratulations!</p>',
    fromUserId: 'adam@styermortgage.com',
  }

  beforeEach(() => {
    process.env.OUTLOOK_GRAPH_CLIENT_ID = 'test-client-id'
    process.env.OUTLOOK_GRAPH_CLIENT_SECRET = 'test-client-secret'
    process.env.OUTLOOK_GRAPH_TENANT_ID = 'test-tenant-id'
  })

  it('calls Microsoft Graph send mail endpoint', async () => {
    const result = await sendOutlookEmail(params)
    expect(result.messageId).toBeDefined()
  })

  it('throws if required env vars are missing', async () => {
    const origClient = process.env.OUTLOOK_GRAPH_CLIENT_ID
    delete process.env.OUTLOOK_GRAPH_CLIENT_ID
    await expect(sendOutlookEmail(params)).rejects.toThrow('OUTLOOK_GRAPH_CLIENT_ID')
    process.env.OUTLOOK_GRAPH_CLIENT_ID = origClient
  })
})
