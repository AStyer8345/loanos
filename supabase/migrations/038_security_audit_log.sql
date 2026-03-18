-- Migration 038: Security audit log for FTC Safeguards compliance
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  actor_id UUID REFERENCES auth.users(id),
  actor_email TEXT,
  ip_address TEXT,
  resource TEXT,
  resource_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Users can read their own audit events only
CREATE POLICY "security_audit_log_select" ON public.security_audit_log
  FOR SELECT USING (auth.uid() = actor_id);

-- No client INSERT/UPDATE/DELETE — all writes via service role in API routes
