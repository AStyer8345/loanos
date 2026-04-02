-- ============================================================================
-- LoanOS — Onboard a New Loan Officer
-- ============================================================================
--
-- BEFORE running this script:
--   1. Go to Supabase Dashboard → Authentication → Users → "Add User"
--   2. Enter the new LO's email + a temp password (or use "Send invite")
--   3. Copy the new user's UUID from the dashboard
--   4. Fill in the placeholders below and run this script
--
-- AFTER running this script:
--   1. Give the LO their login URL: https://loanos-self.vercel.app
--   2. Their Arive webhook URL is: https://loanos-self.vercel.app/api/arive-webhook/{SLUG}
--   3. They'll see the onboarding wizard on first login
-- ============================================================================

-- ┌─────────────────────────────────────────────────────────────────────────┐
-- │  FILL THESE IN                                                         │
-- └─────────────────────────────────────────────────────────────────────────┘

-- Copy the UUID from Supabase Auth dashboard after creating the user
\set new_user_id     '''PUT-AUTH-USER-UUID-HERE'''

-- LO's info
\set lo_full_name    '''Jane Smith'''
\set lo_email        '''jane@example.com'''
\set lo_phone        '''512-555-1234'''
\set lo_nmls         '''123456'''

-- Company info
\set company_name    '''Jane Smith | Mortgage Solutions LP'''
\set company_nmls    '''513013'''
\set slug            '''jane-smith'''
\set brand_color     '''#C9A84C'''

-- Links (set to NULL if not available yet)
\set application_link '''https://mslp.my1003app.com/123456/register'''
\set calendly_link    NULL
\set reply_to_email   NULL

-- ┌─────────────────────────────────────────────────────────────────────────┐
-- │  DO NOT EDIT BELOW THIS LINE                                           │
-- └─────────────────────────────────────────────────────────────────────────┘

BEGIN;

-- 1. Create the organization
INSERT INTO organizations (name, slug, nmls, brand_color, plan)
VALUES (:company_name, :slug, :company_nmls, :brand_color, 'starter')
RETURNING id AS new_org_id \gset

-- 2. Create the profile (links auth user → organization)
INSERT INTO profiles (id, organization_id, role, full_name, email, phone, nmls_individual)
VALUES (:new_user_id::uuid, :'new_org_id', 'owner', :lo_full_name, :lo_email, :lo_phone, :lo_nmls);

-- 3. Create org_settings
INSERT INTO org_settings (organization_id, application_link, calendly_link, custom_email_reply_to)
VALUES (:'new_org_id', :application_link, :calendly_link, :reply_to_email);

COMMIT;

-- 4. Verify everything was created correctly
SELECT 'Organization' AS what, o.id::text, o.name, o.slug
FROM organizations o WHERE o.id = :'new_org_id'
UNION ALL
SELECT 'Profile', p.id::text, p.full_name, p.role
FROM profiles p WHERE p.id = :new_user_id::uuid
UNION ALL
SELECT 'Settings', s.id::text, s.application_link, s.calendly_link
FROM org_settings s WHERE s.organization_id = :'new_org_id';
