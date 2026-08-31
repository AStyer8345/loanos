/**
 * src/lib/arive/processWebhook.ts
 *
 * Shared Arive webhook processing logic.
 * Upserts contact + loan in Supabase, links transaction parties, derives dates, logs activity.
 *
 * Used by both:
 *   - /api/arive-webhook (legacy single-tenant route)
 *   - /api/arive-webhook/[slug] (multi-tenant route)
 */

import { randomBytes, createCipheriv } from 'crypto'

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

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

async function sbInsertWithId(table: string, body: Record<string, unknown>): Promise<{ id: string }> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: { ...sbHeaders(), Prefer: 'return=representation' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Supabase insert ${table} → ${res.status}: ${text}`)
  }
  const data = await res.json()
  return Array.isArray(data) ? data[0] : data
}

/**
 * Insert activity_log + encrypted PII companion row via raw HTTP.
 *
 * Writes only public fields into activity_log. PII is encrypted into
 * activity_log_pii. PII_ENCRYPTION_KEY is required — no dev fallback,
 * no dual-write (see 2026-04-10 PII hardening).
 */
async function sbInsertActivityWithPii(
  publicFields: Record<string, unknown>,
  pii: Record<string, unknown>
) {
  const keyHex = process.env.PII_ENCRYPTION_KEY
  if (!keyHex) {
    throw new Error('PII_ENCRYPTION_KEY is not set — refusing to write activity_log from arive webhook')
  }
  const key = Buffer.from(keyHex, 'hex')
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const plaintext = JSON.stringify(pii)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()

  // Public-only insert; PII goes to the companion table below.
  const activity = await sbInsertWithId('activity_log', publicFields)
  await sbInsert('activity_log_pii', {
    activity_id: activity.id,
    organization_id: publicFields.organization_id,
    pii_ciphertext: `\\x${encrypted.toString('hex')}`,
    pii_iv: `\\x${iv.toString('hex')}`,
    pii_tag: `\\x${tag.toString('hex')}`,
    key_version: 1,
  })
}

// Patch only the fields that are currently null (never overwrite user-set dates)
async function sbPatchNulls(table: string, id: string, fields: Record<string, string>) {
  const nullChecks = Object.keys(fields).map(f => `${f}.is.null`).join(',')
  const url = `${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}&or=(${nullChecks})`
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { ...sbHeaders(), Prefer: 'return=minimal' },
    body: JSON.stringify(fields),
  })
  if (!res.ok) {
    console.warn(`sbPatchNulls ${table} ${id}: ${res.status}`)
  }
}

// Normalize: treat empty string / undefined / null as null
function n(val: unknown): string | number | null {
  return val === null || val === undefined || val === '' ? null : (val as string | number)
}

// Normalize a ratio/rate field that lands in a narrow numeric(p,s) column.
// Arive derives these against monthly income, so a file keyed before income is
// entered emits values like backEndDTI = 4666.4. Postgres answers a value wider
// than the column with 22003 and rejects the WHOLE row, so one nonsense ratio
// drops an entire loan (n8n execution 51478 lost a $300,000 file this way).
// Out-of-range means "we don't know this ratio", so it becomes null rather than
// being pinned to the ceiling — a stored 999.99 would read as a real figure.
// maxAbs is the column's own limit: 10^(precision - scale) - 1.
function nBounded(val: unknown, maxAbs: number): string | number | null {
  const v = n(val)
  if (v === null) return null
  const num = typeof v === 'number' ? v : Number(v)
  if (!Number.isFinite(num) || Math.abs(num) > maxAbs) return null
  return v
}

// Parse a date string to just the date portion (YYYY-MM-DD) or null
function nDate(val: unknown): string | null {
  const s = n(val)
  if (!s) return null
  return String(s).slice(0, 10)
}

// Auto-generate loan name: {LastName}-{StreetAddress}
function generateLoanName(lastName: unknown, propertyAddress: unknown): string | null {
  const last = n(lastName) ? String(n(lastName)).trim() : null
  let street = n(propertyAddress) ? String(n(propertyAddress)).trim() : null
  if (street) {
    street = street.split(',')[0].trim()
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

async function upsertPartyContact(
  party: PartyFields,
  contactType: string,
  resolvedUserId: string | null,
  organizationId: string,
  now: string
): Promise<string | null> {
  const email = n(party.email)
  if (!email) return null

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

  if (n(party.companyName)) contactData.company_name = n(party.companyName)
  if (n(party.streetAddress)) contactData.mailing_street = n(party.streetAddress)
  if (n(party.city)) contactData.mailing_city = n(party.city)
  if (n(party.state)) contactData.mailing_state = n(party.state)
  if (n(party.postalCode)) contactData.mailing_zip = n(party.postalCode)

  try {
    const contact = await sbUpsert('contacts', 'email,organization_id', contactData) as { id: string } | null
    return contact?.id ?? null
  } catch (err) {
    console.warn(`[arive-webhook] Failed to upsert ${contactType} contact:`, err)
    return null
  }
}

// ─── Main processing function ────────────────────────────────────────────────

export async function processAriveWebhook(
  body: Record<string, unknown>,
  organizationId: string,
  resolvedUserId: string | null,
): Promise<{ success: boolean; contact_id?: string; loan_id?: string; error?: string }> {
  const email = n(body.borrowerEmail)
  const ariveLoanId = n(body.loanId) ? String(body.loanId) : null
  const loanNumber = n(body.loanNumber) ? String(body.loanNumber) : null
  const conflictId = ariveLoanId || loanNumber

  if (!email) {
    return { success: false, error: 'Missing required field: borrowerEmail' }
  }
  if (!conflictId) {
    return { success: false, error: 'Missing required field: loanId or loanNumber' }
  }

  const now = new Date().toISOString()

  try {
    // ── 1. Upsert contact on email+org (multi-tenant safe) ─────────────────────
    const contact = await sbUpsert('contacts', 'email,organization_id', {
      email: (email as string).toLowerCase().trim(),
      first_name: (n(body.borrowerFirstName) as string) || '',
      last_name: (n(body.borrowerLastName) as string) || '',
      phone: n(body.borrowerPhone) ?? n(body['loanBorrower1_mobilePhone10digit']),
      group_tag: 'Client',
      stage: 'Lead',
      source: 'arive_webhook',
      contact_type: 'borrower',
      user_id: resolvedUserId,
      organization_id: organizationId,
      updated_at: now,
    }) as { id: string; lead_source: string | null } | null

    if (!contact?.id) throw new Error('Contact upsert returned no record')

    // ── 2. Determine upsert conflict column (composite with org for multi-tenant safety)
    const conflictCol = ariveLoanId ? 'arive_loan_id,organization_id' : 'loan_number'

    // ── 3. Build loan record ──────────────────────────────────────────────────
    const createdAtDate = nDate(body.createdAt)

    const loanRecord: Record<string, unknown> = {
      arive_loan_id: ariveLoanId,
      loan_number: loanNumber,
      loan_name: generateLoanName(
        body.borrowerLastName ?? body['loanBorrower1_lastName'],
        body.propertyAddress ?? body['subjectProperty_addressLineText']
      ) ?? n(body.loanName),
      contact_id: contact.id,

      borrower_first_name: n(body.borrowerFirstName) ?? n(body['loanBorrower1_firstName']),
      borrower_last_name: n(body.borrowerLastName) ?? n(body['loanBorrower1_lastName']),
      borrower_name: [
        n(body.borrowerFirstName) ?? n(body['loanBorrower1_firstName']),
        n(body.borrowerLastName) ?? n(body['loanBorrower1_lastName']),
      ].filter(Boolean).join(' ') || null,
      borrower_email: (email as string).toLowerCase().trim(),
      borrower_phone: n(body.borrowerPhone) ?? n(body['loanBorrower1_mobilePhone10digit']),

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

      loan_amount: n(body.loanAmount),
      loan_purpose: n(body.loanPurpose),
      loan_type: n(body.mortgageType) ?? n(body.loanType),
      loan_program: n(body.loanProgram) ?? n(body.lenderProductName),
      loan_term: n(body.loanTerm),
      interest_rate: nBounded(body.interestRate, 99.9999),
      apr: nBounded(body.apr, 999.99999),
      points: nBounded(body.points, 999.99999),
      down_payment: n(body.downPayment),
      down_payment_pct: nBounded(body.downPaymentPercent, 999.99),
      ltv: nBounded(body.ltv, 999.99),
      cltv: nBounded(body.cltv, 999.99999),

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
      // Arive sends frontEndDTI / backEndDTI (uppercase DTI) -- the camelCase
      // spellings below were the only keys read until 2026-08-30, so this path
      // wrote NULL DTI on every loan. Both spellings are accepted so the fix
      // holds if Arive ever normalizes the casing.
      // Bound is 999, not the column's 99999.99999: after the 2026-08-21 widen
      // the column is roomy enough to STORE a garbage ratio as if it were a
      // fact. 4666.4 is not a debt-to-income percentage, it is what Arive emits
      // when monthlyIncome is 0. Matches the >999 -> null rule specified for
      // the n8n "Upsert Loan" clamp so both intake paths agree.
      front_end_dti: nBounded(body.frontEndDTI ?? body.frontEndDti, 999),
      back_end_dti: nBounded(body.backEndDTI ?? body.backEndDti, 999),
      monthly_debts: n(body.monthlyDebts),

      referring_agent_name: n(body.referringAgentName) ?? n(body.referralContactSourceName),
      referring_agent_email: n(body.referringAgentEmail) ?? n(body.referralContactSourceEmail),
      referring_agent_phone: n(body.referringAgentPhone),
      lender_name: n(body.lenderName),
      // Fall back to the linked contact's lead_source. Arive carries a
      // leadSource key on only 89 of 1,346 stored loans and a non-empty value
      // on 45, so the payload alone leaves loan-level source almost entirely
      // null -- 73 of 1,346 populated, against 735 of the 1,206 null-source
      // loans whose contact already knows the answer. Same rule the MISMO
      // importer got on 2026-07-03. (The second operand used to repeat
      // body.leadSource, so the ?? was a no-op.)
      lead_source: n(body.leadSource) ?? contact.lead_source ?? null,

      // Buyer's agent flat fields
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

      // Transaction coordinator flat fields
      ...(n(body['TRANSACTION_COORDINATOR_BUYERS_AGENT_firstName']) ? {
        transaction_coordinator_name: `${n(body['TRANSACTION_COORDINATOR_BUYERS_AGENT_firstName'])} ${n(body['TRANSACTION_COORDINATOR_BUYERS_AGENT_lastName']) || ''}`.trim(),
      } : {}),
      ...(n(body['TRANSACTION_COORDINATOR_BUYERS_AGENT_emailAddressText']) ? { transaction_coordinator_email: n(body['TRANSACTION_COORDINATOR_BUYERS_AGENT_emailAddressText']) } : {}),
      ...(n(body['TRANSACTION_COORDINATOR_BUYERS_AGENT_mobilePhone10digit']) ? { transaction_coordinator_phone: n(body['TRANSACTION_COORDINATOR_BUYERS_AGENT_mobilePhone10digit']) } : {}),

      // Processor
      ...(n(body.loanProcessorName) ? { processor_name: n(body.loanProcessorName) } : {}),
      ...(n(body.loanProcessorEmail) ? { processor_email: n(body.loanProcessorEmail) } : {}),

      // AUS + compensation
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
    const [buyerAgentContactId, listingAgentContactId, titleContactId, escrowContactId, tcContactId] = await Promise.all([
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
      upsertPartyContact(
        {
          firstName: body['TRANSACTION_COORDINATOR_BUYERS_AGENT_firstName'],
          lastName: body['TRANSACTION_COORDINATOR_BUYERS_AGENT_lastName'],
          email: body['TRANSACTION_COORDINATOR_BUYERS_AGENT_emailAddressText'],
          phone: body['TRANSACTION_COORDINATOR_BUYERS_AGENT_mobilePhone10digit'],
          companyName: body['TRANSACTION_COORDINATOR_BUYERS_AGENT_companyName'],
        },
        'transaction_coordinator',
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
    const borrowerEmailNorm = (email as string).toLowerCase().trim()
    const coBorrowerEmailNorm = coBorrowerEmail ? (coBorrowerEmail as string).toLowerCase().trim() : null

    if (coBorrowerEmailNorm && coBorrowerEmailNorm === borrowerEmailNorm) {
      // Shared email (e.g. married couple) — don't create a separate contact.
      // Instead, populate co_borrower_* fields on the existing borrower contact.
      coBorrowerContactId = contact.id
      try {
        const coBorrowerFields: Record<string, unknown> = {
          co_borrower_first: coBorrowerFirst ?? '',
          co_borrower_last: coBorrowerLast ?? '',
          co_borrower_email: coBorrowerEmailNorm,
          co_borrower_mobile: n(body['loanBorrower2_mobilePhone10digit']),
          updated_at: now,
        }
        await fetch(
          `${SUPABASE_URL}/rest/v1/contacts?id=eq.${contact.id}`,
          {
            method: 'PATCH',
            headers: { ...sbHeaders(), Prefer: 'return=minimal' },
            body: JSON.stringify(coBorrowerFields),
          }
        )
      } catch (err) {
        console.warn('[arive-webhook] Failed to patch co-borrower fields on shared-email contact:', err)
      }
    } else if (coBorrowerEmailNorm) {
      try {
        const coBorrowerContact = await sbUpsert('contacts', 'email,organization_id', {
          email: coBorrowerEmailNorm,
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
    if (titleContactId) fkUpdates.title_contact_id = titleContactId
    if (escrowContactId) fkUpdates.escrow_contact_id = escrowContactId
    if (tcContactId) fkUpdates.transaction_coordinator_contact_id = tcContactId
    if (coBorrowerContactId) fkUpdates.co_borrower_contact_id = coBorrowerContactId

    if (Object.keys(fkUpdates).length > 0) {
      await sbPatchNulls('loans', loan.id, fkUpdates)
    }

    // ── 3e. Auto-derive key dates from status/milestone ─────────────────────
    const status = String(n(body.status) ?? '').toUpperCase()
    const today = now.slice(0, 10)
    const derivedDates: Record<string, string> = {}

    if (n(body.status)) derivedDates.application_date = today

    if (status === 'DISCLOSURE_SENT' || status === 'DISCLOSED') {
      derivedDates.application_date = today
    }

    if (status === 'UNDERWRITING_SUBMITTED' || status === 'SUBMITTED' || status === 'SUBMITTED_TO_UNDERWRITING') {
      derivedDates.submission_date = today
    }

    if (status === 'APPROVED_WITH_CONDITIONS' || status === 'APPROVED' || status === 'CONDITIONAL_APPROVAL') {
      derivedDates.approval_date = today
    }

    if (status === 'CLEAR_TO_CLOSE' || status === 'CTC_ISSUED') {
      derivedDates.approval_date = today
    }

    if (status.includes('FUNDED') || status.includes('CLOSED') || status === 'CLOSING') {
      derivedDates.funding_date = today
      derivedDates.closing_date = today
    }

    if (Object.keys(derivedDates).length > 0) {
      await sbPatchNulls('loans', loan.id, derivedDates)
    }

    // ── 4. Log activity (PII-encrypted) ────────────────────────────────────────
    await sbInsertActivityWithPii(
      {
        action: 'arive_sync',
        entity_type: 'loan',
        entity_id: loan.id,
        loan_id: loan.id,
        contact_id: contact.id,
        user_id: resolvedUserId,
        organization_id: organizationId,
      },
      {
        metadata: {
          arive_loan_id: ariveLoanId,
          loan_number: loanNumber,
          status: n(body.status),
          milestone: n(body.milestone),
          source: 'arive_webhook',
        },
      }
    )

    return {
      success: true,
      contact_id: contact.id,
      loan_id: loan.id,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[arive-webhook] Error:', message)
    return { success: false, error: message }
  }
}
