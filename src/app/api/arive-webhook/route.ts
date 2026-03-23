/**
 * src/app/api/arive-webhook/route.ts
 *
 * Receives Arive webhook → upserts contact + loan in Supabase → logs activity.
 *
 * Auth: validates X-Webhook-Secret header against ARIVE_WEBHOOK_SECRET env var.
 *
 * Required env vars (set in Netlify/Vercel or .env.local):
 *   SUPABASE_URL              https://...
 *   SUPABASE_SERVICE_ROLE_KEY sb-service-role-...
 *   ARIVE_WEBHOOK_SECRET      your-shared-secret-string
 *
 * Org resolution: reads user_id from the webhook payload body. If the Arive
 * payload does not include a user_id field, falls back to a single-tenant
 * lookup (first profile with a non-null organization_id).
 * TODO: implement proper multi-tenant routing once Arive sends a user_id field.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const ARIVE_WEBHOOK_SECRET = process.env.ARIVE_WEBHOOK_SECRET

// ─── Supabase helpers ─────────────────────────────────────────────────────────

function sbHeaders(): Record<string, string> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'Supabase environment variables are not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment.'
    )
  }
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
  }
}

async function sbUpsert(
  table: string,
  conflictCol: string,
  body: Record<string, unknown>
) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/${table}?on_conflict=${conflictCol}`,
    {
      method: 'POST',
      headers: {
        ...sbHeaders(),
        Prefer: 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify(body),
    }
  )
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Supabase upsert ${table} → ${res.status}: ${text}`)
  }
  const data = await res.json()
  return Array.isArray(data) ? data[0] : data
}

async function sbInsert(table: string, body: Record<string, unknown>) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: { ...sbHeaders(), Prefer: 'return=minimal' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Supabase insert ${table} → ${res.status}: ${text}`)
  }
}

// Normalize: treat empty string / undefined / null as null
function n(val: unknown): string | number | null {
  return val === null || val === undefined || val === '' ? null : (val as string | number)
}

// Parse a date string to just the date portion (YYYY-MM-DD) or null
function nDate(val: unknown): string | null {
  const s = n(val)
  if (!s) return null
  return String(s).slice(0, 10)
}

// Auto-generate loan name: {LastName}-{StreetAddress}
// Strips unit/suite suffix and city/state/zip (everything after first comma).
function generateLoanName(lastName: unknown, propertyAddress: unknown): string | null {
  const last = n(lastName) ? String(n(lastName)).trim() : null
  let street = n(propertyAddress) ? String(n(propertyAddress)).trim() : null
  if (street) {
    // Keep only the street portion (before first comma)
    street = street.split(',')[0].trim()
    // Strip suite/unit suffixes
    street = street.replace(/\s+(apt|suite|ste|unit|#\s*\w*|bldg|fl|floor|lot|rm|room)\s*\w*/gi, '').trim()
  }
  if (last && street) return `${last}-${street}`
  if (street) return street
  if (last) return last
  return null
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // Validate webhook secret
  const incomingSecret =
    request.headers.get('x-webhook-secret') ?? request.headers.get('X-Webhook-Secret')
  if (!ARIVE_WEBHOOK_SECRET || incomingSecret !== ARIVE_WEBHOOK_SECRET) {
    console.error('[arive-webhook] Unauthorized — bad or missing X-Webhook-Secret')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Parse payload
  let body: Record<string, unknown>
  try {
    const raw = await request.text()
    body = raw ? JSON.parse(raw) : {}
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // Required fields — new camelCase format from ARIVE
  const email = n(body.borrowerEmail)
  const ariveLoanId = n(body.loanId) ? String(body.loanId) : null
  const loanNumber = n(body.loanNumber) ? String(body.loanNumber) : null

  // At least one loan identifier required
  const conflictId = ariveLoanId || loanNumber

  if (!email) {
    return NextResponse.json(
      { error: 'Missing required field: borrowerEmail' },
      { status: 400 }
    )
  }
  if (!conflictId) {
    return NextResponse.json(
      { error: 'Missing required field: loanId or loanNumber' },
      { status: 400 }
    )
  }

  // Resolve organization_id and system user from the webhook payload or fallback lookup
  const serviceClient = createServiceClient()

  // Prefer user_id from the payload body (for future multi-tenant Arive routing)
  const bodyUserId = n(body.user_id) ? String(body.user_id) : null

  let organizationId: string | null = null
  let resolvedUserId: string | null = bodyUserId

  if (bodyUserId) {
    // Payload includes a user_id — look up that user's org
    const { data: profile } = await serviceClient
      .from('profiles')
      .select('organization_id')
      .eq('id', bodyUserId)
      .single()
    organizationId = profile?.organization_id ?? null
    if (!organizationId) {
      console.error('[arive-webhook] No org for payload user_id', bodyUserId)
    }
  }

  if (!organizationId) {
    // Fallback: single-tenant — find the first profile with an org assigned.
    // TODO: replace with proper multi-tenant routing once Arive sends user_id.
    const { data: fallbackProfile } = await serviceClient
      .from('profiles')
      .select('organization_id, id')
      .not('organization_id', 'is', null)
      .order('created_at', { ascending: true })
      .limit(1)
      .single()
    organizationId = fallbackProfile?.organization_id ?? null
    if (!resolvedUserId) resolvedUserId = fallbackProfile?.id ?? null
    if (!organizationId) {
      console.error('[arive-webhook] Could not resolve organization_id — no profiles with org found')
      return NextResponse.json(
        { error: 'Server misconfiguration: no organization found' },
        { status: 500 }
      )
    }
  }

  const now = new Date().toISOString()

  try {
    // ── 1. Upsert contact on email ────────────────────────────────────────────
    const contact = await sbUpsert('contacts', 'email', {
      email: (email as string).toLowerCase().trim(),
      first_name: (n(body.borrowerFirstName) as string) || '',
      last_name: (n(body.borrowerLastName) as string) || '',
      phone: n(body.borrowerPhone),
      group_tag: 'Client',
      stage: 'Lead',
      source: 'arive_webhook',
      contact_type: 'borrower',
      user_id: resolvedUserId,
      organization_id: organizationId,
      updated_at: now,
    }) as { id: string } | null

    if (!contact?.id) throw new Error('Contact upsert returned no record')

    // ── 2. Determine upsert conflict column ───────────────────────────────────
    const conflictCol = ariveLoanId ? 'arive_loan_id' : 'loan_number'

    // ── 3. Build loan record ──────────────────────────────────────────────────
    const createdAtDate = nDate(body.createdAt)

    const loanRecord: Record<string, unknown> = {
      arive_loan_id: ariveLoanId,
      loan_number: loanNumber,
      loan_name: n(body.loanName) ?? generateLoanName(body.borrowerLastName, body.propertyAddress),
      contact_id: contact.id,

      borrower_first_name: n(body.borrowerFirstName),
      borrower_last_name: n(body.borrowerLastName),
      borrower_email: (email as string).toLowerCase().trim(),
      borrower_phone: n(body.borrowerPhone),
      co_borrower_name: n(body.coBorrowerFullName),

      loan_amount: n(body.loanAmount),
      loan_purpose: n(body.loanPurpose),
      loan_type: n(body.mortgageType) ?? n(body.loanType),
      loan_program: n(body.loanProgram) ?? n(body.lenderProductName),
      loan_term: n(body.loanTerm),
      interest_rate: n(body.interestRate),
      apr: n(body.apr),
      points: n(body.points),
      down_payment: n(body.downPayment),
      down_payment_pct: n(body.downPaymentPercent),
      ltv: n(body.ltv),
      cltv: n(body.cltv),

      property_address: n(body.propertyAddress),
      property_city: n(body.propertyCity),
      property_state: n(body.propertyState),
      property_zip: n(body.propertyZip),
      property_county: n(body['subjectProperty_county']) ?? n(body.propertyCounty),
      property_type: n(body.propertyType),
      occupancy_type: n(body.occupancyType),
      purchase_price: n(body.purchasePrice),
      appraised_value: n(body.appraisedValue),

      status: n(body.status),
      milestone: n(body.milestone),
      application_date: nDate(body.applicationDate),
      submission_date: nDate(body.submissionDate) ?? nDate(body.UNDERWRITING_SUBMITTED),
      approval_date: nDate(body.approvalDate),
      closing_date: nDate(body.closingDate),
      funding_date: nDate(body.fundingDate),
      rate_lock_date: nDate(body.rateLockDate) ?? nDate(body.lockDate),
      rate_lock_expiration: nDate(body.rateLockExpiration) ?? nDate(body.lockExpirationDate),
      estimated_closing_date: nDate(body['keyDates_estimatedFundingDate']) ?? nDate(body.estimatedClosingDate) ?? nDate(body['keyDates_closingContingency']),
      appraisal_ordered_date: nDate(body.appraisalOrderedDate) ?? nDate(body['keyDates_appraisalOrderedDate']),
      first_payment_date: nDate(body.firstPaymentDate) ?? nDate(body['keyDates_estFirstPaymentDate']) ?? nDate(body['keyDates_firstPaymentDate']),

      monthly_payment: n(body.monthlyPayment) ?? n(body.principalInterestAndPMI) ?? n(body.firstMortgagePrincipalAndInterestMonthlyAmt),
      piti: n(body.piti) ?? n(body.totalMonthlyHousingExpenseAmt),
      cash_to_close: n(body.cashToClose) ?? n(body.estCashToClose),
      seller_credits: n(body.sellerCredits) ?? n(body.sellerCredit),
      lender_credits: n(body.lenderCredits),
      loan_costs: n(body.loanCosts),
      total_closing_costs: n(body.totalClosingCosts),
      hoi_monthly: n(body.homeownersInsuranceMonthly) ?? n(body.homeownersInsuranceMonthlyAmt),
      property_taxes_monthly: n(body.propertyTaxesMonthly) ?? n(body.realEstateTaxMonthlyAmt),
      hoa_dues: n(body.hoaDues) ?? n(body.homeownersAssociationDuesAndCondominiumFeesMonthlyAmt),
      flood_insurance_monthly: n(body.floodInsuranceMonthly) ?? n(body.floodInsuranceMonthlyAmt),
      employer_name: n(body.employerName) ?? n(body['employment1_employerName']),

      credit_score: n(body.creditScore),
      middle_score: n(body.middleScore),
      monthly_income: n(body.monthlyIncome),
      front_end_dti: n(body.frontEndDti),
      back_end_dti: n(body.backEndDti),
      monthly_debts: n(body.monthlyDebts),

      referring_agent_name: n(body.referringAgentName),
      referring_agent_email: n(body.referringAgentEmail),
      lender_name: n(body.lenderName),
      lead_source: n(body.leadSource),

      // AUS + compensation — not reliably sent by Arive; null-safe
      aus_result: n(body.ausResult) ?? n(body.ausRecommendation) ?? n(body.aus_recommendation) ?? null,
      originator_comp: n(body.originatorCompensation) ?? n(body.originatorComp) ?? n(body.originator_compensation) ?? null,

      loan_created_date: createdAtDate,
      arive_created_at: n(body.createdAt),
      arive_updated_at: n(body.updatedAt),

      raw_payload: body,
      user_id: resolvedUserId,
      organization_id: organizationId,
      updated_at: now,
      synced_at: now,
    }

    const loan = (await sbUpsert('loans', conflictCol, loanRecord)) as { id: string } | null

    if (!loan?.id) throw new Error('Loan upsert returned no record')

    // ── 4. Log activity ───────────────────────────────────────────────────────
    await sbInsert('activity_log', {
      action: 'arive_sync',
      entity_type: 'loan',
      entity_id: loan.id,
      loan_id: loan.id,
      contact_id: contact.id,
      metadata: {
        arive_loan_id: ariveLoanId,
        loan_number: loanNumber,
        status: n(body.status),
        milestone: n(body.milestone),
        source: 'arive_webhook',
      },
      user_id: resolvedUserId,
      organization_id: organizationId,
    })

    return NextResponse.json(
      {
        success: true,
        contact_id: contact.id,
        loan_id: loan.id,
        arive_loan_id: ariveLoanId,
        loan_number: loanNumber,
      },
      { status: 200 }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[arive-webhook] Error:', message)
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
