#!/usr/bin/env node
/**
 * test-webhooks.js
 * Tests Arive webhook integration using real Arive field names.
 *
 * Supports two targets:
 *   --netlify   POST directly to Netlify function (fastest, tests DB writes)
 *   --n8n       POST to n8n orchestrator (tests full pipeline including error alerting)
 *
 * Usage:
 *   # Test Netlify function directly (requires local or deployed URL)
 *   NETLIFY_URL=https://your-site.netlify.app \
 *   ARIVE_WEBHOOK_SECRET=your-secret \
 *   node scripts/test-webhooks.js --netlify
 *
 *   # Test n8n orchestrator
 *   N8N_WEBHOOK_BASE_URL=https://styer.app.n8n.cloud/webhook \
 *   ARIVE_WEBHOOK_SECRET=your-secret \
 *   node scripts/test-webhooks.js --n8n
 *
 *   # Default: Netlify
 *   NETLIFY_URL=... ARIVE_WEBHOOK_SECRET=... node scripts/test-webhooks.js
 */

const SECRET  = process.env.ARIVE_WEBHOOK_SECRET;
const TARGET  = process.argv.includes('--n8n') ? 'n8n' : 'netlify';

const NETLIFY_URL = process.env.NETLIFY_URL?.replace(/\/$/, '')
                 || 'http://localhost:8888';
const N8N_BASE    = process.env.N8N_WEBHOOK_BASE_URL?.replace(/\/$/, '');

if (!SECRET) {
  console.error('Error: ARIVE_WEBHOOK_SECRET must be set.');
  process.exit(1);
}
if (TARGET === 'n8n' && !N8N_BASE) {
  console.error('Error: N8N_WEBHOOK_BASE_URL must be set when using --n8n.');
  process.exit(1);
}

// ─── Real Arive Field Names ────────────────────────────────────────────────────
// These match the actual Arive webhook payload structure (camelCase with underscores).
// Do NOT use simplified names like loanId, borrowerEmail — Arive sends these exact keys.

const FAKE_ARIVE_LOAN_ID = `TEST-${Date.now()}`;

const newLoanPayload = {
  // Required
  ariveLoanId:                        FAKE_ARIVE_LOAN_ID,
  loanBorrower1_emailAddressText:     `jane.test+${Date.now()}@example.com`,
  // Borrower
  loanBorrower1_firstName:            'Jane',
  loanBorrower1_lastName:             'Testborrower',
  loanBorrower1_mobilePhoneText:      '512-555-0101',
  // Property (used for contact mailing address)
  loanProperty_streetAddressText:     '456 Property St',
  loanProperty_cityText:              'Austin',
  loanProperty_stateText:             'TX',
  loanProperty_postalCodeText:        '78702',
  // Loan status
  currentLoanStatus_status:           'Application',
  // Key dates (ISO date strings or null)
  keyDates_salesContractDate:         '2026-03-01',
  keyDates_closingContingencyDate:    '2026-04-15',
  keyDates_estimatedFundingDate:      '2026-04-20',
  keyDates_firstPaymentDate:          '2026-06-01',
};

const statusUpdatePayload = {
  // Required — must reference a loan already in DB (created by newLoan test)
  ariveLoanId:                        FAKE_ARIVE_LOAN_ID,
  currentLoanStatus_status:           'Processing',
  keyDates_closingContingencyDate:    '2026-04-15',
  keyDates_estimatedFundingDate:      '2026-04-22',
  keyDates_firstPaymentDate:          '2026-06-01',
};

// ─── HTTP helper ──────────────────────────────────────────────────────────────

async function postWebhook(url, payload) {
  console.log(`\nPOST ${url}`);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Webhook-Secret': SECRET,
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }

  return { status: res.status, ok: res.ok, body };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getUrls() {
  if (TARGET === 'n8n') {
    return {
      newLoan:      `${N8N_BASE}/arive-sync`,
      statusUpdate: `${N8N_BASE}/arive-sync`,   // same orchestrator, Arive sends all events here
    };
  }
  return {
    newLoan:      `${NETLIFY_URL}/.netlify/functions/arive-webhook`,
    statusUpdate: `${NETLIFY_URL}/.netlify/functions/arive-webhook`,
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const results = [];

async function run() {
  const urls = getUrls();

  console.log('='.repeat(60));
  console.log('LoanOS — Arive Webhook Tests');
  console.log(`Target   : ${TARGET === 'n8n' ? 'n8n orchestrator' : 'Netlify function (direct)'}`);
  console.log(`Loan ID  : ${FAKE_ARIVE_LOAN_ID}`);
  console.log('='.repeat(60));

  // ── Test 1: New Loan ──────────────────────────────────────────────────────
  console.log('\n[1/2] New Loan (upsert contact + loan + activity_log)');
  console.log('Payload:', JSON.stringify(newLoanPayload, null, 2));

  try {
    const r1 = await postWebhook(urls.newLoan, newLoanPayload);
    console.log(`Response ${r1.status}:`, JSON.stringify(r1.body, null, 2));
    const pass1 = r1.status === 200;
    results.push({ test: 'New Loan', pass: pass1, status: r1.status });
    console.log(pass1 ? '✓ PASS' : '✗ FAIL');
  } catch (err) {
    console.error('Request failed:', err.message);
    results.push({ test: 'New Loan', pass: false, status: 'ERROR', error: err.message });
  }

  // Give Supabase a moment before status update test
  console.log('\nWaiting 2s before status update...');
  await sleep(2000);

  // ── Test 2: Status Update ─────────────────────────────────────────────────
  console.log('\n[2/2] Status Update (re-upsert with new status + dates)');
  console.log('Payload:', JSON.stringify(statusUpdatePayload, null, 2));

  try {
    const r2 = await postWebhook(urls.statusUpdate, statusUpdatePayload);
    console.log(`Response ${r2.status}:`, JSON.stringify(r2.body, null, 2));
    const pass2 = r2.status === 200;
    results.push({ test: 'Status Update', pass: pass2, status: r2.status });
    console.log(pass2 ? '✓ PASS' : '✗ FAIL');
  } catch (err) {
    console.error('Request failed:', err.message);
    results.push({ test: 'Status Update', pass: false, status: 'ERROR', error: err.message });
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));

  let allPass = true;
  for (const r of results) {
    const icon = r.pass ? '✓' : '✗';
    console.log(`${icon} ${r.test} — HTTP ${r.status}${r.error ? ` (${r.error})` : ''}`);
    if (!r.pass) allPass = false;
  }

  const hint = allPass
    ? '✓ All tests passed.'
    : TARGET === 'n8n'
      ? '✗ Some tests failed — check n8n execution logs + Netlify function logs.'
      : '✗ Some tests failed — check Netlify function logs (netlify dev or Netlify dashboard).';

  console.log('\n' + hint);
  process.exit(allPass ? 0 : 1);
}

run();
