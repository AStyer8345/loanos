-- Migration 085: Fix enrich_activity_log_contact() trigger after column drop
--
-- Migration 083 dropped from_address/to_address columns from activity_log.
-- The enrich_activity_log_contact() trigger still referenced NEW.from_address
-- and NEW.to_address, causing ALL activity_log INSERTs to fail with:
--   "record new has no field from_address"
--
-- Additionally, the guard clause `NEW.type NOT IN ('email_inbound', ...)`
-- had a NULL logic bug: when type IS NULL, `NULL NOT IN (...)` returns NULL
-- (not TRUE), so the guard failed open for non-email rows.
--
-- Fix: Replace the function body with a no-op RETURN NEW. Email-based
-- contact enrichment at insert time is obsolete now that email addresses
-- live in the encrypted PII companion table, not in activity_log itself.
--
-- Applied to live Supabase: 2026-04-12 ~17:00 UTC
-- Blast radius: every /api/activity POST since migration 083 (~02:30 UTC)

CREATE OR REPLACE FUNCTION public.enrich_activity_log_contact()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN NEW;
END;
$function$;
