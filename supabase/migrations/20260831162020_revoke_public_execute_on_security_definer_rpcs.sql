-- Completes revoke_anon_execute_on_security_definer_rpcs, which did not close
-- the hole: it removed the explicit anon/authenticated grants, but PostgreSQL
-- grants EXECUTE on every new function to PUBLIC by default (the leading
-- "=X/postgres" ACL entry), and anon inherits from PUBLIC. Verified after that
-- migration: proacl was {=X/postgres,postgres=X/postgres,service_role=X/postgres}
-- and has_function_privilege('anon', ...) was still true.
--
-- Revoking from PUBLIC leaves the explicit postgres and service_role grants in
-- place, which is every real caller (see the previous migration for the
-- caller-by-caller trace).
--
-- The trigger functions are safe to close: verified by experiment on a
-- throwaway schema, an INSERT as `authenticated` still fired a BEFORE trigger
-- whose function that role had no EXECUTE privilege on. PostgreSQL checks
-- EXECUTE at CREATE TRIGGER, not on each fire.

revoke execute on function public.morning_briefing_pipeline(date) from public;
revoke execute on function public.find_contact_by_email(text) from public;
revoke execute on function public.find_duplicate_contacts(uuid) from public;
revoke execute on function public.get_due_drip_enrollments() from public;
revoke execute on function public.fill_contact_blanks(uuid, text, text, date, text, text, text, text, date) from public;

revoke execute on function public.auto_cancel_drip_on_stage_change() from public;
revoke execute on function public.enrich_activity_log_contact() from public;
revoke execute on function public.fill_contact_from_loan_sync() from public;
revoke execute on function public.fn_update_contact_last_touch_at() from public;
revoke execute on function public.loans_autocreate_compensation() from public;
revoke execute on function public.notify_n8n_contract_received() from public;
revoke execute on function public.notify_n8n_realtor_referral_ack() from public;
revoke execute on function public.propagate_loan_update_to_contact_last_touch() from public;
revoke execute on function public.tg_loans_fill_contact_blanks() from public;

-- The explicit service_role grant already exists on all fourteen; restate it so
-- the intent survives a future function replacement.
grant execute on function public.morning_briefing_pipeline(date) to service_role;
grant execute on function public.find_contact_by_email(text) to service_role;
grant execute on function public.find_duplicate_contacts(uuid) to service_role;
grant execute on function public.get_due_drip_enrollments() to service_role;
grant execute on function public.fill_contact_blanks(uuid, text, text, date, text, text, text, text, date) to service_role;
