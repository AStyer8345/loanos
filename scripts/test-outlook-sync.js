#!/usr/bin/env node
/**
 * scripts/test-outlook-sync.js
 *
 * Manual test runner for the Outlook sync pipeline.
 * Requires .env.local to be populated with real credentials.
 *
 * Usage:
 *   node scripts/test-outlook-sync.js [--status] [--sync] [--refresh]
 *
 * Flags:
 *   --status   Check token status from outlook_tokens table
 *   --sync     Trigger a manual sync via the Netlify function (local dev)
 *   --refresh  Force-refresh the stored token
 *   (no flag)  Runs all checks
 */

require('dotenv').config({ path: '.env.local' })

const BASE_URL = process.env.NETLIFY_DEV_URL || 'http://localhost:8888'
const SYNC_SECRET = process.env.OUTLOOK_SYNC_SECRET || ''
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const args = process.argv.slice(2)
const runAll = args.length === 0
const doStatus = runAll || args.includes('--status')
const doSync = runAll || args.includes('--sync')
const doRefresh = runAll || args.includes('--refresh')

function sbHeaders() {
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
  }
}

async function checkEnv() {
  console.log('\n── Environment ─────────────────────────────────')
  const required = [
    'MICROSOFT_CLIENT_ID',
    'MICROSOFT_CLIENT_SECRET',
    'MICROSOFT_REDIRECT_URI',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
  ]
  let allOk = true
  for (const key of required) {
    const val = process.env[key]
    const ok = val && !val.startsWith('your-') && !val.startsWith('change-')
    console.log(`  ${ok ? '✓' : '✗'} ${key}: ${ok ? 'set' : 'MISSING or placeholder'}`)
    if (!ok) allOk = false
  }
  return allOk
}

async function checkTokenStatus() {
  console.log('\n── Token Status (Supabase) ─────────────────────')
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/outlook_tokens?order=updated_at.desc&limit=1`,
    { headers: sbHeaders() }
  )
  if (!res.ok) {
    console.log(`  ✗ Supabase query failed: ${res.status} ${await res.text()}`)
    return
  }
  const rows = await res.json()
  if (!rows || rows.length === 0) {
    console.log('  ✗ No token found — run OAuth flow first')
    console.log(`    Visit: ${BASE_URL}/.netlify/functions/outlook-auth`)
    return
  }
  const token = rows[0]
  const expiresAt = new Date(token.expires_at)
  const bufferMs = 5 * 60 * 1000
  const isValid = expiresAt.getTime() > Date.now() + bufferMs
  console.log(`  ✓ Token found for: ${token.email}`)
  console.log(`  ${isValid ? '✓' : '✗'} Token ${isValid ? 'valid' : 'EXPIRED'} (expires ${expiresAt.toLocaleString()})`)
  console.log(`  ↳ Updated: ${new Date(token.updated_at).toLocaleString()}`)
}

async function checkRefresh() {
  console.log('\n── Token Refresh Check ──────────────────────────')
  const res = await fetch(`${BASE_URL}/.netlify/functions/outlook-refresh`)
  if (!res.ok) {
    const body = await res.text()
    console.log(`  ✗ Refresh function error: ${res.status}\n  ${body}`)
    return
  }
  const data = await res.json()
  if (data.ok) {
    console.log(`  ✓ Token valid for: ${data.email}`)
    console.log(`  ✓ Expires: ${new Date(data.expires_at).toLocaleString()}`)
  } else {
    console.log(`  ✗ Refresh failed: ${data.error}`)
  }
}

async function triggerSync() {
  console.log('\n── Manual Sync ─────────────────────────────────')
  console.log('  Calling outlook-sync function...')
  const res = await fetch(`${BASE_URL}/.netlify/functions/outlook-sync`, {
    method: 'POST',
    headers: { 'x-sync-secret': SYNC_SECRET },
  })
  const data = await res.json()
  if (!res.ok || !data.ok) {
    console.log(`  ✗ Sync failed: ${data.error || res.status}`)
    return
  }
  const { inserted, skipped, unmatched, errors } = data.stats
  console.log('  ✓ Sync complete')
  console.log(`  ↳ ${inserted} new | ${skipped} duplicates | ${unmatched} unmatched emails | ${errors} errors`)
}

async function checkRecentActivity() {
  console.log('\n── Recent Activity Log (last 5) ────────────────')
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/activity_log?type=in.(email_inbound,email_outbound)&order=created_at.desc&limit=5`,
    { headers: sbHeaders() }
  )
  if (!res.ok) {
    console.log(`  ✗ Query failed: ${res.status}`)
    return
  }
  const rows = await res.json()
  if (!rows || rows.length === 0) {
    console.log('  (no email activity logged yet)')
    return
  }
  for (const row of rows) {
    const ts = new Date(row.created_at).toLocaleString()
    console.log(`  [${row.type}] ${row.summary} — ${ts}`)
  }
}

;(async () => {
  console.log('LoanOS — Outlook Sync Test')
  console.log('==========================')

  const envOk = await checkEnv()
  if (!envOk) {
    console.log('\n⚠ Fill in .env.local placeholders before testing.\n')
  }

  if (doStatus) await checkTokenStatus()
  if (doRefresh) await checkRefresh()
  if (doSync) {
    await triggerSync()
    await checkRecentActivity()
  }

  console.log()
})()
