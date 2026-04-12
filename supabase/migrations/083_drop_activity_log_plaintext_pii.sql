-- Migration 083: Drop plaintext PII columns from activity_log.
--
-- Phase 3 of the PII hardening plan started in migration 079 (create encrypted
-- companion table) and continued through the application deploys:
--
--   079_activity_log_pii.sql        create activity_log_pii + RLS
--   (deploy #1, b9afb67)            route all PII writes through writeActivityWithPii,
--                                   dual-write inline + companion
--   (backfill script)               scripts/backfill-activity-pii.ts populated
--                                   companion rows for pre-079 history
--   (deploy #2, f055271)            stop dual-writing — new rows write ONLY to
--                                   activity_log_pii, inline columns left NULL
--   (deploy #2.5, 2be3d4c + 2a2c481) middleware matcher fix + LOANOS_AGENT_SECRET
--                                   in Vercel — closes the n8n silent-failure window
--   083 (this migration)            drop the inline columns for good
--
-- Pre-conditions verified immediately before this migration is applied
-- (see CHANGELOG.md 2026-04-11 PM entry for the full audit trail):
--
--   * 1403/1403 rows in activity_log have a companion row in activity_log_pii
--     (0 rows missing companion — full backfill coverage)
--
--   * scripts/verify-live-decrypt.ts passed 1402/1402 on every row that still
--     has non-null inline PII — the encrypted companion faithfully decrypts to
--     the same value for every field (summary, subject, body_snippet,
--     from_address, raw_payload, metadata)
--
--   * The one row with no inline PII is the post-deploy-#2 live probe
--     (f6399c90-c5f0-4120-8987-94e9730bb5b8) — correct behavior: new writes
--     go to the companion only
--
-- Nothing in the codebase reads these columns any more:
--
--   * src/app/api/activity/route.ts GET handler: stripPiiColumns() removes
--     PII field names from caller-supplied `columns=` params and always joins
--     activity_log_pii to satisfy requests via decryptActivityPii()
--
--   * src/lib/activity/pii.ts decryptActivityPii(): requires PII_ENCRYPTION_KEY
--     and reads from the companion only — no fallback to inline columns since
--     deploy #2
--
--   * writeActivityWithPii() inserts only public fields into activity_log and
--     routes PII exclusively to activity_log_pii
--
-- After this migration:
--
--   * activity_log contains zero plaintext PII anywhere, at any time
--   * Rotating PII_ENCRYPTION_KEY is the only way to read existing PII (good)
--   * Backups of activity_log alone are useless for reconstructing PII — you
--     also need activity_log_pii AND the encryption key (defense in depth)
--
-- This is a one-way door. There is no rollback for "un-drop" short of
-- restoring from backup, but the encrypted companion is the source of truth
-- for these fields now and has been for at least 11 days.

ALTER TABLE public.activity_log
  DROP COLUMN IF EXISTS summary,
  DROP COLUMN IF EXISTS subject,
  DROP COLUMN IF EXISTS body_snippet,
  DROP COLUMN IF EXISTS from_address,
  DROP COLUMN IF EXISTS raw_payload,
  DROP COLUMN IF EXISTS metadata;

-- Sanity check: confirm the drop landed. Fails the migration if any of the
-- columns are still present after the ALTER (should be impossible, but the
-- cost of a belt-and-suspenders check is zero and the cost of a silent no-op
-- here would be enormous — plaintext PII would remain indefinitely under the
-- assumption that it was gone).
DO $$
DECLARE
  remaining text;
BEGIN
  SELECT string_agg(column_name, ', ')
  INTO remaining
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'activity_log'
    AND column_name IN ('summary', 'subject', 'body_snippet', 'from_address', 'raw_payload', 'metadata');

  IF remaining IS NOT NULL THEN
    RAISE EXCEPTION
      'migration 083 post-check failed: plaintext PII columns still present: %',
      remaining;
  END IF;
END $$;
