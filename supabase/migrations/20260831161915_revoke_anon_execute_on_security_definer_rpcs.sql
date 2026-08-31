-- Revoke EXECUTE from anon + authenticated on SECURITY DEFINER functions that
-- reach customer data. SECURITY DEFINER runs as the function owner, so these
-- bypass RLS entirely: the tables themselves correctly return [] to the
-- publishable anon key, while these RPCs hand back the same rows.
--
-- Verified live against production with the publishable anon key on 2026-08-31:
--   morning_briefing_pipeline('2026-08-31') -> HTTP 200, 22,413 bytes:
--     every active loan with borrower name, property address, stage, est.
--     close date, loan amount, realtor name, plus pipeline totals.
--   find_duplicate_contacts('<org uuid>')   -> HTTP 200: 22 groups for Adam's
--     org AND 19 groups / 39 contact records for Scott's pilot org -- the
--     org id is a parameter, so this crosses the tenant boundary.
--   find_contact_by_email('<real email>')   -> HTTP 200, 1 row: id, name,
--     email, organization_id, loan_id, loan_status.
--   fill_contact_blanks(...) is anon-EXECUTABLE and WRITES contact PII; the
--     privilege was confirmed via has_function_privilege, not by calling it.
--   Controls: /rest/v1/loans and /rest/v1/contacts both return [] to anon.
--
-- Every caller in the codebase and in n8n uses the service_role key, which is
-- unaffected:
--   find_duplicate_contacts   -> src/app/api/contacts/duplicates/route.ts (createServiceClient)
--   get_due_drip_enrollments  -> src/app/api/drip/run/route.ts            (createServiceClient)
--   morning_briefing_pipeline -> n8n "LoanOS - Morning Briefing Team" (24oewjzGR3AxH4QW,
--                                inactive) via an inline service_role JWT
--   find_contact_by_email / fill_contact_blanks -> no caller anywhere; the
--     latter reaches its rows through the tg_loans_fill_contact_blanks
--     trigger, which fires as the table owner regardless of EXECUTE grants.
--
-- The trigger functions below cannot do useful work when invoked over
-- PostgREST, but they are SECURITY DEFINER and anon-executable, so they are
-- closed for the same reason.
--
-- NOT revoked, deliberately:
--   get_my_organization_id() / get_my_role() -- referenced by 123 and 23 RLS
--     policies respectively; policies evaluate as the calling role, so
--     authenticated must keep EXECUTE or every policy using them breaks.
--   increment_scenario_view_count(uuid) -- borrower share pages are public by
--     design and it writes nothing but a view counter.
--
-- NOTE: this migration alone does NOT close the hole. See the companion
-- migration 20260831162020_revoke_public_execute_on_security_definer_rpcs.sql:
-- PostgreSQL also grants EXECUTE to PUBLIC by default, and anon inherits it.

-- Reach customer data or write it.
revoke execute on function public.morning_briefing_pipeline(date) from anon, authenticated;
revoke execute on function public.find_contact_by_email(text) from anon, authenticated;
revoke execute on function public.find_duplicate_contacts(uuid) from anon, authenticated;
revoke execute on function public.get_due_drip_enrollments() from anon, authenticated;
revoke execute on function public.fill_contact_blanks(uuid, text, text, date, text, text, text, text, date) from anon, authenticated;

-- Trigger functions: fired by triggers as the table owner, never called directly.
revoke execute on function public.auto_cancel_drip_on_stage_change() from anon, authenticated;
revoke execute on function public.enrich_activity_log_contact() from anon, authenticated;
revoke execute on function public.fill_contact_from_loan_sync() from anon, authenticated;
revoke execute on function public.fn_update_contact_last_touch_at() from anon, authenticated;
revoke execute on function public.loans_autocreate_compensation() from anon, authenticated;
revoke execute on function public.notify_n8n_contract_received() from anon, authenticated;
revoke execute on function public.notify_n8n_realtor_referral_ack() from anon, authenticated;
revoke execute on function public.propagate_loan_update_to_contact_last_touch() from anon, authenticated;
revoke execute on function public.tg_loans_fill_contact_blanks() from anon, authenticated;
