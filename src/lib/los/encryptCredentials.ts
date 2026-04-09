/**
 * src/lib/los/encryptCredentials.ts
 *
 * AES-256-GCM encryption for LOS (Loan Origination System) credentials.
 *
 * Why GCM over CBC: GCM is authenticated encryption — it bundles a MAC
 * (the auth tag) directly with the ciphertext, so we detect tampering at
 * decrypt time rather than silently returning corrupted plaintext.
 *
 * Key management:
 *   LOANOS_LOS_ENCRYPTION_KEY env var holds the master key as 64 hex chars
 *   (= 32 raw bytes = 256 bits). Generate once with:
 *     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 *   Store in Vercel env vars (encrypted at rest by Vercel) and 1Password.
 *   NEVER commit. Rotating this key requires re-encrypting every row in
 *   los_integrations — there is no key-rotation automation yet.
 *
 * IV / nonce:
 *   12 bytes of random per encryption. NEVER reuse an IV with the same key
 *   (catastrophic GCM failure → plaintext recovery). We generate fresh each
 *   time, so safe by construction.
 *
 * Schema of decrypted plaintext (JSON):
 *   {
 *     "clientId":  "ariveClientId",
 *     "secretKey": "ariveSecretKey",
 *     "apiKey":    "ariveApiKey"
 *   }
 * All three are required for Arive OAuth + API calls. See ariveClient.ts.
 */

import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12 // GCM standard
const KEY_LENGTH_BYTES = 32 // AES-256

export interface AriveCredentials {
  clientId: string
  secretKey: string
  apiKey: string
}

export interface EncryptedBlob {
  encrypted_credentials: string // hex
  encryption_iv: string         // hex
  encryption_auth_tag: string   // hex
}

function getMasterKey(): Buffer {
  const hex = process.env.LOANOS_LOS_ENCRYPTION_KEY
  if (!hex) {
    throw new Error(
      'LOANOS_LOS_ENCRYPTION_KEY env var not set. Generate with: ' +
        'node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    )
  }
  const key = Buffer.from(hex, 'hex')
  if (key.length !== KEY_LENGTH_BYTES) {
    throw new Error(
      `LOANOS_LOS_ENCRYPTION_KEY must decode to ${KEY_LENGTH_BYTES} bytes (got ${key.length}). ` +
        'Expected 64 hex characters.'
    )
  }
  return key
}

/**
 * Encrypts an Arive credentials object for storage in los_integrations.
 * Returns the three hex-encoded columns to insert.
 */
export function encryptCredentials(creds: AriveCredentials): EncryptedBlob {
  const key = getMasterKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  const plaintext = Buffer.from(JSON.stringify(creds), 'utf8')

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()])
  const authTag = cipher.getAuthTag()

  return {
    encrypted_credentials: ciphertext.toString('hex'),
    encryption_iv: iv.toString('hex'),
    encryption_auth_tag: authTag.toString('hex'),
  }
}

/**
 * Decrypts a los_integrations row back into an AriveCredentials object.
 * Throws if the auth tag doesn't match (tampering or wrong key).
 */
export function decryptCredentials(blob: EncryptedBlob): AriveCredentials {
  const key = getMasterKey()
  const iv = Buffer.from(blob.encryption_iv, 'hex')
  const authTag = Buffer.from(blob.encryption_auth_tag, 'hex')
  const ciphertext = Buffer.from(blob.encrypted_credentials, 'hex')

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()])

  const parsed = JSON.parse(plaintext.toString('utf8')) as AriveCredentials
  if (!parsed.clientId || !parsed.secretKey || !parsed.apiKey) {
    throw new Error('Decrypted credentials missing required fields')
  }
  return parsed
}
