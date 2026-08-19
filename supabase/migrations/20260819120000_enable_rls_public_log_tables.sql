-- Enable RLS on three public log tables that had it disabled.
--
-- With RLS off and the default anon/authenticated grants in place, the
-- publishable anon key -- which ships in client-side code -- could read,
-- update, delete and truncate all three. Verified against the live project:
-- anon returned 137/137 rancho_chat_logs, 23/23 n8n_run_logs and all
-- ai_node_logs rows, while activity_log and contacts correctly returned none.
--
-- ai_node_logs is the sharpest of the three: every row is the inbound-email
-- classifier's input_preview plus the model's output, i.e. a plaintext copy of
-- the same message content activity_log_pii encrypts (migration 083).
--
-- No policies are added. Every writer is an n8n node authenticating with an
-- inline service_role JWT, which bypasses RLS; no application code reads or
-- writes these tables. Denying anon and authenticated outright is therefore
-- the whole fix.
--
-- Rollback: alter table <t> disable row level security;

alter table public.rancho_chat_logs enable row level security;
alter table public.n8n_run_logs     enable row level security;
alter table public.ai_node_logs     enable row level security;
