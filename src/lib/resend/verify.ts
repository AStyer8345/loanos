// src/lib/resend/verify.ts
import { Webhook } from 'svix'
import type { ResendWebhookEvent } from '@/lib/workflows/types'

export async function verifyResendSignature(
  rawBody: string,
  headers: Record<string, string | string[] | undefined>,
  secret: string
): Promise<ResendWebhookEvent> {
  const wh = new Webhook(secret)
  const payload = wh.verify(rawBody, {
    'svix-id': headers['svix-id'] as string,
    'svix-timestamp': headers['svix-timestamp'] as string,
    'svix-signature': headers['svix-signature'] as string,
  })
  return payload as ResendWebhookEvent
}
