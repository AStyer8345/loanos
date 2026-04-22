-- Migration 092: fill RLS coverage gaps for tenant scoping
-- Surfaced by 2026-04-21 tenant scoping audit. Five tables had RLS enabled
-- but no policies referencing get_my_organization_id() — default-deny state.
--
-- Two of those tables are user-facing and need policies:
--   drip_suppressions (org_id)   — drip hold list, queried from drip UI
--   user_settings    (user_id, organization_id) — per-user settings
--
-- The other three (outlook_tokens, resend_webhook_events, workflow_shadow_log)
-- are service-role-only system tables; default-deny is correct, no policy added.

-- drip_suppressions
CREATE POLICY "drip_suppressions_select"
  ON public.drip_suppressions
  FOR SELECT
  USING (org_id = get_my_organization_id());

CREATE POLICY "drip_suppressions_insert"
  ON public.drip_suppressions
  FOR INSERT
  WITH CHECK (org_id = get_my_organization_id());

CREATE POLICY "drip_suppressions_update"
  ON public.drip_suppressions
  FOR UPDATE
  USING (org_id = get_my_organization_id())
  WITH CHECK (org_id = get_my_organization_id());

CREATE POLICY "drip_suppressions_delete"
  ON public.drip_suppressions
  FOR DELETE
  USING (org_id = get_my_organization_id());

-- user_settings: user owns their own row, org must match for writes
CREATE POLICY "user_settings_select_own"
  ON public.user_settings
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "user_settings_insert_own"
  ON public.user_settings
  FOR INSERT
  WITH CHECK (user_id = auth.uid() AND organization_id = get_my_organization_id());

CREATE POLICY "user_settings_update_own"
  ON public.user_settings
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() AND organization_id = get_my_organization_id());

CREATE POLICY "user_settings_delete_own"
  ON public.user_settings
  FOR DELETE
  USING (user_id = auth.uid());
