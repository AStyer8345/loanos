import { createHash, createHmac, timingSafeEqual } from 'node:crypto'

export type SignatureHeaders = {
  keyId: string
  timestamp: string
  nonce: string
  signature: string
  idempotencyKey: string
}

export function bodyDigest(body: string): string {
  return createHash('sha256').update(body, 'utf8').digest('hex')
}

export function canonicalRequest(method: string, pathname: string, headers: Omit<SignatureHeaders, 'signature' | 'idempotencyKey'>, body: string): string {
  return [method.toUpperCase(), pathname, headers.timestamp, headers.nonce, bodyDigest(body)].join('\n')
}

export function signRequest(secret: string, canonical: string): string {
  return `sha256=${createHmac('sha256', secret).update(canonical, 'utf8').digest('hex')}`
}

export function verifySignature(secret: string, canonical: string, supplied: string): boolean {
  const expected = signRequest(secret, canonical)
  const left = Buffer.from(expected)
  const right = Buffer.from(supplied)
  return left.length === right.length && timingSafeEqual(left, right)
}

export function parseSignatureHeaders(request: Request): SignatureHeaders {
  const keyId = request.headers.get('x-assistant-key-id')?.trim() ?? ''
  const timestamp = request.headers.get('x-assistant-timestamp')?.trim() ?? ''
  const nonce = request.headers.get('x-assistant-nonce')?.trim() ?? ''
  const signature = request.headers.get('x-assistant-signature')?.trim() ?? ''
  const idempotencyKey = request.headers.get('x-idempotency-key')?.trim() ?? ''
  if (!/^[A-Za-z0-9._-]{1,80}$/.test(keyId)) throw new Error('Invalid key id')
  if (!/^\d{10,13}$/.test(timestamp)) throw new Error('Invalid timestamp')
  if (!/^[A-Za-z0-9._:-]{16,128}$/.test(nonce)) throw new Error('Invalid nonce')
  if (!/^sha256=[0-9a-f]{64}$/i.test(signature)) throw new Error('Invalid signature')
  if (!/^[A-Za-z0-9._:-]{8,128}$/.test(idempotencyKey)) throw new Error('Invalid idempotency key')
  return { keyId, timestamp, nonce, signature, idempotencyKey }
}

export function assertFreshTimestamp(timestamp: string, now = Date.now(), maxSkewMs = 5 * 60_000): void {
  const raw = Number(timestamp)
  const millis = timestamp.length === 10 ? raw * 1000 : raw
  if (!Number.isFinite(millis) || Math.abs(now - millis) > maxSkewMs) throw new Error('Expired request')
}
