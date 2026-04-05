-- Migration 078: webhook_deliveries idempotency table
--
-- Prevents duplicate processing of retried webhook deliveries. Zapier (and
-- other upstream sources) can retry on network blips, 502s, or parallel
-- flight — without dedupe we get duplicate activity_log rows, wasted party
-- contact upserts, and potential race conditions on the same loan.
--
-- Strategy:
--   1. Compute an idempotency key per incoming request (header-preferred,
--      hash-fallback in the route handler).
--   2. INSERT the delivery row before processing. Unique violation ⇒ this
--      is a duplicate, return 200 {deduped: true} without re-processing.
--   3. After successful processing, UPDATE the row with the resolved loan_id
--      so we can trace deliveries back to their outcomes.
--
-- Retention: rows are kept indefinitely for audit. A future cron can prune
-- rows older than 90 days if table bloat becomes an issue.

CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  source text NOT NULL,
  idempotency_key text NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  loan_id uuid REFERENCES public.loans(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'received',
  error text,
  CONSTRAINT webhook_deliveries_unique_delivery
    UNIQUE (organization_id, source, idempotency_key)
);

CREATE INDEX IF NOT EXISTS webhook_deliveries_org_received_idx
  ON public.webhook_deliveries (organization_id, received_at DESC);

CREATE INDEX IF NOT EXISTS webhook_deliveries_loan_idx
  ON public.webhook_deliveries (loan_id)
  WHERE loan_id IS NOT NULL;

-- RLS: service role only. Webhook routes use service client; no user-facing
-- UI reads this table yet. Future admin UI can add a scoped policy.
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY webhook_deliveries_deny_all
  ON public.webhook_deliveries
  FOR ALL
  USING (false)
  WITH CHECK (false);

COMMENT ON TABLE public.webhook_deliveries IS
  'Idempotency + audit trail for incoming webhook deliveries. Unique on (org, source, idempotency_key) prevents duplicate processing of retried deliveries.';
