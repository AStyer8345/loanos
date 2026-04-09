-- 082_social_outlook_rls.sql
-- Enable RLS on social tables and outlook_tokens.
-- Fixes audit finding: these tables had no RLS, allowing cross-tenant
-- reads/writes when using the browser Supabase client.

-- ============================================================================
-- social_drafts — org-scoped CRUD
-- ============================================================================
ALTER TABLE public.social_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members read social_drafts" ON public.social_drafts
  FOR SELECT USING (organization_id = get_my_organization_id());

CREATE POLICY "Org members insert social_drafts" ON public.social_drafts
  FOR INSERT WITH CHECK (organization_id = get_my_organization_id());

CREATE POLICY "Org members update social_drafts" ON public.social_drafts
  FOR UPDATE USING (organization_id = get_my_organization_id())
  WITH CHECK (organization_id = get_my_organization_id());

CREATE POLICY "Org members delete social_drafts" ON public.social_drafts
  FOR DELETE USING (organization_id = get_my_organization_id());

-- ============================================================================
-- social_activity — org-scoped read + insert
-- ============================================================================
ALTER TABLE public.social_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members read social_activity" ON public.social_activity
  FOR SELECT USING (organization_id = get_my_organization_id());

CREATE POLICY "Org members insert social_activity" ON public.social_activity
  FOR INSERT WITH CHECK (organization_id = get_my_organization_id());

-- ============================================================================
-- social_settings — org-scoped CRUD
-- ============================================================================
ALTER TABLE public.social_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members read social_settings" ON public.social_settings
  FOR SELECT USING (organization_id = get_my_organization_id());

CREATE POLICY "Org members insert social_settings" ON public.social_settings
  FOR INSERT WITH CHECK (organization_id = get_my_organization_id());

CREATE POLICY "Org members update social_settings" ON public.social_settings
  FOR UPDATE USING (organization_id = get_my_organization_id())
  WITH CHECK (organization_id = get_my_organization_id());

-- ============================================================================
-- outlook_tokens — no user_id or organization_id column exists.
-- Enable RLS with deny-all to block browser-client access.
-- Service role (used by API routes) bypasses RLS.
-- TODO: Add user_id/organization_id column before adding scoped policies.
-- ============================================================================
ALTER TABLE public.outlook_tokens ENABLE ROW LEVEL SECURITY;
