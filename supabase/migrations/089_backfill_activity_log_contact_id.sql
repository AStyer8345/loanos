-- Migration 089: Backfill activity_log.contact_id from loans.contact_id
--
-- Why: ~100 activity_log rows have loan_id set but contact_id NULL.
-- The contact/loan record UX split (notes live on contact, loan page shows
-- system-only events) depends on activity_log rows being queryable by
-- contact_id whenever a loan is linked. Without the backfill, events that
-- were logged with only a loan_id silently disappear from the contact view.
--
-- Safe: only fills NULL contact_id values — never overwrites an existing one.
-- Idempotent: re-running is a no-op once done.

UPDATE activity_log al
SET contact_id = l.contact_id
FROM loans l
WHERE al.loan_id = l.id
  AND al.contact_id IS NULL
  AND l.contact_id IS NOT NULL;
