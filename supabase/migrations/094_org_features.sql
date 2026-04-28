-- Migration 094: per-org feature flags
--
-- Adds a `features` jsonb column to `organizations` that controls which UI
-- surfaces render for that org. Default is "everything on" (NULL or missing
-- key = enabled), so existing orgs (Adam) keep full UX without a seed row.
-- Scott Sears's org is locked down to the three-pillar core + Loans (MISMO).
--
-- This is a UX/clarity gate only — RLS already prevents data leaks across
-- tenants (audit 2026-04-21, 0 leaks across 37 tables). Hiding UI just
-- prevents Scott from seeing surfaces that don't apply to him.

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS features jsonb;

COMMENT ON COLUMN public.organizations.features IS
  'Per-org UI feature flags. NULL or missing key = enabled (default-on). '
  'Keys: drip_campaigns, email_intelligence, rate_watch, marketing, '
  'social_media, lender_knowledge, analytics, scenarios, automations. '
  'contacts/pipeline/loans/settings are core and not gated.';

-- Seed Scott Sears's org with locked-down flags. Adam's org gets no row;
-- absence of features = all enabled.
UPDATE public.organizations
SET features = jsonb_build_object(
  'drip_campaigns',     false,
  'email_intelligence', false,
  'rate_watch',         false,
  'marketing',          false,
  'social_media',       false,
  'lender_knowledge',   false,
  'analytics',          false,
  'scenarios',          false,
  'automations',        false
)
WHERE id = '40377391-6b4c-4d1a-81d2-ffd743876f0b';
