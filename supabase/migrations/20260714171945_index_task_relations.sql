create index if not exists todo_items_related_contact_id_idx
  on public.todo_items (related_contact_id)
  where related_contact_id is not null;

create index if not exists todo_items_related_loan_id_idx
  on public.todo_items (related_loan_id)
  where related_loan_id is not null;
