#!/usr/bin/env npx tsx
/**
 * Backfill script: encrypt existing activity_log PII into activity_log_pii.
 *
 * Reads all activity_log rows that have PII fields populated but no
 * corresponding activity_log_pii row, encrypts the PII, and inserts
 * the companion row. Safe to re-run — skips rows that already have
 * a companion.
 *
 * Usage:
 *   PII_ENCRYPTION_KEY=<hex> \
 *   SUPABASE_URL=<url> \
 *   SUPABASE_SERVICE_ROLE_KEY=<key> \
 *   npx tsx scripts/backfill-activity-pii.ts
 *
 * Optional:
 *   BATCH_SIZE=100  (default 100)
 *   DRY_RUN=true    (log what would be inserted, don't insert)
 */

import { createClient } from '@supabase/supabase-js'
import { randomBytes, createCipheriv } from 'crypto'

// ── Config ───────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const PII_ENCRYPTION_KEY = process.env.PII_ENCRYPTION_KEY
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '100', 10)
const DRY_RUN = process.env.DRY_RUN === 'true'

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !PII_ENCRYPTION_KEY) {
  console.error('Missing required env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, PII_ENCRYPTION_KEY')
  process.exit(1)
}

const key = Buffer.from(PII_ENCRYPTION_KEY, 'hex')
if (key.length !== 32) {
  console.error(`PII_ENCRYPTION_KEY must be 32 bytes (64 hex chars), got ${key.length}`)
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

// ── Encryption ───────────────────────────────────────────────────────────────

interface PiiPayload {
  summary?: string | null
  subject?: string | null
  body_snippet?: string | null
  from_address?: string | null
  raw_payload?: Record<string, unknown> | null
  metadata?: Record<string, unknown> | null
}

function encrypt(payload: PiiPayload) {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const plaintext = JSON.stringify(payload)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  return { ciphertext: encrypted, iv, tag: cipher.getAuthTag() }
}

/**
 * Encode a Buffer as PostgreSQL's canonical bytea hex-escape literal (`\x...`).
 *
 * Why this is critical: if you pass a Node Buffer directly into supabase-js
 * `.insert({ col: buf })`, supabase-js JSON-serializes it as
 * `{"type":"Buffer","data":[…]}` and PostgREST stores that literal string
 * into the bytea column. The 2026-04-06 backfill hit exactly this bug —
 * 1094 rows of unparseable garbage. Explicit hex-escape encoding is the fix.
 */
function byteaEncode(buf: Buffer): string {
  return '\\x' + buf.toString('hex')
}

function hasPii(row: Record<string, unknown>): boolean {
  return !!(row.summary || row.subject || row.body_snippet || row.from_address || row.raw_payload || row.metadata)
}

function extractPii(row: Record<string, unknown>): PiiPayload {
  return {
    summary: (row.summary as string) || null,
    subject: (row.subject as string) || null,
    body_snippet: (row.body_snippet as string) || null,
    from_address: (row.from_address as string) || null,
    raw_payload: (row.raw_payload as Record<string, unknown>) || null,
    metadata: (row.metadata as Record<string, unknown>) || null,
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🔒 PII Backfill — ${DRY_RUN ? 'DRY RUN' : 'LIVE'} (batch size: ${BATCH_SIZE})\n`)

  // Count total rows to process (rows with PII that don't yet have a companion)
  const { count: totalCount } = await supabase
    .from('activity_log')
    .select('id', { count: 'exact', head: true })

  console.log(`Total activity_log rows: ${totalCount}`)

  // Count existing companion rows
  const { count: existingPii } = await supabase
    .from('activity_log_pii')
    .select('activity_id', { count: 'exact', head: true })

  console.log(`Existing activity_log_pii rows: ${existingPii}`)

  // Preload ALL existing activity_log_pii.activity_id values into a Set.
  // Doing this per-batch via .in() builds a query URL that exceeds PostgREST's
  // URL-length limit once batches grow (PostgREST returns 414 URI Too Long,
  // the client drops the error, and every row looks like an orphan).
  // One upfront paginated scan is O(n) memory but eliminates that failure mode.
  const existingSet = new Set<string>()
  {
    const PAGE = 1000
    let from = 0
    while (true) {
      const { data, error: loadErr } = await supabase
        .from('activity_log_pii')
        .select('activity_id')
        .range(from, from + PAGE - 1)
      if (loadErr) {
        console.error('Error preloading existing companions:', loadErr.message)
        process.exit(1)
      }
      if (!data || data.length === 0) break
      for (const r of data) existingSet.add(r.activity_id as string)
      if (data.length < PAGE) break
      from += PAGE
    }
    console.log(`Preloaded ${existingSet.size} existing companion IDs\n`)
  }

  let processed = 0
  let encrypted = 0
  let skippedNoPii = 0
  let skippedExisting = 0
  let offset = 0

  while (true) {
    const { data: batch, error } = await supabase
      .from('activity_log')
      .select('id, organization_id, summary, subject, body_snippet, from_address, raw_payload, metadata')
      .order('created_at', { ascending: true })
      .range(offset, offset + BATCH_SIZE - 1)

    if (error) {
      console.error(`Error fetching batch at offset ${offset}:`, error.message)
      break
    }

    if (!batch || batch.length === 0) break

    const toInsert: Array<{
      activity_id: string
      organization_id: string
      pii_ciphertext: string
      pii_iv: string
      pii_tag: string
      key_version: number
    }> = []

    for (const row of batch) {
      processed++

      if (existingSet.has(row.id)) {
        skippedExisting++
        continue
      }

      if (!hasPii(row)) {
        skippedNoPii++
        continue
      }

      const pii = extractPii(row)
      const blob = encrypt(pii)
      toInsert.push({
        activity_id: row.id,
        organization_id: row.organization_id,
        pii_ciphertext: byteaEncode(blob.ciphertext),
        pii_iv: byteaEncode(blob.iv),
        pii_tag: byteaEncode(blob.tag),
        key_version: 1,
      })
    }

    if (toInsert.length > 0) {
      if (DRY_RUN) {
        console.log(`  [DRY RUN] Would insert ${toInsert.length} PII rows`)
      } else {
        const { error: insertError } = await supabase
          .from('activity_log_pii')
          .insert(toInsert)

        if (insertError) {
          console.error(`  Insert error at offset ${offset}:`, insertError.message)
          // Continue processing — some rows may have failed but others should be fine
        }
      }
      encrypted += toInsert.length
    }

    console.log(`  Batch ${offset}–${offset + batch.length}: ${toInsert.length} encrypted, ${batch.length - toInsert.length} skipped`)
    offset += batch.length
  }

  console.log(`\n✅ Backfill complete:`)
  console.log(`   Processed:        ${processed}`)
  console.log(`   Encrypted:        ${encrypted}`)
  console.log(`   Skipped (no PII): ${skippedNoPii}`)
  console.log(`   Skipped (exists): ${skippedExisting}`)
  console.log(`   ${DRY_RUN ? '⚠️  DRY RUN — nothing was actually written' : '🔒 All PII encrypted'}`)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
