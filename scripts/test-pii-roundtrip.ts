#!/usr/bin/env npx tsx
/**
 * End-to-end PII encryption round-trip test.
 *
 * Exercises the *actual* writeActivityWithPii + decryptActivityPii helpers
 * against the real Supabase database. This is the test that would have caught
 * the 2026-04-06 Buffer-to-bytea serialization bug, because a pure in-process
 * encrypt/decrypt test never touches PostgREST.
 *
 * Flow:
 *   1. Build a known PII payload
 *   2. writeActivityWithPii(...) → creates activity_log + activity_log_pii rows
 *   3. Select back with a join on activity_log_pii
 *   4. decryptActivityPii([row]) → pulls the PII back out
 *   5. Assert every field round-tripped byte-for-byte
 *   6. Delete the test rows (both the companion and the activity row)
 *
 * Usage:
 *   SUPABASE_URL=<url> \
 *   SUPABASE_SERVICE_ROLE_KEY=<key> \
 *   PII_ENCRYPTION_KEY=<64 hex chars> \
 *   npx tsx scripts/test-pii-roundtrip.ts
 *
 * Exits 0 on success, non-zero on any mismatch or failure.
 */

import { createClient } from '@supabase/supabase-js'
import { writeActivityWithPii, decryptActivityPii } from '../src/lib/activity/pii'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !process.env.PII_ENCRYPTION_KEY) {
  console.error('Missing required env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, PII_ENCRYPTION_KEY')
  process.exit(1)
}

// Adam Styer MSLP org — the only live org in this database
const ORG_ID = '18613f82-fdd9-42dd-a09e-f3c577328258'
const SYSTEM_USER = 'b13aa8c6-c3a0-4312-9b35-c76073e7ccdc'

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const nonce = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
const knownPayload = {
  summary: `round-trip-test summary ${nonce}`,
  subject: `round-trip-test subject ${nonce}`,
  body_snippet: `body snippet with non-ascii ✓ ¡ñ 中文 ${nonce}`,
  from_address: `test+${nonce}@example.test`,
  metadata: {
    nonce,
    nested: { a: 1, b: [1, 2, 3], c: null },
    bool: true,
    unicode: 'ümlaut ₿ 🔒',
  },
  raw_payload: { fake_webhook: true, nonce },
}

async function main() {
  console.log(`\n🔒 PII Round-Trip Test (nonce ${nonce})\n`)

  // 1. Write via the real helper
  console.log('1. writeActivityWithPii(...)')
  const { activityId, error: writeErr } = await writeActivityWithPii(
    sb,
    {
      organization_id: ORG_ID,
      user_id: SYSTEM_USER,
      action: 'pii_roundtrip_test',
      entity_type: 'test',
    },
    knownPayload,
  )
  if (writeErr || !activityId) {
    fail(`write failed: ${writeErr ?? 'no activityId returned'}`)
  }
  console.log(`   activity_id: ${activityId}`)

  // Register cleanup immediately — runs even if assertions throw
  const cleanup = async () => {
    await sb.from('activity_log_pii').delete().eq('activity_id', activityId)
    await sb.from('activity_log').delete().eq('id', activityId)
  }

  try {
    // 2. Read back with the companion joined
    console.log('2. select activity_log + activity_log_pii')
    const { data: row, error: readErr } = await sb
      .from('activity_log')
      .select(`
        id, summary, subject, body_snippet, from_address, raw_payload, metadata,
        activity_log_pii(pii_ciphertext, pii_iv, pii_tag, key_version)
      `)
      .eq('id', activityId!)
      .single()
    if (readErr || !row) throw new Error(`read failed: ${readErr?.message ?? 'no row'}`)

    // Sanity: the companion MUST be present
    const companion = (row as unknown as { activity_log_pii: unknown }).activity_log_pii
    if (!companion) throw new Error('activity_log_pii join returned no companion — companion insert silently dropped')
    console.log(`   companion joined: ok`)

    // 3. Decrypt via the real helper
    console.log('3. decryptActivityPii([row])')
    const [decrypted] = decryptActivityPii([row as unknown as Record<string, unknown>])
    const pii = decrypted.pii
    if (!pii) throw new Error('decryptActivityPii returned null PII — decryption failed')

    // 4. Byte-for-byte assertions
    console.log('4. assert round-trip equality')
    const checks: Array<[string, unknown, unknown]> = [
      ['summary', pii.summary, knownPayload.summary],
      ['subject', pii.subject, knownPayload.subject],
      ['body_snippet', pii.body_snippet, knownPayload.body_snippet],
      ['from_address', pii.from_address, knownPayload.from_address],
      ['metadata', JSON.stringify(pii.metadata), JSON.stringify(knownPayload.metadata)],
      ['raw_payload', JSON.stringify(pii.raw_payload), JSON.stringify(knownPayload.raw_payload)],
    ]
    const mismatches: string[] = []
    for (const [name, got, want] of checks) {
      if (got !== want) {
        mismatches.push(`  ${name}: got=${JSON.stringify(got)} want=${JSON.stringify(want)}`)
      }
    }
    if (mismatches.length > 0) {
      throw new Error(`field mismatches:\n${mismatches.join('\n')}`)
    }
    console.log('   ✓ all fields match')
  } finally {
    console.log('5. cleanup')
    await cleanup()
  }

  console.log('\n✅ Round-trip OK — encryption, serialization, and decryption all work end-to-end\n')
}

function fail(msg: string): never {
  console.error(`\n❌ TEST FAILED: ${msg}\n`)
  process.exit(1)
}

main().catch(err => {
  console.error('\n❌ TEST FAILED:', err instanceof Error ? err.message : err)
  process.exit(1)
})
