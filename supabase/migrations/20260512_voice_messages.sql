alter table public.messages
  add column if not exists audio_url text,
  add column if not exists audio_duration_ms int,
  add column if not exists audio_peaks jsonb;
