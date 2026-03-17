-- ============================================================
-- CLEANUP — Remove all test data for test@loanos.dev
-- Test user UUID: deadbeef-dead-beef-dead-beefdeadbe01
-- ============================================================

-- Activity log (depends on loans + contacts)
DELETE FROM activity_log WHERE user_id = 'deadbeef-dead-beef-dead-beefdeadbe01';

-- Email drafts (depends on loans + contacts)
DELETE FROM email_drafts WHERE user_id = 'deadbeef-dead-beef-dead-beefdeadbe01';

-- Todo items (depends on loans + contacts)
DELETE FROM todo_items WHERE user_id = 'deadbeef-dead-beef-dead-beefdeadbe01';

-- Chat sessions
DELETE FROM chat_sessions WHERE user_id = 'deadbeef-dead-beef-dead-beefdeadbe01';

-- Documents (depends on loans + contacts)
DELETE FROM documents WHERE user_id = 'deadbeef-dead-beef-dead-beefdeadbe01';

-- Scenarios
DELETE FROM scenarios WHERE user_id = 'deadbeef-dead-beef-dead-beefdeadbe01';

-- Loan status history (depends on loans)
DELETE FROM loan_status_history WHERE loan_id IN (
  SELECT id FROM loans WHERE user_id = 'deadbeef-dead-beef-dead-beefdeadbe01'
);

-- Loans (depends on contacts for FKs)
DELETE FROM loans WHERE user_id = 'deadbeef-dead-beef-dead-beefdeadbe01';

-- Contacts
DELETE FROM contacts WHERE user_id = 'deadbeef-dead-beef-dead-beefdeadbe01';

-- User settings
DELETE FROM user_settings WHERE user_id = 'deadbeef-dead-beef-dead-beefdeadbe01';

-- MCC state
DELETE FROM mcc_state WHERE user_id = 'deadbeef-dead-beef-dead-beefdeadbe01';

-- Auth identity
DELETE FROM auth.identities WHERE user_id = 'deadbeef-dead-beef-dead-beefdeadbe01';

-- Auth user
DELETE FROM auth.users WHERE id = 'deadbeef-dead-beef-dead-beefdeadbe01';

-- Verify cleanup
SELECT 'contacts' AS tbl, COUNT(*) AS remaining FROM contacts WHERE user_id = 'deadbeef-dead-beef-dead-beefdeadbe01'
UNION ALL
SELECT 'loans', COUNT(*) FROM loans WHERE user_id = 'deadbeef-dead-beef-dead-beefdeadbe01'
UNION ALL
SELECT 'activity_log', COUNT(*) FROM activity_log WHERE user_id = 'deadbeef-dead-beef-dead-beefdeadbe01';
