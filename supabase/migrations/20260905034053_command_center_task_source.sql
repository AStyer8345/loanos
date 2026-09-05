BEGIN;
ALTER TABLE public.todo_items DROP CONSTRAINT todo_items_source_check;
ALTER TABLE public.todo_items ADD CONSTRAINT todo_items_source_check CHECK(source IN ('manual','follow_up_rule','automation','ai_suggestion','import','website_assistant','inquiry','document_review'));
CREATE UNIQUE INDEX todo_items_inquiry_source_key_idx ON public.todo_items(organization_id,source_key) WHERE source='inquiry' AND source_key IS NOT NULL;
COMMIT;
