/**
 * netlify/functions/arive-webhook.js
 *
 * Receives Arive webhook → upserts contact + loan in Supabase → logs activity.
 *
 * Architecture:
 *   Arive → n8n webhook (orchestration) → POST here → Supabase REST API
 *   OR Arive → POST directly here (bypass n8n for simpler setup)
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

// Normalize: treat empty string as null
const n = (val) =>
  val === null || val === undefined || val === '' ? null : val;

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

  // Required fields
  const email      = n(body.loanBorrower1_emailAddressText);
  const ariveLoanId = String(body.ariveLoanId ?? '');

  if (!email) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing required field: loanBorrower1_emailAddressText' }),
    };
  }
  if (!ariveLoanId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing required field: ariveLoanId' }),
    };
  }
  if (!SYSTEM_USER_ID) {
    console.error('[arive-webhook] LOANOS_SYSTEM_USER_ID not set');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server misconfiguration: LOANOS_SYSTEM_USER_ID missing' }),
    };
  }

  try {
    // ── 1. Upsert contact on email ────────────────────────────────────────────
    const contact = await sbUpsert('contacts', 'email', {
      email:         email.toLowerCase().trim(),
      first_name:    n(body.loanBorrower1_firstName) || '',
      last_name:     n(body.loanBorrower1_lastName)  || '',
      phone:         n(body.loanBorrower1_mobilePhoneText),
      mailing_street: n(body.loanProperty_streetAddressText),
      mailing_city:   n(body.loanProperty_cityText),
      mailing_state:  n(body.loanProperty_stateText),
      mailing_zip:    n(body.loanProperty_postalCodeText),
      group_tag:     'Client',
      stage:         'Lead',
      source:        'arive_webhook',
      contact_type:  'borrower',
      user_id:       SYSTEM_USER_ID,
      updated_at:    new Date().toISOString(),
    });

    if (!contact?.id) throw new Error('Contact upsert returned no record');

    // ── 2. Upsert loan on arive_loan_id ───────────────────────────────────────
    const loan = await sbUpsert('loans', 'arive_loan_id', {
      arive_loan_id:      ariveLoanId,
      contact_id:         contact.id,
      status:             n(body.currentLoanStatus_status),
      first_payment_date: n(body.keyDates_firstPaymentDate),
      est_closing_date:   n(body.keyDates_closingContingencyDate),
      funding_date:       n(body.keyDates_estimatedFundingDate),
      sales_contract_date: n(body.keyDates_salesContractDate),
      raw_payload:        body,
      user_id:            SYSTEM_USER_ID,
      updated_at:         new Date().toISOString(),
    });

    if (!loan?.id) throw new Error('Loan upsert returned no record');

    // ── 3. Log activity ───────────────────────────────────────────────────────
    await sbInsert('activity_log', {
      action:      'arive_sync',
      entity_type: 'loan',
      entity_id:   loan.id,
      loan_id:     loan.id,
      contact_id:  contact.id,
      metadata: {
        arive_loan_id: ariveLoanId,
        status:        n(body.currentLoanStatus_status),
        source:        'arive_webhook',
      },
      user_id: SYSTEM_USER_ID,
    });

    console.log(
      `[arive-webhook] OK — loan ${loan.id} | contact ${contact.id} | arive_id ${ariveLoanId}`
    );

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success:      true,
        contact_id:   contact.id,
        loan_id:      loan.id,
        arive_loan_id: ariveLoanId,
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
