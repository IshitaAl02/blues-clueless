alter table public.library_prefs
  add column if not exists chat_chrome text;
