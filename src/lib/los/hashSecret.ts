/**
 * src/lib/los/hashSecret.ts
 *
 * SHA-256 + random salt secret hashing for LOS webhook authentication.
 *
 * Why not bcrypt/argon2: webhook secret verification happens on every
 * inbound webhook (potentially high-frequency), and the secrets are
 * high-entropy server-generated tokens (not user passwords). A fast
 * hash + timing-safe comparison is the right tradeoff — bcrypt would
 * add 10-100ms per webhook for no real security benefit against a
 * 256-bit random secret.
 *
 * Secret format: `whsec_` + 48 url-safe base64 chars (~288 bits entropy).
 * The prefix makes secrets visually identifiable in logs so an operator
 * can spot if one has accidentally been committed or pasted publicly.
 */

import crypto from 'crypto'

export interface HashedSecret {
  secret_hash: string
  secret_salt: string
}

/**
 * Generate a new webhook secret. Call once during onboarding, show the
 * plaintext to the LO exactly once (they paste it into their Zap header),
 * then store only the hash.
 */
export function generateSecret(): string {
  const raw = crypto.randomBytes(36).toString('base64url')
  return `whsec_${raw}`
}

/**
 * Hash a plaintext secret for storage. Uses a per-secret salt so two orgs
 * with the same (improbable) secret don't collide and rainbow tables are
 * useless.
 */
export function hashSecret(plaintext: string): HashedSecret {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto
    .createHash('sha256')
    .update(salt + plaintext)
    .digest('hex')
  return { secret_hash: hash, secret_salt: salt }
}

/**
 * Timing-safe verify an inbound secret against a stored hash+salt pair.
 * Returns false for any error (wrong secret, malformed stored row, etc.)
 * rather than throwing, so the webhook handler can simply treat false as
 * "reject" without special-casing.
 */
export function verifySecret(plaintext: string, stored: HashedSecret): boolean {
  try {
    const computed = crypto
      .createHash('sha256')
      .update(stored.secret_salt + plaintext)
      .digest('hex')
    const a = Buffer.from(computed, 'hex')
    const b = Buffer.from(stored.secret_hash, 'hex')
    if (a.length !== b.length) return false
    return crypto.timingSafeEqual(a, b)
  } catch {
    return false
  }
}
