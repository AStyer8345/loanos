-- ============================================================================
-- LoanOS — Onboard a New Loan Officer (Supabase SQL Editor version)
-- ============================================================================
--
-- BEFORE running this:
--   1. Supabase Dashboard → Authentication → Users → "Add User"
--   2. Enter the new LO's email + temp password (or "Send invite")
--   3. Copy their UUID from the dashboard
--   4. Replace ALL the 'CHANGE_ME' values below
--   5. Run in Supabase SQL Editor
--
-- AFTER running this:
--   1. Login URL: https://loanos-self.vercel.app
--   2. Arive webhook: https://loanos-self.vercel.app/api/arive-webhook/THEIR-SLUG
--   3. They see the onboarding wizard on first login
-- ============================================================================

DO $$
DECLARE
  -- ══════════════════════════════════════════════════════════════════════
  --  FILL THESE IN
  -- ══════════════════════════════════════════════════════════════════════

  -- Copy UUID from Supabase Auth after creating the user
  v_user_id          uuid := 'CHANGE_ME';

  -- LO info
  v_full_name        text := 'Jane Smith';
  v_email            text := 'jane@example.com';
  v_phone            text := '512-555-1234';
  v_nmls_individual  text := '123456';

  -- Company info
  v_company_name     text := 'Jane Smith | Mortgage Solutions LP';
  v_company_nmls     text := '513013';     -- shared company NMLS
  v_slug             text := 'jane-smith'; -- URL slug for webhook routing
  v_brand_color      text := '#C9A84C';    -- hex color for emails/branding

  -- Links (set to NULL if not ready yet)
  v_application_link text := 'https://mslp.my1003app.com/123456/register';
  v_calendly_link    text := NULL;
  v_reply_to_email   text := NULL;

  -- ══════════════════════════════════════════════════════════════════════
  --  DO NOT EDIT BELOW
  -- ══════════════════════════════════════════════════════════════════════
  v_org_id uuid;
BEGIN

  -- 1. Create organization
  INSERT INTO organizations (name, slug, nmls, brand_color, plan)
  VALUES (v_company_name, v_slug, v_company_nmls, v_brand_color, 'starter')
  RETURNING id INTO v_org_id;

  -- 2. Create profile (links auth user → organization)
  INSERT INTO profiles (id, organization_id, role, full_name, email, phone, nmls_individual)
  VALUES (v_user_id, v_org_id, 'owner', v_full_name, v_email, v_phone, v_nmls_individual);

  -- 3. Create org_settings
  INSERT INTO org_settings (organization_id, application_link, calendly_link, custom_email_reply_to)
  VALUES (v_org_id, v_application_link, v_calendly_link, v_reply_to_email);

  RAISE NOTICE '✅ Onboarded: % (org: %, slug: %)', v_full_name, v_org_id, v_slug;
  RAISE NOTICE '   Webhook URL: https://loanos-self.vercel.app/api/arive-webhook/%', v_slug;

END $$;
