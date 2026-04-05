-- Migration 077: Atomic view_count increment for scenarios share links
--
-- The public share endpoint (/api/share/[token]) previously did a
-- read-then-write to bump view_count:
--
--     data.view_count = X
--     update(view_count = X + 1)
--
-- Under concurrent loads, multiple requests read the same X and all write X+1,
-- silently losing writes. Replace with a single atomic UPDATE via RPC.
--
-- SECURITY DEFINER so the anon/service client can call it without direct table
-- write privileges from the token path. The function is scoped to a single
-- share_token lookup — it cannot be used to bump counts on arbitrary rows.

CREATE OR REPLACE FUNCTION public.increment_scenario_view_count(p_share_token uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.scenarios
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE share_token = p_share_token;
$$;

REVOKE ALL ON FUNCTION public.increment_scenario_view_count(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.increment_scenario_view_count(uuid) TO anon, authenticated, service_role;
