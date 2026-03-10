#!/usr/bin/env node
/**
 * test-webhooks.js
 * Tests both Arive n8n webhooks with realistic fake payloads.
 *
 * Usage:
 *   N8N_WEBHOOK_BASE_URL=https://styer.app.n8n.cloud/webhook \
 *   ARIVE_WEBHOOK_SECRET=your-secret-here \
 *   node scripts/test-webhooks.js
 */

const BASE_URL = process.env.N8N_WEBHOOK_BASE_URL?.replace(/\/$/, '');
const SECRET   = process.env.ARIVE_WEBHOOK_SECRET;

if (!BASE_URL || !SECRET) {
  console.error('Error: N8N_WEBHOOK_BASE_URL and ARIVE_WEBHOOK_SECRET must be set.');
  process.exit(1);
}

// ─── Fake Payloads ────────────────────────────────────────────────────────────

const FAKE_ARIVE_LOAN_ID = `TEST-${Date.now()}`;

const newLoanPayload = {
  loanId:           FAKE_ARIVE_LOAN_ID,
  borrowerFirstName:'Jane',
  borrowerLastName: 'Testborrower',
  borrowerEmail:    `jane.test+${Date.now()}@example.com`,
  borrowerPhone:    '512-555-0101',
  mailingStreet:    '123 Test Lane',
  mailingCity:      'Austin',
  mailingState:     'TX',
  mailingZip:       '78701',
  loanAmount:       450000,
  loanPurpose:      'Purchase',
  propertyType:     'Single Family',
  propertyAddress:  '456 Property St, Austin TX 78702',
  interestRate:     6.875,
  loanProgram:      'Conventional',
  ltv:              80,
  loanStatus:       'Application',
  realtorName:      'Test Realtor',
  realtorEmail:     'realtor@test.com',
  realtorPhone:     '512-555-0202',
  source:           'Arive',
  salesContractDate: '2026-03-01',
  estClosingDate:   '2026-04-15',
  firstPaymentDate: '2026-06-01',
};

const statusUpdatePayload = {
  loanId:    FAKE_ARIVE_LOAN_ID,
  newStatus: 'Processing',
  updatedAt: new Date().toISOString(),
  estClosingDate:  '2026-04-15',
  firstPaymentDate:'2026-06-01',
  fundingDate:     null,
};

// ─── HTTP helper ──────────────────────────────────────────────────────────────

async function postWebhook(path, payload) {
  const url = `${BASE_URL}/${path}`;
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

// ─── Main ─────────────────────────────────────────────────────────────────────

const results = [];

async function run() {
  console.log('='.repeat(60));
  console.log('LoanOS — Arive Webhook Tests');
  console.log(`Base URL : ${BASE_URL}`);
  console.log(`Loan ID  : ${FAKE_ARIVE_LOAN_ID}`);
  console.log('='.repeat(60));

  // ── Test 1: Workflow 1 — New Loan ─────────────────────────────────────────
  console.log('\n[1/2] Workflow 1 — New Loan');
  console.log('Payload:', JSON.stringify(newLoanPayload, null, 2));

  try {
    const r1 = await postWebhook('arive-new-loan', newLoanPayload);
    console.log(`Response ${r1.status}:`, JSON.stringify(r1.body, null, 2));
    const pass1 = r1.status === 200;
    results.push({ test: 'Workflow 1 — New Loan', pass: pass1, status: r1.status });
    console.log(pass1 ? '✓ PASS' : '✗ FAIL');
  } catch (err) {
    console.error('Request failed:', err.message);
    results.push({ test: 'Workflow 1 — New Loan', pass: false, status: 'ERROR', error: err.message });
  }

  // Brief pause so n8n finishes writing records before we query them
  console.log('\nWaiting 2s before status update test...');
  await sleep(2000);

  // ── Test 2: Workflow 2 — Status Update ───────────────────────────────────
  console.log('\n[2/2] Workflow 2 — Status Update');
  console.log('Payload:', JSON.stringify(statusUpdatePayload, null, 2));

  try {
    const r2 = await postWebhook('arive-status-update', statusUpdatePayload);
    console.log(`Response ${r2.status}:`, JSON.stringify(r2.body, null, 2));
    const pass2 = r2.status === 200;
    results.push({ test: 'Workflow 2 — Status Update', pass: pass2, status: r2.status });
    console.log(pass2 ? '✓ PASS' : '✗ FAIL');
  } catch (err) {
    console.error('Request failed:', err.message);
    results.push({ test: 'Workflow 2 — Status Update', pass: false, status: 'ERROR', error: err.message });
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

  console.log('\n' + (allPass ? '✓ All tests passed.' : '✗ Some tests failed — check n8n execution logs.'));
  process.exit(allPass ? 0 : 1);
}

run();
