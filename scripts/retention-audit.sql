-- Retention Audit Script
-- Run annually (every January) in Supabase SQL Editor
-- RESPA requires 3-year retention on closed loan files

-- ── 1. Loans eligible for archival (closed 3+ years ago) ──────────────────
SELECT
  id,
  borrower_name,
  closing_date,
  status,
  loan_number
FROM loans
WHERE status ILIKE '%closed%'
  AND closing_date < NOW() - INTERVAL '3 years'
ORDER BY closing_date ASC;

-- ── 2. Contacts with no linked loans (lead-only, 3+ years old) ───────────
SELECT
  c.id,
  c.full_name,
  c.email,
  c.created_at
FROM contacts c
LEFT JOIN loans l ON l.contact_id = c.id
WHERE l.id IS NULL
  AND c.created_at < NOW() - INTERVAL '3 years'
ORDER BY c.created_at ASC;

-- ── 3. Chat sessions older than 1 year ───────────────────────────────────
SELECT id, record_id, record_type, created_at
FROM chat_sessions
WHERE created_at < NOW() - INTERVAL '1 year'
ORDER BY created_at ASC;

-- ── 4. Security audit log older than 3 years ──────────────────────────────
SELECT id, event_type, actor_email, created_at
FROM security_audit_log
WHERE created_at < NOW() - INTERVAL '3 years'
ORDER BY created_at ASC;
