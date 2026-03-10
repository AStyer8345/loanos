/**
 * Import loans from Arive CSV export into Supabase loans table.
 *
 * Usage:
 *   npx tsx scripts/import-loans.ts <path-to-csv>
 *
 * Example:
 *   npx tsx scripts/import-loans.ts ~/Downloads/report1773108451663.csv
 *
 * Dedup logic (idempotent — safe to re-run):
 *   Primary:   loan_name match → skip
 *   Secondary: borrower_name + closing_date + loan_amount match → skip
 *
 * Contact matching (case-insensitive first_name + last_name):
 *   - Split borrower_name on first space → first_name / last_name
 *   - Multiple matches → use most recently created
 *   - No match → contact_id = NULL (never creates contacts)
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import readline from 'readline'

// ── Supabase config ──────────────────────────────────────────────────────────
// Reads from env or falls back to prompting.
// Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your shell before running.

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(`
Missing Supabase credentials. Set these env vars before running:
  export SUPABASE_URL=https://xxxx.supabase.co
  export SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
`)
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ── Adam's user_id ───────────────────────────────────────────────────────────
const ADAM_EMAIL = 'adam@thestyerteam.com'

// ── CSV parsing ──────────────────────────────────────────────────────────────

function parseCsvLine(line: string): string[] {
  const values: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      values.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  values.push(current.trim())
  return values
}

function parseCsvFile(filePath: string): { headers: string[]; rows: Record<string, string>[] } {
  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split('\n').filter(l => l.trim())
  const headers = parseCsvLine(lines[0])
  const rows = lines.slice(1).map(line => {
    const values = parseCsvLine(line)
    const row: Record<string, string> = {}
    headers.forEach((h, i) => { row[h] = values[i] ?? '' })
    return row
  })
  return { headers, rows }
}

// ── Date parsing (M/D/YYYY → YYYY-MM-DD) ────────────────────────────────────

function parseDate(raw: string): string | null {
  if (!raw || !raw.trim()) return null
  const parts = raw.trim().split('/')
  if (parts.length !== 3) return null
  const [m, d, y] = parts
  const month = m.padStart(2, '0')
  const day = d.padStart(2, '0')
  return `${y}-${month}-${day}`
}

// ── Borrower name splitting ──────────────────────────────────────────────────

function splitBorrowerName(name: string): { firstName: string; lastName: string } {
  const trimmed = name.trim()
  const spaceIdx = trimmed.indexOf(' ')
  if (spaceIdx === -1) return { firstName: trimmed, lastName: '' }
  return {
    firstName: trimmed.slice(0, spaceIdx).trim(),
    lastName: trimmed.slice(spaceIdx + 1).trim(),
  }
}

// ── Amount parsing ───────────────────────────────────────────────────────────

function parseAmount(raw: string): number | null {
  if (!raw || !raw.trim()) return null
  const n = parseFloat(raw.replace(/[,$]/g, ''))
  return isNaN(n) ? null : n
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const csvPath = process.argv[2]
  if (!csvPath) {
    console.error('Usage: npx tsx scripts/import-loans.ts <path-to-csv>')
    process.exit(1)
  }

  const resolvedPath = path.resolve(csvPath.replace(/^~/, process.env.HOME || ''))
  if (!fs.existsSync(resolvedPath)) {
    console.error(`File not found: ${resolvedPath}`)
    process.exit(1)
  }

  console.log(`\nReading CSV: ${resolvedPath}`)
  const { rows } = parseCsvFile(resolvedPath)
  console.log(`Found ${rows.length} rows`)

  // ── Get Adam's user_id ──────────────────────────────────────────────────
  console.log('\nLooking up Adam\'s user_id...')
  const { data: userList, error: userErr } = await supabase.auth.admin.listUsers()
  if (userErr) { console.error('Failed to list users:', userErr.message); process.exit(1) }
  const adamUser = userList.users.find(u => u.email === ADAM_EMAIL)
  if (!adamUser) {
    console.error(`Could not find user with email ${ADAM_EMAIL}`)
    process.exit(1)
  }
  const userId = adamUser.id
  console.log(`Adam's user_id: ${userId}`)

  // ── Load existing loans for dedup ──────────────────────────────────────
  console.log('\nLoading existing loans for dedup check...')
  const { data: existingLoans, error: existErr } = await supabase
    .from('loans')
    .select('id, loan_name, borrower_name, closing_date, loan_amount')
  if (existErr) { console.error('Failed to load existing loans:', existErr.message); process.exit(1) }

  const existingByLoanName = new Map<string, boolean>()
  const existingBySecondary = new Map<string, boolean>()
  for (const l of existingLoans || []) {
    if (l.loan_name) existingByLoanName.set(l.loan_name.toLowerCase(), true)
    const secKey = `${(l.borrower_name || '').toLowerCase()}|${l.closing_date || ''}|${l.loan_amount || ''}`
    existingBySecondary.set(secKey, true)
  }
  console.log(`Existing loans in DB: ${existingLoans?.length ?? 0}`)

  // ── Load contacts for matching ─────────────────────────────────────────
  console.log('\nLoading contacts for name matching...')
  const { data: contacts, error: contErr } = await supabase
    .from('contacts')
    .select('id, first_name, last_name, created_at')
    .order('created_at', { ascending: false })
  if (contErr) { console.error('Failed to load contacts:', contErr.message); process.exit(1) }

  // Build lookup: "firstname|lastname" → most recently created contact
  const contactByName = new Map<string, string>()
  for (const c of contacts || []) {
    const key = `${(c.first_name || '').toLowerCase()}|${(c.last_name || '').toLowerCase()}`
    if (!contactByName.has(key)) contactByName.set(key, c.id) // already sorted desc → first = newest
  }
  console.log(`Contacts loaded: ${contacts?.length ?? 0}`)

  // ── Process rows ───────────────────────────────────────────────────────
  let imported = 0
  let skippedDedup = 0
  let skippedEmpty = 0
  const errors: string[] = []

  console.log('\nImporting...\n')

  for (const row of rows) {
    const loanName = row['Loan: Loan Name']?.trim() || ''
    const borrowerName = row['Borrower Name']?.trim() || ''

    if (!loanName && !borrowerName) { skippedEmpty++; continue }

    const closingDate = parseDate(row['Closing Date'])
    const loanAmount = parseAmount(row['Loan Amount (1st TD)'])

    // Dedup check — primary
    if (loanName && existingByLoanName.has(loanName.toLowerCase())) {
      skippedDedup++
      continue
    }

    // Dedup check — secondary
    const secKey = `${borrowerName.toLowerCase()}|${closingDate || ''}|${loanAmount || ''}`
    if (borrowerName && existingBySecondary.has(secKey)) {
      skippedDedup++
      continue
    }

    // Contact matching
    let contactId: string | null = null
    if (borrowerName) {
      const { firstName, lastName } = splitBorrowerName(borrowerName)
      const nameKey = `${firstName.toLowerCase()}|${lastName.toLowerCase()}`
      contactId = contactByName.get(nameKey) ?? null
    }

    const payload = {
      loan_name: loanName || null,
      borrower_name: borrowerName || null,
      status: row['Status']?.trim() || null,
      closing_date: closingDate,
      loan_purpose: row['Loan Purpose']?.trim() || null,
      occupancy: row['Occupancy']?.trim() || null,
      loan_amount: loanAmount,
      loan_program: row['Loan Program (1st TD)']?.trim() || null,
      property_address: row['Property Address']?.trim() || null,
      property_city: row['Property City']?.trim() || null,
      property_state: row['Property State']?.trim() || null,
      contact_id: contactId,
      user_id: userId,
    }

    const { error: insertErr } = await supabase.from('loans').insert(payload)
    if (insertErr) {
      errors.push(`Row "${loanName}": ${insertErr.message}`)
      continue
    }

    // Register in dedup maps so intra-batch dupes are caught
    if (loanName) existingByLoanName.set(loanName.toLowerCase(), true)
    existingBySecondary.set(secKey, true)

    imported++
    if (imported % 50 === 0) process.stdout.write(`  ...${imported} imported\n`)
  }

  // ── Summary ────────────────────────────────────────────────────────────
  console.log('\n────────────────────────────')
  console.log(`  Imported:  ${imported}`)
  console.log(`  Skipped (dedup): ${skippedDedup}`)
  console.log(`  Skipped (empty): ${skippedEmpty}`)
  console.log(`  Errors:    ${errors.length}`)
  if (errors.length > 0) {
    console.log('\nErrors:')
    errors.forEach(e => console.log('  •', e))
  }
  console.log('────────────────────────────\n')
}

main().catch(err => { console.error(err); process.exit(1) })
