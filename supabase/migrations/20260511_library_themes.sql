-- Library themes follow-up: per-card "explicit color" flag + theme defaults on prefs.

alter table public.library_cards
  add column if not exists custom_colors boolean not null default false;

alter table public.library_prefs
  add column if not exists card_bg text,
  add column if not exists card_text text,
  add column if not exists theme_key text;
