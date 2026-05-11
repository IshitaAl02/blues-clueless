-- Dev Library: per-user private + shared (global) cards

create table if not exists public.library_sections (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  name text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.library_cards (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.library_sections(id) on delete cascade,
  owner_id uuid references auth.users(id) on delete cascade,
  created_by uuid references auth.users(id),
  kind text not null check (kind in ('endpoint','form_key','report','guide','link')),
  data jsonb not null default '{}'::jsonb,
  bg_color text not null default '#ffffff',
  text_color text not null default '#093C5D',
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.library_prefs (
  user_id uuid primary key references auth.users(id) on delete cascade,
  page_bg text,
  updated_at timestamptz not null default now()
);

create index if not exists library_sections_owner_idx on public.library_sections (owner_id, position);
create index if not exists library_cards_section_idx on public.library_cards (section_id, position);

alter table public.library_sections enable row level security;
alter table public.library_cards enable row level security;
alter table public.library_prefs enable row level security;

-- library_sections policies
drop policy if exists "sections_select" on public.library_sections;
create policy "sections_select" on public.library_sections
  for select using (owner_id is null or owner_id = auth.uid());

drop policy if exists "sections_insert_private" on public.library_sections;
create policy "sections_insert_private" on public.library_sections
  for insert with check (owner_id = auth.uid());

drop policy if exists "sections_insert_shared" on public.library_sections;
create policy "sections_insert_shared" on public.library_sections
  for insert with check (owner_id is null and auth.uid() is not null);

drop policy if exists "sections_update_private" on public.library_sections;
create policy "sections_update_private" on public.library_sections
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "sections_update_shared" on public.library_sections;
create policy "sections_update_shared" on public.library_sections
  for update using (owner_id is null and auth.uid() is not null)
  with check (owner_id is null);

drop policy if exists "sections_delete_private" on public.library_sections;
create policy "sections_delete_private" on public.library_sections
  for delete using (owner_id = auth.uid());

drop policy if exists "sections_delete_shared" on public.library_sections;
create policy "sections_delete_shared" on public.library_sections
  for delete using (owner_id is null and auth.uid() is not null);

-- library_cards policies (mirror sections)
drop policy if exists "cards_select" on public.library_cards;
create policy "cards_select" on public.library_cards
  for select using (owner_id is null or owner_id = auth.uid());

drop policy if exists "cards_insert_private" on public.library_cards;
create policy "cards_insert_private" on public.library_cards
  for insert with check (owner_id = auth.uid() and created_by = auth.uid());

drop policy if exists "cards_insert_shared" on public.library_cards;
create policy "cards_insert_shared" on public.library_cards
  for insert with check (owner_id is null and created_by = auth.uid());

drop policy if exists "cards_update_private" on public.library_cards;
create policy "cards_update_private" on public.library_cards
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "cards_update_shared" on public.library_cards;
create policy "cards_update_shared" on public.library_cards
  for update using (owner_id is null and auth.uid() is not null)
  with check (owner_id is null);

drop policy if exists "cards_delete_private" on public.library_cards;
create policy "cards_delete_private" on public.library_cards
  for delete using (owner_id = auth.uid());

drop policy if exists "cards_delete_shared" on public.library_cards;
create policy "cards_delete_shared" on public.library_cards
  for delete using (owner_id is null and auth.uid() is not null);

-- library_prefs policies
drop policy if exists "prefs_select_own" on public.library_prefs;
create policy "prefs_select_own" on public.library_prefs
  for select using (user_id = auth.uid());

drop policy if exists "prefs_upsert_own" on public.library_prefs;
create policy "prefs_upsert_own" on public.library_prefs
  for insert with check (user_id = auth.uid());

drop policy if exists "prefs_update_own" on public.library_prefs;
create policy "prefs_update_own" on public.library_prefs
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
