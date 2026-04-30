/**
 * src/lib/microsoft/encryptToken.ts
 *
 * AES-256-GCM token encryption for Microsoft Graph OAuth credentials.
 * Reuses the LOANOS_LOS_ENCRYPTION_KEY env var — same security context
 * (third-party API credentials), no need for a separate key.
 *
 * The encrypted blob is JSON of shape:
 *   { access_token: string, refresh_token: string, scope: string }
 *
 * IV is 12 random bytes per encryption (GCM standard). Auth tag is 16 bytes,
 * stored separately. Ciphertext + IV + tag are all hex-encoded for storage.
 */

import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const KEY_LENGTH_BYTES = 32

export interface MicrosoftTokens {
  access_token: string
  refresh_token: string
  scope: string
}

export interface EncryptedTokenBlob {
  ciphertext: string  // hex
  iv: string          // hex
  auth_tag: string    // hex
}

function getMasterKey(): Buffer {
  const hex = process.env.LOANOS_LOS_ENCRYPTION_KEY
  if (!hex) {
    throw new Error(
      'LOANOS_LOS_ENCRYPTION_KEY env var not set. Required for Microsoft Graph token storage.'
    )
  }
  const key = Buffer.from(hex, 'hex')
  if (key.length !== KEY_LENGTH_BYTES) {
    throw new Error(`LOANOS_LOS_ENCRYPTION_KEY must decode to ${KEY_LENGTH_BYTES} bytes, got ${key.length}`)
  }
  return key
}

export function encryptTokens(tokens: MicrosoftTokens): EncryptedTokenBlob {
  const key = getMasterKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  const plaintext = Buffer.from(JSON.stringify(tokens), 'utf8')
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()])
  return {
    ciphertext: ciphertext.toString('hex'),
    iv: iv.toString('hex'),
    auth_tag: cipher.getAuthTag().toString('hex'),
  }
}

export function decryptTokens(blob: EncryptedTokenBlob): MicrosoftTokens {
  const key = getMasterKey()
  const iv = Buffer.from(blob.iv, 'hex')
  const authTag = Buffer.from(blob.auth_tag, 'hex')
  const ciphertext = Buffer.from(blob.ciphertext, 'hex')
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()])
  return JSON.parse(plaintext.toString('utf8')) as MicrosoftTokens
}
