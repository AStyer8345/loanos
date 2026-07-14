-- Keep Commission Paid loans out of active/stalled pipeline reporting.
-- The function remains SECURITY INVOKER so tenant RLS applies.

create or replace function public.pipeline_stage_aging()
returns table (
  loan_id uuid,
  loan_name text,
  borrower_name text,
  status text,
  loan_amount numeric,
  last_changed_at timestamptz,
  days_in_stage integer
)
language sql
security invoker
stable
set search_path = ''
as $$
  select
    l.id as loan_id,
    coalesce(
      nullif(l.loan_name, ''),
      nullif(l.borrower_name, ''),
      nullif(trim(coalesce(l.borrower_first_name, '') || ' ' || coalesce(l.borrower_last_name, '')), '')
    ) as loan_name,
    coalesce(
      nullif(l.borrower_name, ''),
      nullif(trim(coalesce(l.borrower_first_name, '') || ' ' || coalesce(l.borrower_last_name, '')), '')
    ) as borrower_name,
    l.status,
    l.loan_amount,
    coalesce(h.changed_at, l.updated_at) as last_changed_at,
    greatest(
      0,
      extract(epoch from (now() - coalesce(h.changed_at, l.updated_at)))::integer / 86400
    ) as days_in_stage
  from public.loans l
  left join lateral (
    select h2.changed_at
    from public.loan_status_history h2
    where h2.loan_id = l.id
      and h2.new_status = l.status
    order by h2.changed_at desc
    limit 1
  ) h on true
  where coalesce(l.status, '') not in (
    'funded', 'Funded', 'Closed', 'closed', 'Closed/Funded', 'LOAN_FUNDED', 'Closed Client',
    'Commission Paid', 'commission paid', 'COMMISSION_PAID',
    'Cancelled', 'canceled', 'Dead', 'Denied', 'Withdrawn', 'Suspended', 'On Hold', 'on_hold'
  );
$$;

comment on function public.pipeline_stage_aging is
  'Returns active loans with days in stage; excludes funded, closed, Commission Paid, and inactive statuses. SECURITY INVOKER so RLS applies.';

grant execute on function public.pipeline_stage_aging() to authenticated;
