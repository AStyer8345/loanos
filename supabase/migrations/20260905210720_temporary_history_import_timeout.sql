alter function public.import_jungo_history_once(jsonb,boolean) set statement_timeout='45s';
notify pgrst,'reload schema';
