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

// Patch only the fields that are currently null (never overwrite user-set dates)
async function sbPatchNulls(table: string, id: string, fields: Record<string, string>) {
  // Only update fields that are currently null in the DB
  const nullChecks = Object.keys(fields).map(f => `${f}.is.null`).join(',')
  const url = `${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}&or=(${nullChecks})`
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { ...sbHeaders(), Prefer: 'return=minimal' },
    body: JSON.stringify(fields),
  })
  // Silently ignore — this is best-effort date derivation
  if (!res.ok) {
    console.warn(`sbPatchNulls ${table} ${id}: ${res.status}`)
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

// ─── Transaction party upsert helper ─────────────────────────────────────────

interface PartyFields {
  firstName: unknown
  lastName: unknown
  email: unknown
  phone: unknown
  companyName: unknown
  streetAddress?: unknown
  city?: unknown
  state?: unknown
  postalCode?: unknown
}

/**
 * Upsert a transaction party (agent, title, escrow) as a contact.
 * Returns the contact id, or null if no email was provided.
 */
async function upsertPartyContact(
  party: PartyFields,
  contactType: string,
  resolvedUserId: string | null,
  organizationId: string,
  now: string
): Promise<string | null> {
  const email = n(party.email)
  if (!email) return null // Can't upsert without an email

  const contactData: Record<string, unknown> = {
    email: (email as string).toLowerCase().trim(),
    first_name: (n(party.firstName) as string) || '',
    last_name: (n(party.lastName) as string) || '',
    phone: n(party.phone),
    contact_type: contactType,
    group_tag: 'Realtor Database',
    stage: 'Lead',
    source: 'arive_webhook',
    user_id: resolvedUserId,
    organization_id: organizationId,
    updated_at: now,
  }

  // Only set company/address if Arive provides them
  if (n(party.companyName)) contactData.company_name = n(party.companyName)
  if (n(party.streetAddress)) contactData.mailing_street = n(party.streetAddress)
  if (n(party.city)) contactData.mailing_city = n(party.city)
  if (n(party.state)) contactData.mailing_state = n(party.state)
  if (n(party.postalCode)) contactData.mailing_zip = n(party.postalCode)

  try {
    const contact = await sbUpsert('contacts', 'email', contactData) as { id: string } | null
    return contact?.id ?? null
  } catch (err) {
    console.warn(`[arive-webhook] Failed to upsert ${contactType} contact:`, err)
    return null
  }
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
      // Always regenerate loan_name from last name + address when address is available.
      // Arive often sends stale names like "Harris - TBD" even after address is known.
      loan_name: generateLoanName(
        body.borrowerLastName ?? body['loanBorrower1_lastName'],
        body.propertyAddress ?? body['subjectProperty_addressLineText']
      ) ?? n(body.loanName),
      contact_id: contact.id,

      borrower_first_name: n(body.borrowerFirstName) ?? n(body['loanBorrower1_firstName']),
      borrower_last_name: n(body.borrowerLastName) ?? n(body['loanBorrower1_lastName']),
      borrower_email: (email as string).toLowerCase().trim(),
      borrower_phone: n(body.borrowerPhone) ?? n(body['loanBorrower1_mobilePhone10digit']),

      // Co-borrower — Arive sends these under loanBorrower2_* keys
      co_borrower_name: n(body.coBorrowerFullName) ?? (
        n(body['loanBorrower2_firstName'])
          ? `${n(body['loanBorrower2_firstName'])} ${n(body['loanBorrower2_lastName']) ?? ''}`.trim()
          : null
      ),
      co_borrower_email: n(body.coBorrowerEmail) ?? n(body['loanBorrower2_emailAddressText']),
      co_borrower_phone: n(body.coBorrowerPhone) ?? n(body['loanBorrower2_mobilePhone10digit']),
      co_borrower_home_phone: n(body['loanBorrower2_homePhone']),
      co_borrower_work_phone: n(body['loanBorrower2_workPhone']),
      co_borrower_marital_status: n(body['loanBorrower2_maritalStatusType']),
      // DOB: Arive only sends dayOfBirth + monthOfBirth (no year) — do not store a partial date

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
      // Only include date fields when Arive actually sends a value.
      // Null dates are omitted so merge-duplicates won't overwrite existing values.
      ...(nDate(body.applicationDate) ? { application_date: nDate(body.applicationDate) } : {}),
      ...(nDate(body.submissionDate) ?? nDate(body.UNDERWRITING_SUBMITTED) ? { submission_date: nDate(body.submissionDate) ?? nDate(body.UNDERWRITING_SUBMITTED) } : {}),
      ...(nDate(body.approvalDate) ? { approval_date: nDate(body.approvalDate) } : {}),
      ...(nDate(body.closingDate) ? { closing_date: nDate(body.closingDate) } : {}),
      ...(nDate(body.fundingDate) ? { funding_date: nDate(body.fundingDate) } : {}),
      ...(nDate(body.rateLockDate) ?? nDate(body.lockDate) ? { rate_lock_date: nDate(body.rateLockDate) ?? nDate(body.lockDate) } : {}),
      ...(nDate(body.rateLockExpiration) ?? nDate(body.lockExpirationDate) ? { rate_lock_expiration: nDate(body.rateLockExpiration) ?? nDate(body.lockExpirationDate) } : {}),
      ...(nDate(body['keyDates_estimatedFundingDate']) ?? nDate(body.estimatedClosingDate) ?? nDate(body['keyDates_closingContingency']) ? { estimated_closing_date: nDate(body['keyDates_estimatedFundingDate']) ?? nDate(body.estimatedClosingDate) ?? nDate(body['keyDates_closingContingency']) } : {}),
      ...(nDate(body.appraisalOrderedDate) ?? nDate(body['keyDates_appraisalOrderedDate']) ? { appraisal_ordered_date: nDate(body.appraisalOrderedDate) ?? nDate(body['keyDates_appraisalOrderedDate']) } : {}),
      ...(nDate(body.firstPaymentDate) ?? nDate(body['keyDates_estFirstPaymentDate']) ?? nDate(body['keyDates_firstPaymentDate']) ? { first_payment_date: nDate(body.firstPaymentDate) ?? nDate(body['keyDates_estFirstPaymentDate']) ?? nDate(body['keyDates_firstPaymentDate']) } : {}),

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

      referring_agent_name: n(body.referringAgentName) ?? n(body.referralContactSourceName),
      referring_agent_email: n(body.referringAgentEmail) ?? n(body.referralContactSourceEmail),
      referring_agent_phone: n(body.referringAgentPhone),
      lender_name: n(body.lenderName),
      lead_source: n(body.leadSource) ?? n(body.leadSource),

      // Buyer's agent flat fields (only include when Arive sends data)
      ...(n(body['REAL_ESTATE_AGENT_BUYERS_AGENT_firstName']) ? {
        buyers_agent_name: `${n(body['REAL_ESTATE_AGENT_BUYERS_AGENT_firstName'])} ${n(body['REAL_ESTATE_AGENT_BUYERS_AGENT_lastName']) || ''}`.trim(),
        buyer_agent_name: `${n(body['REAL_ESTATE_AGENT_BUYERS_AGENT_firstName'])} ${n(body['REAL_ESTATE_AGENT_BUYERS_AGENT_lastName']) || ''}`.trim(),
      } : {}),
      ...(n(body['REAL_ESTATE_AGENT_BUYERS_AGENT_emailAddressText']) ? {
        buyers_agent_email: n(body['REAL_ESTATE_AGENT_BUYERS_AGENT_emailAddressText']),
        buyer_agent_email: n(body['REAL_ESTATE_AGENT_BUYERS_AGENT_emailAddressText']),
      } : {}),
      ...(n(body['REAL_ESTATE_AGENT_BUYERS_AGENT_mobilePhone10digit']) ? {
        buyers_agent_phone: n(body['REAL_ESTATE_AGENT_BUYERS_AGENT_mobilePhone10digit']),
      } : {}),
      ...(n(body['REAL_ESTATE_AGENT_BUYERS_AGENT_companyName']) ? {
        buyer_agent_brokerage: n(body['REAL_ESTATE_AGENT_BUYERS_AGENT_companyName']),
      } : {}),

      // Listing/seller's agent flat fields
      ...(n(body['REAL_ESTATE_AGENT_SELLERS_AGENT_firstName']) ? {
        listing_agent_name: `${n(body['REAL_ESTATE_AGENT_SELLERS_AGENT_firstName'])} ${n(body['REAL_ESTATE_AGENT_SELLERS_AGENT_lastName']) || ''}`.trim(),
      } : {}),
      ...(n(body['REAL_ESTATE_AGENT_SELLERS_AGENT_emailAddressText']) ? {
        listing_agent_email: n(body['REAL_ESTATE_AGENT_SELLERS_AGENT_emailAddressText']),
      } : {}),
      ...(n(body['REAL_ESTATE_AGENT_SELLERS_AGENT_mobilePhone10digit']) ? {
        listing_agent_phone: n(body['REAL_ESTATE_AGENT_SELLERS_AGENT_mobilePhone10digit']),
      } : {}),
      ...(n(body['REAL_ESTATE_AGENT_SELLERS_AGENT_companyName']) ? {
        listing_agent_brokerage: n(body['REAL_ESTATE_AGENT_SELLERS_AGENT_companyName']),
      } : {}),

      // Title flat fields
      ...(n(body['TITLE_AGENT_companyName']) ? { title_company: n(body['TITLE_AGENT_companyName']) } : {}),
      ...(n(body['TITLE_AGENT_firstName']) ? {
        title_contact: `${n(body['TITLE_AGENT_firstName'])} ${n(body['TITLE_AGENT_lastName']) || ''}`.trim(),
      } : {}),
      ...(n(body['TITLE_AGENT_emailAddressText']) ? { title_email: n(body['TITLE_AGENT_emailAddressText']) } : {}),

      // Escrow flat fields
      ...(n(body['ESCROW_AGENT_firstName']) ? {
        escrow_officer: `${n(body['ESCROW_AGENT_firstName'])} ${n(body['ESCROW_AGENT_lastName']) || ''}`.trim(),
      } : {}),
      ...(n(body['ESCROW_AGENT_companyName']) ? { escrow_agent: n(body['ESCROW_AGENT_companyName']) } : {}),

      // Processor
      ...(n(body.loanProcessorName) ? { processor_name: n(body.loanProcessorName) } : {}),
      ...(n(body.loanProcessorEmail) ? { processor_email: n(body.loanProcessorEmail) } : {}),

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

    // ── 3b. Auto-create contacts for transaction parties ────────────────────
    // Title/escrow contacts are created but don't have FK columns on loans yet
    const [buyerAgentContactId, listingAgentContactId] = await Promise.all([
      upsertPartyContact(
        {
          firstName: body['REAL_ESTATE_AGENT_BUYERS_AGENT_firstName'],
          lastName: body['REAL_ESTATE_AGENT_BUYERS_AGENT_lastName'],
          email: body['REAL_ESTATE_AGENT_BUYERS_AGENT_emailAddressText'],
          phone: body['REAL_ESTATE_AGENT_BUYERS_AGENT_mobilePhone10digit'],
          companyName: body['REAL_ESTATE_AGENT_BUYERS_AGENT_companyName'],
          streetAddress: body['REAL_ESTATE_AGENT_BUYERS_AGENT_companyMailingAddress_streetAddress'],
          city: body['REAL_ESTATE_AGENT_BUYERS_AGENT_companyMailingAddress_city'],
          state: body['REAL_ESTATE_AGENT_BUYERS_AGENT_companyMailingAddress_state'],
          postalCode: body['REAL_ESTATE_AGENT_BUYERS_AGENT_companyMailingAddress_postalCode'],
        },
        'realtor',
        resolvedUserId,
        organizationId,
        now
      ),
      upsertPartyContact(
        {
          firstName: body['REAL_ESTATE_AGENT_SELLERS_AGENT_firstName'],
          lastName: body['REAL_ESTATE_AGENT_SELLERS_AGENT_lastName'],
          email: body['REAL_ESTATE_AGENT_SELLERS_AGENT_emailAddressText'],
          phone: body['REAL_ESTATE_AGENT_SELLERS_AGENT_mobilePhone10digit'],
          companyName: body['REAL_ESTATE_AGENT_SELLERS_AGENT_companyName'],
          streetAddress: body['REAL_ESTATE_AGENT_SELLERS_AGENT_companyMailingAddress_streetAddress'],
          city: body['REAL_ESTATE_AGENT_SELLERS_AGENT_companyMailingAddress_city'],
          state: body['REAL_ESTATE_AGENT_SELLERS_AGENT_companyMailingAddress_state'],
          postalCode: body['REAL_ESTATE_AGENT_SELLERS_AGENT_companyMailingAddress_postalCode'],
        },
        'realtor',
        resolvedUserId,
        organizationId,
        now
      ),
      upsertPartyContact(
        {
          firstName: body['TITLE_AGENT_firstName'],
          lastName: body['TITLE_AGENT_lastName'],
          email: body['TITLE_AGENT_emailAddressText'],
          phone: body['TITLE_AGENT_mobilePhone10digit'],
          companyName: body['TITLE_AGENT_companyName'],
          streetAddress: body['TITLE_AGENT_companyMailingAddress_streetAddress'],
          city: body['TITLE_AGENT_companyMailingAddress_city'],
          state: body['TITLE_AGENT_companyMailingAddress_state'],
          postalCode: body['TITLE_AGENT_companyMailingAddress_postalCode'],
        },
        'title',
        resolvedUserId,
        organizationId,
        now
      ),
      upsertPartyContact(
        {
          firstName: body['ESCROW_AGENT_firstName'],
          lastName: body['ESCROW_AGENT_lastName'],
          email: body['ESCROW_AGENT_emailAddressText'],
          phone: body['ESCROW_AGENT_mobilePhone10digit'],
          companyName: body['ESCROW_AGENT_companyName'],
          streetAddress: body['ESCROW_AGENT_companyMailingAddress_streetAddress'],
          city: body['ESCROW_AGENT_companyMailingAddress_city'],
          state: body['ESCROW_AGENT_companyMailingAddress_state'],
          postalCode: body['ESCROW_AGENT_companyMailingAddress_postalCode'],
        },
        'title',
        resolvedUserId,
        organizationId,
        now
      ),
    ])

    // ── 3c. Upsert co-borrower contact + link to loan and primary borrower ────
    const coBorrowerEmail = n(body.coBorrowerEmail) ?? n(body['loanBorrower2_emailAddressText'])
    const coBorrowerFirst = n(body['loanBorrower2_firstName']) as string | null
    const coBorrowerLast = n(body['loanBorrower2_lastName']) as string | null

    let coBorrowerContactId: string | null = null
    if (coBorrowerEmail) {
      try {
        const coBorrowerContact = await sbUpsert('contacts', 'email', {
          email: (coBorrowerEmail as string).toLowerCase().trim(),
          first_name: coBorrowerFirst ?? '',
          last_name: coBorrowerLast ?? '',
          phone: n(body['loanBorrower2_mobilePhone10digit']),
          group_tag: 'Client',
          stage: 'Lead',
          source: 'arive_webhook',
          contact_type: 'borrower',
          user_id: resolvedUserId,
          organization_id: organizationId,
          updated_at: now,
        }) as { id: string } | null
        coBorrowerContactId = coBorrowerContact?.id ?? null
      } catch (err) {
        console.warn('[arive-webhook] Failed to upsert co-borrower contact:', err)
      }
    }

    // ── 3d. Link party contacts to loan via FK columns ──────────────────────
    const fkUpdates: Record<string, string> = {}
    if (buyerAgentContactId) fkUpdates.buyer_agent_contact_id = buyerAgentContactId
    if (listingAgentContactId) fkUpdates.listing_agent_contact_id = listingAgentContactId
    if (coBorrowerContactId) fkUpdates.co_borrower_contact_id = coBorrowerContactId

    if (Object.keys(fkUpdates).length > 0) {
      await sbPatchNulls('loans', loan.id, fkUpdates)
    }

    // ── 3e. Auto-derive key dates from status/milestone ─────────────────────
    // When Arive doesn't send explicit date fields, stamp them based on the
    // current status. Only fills nulls — never overwrites user-set dates.
    const status = String(n(body.status) ?? '').toUpperCase()
    const today = now.slice(0, 10) // YYYY-MM-DD
    const derivedDates: Record<string, string> = {}

    // Application date: stamp when we first see ANY status
    if (n(body.status)) derivedDates.application_date = today

    // Disclosure sent
    if (status === 'DISCLOSURE_SENT' || status === 'DISCLOSED') {
      derivedDates.application_date = today
    }

    // Submitted to underwriting
    if (status === 'UNDERWRITING_SUBMITTED' || status === 'SUBMITTED' || status === 'SUBMITTED_TO_UNDERWRITING') {
      derivedDates.submission_date = today
    }

    // Approved with conditions
    if (status === 'APPROVED_WITH_CONDITIONS' || status === 'APPROVED' || status === 'CONDITIONAL_APPROVAL') {
      derivedDates.approval_date = today
    }

    // Clear to close
    if (status === 'CLEAR_TO_CLOSE' || status === 'CTC_ISSUED') {
      derivedDates.approval_date = today
    }

    // Funded / closed — catch all variations
    if (status.includes('FUNDED') || status.includes('CLOSED') || status === 'CLOSING') {
      derivedDates.funding_date = today
      derivedDates.closing_date = today
    }

    if (Object.keys(derivedDates).length > 0) {
      await sbPatchNulls('loans', loan.id, derivedDates)
    }

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
