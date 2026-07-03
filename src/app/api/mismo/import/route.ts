import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOrganization } from '@/lib/getOrganization'
import { parseMismo } from '@/lib/mismo/parse'
import type { Database } from '@/lib/database.types'

const MAX_FILE_BYTES = 10 * 1024 * 1024
type ContactInsert = Database['public']['Tables']['contacts']['Insert']
type LoanInsert = Database['public']['Tables']['loans']['Insert']

export async function POST(req: NextRequest) {
  try {
    // 1) Auth/org scope
    let organizationId: string, userId: string
    try {
      const org = await getOrganization()
      organizationId = org.organizationId
      userId = org.userId
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2) Multipart parse + input validation
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: 'File too large. Max 10 MB.' }, { status: 413 })
    }
    if (file.name.toLowerCase().endsWith('.zip')) {
      return NextResponse.json({ error: 'Upload the .xml directly (ZIP not supported yet).' }, { status: 400 })
    }

    const parsed = parseMismo(await file.text())

    // 3) Minimum viability check
    if (!parsed.borrower.last_name && !parsed.loan.loan_number) {
      return NextResponse.json({
        error: 'Could not extract a borrower name or loan number from this file. Is it a MISMO 3.4 export?',
      }, { status: 422 })
    }

    const supabase = createClient()

    // 4) Contact match-or-create
    //    Match by email (case-insensitive), else by (last_name, first_name).
    let contactId: string | null = null
    let contactLeadSource: string | null = null
    if (parsed.borrower.email) {
      const { data: matches, error: matchErr } = await supabase
        .from('contacts')
        .select('id, lead_source')
        .eq('organization_id', organizationId)
        .ilike('email', parsed.borrower.email)
        .limit(2)
      if (matchErr) {
        return NextResponse.json({ error: `Contact email lookup failed: ${matchErr.message}` }, { status: 500 })
      }
      if (matches && matches.length === 1) {
        contactId = matches[0].id
        contactLeadSource = matches[0].lead_source
      }
    }
    if (!contactId && parsed.borrower.first_name && parsed.borrower.last_name) {
      const { data: match, error: matchErr } = await supabase
        .from('contacts')
        .select('id, lead_source')
        .eq('organization_id', organizationId)
        .eq('last_name', parsed.borrower.last_name)
        .eq('first_name', parsed.borrower.first_name)
        .limit(2)
      if (matchErr) {
        return NextResponse.json({ error: `Contact name lookup failed: ${matchErr.message}` }, { status: 500 })
      }
      if (match && match.length === 1) {
        contactId = match[0].id
        contactLeadSource = match[0].lead_source
      }
    }

    if (!contactId) {
      const contactInsert: Record<string, unknown> = {
        organization_id: organizationId,
        user_id: userId,
        first_name: parsed.borrower.first_name ?? '',
        last_name: parsed.borrower.last_name ?? 'Unknown',
        email: parsed.borrower.email,
        phone: parsed.borrower.phone,
        contact_type: 'borrower',
        stage: 'lead',
        lead_source: 'MISMO Import',
      }
      const { data: created, error } = await supabase
        .from('contacts')
        .insert([Object.fromEntries(
          Object.entries(contactInsert).filter(([, v]) => v !== null && v !== undefined)
        ) as unknown as ContactInsert])
        .select('id, lead_source')
        .single()
      if (error) {
        return NextResponse.json({ error: `Contact insert failed: ${error.message}` }, { status: 500 })
      }
      contactId = created.id
      contactLeadSource = created.lead_source
    }

    // 5) Loan dedup on loan_number (if present)
    if (parsed.loan.loan_number) {
      const { data: dupe, error: dupeErr } = await supabase
        .from('loans')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('loan_number', parsed.loan.loan_number)
        .maybeSingle()
      if (dupeErr) {
        return NextResponse.json({ error: `Loan dedup check failed: ${dupeErr.message}` }, { status: 500 })
      }
      if (dupe) {
        return NextResponse.json({
          loan_id: dupe.id,
          contact_id: contactId,
          duplicate: true,
        })
      }
    } else if (parsed.property.address && parsed.loan.loan_amount != null) {
      // Pre-submission Calyx exports omit loan_number — dedup on
      // (contact_id, property_address, loan_amount) instead.
      const { data: dupe, error: dupeErr } = await supabase
        .from('loans')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('contact_id', contactId)
        .eq('property_address', parsed.property.address)
        .eq('loan_amount', parsed.loan.loan_amount)
        .limit(1)
        .maybeSingle()
      if (dupeErr) {
        return NextResponse.json({ error: `Loan dedup check failed: ${dupeErr.message}` }, { status: 500 })
      }
      if (dupe) {
        return NextResponse.json({
          loan_id: dupe.id,
          contact_id: contactId,
          duplicate: true,
        })
      }
    }

    // 6) Loan insert
    const borrowerDisplayName = [parsed.borrower.first_name, parsed.borrower.last_name]
      .filter(Boolean).join(' ') || null

    const loanInsert: Record<string, unknown> = {
      organization_id: organizationId,
      user_id: userId,
      contact_id: contactId,
      lead_source: contactLeadSource,
      borrower_name: borrowerDisplayName,
      borrower_first_name: parsed.borrower.first_name,
      borrower_last_name: parsed.borrower.last_name,
      borrower_email: parsed.borrower.email,
      borrower_phone: parsed.borrower.phone,
      loan_number: parsed.loan.loan_number,
      loan_amount: parsed.loan.loan_amount,
      loan_type: parsed.loan.loan_type,
      loan_term: parsed.loan.loan_term_months,
      interest_rate: parsed.loan.interest_rate,
      property_address: parsed.property.address,
      property_city: parsed.property.city,
      property_state: parsed.property.state,
      sales_price: parsed.property.purchase_price,
      status: 'lead',
    }

    const { data: loan, error: loanErr } = await supabase
      .from('loans')
      .insert([Object.fromEntries(
        Object.entries(loanInsert).filter(([, v]) => v !== null && v !== undefined)
      ) as unknown as LoanInsert])
      .select('id')
      .single()
    if (loanErr) {
      return NextResponse.json({ error: `Loan insert failed: ${loanErr.message}` }, { status: 500 })
    }

    return NextResponse.json({
      loan_id: loan.id,
      contact_id: contactId,
      duplicate: false,
    })
  } catch (err) {
    console.error('[mismo/import]', err)
    return NextResponse.json({ error: 'Import failed' }, { status: 500 })
  }
}
