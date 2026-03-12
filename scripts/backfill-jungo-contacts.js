#!/usr/bin/env node
/**
 * scripts/backfill-jungo-contacts.js
 *
 * Backfills LoanOS contacts table from a Jungo/Salesforce CSV export.
 * Matches on email (case-insensitive). Only updates NULL / empty fields —
 * never overwrites existing data.
 *
 * Usage:
 *   SUPABASE_URL=https://... SUPABASE_SERVICE_ROLE_KEY=sb-service-... \
 *     node scripts/backfill-jungo-contacts.js path/to/jungo-export.csv
 *
 * Env vars can also be set in a local .env (loaded manually below).
 *
 * ── COLUMN MAP ───────────────────────────────────────────────────────────────
 * Maps CSV header → contacts DB column.
 * Adjust to match actual Jungo export headers (run with --headers to print them).
 */

const fs   = require('fs')
const path = require('path')
const { createInterface } = require('readline')
const { createClient } = require('@supabase/supabase-js')

// ─── Config ──────────────────────────────────────────────────────────────────

const CSV_PATH = process.argv[2]
const PRINT_HEADERS = process.argv.includes('--headers')

// Load .env.local if present (no dotenv dep needed)
const envFile = path.resolve(__dirname, '../.env.local')
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.+)$/)
    if (m) process.env[m[1]] ??= m[2].trim().replace(/^["']|["']$/g, '')
  }
}

const SUPABASE_URL             = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// ─── CSV → DB column mapping ──────────────────────────────────────────────────
// These are standard Salesforce/Jungo export headers. Adjust if your export differs.
const COLUMN_MAP = {
  'First Name':              'first_name',
  'Last Name':               'last_name',
  'Email':                   'email',          // used for matching — not updated
  'Phone':                   'phone',
  'Mobile':                  'mobile_phone',
  'Title':                   'title',
  'Mailing Street':          'mailing_street',
  'Mailing City':            'mailing_city',
  'Mailing State/Province':  'mailing_state',
  'Mailing Zip/Postal Code': 'mailing_zip',
  'Mailing Country':         'mailing_country',
  // Add more mappings as needed:
  // 'Lead Source':           'lead_source',
  // 'Contact Source':        'source',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Parse a CSV line respecting quoted fields. */
function parseCsvLine(line) {
  const result = []
  let cur = ''
  let inQuote = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') { cur += '"'; i++ }
      else inQuote = !inQuote
    } else if (ch === ',' && !inQuote) {
      result.push(cur)
      cur = ''
    } else {
      cur += ch
    }
  }
  result.push(cur)
  return result.map(v => v.trim())
}

const n = (v) => (v === '' || v === undefined) ? null : v

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!CSV_PATH) {
    console.error('Usage: node scripts/backfill-jungo-contacts.js <csv-file> [--headers]')
    process.exit(1)
  }
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`CSV not found: ${CSV_PATH}`)
    process.exit(1)
  }
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars')
    process.exit(1)
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  // ── Parse CSV ──────────────────────────────────────────────────────────────
  const rl = createInterface({ input: fs.createReadStream(CSV_PATH, 'utf8'), crlfDelay: Infinity })
  const rows = []
  let headers = null

  for await (const line of rl) {
    if (!line.trim()) continue
    const cells = parseCsvLine(line)
    if (!headers) {
      headers = cells
      if (PRINT_HEADERS) {
        console.log('CSV headers:\n ', headers.join('\n  '))
        process.exit(0)
      }
      continue
    }
    const row = {}
    headers.forEach((h, i) => { row[h] = cells[i] ?? '' })
    rows.push(row)
  }

  console.log(`Parsed ${rows.length} rows from CSV`)

  // ── Load all contacts indexed by lowercase email ───────────────────────────
  const { data: allContacts, error: fetchErr } = await supabase
    .from('contacts')
    .select('id, email, first_name, last_name, phone, mobile_phone, title, mailing_street, mailing_city, mailing_state, mailing_zip, mailing_country')

  if (fetchErr) { console.error('Failed to fetch contacts:', fetchErr.message); process.exit(1) }

  const contactByEmail = {}
  for (const c of allContacts ?? []) {
    if (c.email) contactByEmail[c.email.toLowerCase().trim()] = c
  }

  console.log(`Loaded ${Object.keys(contactByEmail).length} contacts from DB`)

  // ── Process rows ───────────────────────────────────────────────────────────
  let matched = 0, updated = 0, skipped = 0, errors = 0

  for (const row of rows) {
    const email = n(row['Email'])?.toLowerCase().trim()
    if (!email) { console.log('  [skip] row has no email'); skipped++; continue }

    const contact = contactByEmail[email]
    if (!contact) {
      console.log(`  [not matched — skipping] ${email}`)
      skipped++
      continue
    }

    matched++

    // Build patch: only fields that are null/empty in DB
    const patch = {}
    for (const [csvCol, dbCol] of Object.entries(COLUMN_MAP)) {
      if (dbCol === 'email') continue  // never overwrite email
      const csvVal = n(row[csvCol])
      if (csvVal === null) continue    // nothing to set
      if (contact[dbCol] != null && contact[dbCol] !== '') continue  // DB already has value
      patch[dbCol] = csvVal
    }

    if (Object.keys(patch).length === 0) {
      console.log(`  [no changes] ${email}`)
      continue
    }

    const { error: updateErr } = await supabase
      .from('contacts')
      .update(patch)
      .eq('id', contact.id)

    if (updateErr) {
      console.error(`  [error] ${email}: ${updateErr.message}`)
      errors++
    } else {
      const fields = Object.keys(patch).join(', ')
      console.log(`  [updated] ${email} — set: ${fields}`)
      updated++
    }
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log(`\n──────────────────────────────────────`)
  console.log(`Total rows:  ${rows.length}`)
  console.log(`Matched:     ${matched}`)
  console.log(`Updated:     ${updated}`)
  console.log(`Skipped:     ${skipped}`)
  console.log(`Errors:      ${errors}`)
  console.log(`──────────────────────────────────────`)
}

main().catch(err => { console.error('Fatal:', err.message); process.exit(1) })
