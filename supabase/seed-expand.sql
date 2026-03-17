-- ============================================================
-- TEST DATA ONLY — seed-expand.sql
-- Prerequisite: seed-test-user.sql must be applied first
-- All records scoped to test@loanos.dev (deadbeef-dead-beef-dead-beefdeadbe01)
-- ============================================================

-- ─────────────────────────────────────────────────
-- 1. NEW CONTACTS — Borrowers (18)
-- ─────────────────────────────────────────────────

INSERT INTO contacts (id, user_id, first_name, last_name, email, phone, contact_type, group_tag, stage, notes) VALUES
  ('c0000000-0000-4000-a000-000000000009', 'deadbeef-dead-beef-dead-beefdeadbe01',
   'Kevin', 'Marsh', 'kmarsh@email.com', '512-555-0109', 'borrower', 'Client', 'Closed', NULL),
  ('c0000000-0000-4000-a000-000000000010', 'deadbeef-dead-beef-dead-beefdeadbe01',
   'Diana', 'Flores', 'dflores@email.com', '512-555-0110', 'borrower', 'Client', 'Closed', NULL),
  ('c0000000-0000-4000-a000-000000000011', 'deadbeef-dead-beef-dead-beefdeadbe01',
   'Anthony', 'Ruiz', 'aruiz@email.com', '512-555-0111', 'borrower', 'Client', 'Closed', NULL),
  ('c0000000-0000-4000-a000-000000000012', 'deadbeef-dead-beef-dead-beefdeadbe01',
   'Stephanie', 'Yuen', 'syuen@email.com', '512-555-0112', 'borrower', 'Client', 'Closed', NULL),
  ('c0000000-0000-4000-a000-000000000013', 'deadbeef-dead-beef-dead-beefdeadbe01',
   'Marcus', 'Webb', 'mwebb@email.com', '512-555-0113', 'borrower', 'Client', 'Closed', NULL),
  ('c0000000-0000-4000-a000-000000000014', 'deadbeef-dead-beef-dead-beefdeadbe01',
   'Christine', 'Patel', 'cpatel@email.com', '512-555-0114', 'borrower', 'Client', 'Closed', NULL),
  ('c0000000-0000-4000-a000-000000000015', 'deadbeef-dead-beef-dead-beefdeadbe01',
   'Jason', 'Holloway', 'jholloway@email.com', '512-555-0115', 'borrower', 'Client', 'Closed', NULL),
  ('c0000000-0000-4000-a000-000000000016', 'deadbeef-dead-beef-dead-beefdeadbe01',
   'Natalie', 'Burns', 'nburns@email.com', '512-555-0116', 'borrower', 'Client', 'Closed', NULL),
  ('c0000000-0000-4000-a000-000000000017', 'deadbeef-dead-beef-dead-beefdeadbe01',
   'Carlos', 'Mendez', 'cmendez@email.com', '512-555-0117', 'borrower', 'Client', 'Closed', NULL),
  ('c0000000-0000-4000-a000-000000000018', 'deadbeef-dead-beef-dead-beefdeadbe01',
   'Ashley', 'Thornton', 'athornton@email.com', '512-555-0118', 'borrower', 'Client', 'Closed', NULL),
  ('c0000000-0000-4000-a000-000000000019', 'deadbeef-dead-beef-dead-beefdeadbe01',
   'David', 'Park', 'dpark@email.com', '512-555-0119', 'borrower', 'Client', 'Active', NULL),
  ('c0000000-0000-4000-a000-000000000020', 'deadbeef-dead-beef-dead-beefdeadbe01',
   'Monica', 'Castillo', 'mcastillo@email.com', '512-555-0120', 'borrower', 'Client', 'Active', NULL),
  ('c0000000-0000-4000-a000-000000000021', 'deadbeef-dead-beef-dead-beefdeadbe01',
   'Ryan', 'Nguyen', 'rnguyen@email.com', '512-555-0121', 'borrower', 'Client', 'Active', NULL),
  ('c0000000-0000-4000-a000-000000000022', 'deadbeef-dead-beef-dead-beefdeadbe01',
   'Lauren', 'Simmons', 'lsimmons@email.com', '512-555-0122', 'borrower', 'Client', 'Active', NULL),
  ('c0000000-0000-4000-a000-000000000023', 'deadbeef-dead-beef-dead-beefdeadbe01',
   'Travis', 'Coleman', 'tcoleman@email.com', '512-555-0123', 'borrower', 'Client', 'Active', NULL),
  ('c0000000-0000-4000-a000-000000000024', 'deadbeef-dead-beef-dead-beefdeadbe01',
   'Jessica', 'Holt', 'jholt@email.com', '512-555-0124', 'borrower', 'Client', 'Active', NULL),
  ('c0000000-0000-4000-a000-000000000025', 'deadbeef-dead-beef-dead-beefdeadbe01',
   'Omar', 'Khalil', 'okhalil@email.com', '512-555-0125', 'borrower', 'Client', 'Closed', NULL),
  ('c0000000-0000-4000-a000-000000000026', 'deadbeef-dead-beef-dead-beefdeadbe01',
   'Brittany', 'Shaw', 'bshaw@email.com', '512-555-0126', 'borrower', 'Client', 'Closed', NULL)
ON CONFLICT (id) DO NOTHING;


-- ─────────────────────────────────────────────────
-- 2. NEW CONTACTS — Realtors (5)
-- ─────────────────────────────────────────────────

INSERT INTO contacts (id, user_id, first_name, last_name, email, phone, contact_type, group_tag, company_name) VALUES
  ('c0000000-0000-4000-a000-000000000105', 'deadbeef-dead-beef-dead-beefdeadbe01',
   'Paul', 'Jennings', 'p.jennings@realty.com', '512-555-0205', 'realtor', 'Realtor', 'Twelve Rivers Realty'),
  ('c0000000-0000-4000-a000-000000000106', 'deadbeef-dead-beef-dead-beefdeadbe01',
   'Vanessa', 'Torres', 'v.torres@realty.com', '512-555-0206', 'realtor', 'Realtor', 'Austin Home Group'),
  ('c0000000-0000-4000-a000-000000000107', 'deadbeef-dead-beef-dead-beefdeadbe01',
   'Greg', 'Stafford', 'g.stafford@realty.com', '512-555-0207', 'realtor', 'Realtor', 'Bramlett Residential'),
  ('c0000000-0000-4000-a000-000000000108', 'deadbeef-dead-beef-dead-beefdeadbe01',
   'Kim', 'Nakamura', 'k.nakamura@realty.com', '512-555-0208', 'realtor', 'Realtor', 'Moreland Properties'),
  ('c0000000-0000-4000-a000-000000000109', 'deadbeef-dead-beef-dead-beefdeadbe01',
   'Derek', 'Osei', 'd.osei@realty.com', '512-555-0209', 'realtor', 'Realtor', 'Realty Austin')
ON CONFLICT (id) DO NOTHING;


-- ─────────────────────────────────────────────────
-- 3. NEW CONTACTS — Financial Advisors (2)
-- ─────────────────────────────────────────────────

INSERT INTO contacts (id, user_id, first_name, last_name, email, phone, contact_type, group_tag, company_name) VALUES
  ('c0000000-0000-4000-a000-000000000201', 'deadbeef-dead-beef-dead-beefdeadbe01',
   'Robert', 'Cheng', 'r.cheng@wealthadv.com', '512-555-0301', 'other', 'Financial Advisor', 'Cheng Wealth Management'),
  ('c0000000-0000-4000-a000-000000000202', 'deadbeef-dead-beef-dead-beefdeadbe01',
   'Sarah', 'Blackwell', 's.blackwell@fadvisors.com', '512-555-0302', 'other', 'Financial Advisor', 'Blackwell Financial')
ON CONFLICT (id) DO NOTHING;


-- ─────────────────────────────────────────────────
-- 4. NEW CONTACTS — Additional borrowers for new loans
-- ─────────────────────────────────────────────────

INSERT INTO contacts (id, user_id, first_name, last_name, email, phone, contact_type, group_tag, stage, notes) VALUES
  ('c0000000-0000-4000-a000-000000000027', 'deadbeef-dead-beef-dead-beefdeadbe01',
   'Michael', 'Torres', 'mtorres.web@email.com', '512-555-0130', 'borrower', 'Client', 'Lead', 'Web lead — first-time buyer'),
  ('c0000000-0000-4000-a000-000000000028', 'deadbeef-dead-beef-dead-beefdeadbe01',
   'Jennifer', 'Walsh', 'jwalsh@email.com', '512-555-0131', 'borrower', 'Client', 'Active', NULL),
  ('c0000000-0000-4000-a000-000000000029', 'deadbeef-dead-beef-dead-beefdeadbe01',
   'Tyler', 'Owens', 'towens@email.com', '512-555-0132', 'borrower', 'Client', 'Active', NULL),
  ('c0000000-0000-4000-a000-000000000030', 'deadbeef-dead-beef-dead-beefdeadbe01',
   'Amanda', 'Reyes', 'areyes@email.com', '512-555-0133', 'borrower', 'Client', 'Active', NULL),
  ('c0000000-0000-4000-a000-000000000031', 'deadbeef-dead-beef-dead-beefdeadbe01',
   'Nathan', 'Burke', 'nburke@email.com', '512-555-0134', 'borrower', 'Client', 'Active', NULL),
  ('c0000000-0000-4000-a000-000000000032', 'deadbeef-dead-beef-dead-beefdeadbe01',
   'Courtney', 'Dixon', 'cdixon@email.com', '512-555-0135', 'borrower', 'Client', 'Lead', 'Met at open house'),
  ('c0000000-0000-4000-a000-000000000033', 'deadbeef-dead-beef-dead-beefdeadbe01',
   'Alex', 'Freeman', 'afreeman@email.com', '512-555-0136', 'borrower', 'Client', 'Lead', 'Referred by Thomas Everett'),
  ('c0000000-0000-4000-a000-000000000034', 'deadbeef-dead-beef-dead-beefdeadbe01',
   'Patricia', 'Lowe', 'plowe@email.com', '512-555-0137', 'borrower', 'Client', 'Lead', 'Past client, current rate 8.5%, watching rates')
ON CONFLICT (id) DO NOTHING;


-- ─────────────────────────────────────────────────
-- 5. LOANS — Closed January 2026 (5)
-- ─────────────────────────────────────────────────

INSERT INTO loans (
  id, user_id, contact_id, status, loan_amount, loan_type, loan_purpose,
  purchase_price, property_address, property_city, property_state, property_zip,
  interest_rate, referring_agent_name, referring_agent_email, referring_agent_phone,
  buyer_agent_contact_id, commission_amount, borrower_first_name, borrower_last_name,
  borrower_email, borrower_phone, loan_name, notes, closing_date, funding_date
) VALUES
  -- L09: Kevin Marsh — Funded Jan 7
  ('a0000000-0000-4000-a000-000000000009', 'deadbeef-dead-beef-dead-beefdeadbe01',
   'c0000000-0000-4000-a000-000000000009', 'funded', 428000.00,
   'Conventional', 'purchase', 475000.00,
   '4401 Avenue F', 'Austin', 'TX', '78751',
   7.125, 'Paul Jennings', 'p.jennings@realty.com', '512-555-0205',
   'c0000000-0000-4000-a000-000000000105', 4280.00,
   'Kevin', 'Marsh', 'kmarsh@email.com', '512-555-0109',
   'Marsh — 4401 Avenue F', NULL, '2026-01-07', '2026-01-07'),

  -- L10: Diana Flores — Funded Jan 14
  ('a0000000-0000-4000-a000-000000000010', 'deadbeef-dead-beef-dead-beefdeadbe01',
   'c0000000-0000-4000-a000-000000000010', 'funded', 295000.00,
   'FHA', 'purchase', 306000.00,
   '2209 Rundberg Ln', 'Austin', 'TX', '78758',
   6.75, 'Vanessa Torres', 'v.torres@realty.com', '512-555-0206',
   'c0000000-0000-4000-a000-000000000106', 2950.00,
   'Diana', 'Flores', 'dflores@email.com', '512-555-0110',
   'Flores — 2209 Rundberg Ln', NULL, '2026-01-14', '2026-01-14'),

  -- L11: Anthony Ruiz — Funded Jan 17 (Refi)
  ('a0000000-0000-4000-a000-000000000011', 'deadbeef-dead-beef-dead-beefdeadbe01',
   'c0000000-0000-4000-a000-000000000011', 'funded', 512000.00,
   'Conventional', 'refinance', NULL,
   '1804 Scenic Dr', 'Austin', 'TX', '78703',
   6.875, NULL, NULL, NULL,
   NULL, 5120.00,
   'Anthony', 'Ruiz', 'aruiz@email.com', '512-555-0111',
   'Ruiz — 1804 Scenic Dr Refi', 'Refi from 8.25% to 6.875%', '2026-01-17', '2026-01-17'),

  -- L12: Stephanie Yuen — Funded Jan 22
  ('a0000000-0000-4000-a000-000000000012', 'deadbeef-dead-beef-dead-beefdeadbe01',
   'c0000000-0000-4000-a000-000000000012', 'funded', 374000.00,
   'VA', 'purchase', 374000.00,
   '9003 Research Blvd', 'Austin', 'TX', '78758',
   6.375, 'Greg Stafford', 'g.stafford@realty.com', '512-555-0207',
   'c0000000-0000-4000-a000-000000000107', 3740.00,
   'Stephanie', 'Yuen', 'syuen@email.com', '512-555-0112',
   'Yuen — 9003 Research Blvd', 'VA funding fee confirmed', '2026-01-22', '2026-01-22'),

  -- L13: Marcus Webb — Funded Jan 29
  ('a0000000-0000-4000-a000-000000000013', 'deadbeef-dead-beef-dead-beefdeadbe01',
   'c0000000-0000-4000-a000-000000000013', 'funded', 601000.00,
   'Conventional', 'purchase', 668000.00,
   '3712 Westlake Dr', 'Austin', 'TX', '78746',
   7.0, 'Kim Nakamura', 'k.nakamura@realty.com', '512-555-0208',
   'c0000000-0000-4000-a000-000000000108', 6010.00,
   'Marcus', 'Webb', 'mwebb@email.com', '512-555-0113',
   'Webb — 3712 Westlake Dr', NULL, '2026-01-29', '2026-01-29')
ON CONFLICT (id) DO NOTHING;


-- ─────────────────────────────────────────────────
-- 6. LOANS — Closed February 2026 (5)
-- ─────────────────────────────────────────────────

INSERT INTO loans (
  id, user_id, contact_id, status, loan_amount, loan_type, loan_purpose,
  purchase_price, property_address, property_city, property_state, property_zip,
  interest_rate, referring_agent_name, referring_agent_email, referring_agent_phone,
  buyer_agent_contact_id, commission_amount, borrower_first_name, borrower_last_name,
  borrower_email, borrower_phone, loan_name, notes, closing_date, funding_date
) VALUES
  -- L14: Christine Patel — Funded Feb 4
  ('a0000000-0000-4000-a000-000000000014', 'deadbeef-dead-beef-dead-beefdeadbe01',
   'c0000000-0000-4000-a000-000000000014', 'funded', 319000.00,
   'Conventional', 'purchase', 355000.00,
   '7102 Burnet Rd #304', 'Austin', 'TX', '78757',
   6.875, 'Paul Jennings', 'p.jennings@realty.com', '512-555-0205',
   'c0000000-0000-4000-a000-000000000105', 3190.00,
   'Christine', 'Patel', 'cpatel@email.com', '512-555-0114',
   'Patel — 7102 Burnet Rd #304', 'Condo docs cleared', '2026-02-04', '2026-02-04'),

  -- L15: Jason Holloway — Funded Feb 11 (Refi)
  ('a0000000-0000-4000-a000-000000000015', 'deadbeef-dead-beef-dead-beefdeadbe01',
   'c0000000-0000-4000-a000-000000000015', 'funded', 455000.00,
   'Conventional', 'refinance', NULL,
   '5508 Bull Creek Rd', 'Austin', 'TX', '78756',
   6.625, NULL, NULL, NULL,
   NULL, 4550.00,
   'Jason', 'Holloway', 'jholloway@email.com', '512-555-0115',
   'Holloway — 5508 Bull Creek Refi', 'Cash-out $60K. Refi from 7.75%', '2026-02-11', '2026-02-11'),

  -- L16: Natalie Burns — Funded Feb 14
  ('a0000000-0000-4000-a000-000000000016', 'deadbeef-dead-beef-dead-beefdeadbe01',
   'c0000000-0000-4000-a000-000000000016', 'funded', 388000.00,
   'FHA', 'purchase', 402000.00,
   '1320 Chicon St', 'Austin', 'TX', '78702',
   6.75, 'Vanessa Torres', 'v.torres@realty.com', '512-555-0206',
   'c0000000-0000-4000-a000-000000000106', 3880.00,
   'Natalie', 'Burns', 'nburns@email.com', '512-555-0116',
   'Burns — 1320 Chicon St', 'Valentine''s Day closing', '2026-02-14', '2026-02-14'),

  -- L17: Carlos Mendez — Funded Feb 19
  ('a0000000-0000-4000-a000-000000000017', 'deadbeef-dead-beef-dead-beefdeadbe01',
   'c0000000-0000-4000-a000-000000000017', 'funded', 543000.00,
   'Conventional', 'purchase', 605000.00,
   '2804 Pecos St', 'Austin', 'TX', '78703',
   7.0, 'Derek Osei', 'd.osei@realty.com', '512-555-0209',
   'c0000000-0000-4000-a000-000000000109', 5430.00,
   'Carlos', 'Mendez', 'cmendez@email.com', '512-555-0117',
   'Mendez — 2804 Pecos St', NULL, '2026-02-19', '2026-02-19'),

  -- L18: Ashley Thornton — Funded Feb 25
  ('a0000000-0000-4000-a000-000000000018', 'deadbeef-dead-beef-dead-beefdeadbe01',
   'c0000000-0000-4000-a000-000000000018', 'funded', 267000.00,
   'USDA', 'purchase', 267000.00,
   '204 Pecan St', 'Buda', 'TX', '78610',
   6.5, 'Greg Stafford', 'g.stafford@realty.com', '512-555-0207',
   'c0000000-0000-4000-a000-000000000107', 2670.00,
   'Ashley', 'Thornton', 'athornton@email.com', '512-555-0118',
   'Thornton — 204 Pecan St', 'USDA final approval received', '2026-02-25', '2026-02-25')
ON CONFLICT (id) DO NOTHING;


-- ─────────────────────────────────────────────────
-- 7. LOANS — Current Pipeline (8)
-- ─────────────────────────────────────────────────

INSERT INTO loans (
  id, user_id, contact_id, status, loan_amount, loan_type, loan_purpose,
  purchase_price, property_address, property_city, property_state, property_zip,
  interest_rate, referring_agent_name, referring_agent_email, referring_agent_phone,
  buyer_agent_contact_id, commission_amount, borrower_first_name, borrower_last_name,
  borrower_email, borrower_phone, loan_name, notes, closing_date, funding_date
) VALUES
  -- L19: David Park — Processing
  ('a0000000-0000-4000-a000-000000000019', 'deadbeef-dead-beef-dead-beefdeadbe01',
   'c0000000-0000-4000-a000-000000000019', 'processing', 467000.00,
   'Conventional', 'purchase', 520000.00,
   '6601 Manchaca Rd', 'Austin', 'TX', '78745',
   6.875, 'Kim Nakamura', 'k.nakamura@realty.com', '512-555-0208',
   'c0000000-0000-4000-a000-000000000108', 4670.00,
   'David', 'Park', 'dpark@email.com', '512-555-0119',
   'Park — 6601 Manchaca Rd', NULL, NULL, NULL),

  -- L20: Monica Castillo — Processing
  ('a0000000-0000-4000-a000-000000000020', 'deadbeef-dead-beef-dead-beefdeadbe01',
   'c0000000-0000-4000-a000-000000000020', 'processing', 331000.00,
   'FHA', 'purchase', 344000.00,
   '3209 Manor Rd', 'Austin', 'TX', '78723',
   6.75, 'Paul Jennings', 'p.jennings@realty.com', '512-555-0205',
   'c0000000-0000-4000-a000-000000000105', 3310.00,
   'Monica', 'Castillo', 'mcastillo@email.com', '512-555-0120',
   'Castillo — 3209 Manor Rd', NULL, NULL, NULL),

  -- L21: Ryan Nguyen — Underwriting
  ('a0000000-0000-4000-a000-000000000021', 'deadbeef-dead-beef-dead-beefdeadbe01',
   'c0000000-0000-4000-a000-000000000021', 'underwriting', 578000.00,
   'Conventional', 'purchase', 643000.00,
   '4900 Shoalwood Ave', 'Austin', 'TX', '78756',
   7.125, 'Derek Osei', 'd.osei@realty.com', '512-555-0209',
   'c0000000-0000-4000-a000-000000000109', 5780.00,
   'Ryan', 'Nguyen', 'rnguyen@email.com', '512-555-0121',
   'Nguyen — 4900 Shoalwood Ave', NULL, NULL, NULL),

  -- L22: Lauren Simmons — Underwriting (Refi)
  ('a0000000-0000-4000-a000-000000000022', 'deadbeef-dead-beef-dead-beefdeadbe01',
   'c0000000-0000-4000-a000-000000000022', 'underwriting', 412000.00,
   'Conventional', 'refinance', NULL,
   '1701 Newton St', 'Austin', 'TX', '78704',
   6.75, NULL, NULL, NULL,
   NULL, 4120.00,
   'Lauren', 'Simmons', 'lsimmons@email.com', '512-555-0122',
   'Simmons — 1701 Newton St Refi', 'Refi from 7.875% to 6.75%', NULL, NULL),

  -- L23: Travis Coleman — Clear to Close
  ('a0000000-0000-4000-a000-000000000023', 'deadbeef-dead-beef-dead-beefdeadbe01',
   'c0000000-0000-4000-a000-000000000023', 'clear_to_close', 389000.00,
   'VA', 'purchase', 389000.00,
   '8811 Research Blvd #150', 'Austin', 'TX', '78758',
   6.25, 'Vanessa Torres', 'v.torres@realty.com', '512-555-0206',
   'c0000000-0000-4000-a000-000000000106', 3890.00,
   'Travis', 'Coleman', 'tcoleman@email.com', '512-555-0123',
   'Coleman — 8811 Research Blvd', NULL, NULL, NULL),

  -- L24: Jessica Holt — Clear to Close
  ('a0000000-0000-4000-a000-000000000024', 'deadbeef-dead-beef-dead-beefdeadbe01',
   'c0000000-0000-4000-a000-000000000024', 'clear_to_close', 502000.00,
   'Conventional', 'purchase', 558000.00,
   '3304 Lake Austin Blvd', 'Austin', 'TX', '78703',
   6.875, 'Kim Nakamura', 'k.nakamura@realty.com', '512-555-0208',
   'c0000000-0000-4000-a000-000000000108', 5020.00,
   'Jessica', 'Holt', 'jholt@email.com', '512-555-0124',
   'Holt — 3304 Lake Austin Blvd', NULL, NULL, NULL),

  -- L25: Omar Khalil — Funded Mar 7
  ('a0000000-0000-4000-a000-000000000025', 'deadbeef-dead-beef-dead-beefdeadbe01',
   'c0000000-0000-4000-a000-000000000025', 'funded', 436000.00,
   'Conventional', 'purchase', 485000.00,
   '2102 Barton Springs Rd', 'Austin', 'TX', '78704',
   6.75, 'Derek Osei', 'd.osei@realty.com', '512-555-0209',
   'c0000000-0000-4000-a000-000000000109', 4360.00,
   'Omar', 'Khalil', 'okhalil@email.com', '512-555-0125',
   'Khalil — 2102 Barton Springs Rd', NULL, '2026-03-07', '2026-03-07'),

  -- L26: Brittany Shaw — Funded Mar 12
  ('a0000000-0000-4000-a000-000000000026', 'deadbeef-dead-beef-dead-beefdeadbe01',
   'c0000000-0000-4000-a000-000000000026', 'funded', 344000.00,
   'FHA', 'purchase', 357000.00,
   '5901 Berkman Dr', 'Austin', 'TX', '78723',
   6.625, 'Paul Jennings', 'p.jennings@realty.com', '512-555-0205',
   'c0000000-0000-4000-a000-000000000105', 3440.00,
   'Brittany', 'Shaw', 'bshaw@email.com', '512-555-0126',
   'Shaw — 5901 Berkman Dr', NULL, '2026-03-12', '2026-03-12')
ON CONFLICT (id) DO NOTHING;


-- ─────────────────────────────────────────────────
-- 8. LOANS — New Applications (4)
-- ─────────────────────────────────────────────────

INSERT INTO loans (
  id, user_id, contact_id, status, loan_amount, loan_type, loan_purpose,
  purchase_price, property_address, property_city, property_state, property_zip,
  interest_rate, commission_amount, borrower_first_name, borrower_last_name,
  borrower_email, borrower_phone, loan_name, notes, lead_source, referral_source
) VALUES
  -- L27: Robert Cheng — New App (self-referred financial advisor)
  ('a0000000-0000-4000-a000-000000000027', 'deadbeef-dead-beef-dead-beefdeadbe01',
   'c0000000-0000-4000-a000-000000000201', 'application_intake', 625000.00,
   'Conventional', 'purchase', 695000.00,
   NULL, 'Austin', 'TX', NULL,
   NULL, 6250.00,
   'Robert', 'Cheng', 'r.cheng@wealthadv.com', '512-555-0301',
   'Cheng — TBD Westlake area', 'Strong W2, self-referred financial advisor', 'Referral', 'Self'),

  -- L28: David Park — New App (investment property, 2nd loan)
  ('a0000000-0000-4000-a000-000000000028', 'deadbeef-dead-beef-dead-beefdeadbe01',
   'c0000000-0000-4000-a000-000000000019', 'application_intake', 385000.00,
   'Conventional', 'purchase', NULL,
   NULL, 'Austin', 'TX', NULL,
   NULL, 3850.00,
   'David', 'Park', 'dpark@email.com', '512-555-0119',
   'Park — TBD East Austin (Investment)', 'Investment property, 2nd loan for this borrower',
   NULL, NULL),

  -- L29: Sarah Blackwell — New App (financial advisor referral)
  ('a0000000-0000-4000-a000-000000000029', 'deadbeef-dead-beef-dead-beefdeadbe01',
   'c0000000-0000-4000-a000-000000000202', 'application_intake', 448000.00,
   'Conventional', 'purchase', 498000.00,
   NULL, 'Austin', 'TX', NULL,
   NULL, 4480.00,
   'Sarah', 'Blackwell', 's.blackwell@fadvisors.com', '512-555-0302',
   'Blackwell — TBD South Austin', 'Referred by Robert Cheng', 'Referral', 'Robert Cheng'),

  -- L30: Michael Torres — New App (web lead)
  ('a0000000-0000-4000-a000-000000000030', 'deadbeef-dead-beef-dead-beefdeadbe01',
   'c0000000-0000-4000-a000-000000000027', 'application_intake', 310000.00,
   'Conventional', 'purchase', 345000.00,
   NULL, 'Cedar Park', 'TX', NULL,
   NULL, 3100.00,
   'Michael', 'Torres', 'mtorres.web@email.com', '512-555-0130',
   'Torres — TBD Cedar Park', 'First-time buyer, website lead', 'Web Lead', NULL)
ON CONFLICT (id) DO NOTHING;


-- ─────────────────────────────────────────────────
-- 9. LOANS — Pre-Approvals Active (4)
-- ─────────────────────────────────────────────────

INSERT INTO loans (
  id, user_id, contact_id, status, loan_amount, loan_type, loan_purpose,
  purchase_price, property_address, property_city, property_state, property_zip,
  interest_rate, referring_agent_name, referring_agent_email, referring_agent_phone,
  buyer_agent_contact_id, commission_amount, borrower_first_name, borrower_last_name,
  borrower_email, borrower_phone, loan_name, notes
) VALUES
  -- L31: Jennifer Walsh — Pre-Approval
  ('a0000000-0000-4000-a000-000000000031', 'deadbeef-dead-beef-dead-beefdeadbe01',
   'c0000000-0000-4000-a000-000000000028', 'pre_approved', 415000.00,
   'Conventional', 'purchase', 462000.00,
   NULL, NULL, NULL, NULL,
   6.875, 'Greg Stafford', 'g.stafford@realty.com', '512-555-0207',
   'c0000000-0000-4000-a000-000000000107', 4150.00,
   'Jennifer', 'Walsh', 'jwalsh@email.com', '512-555-0131',
   'Walsh — Pre-Approval', NULL),

  -- L32: Tyler Owens — Pre-Approval
  ('a0000000-0000-4000-a000-000000000032', 'deadbeef-dead-beef-dead-beefdeadbe01',
   'c0000000-0000-4000-a000-000000000029', 'pre_approved', 289000.00,
   'FHA', 'purchase', 300000.00,
   NULL, NULL, NULL, NULL,
   6.75, 'Vanessa Torres', 'v.torres@realty.com', '512-555-0206',
   'c0000000-0000-4000-a000-000000000106', 2890.00,
   'Tyler', 'Owens', 'towens@email.com', '512-555-0132',
   'Owens — Pre-Approval', 'Actively searching'),

  -- L33: Amanda Reyes — Pre-Approval (VA)
  ('a0000000-0000-4000-a000-000000000033', 'deadbeef-dead-beef-dead-beefdeadbe01',
   'c0000000-0000-4000-a000-000000000030', 'pre_approved', 520000.00,
   'VA', 'purchase', 520000.00,
   NULL, NULL, NULL, NULL,
   6.25, NULL, NULL, NULL,
   NULL, 5200.00,
   'Amanda', 'Reyes', 'areyes@email.com', '512-555-0133',
   'Reyes — Pre-Approval VA', 'VA COE confirmed, looking in North Austin'),

  -- L34: Nathan Burke — Pre-Approval (stale — needs attention)
  ('a0000000-0000-4000-a000-000000000034', 'deadbeef-dead-beef-dead-beefdeadbe01',
   'c0000000-0000-4000-a000-000000000031', 'pre_approved', 375000.00,
   'Conventional', 'purchase', 417000.00,
   NULL, NULL, NULL, NULL,
   6.875, 'Paul Jennings', 'p.jennings@realty.com', '512-555-0205',
   'c0000000-0000-4000-a000-000000000105', 3750.00,
   'Nathan', 'Burke', 'nburke@email.com', '512-555-0134',
   'Burke — Pre-Approval', 'No activity in 7+ days — needs attention flag')
ON CONFLICT (id) DO NOTHING;


-- ─────────────────────────────────────────────────
-- 10. LOANS — Leads (3)
-- ─────────────────────────────────────────────────

INSERT INTO loans (
  id, user_id, contact_id, status, loan_amount, loan_type, loan_purpose,
  commission_amount, borrower_first_name, borrower_last_name,
  borrower_email, borrower_phone, loan_name, notes, lead_source, referral_source
) VALUES
  -- L35: Courtney Dixon — Lead
  ('a0000000-0000-4000-a000-000000000035', 'deadbeef-dead-beef-dead-beefdeadbe01',
   'c0000000-0000-4000-a000-000000000032', 'lead', 350000.00,
   'Conventional', 'purchase',
   NULL,
   'Courtney', 'Dixon', 'cdixon@email.com', '512-555-0135',
   'Dixon — Lead', 'Met at open house, interested in pre-approval', NULL, NULL),

  -- L36: Alex Freeman — Lead
  ('a0000000-0000-4000-a000-000000000036', 'deadbeef-dead-beef-dead-beefdeadbe01',
   'c0000000-0000-4000-a000-000000000033', 'lead', 480000.00,
   'Conventional', 'purchase',
   NULL,
   'Alex', 'Freeman', 'afreeman@email.com', '512-555-0136',
   'Freeman — Lead', 'Referred by Thomas Everett — wants to chat this week',
   'Realtor Referral', 'Thomas Everett'),

  -- L37: Patricia Lowe — Lead (refi opportunity)
  ('a0000000-0000-4000-a000-000000000037', 'deadbeef-dead-beef-dead-beefdeadbe01',
   'c0000000-0000-4000-a000-000000000034', 'lead', 305000.00,
   'Conventional', 'refinance',
   NULL,
   'Patricia', 'Lowe', 'plowe@email.com', '512-555-0137',
   'Lowe — Lead Refi', 'Past client, current rate 8.5%, watching rates',
   'Past Client', NULL)
ON CONFLICT (id) DO NOTHING;


-- ─────────────────────────────────────────────────
-- 11. ACTIVITY LOG — All expanded loans
-- ─────────────────────────────────────────────────

INSERT INTO activity_log (id, user_id, loan_id, contact_id, action, type, summary, entity_type, entity_id, created_at) VALUES
  -- L09: Kevin Marsh (Jan close)
  (gen_random_uuid(), 'deadbeef-dead-beef-dead-beefdeadbe01',
   'a0000000-0000-4000-a000-000000000009', 'c0000000-0000-4000-a000-000000000009',
   'communication.logged', 'Call', 'Final walkthrough clear',
   'loan', 'a0000000-0000-4000-a000-000000000009', '2026-01-05 14:00:00+00'),
  (gen_random_uuid(), 'deadbeef-dead-beef-dead-beefdeadbe01',
   'a0000000-0000-4000-a000-000000000009', 'c0000000-0000-4000-a000-000000000009',
   'communication.logged', 'Text', 'Keys delivered, smooth close',
   'loan', 'a0000000-0000-4000-a000-000000000009', '2026-01-07 16:00:00+00'),

  -- L10: Diana Flores (Jan close)
  (gen_random_uuid(), 'deadbeef-dead-beef-dead-beefdeadbe01',
   'a0000000-0000-4000-a000-000000000010', 'c0000000-0000-4000-a000-000000000010',
   'communication.logged', 'Email', 'CD sent and signed',
   'loan', 'a0000000-0000-4000-a000-000000000010', '2026-01-12 10:00:00+00'),
  (gen_random_uuid(), 'deadbeef-dead-beef-dead-beefdeadbe01',
   'a0000000-0000-4000-a000-000000000010', 'c0000000-0000-4000-a000-000000000010',
   'communication.logged', 'Text', 'Funded! Congrats Diana',
   'loan', 'a0000000-0000-4000-a000-000000000010', '2026-01-14 15:00:00+00'),

  -- L11: Anthony Ruiz (Jan close)
  (gen_random_uuid(), 'deadbeef-dead-beef-dead-beefdeadbe01',
   'a0000000-0000-4000-a000-000000000011', 'c0000000-0000-4000-a000-000000000011',
   'communication.logged', 'Call', 'Refi docs signed',
   'loan', 'a0000000-0000-4000-a000-000000000011', '2026-01-15 11:00:00+00'),
  (gen_random_uuid(), 'deadbeef-dead-beef-dead-beefdeadbe01',
   'a0000000-0000-4000-a000-000000000011', 'c0000000-0000-4000-a000-000000000011',
   'communication.logged', 'Email', 'Funded and recorded',
   'loan', 'a0000000-0000-4000-a000-000000000011', '2026-01-17 14:00:00+00'),

  -- L12: Stephanie Yuen (Jan close)
  (gen_random_uuid(), 'deadbeef-dead-beef-dead-beefdeadbe01',
   'a0000000-0000-4000-a000-000000000012', 'c0000000-0000-4000-a000-000000000012',
   'communication.logged', 'Call', 'VA funding fee confirmed',
   'loan', 'a0000000-0000-4000-a000-000000000012', '2026-01-19 09:00:00+00'),
  (gen_random_uuid(), 'deadbeef-dead-beef-dead-beefdeadbe01',
   'a0000000-0000-4000-a000-000000000012', 'c0000000-0000-4000-a000-000000000012',
   'communication.logged', 'Text', 'Closed and funded!',
   'loan', 'a0000000-0000-4000-a000-000000000012', '2026-01-22 16:00:00+00'),

  -- L13: Marcus Webb (Jan close)
  (gen_random_uuid(), 'deadbeef-dead-beef-dead-beefdeadbe01',
   'a0000000-0000-4000-a000-000000000013', 'c0000000-0000-4000-a000-000000000013',
   'communication.logged', 'Email', 'Final CD reviewed',
   'loan', 'a0000000-0000-4000-a000-000000000013', '2026-01-27 10:00:00+00'),
  (gen_random_uuid(), 'deadbeef-dead-beef-dead-beefdeadbe01',
   'a0000000-0000-4000-a000-000000000013', 'c0000000-0000-4000-a000-000000000013',
   'communication.logged', 'Call', 'Wire confirmed, closing today',
   'loan', 'a0000000-0000-4000-a000-000000000013', '2026-01-29 13:00:00+00'),

  -- L14: Christine Patel (Feb close)
  (gen_random_uuid(), 'deadbeef-dead-beef-dead-beefdeadbe01',
   'a0000000-0000-4000-a000-000000000014', 'c0000000-0000-4000-a000-000000000014',
   'communication.logged', 'Text', 'Condo docs cleared',
   'loan', 'a0000000-0000-4000-a000-000000000014', '2026-02-02 14:00:00+00'),
  (gen_random_uuid(), 'deadbeef-dead-beef-dead-beefdeadbe01',
   'a0000000-0000-4000-a000-000000000014', 'c0000000-0000-4000-a000-000000000014',
   'communication.logged', 'Email', 'Funded!',
   'loan', 'a0000000-0000-4000-a000-000000000014', '2026-02-04 15:00:00+00'),

  -- L15: Jason Holloway (Feb close)
  (gen_random_uuid(), 'deadbeef-dead-beef-dead-beefdeadbe01',
   'a0000000-0000-4000-a000-000000000015', 'c0000000-0000-4000-a000-000000000015',
   'communication.logged', 'Call', 'Cash-out confirmed $60K',
   'loan', 'a0000000-0000-4000-a000-000000000015', '2026-02-08 10:00:00+00'),
  (gen_random_uuid(), 'deadbeef-dead-beef-dead-beefdeadbe01',
   'a0000000-0000-4000-a000-000000000015', 'c0000000-0000-4000-a000-000000000015',
   'communication.logged', 'Text', 'Funded and disbursed',
   'loan', 'a0000000-0000-4000-a000-000000000015', '2026-02-11 16:00:00+00'),

  -- L16: Natalie Burns (Feb close)
  (gen_random_uuid(), 'deadbeef-dead-beef-dead-beefdeadbe01',
   'a0000000-0000-4000-a000-000000000016', 'c0000000-0000-4000-a000-000000000016',
   'communication.logged', 'Email', 'Valentine''s Day closing — congrats!',
   'loan', 'a0000000-0000-4000-a000-000000000016', '2026-02-14 12:00:00+00'),

  -- L17: Carlos Mendez (Feb close)
  (gen_random_uuid(), 'deadbeef-dead-beef-dead-beefdeadbe01',
   'a0000000-0000-4000-a000-000000000017', 'c0000000-0000-4000-a000-000000000017',
   'communication.logged', 'Call', 'Appraisal at value',
   'loan', 'a0000000-0000-4000-a000-000000000017', '2026-02-12 09:00:00+00'),
  (gen_random_uuid(), 'deadbeef-dead-beef-dead-beefdeadbe01',
   'a0000000-0000-4000-a000-000000000017', 'c0000000-0000-4000-a000-000000000017',
   'communication.logged', 'Email', 'Cleared to close',
   'loan', 'a0000000-0000-4000-a000-000000000017', '2026-02-17 11:00:00+00'),
  (gen_random_uuid(), 'deadbeef-dead-beef-dead-beefdeadbe01',
   'a0000000-0000-4000-a000-000000000017', 'c0000000-0000-4000-a000-000000000017',
   'communication.logged', 'Text', 'Funded!',
   'loan', 'a0000000-0000-4000-a000-000000000017', '2026-02-19 15:00:00+00'),

  -- L18: Ashley Thornton (Feb close)
  (gen_random_uuid(), 'deadbeef-dead-beef-dead-beefdeadbe01',
   'a0000000-0000-4000-a000-000000000018', 'c0000000-0000-4000-a000-000000000018',
   'communication.logged', 'Email', 'USDA final approval received',
   'loan', 'a0000000-0000-4000-a000-000000000018', '2026-02-21 10:00:00+00'),
  (gen_random_uuid(), 'deadbeef-dead-beef-dead-beefdeadbe01',
   'a0000000-0000-4000-a000-000000000018', 'c0000000-0000-4000-a000-000000000018',
   'communication.logged', 'Call', 'Closing confirmed',
   'loan', 'a0000000-0000-4000-a000-000000000018', '2026-02-24 14:00:00+00'),
  (gen_random_uuid(), 'deadbeef-dead-beef-dead-beefdeadbe01',
   'a0000000-0000-4000-a000-000000000018', 'c0000000-0000-4000-a000-000000000018',
   'communication.logged', 'Text', 'Funded!',
   'loan', 'a0000000-0000-4000-a000-000000000018', '2026-02-25 16:00:00+00'),

  -- L19: David Park (Processing — current)
  (gen_random_uuid(), 'deadbeef-dead-beef-dead-beefdeadbe01',
   'a0000000-0000-4000-a000-000000000019', 'c0000000-0000-4000-a000-000000000019',
   'communication.logged', 'Email', 'Initial doc request sent',
   'loan', 'a0000000-0000-4000-a000-000000000019', CURRENT_TIMESTAMP - INTERVAL '4 days'),
  (gen_random_uuid(), 'deadbeef-dead-beef-dead-beefdeadbe01',
   'a0000000-0000-4000-a000-000000000019', 'c0000000-0000-4000-a000-000000000019',
   'communication.logged', 'Text', 'Docs received',
   'loan', 'a0000000-0000-4000-a000-000000000019', CURRENT_TIMESTAMP - INTERVAL '2 days'),

  -- L20: Monica Castillo (Processing — current)
  (gen_random_uuid(), 'deadbeef-dead-beef-dead-beefdeadbe01',
   'a0000000-0000-4000-a000-000000000020', 'c0000000-0000-4000-a000-000000000020',
   'communication.logged', 'Call', 'Reviewed loan options',
   'loan', 'a0000000-0000-4000-a000-000000000020', CURRENT_TIMESTAMP - INTERVAL '6 days'),
  (gen_random_uuid(), 'deadbeef-dead-beef-dead-beefdeadbe01',
   'a0000000-0000-4000-a000-000000000020', 'c0000000-0000-4000-a000-000000000020',
   'communication.logged', 'Email', 'Processing started',
   'loan', 'a0000000-0000-4000-a000-000000000020', CURRENT_TIMESTAMP - INTERVAL '3 days'),

  -- L21: Ryan Nguyen (Underwriting — current)
  (gen_random_uuid(), 'deadbeef-dead-beef-dead-beefdeadbe01',
   'a0000000-0000-4000-a000-000000000021', 'c0000000-0000-4000-a000-000000000021',
   'communication.logged', 'Call', 'Submitted to UW',
   'loan', 'a0000000-0000-4000-a000-000000000021', CURRENT_TIMESTAMP - INTERVAL '5 days'),
  (gen_random_uuid(), 'deadbeef-dead-beef-dead-beefdeadbe01',
   'a0000000-0000-4000-a000-000000000021', 'c0000000-0000-4000-a000-000000000021',
   'communication.logged', 'Email', 'UW conditions list sent',
   'loan', 'a0000000-0000-4000-a000-000000000021', CURRENT_TIMESTAMP - INTERVAL '2 days'),

  -- L22: Lauren Simmons (Underwriting — refi)
  (gen_random_uuid(), 'deadbeef-dead-beef-dead-beefdeadbe01',
   'a0000000-0000-4000-a000-000000000022', 'c0000000-0000-4000-a000-000000000022',
   'communication.logged', 'Email', 'Refi analysis sent',
   'loan', 'a0000000-0000-4000-a000-000000000022', CURRENT_TIMESTAMP - INTERVAL '8 days'),
  (gen_random_uuid(), 'deadbeef-dead-beef-dead-beefdeadbe01',
   'a0000000-0000-4000-a000-000000000022', 'c0000000-0000-4000-a000-000000000022',
   'communication.logged', 'Call', 'Borrower approved Option B',
   'loan', 'a0000000-0000-4000-a000-000000000022', CURRENT_TIMESTAMP - INTERVAL '5 days'),
  (gen_random_uuid(), 'deadbeef-dead-beef-dead-beefdeadbe01',
   'a0000000-0000-4000-a000-000000000022', 'c0000000-0000-4000-a000-000000000022',
   'communication.logged', 'Email', 'In UW',
   'loan', 'a0000000-0000-4000-a000-000000000022', CURRENT_TIMESTAMP - INTERVAL '2 days'),

  -- L23: Travis Coleman (CTC)
  (gen_random_uuid(), 'deadbeef-dead-beef-dead-beefdeadbe01',
   'a0000000-0000-4000-a000-000000000023', 'c0000000-0000-4000-a000-000000000023',
   'communication.logged', 'Call', 'CD issued',
   'loan', 'a0000000-0000-4000-a000-000000000023', CURRENT_TIMESTAMP - INTERVAL '3 days'),
  (gen_random_uuid(), 'deadbeef-dead-beef-dead-beefdeadbe01',
   'a0000000-0000-4000-a000-000000000023', 'c0000000-0000-4000-a000-000000000023',
   'communication.logged', 'Email', 'Wire instructions confirmed',
   'loan', 'a0000000-0000-4000-a000-000000000023', CURRENT_TIMESTAMP - INTERVAL '1 day'),

  -- L24: Jessica Holt (CTC)
  (gen_random_uuid(), 'deadbeef-dead-beef-dead-beefdeadbe01',
   'a0000000-0000-4000-a000-000000000024', 'c0000000-0000-4000-a000-000000000024',
   'communication.logged', 'Email', 'Final CD sent',
   'loan', 'a0000000-0000-4000-a000-000000000024', CURRENT_TIMESTAMP - INTERVAL '2 days'),
  (gen_random_uuid(), 'deadbeef-dead-beef-dead-beefdeadbe01',
   'a0000000-0000-4000-a000-000000000024', 'c0000000-0000-4000-a000-000000000024',
   'communication.logged', 'Text', 'Closing Thursday confirmed',
   'loan', 'a0000000-0000-4000-a000-000000000024', CURRENT_TIMESTAMP - INTERVAL '1 day'),

  -- L25: Omar Khalil (Funded Mar)
  (gen_random_uuid(), 'deadbeef-dead-beef-dead-beefdeadbe01',
   'a0000000-0000-4000-a000-000000000025', 'c0000000-0000-4000-a000-000000000025',
   'communication.logged', 'Text', 'Funded! Great working with you',
   'loan', 'a0000000-0000-4000-a000-000000000025', '2026-03-07 15:00:00+00'),
  (gen_random_uuid(), 'deadbeef-dead-beef-dead-beefdeadbe01',
   'a0000000-0000-4000-a000-000000000025', 'c0000000-0000-4000-a000-000000000025',
   'communication.logged', 'Email', 'Review request sent',
   'loan', 'a0000000-0000-4000-a000-000000000025', '2026-03-08 10:00:00+00'),

  -- L26: Brittany Shaw (Funded Mar)
  (gen_random_uuid(), 'deadbeef-dead-beef-dead-beefdeadbe01',
   'a0000000-0000-4000-a000-000000000026', 'c0000000-0000-4000-a000-000000000026',
   'communication.logged', 'Call', 'Final walkthrough clear',
   'loan', 'a0000000-0000-4000-a000-000000000026', '2026-03-10 14:00:00+00'),
  (gen_random_uuid(), 'deadbeef-dead-beef-dead-beefdeadbe01',
   'a0000000-0000-4000-a000-000000000026', 'c0000000-0000-4000-a000-000000000026',
   'communication.logged', 'Text', 'Closed and funded',
   'loan', 'a0000000-0000-4000-a000-000000000026', '2026-03-12 16:00:00+00'),

  -- L27: Robert Cheng (New App)
  (gen_random_uuid(), 'deadbeef-dead-beef-dead-beefdeadbe01',
   'a0000000-0000-4000-a000-000000000027', 'c0000000-0000-4000-a000-000000000201',
   'communication.logged', 'Call', 'Initial intake — referred by self, strong W2',
   'loan', 'a0000000-0000-4000-a000-000000000027', CURRENT_TIMESTAMP - INTERVAL '0 days'),

  -- L28: David Park (New App — investment)
  (gen_random_uuid(), 'deadbeef-dead-beef-dead-beefdeadbe01',
   'a0000000-0000-4000-a000-000000000028', 'c0000000-0000-4000-a000-000000000019',
   'communication.logged', 'Email', 'App submitted for investment property',
   'loan', 'a0000000-0000-4000-a000-000000000028', CURRENT_TIMESTAMP - INTERVAL '1 day'),

  -- L29: Sarah Blackwell (New App)
  (gen_random_uuid(), 'deadbeef-dead-beef-dead-beefdeadbe01',
   'a0000000-0000-4000-a000-000000000029', 'c0000000-0000-4000-a000-000000000202',
   'communication.logged', 'Call', 'Intake call — referred by Robert Cheng',
   'loan', 'a0000000-0000-4000-a000-000000000029', CURRENT_TIMESTAMP - INTERVAL '2 days'),

  -- L30: Michael Torres (New App — web lead)
  (gen_random_uuid(), 'deadbeef-dead-beef-dead-beefdeadbe01',
   'a0000000-0000-4000-a000-000000000030', 'c0000000-0000-4000-a000-000000000027',
   'communication.logged', 'Call', 'Website lead intake call — first-time buyer',
   'loan', 'a0000000-0000-4000-a000-000000000030', CURRENT_TIMESTAMP - INTERVAL '3 days'),

  -- L31: Jennifer Walsh (Pre-Approval)
  (gen_random_uuid(), 'deadbeef-dead-beef-dead-beefdeadbe01',
   'a0000000-0000-4000-a000-000000000031', 'c0000000-0000-4000-a000-000000000028',
   'communication.logged', 'Email', 'Pre-approval letter issued',
   'loan', 'a0000000-0000-4000-a000-000000000031', CURRENT_TIMESTAMP - INTERVAL '5 days'),
  (gen_random_uuid(), 'deadbeef-dead-beef-dead-beefdeadbe01',
   'a0000000-0000-4000-a000-000000000031', 'c0000000-0000-4000-a000-000000000028',
   'communication.logged', 'Text', 'Sent PA letter PDF',
   'loan', 'a0000000-0000-4000-a000-000000000031', CURRENT_TIMESTAMP - INTERVAL '5 days'),

  -- L32: Tyler Owens (Pre-Approval)
  (gen_random_uuid(), 'deadbeef-dead-beef-dead-beefdeadbe01',
   'a0000000-0000-4000-a000-000000000032', 'c0000000-0000-4000-a000-000000000029',
   'communication.logged', 'Call', 'Pre-approval issued, actively searching',
   'loan', 'a0000000-0000-4000-a000-000000000032', CURRENT_TIMESTAMP - INTERVAL '3 days'),

  -- L33: Amanda Reyes (Pre-Approval VA)
  (gen_random_uuid(), 'deadbeef-dead-beef-dead-beefdeadbe01',
   'a0000000-0000-4000-a000-000000000033', 'c0000000-0000-4000-a000-000000000030',
   'communication.logged', 'Call', 'VA COE confirmed, pre-approved',
   'loan', 'a0000000-0000-4000-a000-000000000033', CURRENT_TIMESTAMP - INTERVAL '7 days'),
  (gen_random_uuid(), 'deadbeef-dead-beef-dead-beefdeadbe01',
   'a0000000-0000-4000-a000-000000000033', 'c0000000-0000-4000-a000-000000000030',
   'communication.logged', 'Text', 'Looking in North Austin',
   'loan', 'a0000000-0000-4000-a000-000000000033', CURRENT_TIMESTAMP - INTERVAL '4 days'),

  -- L34: Nathan Burke (Pre-Approval — stale, last activity 10 days ago)
  (gen_random_uuid(), 'deadbeef-dead-beef-dead-beefdeadbe01',
   'a0000000-0000-4000-a000-000000000034', 'c0000000-0000-4000-a000-000000000031',
   'communication.logged', 'Email', 'Pre-approval issued',
   'loan', 'a0000000-0000-4000-a000-000000000034', CURRENT_TIMESTAMP - INTERVAL '10 days'),

  -- L35: Courtney Dixon (Lead)
  (gen_random_uuid(), 'deadbeef-dead-beef-dead-beefdeadbe01',
   'a0000000-0000-4000-a000-000000000035', 'c0000000-0000-4000-a000-000000000032',
   'communication.logged', 'Call', 'Met at open house, interested in pre-approval',
   'loan', 'a0000000-0000-4000-a000-000000000035', CURRENT_TIMESTAMP - INTERVAL '2 days'),

  -- L36: Alex Freeman (Lead)
  (gen_random_uuid(), 'deadbeef-dead-beef-dead-beefdeadbe01',
   'a0000000-0000-4000-a000-000000000036', 'c0000000-0000-4000-a000-000000000033',
   'communication.logged', 'Text', 'Referred by Thomas Everett — wants to chat this week',
   'loan', 'a0000000-0000-4000-a000-000000000036', CURRENT_TIMESTAMP - INTERVAL '1 day'),

  -- L37: Patricia Lowe (Lead — refi)
  (gen_random_uuid(), 'deadbeef-dead-beef-dead-beefdeadbe01',
   'a0000000-0000-4000-a000-000000000037', 'c0000000-0000-4000-a000-000000000034',
   'communication.logged', 'Call', 'Checked in — current rate 8.5%, watching rates',
   'loan', 'a0000000-0000-4000-a000-000000000037', CURRENT_TIMESTAMP - INTERVAL '5 days');

-- Done — seed-expand.sql
