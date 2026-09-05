-- Existing loan triggers reference public tables without schema qualification.
-- This invoker RPC has no privilege escalation; constrain its path to trusted public objects.
ALTER FUNCTION public.reconcile_arive_facts(jsonb) SET search_path=public,pg_temp;
