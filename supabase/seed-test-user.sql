-- ============================================================
-- TEST DATA ONLY — seed-test-user.sql
-- Delete all records where user_id = 'deadbeef-dead-beef-dead-beefdeadbe01' to clean up
-- Do not use in production reporting
-- ============================================================
-- Test user: test@loanos.dev / TestLoanOS2025!
-- UUID: deadbeef-dead-beef-dead-beefdeadbe01
-- ============================================================

-- ─────────────────────────────────────────────────
-- 1. CREATE TEST AUTH USER
-- ─────────────────────────────────────────────────

INSERT INTO auth.users (
  instance_id, id, aud, role, email,
  encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'deadbeef-dead-beef-dead-beefdeadbe01',
  'authenticated', 'authenticated',
  'test@loanos.dev',
  crypt('TestLoanOS2025!', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Demo User","role":"loan_officer"}',
  now(), now(),
  '', '', '', ''
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (
  id, user_id, identity_data, provider, provider_id,
  last_sign_in_at, created_at, updated_at
) VALUES (
  'deadbeef-dead-beef-dead-beefdeadbe01',
  'deadbeef-dead-beef-dead-beefdeadbe01',
  '{"sub":"deadbeef-dead-beef-dead-beefdeadbe01","email":"test@loanos.dev"}',
  'email',
  'deadbeef-dead-beef-dead-beefdeadbe01',
  now(), now(), now()
) ON CONFLICT (provider_id, provider) DO NOTHING;


-- ─────────────────────────────────────────────────
-- 2. CONTACTS — Borrowers (8)
-- ─────────────────────────────────────────────────

INSERT INTO contacts (id, user_id, first_name, last_name, email, phone, contact_type, group_tag, stage, notes) VALUES
  ('c0000000-0000-4000-a000-000000000001', 'deadbeef-dead-beef-dead-beefdeadbe01',
   'James', 'Harwell', 'james.harwell@email.com', '512-555-0101', 'borrower', 'Client', 'Active', 'Strong file, 780 credit, 20% down'),
  ('c0000000-0000-4000-a000-000000000002', 'deadbeef-dead-beef-dead-beefdeadbe01',
   'Maria', 'Gutierrez', 'maria.g@email.com', '512-555-0102', 'borrower', 'Client', 'Active', '3.5% down, gift funds verified'),
  ('c0000000-0000-4000-a000-000000000003', 'deadbeef-dead-beef-dead-beefdeadbe01',
   'Derek', 'Cho', 'dcho@email.com', '512-555-0103', 'borrower', 'Client', 'Active', 'Buyer couple — co-borrower Amanda Cho'),
  ('c0000000-0000-4000-a000-000000000004', 'deadbeef-dead-beef-dead-beefdeadbe01',
   'Priya', 'Nair', 'priya.nair@email.com', '512-555-0104', 'borrower', 'Client', 'Active', 'Rate/term refi, break-even 14 months'),
  ('c0000000-0000-4000-a000-000000000005', 'deadbeef-dead-beef-dead-beefdeadbe01',
   'Scott', 'Tillman', 'scott.t@email.com', '512-555-0105', 'borrower', 'Client', 'Active', '0 down VA, funding fee financed'),
  ('c0000000-0000-4000-a000-000000000006', 'deadbeef-dead-beef-dead-beefdeadbe01',
   'Linda', 'Okafor', 'linda.o@email.com', '512-555-0106', 'borrower', 'Client', 'Active', 'Cash-out $40K for home improvement'),
  ('c0000000-0000-4000-a000-000000000007', 'deadbeef-dead-beef-dead-beefdeadbe01',
   'Brandon', 'Wells', 'bwells@email.com', '512-555-0107', 'borrower', 'Client', 'Closed', 'Condo, HOA docs cleared'),
  ('c0000000-0000-4000-a000-000000000008', 'deadbeef-dead-beef-dead-beefdeadbe01',
   'Rachel', 'Kim', 'rkim@email.com', '512-555-0108', 'borrower', 'Client', 'Lead', 'Pre-qual only, searching actively')
ON CONFLICT (id) DO NOTHING;


-- ─────────────────────────────────────────────────
-- 3. CONTACTS — Realtors (4)
-- ─────────────────────────────────────────────────

INSERT INTO contacts (id, user_id, first_name, last_name, email, phone, contact_type, group_tag, company_name, notes) VALUES
  ('c0000000-0000-4000-a000-000000000101', 'deadbeef-dead-beef-dead-beefdeadbe01',
   'Thomas', 'Everett', 't.everett@realty.com', '512-555-0201', 'realtor', 'Realtor', 'Keller Williams', 'Top referral partner'),
  ('c0000000-0000-4000-a000-000000000102', 'deadbeef-dead-beef-dead-beefdeadbe01',
   'Sandra', 'Lopez', 's.lopez@realty.com', '512-555-0202', 'realtor', 'Realtor', 'Compass', NULL),
  ('c0000000-0000-4000-a000-000000000103', 'deadbeef-dead-beef-dead-beefdeadbe01',
   'Mike', 'Dunbar', 'm.dunbar@realty.com', '512-555-0203', 'realtor', 'Realtor', 'Redfin', NULL),
  ('c0000000-0000-4000-a000-000000000104', 'deadbeef-dead-beef-dead-beefdeadbe01',
   'Carla', 'Metz', 'c.metz@realty.com', '512-555-0204', 'realtor', 'Realtor', 'Kuper Sotheby''s', NULL)
ON CONFLICT (id) DO NOTHING;


-- ─────────────────────────────────────────────────
-- 4. LOANS (8)
-- ─────────────────────────────────────────────────

INSERT INTO loans (
  id, user_id, contact_id, status, loan_amount, loan_type, loan_purpose,
  purchase_price, property_address, property_city, property_state, property_zip,
  interest_rate, referring_agent_name, referring_agent_email, referring_agent_phone,
  buyer_agent_contact_id, commission_amount, borrower_first_name, borrower_last_name,
  borrower_email, borrower_phone, loan_name, notes, closing_date, funding_date,
  co_borrower_name
) VALUES
  -- L01: James Harwell — Pre-Approval
  ('a0000000-0000-4000-a000-000000000001', 'deadbeef-dead-beef-dead-beefdeadbe01',
   'c0000000-0000-4000-a000-000000000001', 'pre_approved', 485000.00,
   'Conventional', 'purchase', 545000.00,
   '2318 Ridgecrest Dr', 'Austin', 'TX', '78704',
   6.875, 'Thomas Everett', 't.everett@realty.com', '512-555-0201',
   'c0000000-0000-4000-a000-000000000101', 4850.00,
   'James', 'Harwell', 'james.harwell@email.com', '512-555-0101',
   'Harwell — 2318 Ridgecrest Dr', 'Strong file, 780 credit, 20% down',
   NULL, NULL, NULL),

  -- L02: Maria Gutierrez — Processing
  ('a0000000-0000-4000-a000-000000000002', 'deadbeef-dead-beef-dead-beefdeadbe01',
   'c0000000-0000-4000-a000-000000000002', 'processing', 362000.00,
   'FHA', 'purchase', 375000.00,
   '904 Mockingbird Ln', 'Round Rock', 'TX', '78664',
   6.625, 'Sandra Lopez', 's.lopez@realty.com', '512-555-0202',
   'c0000000-0000-4000-a000-000000000102', 3620.00,
   'Maria', 'Gutierrez', 'maria.g@email.com', '512-555-0102',
   'Gutierrez — 904 Mockingbird Ln', '3.5% down, gift funds verified',
   NULL, NULL, NULL),

  -- L03: Derek & Amanda Cho — Underwriting
  ('a0000000-0000-4000-a000-000000000003', 'deadbeef-dead-beef-dead-beefdeadbe01',
   'c0000000-0000-4000-a000-000000000003', 'underwriting', 615000.00,
   'Conventional', 'purchase', 690000.00,
   '5501 Lost Creek Blvd', 'Austin', 'TX', '78746',
   7.0, 'Thomas Everett', 't.everett@realty.com', '512-555-0201',
   'c0000000-0000-4000-a000-000000000101', 6150.00,
   'Derek', 'Cho', 'dcho@email.com', '512-555-0103',
   'Cho — 5501 Lost Creek Blvd', 'Jumbo threshold avoided, strong reserves',
   NULL, NULL, 'Amanda Cho'),

  -- L04: Priya Nair — Underwriting (Refi)
  ('a0000000-0000-4000-a000-000000000004', 'deadbeef-dead-beef-dead-beefdeadbe01',
   'c0000000-0000-4000-a000-000000000004', 'underwriting', 398000.00,
   'Conventional', 'refinance', NULL,
   '1122 Barton Hills Dr', 'Austin', 'TX', '78704',
   6.5, NULL, NULL, NULL,
   NULL, 3980.00,
   'Priya', 'Nair', 'priya.nair@email.com', '512-555-0104',
   'Nair — 1122 Barton Hills Dr Refi', 'Rate/term refi, break-even 14 months. Current rate 7.5%',
   NULL, NULL, NULL),

  -- L05: Scott Tillman — Clear to Close
  ('a0000000-0000-4000-a000-000000000005', 'deadbeef-dead-beef-dead-beefdeadbe01',
   'c0000000-0000-4000-a000-000000000005', 'clear_to_close', 520000.00,
   'VA', 'purchase', 520000.00,
   '3309 Pecan Springs Rd', 'Austin', 'TX', '78723',
   6.25, 'Mike Dunbar', 'm.dunbar@realty.com', '512-555-0203',
   'c0000000-0000-4000-a000-000000000103', 5200.00,
   'Scott', 'Tillman', 'scott.t@email.com', '512-555-0105',
   'Tillman — 3309 Pecan Springs Rd', '0 down VA, funding fee financed',
   NULL, NULL, NULL),

  -- L06: Linda Okafor — Clear to Close (Refi)
  ('a0000000-0000-4000-a000-000000000006', 'deadbeef-dead-beef-dead-beefdeadbe01',
   'c0000000-0000-4000-a000-000000000006', 'clear_to_close', 287000.00,
   'Conventional', 'refinance', NULL,
   '7740 Shoal Creek Blvd', 'Austin', 'TX', '78757',
   6.75, NULL, NULL, NULL,
   NULL, 2870.00,
   'Linda', 'Okafor', 'linda.o@email.com', '512-555-0106',
   'Okafor — 7740 Shoal Creek Refi', 'Cash-out $40K for home improvement. Current rate 8.0%',
   NULL, NULL, NULL),

  -- L07: Brandon Wells — Funded
  ('a0000000-0000-4000-a000-000000000007', 'deadbeef-dead-beef-dead-beefdeadbe01',
   'c0000000-0000-4000-a000-000000000007', 'funded', 441000.00,
   'Conventional', 'purchase', 490000.00,
   '612 West 6th St #210', 'Austin', 'TX', '78701',
   6.75, 'Carla Metz', 'c.metz@realty.com', '512-555-0204',
   'c0000000-0000-4000-a000-000000000104', 4410.00,
   'Brandon', 'Wells', 'bwells@email.com', '512-555-0107',
   'Wells — 612 W 6th St #210', 'Condo, HOA docs cleared',
   '2026-03-03', '2026-03-03', NULL),

  -- L08: Rachel Kim — Pre-Approval (pre-qual only)
  ('a0000000-0000-4000-a000-000000000008', 'deadbeef-dead-beef-dead-beefdeadbe01',
   'c0000000-0000-4000-a000-000000000008', 'pre_approved', 310000.00,
   'Conventional', 'purchase', 345000.00,
   NULL, 'Austin', 'TX', NULL,
   6.875, NULL, NULL, NULL,
   NULL, 3100.00,
   'Rachel', 'Kim', 'rkim@email.com', '512-555-0108',
   'Kim — TBD Austin area', 'Pre-qual only, searching actively',
   NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;


-- ─────────────────────────────────────────────────
-- 5. ACTIVITY LOG
-- ─────────────────────────────────────────────────

INSERT INTO activity_log (id, user_id, loan_id, contact_id, action, type, summary, entity_type, entity_id, created_at) VALUES
  -- James Harwell (L01)
  (gen_random_uuid(), 'deadbeef-dead-beef-dead-beefdeadbe01',
   'a0000000-0000-4000-a000-000000000001', 'c0000000-0000-4000-a000-000000000001',
   'communication.logged', 'Call', 'Reviewed pre-approval letter, discussing search timeline',
   'loan', 'a0000000-0000-4000-a000-000000000001', CURRENT_TIMESTAMP - INTERVAL '3 days'),
  (gen_random_uuid(), 'deadbeef-dead-beef-dead-beefdeadbe01',
   'a0000000-0000-4000-a000-000000000001', 'c0000000-0000-4000-a000-000000000001',
   'communication.logged', 'Text', 'Sent pre-approval letter PDF',
   'loan', 'a0000000-0000-4000-a000-000000000001', CURRENT_TIMESTAMP - INTERVAL '2 days'),

  -- Maria Gutierrez (L02)
  (gen_random_uuid(), 'deadbeef-dead-beef-dead-beefdeadbe01',
   'a0000000-0000-4000-a000-000000000002', 'c0000000-0000-4000-a000-000000000002',
   'communication.logged', 'Call', 'Processor requested updated pay stubs',
   'loan', 'a0000000-0000-4000-a000-000000000002', CURRENT_TIMESTAMP - INTERVAL '5 days'),
  (gen_random_uuid(), 'deadbeef-dead-beef-dead-beefdeadbe01',
   'a0000000-0000-4000-a000-000000000002', 'c0000000-0000-4000-a000-000000000002',
   'communication.logged', 'Email', 'Sent document request list',
   'loan', 'a0000000-0000-4000-a000-000000000002', CURRENT_TIMESTAMP - INTERVAL '4 days'),
  (gen_random_uuid(), 'deadbeef-dead-beef-dead-beefdeadbe01',
   'a0000000-0000-4000-a000-000000000002', 'c0000000-0000-4000-a000-000000000002',
   'communication.logged', 'Text', 'Confirmed docs received',
   'loan', 'a0000000-0000-4000-a000-000000000002', CURRENT_TIMESTAMP - INTERVAL '2 days'),

  -- Derek & Amanda Cho (L03)
  (gen_random_uuid(), 'deadbeef-dead-beef-dead-beefdeadbe01',
   'a0000000-0000-4000-a000-000000000003', 'c0000000-0000-4000-a000-000000000003',
   'communication.logged', 'Call', 'UW ordered appraisal',
   'loan', 'a0000000-0000-4000-a000-000000000003', CURRENT_TIMESTAMP - INTERVAL '7 days'),
  (gen_random_uuid(), 'deadbeef-dead-beef-dead-beefdeadbe01',
   'a0000000-0000-4000-a000-000000000003', 'c0000000-0000-4000-a000-000000000003',
   'communication.logged', 'Email', 'Appraisal came in at value - $695K',
   'loan', 'a0000000-0000-4000-a000-000000000003', CURRENT_TIMESTAMP - INTERVAL '4 days'),
  (gen_random_uuid(), 'deadbeef-dead-beef-dead-beefdeadbe01',
   'a0000000-0000-4000-a000-000000000003', 'c0000000-0000-4000-a000-000000000003',
   'communication.logged', 'Call', 'Reviewed appraisal results, on track to close',
   'loan', 'a0000000-0000-4000-a000-000000000003', CURRENT_TIMESTAMP - INTERVAL '2 days'),

  -- Priya Nair (L04)
  (gen_random_uuid(), 'deadbeef-dead-beef-dead-beefdeadbe01',
   'a0000000-0000-4000-a000-000000000004', 'c0000000-0000-4000-a000-000000000004',
   'communication.logged', 'Email', 'Sent refi analysis with two options',
   'loan', 'a0000000-0000-4000-a000-000000000004', CURRENT_TIMESTAMP - INTERVAL '6 days'),
  (gen_random_uuid(), 'deadbeef-dead-beef-dead-beefdeadbe01',
   'a0000000-0000-4000-a000-000000000004', 'c0000000-0000-4000-a000-000000000004',
   'communication.logged', 'Call', 'Borrower chose Option A - rate/term refi',
   'loan', 'a0000000-0000-4000-a000-000000000004', CURRENT_TIMESTAMP - INTERVAL '4 days'),
  (gen_random_uuid(), 'deadbeef-dead-beef-dead-beefdeadbe01',
   'a0000000-0000-4000-a000-000000000004', 'c0000000-0000-4000-a000-000000000004',
   'communication.logged', 'Email', 'Application submitted to UW',
   'loan', 'a0000000-0000-4000-a000-000000000004', CURRENT_TIMESTAMP - INTERVAL '2 days'),

  -- Scott Tillman (L05)
  (gen_random_uuid(), 'deadbeef-dead-beef-dead-beefdeadbe01',
   'a0000000-0000-4000-a000-000000000005', 'c0000000-0000-4000-a000-000000000005',
   'communication.logged', 'Call', 'CD issued and reviewed',
   'loan', 'a0000000-0000-4000-a000-000000000005', CURRENT_TIMESTAMP - INTERVAL '3 days'),
  (gen_random_uuid(), 'deadbeef-dead-beef-dead-beefdeadbe01',
   'a0000000-0000-4000-a000-000000000005', 'c0000000-0000-4000-a000-000000000005',
   'communication.logged', 'Email', 'Sent final CD, confirmed wire instructions',
   'loan', 'a0000000-0000-4000-a000-000000000005', CURRENT_TIMESTAMP - INTERVAL '2 days'),
  (gen_random_uuid(), 'deadbeef-dead-beef-dead-beefdeadbe01',
   'a0000000-0000-4000-a000-000000000005', 'c0000000-0000-4000-a000-000000000005',
   'communication.logged', 'Text', 'Closing confirmed for Friday 3/20',
   'loan', 'a0000000-0000-4000-a000-000000000005', CURRENT_TIMESTAMP - INTERVAL '1 day'),

  -- Linda Okafor (L06)
  (gen_random_uuid(), 'deadbeef-dead-beef-dead-beefdeadbe01',
   'a0000000-0000-4000-a000-000000000006', 'c0000000-0000-4000-a000-000000000006',
   'communication.logged', 'Call', 'Cash-out purpose confirmed, appraisal ordered',
   'loan', 'a0000000-0000-4000-a000-000000000006', CURRENT_TIMESTAMP - INTERVAL '8 days'),
  (gen_random_uuid(), 'deadbeef-dead-beef-dead-beefdeadbe01',
   'a0000000-0000-4000-a000-000000000006', 'c0000000-0000-4000-a000-000000000006',
   'communication.logged', 'Email', 'Appraisal at $415K - supports full cash-out',
   'loan', 'a0000000-0000-4000-a000-000000000006', CURRENT_TIMESTAMP - INTERVAL '5 days'),
  (gen_random_uuid(), 'deadbeef-dead-beef-dead-beefdeadbe01',
   'a0000000-0000-4000-a000-000000000006', 'c0000000-0000-4000-a000-000000000006',
   'communication.logged', 'Call', 'CD ready, reviewing numbers',
   'loan', 'a0000000-0000-4000-a000-000000000006', CURRENT_TIMESTAMP - INTERVAL '1 day'),

  -- Brandon Wells (L07)
  (gen_random_uuid(), 'deadbeef-dead-beef-dead-beefdeadbe01',
   'a0000000-0000-4000-a000-000000000007', 'c0000000-0000-4000-a000-000000000007',
   'communication.logged', 'Email', 'Sent post-close review request',
   'loan', 'a0000000-0000-4000-a000-000000000007', CURRENT_TIMESTAMP - INTERVAL '10 days'),
  (gen_random_uuid(), 'deadbeef-dead-beef-dead-beefdeadbe01',
   'a0000000-0000-4000-a000-000000000007', 'c0000000-0000-4000-a000-000000000007',
   'communication.logged', 'Text', 'Borrower left 5-star Google review',
   'loan', 'a0000000-0000-4000-a000-000000000007', CURRENT_TIMESTAMP - INTERVAL '8 days'),

  -- Rachel Kim (L08)
  (gen_random_uuid(), 'deadbeef-dead-beef-dead-beefdeadbe01',
   'a0000000-0000-4000-a000-000000000008', 'c0000000-0000-4000-a000-000000000008',
   'communication.logged', 'Call', 'Initial intake call - discussed budget and timeline',
   'loan', 'a0000000-0000-4000-a000-000000000008', CURRENT_TIMESTAMP - INTERVAL '5 days'),
  (gen_random_uuid(), 'deadbeef-dead-beef-dead-beefdeadbe01',
   'a0000000-0000-4000-a000-000000000008', 'c0000000-0000-4000-a000-000000000008',
   'communication.logged', 'Text', 'Sent pre-approval application link',
   'loan', 'a0000000-0000-4000-a000-000000000008', CURRENT_TIMESTAMP - INTERVAL '4 days');

-- Done — seed-test-user.sql
