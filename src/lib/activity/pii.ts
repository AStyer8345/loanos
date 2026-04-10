/**
 * PII encryption/decryption for activity_log_pii.
 *
 * Uses AES-256-GCM with a hex key from process.env.PII_ENCRYPTION_KEY.
 * Key never touches the database — ciphertext + IV + tag are stored in
 * activity_log_pii, decryption happens in-process on read.
 *
 * key_version supports dual-key rotation: bump the version on new writes,
 * keep the old key available for reads until re-encryption completes.
 */

import { randomBytes, createCipheriv, createDecipheriv } from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'

// ── Types ────────────────────────────────────────────────────────────────────

/** Fields that get encrypted into the PII blob. All optional so callers only
 *  pass what they have — omitted fields are simply absent from the JSON. */
export interface PiiPayload {
  summary?: string | null
  subject?: string | null
  body_snippet?: string | null
  from_address?: string | null
  raw_payload?: Record<string, unknown> | null
  metadata?: Record<string, unknown> | null
}

/** The non-PII fields for an activity_log row. */
export interface ActivityPublicFields {
  action: string
  entity_type?: string | null
  entity_id?: string | null
  loan_id?: string | null
  contact_id?: string | null
  user_id?: string | null
  organization_id: string
  type?: string | null
  occurred_at?: string | null
  external_id?: string | null
  dismissed?: boolean
  // Legacy columns used by some write sites with non-standard names
  record_id?: string | null
  record_type?: string | null
  details?: string | null
}

interface EncryptedBlob {
  ciphertext: Buffer
  iv: Buffer
  tag: Buffer
  key_version: number
}

// ── Key management ───────────────────────────────────────────────────────────

const CURRENT_KEY_VERSION = 1

function getKey(version: number = CURRENT_KEY_VERSION): Buffer {
  const envName = version === CURRENT_KEY_VERSION
    ? 'PII_ENCRYPTION_KEY'
    : `PII_ENCRYPTION_KEY_V${version}`
  const hex = process.env[envName]
  if (!hex) {
    throw new Error(`Missing env var ${envName} for PII encryption (key version ${version})`)
  }
  const key = Buffer.from(hex, 'hex')
  if (key.length !== 32) {
    throw new Error(`${envName} must be 32 bytes (64 hex chars), got ${key.length} bytes`)
  }
  return key
}

// ── Postgres bytea serialization ─────────────────────────────────────────────
// PostgREST serializes Buffer inserts to JSON as `{"type":"Buffer","data":[…]}`
// and stores that *literal string* into the bytea column, which is catastrophic:
// the "encrypted" row round-trips as unparseable garbage even with the right key.
// Fix: explicitly encode Buffers as PostgreSQL's canonical hex-escape format
// (`\x<hex>`) before insert, and parse the same format on read. PostgREST
// accepts that string, the server unpacks it into raw bytes, and reads return
// the `\x<hex>` shape by default.

/** Encode a Buffer as the PG bytea hex-escape literal (`\x48656c6c6f`). */
function byteaEncode(buf: Buffer): string {
  return '\\x' + buf.toString('hex')
}

/** Decode a PG bytea value back to a Buffer. Handles both hex-escape
 *  (`\x...`, PostgREST default) and base64 (some client configs) so a
 *  config change upstream doesn't silently corrupt reads. */
function byteaDecode(input: unknown): Buffer {
  if (Buffer.isBuffer(input)) return input
  if (input instanceof Uint8Array) return Buffer.from(input)
  if (typeof input !== 'string') {
    throw new Error(`byteaDecode: expected string, got ${typeof input}`)
  }
  if (input.startsWith('\\x')) return Buffer.from(input.slice(2), 'hex')
  // Fallback — treat as base64 (legacy behavior the read path used to assume)
  return Buffer.from(input, 'base64')
}

// ── Encrypt / Decrypt ────────────────────────────────────────────────────────

function encrypt(payload: PiiPayload): EncryptedBlob {
  const key = getKey()
  const iv = randomBytes(12) // 96-bit nonce for GCM
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const plaintext = JSON.stringify(payload)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  return {
    ciphertext: encrypted,
    iv,
    tag: cipher.getAuthTag(),
    key_version: CURRENT_KEY_VERSION,
  }
}

function decrypt(
  ciphertext: Buffer,
  iv: Buffer,
  tag: Buffer,
  keyVersion: number
): PiiPayload | null {
  try {
    const key = getKey(keyVersion)
    const decipher = createDecipheriv('aes-256-gcm', key, iv)
    decipher.setAuthTag(tag)
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()])
    return JSON.parse(decrypted.toString('utf8'))
  } catch {
    // Decryption failure — key mismatch, corrupted data, or tampered ciphertext.
    // Return null so the caller can show "[encrypted]" instead of crashing.
    console.error(`[pii] decrypt failed for key version ${keyVersion}`)
    return null
  }
}

// ── Write helper ─────────────────────────────────────────────────────────────

/**
 * Insert an activity_log row + its encrypted PII companion in one call.
 * Uses service-role client so RLS doesn't block the PII insert.
 *
 * If PII_ENCRYPTION_KEY is not set (e.g. local dev without env), falls back
 * to writing PII fields directly into activity_log (legacy behavior) so
 * dev/test environments aren't broken.
 */
export async function writeActivityWithPii(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: SupabaseClient<any, 'public', any>,
  publicFields: ActivityPublicFields,
  pii: PiiPayload
): Promise<{ activityId: string | null; error: string | null }> {
  // Fallback: if no encryption key, write PII inline (legacy behavior for dev)
  if (!process.env.PII_ENCRYPTION_KEY) {
    const { data, error } = await client
      .from('activity_log')
      .insert({ ...publicFields, ...pii })
      .select('id')
      .single()
    return { activityId: data?.id ?? null, error: error?.message ?? null }
  }

  // Step 1: insert the row with PII inline (dual-write for transition).
  // Read sites still consume inline columns; once reads are migrated to
  // the server-side decrypt endpoint, this merges back to publicFields only.
  const { data: activity, error: activityError } = await client
    .from('activity_log')
    .insert({ ...publicFields, ...pii })
    .select('id')
    .single()

  if (activityError || !activity?.id) {
    return { activityId: null, error: activityError?.message ?? 'activity_log insert failed' }
  }

  // Step 2: encrypt and insert the PII companion.
  // Encode Buffers as PG bytea hex-escape literals — see byteaEncode() above.
  const blob = encrypt(pii)
  const { error: piiError } = await client
    .from('activity_log_pii')
    .insert({
      activity_id: activity.id,
      organization_id: publicFields.organization_id,
      pii_ciphertext: byteaEncode(blob.ciphertext),
      pii_iv: byteaEncode(blob.iv),
      pii_tag: byteaEncode(blob.tag),
      key_version: blob.key_version,
    })

  if (piiError) {
    // PII insert failed — the activity row exists but has no PII.
    // Log the error but don't fail the whole operation; the activity
    // record is still valuable for audit even without decryptable PII.
    console.error('[pii] activity_log_pii insert failed:', piiError.message)
  }

  return { activityId: activity.id, error: null }
}

// ── Read helper ──────────────────────────────────────────────────────────────

/** An activity row with decrypted PII merged back in. */
export interface ActivityWithPii extends Record<string, unknown> {
  id: string
  pii?: PiiPayload | null
}

/**
 * Decrypt PII for a batch of activity rows that have been joined with
 * activity_log_pii. Expects each row to optionally have:
 *   activity_log_pii.pii_ciphertext, .pii_iv, .pii_tag, .key_version
 *
 * Returns the same rows with a `pii` object merged in (or null if no PII
 * row exists or decryption fails).
 */
export function decryptActivityPii<T extends Record<string, unknown>>(
  rows: T[]
): (T & { pii: PiiPayload | null })[] {
  if (!process.env.PII_ENCRYPTION_KEY) {
    // No encryption key — PII is still inline in the main row (legacy/dev)
    return rows.map(r => ({
      ...r,
      pii: {
        summary: r.summary as string | null ?? null,
        subject: r.subject as string | null ?? null,
        body_snippet: r.body_snippet as string | null ?? null,
        from_address: r.from_address as string | null ?? null,
        raw_payload: r.raw_payload as Record<string, unknown> | null ?? null,
        metadata: r.metadata as Record<string, unknown> | null ?? null,
      },
    }))
  }

  return rows.map(row => {
    const piiRow = row.activity_log_pii as {
      pii_ciphertext: unknown
      pii_iv: unknown
      pii_tag: unknown
      key_version: number | null
    } | null

    if (!piiRow?.pii_ciphertext || !piiRow?.pii_iv || !piiRow?.pii_tag) {
      // No PII companion row — return inline fields as fallback (pre-migration data)
      return {
        ...row,
        pii: {
          summary: row.summary as string | null ?? null,
          subject: row.subject as string | null ?? null,
          body_snippet: row.body_snippet as string | null ?? null,
          from_address: row.from_address as string | null ?? null,
          raw_payload: row.raw_payload as Record<string, unknown> | null ?? null,
          metadata: row.metadata as Record<string, unknown> | null ?? null,
        },
      }
    }

    const pii = decrypt(
      byteaDecode(piiRow.pii_ciphertext),
      byteaDecode(piiRow.pii_iv),
      byteaDecode(piiRow.pii_tag),
      piiRow.key_version ?? CURRENT_KEY_VERSION
    )
    return { ...row, pii }
  })
}
