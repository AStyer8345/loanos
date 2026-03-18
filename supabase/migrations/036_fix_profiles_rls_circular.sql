-- Migration 036: Fix circular RLS on profiles table
-- The original "Users can read profiles in their org" policy contained a subquery
-- against the same profiles table, causing infinite recursion → profile queries
-- returned nothing → middleware redirected all users to /onboarding.
--
-- Fix: replace the circular subquery with get_my_organization_id(), a SECURITY
-- DEFINER function that reads profiles bypassing RLS, breaking the recursion.

DROP POLICY "Users can read profiles in their org" ON profiles;

CREATE POLICY "Users can read profiles in their org"
ON profiles FOR SELECT
USING (organization_id = get_my_organization_id());
