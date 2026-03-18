import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOrganization } from '@/lib/getOrganization'
import { normalizeStage } from '@/lib/stageNormalization'

// ── Types ──────────────────────────────────────────────────────────────────
type RawRow = Record<string, string>

interface ImportResult {
  imported: number
  skipped:  number
  errors:   Array<{ row: number; name: string; error: string }>
}

// ── Field mapping — Salesforce export column names → contacts columns ──────
// Handles both Salesforce export headers and generic CSV headers gracefully.
function mapRow(raw: RawRow, userId: string, organizationId: string): Record<string, unknown> {
  const g = (key: string) => raw[key]?.trim() || null
  const parseDate = (v: string | null) => {
    if (!v) return null
    // M/D/YYYY or YYYY-MM-DD
    const mdy = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
    if (mdy) return `${mdy[3]}-${mdy[1].padStart(2,'0')}-${mdy[2].padStart(2,'0')}`
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v
    return null
  }
  const parseBool = (v: string | null) =>
    v ? ['true','1','yes','checked'].includes(v.toLowerCase()) : null

  return {
    user_id:                userId,
    organization_id:        organizationId,
    salesforce_id:          g('Contact ID') ?? g('salesforce_id'),
    first_name:             g('First Name') ?? g('first_name'),
    last_name:              g('Last Name')  ?? g('last_name'),
    coborrower_first_name:  g('First Name (Co Borrower)') ?? g('coborrower_first_name'),
    coborrower_last_name:   g('Last Name (Co Borrower)')  ?? g('coborrower_last_name'),
    email:                  g('Email')       ?? g('email'),
    phone:                  g('Phone')       ?? g('phone'),
    mobile_phone:           g('Mobile')      ?? g('mobile_phone'),
    contact_type:           g('contact_type') ?? 'borrower',
    stage:                  normalizeStage(g('Stage') ?? g('stage')),
    lead_source:            g('Lead Source')  ?? g('lead_source'),
    referred_by:            g('Referred By')  ?? g('referred_by'),
    company_name:           g('Company Name') ?? g('company_name'),
    birthday:         parseDate(g('Birthdate')               ?? g('birthday')),
    coborrower_birthday: parseDate(g('Birthday (Co Borrower)') ?? g('coborrower_birthday')),
    closing_date:     parseDate(g('Closing Date')             ?? g('closing_date')),
    last_touch:             g('Last Touch')   ?? g('last_touch'),
    top_realtor:      parseBool(g('Top Realtor')   ?? g('top_realtor')),
    target_realtor:   parseBool(g('Target Realtor') ?? g('target_realtor')),
    realtor_email:          g('Realtor Email') ?? g('realtor_email'),
    realtor_phone:          g('Realtor Phone') ?? g('realtor_phone'),
  }
}

function normName(s: string | null) {
  return (s ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
}

// ── Route handler ─────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { rows: RawRow[] }
    if (!Array.isArray(body.rows) || body.rows.length === 0) {
      return NextResponse.json({ error: 'No rows provided' }, { status: 400 })
    }

    let organizationId: string
    let userId: string
    try {
      const org = await getOrganization()
      organizationId = org.organizationId
      userId = org.userId
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient()

    // Fetch existing contacts for dedup (id + key fields only)
    const { data: existing, error: fetchErr } = await supabase
      .from('contacts')
      .select('id, salesforce_id, email, first_name, last_name')
      .eq('organization_id', organizationId)
      .limit(10000)

    if (fetchErr) {
      return NextResponse.json({ error: fetchErr.message }, { status: 500 })
    }

    const bySfId  = new Map<string, string>()
    const byEmail = new Map<string, string>()
    const byName  = new Map<string, string>()

    for (const c of existing ?? []) {
      if (c.salesforce_id) bySfId.set(c.salesforce_id.trim(), c.id)
      if (c.email)         byEmail.set(c.email.trim().toLowerCase(), c.id)
      const nk = normName(c.first_name) + ' ' + normName(c.last_name)
      if (nk.trim()) byName.set(nk.trim(), c.id)
    }

    const result: ImportResult = { imported: 0, skipped: 0, errors: [] }

    for (let i = 0; i < body.rows.length; i++) {
      const mapped = mapRow(body.rows[i], userId, organizationId)
      const nameDisplay = `${mapped.first_name ?? ''} ${mapped.last_name ?? ''}`.trim() || `Row ${i + 1}`

      // Dedup
      const sfid  = (mapped.salesforce_id as string | null)?.trim()
      const email = (mapped.email as string | null)?.trim().toLowerCase()
      const nk    = (normName(mapped.first_name as string | null) + ' ' + normName(mapped.last_name as string | null)).trim()

      if (sfid  && bySfId.has(sfid))  { result.skipped++; continue }
      if (email && byEmail.has(email)) { result.skipped++; continue }
      if (nk    && byName.has(nk))    { result.skipped++; continue }

      // Strip nulls
      const payload = Object.fromEntries(Object.entries(mapped).filter(([, v]) => v !== null && v !== undefined))

      const { error: insertErr } = await supabase.from('contacts').insert([payload])

      if (insertErr) {
        result.errors.push({ row: i + 1, name: nameDisplay, error: insertErr.message })
      } else {
        result.imported++
        // Update local dedup maps so intra-batch dupes are also caught
        if (sfid)  bySfId.set(sfid, '__new__')
        if (email) byEmail.set(email, '__new__')
        if (nk)    byName.set(nk, '__new__')
      }
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error('[import/contacts]', err)
    return NextResponse.json({ error: 'Import failed' }, { status: 500 })
  }
}
