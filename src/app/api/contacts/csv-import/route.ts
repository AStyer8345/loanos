import { NextRequest, NextResponse } from 'next/server'
import Papa from 'papaparse'
import { createServiceClient } from '@/lib/supabase/service'
import { getOrganization } from '@/lib/getOrganization'
import type { Database } from '@/lib/database.types'

type ContactInsert = Database['public']['Tables']['contacts']['Insert']

// Header aliases → canonical field name
const FIELD_MAP: Record<string, string> = {
  first_name: 'first_name', firstname: 'first_name', 'first name': 'first_name',
  last_name: 'last_name', lastname: 'last_name', 'last name': 'last_name',
  email: 'email', email_address: 'email',
  phone: 'phone', mobile: 'phone',
  type: 'contact_type', contact_type: 'contact_type',
  company: 'company_name', company_name: 'company_name', brokerage: 'company_name',
  nmls: 'nmls_number', nmls_number: 'nmls_number',
}

const VALID_CONTACT_TYPES = new Set(['borrower', 'realtor', 'referral partner', 'vendor'])

interface NormalizedRow {
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  contact_type: string
  company_name: string | null
  nmls_number: string | null
}

function normalizeRow(raw: Record<string, string>): NormalizedRow | null {
  const mapped: Record<string, string> = {}
  for (const [key, value] of Object.entries(raw)) {
    const canonical = FIELD_MAP[key.toLowerCase().trim()]
    if (canonical && value?.trim()) {
      mapped[canonical] = value.trim()
    }
  }

  if (!mapped['first_name']) return null

  const contactType = mapped['contact_type']?.toLowerCase()

  return {
    first_name: mapped['first_name'],
    last_name: mapped['last_name'] ?? '',
    email: mapped['email']?.toLowerCase() ?? null,
    phone: mapped['phone'] ?? null,
    contact_type: VALID_CONTACT_TYPES.has(contactType ?? '') ? contactType! : 'borrower',
    company_name: mapped['company_name'] ?? null,
    nmls_number: mapped['nmls_number'] ?? null,
  }
}

export async function POST(req: NextRequest) {
  try {
    const { organizationId, userId } = await getOrganization()
    const formData = await req.formData()
    const file = formData.get('file')

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const text = await file.text()
    const { data: rows, errors } = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
    })

    if (errors.length > 0 && rows.length === 0) {
      return NextResponse.json({ error: 'Failed to parse CSV', details: errors[0].message }, { status: 400 })
    }

    // Normalize and filter invalid rows
    const normalized = rows.map(normalizeRow).filter((r): r is NormalizedRow => r !== null)

    // Fetch existing emails for dedup
    const emails = normalized.map(r => r.email).filter((e): e is string => Boolean(e))
    const service = createServiceClient()

    const existingEmails = new Set<string>()
    if (emails.length > 0) {
      const { data: existing } = await service
        .from('contacts')
        .select('email')
        .eq('organization_id', organizationId)
        .in('email', emails)
      existing?.forEach(c => { if (c.email) existingEmails.add(c.email) })
    }

    // Split into new vs duplicate
    const toInsert: ContactInsert[] = []
    let duplicates = 0

    for (const row of normalized) {
      if (row.email && existingEmails.has(row.email)) {
        duplicates++
        continue
      }
      const insertRow = Object.fromEntries(
        Object.entries({ ...row, organization_id: organizationId, user_id: userId })
          .filter(([, v]) => v !== null && v !== '')
      ) as unknown as ContactInsert
      toInsert.push(insertRow)
      // Track email locally to catch dupes within the same CSV
      if (row.email) existingEmails.add(row.email)
    }

    // Batch insert in chunks of 100
    let imported = 0
    let insertErrors = 0
    const CHUNK = 100

    for (let i = 0; i < toInsert.length; i += CHUNK) {
      const chunk = toInsert.slice(i, i + CHUNK)
      const { error } = await service.from('contacts').insert(chunk)
      if (error) {
        console.error('[csv-import] batch error:', error)
        insertErrors += chunk.length
      } else {
        imported += chunk.length
      }
    }

    return NextResponse.json({ imported, duplicates, errors: insertErrors })
  } catch (err) {
    console.error('[csv-import]', err)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
