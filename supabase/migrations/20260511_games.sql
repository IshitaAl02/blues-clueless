-- Two-player games inside chat conversations.
-- A 'game' message in messages.kind references a chat_games row via game_id.

create table if not exists public.chat_games (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  kind            text not null,                  -- 'tic_tac_toe' | 'rps' | 'connect_four'
  players         uuid[] not null,                -- [host_id, opponent_id]
  turn            uuid,                           -- whose move it is (null while pending/over)
  state           jsonb not null default '{}'::jsonb,
  status          text not null default 'pending',-- pending|active|won|draw|declined|abandoned
  winner_id       uuid,
  created_by      uuid not null references auth.users(id) on delete cascade,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists chat_games_conv_idx on public.chat_games(conversation_id);

alter table public.chat_games enable row level security;

drop policy if exists "games_select_players" on public.chat_games;
create policy "games_select_players" on public.chat_games
  for select using (auth.uid() = any(players));

drop policy if exists "games_insert_self" on public.chat_games;
create policy "games_insert_self" on public.chat_games
  for insert with check (auth.uid() = created_by and auth.uid() = any(players));

drop policy if exists "games_update_players" on public.chat_games;
create policy "games_update_players" on public.chat_games
  for update using (auth.uid() = any(players)) with check (auth.uid() = any(players));

alter table public.messages
  add column if not exists game_id uuid references public.chat_games(id) on delete set null;

-- Add chat_games to the realtime publication (ignore if already added).
do $$
begin
  perform 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'chat_games';
  if not found then
    execute 'alter publication supabase_realtime add table public.chat_games';
  end if;
end $$;
