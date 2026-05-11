alter table public.library_prefs
  add column if not exists chat_bg text,
  add column if not exists chat_image text;
