-- Migration 090 — Pipeline stage aging RPC
--
-- Computes how long each active loan has been sitting in its current stage.
-- Used by /dashboard/analytics to flag stuck loans.
--
-- How it works:
-- For every active loan (excluding funded/closed/inactive statuses), find the
-- most recent row in loan_status_history where new_status matches the loan's
-- current status. That row's changed_at is when the loan entered its current
-- stage. If there's no history row (pre-history loans), fall back to
-- loans.updated_at.
--
-- Security: SECURITY INVOKER — respects the caller's RLS on both loans and
-- loan_status_history. No org scoping needed in SQL; RLS handles it.

CREATE OR REPLACE FUNCTION public.pipeline_stage_aging()
RETURNS TABLE (
  loan_id          uuid,
  loan_name        text,
  borrower_name    text,
  status           text,
  loan_amount      numeric,
  last_changed_at  timestamptz,
  days_in_stage    integer
)
LANGUAGE sql
SECURITY INVOKER
STABLE
AS $$
  SELECT
    l.id AS loan_id,
    COALESCE(
      NULLIF(l.loan_name, ''),
      NULLIF(l.borrower_name, ''),
      NULLIF(TRIM(COALESCE(l.borrower_first_name, '') || ' ' || COALESCE(l.borrower_last_name, '')), '')
    ) AS loan_name,
    COALESCE(
      NULLIF(l.borrower_name, ''),
      NULLIF(TRIM(COALESCE(l.borrower_first_name, '') || ' ' || COALESCE(l.borrower_last_name, '')), '')
    ) AS borrower_name,
    l.status,
    l.loan_amount,
    COALESCE(h.changed_at, l.updated_at) AS last_changed_at,
    GREATEST(
      0,
      EXTRACT(EPOCH FROM (now() - COALESCE(h.changed_at, l.updated_at)))::integer / 86400
    ) AS days_in_stage
  FROM public.loans l
  LEFT JOIN LATERAL (
    SELECT h2.changed_at
    FROM public.loan_status_history h2
    WHERE h2.loan_id = l.id
      AND h2.new_status = l.status
    ORDER BY h2.changed_at DESC
    LIMIT 1
  ) h ON TRUE
  WHERE COALESCE(l.status, '') NOT IN (
    -- Funded / closed family
    'funded', 'Funded', 'Closed', 'closed', 'Closed/Funded', 'LOAN_FUNDED', 'Closed Client',
    -- Inactive family
    'Cancelled', 'canceled', 'Dead', 'Denied', 'Withdrawn', 'Suspended', 'On Hold', 'on_hold'
  );
$$;

COMMENT ON FUNCTION public.pipeline_stage_aging IS
  'Returns one row per active loan with days_in_stage computed from loan_status_history. SECURITY INVOKER so RLS applies.';

GRANT EXECUTE ON FUNCTION public.pipeline_stage_aging() TO authenticated;
