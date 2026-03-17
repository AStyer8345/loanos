-- ============================================================
-- Migration 029: Multi-tenancy — organizations + profiles
-- Idempotent: all creates use IF NOT EXISTS
-- ============================================================

-- ─────────────────────────────────────────────────
-- ORGANIZATIONS
-- ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS organizations (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  slug       TEXT        UNIQUE,          -- used for subdomain routing
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- NOTE: organizations RLS policy is added AFTER profiles table is created (below)
-- to avoid forward reference error.

-- ─────────────────────────────────────────────────
-- PROFILES (linked 1-to-1 with auth.users)
-- ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id              UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID        REFERENCES organizations(id) ON DELETE CASCADE,
  role            TEXT        NOT NULL DEFAULT 'member'
                              CHECK (role IN ('owner', 'admin', 'member')),
  full_name       TEXT,
  email           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS profiles_organization_id_idx ON profiles(organization_id);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- SELECT: users can read profiles within their own org
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can read profiles in their org'
  ) THEN
    CREATE POLICY "Users can read profiles in their org"
      ON profiles FOR SELECT
      USING (
        organization_id IN (
          SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
      );
  END IF;
END $$;

-- UPDATE: users can only update their own profile row
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update their own profile'
  ) THEN
    CREATE POLICY "Users can update their own profile"
      ON profiles FOR UPDATE
      USING (id = auth.uid())
      WITH CHECK (id = auth.uid());
  END IF;
END $$;

-- INSERT: allow new profile creation (needed for sign-up flows)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can insert their own profile'
  ) THEN
    CREATE POLICY "Users can insert their own profile"
      ON profiles FOR INSERT
      WITH CHECK (id = auth.uid());
  END IF;
END $$;

-- ─────────────────────────────────────────────────
-- HELPER FUNCTIONS (SECURITY DEFINER to avoid RLS recursion)
-- These are used by downstream RLS policies on other tables.
-- Must be created before policies that reference them.
-- ─────────────────────────────────────────────────

-- Returns the current user's organization_id
CREATE OR REPLACE FUNCTION get_my_organization_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid()
$$;

-- Returns the current user's role within their organization
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$;

-- ─────────────────────────────────────────────────
-- ORGANIZATIONS RLS (now that profiles + helpers exist)
-- ─────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'organizations' AND policyname = 'Org members can read their organization'
  ) THEN
    CREATE POLICY "Org members can read their organization"
      ON organizations FOR SELECT
      USING (
        id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
      );
  END IF;
END $$;
