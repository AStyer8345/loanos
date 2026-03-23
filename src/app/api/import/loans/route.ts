import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOrganization } from '@/lib/getOrganization'
import type { Database } from '@/lib/database.types'

// ── Types ──────────────────────────────────────────────────────────────────
type RawRow = Record<string, string>
type LoanInsert = Database['public']['Tables']['loans']['Insert']

interface ImportResult {
  imported: number
  skipped:  number
  errors:   Array<{ row: number; name: string; error: string }>
}

// ── Field mapping — common loan export column names → loans columns ────────
// Handles Salesforce exports and generic CSVs.
function mapRow(raw: RawRow, userId: string, organizationId: string): Record<string, unknown> {
  const g = (key: string) => raw[key]?.trim() || null

  const parseDate = (v: string | null) => {
    if (!v) return null
    const mdy = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
    if (mdy) return `${mdy[3]}-${mdy[1].padStart(2,'0')}-${mdy[2].padStart(2,'0')}`
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v
    return null
  }

  const parseAmount = (v: string | null) => {
    if (!v) return null
    const cleaned = v.replace(/[$,\s]/g, '')
    const n = parseFloat(cleaned)
    return isNaN(n) ? null : n
  }

  const parseRate = (v: string | null) => {
    if (!v) return null
    // Handle "3.875%" or "3.875" — store as decimal e.g. 3.8750
    const cleaned = v.replace(/%/g, '').trim()
    const n = parseFloat(cleaned)
    return isNaN(n) ? null : n
  }

  // Borrower name: prefer explicit column, else concat first+last
  const concatName = [g('First Name') ?? g('first_name'), g('Last Name') ?? g('last_name')]
    .filter(Boolean).join(' ') || null
  const borrowerName = g('Borrower Name') ?? g('borrower_name') ?? concatName

  return {
    user_id:          userId,
    organization_id:  organizationId,
    loan_number:      g('Loan Number')       ?? g('loan_number'),
    borrower_name:    borrowerName,
    status:           g('Status')            ?? g('status')            ?? 'lead',
    loan_amount:      parseAmount(g('Loan Amount')    ?? g('loan_amount')),
    loan_type:        g('Loan Type')         ?? g('loan_type'),
    loan_purpose:     g('Loan Purpose')      ?? g('loan_purpose'),
    property_address: g('Property Address')  ?? g('property_address'),
    closing_date:     parseDate(g('Closing Date')    ?? g('closing_date')),
    interest_rate:    parseRate(g('Interest Rate')   ?? g('interest_rate')),
    sales_price:      parseAmount(g('Sales Price')   ?? g('sales_price')),
    county:           g('County')            ?? g('county'),
  }
}

function normStr(s: string | null) {
  return (s ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
}

// ── Route handler ─────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { rows: RawRow[] }
    if (!Array.isArray(body.rows) || body.rows.length === 0) {
      return NextResponse.json({ error: 'No rows provided' }, { status: 400 })
    }

    const supabase = createClient()

    // Must be authenticated — loans require user_id and organization_id
    let organizationId: string
    let userId: string
    try {
      const org = await getOrganization()
      organizationId = org.organizationId
      userId = org.userId
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch existing loans for dedup (current org only — RLS enforces this)
    const { data: existing, error: fetchErr } = await supabase
      .from('loans')
      .select('id, loan_number, borrower_name, closing_date')
      .eq('organization_id', organizationId)
      .limit(10000)

    if (fetchErr) {
      return NextResponse.json({ error: fetchErr.message }, { status: 500 })
    }

    // Primary dedup: loan_number
    const byLoanNum = new Map<string, string>()
    // Secondary dedup: borrower_name + closing_date (for rows without loan_number)
    const byNameDate = new Map<string, string>()

    for (const loan of existing ?? []) {
      if (loan.loan_number) {
        byLoanNum.set(loan.loan_number.trim(), loan.id)
      }
      const nameNorm = normStr(loan.borrower_name)
      const dateNorm = normStr(loan.closing_date)
      if (nameNorm && dateNorm) {
        byNameDate.set(`${nameNorm}||${dateNorm}`, loan.id)
      }
    }

    const result: ImportResult = { imported: 0, skipped: 0, errors: [] }

    for (let i = 0; i < body.rows.length; i++) {
      const mapped = mapRow(body.rows[i], userId, organizationId)
      const nameDisplay = (mapped.borrower_name as string | null) ?? `Row ${i + 1}`

      // Two-tier dedup
      const loanNum  = (mapped.loan_number  as string | null)?.trim()
      const nameNorm = normStr(mapped.borrower_name as string | null)
      const dateNorm = normStr(mapped.closing_date  as string | null)
      const nameDate = nameNorm && dateNorm ? `${nameNorm}||${dateNorm}` : null

      if (loanNum   && byLoanNum.has(loanNum))   { result.skipped++; continue }
      if (nameDate  && byNameDate.has(nameDate))  { result.skipped++; continue }

      // Strip nulls before insert
      const payload = Object.fromEntries(
        Object.entries(mapped).filter(([, v]) => v !== null && v !== undefined)
      ) as unknown as LoanInsert

      const { error: insertErr } = await supabase.from('loans').insert([payload])

      if (insertErr) {
        result.errors.push({ row: i + 1, name: nameDisplay, error: insertErr.message })
      } else {
        result.imported++
        // Update local dedup maps to catch intra-batch dupes
        if (loanNum)  byLoanNum.set(loanNum, '__new__')
        if (nameDate) byNameDate.set(nameDate, '__new__')
      }
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error('[import/loans]', err)
    return NextResponse.json({ error: 'Import failed' }, { status: 500 })
  }
}
