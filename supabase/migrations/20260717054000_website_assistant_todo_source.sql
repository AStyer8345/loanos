-- The website assistant records follow-up tasks with source 'website_assistant'
-- (20260715130000_website_assistant_foundation.sql scopes its dedup index to
-- that value), but 20260714161207_durable_task_followups.sql enumerated task
-- sources without it. In databases carrying that strict check, every website
-- lead failed at follow-up task creation. Widen the check to include the
-- website assistant.
alter table public.todo_items
  drop constraint if exists todo_items_source_check;
alter table public.todo_items
  add constraint todo_items_source_check
    check (source in ('manual', 'follow_up_rule', 'automation', 'ai_suggestion', 'import', 'website_assistant'));
