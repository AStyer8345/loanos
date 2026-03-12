/**
 * netlify/functions/arive-webhook.js
 *
 * Receives Arive webhook → upserts contact + loan in Supabase → logs activity.
 *
 * Auth: validates X-Webhook-Secret header against ARIVE_WEBHOOK_SECRET env var.
 *
 * Required env vars (set in Netlify dashboard → Site configuration → Env vars):
 *   SUPABASE_URL              https://uuqedsvjlkeszrbwzizl.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY sb-service-role-...
 *   ARIVE_WEBHOOK_SECRET      your-shared-secret-string
 *   LOANOS_SYSTEM_USER_ID     UUID of Adam's auth.users record
 */

const SUPABASE_URL             = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ARIVE_WEBHOOK_SECRET     = process.env.ARIVE_WEBHOOK_SECRET;
const SYSTEM_USER_ID           = process.env.LOANOS_SYSTEM_USER_ID;

// ─── Supabase helpers ─────────────────────────────────────────────────────────

const sbHeaders = () => ({
  'apikey': SUPABASE_SERVICE_ROLE_KEY,
  'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json',
});

async function sbUpsert(table, conflictCol, body) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/${table}?on_conflict=${conflictCol}`,
    {
      method: 'POST',
      headers: {
        ...sbHeaders(),
        'Prefer': 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase upsert ${table} → ${res.status}: ${text}`);
  }
  const data = await res.json();
  return Array.isArray(data) ? data[0] : data;
}

async function sbInsert(table, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: { ...sbHeaders(), 'Prefer': 'return=minimal' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase insert ${table} → ${res.status}: ${text}`);
  }
}

// Normalize: treat empty string / undefined / null as null
const n = (val) =>
  val === null || val === undefined || val === '' ? null : val;

// Parse a date string to just the date portion (YYYY-MM-DD) or null
const nDate = (val) => {
  const s = n(val);
  if (!s) return null;
  // If it's an ISO timestamp, take just the date part
  return String(s).slice(0, 10);
};

// ─── Handler ──────────────────────────────────────────────────────────────────

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  // Validate webhook secret
  const incomingSecret =
    event.headers['x-webhook-secret'] || event.headers['X-Webhook-Secret'];
  if (!ARIVE_WEBHOOK_SECRET || incomingSecret !== ARIVE_WEBHOOK_SECRET) {
    console.error('[arive-webhook] Unauthorized — bad or missing X-Webhook-Secret');
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  // Parse payload
  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  // Required fields — new camelCase format from ARIVE
  const email       = n(body.borrowerEmail);
  const ariveLoanId = n(body.loanId) ? String(body.loanId) : null;
  const loanNumber  = n(body.loanNumber) ? String(body.loanNumber) : null;

  // At least one loan identifier required
  const conflictId = ariveLoanId || loanNumber;

  if (!email) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing required field: borrowerEmail' }),
    };
  }
  if (!conflictId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing required field: loanId or loanNumber' }),
    };
  }
  if (!SYSTEM_USER_ID) {
    console.error('[arive-webhook] LOANOS_SYSTEM_USER_ID not set');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server misconfiguration: LOANOS_SYSTEM_USER_ID missing' }),
    };
  }

  const now = new Date().toISOString();

  try {
    // ── 1. Upsert contact on email ────────────────────────────────────────────
    const contact = await sbUpsert('contacts', 'email', {
      email:         email.toLowerCase().trim(),
      first_name:    n(body.borrowerFirstName) || '',
      last_name:     n(body.borrowerLastName)  || '',
      phone:         n(body.borrowerPhone),
      group_tag:     'Client',
      stage:         'Lead',
      source:        'arive_webhook',
      contact_type:  'borrower',
      user_id:       SYSTEM_USER_ID,
      updated_at:    now,
    });

    if (!contact?.id) throw new Error('Contact upsert returned no record');

    // ── 2. Determine upsert conflict column ───────────────────────────────────
    // Prefer arive_loan_id; fall back to loan_number
    const conflictCol = ariveLoanId ? 'arive_loan_id' : 'loan_number';

    // ── 3. Build loan record ──────────────────────────────────────────────────
    // loan_created_date is only set on initial insert; we pass it every time
    // and rely on merge-duplicates (which updates all fields) — if you want
    // to preserve the original created date, handle that in a DB trigger or
    // check existing row first. For simplicity we set it from createdAt.
    const createdAtDate = nDate(body.createdAt);

    const loanRecord = {
      // Identity
      arive_loan_id:      ariveLoanId,
      loan_number:        loanNumber,
      loan_name:          n(body.loanName),
      contact_id:         contact.id,

      // Borrower
      borrower_first_name: n(body.borrowerFirstName),
      borrower_last_name:  n(body.borrowerLastName),
      borrower_email:      email.toLowerCase().trim(),
      borrower_phone:      n(body.borrowerPhone),
      co_borrower_name:    n(body.coBorrowerFullName),

      // Loan terms
      loan_amount:         n(body.loanAmount),
      loan_purpose:        n(body.loanPurpose),
      loan_type:           n(body.loanType),
      loan_program:        n(body.loanProgram),
      loan_term:           n(body.loanTerm),
      interest_rate:       n(body.interestRate),
      apr:                 n(body.apr),
      points:              n(body.points),
      down_payment:        n(body.downPayment),
      down_payment_pct:    n(body.downPaymentPercent),
      ltv:                 n(body.ltv),
      cltv:                n(body.cltv),

      // Property
      property_address:    n(body.propertyAddress),
      property_city:       n(body.propertyCity),
      property_state:      n(body.propertyState),
      property_zip:        n(body.propertyZip),
      property_county:     n(body.propertyCounty),
      property_type:       n(body.propertyType),
      occupancy_type:      n(body.occupancyType),
      purchase_price:      n(body.purchasePrice),
      appraised_value:     n(body.appraisedValue),

      // Pipeline / status
      status:              n(body.status),
      milestone:           n(body.milestone),
      application_date:    nDate(body.applicationDate),
      submission_date:     nDate(body.submissionDate),
      approval_date:       nDate(body.approvalDate),
      closing_date:        nDate(body.closingDate),
      funding_date:        nDate(body.fundingDate),
      rate_lock_expiration: nDate(body.rateLockExpiration),
      estimated_closing_date: nDate(body.estimatedClosingDate),

      // Financials
      monthly_payment:     n(body.monthlyPayment),
      piti:                n(body.piti),
      cash_to_close:       n(body.cashToClose),
      seller_credits:      n(body.sellerCredits),
      lender_credits:      n(body.lenderCredits),
      loan_costs:          n(body.loanCosts),
      total_closing_costs: n(body.totalClosingCosts),

      // Qualifying
      credit_score:        n(body.creditScore),
      middle_score:        n(body.middleScore),
      monthly_income:      n(body.monthlyIncome),
      front_end_dti:       n(body.frontEndDti),
      back_end_dti:        n(body.backEndDti),
      monthly_debts:       n(body.monthlyDebts),

      // Parties
      referring_agent_name:  n(body.referringAgentName),
      referring_agent_email: n(body.referringAgentEmail),
      lender_name:           n(body.lenderName),
      lead_source:           n(body.leadSource),

      // ARIVE timestamps
      loan_created_date: createdAtDate,
      arive_created_at:  n(body.createdAt),
      arive_updated_at:  n(body.updatedAt),

      // Always updated
      raw_payload:  body,
      user_id:      SYSTEM_USER_ID,
      updated_at:   now,
      synced_at:    now,
    };

    const loan = await sbUpsert('loans', conflictCol, loanRecord);

    if (!loan?.id) throw new Error('Loan upsert returned no record');

    // ── 4. Log activity ───────────────────────────────────────────────────────
    await sbInsert('activity_log', {
      action:      'arive_sync',
      entity_type: 'loan',
      entity_id:   loan.id,
      loan_id:     loan.id,
      contact_id:  contact.id,
      metadata: {
        arive_loan_id: ariveLoanId,
        loan_number:   loanNumber,
        status:        n(body.status),
        milestone:     n(body.milestone),
        source:        'arive_webhook',
      },
      user_id: SYSTEM_USER_ID,
    });

    console.log(
      `[arive-webhook] OK — loan ${loan.id} | contact ${contact.id} | arive_id ${ariveLoanId} | loan# ${loanNumber}`
    );

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success:      true,
        contact_id:   contact.id,
        loan_id:      loan.id,
        arive_loan_id: ariveLoanId,
        loan_number:  loanNumber,
      }),
    };
  } catch (err) {
    console.error('[arive-webhook] Error:', err.message);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, error: err.message }),
    };
  }
};
