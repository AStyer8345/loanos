#!/usr/bin/env npx tsx
/**
 * Live decrypt verification — picks random activity rows from the DB and
 * decrypts their PII via the real decryptActivityPii helper, then asserts
 * each decrypted field matches the inline plaintext still present in
 * activity_log. If this passes, the backfill is proven correct end-to-end.
 *
 * This is the "are we actually safe to drop the inline columns" gate.
 */
import { createClient } from '@supabase/supabase-js'
import { decryptActivityPii } from '../src/lib/activity/pii'

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false },
})

async function main() {
  const { data, error } = await sb
    .from('activity_log')
    .select(`
      id, summary, subject, body_snippet, from_address, raw_payload, metadata,
      activity_log_pii(pii_ciphertext, pii_iv, pii_tag, key_version)
    `)
    .limit(1000)
  if (error || !data) throw new Error(`read: ${error?.message}`)
  console.log(`Fetched ${data.length} rows\n`)

  const decrypted = decryptActivityPii(data as unknown as Record<string, unknown>[])

  let ok = 0
  let failed = 0
  let missingCompanion = 0
  for (const row of decrypted) {
    const companion = (row as { activity_log_pii?: unknown }).activity_log_pii
    if (!companion) { missingCompanion++; continue }
    const pii = row.pii
    if (!pii) {
      console.error(`  FAIL ${row.id}: decrypt returned null`)
      failed++
      continue
    }
    // extractPii() in backfill normalizes empty strings → null via `|| null`,
    // so compare against the same normalization here.
    const norm = (s: unknown): string | null => (s ? (s as string) : null)
    const inlineSummary = norm(row.summary)
    const inlineSubject = norm(row.subject)
    const inlineSnippet = norm(row.body_snippet)
    const inlineFrom = norm(row.from_address)
    const inlineRaw = JSON.stringify((row.raw_payload as unknown) ?? null)
    const inlineMeta = JSON.stringify((row.metadata as unknown) ?? null)

    const piiRaw = JSON.stringify(pii.raw_payload ?? null)
    const piiMeta = JSON.stringify(pii.metadata ?? null)

    const mismatches: string[] = []
    if ((pii.summary ?? null) !== inlineSummary) mismatches.push(`summary`)
    if ((pii.subject ?? null) !== inlineSubject) mismatches.push(`subject`)
    if ((pii.body_snippet ?? null) !== inlineSnippet) mismatches.push(`body_snippet`)
    if ((pii.from_address ?? null) !== inlineFrom) mismatches.push(`from_address`)
    if (piiRaw !== inlineRaw) mismatches.push(`raw_payload`)
    if (piiMeta !== inlineMeta) mismatches.push(`metadata`)

    if (mismatches.length > 0) {
      console.error(`  FAIL ${row.id}: ${mismatches.join(', ')}`)
      failed++
    } else {
      ok++
    }
  }

  console.log(`\nResults: ${ok}/${decrypted.length} matched inline, ${failed} failed, ${missingCompanion} missing companion`)
  if (failed > 0 || missingCompanion > 0) {
    console.error('❌ Verification failed')
    process.exit(1)
  }
  console.log('✅ Live decryption matches inline plaintext on all sampled rows')
}

main().catch(e => { console.error('ERROR:', e instanceof Error ? e.message : e); process.exit(1) })
