-- Migration 059: Create system_admins table for Tenant Admin Dashboard
-- NO RLS on this table — only service role reads it
-- If you accidentally enable RLS without policies, Adam gets locked out

CREATE TABLE system_admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Seed Adam's account
INSERT INTO system_admins (user_id, email)
SELECT id, email FROM auth.users WHERE email = 'adam@thestyerteam.com'
ON CONFLICT DO NOTHING;
