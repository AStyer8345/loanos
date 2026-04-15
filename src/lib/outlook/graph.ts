// src/lib/outlook/graph.ts
import { Client } from '@microsoft/microsoft-graph-client'
import { ClientSecretCredential } from '@azure/identity'

export interface OutlookEmailParams {
  to: string
  subject: string
  body: string                  // HTML
  fromUserId: string            // UPN or object ID of the sending mailbox
  cc?: string[]
}

export interface OutlookSendResult {
  messageId: string
}

function getGraphClient(): Client {
  const clientId = process.env.OUTLOOK_GRAPH_CLIENT_ID
  const clientSecret = process.env.OUTLOOK_GRAPH_CLIENT_SECRET
  const tenantId = process.env.OUTLOOK_GRAPH_TENANT_ID

  if (!clientId) throw new Error('OUTLOOK_GRAPH_CLIENT_ID is not set')
  if (!clientSecret) throw new Error('OUTLOOK_GRAPH_CLIENT_SECRET is not set')
  if (!tenantId) throw new Error('OUTLOOK_GRAPH_TENANT_ID is not set')

  const credential = new ClientSecretCredential(tenantId, clientId, clientSecret)

  return Client.initWithMiddleware({
    authProvider: {
      getAccessToken: async () => {
        const token = await credential.getToken('https://graph.microsoft.com/.default')
        return token.token
      },
    },
  })
}

export async function sendOutlookEmail(
  params: OutlookEmailParams
): Promise<OutlookSendResult> {
  const client = getGraphClient()

  const message = {
    subject: params.subject,
    body: { contentType: 'HTML', content: params.body },
    toRecipients: [{ emailAddress: { address: params.to } }],
    ...(params.cc?.length
      ? { ccRecipients: params.cc.map((addr) => ({ emailAddress: { address: addr } })) }
      : {}),
  }

  const result = await client
    .api(`/users/${params.fromUserId}/sendMail`)
    .post({ message, saveToSentItems: true })

  return { messageId: result?.id ?? 'sent' }
}
