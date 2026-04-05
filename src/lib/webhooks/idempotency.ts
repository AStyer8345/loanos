/**
 * src/lib/webhooks/idempotency.ts
 *
 * Shared helpers for webhook delivery deduplication.
 *
 * Flow:
 *   1. Call `computeIdempotencyKey(request, body, fallbackFields)` to derive
 *      a stable key. Prefers an explicit `X-Idempotency-Key` header (Zapier
 *      can set this per Zap run) and falls back to a SHA-256 hash of the
 *      provided fallback fields (e.g. arive_loan_id + arive_updated_at).
 *   2. Call `claimDelivery(client, { organization_id, source, key })` to
 *      atomically reserve the delivery. If the insert succeeds, this is a
 *      new delivery and the caller should process it. If it fails with a
 *      unique constraint violation, this is a retry and the caller should
 *      short-circuit with a 200 {deduped: true}.
 *   3. After processing, call `completeDelivery(client, id, loan_id)` to
 *      update the row with the resolved loan_id and `processed_at`.
 *
 * The `webhook_deliveries` table has deny-all RLS — this module must be
 * called with a service-role Supabase client.
 */
import { createHash } from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'

export interface ClaimDeliveryArgs {
  organization_id: string
  source: string
  idempotency_key: string
}

export interface ClaimDeliveryResult {
  deduped: boolean
  delivery_id: string | null
}

/**
 * Derive a stable idempotency key for this request.
 *
 * Priority:
 *   1. `X-Idempotency-Key` header (caller-provided, most reliable)
 *   2. SHA-256 hash of `fallbackFields` values joined by `|`
 *   3. `null` if neither is available — caller should treat this as "no
 *      idempotency possible" and decide whether to reject or process.
 */
export function computeIdempotencyKey(
  request: NextRequest,
  fallbackFields: Array<string | number | null | undefined>
): string | null {
  const headerKey =
    request.headers.get('x-idempotency-key') ??
    request.headers.get('X-Idempotency-Key')
  if (headerKey && headerKey.trim().length > 0) {
    return headerKey.trim().slice(0, 255)
  }

  const parts = fallbackFields
    .filter((v) => v !== null && v !== undefined && v !== '')
    .map((v) => String(v))

  if (parts.length === 0) return null

  return createHash('sha256').update(parts.join('|')).digest('hex')
}

/**
 * Try to reserve the delivery. Returns `{ deduped: true }` if a row with the
 * same (organization_id, source, idempotency_key) already exists. Otherwise
 * inserts a new row and returns its id.
 */
export async function claimDelivery(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: SupabaseClient<any, 'public', any>,
  args: ClaimDeliveryArgs
): Promise<ClaimDeliveryResult> {
  const { data, error } = await client
    .from('webhook_deliveries')
    .insert({
      organization_id: args.organization_id,
      source: args.source,
      idempotency_key: args.idempotency_key,
      status: 'received',
    })
    .select('id')
    .single()

  if (error) {
    // 23505 = unique_violation in Postgres
    if (error.code === '23505') {
      return { deduped: true, delivery_id: null }
    }
    // Any other error bubbles up — better to fail loudly than silently
    // reprocess a duplicate because the idempotency table is down.
    throw new Error(`claimDelivery failed: ${error.message}`)
  }

  return { deduped: false, delivery_id: data?.id ?? null }
}

/**
 * Mark a claimed delivery as successfully processed.
 */
export async function completeDelivery(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: SupabaseClient<any, 'public', any>,
  delivery_id: string,
  loan_id: string | null
): Promise<void> {
  await client
    .from('webhook_deliveries')
    .update({
      processed_at: new Date().toISOString(),
      status: 'processed',
      loan_id,
    })
    .eq('id', delivery_id)
}

/**
 * Mark a claimed delivery as failed. The row stays in place so a retry with
 * the same key is still deduped — but we record the error for observability.
 * (If you want retries to re-run, bump the idempotency key upstream.)
 */
export async function failDelivery(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: SupabaseClient<any, 'public', any>,
  delivery_id: string,
  error_message: string
): Promise<void> {
  await client
    .from('webhook_deliveries')
    .update({
      processed_at: new Date().toISOString(),
      status: 'failed',
      error: error_message.slice(0, 2000),
    })
    .eq('id', delivery_id)
}
