-- Widen loans.back_end_dti / front_end_dti from numeric(8,5) to numeric(10,5).
--
-- ALREADY APPLIED TO PRODUCTION on 2026-08-21 via apply_migration. The file is
-- named for the version Supabase recorded (20260821154755) so `supabase db
-- push` treats it as applied rather than re-running the ALTER. It was written
-- that day but never committed, so for nine days the production schema carried
-- a change with no record in git; re-verified live 2026-08-30 (both columns
-- numeric(10,5), largest stored DTI 53.25).
--
-- numeric(8,5) leaves only 3 integer digits (max 999.99999). Arive computes a
-- DTI ratio against monthly income, so any file keyed before income is entered
-- emits a garbage ratio that exceeds the column. Postgres raises 22003
-- (numeric field overflow) and the whole loan INSERT is rejected, so the row
-- never lands at all -- the failure is not a null DTI, it is a missing loan.
--
-- Observed: n8n execution 51478 (2026-08-20T21:00:53Z, workflow
-- 1tagvoU0UXtdDiMY, node "Upsert Loan"). Arive sent backEndDTI = 4666.4 for
-- arive_loan_id 17493732. Every other numeric field in that 164-field payload
-- fits its column -- this one value dropped a $300,000 loan carrying
-- $16,038.95 of gross revenue.
--
-- Widening is a pure capacity increase: the largest DTI in the table today is
-- 51.7, so no stored value changes and no row is near either ceiling. There
-- are no views, indexes, or constraints depending on these two columns, and
-- the generated TypeScript type (number | null) is identical either way.
--
-- This does not stop Arive emitting a nonsense ratio -- it stops that ratio
-- destroying the loan record. Clamping an out-of-range DTI to null on write
-- is the companion fix and is deliberately not included here: the n8n
-- "Upsert Loan" node is a live production intake path and that edit is Adam's
-- call. Backfilling the one lost row is likewise queued for him.
--
-- Rollback (safe only while no stored value exceeds 999.99999):
--   alter table public.loans
--     alter column back_end_dti  type numeric(8,5),
--     alter column front_end_dti type numeric(8,5);

alter table public.loans
  alter column back_end_dti  type numeric(10,5),
  alter column front_end_dti type numeric(10,5);
