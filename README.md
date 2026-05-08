# Blue's Clueless 🐾

> *"We have no idea either."*

A tiny, ephemeral group chat for a small crew. One shared room. Messages live only while you're connected — no chat history, no storage. Profiles persist so your friends recognize you when you come back.

## Stack

- **Next.js 14** (App Router, TypeScript) — deploys clean to Vercel
- **Supabase** — auth (no email needed — see below) + realtime broadcast + a tiny `profiles` table
- **Tailwind CSS** — custom palette (`#093C5D`, `#3B7597`, `#6FD1D7`, `#5DF8D8`) with cartoon SVGs
- **DiceBear** — auto-generated cartoon avatars (one per username, deterministic)
- **emoji-picker-react**, **@giphy/react-components** — emojis & GIFs

## Auth (username + password + secret key)

There's no email field. To sign up, friends need a **secret key** (`8090` by default — change it in [`lib/auth.ts`](lib/auth.ts) before you share the link).

- **Sign up**: pick a username, a password, enter the secret key. Done.
- **Log in**: just username + password.

Under the hood, Supabase still requires an email per account, so we synthesize one from the username (e.g. `ishiish@bluesclueless.chat`). Users never see or type it. Make sure email confirmation is **off** in Supabase (Authentication → Providers → Email → uncheck "Confirm email") so signups complete instantly without an inbox.

## How "ephemeral" works

Messages are sent over a Supabase Realtime **broadcast** channel — they hit other connected clients and are kept in each client's memory only. Nothing is written to the database. Refresh = empty chat. New joiners only see messages sent after they joined. Images are resized client-side and broadcast as base64 (no storage bucket touched).

The only persisted data is the `profiles` row (id + username) so we can show your name when you log back in.

---

## Setup

### 1. Install deps

```bash
cd blues-clueless
npm install
```

### 2. Create a Supabase project

1. Go to <https://supabase.com> → New Project.
2. In **Project Settings → API**, copy the **Project URL** and **anon public key**.
3. In **Authentication → Providers → Email**, **disable "Confirm email"** (required — otherwise signups will hang waiting for an email confirmation that nobody can click).

### 3. Run this SQL in the Supabase SQL Editor

```sql
-- Profile table: just the things we need to display you in chat.
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  username text unique not null check (char_length(username) between 2 and 20),
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

-- Anyone signed in can read profiles (so we can display usernames).
create policy "profiles are readable by authenticated"
  on public.profiles for select
  to authenticated using (true);

-- A user can insert/update their own profile row.
create policy "users manage their own profile"
  on public.profiles for insert
  to authenticated with check (auth.uid() = id);

create policy "users update their own profile"
  on public.profiles for update
  to authenticated using (auth.uid() = id);

-- Auto-create profile on signup using the username from auth metadata.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ====== Conversations + members (groups & DMs) ======

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('dm','group')),
  name text,
  created_by uuid references auth.users on delete set null,
  created_at timestamptz default now()
);

create table if not exists public.conversation_members (
  conversation_id uuid references public.conversations on delete cascade,
  user_id uuid references auth.users on delete cascade,
  joined_at timestamptz default now(),
  primary key (conversation_id, user_id)
);

alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;

-- Helper to avoid recursive RLS — checks membership with elevated privileges
create or replace function public.is_member(conv_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.conversation_members
                 where conversation_id = conv_id and user_id = auth.uid())
$$;

-- Members can read conversations they belong to
drop policy if exists "members read their conversations" on public.conversations;
create policy "members read their conversations"
  on public.conversations for select to authenticated
  using (public.is_member(id));

-- Anyone authenticated can create a conversation (they'll add themselves as creator)
drop policy if exists "auth users create conversations" on public.conversations;
create policy "auth users create conversations"
  on public.conversations for insert to authenticated
  with check (auth.uid() = created_by);

-- Members can read all member rows of conversations they belong to
drop policy if exists "members read members of their conversations" on public.conversation_members;
create policy "members read members of their conversations"
  on public.conversation_members for select to authenticated
  using (public.is_member(conversation_id));

-- Anyone authenticated can add member rows (used during group/DM creation)
drop policy if exists "auth users add members" on public.conversation_members;
create policy "auth users add members"
  on public.conversation_members for insert to authenticated
  with check (true);
```

If you've already deployed once and just need this conversations migration, run **only** the `-- Conversations + members` section.

### 4. Get a free Giphy API key

<https://developers.giphy.com/dashboard/> → Create App → "API". Copy the key.

### 5. Configure env vars

Copy `.env.local.example` → `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_GIPHY_API_KEY=xxxxxxxxxxxx
```

### 6. Run locally

```bash
npm run dev
```

Open <http://localhost:3000>, sign up two accounts (different browsers / incognito works), and you're chatting.

---

## Deploy to Vercel

1. Push this folder to a GitHub repo.
2. Import the repo at <https://vercel.com/new>.
3. Add the three `NEXT_PUBLIC_*` env vars in the Vercel project settings.
4. Deploy. Done.

---

## Notes & limitations

- **Image size**: Images are resized to ≤800px and JPEG-compressed below ~180KB before broadcast. Supabase broadcast has a ~256KB payload cap.
- **Reliability**: Broadcast is best-effort. If you want guaranteed delivery, you'd need persistence (which defeats the ephemeral goal).
- **Single room**: Everyone joins `blues-clueless-room`. Change the `ROOM` constant in `lib/supabase.ts` to fork off private rooms.
- **No moderation**. Small trusted groups only.
